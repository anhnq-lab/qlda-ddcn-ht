-- ============================================================
-- Migration: Departments lookup table + refactor is_global_role()
-- Date: 2026-05-22
-- Issue: P0-6 from OPTIMIZATION_PLAN.md
--
-- Problem:
--   public.is_global_role() hard-codes a list of Vietnamese department
--   names (with em-dash characters). When a department is renamed or
--   added, every RLS-using table breaks silently. The 2026-05-20 RLS
--   migration further introduced a *second* hard-coded mapping with
--   inconsistent codes (KTCL vs KTTD, CSPC not in TS layer at all),
--   compounding the fragility.
--
-- Fix:
--   Introduce a single source of truth `departments` table with:
--     - code            stable short code (HCTH, KHDT, ...)
--     - name            canonical Vietnamese name
--     - name_aliases    array of legacy / em-dash variants that may
--                       appear in employees.department text column
--     - is_global_scope flag — set TRUE for departments that get
--                       cross-project visibility (Ban GD, HC, KH-DT,
--                       TC-KT, KT-TD, CS-PC, PTDV)
--   Refactor is_global_role() to JOIN this table instead of using
--   an IN list. Renaming a department is now a row update.
-- ============================================================

-- 1. ── Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
    code             TEXT PRIMARY KEY,
    name             TEXT NOT NULL UNIQUE,
    name_aliases     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_global_scope  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.departments IS 'Lookup table of departments. Source of truth for is_global_role() and other scope checks.';
COMMENT ON COLUMN public.departments.name_aliases IS 'Legacy / em-dash spelling variants that may still appear in employees.department.';
COMMENT ON COLUMN public.departments.is_global_scope IS 'TRUE => members of this department see data across all projects (Ban GD, HC, KH-DT, TC-KT, KT-TD, CS-PC, PTDV).';

-- Helper: match an employees.department text against either name or alias.
-- Used by the GIN index below so the JOIN in is_global_role() stays fast.
CREATE INDEX IF NOT EXISTS idx_departments_aliases
  ON public.departments USING GIN (name_aliases);

-- 2. ── Seed canonical rows + every known legacy spelling ────────
-- ON CONFLICT DO UPDATE so re-running this migration keeps the
-- table in sync with the seed values (idempotent).
INSERT INTO public.departments (code, name, name_aliases, is_global_scope, sort_order) VALUES
  -- Global-scope departments (cross-project visibility)
  ('BGD',  'Ban Giám đốc',
           ARRAY['Ban Giám đốc']::TEXT[],
           TRUE,  1),
  ('HCTH', 'Phòng Hành chính - Tổng hợp',
           ARRAY['Văn phòng', 'Phòng Hành chính – Tổng hợp']::TEXT[],
           TRUE,  2),
  ('KHDT', 'Phòng Kế hoạch - Đấu thầu',
           ARRAY['Phòng Kế hoạch – Đầu tư', 'Phòng Kế hoạch - Đầu tư']::TEXT[],
           TRUE,  3),
  ('TCKT', 'Phòng Tài chính - Kế toán',
           ARRAY['Phòng Tài chính – Kế toán']::TEXT[],
           TRUE,  4),
  ('KTTD', 'Phòng Kỹ thuật - Thẩm định',
           ARRAY['Phòng Kỹ thuật – Chất lượng', 'Phòng Kỹ thuật - Chất lượng']::TEXT[],
           TRUE,  5),
  ('CSPC', 'Phòng Chính sách - Pháp chế',
           ARRAY['Phòng Chính sách – Pháp chế']::TEXT[],
           TRUE,  6),
  ('PTDV', 'Phòng Phát triển dịch vụ',
           ARRAY['Trung tâm Dịch vụ tư vấn']::TEXT[],
           TRUE,  7),
  -- Project-scoped departments
  ('QLDA1','Phòng Quản lý dự án 1', ARRAY[]::TEXT[], FALSE, 8),
  ('QLDA2','Phòng Quản lý dự án 2', ARRAY[]::TEXT[], FALSE, 9),
  ('QLDA3','Phòng Quản lý dự án 3', ARRAY[]::TEXT[], FALSE, 10)
ON CONFLICT (code) DO UPDATE SET
  name            = EXCLUDED.name,
  name_aliases    = EXCLUDED.name_aliases,
  is_global_scope = EXCLUDED.is_global_scope,
  sort_order      = EXCLUDED.sort_order,
  updated_at      = NOW();

-- 3. ── RLS for the departments table itself ─────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Drop any prior policies (idempotent re-run)
DO $$
DECLARE pname TEXT;
BEGIN
  FOR pname IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = 'departments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.departments', pname);
  END LOOP;
END $$;

-- Everyone authenticated may READ the lookup (needed by RLS helpers + UI dropdowns)
CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated USING (TRUE);

-- Only admins may write
CREATE POLICY "departments_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "departments_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "departments_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4. ── Refactor is_global_role() to use the lookup ──────────────
-- The function stays SECURITY DEFINER STABLE so the JOIN runs as the
-- function owner and skips its own RLS — same posture as before, just
-- swapping the IN list for a table lookup.
CREATE OR REPLACE FUNCTION public.is_global_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM employees e
    JOIN user_accounts ua ON ua.employee_id = e.employee_id
    LEFT JOIN public.departments d
      ON  d.is_active
      AND (
            e.department = d.name
        OR  e.department = ANY (d.name_aliases)
      )
    WHERE ua.auth_user_id = auth.uid()
      AND (
            e.role IN ('Admin', 'Director', 'DeputyDirector')
        OR  COALESCE(d.is_global_scope, FALSE) = TRUE
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_global_role()
IS 'Returns TRUE when the caller is Admin/Director/DeputyDirector OR belongs to a department flagged is_global_scope in public.departments. Department list is data-driven, no hard-coded names.';

-- 5. ── Bonus helper: resolve an employees.department text to a code ──
-- Useful for the 2026-05-20 RLS policies that did inline CASE mapping.
CREATE OR REPLACE FUNCTION public.get_current_employee_department_code()
RETURNS TEXT AS $$
  SELECT d.code
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  LEFT JOIN public.departments d
    ON  d.is_active
    AND (
          e.department = d.name
      OR  e.department = ANY (d.name_aliases)
    )
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_employee_department_code()
IS 'Returns the canonical department code (HCTH, KHDT, ...) for the caller, mapping legacy text-only employees.department values via departments.name_aliases.';

-- 6. ── Sanity check (optional, comment out for prod) ────────────
-- DO $$
-- DECLARE r RECORD;
-- BEGIN
--   FOR r IN SELECT code, name, is_global_scope FROM public.departments ORDER BY sort_order
--   LOOP
--     RAISE NOTICE 'dept %  %  global=%', r.code, r.name, r.is_global_scope;
--   END LOOP;
-- END $$;

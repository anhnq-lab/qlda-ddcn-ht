-- ============================================================
-- Migration: 20260528100001_p0_auth_security_fixes.sql
-- P0 Security Fixes (ref: authorization review 2026-05-28)
--
-- 1. get_user_profile_by_auth_id — thêm system_role, status, join_date
--    cho employee; thêm full_name, email, phone cho contractor;
--    trả allowed_project_ids trực tiếp (bỏ extra query từ client)
-- 2. departments — thêm 'Ban Điều hành dự án 1-5' và các alias variants
--    để khớp với PROJECT_SCOPED_DEPARTMENTS trong TypeScript layer
-- 3. audit_logs INSERT — tighten từ WITH CHECK (true) sang chỉ allow
--    authenticated users và chỉ khi changed_by = auth.uid()::text.
--    Pre-auth LOGIN_FAILED phải được log từ server-side Edge Function.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Patch RPC get_user_profile_by_auth_id
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_profile_by_auth_id(p_auth_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  -- ── Employee ──────────────────────────────────────────────
  SELECT json_build_object(
    'user_type',    'employee',
    'account_id',   ua.account_id,
    'employee_id',  ua.employee_id,
    'username',     ua.username,
    'is_active',    ua.is_active,
    'full_name',    e.full_name,
    'email',        e.email,
    'phone',        e.phone,
    'department',   e.department,
    'role',         e.role,
    'position',     e.position,
    'avatar_url',   e.avatar_url,
    -- Fields added in P0 fix (previously missing)
    'system_role',  e.system_role,
    'status',       e.status,
    'join_date',    e.join_date
  ) INTO v_result
  FROM public.user_accounts ua
  JOIN public.employees e ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = p_auth_user_id
    AND ua.is_active = true;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- ── Contractor ────────────────────────────────────────────
  -- Join with contractors table to get proper display_name/email/phone.
  -- Falls back to ca.display_name if contractors row not found.
  SELECT json_build_object(
    'user_type',            'contractor',
    'account_id',           ca.account_id,
    'contractor_id',        ca.contractor_id,
    'username',             ca.username,
    -- full_name: prefer contractors.contractor_name, fallback to display_name
    'full_name',            COALESCE(c.contractor_name, ca.display_name),
    'display_name',         ca.display_name,
    'email',                COALESCE(c.email, ''),
    'phone',                COALESCE(c.phone, ''),
    'is_active',            ca.is_active,
    -- allowed_project_ids returned here — client no longer needs extra query
    'allowed_project_ids',  COALESCE(ca.allowed_project_ids, ARRAY[]::TEXT[])
  ) INTO v_result
  FROM public.contractor_accounts ca
  LEFT JOIN public.contractors c ON c.contractor_id = ca.contractor_id
  WHERE ca.auth_user_id = p_auth_user_id
    AND ca.is_active = true;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_user_profile_by_auth_id(UUID)
IS 'Returns employee or contractor profile for given auth user ID. '
   'Employee: includes system_role, status, join_date. '
   'Contractor: includes full_name, email, phone, allowed_project_ids. '
   'Updated: 2026-05-28 P0 fix.';


-- ─────────────────────────────────────────────────────────────
-- 2. Fix departments table: add 'Ban Điều hành dự án 1-5'
--    These names are what TypeScript PROJECT_SCOPED_DEPARTMENTS uses.
--    Existing 'Phòng Quản lý dự án' rows get name_aliases for both spellings.
-- ─────────────────────────────────────────────────────────────

-- Update existing QLDA1-3 rows to carry 'Ban Điều hành dự án' as aliases
UPDATE public.departments SET
  name_aliases = ARRAY[
    'Phòng Quản lý dự án 1',
    'Ban Điều hành dự án 1',
    'Ban ĐHDA 1'
  ]::TEXT[],
  updated_at = NOW()
WHERE code = 'QLDA1';

UPDATE public.departments SET
  name_aliases = ARRAY[
    'Phòng Quản lý dự án 2',
    'Ban Điều hành dự án 2',
    'Ban ĐHDA 2'
  ]::TEXT[],
  updated_at = NOW()
WHERE code = 'QLDA2';

UPDATE public.departments SET
  name_aliases = ARRAY[
    'Phòng Quản lý dự án 3',
    'Ban Điều hành dự án 3',
    'Ban ĐHDA 3'
  ]::TEXT[],
  updated_at = NOW()
WHERE code = 'QLDA3';

-- Insert QLDA4 and QLDA5 (were missing from the 2026-05-22 migration)
INSERT INTO public.departments (code, name, name_aliases, is_global_scope, sort_order) VALUES
  ('QLDA4', 'Phòng Quản lý dự án 4',
    ARRAY['Ban Điều hành dự án 4', 'Ban ĐHDA 4']::TEXT[],
    FALSE, 11),
  ('QLDA5', 'Phòng Quản lý dự án 5',
    ARRAY['Ban Điều hành dự án 5', 'Ban ĐHDA 5']::TEXT[],
    FALSE, 12)
ON CONFLICT (code) DO UPDATE SET
  name_aliases    = EXCLUDED.name_aliases,
  is_global_scope = EXCLUDED.is_global_scope,
  sort_order      = EXCLUDED.sort_order,
  updated_at      = NOW();

-- Verify: show updated rows (runs only in dev, safe in prod)
-- DO $$ BEGIN
--   RAISE NOTICE 'Departments after patch: %', (
--     SELECT json_agg(json_build_object('code', code, 'name', name, 'aliases', name_aliases, 'global', is_global_scope))
--     FROM public.departments ORDER BY sort_order
--   );
-- END $$;


-- ─────────────────────────────────────────────────────────────
-- 3. Tighten audit_logs INSERT policy
--    OLD: WITH CHECK (true)  — anyone could spoof changed_by
--    NEW: require authenticated session and changed_by = caller's uid
--    Pre-auth events (LOGIN_FAILED before sign-in) must NOT be logged
--    from the client — use a dedicated server-side Edge Function instead.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- changed_by must match the authenticated caller's uid
    changed_by = auth.uid()::TEXT
  );

COMMENT ON POLICY "audit_logs_insert" ON public.audit_logs
IS 'Authenticated users may only insert rows where changed_by = their own auth.uid(). '
   'Pre-auth events (LOGIN_FAILED before sign-in) must be logged via server-side Edge Function. '
   'Applied: 2026-05-28 P0 fix.';

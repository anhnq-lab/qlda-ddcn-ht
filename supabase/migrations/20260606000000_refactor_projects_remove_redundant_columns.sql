-- =============================================================================
-- Migration: Tái cấu trúc bảng projects — Xóa cột trùng lặp & không dùng
-- Date: 2026-06-06
-- Description:
--   1. Tạo bảng project_approvals (gộp 19 cột phê duyệt/giấy phép)
--   2. Migrate dữ liệu phê duyệt từ projects → project_approvals
--   3. Migrate dữ liệu policy_decision từ projects → investment_policy_decisions
--   4. Tạo RPC get_project_computed_stats thay thế cached columns
--   5. Xóa 40 cột không cần thiết trên bảng projects
--   6. Xóa trigger fn_sync_project_capital_stats (không cần nữa)
-- =============================================================================

-- =====================================================================
-- STEP 1: Tạo bảng project_approvals
-- Gộp 7 loại phê duyệt × (number + date + agency) = 19 cột → 1 bảng
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.project_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'planning',             -- Quy hoạch
    'pccc',                 -- Phòng cháy chữa cháy
    'environment',          -- Môi trường
    'appraisal',            -- Thẩm định dự án
    'design_appraisal',     -- Thẩm tra thiết kế
    'design_approval',      -- Phê duyệt thiết kế
    'construction_permit'   -- Giấy phép xây dựng
  )),
  document_number TEXT,           -- Số văn bản
  document_date   DATE,           -- Ngày ban hành
  agency          TEXT,           -- Cơ quan/Cấp ban hành
  extra_info      TEXT,           -- Thông tin bổ sung (vd: env_approval_type)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, approval_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_project_approvals_project_id
  ON public.project_approvals(project_id);

-- RLS
ALTER TABLE public.project_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pa_select" ON public.project_approvals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pa_insert" ON public.project_approvals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "pa_update" ON public.project_approvals
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pa_delete" ON public.project_approvals
  FOR DELETE TO authenticated USING (true);

-- =====================================================================
-- STEP 2: Migrate dữ liệu phê duyệt từ projects → project_approvals
-- =====================================================================

-- 2a. Quy hoạch (planning)
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency)
SELECT project_id, 'planning', planning_approval_number, planning_approval_date::DATE, NULL
FROM public.projects
WHERE planning_approval_number IS NOT NULL OR planning_approval_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- 2b. PCCC
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency)
SELECT project_id, 'pccc', pccc_approval_number, pccc_approval_date::DATE, pccc_approval_agency
FROM public.projects
WHERE pccc_approval_number IS NOT NULL OR pccc_approval_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- 2c. Môi trường (environment)
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency, extra_info)
SELECT project_id, 'environment', env_approval_number, env_approval_date::DATE, NULL, env_approval_type
FROM public.projects
WHERE env_approval_number IS NOT NULL OR env_approval_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- 2d. Thẩm định dự án (appraisal)
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency)
SELECT project_id, 'appraisal', appraisal_result_number, appraisal_result_date::DATE, appraisal_agency
FROM public.projects
WHERE appraisal_result_number IS NOT NULL OR appraisal_result_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- 2e. Thẩm tra thiết kế (design_appraisal)
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency)
SELECT project_id, 'design_appraisal', design_appraisal_number, design_appraisal_date::DATE, NULL
FROM public.projects
WHERE design_appraisal_number IS NOT NULL OR design_appraisal_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- 2f. Phê duyệt thiết kế (design_approval)
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency)
SELECT project_id, 'design_approval', design_approval_number, design_approval_date::DATE, design_approval_authority
FROM public.projects
WHERE design_approval_number IS NOT NULL OR design_approval_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- 2g. Giấy phép xây dựng (construction_permit)
INSERT INTO public.project_approvals (project_id, approval_type, document_number, document_date, agency)
SELECT project_id, 'construction_permit', construction_permit_number, construction_permit_date::DATE, construction_permit_agency
FROM public.projects
WHERE construction_permit_number IS NOT NULL OR construction_permit_date IS NOT NULL
ON CONFLICT (project_id, approval_type) DO NOTHING;

-- =====================================================================
-- STEP 3: Migrate dữ liệu policy_decision → investment_policy_decisions
-- Chỉ migrate nếu chưa có dữ liệu tương ứng trong investment_policy_decisions
-- =====================================================================
INSERT INTO public.investment_policy_decisions (project_id, decision_number, decision_date, authority)
SELECT
  p.project_id,
  p.policy_decision_number,
  p.policy_decision_date::DATE,
  p.policy_decision_authority
FROM public.projects p
WHERE p.policy_decision_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.investment_policy_decisions ipd
    WHERE ipd.project_id = p.project_id
  );

-- =====================================================================
-- STEP 4: Tạo RPC thay thế cho cached columns
-- Thay thế khv_info, implementation_tracking, progress, payment_progress
-- =====================================================================

-- 4a. RPC: Tính capital + disbursement stats cho 1 hoặc tất cả dự án
CREATE OR REPLACE FUNCTION public.get_project_computed_stats(p_project_id TEXT DEFAULT NULL)
RETURNS TABLE (
  project_id TEXT,
  khv_total NUMERIC,
  total_disbursed NUMERIC,
  disbursement_rate NUMERIC,
  physical_progress NUMERIC,
  payment_progress NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Tổng KHV từ capital_plans
  capital AS (
    SELECT
      cp.project_id,
      COALESCE(SUM(cp.amount), 0) AS khv_total
    FROM public.capital_plans cp
    WHERE (p_project_id IS NULL OR cp.project_id = p_project_id)
    GROUP BY cp.project_id
  ),
  -- Tổng giải ngân từ disbursements
  disb AS (
    SELECT
      d.project_id,
      COALESCE(SUM(d.amount), 0) AS total_disbursed
    FROM public.disbursements d
    WHERE (p_project_id IS NULL OR d.project_id = p_project_id)
      AND (LOWER(d.status) IN ('approved', 'completed', 'success'))
    GROUP BY d.project_id
  ),
  -- Fallback: lấy disbursed_amount từ capital_plans nếu chưa có disbursement chi tiết
  disb_fallback AS (
    SELECT
      cp.project_id,
      COALESCE(SUM(cp.disbursed_amount), 0) AS total_disbursed_fallback
    FROM public.capital_plans cp
    WHERE (p_project_id IS NULL OR cp.project_id = p_project_id)
    GROUP BY cp.project_id
  ),
  -- Tiến độ xây dựng từ construction_progress (weighted average)
  progress AS (
    SELECT
      cpg.project_id,
      CASE
        WHEN COALESCE(SUM(cpg.weight_percent), 0) > 0
        THEN CAST(
          SUM(cpg.weight_percent * cpg.actual_percent) / SUM(cpg.weight_percent)
          AS NUMERIC(5,2)
        )
        ELSE 0.0
      END AS physical_progress
    FROM public.construction_progress cpg
    WHERE (p_project_id IS NULL OR cpg.project_id = p_project_id)
    GROUP BY cpg.project_id
  )
  SELECT
    p.project_id,
    COALESCE(c.khv_total, 0) AS khv_total,
    CASE
      WHEN COALESCE(d.total_disbursed, 0) > 0 THEN d.total_disbursed
      ELSE COALESCE(df.total_disbursed_fallback, 0)
    END AS total_disbursed,
    CASE
      WHEN COALESCE(c.khv_total, 0) > 0
      THEN CAST(
        (CASE WHEN COALESCE(d.total_disbursed, 0) > 0 THEN d.total_disbursed ELSE COALESCE(df.total_disbursed_fallback, 0) END)
        / c.khv_total * 100
        AS NUMERIC(5,2)
      )
      ELSE 0.0
    END AS disbursement_rate,
    COALESCE(pg.physical_progress, 0) AS physical_progress,
    CASE
      WHEN COALESCE(c.khv_total, 0) > 0
      THEN CAST(
        (CASE WHEN COALESCE(d.total_disbursed, 0) > 0 THEN d.total_disbursed ELSE COALESCE(df.total_disbursed_fallback, 0) END)
        / c.khv_total * 100
        AS NUMERIC(5,2)
      )
      ELSE 0.0
    END AS payment_progress
  FROM public.projects p
  LEFT JOIN capital c ON c.project_id = p.project_id
  LEFT JOIN disb d ON d.project_id = p.project_id
  LEFT JOIN disb_fallback df ON df.project_id = p.project_id
  LEFT JOIN progress pg ON pg.project_id = p.project_id
  WHERE (p_project_id IS NULL OR p.project_id = p_project_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_computed_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_computed_stats(TEXT) TO service_role;

-- =====================================================================
-- STEP 5: Xóa triggers & function cũ (fn_sync_project_capital_stats)
-- Không cần nữa vì không còn cached columns để sync
-- =====================================================================
DROP TRIGGER IF EXISTS trg_sync_project_capital_on_plan ON public.capital_plans;
DROP TRIGGER IF EXISTS trg_sync_project_capital_on_disb ON public.disbursements;
DROP FUNCTION IF EXISTS public.fn_sync_project_capital_stats();

-- =====================================================================
-- STEP 6: Xóa các cột không cần thiết khỏi bảng projects
-- Tổng: 40 cột
-- =====================================================================
ALTER TABLE public.projects

  -- ── Nhóm A: Orphaned — không dùng trong UI, mapper-only hoặc hoàn toàn orphaned (12 cột) ──
  DROP COLUMN IF EXISTS decision_maker_id,            -- Có bug, không dùng
  DROP COLUMN IF EXISTS is_synced,                    -- Hoàn toàn orphaned
  DROP COLUMN IF EXISTS last_sync_date,               -- Hoàn toàn orphaned
  DROP COLUMN IF EXISTS sync_error,                   -- Hoàn toàn orphaned
  DROP COLUMN IF EXISTS version,                      -- Mapped nhưng không hiển thị
  DROP COLUMN IF EXISTS cde_project_code,             -- Mapped nhưng không hiển thị
  DROP COLUMN IF EXISTS tt24_completion_pct,           -- Nên tính realtime
  DROP COLUMN IF EXISTS actual_start_date_construction, -- Không có UI
  DROP COLUMN IF EXISTS insurance_contract,           -- Không có UI
  DROP COLUMN IF EXISTS insurance_value,              -- Không có UI
  DROP COLUMN IF EXISTS acceptance_result,            -- Không có UI
  DROP COLUMN IF EXISTS acceptance_date,              -- Không có UI (chỉ raw query)

  -- ── Nhóm D: Cached/Computed — user yêu cầu xóa, tính realtime (5 cột) ──
  DROP COLUMN IF EXISTS khv_info,                     -- Cached từ capital_plans
  DROP COLUMN IF EXISTS implementation_tracking,       -- Cached từ disbursements
  DROP COLUMN IF EXISTS progress,                     -- Tính từ construction_progress
  DROP COLUMN IF EXISTS payment_progress,             -- Tính từ disbursements
  DROP COLUMN IF EXISTS budget_allocations,           -- Trùng capital_plans

  -- ── Nhóm B: Trùng 100% với investment_policy_decisions (4 cột) ──
  DROP COLUMN IF EXISTS policy_decision_level,
  DROP COLUMN IF EXISTS policy_decision_number,
  DROP COLUMN IF EXISTS policy_decision_date,
  DROP COLUMN IF EXISTS policy_decision_authority,

  -- ── Nhóm C: Đã chuyển sang project_approvals (19 cột) ──
  DROP COLUMN IF EXISTS planning_approval_number,
  DROP COLUMN IF EXISTS planning_approval_date,
  DROP COLUMN IF EXISTS pccc_approval_number,
  DROP COLUMN IF EXISTS pccc_approval_date,
  DROP COLUMN IF EXISTS pccc_approval_agency,
  DROP COLUMN IF EXISTS env_approval_number,
  DROP COLUMN IF EXISTS env_approval_date,
  DROP COLUMN IF EXISTS env_approval_type,
  DROP COLUMN IF EXISTS appraisal_result_number,
  DROP COLUMN IF EXISTS appraisal_result_date,
  DROP COLUMN IF EXISTS appraisal_agency,
  DROP COLUMN IF EXISTS design_appraisal_number,
  DROP COLUMN IF EXISTS design_appraisal_date,
  DROP COLUMN IF EXISTS design_approval_number,
  DROP COLUMN IF EXISTS design_approval_date,
  DROP COLUMN IF EXISTS design_approval_authority,
  DROP COLUMN IF EXISTS construction_permit_number,
  DROP COLUMN IF EXISTS construction_permit_date,
  DROP COLUMN IF EXISTS construction_permit_agency;

-- =====================================================================
-- STEP 7: Cập nhật Views phụ thuộc (nếu có reference đến cột đã xóa)
-- Các views hiện tại (cde_project_stats_view, monthly_report_view,
-- cde_items_view) không reference trực tiếp các cột đã xóa → OK
-- =====================================================================

-- Done!

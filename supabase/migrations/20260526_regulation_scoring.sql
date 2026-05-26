-- Migration: Create regulation scoring schema and calculations
-- Date: 2026-05-26

-- ═══════════════════════════════════════════════════════
-- Bảng điểm Phòng ban hàng tháng (Quy chế KHCV)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS department_monthly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code TEXT NOT NULL,
  eval_month INT NOT NULL CHECK (eval_month BETWEEN 1 AND 12),
  eval_year INT NOT NULL,

  -- ══ Nhóm A: Kết quả hoàn thành CV ══
  -- A1: Tỷ lệ hoàn thành (AUTO từ tasks)
  a1_total_tasks INT DEFAULT 0,
  a1_done_tasks INT DEFAULT 0,
  a1_completion_rate NUMERIC(5,2) DEFAULT 0,
  a1_score NUMERIC(4,1) DEFAULT 0,          -- max 20

  -- A2: Chất lượng kết quả (MANUAL - LĐ chấm)
  a2_score NUMERIC(4,1) DEFAULT 0,          -- max 10
  a2_notes TEXT,

  -- A3: Tỷ lệ đúng hạn (AUTO từ tasks)
  a3_on_time_done INT DEFAULT 0,
  a3_total_done INT DEFAULT 0,
  a3_on_time_rate NUMERIC(5,2) DEFAULT 0,
  a3_score NUMERIC(4,1) DEFAULT 0,          -- max 10

  -- ══ Nhóm B: Kết quả giải ngân ══
  b1_disbursement_rate NUMERIC(5,2) DEFAULT 0,
  b1_score NUMERIC(4,1) DEFAULT 0,          -- max 25
  b2_target_rate NUMERIC(5,2) DEFAULT 0,
  b2_score NUMERIC(4,1) DEFAULT 0,          -- max 15

  -- ══ Nhóm C: Tiêu chí chung ══
  c1_score NUMERIC(4,1) DEFAULT 0,          -- max 10: tuân thủ quy chế
  c1_notes TEXT,
  c2_score NUMERIC(4,1) DEFAULT 0,          -- max 10: sáng kiến
  c2_notes TEXT,

  -- ══ Computed ══
  is_disbursement_dept BOOLEAN DEFAULT TRUE,
  group_a_total NUMERIC(5,2) DEFAULT 0,
  group_b_total NUMERIC(5,2) DEFAULT 0,
  group_c_total NUMERIC(5,2) DEFAULT 0,
  total_score NUMERIC(5,2) DEFAULT 0,
  classification TEXT CHECK (classification IN (
    'xuat_sac','tot','hoan_thanh','khong_hoan_thanh'
  )),

  -- ══ Workflow ══
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','calculated','reviewed','approved'
  )),
  calculated_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department_code, eval_month, eval_year)
);

-- ═══════════════════════════════════════════════════════
-- Bảng điểm Cá nhân hàng tháng
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS individual_monthly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES public.employees(employee_id),
  department_code TEXT NOT NULL,
  eval_month INT NOT NULL CHECK (eval_month BETWEEN 1 AND 12),
  eval_year INT NOT NULL,

  -- ══ Nhóm A: Kết quả CV cá nhân ══
  a1_total_tasks INT DEFAULT 0,
  a1_done_tasks INT DEFAULT 0,
  a1_completion_rate NUMERIC(5,2) DEFAULT 0,
  a1_score NUMERIC(4,1) DEFAULT 0,          -- max 20

  a2_score NUMERIC(4,1) DEFAULT 0,          -- max 10 (TP chấm)
  a2_notes TEXT,

  a3_on_time_done INT DEFAULT 0,
  a3_total_done INT DEFAULT 0,
  a3_on_time_rate NUMERIC(5,2) DEFAULT 0,
  a3_score NUMERIC(4,1) DEFAULT 0,          -- max 10

  -- ══ Nhóm B: Đóng góp giải ngân cá nhân ══
  has_projects BOOLEAN DEFAULT FALSE,
  b1_weighted_rate NUMERIC(5,2) DEFAULT 0,  -- Bình quân gia quyền
  b1_score NUMERIC(4,1) DEFAULT 0,          -- max 20
  b2_score NUMERIC(4,1) DEFAULT 0,          -- max 10 (gián tiếp)
  b2_notes TEXT,

  -- ══ Nhóm C: Phẩm chất chung ══
  c1_score NUMERIC(4,1) DEFAULT 0,          -- max 10: đạo đức, kỷ luật
  c1_notes TEXT,
  c2_score NUMERIC(4,1) DEFAULT 0,          -- max 10: tuân thủ PM
  c2_notes TEXT,
  c3_score NUMERIC(4,1) DEFAULT 0,          -- max 10: sáng kiến
  c3_notes TEXT,

  -- ══ Computed ══
  is_disbursement_staff BOOLEAN DEFAULT TRUE,
  group_a_total NUMERIC(5,2) DEFAULT 0,
  group_b_total NUMERIC(5,2) DEFAULT 0,
  group_c_total NUMERIC(5,2) DEFAULT 0,
  total_score NUMERIC(5,2) DEFAULT 0,
  classification TEXT CHECK (classification IN (
    'xuat_sac','tot','hoan_thanh','khong_hoan_thanh'
  )),

  -- ══ Workflow ══
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','calculated','reviewed','approved'
  )),
  scored_by TEXT,
  scored_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, eval_month, eval_year)
);

-- ═══════════════════════════════════════════════════════
-- Chi tiết giải ngân cá nhân theo dự án
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS individual_project_disbursement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID REFERENCES individual_monthly_scores(id) ON DELETE CASCADE,
  project_id UUID,
  project_name TEXT,
  capital_plan NUMERIC DEFAULT 0,
  disbursed NUMERIC DEFAULT 0,
  rate NUMERIC(5,2) DEFAULT 0,
  weight NUMERIC(5,4) DEFAULT 0
);

-- ═══════════════════════════════════════════════════════
-- RPC: Auto-calculate A scores from tasks
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calc_regulation_a_scores(
  p_entity_type TEXT,   -- 'department' or 'individual'
  p_entity_id TEXT,     -- department_code or employee_id
  p_month INT,
  p_year INT
) RETURNS JSONB AS $$
DECLARE
  v_total INT; v_done INT; v_on_time_done INT;
  v_comp_rate NUMERIC; v_ontime_rate NUMERIC;
  v_a1 NUMERIC; v_a3 NUMERIC;
BEGIN
  IF p_entity_type = 'department' THEN
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE t.status = 'done'),
           COUNT(*) FILTER (WHERE t.status = 'done' AND t.actual_end_date <= t.due_date)
    INTO v_total, v_done, v_on_time_done
    FROM tasks t
    JOIN employees e ON t.assignee_id = e.employee_id
    WHERE e.department = p_entity_id
      AND EXTRACT(MONTH FROM t.due_date) = p_month
      AND EXTRACT(YEAR FROM t.due_date) = p_year;
  ELSE
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE status = 'done'),
           COUNT(*) FILTER (WHERE status = 'done' AND actual_end_date <= due_date)
    INTO v_total, v_done, v_on_time_done
    FROM tasks
    WHERE assignee_id = p_entity_id
      AND EXTRACT(MONTH FROM due_date) = p_month
      AND EXTRACT(YEAR FROM due_date) = p_year;
  END IF;

  v_comp_rate := CASE WHEN v_total > 0 THEN ROUND((v_done::NUMERIC / v_total) * 100, 2) ELSE 0 END;
  v_ontime_rate := CASE WHEN v_done > 0 THEN ROUND((v_on_time_done::NUMERIC / v_done) * 100, 2) ELSE 0 END;

  -- A1 formula (Điều 17)
  v_a1 := CASE
    WHEN v_comp_rate >= 95 THEN 20.0
    WHEN v_comp_rate >= 80 THEN 16.0
    WHEN v_comp_rate >= 60 THEN 12.0
    WHEN v_comp_rate >= 40 THEN 8.0
    ELSE 4.0 END;

  -- A3 formula (Điều 17)
  v_a3 := CASE
    WHEN v_ontime_rate >= 90 THEN 10.0
    WHEN v_ontime_rate >= 70 THEN 7.0
    WHEN v_ontime_rate >= 50 THEN 5.0
    ELSE 3.0 END;

  RETURN jsonb_build_object(
    'total_tasks', v_total, 'done_tasks', v_done,
    'completion_rate', v_comp_rate, 'a1_score', v_a1,
    'on_time_done', v_on_time_done, 'on_time_rate', v_ontime_rate,
    'a3_score', v_a3
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════
-- Indexes & RLS
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_dept_scores_lookup ON department_monthly_scores(department_code, eval_year, eval_month);
CREATE INDEX IF NOT EXISTS idx_indiv_scores_lookup ON individual_monthly_scores(employee_id, eval_year, eval_month);
CREATE INDEX IF NOT EXISTS idx_indiv_scores_dept ON individual_monthly_scores(department_code, eval_year, eval_month);

ALTER TABLE department_monthly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_monthly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_project_disbursement ENABLE ROW LEVEL SECURITY;

-- Policies: Director/Admin = full, Manager = own dept, Staff = view all or own
DROP POLICY IF EXISTS "dept_scores_select" ON department_monthly_scores;
CREATE POLICY "dept_scores_select" ON department_monthly_scores FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "dept_scores_insert" ON department_monthly_scores;
CREATE POLICY "dept_scores_insert" ON department_monthly_scores FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "dept_scores_update" ON department_monthly_scores;
CREATE POLICY "dept_scores_update" ON department_monthly_scores FOR UPDATE USING (TRUE);

DROP POLICY IF EXISTS "indiv_scores_select" ON individual_monthly_scores;
CREATE POLICY "indiv_scores_select" ON individual_monthly_scores FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "indiv_scores_modify" ON individual_monthly_scores;
CREATE POLICY "indiv_scores_modify" ON individual_monthly_scores FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "indiv_proj_disb_select" ON individual_project_disbursement;
CREATE POLICY "indiv_proj_disb_select" ON individual_project_disbursement FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "indiv_proj_disb_modify" ON individual_project_disbursement;
CREATE POLICY "indiv_proj_disb_modify" ON individual_project_disbursement FOR ALL USING (TRUE);

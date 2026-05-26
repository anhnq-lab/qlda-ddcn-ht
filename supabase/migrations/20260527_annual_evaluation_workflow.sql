-- Migration: Create annual evaluation workflow and compliance tables
-- Date: 2026-05-27

-- ═══════════════════════════════════════════════════════
-- Bảng Đánh giá Năm (Theo Quy chế KHCV)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.annual_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('department','individual')),
  entity_id TEXT NOT NULL,
  eval_year INT NOT NULL,

  -- Aggregated from monthly scores
  monthly_scores JSONB,                 -- [{month: 1, score: 85}, ...]
  monthly_avg NUMERIC(5,2),
  quarterly_scores JSONB,               -- [{quarter: 1, avg: 85}, ...]

  -- Annual B & C (Cá nhân tự đánh giá / chấm điểm năm)
  annual_b_score NUMERIC(5,2),
  annual_c_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  classification TEXT,
  classification_conditions JSONB,     -- Các điều kiện phụ đạt được

  -- 4-step workflow (Điều 19.2)
  current_step TEXT DEFAULT 'self_eval' CHECK (current_step IN (
    'self_eval','dept_meeting','head_proposal','leadership_final'
  )),
  
  -- Bước 1: Cá nhân tự đánh giá
  self_eval_data JSONB,                 -- { score: 85, notes: "...", self_class: "tot" }
  
  -- Bước 2: Họp bình xét phòng
  dept_meeting_date DATE,
  dept_meeting_notes TEXT,
  
  -- Bước 3: Trưởng phòng đề xuất
  head_proposed_class TEXT CHECK (head_proposed_class IN ('xuat_sac','tot','hoan_thanh','khong_hoan_thanh')),
  head_proposal_notes TEXT,
  
  -- Bước 4: Lãnh đạo phê duyệt chung
  leadership_final_class TEXT CHECK (leadership_final_class IN ('xuat_sac','tot','hoan_thanh','khong_hoan_thanh')),
  leadership_notes TEXT,
  
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id, eval_year)
);

-- ═══════════════════════════════════════════════════════
-- Bảng Ghi nhận Tuân thủ Cập nhật Tiến độ Tuần
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.update_compliance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT REFERENCES public.employees(employee_id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  has_updated BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ,
  UNIQUE(employee_id, week_start)
);

-- ═══════════════════════════════════════════════════════
-- Indexes & RLS
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_annual_evals_lookup ON public.annual_evaluations(entity_type, entity_id, eval_year);
CREATE INDEX IF NOT EXISTS idx_update_compliance_lookup ON public.update_compliance_log(employee_id, week_start);

ALTER TABLE public.annual_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_compliance_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "annual_evals_select" ON public.annual_evaluations;
CREATE POLICY "annual_evals_select" ON public.annual_evaluations FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "annual_evals_modify" ON public.annual_evaluations;
CREATE POLICY "annual_evals_modify" ON public.annual_evaluations FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "update_compliance_log_select" ON public.update_compliance_log;
CREATE POLICY "update_compliance_log_select" ON public.update_compliance_log FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "update_compliance_log_modify" ON public.update_compliance_log;
CREATE POLICY "update_compliance_log_modify" ON public.update_compliance_log FOR ALL USING (TRUE);

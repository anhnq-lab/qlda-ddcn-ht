-- Migration: Add regulation-specific fields to public.tasks table
-- Date: 2026-05-26

ALTER TABLE public.tasks
  -- Điều 20.1: Phân loại lý do chưa HT (khách quan/chủ quan)
  ADD COLUMN IF NOT EXISTS incomplete_reason_type TEXT CHECK (incomplete_reason_type IN ('objective', 'subjective')),
  
  -- Điều 9.3: CV tự đề xuất
  ADD COLUMN IF NOT EXISTS is_self_proposed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS proposal_status TEXT CHECK (proposal_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS proposal_approved_by TEXT REFERENCES public.employees(employee_id),
  ADD COLUMN IF NOT EXISTS proposal_approved_at TIMESTAMPTZ,
  
  -- Điều 17: Cấp thực hiện (cá nhân hay tập thể phòng)
  ADD COLUMN IF NOT EXISTS responsibility_level TEXT DEFAULT 'individual' CHECK (responsibility_level IN ('individual', 'team'));

-- Bổ sung Index hỗ trợ filter
CREATE INDEX IF NOT EXISTS idx_tasks_proposal ON public.tasks(proposal_status) WHERE is_self_proposed = TRUE;

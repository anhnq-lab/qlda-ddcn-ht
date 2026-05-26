-- Migration: Add approval columns to annual_plan_items and monthly_plans
-- Date: 2026-05-26

-- Annual plan approval columns
ALTER TABLE public.annual_plan_items 
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft','submitted','approved','rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by TEXT REFERENCES public.employees(employee_id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT REFERENCES public.employees(employee_id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- Monthly plan/report approval columns
ALTER TABLE public.monthly_plans 
  ADD COLUMN IF NOT EXISTS report_status TEXT DEFAULT 'open' CHECK (report_status IN ('open','finalized','approved')),
  ADD COLUMN IF NOT EXISTS finalized_by TEXT REFERENCES public.employees(employee_id),
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_approved_by TEXT REFERENCES public.employees(employee_id),
  ADD COLUMN IF NOT EXISTS report_approved_at TIMESTAMPTZ;

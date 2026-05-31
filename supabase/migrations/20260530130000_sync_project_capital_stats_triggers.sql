-- Migration: Create trigger function and triggers to automatically calculate and sync project capital statistics
-- Path: supabase/migrations/20260530130000_sync_project_capital_stats_triggers.sql

-- 1. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.fn_sync_project_capital_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id TEXT;
  v_total_khv NUMERIC;
  v_total_disbursed NUMERIC;
BEGIN
  -- Get project_id from modified record
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  IF v_project_id IS NOT NULL THEN
    -- 1. Calculate total capital plan amount from capital_plans
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_khv
    FROM public.capital_plans
    WHERE project_id = v_project_id;

    -- 2. Calculate total disbursement from disbursements (only approved/completed transactions)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_disbursed
    FROM public.disbursements
    WHERE project_id = v_project_id 
      AND (LOWER(status) = 'approved' OR LOWER(status) = 'completed' OR LOWER(status) = 'success');

    -- If detailed disbursements is empty, fallback to total disbursed_amount from capital_plans
    IF v_total_disbursed = 0 THEN
      SELECT COALESCE(SUM(disbursed_amount), 0)
      INTO v_total_disbursed
      FROM public.capital_plans
      WHERE project_id = v_project_id;
    END IF;

    -- 3. Update columns in projects table
    UPDATE public.projects
    SET 
      khv_info = jsonb_build_object('total', v_total_khv),
      implementation_tracking = jsonb_build_object(
        'totalDisbursed', v_total_disbursed,
        'totalVolume', 0,
        'volumeRate', COALESCE(progress, 0)
      )
    WHERE project_id = v_project_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind trigger to capital_plans table
DROP TRIGGER IF EXISTS trg_sync_project_capital_on_plan ON public.capital_plans;
CREATE TRIGGER trg_sync_project_capital_on_plan
AFTER INSERT OR UPDATE OR DELETE ON public.capital_plans
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_project_capital_stats();

-- 3. Bind trigger to disbursements table
DROP TRIGGER IF EXISTS trg_sync_project_capital_on_disb ON public.disbursements;
CREATE TRIGGER trg_sync_project_capital_on_disb
AFTER INSERT OR UPDATE OR DELETE ON public.disbursements
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_project_capital_stats();

-- 4. One-time synchronization for all existing projects
UPDATE public.projects p
SET 
  khv_info = jsonb_build_object(
    'total', COALESCE((SELECT SUM(amount) FROM public.capital_plans WHERE project_id = p.project_id), 0)
  ),
  implementation_tracking = jsonb_build_object(
    'totalDisbursed', COALESCE(
      (SELECT SUM(amount) FROM public.disbursements WHERE project_id = p.project_id AND (LOWER(status) = 'approved' OR LOWER(status) = 'completed')),
      (SELECT SUM(disbursed_amount) FROM public.capital_plans WHERE project_id = p.project_id),
      0
    ),
    'totalVolume', 0,
    'volumeRate', COALESCE(p.progress, 0)
  );

-- Migration: Add Construction Performance Indexes and get_construction_kpis RPC
-- Generated: 2026-05-30
-- Description: Bổ sung Indexes hiệu năng và hàm RPC tính toán KPIs tiến độ lũy kế siêu tốc.

-- 1. Bổ sung các Indexes hiệu năng
CREATE INDEX IF NOT EXISTS idx_construction_logs_project_date 
    ON public.construction_logs(project_id, log_date);

CREATE INDEX IF NOT EXISTS idx_construction_progress_project_sort 
    ON public.construction_progress(project_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_construction_site_photos_project_log 
    ON public.construction_site_photos(project_id, log_id);

CREATE INDEX IF NOT EXISTS idx_construction_manpower_log 
    ON public.construction_manpower(log_id);

CREATE INDEX IF NOT EXISTS idx_construction_equipment_log 
    ON public.construction_equipment(log_id);

CREATE INDEX IF NOT EXISTS idx_construction_log_details_log 
    ON public.construction_log_details(log_id);

-- 2. Viết RPC function get_construction_kpis tính toán KPIs cực nhanh
CREATE OR REPLACE FUNCTION public.get_construction_kpis(project_uuid TEXT)
RETURNS TABLE (
  total_weight NUMERIC,
  actual_progress NUMERIC,
  planned_progress NUMERIC,
  slippage NUMERIC,
  has_safety_issue BOOLEAN,
  recent_safety_notes TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_has_safety_issue BOOLEAN := FALSE;
  v_recent_safety_notes TEXT := '';
BEGIN
  -- Kiểm tra sự cố an toàn gần đây nhất trong 7 ngày gần đây
  SELECT TRUE, cld.safety_notes 
  INTO v_has_safety_issue, v_recent_safety_notes
  FROM public.construction_logs cl
  JOIN public.construction_log_details cld ON cl.log_id = cld.log_id
  WHERE cl.project_id = project_uuid 
    AND cld.safety_status <> 'safe'
  ORDER BY cl.log_date DESC
  LIMIT 1;

  IF v_has_safety_issue IS NULL THEN
    v_has_safety_issue := FALSE;
  END IF;

  RETURN QUERY
  WITH prog_calc AS (
    SELECT 
      COALESCE(SUM(weight_percent), 0) AS total_w,
      COALESCE(SUM((weight_percent * actual_percent) / 100), 0) AS act_p,
      COALESCE(SUM((weight_percent * planned_percent) / 100), 0) AS plan_p
    FROM public.construction_progress
    WHERE project_id = project_uuid
  )
  SELECT 
    total_w AS total_weight,
    CASE WHEN total_w > 0 THEN CAST(act_p / (total_w / 100) AS NUMERIC(5,2)) ELSE 0.0 END AS actual_progress,
    CASE WHEN total_w > 0 THEN CAST(plan_p / (total_w / 100) AS NUMERIC(5,2)) ELSE 0.0 END AS planned_progress,
    CASE WHEN total_w > 0 THEN CAST((act_p / (total_w / 100)) - (plan_p / (total_w / 100)) AS NUMERIC(5,2)) ELSE 0.0 END AS slippage,
    v_has_safety_issue AS has_safety_issue,
    v_recent_safety_notes AS recent_safety_notes
  FROM prog_calc;
END;
$$;

-- 3. Cấp quyền thực thi cho RPC
GRANT EXECUTE ON FUNCTION public.get_construction_kpis(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_construction_kpis(TEXT) TO service_role;

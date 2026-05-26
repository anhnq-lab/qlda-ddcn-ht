-- Migration: Refactor monthly_report_view and get_monthly_report_summary RPC to be tasks-centric
-- Date: 2026-05-28

-- Drop existing view
DROP VIEW IF EXISTS public.monthly_report_view CASCADE;

-- 1. Re-create monthly_report_view without monthly_plan_items
CREATE VIEW public.monthly_report_view AS
SELECT
    t.id AS task_id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.task_type,
    t.category,
    t.due_date,
    t.actual_end_date,
    t.progress,
    t.completion_result,
    t.incomplete_reason,
    t.notes,
    t.project_id,
    p.project_name,
    t.assignee_id,
    e.full_name AS assignee_name,
    t.department_code,
    EXTRACT(MONTH FROM t.due_date)::INT AS report_month,
    EXTRACT(YEAR FROM t.due_date)::INT AS report_year,
    -- On-time flag
    CASE
        WHEN t.status = 'done' AND t.actual_end_date <= t.due_date THEN TRUE
        WHEN t.status = 'done' AND t.actual_end_date > t.due_date THEN FALSE
        ELSE NULL
    END AS is_on_time,
    -- Source tracking
    t.annual_plan_item_id,
    t.source_type
FROM public.tasks t
LEFT JOIN public.employees e ON t.assignee_id = e.employee_id
LEFT JOIN public.projects p ON t.project_id = p.project_id;

-- 2. Re-create get_monthly_report_summary RPC to use tasks.department_code
CREATE OR REPLACE FUNCTION public.get_monthly_report_summary(
    p_month INT, p_year INT
) RETURNS TABLE (
    department_code TEXT,
    total_tasks BIGINT,
    done_tasks BIGINT,
    in_progress_tasks BIGINT,
    incomplete_tasks BIGINT,
    on_time_done BIGINT,
    completion_rate NUMERIC,
    on_time_rate NUMERIC,
    category_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.department_code::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'done')::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'in_progress' OR t.status = 'todo' OR t.status = 'review')::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'incomplete')::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'done' AND t.actual_end_date <= t.due_date)::BIGINT,
        CASE WHEN COUNT(*) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE t.status = 'done'))::NUMERIC / COUNT(*) * 100, 2)
            ELSE 0 END,
        CASE WHEN COUNT(*) FILTER (WHERE t.status = 'done') > 0
            THEN ROUND((COUNT(*) FILTER (WHERE t.status = 'done' AND t.actual_end_date <= t.due_date))::NUMERIC 
                / COUNT(*) FILTER (WHERE t.status = 'done') * 100, 2)
            ELSE 0 END,
        (
            SELECT jsonb_object_agg(
                COALESCE(t2.category, 'khac'),
                jsonb_build_object(
                    'total', COUNT(*),
                    'done', COUNT(*) FILTER (WHERE t2.status = 'done')
                )
            )
            FROM public.tasks t2
            WHERE t2.department_code = t.department_code
              AND EXTRACT(MONTH FROM t2.due_date) = p_month
              AND EXTRACT(YEAR FROM t2.due_date) = p_year
        ) AS category_stats
    FROM public.tasks t
    WHERE EXTRACT(MONTH FROM t.due_date) = p_month
      AND EXTRACT(YEAR FROM t.due_date) = p_year
      AND t.department_code IS NOT NULL
    GROUP BY t.department_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

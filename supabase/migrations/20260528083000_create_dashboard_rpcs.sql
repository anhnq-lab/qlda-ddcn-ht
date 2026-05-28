-- Create RPC functions for Dashboard Optimization
-- Created: 2026-05-28

-- 1. get_director_dashboard_data
CREATE OR REPLACE FUNCTION public.get_director_dashboard_data(p_year integer, p_month integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today timestamptz := now();
  v_start_date text := p_year::text || '-' || lpad(p_month::text, 2, '0') || '-01';
  v_end_date text := (p_year::text || '-' || lpad(p_month::text, 2, '0') || '-' || lpad((date_part('days', (p_year::text || '-' || lpad(p_month::text, 2, '0') || '-01')::date + interval '1 month' - interval '1 day')::integer)::text, 2, '0'));
  
  v_total_projects bigint;
  v_total_investment numeric;
  v_yearly_planned numeric;
  v_yearly_disbursed numeric;
  v_overdue_tasks bigint;
  v_open_issues bigint;
  
  v_capital_by_board json;
  v_task_completion json;
  v_dept_kpis json;
BEGIN
  -- Overview Metrics
  SELECT count(*), coalesce(sum(total_investment), 0)
  INTO v_total_projects, v_total_investment
  FROM public.projects;

  SELECT coalesce(sum(amount), 0)
  INTO v_yearly_planned
  FROM public.capital_plans
  WHERE year = p_year;

  SELECT coalesce(sum(amount), 0)
  INTO v_yearly_disbursed
  FROM public.disbursements
  WHERE date >= (p_year::text || '-01-01')::date 
    AND date <= (p_year::text || '-12-31')::date;
  
  IF v_yearly_disbursed = 0 THEN
    SELECT coalesce(sum(disbursed_amount), 0)
    INTO v_yearly_disbursed
    FROM public.capital_plans
    WHERE year = p_year;
  END IF;

  SELECT count(*)
  INTO v_overdue_tasks
  FROM public.tasks
  WHERE status != 'done' AND due_date < v_today::date;

  SELECT count(*)
  INTO v_open_issues
  FROM public.package_issues
  WHERE status = 'Open';

  -- Capital vs Disbursement by Board
  WITH board_data AS (
    SELECT 
      b.id as board_val,
      b.label as name,
      b.hex as color,
      coalesce(sum(cp.amount), 0) as planned,
      coalesce(sum(
        CASE 
          WHEN EXISTS(SELECT 1 FROM public.disbursements d WHERE d.project_id = cp.project_id AND d.date >= (p_year::text || '-01-01')::date AND d.date <= (p_year::text || '-12-31')::date)
          THEN (SELECT sum(amount) FROM public.disbursements d WHERE d.project_id = cp.project_id AND d.date >= (p_year::text || '-01-01')::date AND d.date <= (p_year::text || '-12-31')::date)
          ELSE cp.disbursed_amount
        END
      ), 0) as actual
    FROM (
      VALUES 
        (1, 'Ban QLDA 1', '#3b82f6'),
        (2, 'Ban QLDA 2', '#10b981'),
        (3, 'Ban QLDA 3', '#f59e0b'),
        (4, 'Ban PTDV', '#8b5cf6')
    ) b(id, label, hex)
    LEFT JOIN public.projects p ON p.management_board = b.id
    LEFT JOIN public.capital_plans cp ON cp.project_id = p.project_id AND cp.year = p_year
    GROUP BY b.id, b.label, b.hex
  )
  SELECT json_agg(
    json_build_object(
      'name', name,
      'planned', round((planned / 1e9)::numeric, 1),
      'actual', round((actual / 1e9)::numeric, 1),
      'rate', CASE WHEN planned > 0 THEN round((actual / planned) * 100) ELSE 0 END,
      'color', color
    )
  ) INTO v_capital_by_board
  FROM board_data;

  -- Task Completion Stats
  SELECT json_build_object(
    'done', count(CASE WHEN status = 'done' THEN 1 END),
    'inProgress', count(CASE WHEN status = 'in_progress' THEN 1 END),
    'todo', count(CASE WHEN status = 'todo' THEN 1 END),
    'overdue', count(CASE WHEN status != 'done' AND due_date < v_today::date THEN 1 END),
    'total', count(*)
  ) INTO v_task_completion
  FROM public.tasks
  WHERE parent_id IS NULL;

  -- Dept KPIs
  WITH dept_tasks AS (
    SELECT 
      department_code,
      count(*) as total,
      count(CASE WHEN status = 'done' THEN 1 END) as completed
    FROM public.tasks
    WHERE due_date >= v_start_date::date AND due_date <= v_end_date::date AND parent_id IS NULL
    GROUP BY department_code
  ),
  dept_list AS (
    SELECT DISTINCT department_code, department_name
    FROM public.monthly_plans
    WHERE plan_month = p_month AND plan_year = p_year
  )
  SELECT json_agg(
    json_build_object(
      'code', dl.department_code,
      'name', coalesce(dl.department_name, dl.department_code),
      'total', coalesce(dt.total, 0),
      'completed', coalesce(dt.completed, 0),
      'rate', CASE WHEN coalesce(dt.total, 0) > 0 THEN round((coalesce(dt.completed, 0)::numeric / dt.total) * 100) ELSE 0 END
    )
  ) INTO v_dept_kpis
  FROM dept_list dl
  LEFT JOIN dept_tasks dt ON dt.department_code = dl.department_code;

  RETURN json_build_object(
    'overview_metrics', json_build_object(
      'totalProjects', v_total_projects,
      'totalInvestment', v_total_investment,
      'yearlyPlanned', v_yearly_planned,
      'yearlyDisbursed', v_yearly_disbursed,
      'yearlyDisbursementRate', CASE WHEN v_yearly_planned > 0 THEN round((v_yearly_disbursed / v_yearly_planned) * 100, 1) ELSE 0 END,
      'riskCount', v_overdue_tasks + v_open_issues
    ),
    'capital_by_board', v_capital_by_board,
    'task_completion', v_task_completion,
    'dept_kpis', coalesce(v_dept_kpis, '[]'::json)
  );
END;
$$;


-- 2. get_department_dashboard
CREATE OR REPLACE FUNCTION public.get_department_dashboard(p_dept_code text, p_employee_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dept_name text;
  v_dept_member_ids uuid[];
  v_dept_employees json;
  v_monthly_plan_items json;
  v_current_month integer := date_part('month', now())::integer;
  v_current_year integer := date_part('year', now())::integer;
  v_start_date text := v_current_year::text || '-' || lpad(v_current_month::text, 2, '0') || '-01';
  v_end_date text := (v_current_year::text || '-' || lpad(v_current_month::text, 2, '0') || '-' || lpad((date_part('days', (v_current_year::text || '-' || lpad(v_current_month::text, 2, '0') || '-01')::date + interval '1 month' - interval '1 day')::integer)::text, 2, '0'));
BEGIN
  -- Get department name from employee_id
  SELECT department INTO v_dept_name 
  FROM public.employees 
  WHERE employee_id = p_employee_id;

  -- Agg dept member IDs
  SELECT array_agg(employee_id) INTO v_dept_member_ids
  FROM public.employees
  WHERE department = v_dept_name AND status = 1;

  -- Dept Employees
  SELECT json_agg(
    json_build_object(
      'employee_id', employee_id,
      'full_name', full_name,
      'position', position,
      'role', role,
      'avatar_url', avatar_url,
      'status', status
    )
  ) INTO v_dept_employees
  FROM public.employees
  WHERE department = v_dept_name AND status = 1
  ORDER BY position;

  -- Monthly Plan Items
  SELECT json_agg(
    json_build_object(
      'id', t.id,
      'task_name', t.title,
      'status', CASE WHEN t.status = 'done' THEN 'completed' WHEN t.status = 'in_progress' THEN 'partial' WHEN t.status = 'incomplete' THEN 'incomplete' ELSE 'planned' END,
      'staff_id', t.assignee_id,
      'staff_name', e.full_name,
      'due_date', t.due_date
    )
  ) INTO v_monthly_plan_items
  FROM public.tasks t
  LEFT JOIN public.employees e ON e.employee_id = t.assignee_id
  WHERE t.department_code = p_dept_code
    AND t.due_date >= v_start_date::date
    AND t.due_date <= v_end_date::date
  ORDER BY t.sort_order;

  RETURN json_build_object(
    'dept_employees', coalesce(v_dept_employees, '[]'::json),
    'monthly_plan_items', coalesce(v_monthly_plan_items, '[]'::json),
    'dept_member_ids', coalesce(to_json(v_dept_member_ids), '[]'::json)
  );
END;
$$;

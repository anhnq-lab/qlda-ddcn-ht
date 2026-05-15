-- MIGRATION: Tạo RPC lấy thống kê dashboard
-- Tính toán thống kê an toàn và tối ưu thay vì tải toàn bộ dữ liệu xuống Frontend

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_employee_id text, p_department text, p_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_projects integer;
    v_total_tasks integer;
    v_in_progress_tasks integer;
    v_done_tasks integer;
    v_overdue_tasks integer;
    v_result json;
BEGIN
    -- Nếu là lãnh đạo ban hoặc admin, có thể đếm toàn bộ
    -- Tuy nhiên, nếu lãnh đạo (ví dụ Phó Giám đốc) được phân công quản lý phòng dự án (VD: Phòng QLDA 3), thì không cho phép đếm toàn bộ.
    IF p_role IN ('super_admin') OR (p_role IN ('director', 'deputy_director', 'chief_accountant') AND NOT (p_department ILIKE '%Quản lý dự án%' OR p_department ILIKE '%Điều hành dự án%')) THEN
        SELECT COUNT(*) INTO v_total_projects FROM public.projects;
        SELECT COUNT(*) INTO v_total_tasks FROM public.tasks;
        SELECT COUNT(*) INTO v_in_progress_tasks FROM public.tasks WHERE status = 'In Progress';
        SELECT COUNT(*) INTO v_done_tasks FROM public.tasks WHERE status = 'Done';
        SELECT COUNT(*) INTO v_overdue_tasks FROM public.tasks WHERE status != 'Done' AND due_date < CURRENT_DATE;
    
    -- Nếu là cấp phòng ban (hoặc Lãnh đạo được phân công phụ trách phòng dự án)
    ELSIF p_role IN ('dept_head', 'deputy_head') OR (p_role IN ('director', 'deputy_director', 'chief_accountant') AND (p_department ILIKE '%Quản lý dự án%' OR p_department ILIKE '%Điều hành dự án%' OR p_department ILIKE '%Phát triển dịch vụ%')) THEN
        DECLARE
            v_board_id integer := NULL;
        BEGIN
            IF p_department ILIKE '%Quản lý dự án 1%' THEN v_board_id := 1;
            ELSIF p_department ILIKE '%Quản lý dự án 2%' THEN v_board_id := 2;
            ELSIF p_department ILIKE '%Quản lý dự án 3%' THEN v_board_id := 3;
            ELSIF p_department ILIKE '%Phát triển dịch vụ%' THEN v_board_id := 4;
            END IF;

            IF v_board_id IS NOT NULL THEN
                -- Đếm các dự án có management_board = v_board_id hoặc có thành viên thuộc phòng ban
                SELECT COUNT(DISTINCT p.id) INTO v_total_projects
                FROM public.projects p
                WHERE p.management_board = v_board_id 
                   OR p.members ?| ARRAY(SELECT employee_id FROM public.employees WHERE department = p_department);
            ELSE
                -- Đếm các dự án có thành viên thuộc phòng ban
                SELECT COUNT(DISTINCT p.id) INTO v_total_projects
                FROM public.projects p
                WHERE p.members ?| ARRAY(SELECT employee_id FROM public.employees WHERE department = p_department);
            END IF;
        END;

        -- Task của phòng ban
        SELECT COUNT(*) INTO v_total_tasks FROM public.tasks WHERE assignee_id IN (SELECT employee_id FROM public.employees WHERE department = p_department);
        SELECT COUNT(*) INTO v_in_progress_tasks FROM public.tasks WHERE status = 'In Progress' AND assignee_id IN (SELECT employee_id FROM public.employees WHERE department = p_department);
        SELECT COUNT(*) INTO v_done_tasks FROM public.tasks WHERE status = 'Done' AND assignee_id IN (SELECT employee_id FROM public.employees WHERE department = p_department);
        SELECT COUNT(*) INTO v_overdue_tasks FROM public.tasks WHERE status != 'Done' AND due_date < CURRENT_DATE AND assignee_id IN (SELECT employee_id FROM public.employees WHERE department = p_department);

    -- Nếu là chuyên viên/nhân viên
    ELSE
        -- Đếm các dự án có bản thân
        SELECT COUNT(*) INTO v_total_projects
        FROM public.projects p
        WHERE p.members ? p_employee_id;

        -- Task của bản thân
        SELECT COUNT(*) INTO v_total_tasks FROM public.tasks WHERE assignee_id = p_employee_id;
        SELECT COUNT(*) INTO v_in_progress_tasks FROM public.tasks WHERE status = 'In Progress' AND assignee_id = p_employee_id;
        SELECT COUNT(*) INTO v_done_tasks FROM public.tasks WHERE status = 'Done' AND assignee_id = p_employee_id;
        SELECT COUNT(*) INTO v_overdue_tasks FROM public.tasks WHERE status != 'Done' AND due_date < CURRENT_DATE AND assignee_id = p_employee_id;
    END IF;

    v_result := json_build_object(
        'total_projects', v_total_projects,
        'total_tasks', v_total_tasks,
        'in_progress_tasks', v_in_progress_tasks,
        'done_tasks', v_done_tasks,
        'overdue_tasks', v_overdue_tasks
    );

    RETURN v_result;
END;
$$;

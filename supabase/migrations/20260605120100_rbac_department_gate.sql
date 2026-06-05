-- ============================================================
-- Migration A2: Lớp 2 server-side — cổng giới hạn theo phòng ban
-- current_user_department + dept_rule_allows + mở rộng has_permission.
-- Date: 2026-06-05
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS TEXT AS $$
  SELECT e.department
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- TRUE nếu (resource,action) KHÔNG bị giới hạn phòng, hoặc người gọi là lãnh đạo
-- (toàn cục), hoặc phòng người gọi khớp allowed_departments (chuẩn hóa gạch ngang,
-- so 2 chiều substring để khớp canonical + alias).
CREATE OR REPLACE FUNCTION public.dept_rule_allows(p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_allowed TEXT[];
  v_dept TEXT;
  v_role TEXT;
BEGIN
  SELECT allowed_departments INTO v_allowed
  FROM public.department_permission_rules
  WHERE resource = p_resource AND action = p_action
  LIMIT 1;

  IF NOT FOUND THEN RETURN TRUE; END IF;             -- không có giới hạn

  v_role := public.current_system_role();
  IF v_role IN ('super_admin','director','deputy_director','chief_accountant') THEN
    RETURN TRUE;                                       -- lãnh đạo bypass Lớp 2
  END IF;

  v_dept := public.current_user_department();
  IF v_dept IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM unnest(v_allowed) a
    WHERE lower(regexp_replace(v_dept, '[–—-]', '-', 'g')) LIKE '%' || lower(regexp_replace(a, '[–—-]', '-', 'g')) || '%'
       OR lower(regexp_replace(a, '[–—-]', '-', 'g')) LIKE '%' || lower(regexp_replace(v_dept, '[–—-]', '-', 'g')) || '%'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- has_permission: thêm AND dept_rule_allows ở nhánh role_permission_defaults.
-- Nhánh super_admin & user_permissions (ghi đè cá nhân) GIỮ tuyệt đối — không qua Lớp 2.
CREATE OR REPLACE FUNCTION public.has_permission(p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  emp_id TEXT;
  v_role TEXT;
  up_actions TEXT[];
  rd_actions JSONB;
BEGIN
  SELECT e.employee_id, COALESCE(NULLIF(e.system_role,''), public._resolve_system_role(e.role, e.position))
    INTO emp_id, v_role
  FROM employees e JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid() LIMIT 1;

  IF emp_id IS NULL THEN RETURN TRUE; END IF;       -- nhà thầu / chưa liên kết
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;

  SELECT actions INTO up_actions FROM user_permissions
  WHERE user_id = emp_id AND resource = p_resource LIMIT 1;
  IF FOUND THEN RETURN p_action = ANY(up_actions); END IF;   -- ghi đè cá nhân: tuyệt đối

  SELECT actions INTO rd_actions FROM role_permission_defaults
  WHERE role = v_role AND resource = p_resource LIMIT 1;
  IF FOUND THEN
    RETURN (rd_actions ? p_action) AND public.dept_rule_allows(p_resource, p_action);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

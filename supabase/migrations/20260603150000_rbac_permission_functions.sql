-- ============================================================
-- Migration: Hàm RBAC server-side (C-1.1, C-1.3)
-- Date: 2026-06-03
--
-- _resolve_system_role  : mirror SQL của resolveSystemRole (TS, 2 tham số)
-- current_system_role   : SystemRole hiệu lực của người gọi (ưu tiên system_role)
-- has_permission        : kiểm tra quyền action (super_admin → user_permissions → role_permission_defaults → deny)
--
-- Đã verify: resolver khớp 100% logic TS cho toàn bộ nhân sự thực tế;
-- has_permission khớp ma trận DEFAULT_ROLE_PERMISSIONS qua đường auth thật.
-- ============================================================

CREATE OR REPLACE FUNCTION public._resolve_system_role(p_role TEXT, p_position TEXT)
RETURNS TEXT AS $$
DECLARE
  pos TEXT := lower(coalesce(p_position, ''));
  rol TEXT := coalesce(p_role, '');
BEGIN
  IF rol = 'Admin' OR pos LIKE '%quản trị%' THEN RETURN 'super_admin'; END IF;
  IF rol = 'Director' OR (pos LIKE '%giám đốc%' AND pos NOT LIKE '%phó%' AND pos NOT LIKE '%trung tâm%') THEN RETURN 'director'; END IF;
  IF rol = 'DeputyDirector' OR pos LIKE '%phó giám đốc%' OR pos LIKE '%phó gđ%' THEN RETURN 'deputy_director'; END IF;
  IF pos LIKE '%kế toán trưởng%' THEN RETURN 'chief_accountant'; END IF;
  IF pos LIKE '%giám đốc trung tâm%' THEN RETURN 'dept_head'; END IF;
  IF pos LIKE '%chánh văn phòng%' THEN RETURN 'dept_head'; END IF;
  IF pos LIKE '%trưởng phòng%' OR pos LIKE '%trưởng ban%' THEN RETURN 'dept_head'; END IF;
  IF pos LIKE '%phó phòng%' OR pos LIKE '%phó văn phòng%' OR pos LIKE '%phó ban%' THEN RETURN 'deputy_head'; END IF;
  IF pos LIKE '%chuyên viên%' OR pos LIKE '%kỹ sư%' OR pos LIKE '%thành viên%' THEN RETURN 'specialist'; END IF;
  IF pos LIKE '%nhân viên%' THEN RETURN 'staff'; END IF;
  IF pos LIKE '%nhà thầu%' OR rol = 'contractor' THEN RETURN 'contractor'; END IF;
  IF rol = 'Manager' THEN RETURN 'dept_head'; END IF;
  IF rol = 'Staff' THEN RETURN 'staff'; END IF;
  RETURN 'specialist';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.current_system_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    NULLIF(e.system_role, ''),
    public._resolve_system_role(e.role, e.position)
  )
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
  IF FOUND THEN RETURN p_action = ANY(up_actions); END IF;

  SELECT actions INTO rd_actions FROM role_permission_defaults
  WHERE role = v_role AND resource = p_resource LIMIT 1;
  IF FOUND THEN RETURN rd_actions ? p_action; END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- C-1.3: is_admin() công nhận cả system_role = 'super_admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    JOIN user_accounts ua ON ua.employee_id = e.employee_id
    WHERE ua.auth_user_id = auth.uid()
      AND (e.role = 'Admin' OR e.system_role = 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

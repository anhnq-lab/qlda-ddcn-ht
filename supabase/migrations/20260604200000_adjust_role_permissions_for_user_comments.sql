-- Migration: Điều chỉnh phân quyền theo Quy chế nhập liệu QLDA & các yêu cầu bổ sung
-- Date: 2026-06-04

-- 1. Thêm cột created_by vào bảng projects nếu chưa tồn tại
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Seed dữ liệu created_by cho các dự án hiện tại dựa trên project_members
UPDATE public.projects p
SET created_by = COALESCE(
  (
    SELECT ua.auth_user_id
    FROM public.project_members pm
    JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
    WHERE pm.project_id = p.project_id
    ORDER BY
      CASE pm.role
        WHEN 'Chuyên viên phụ trách' THEN 1
        WHEN 'Trưởng phòng phụ trách' THEN 2
        WHEN 'Giám đốc dự án' THEN 3
        ELSE 4
      END ASC,
      pm.joined_at ASC
    LIMIT 1
  ),
  '983aa0ed-7d53-4d11-8b53-9862fe986f64'::uuid -- Fallback admin id
)
WHERE p.created_by IS NULL;

-- 3. Cập nhật role_permission_defaults trong database
-- Hạ quyền của dept_head và deputy_head đối với dự án xuống chỉ còn Xem
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('dept_head', 'projects', '["view"]'::jsonb),
  ('deputy_head', 'projects', '["view"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- Cấp quyền Thêm/Sửa Quy chế cho các vai trò nhân sự (RLS sẽ chặn chỉ cho HCTH thực hiện)
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('dept_head', 'regulations', '["view", "create", "update"]'::jsonb),
  ('deputy_head', 'regulations', '["view", "create", "update"]'::jsonb),
  ('specialist', 'regulations', '["view", "create", "update"]'::jsonb),
  ('staff', 'regulations', '["view", "create", "update"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- Thu hồi quyền admin_accounts, admin_audit của Giám đốc, Phó Giám đốc, Kế toán trưởng
DELETE FROM public.role_permission_defaults 
WHERE role IN ('director', 'deputy_director', 'chief_accountant') 
  AND resource IN ('admin_accounts', 'admin_audit');

-- Hạ quyền payments và capital của chief_accountant về chỉ Xem
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('chief_accountant', 'payments', '["view"]'::jsonb),
  ('chief_accountant', 'capital', '["view"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- Đảm bảo staff chỉ được Xem projects
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('staff', 'projects', '["view"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();

-- Cấp quyền quản lý Nhân sự (create, update, delete) cho dept_head (RLS sẽ siết cho HCTH)
INSERT INTO public.role_permission_defaults (role, resource, actions) VALUES
  ('dept_head', 'employees', '["view", "create", "update", "delete"]'::jsonb)
ON CONFLICT (role, resource) DO UPDATE SET actions = EXCLUDED.actions, updated_at = now();


-- 4. Cập nhật các helper functions
-- a. get_current_deputy_managed_department_codes
CREATE OR REPLACE FUNCTION public.get_current_deputy_managed_department_codes()
RETURNS TEXT[] AS $$
  SELECT COALESCE(ARRAY_AGG(
    CASE la.board_number
      WHEN 1 THEN 'QLDA1'
      WHEN 2 THEN 'QLDA2'
      WHEN 3 THEN 'QLDA3'
      WHEN 4 THEN 'PTDV'
      ELSE 'UNKNOWN'
    END
  ), ARRAY[]::TEXT[])
  FROM unnest(public.get_current_deputy_managed_boards()) AS la(board_number);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_deputy_managed_department_codes()
IS 'Mảng mã phòng ban mà Phó Giám đốc hiện tại phụ trách.';

-- b. has_global_project_scope
CREATE OR REPLACE FUNCTION public.has_global_project_scope()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_dept_code TEXT;
  v_is_global_dept BOOLEAN;
BEGIN
  SELECT 
    COALESCE(NULLIF(e.system_role,''), public._resolve_system_role(e.role, e.position)),
    d.code,
    COALESCE(d.is_global_scope, FALSE)
  INTO v_role, v_dept_code, v_is_global_dept
  FROM public.employees e
  JOIN public.user_accounts ua ON ua.employee_id = e.employee_id
  LEFT JOIN public.departments d ON d.is_active AND (e.department = d.name OR e.department = ANY(d.name_aliases))
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_role IS NULL THEN RETURN FALSE; END IF;
  IF v_role = 'super_admin' OR v_role = 'director' OR v_role = 'chief_accountant' THEN RETURN TRUE; END IF;
  
  -- Trưởng/Phó phòng của phòng ban chức năng thì có global scope
  IF v_role IN ('dept_head', 'deputy_head') AND v_is_global_dept = TRUE THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- c. can_access_project
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT
    public.is_admin()
    OR public.has_global_project_scope()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = p_project_id
        AND public.current_user_board_number() IS NOT NULL
        AND p.management_board = public.current_user_board_number()
    )
    OR public.is_project_managed_by_current_deputy(p_project_id)
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
      WHERE pm.project_id = p_project_id
        AND ua.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.contractor_accounts ca
      WHERE ca.auth_user_id = auth.uid()
        AND p_project_id = ANY(ca.allowed_project_ids)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 5. Cập nhật các RLS chính sách của bảng projects
-- a. UPDATE
DROP POLICY IF EXISTS projects_update_perm ON public.projects;
CREATE POLICY projects_update_perm ON public.projects FOR UPDATE TO authenticated
  USING (
    public.can_access_project(project_id) AND (
      public.current_system_role() = 'super_admin'
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
        WHERE pm.project_id = projects.project_id
          AND ua.auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_permission('projects','update')
  );

-- b. INSERT
DROP POLICY IF EXISTS projects_insert_perm ON public.projects;
CREATE POLICY projects_insert_perm ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('projects','create') AND (
      public.current_system_role() = 'super_admin'
      OR (
        public.current_system_role() = 'specialist'
        AND public.get_current_employee_department_code() = 'KHDT'
      )
    )
  );


-- 6. Cập nhật các RLS chính sách của các bảng giải ngân, kế hoạch vốn, gói thầu
-- a. disbursements (giải ngân thực tế)
DROP POLICY IF EXISTS disbursements_insert_perm ON public.disbursements;
CREATE POLICY disbursements_insert_perm ON public.disbursements FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('capital', 'create') AND (
      public.current_system_role() = 'super_admin'
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
        WHERE pm.project_id = disbursements.project_id
          AND ua.auth_user_id = auth.uid()
          AND pm.role IN ('Kế toán dự án', 'Kế toán phụ trách')
      )
    )
  );

DROP POLICY IF EXISTS disbursements_update_perm ON public.disbursements;
CREATE POLICY disbursements_update_perm ON public.disbursements FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id))
  WITH CHECK (
    public.has_permission('capital', 'update') AND (
      public.current_system_role() = 'super_admin'
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
        WHERE pm.project_id = disbursements.project_id
          AND ua.auth_user_id = auth.uid()
          AND pm.role IN ('Kế toán dự án', 'Kế toán phụ trách')
      )
    )
  );

-- b. capital_plans (kế hoạch vốn)
DROP POLICY IF EXISTS capital_plans_insert_perm ON public.capital_plans;
CREATE POLICY capital_plans_insert_perm ON public.capital_plans FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('capital', 'create') AND (
      public.current_system_role() = 'super_admin'
      OR (
        public.current_system_role() = 'specialist'
        AND public.get_current_employee_department_code() = 'KHDT'
      )
    )
  );

DROP POLICY IF EXISTS capital_plans_update_perm ON public.capital_plans;
CREATE POLICY capital_plans_update_perm ON public.capital_plans FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id))
  WITH CHECK (
    public.has_permission('capital', 'update') AND (
      public.current_system_role() = 'super_admin'
      OR (
        public.current_system_role() = 'specialist'
        AND public.get_current_employee_department_code() = 'KHDT'
      )
    )
  );

-- c. bidding_packages (gói thầu)
DROP POLICY IF EXISTS bidding_packages_insert_perm ON public.bidding_packages;
CREATE POLICY bidding_packages_insert_perm ON public.bidding_packages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('bidding', 'create') AND (
      public.current_system_role() = 'super_admin'
      OR public.get_current_employee_department_code() = 'KHDT'
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
        WHERE pm.project_id = bidding_packages.project_id
          AND ua.auth_user_id = auth.uid()
          AND pm.role IN ('Chuyên viên phụ trách', 'Trưởng phòng phụ trách', 'Giám đốc dự án')
      )
    )
  );

DROP POLICY IF EXISTS bidding_packages_update_perm ON public.bidding_packages;
CREATE POLICY bidding_packages_update_perm ON public.bidding_packages FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id))
  WITH CHECK (
    public.has_permission('bidding', 'update') AND (
      public.current_system_role() = 'super_admin'
      OR public.get_current_employee_department_code() = 'KHDT'
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        JOIN public.user_accounts ua ON ua.employee_id = pm.employee_id
        WHERE pm.project_id = bidding_packages.project_id
          AND ua.auth_user_id = auth.uid()
          AND pm.role IN ('Chuyên viên phụ trách', 'Trưởng phòng phụ trách', 'Giám đốc dự án')
      )
    )
  );


-- 7. Cập nhật các RLS chính sách của bảng employees (nhân sự)
DROP POLICY IF EXISTS employees_insert_perm ON public.employees;
DROP POLICY IF EXISTS employees_update_perm ON public.employees;
DROP POLICY IF EXISTS employees_delete_perm ON public.employees;

CREATE POLICY employees_insert_perm ON public.employees FOR INSERT TO authenticated
  WITH CHECK (
    public.current_system_role() = 'super_admin'
    OR (
      public.current_system_role() = 'dept_head'
      AND public.get_current_employee_department_code() = 'HCTH'
    )
  );

CREATE POLICY employees_update_perm ON public.employees FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (
    public.current_system_role() = 'super_admin'
    OR employee_id = public.get_current_employee_id()
    OR (
      public.current_system_role() = 'dept_head'
      AND public.get_current_employee_department_code() = 'HCTH'
    )
  );

CREATE POLICY employees_delete_perm ON public.employees FOR DELETE TO authenticated
  USING (
    public.current_system_role() = 'super_admin'
    OR (
      public.current_system_role() = 'dept_head'
      AND public.get_current_employee_department_code() = 'HCTH'
    )
  );


-- 8. Cập nhật các RLS chính sách của bảng regulations (Quy chế)
DROP POLICY IF EXISTS regulations_insert_perm ON public.regulations;
DROP POLICY IF EXISTS regulations_update_perm ON public.regulations;

CREATE POLICY regulations_insert_perm ON public.regulations FOR INSERT TO authenticated
  WITH CHECK (
    public.current_system_role() = 'super_admin'
    OR public.get_current_employee_department_code() = 'HCTH'
  );

CREATE POLICY regulations_update_perm ON public.regulations FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (
    public.current_system_role() = 'super_admin'
    OR public.get_current_employee_department_code() = 'HCTH'
  );


-- 9. Cập nhật RLS chính sách của bảng tasks (Công việc)
DROP POLICY IF EXISTS tasks_select_scoped ON public.tasks;
CREATE POLICY tasks_select_scoped ON public.tasks FOR SELECT TO authenticated
  USING (
    public.current_system_role() = 'super_admin'
    OR public.current_system_role() = 'director'
    OR (
      public.current_system_role() = 'dept_head' 
      AND public.get_current_employee_department_code() = 'HCTH'
    )
    OR (
      public.current_system_role() = 'deputy_director'
      AND tasks.department_code = ANY(public.get_current_deputy_managed_department_codes())
    )
    OR tasks.department_code = public.get_current_employee_department_code()
    OR tasks.assignee_id = public.get_current_employee_id()
    OR tasks.created_by = auth.uid()
    OR (
      project_id IS NOT NULL AND public.can_access_project(project_id)
    )
  );

DROP POLICY IF EXISTS tasks_insert_perm ON public.tasks;
CREATE POLICY tasks_insert_perm ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('tasks','create') AND (
      public.current_system_role() = 'super_admin'
      OR public.current_system_role() = 'director'
      OR (
        public.current_system_role() = 'dept_head' 
        AND public.get_current_employee_department_code() = 'HCTH'
      )
      OR department_code = public.get_current_employee_department_code()
    )
  );

DROP POLICY IF EXISTS tasks_update_perm ON public.tasks;
CREATE POLICY tasks_update_perm ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.current_system_role() = 'super_admin'
    OR (
      public.has_permission('tasks','update') AND (
        created_by = auth.uid()
        OR assignee_id = public.get_current_employee_id()
        OR public.get_current_employee_id() = ANY(collaborator_ids)
      )
    )
  )
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS tasks_delete_perm ON public.tasks;
CREATE POLICY tasks_delete_perm ON public.tasks FOR DELETE TO authenticated
  USING (
    public.current_system_role() = 'super_admin'
    OR (
      public.has_permission('tasks', 'delete')
      AND public.current_system_role() = 'dept_head'
      AND department_code = public.get_current_employee_department_code()
    )
  );


-- 10. Cập nhật RLS chính sách của bảng task_comments (bình luận công việc)
DROP POLICY IF EXISTS "Enable all for task_comments" ON public.task_comments;
DROP POLICY IF EXISTS task_comments_select ON public.task_comments;
DROP POLICY IF EXISTS task_comments_insert ON public.task_comments;
DROP POLICY IF EXISTS task_comments_write ON public.task_comments;

CREATE POLICY task_comments_select ON public.task_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
    )
  );

CREATE POLICY task_comments_insert ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    public.current_system_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND (
          t.created_by = auth.uid()
          OR t.assignee_id = public.get_current_employee_id()
          OR public.get_current_employee_id() = ANY(t.collaborator_ids)
        )
    )
  );

CREATE POLICY task_comments_write ON public.task_comments FOR ALL TO authenticated
  USING (
    public.current_system_role() = 'super_admin'
    OR user_id = auth.uid()
  );

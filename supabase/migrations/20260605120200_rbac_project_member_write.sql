-- ============================================================
-- Migration A3: Lớp 3 — RLS ghi dự án theo thành viên/scope
--   - INSERT: has_permission('projects','create') (đã bị Lớp 2 siết về KH-ĐT)
--             + cho phép phòng chức năng (global scope) tạo ở mọi Ban.
--   - UPDATE: has_permission('projects','update') + chỉ thành viên dự án
--             (project_members) hoặc admin — theo tài liệu Mục 3.3.
--   (projects chưa có cột created_by → dùng membership làm tín hiệu phụ trách.)
-- Date: 2026-06-05
-- ============================================================

DROP POLICY IF EXISTS projects_insert_perm ON public.projects;
CREATE POLICY projects_insert_perm ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('projects','create') AND (
      public.is_admin()
      OR public.has_global_project_scope()
      OR management_board = public.current_user_board_number()
      OR management_board = ANY(public.get_current_deputy_managed_boards())
    )
  );

DROP POLICY IF EXISTS projects_update_perm ON public.projects;
CREATE POLICY projects_update_perm ON public.projects FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id))
  WITH CHECK (
    public.has_permission('projects','update') AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.project_id
          AND pm.employee_id = public.get_current_employee_id()
      )
    )
  );

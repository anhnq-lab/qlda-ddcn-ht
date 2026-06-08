-- ============================================================
-- Migration: Restrict project edit rights (projects FOR UPDATE)
-- Target: Specialist (chuyên viên) only allowed to edit projects they manage
-- Date: 2026-06-08
-- ============================================================

DROP POLICY IF EXISTS projects_update_perm ON public.projects;

CREATE POLICY projects_update_perm ON public.projects FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id))
  WITH CHECK (
    public.has_permission('projects','update') AND (
      public.is_admin()
      OR projects.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.project_id
          AND pm.employee_id = public.get_current_employee_id()
          AND pm.role IN ('Giám đốc dự án', 'Chuyên viên phụ trách', 'Trưởng phòng phụ trách')
      )
    )
  );

COMMENT ON POLICY projects_update_perm ON public.projects
IS 'Chỉ admin, người tạo dự án, hoặc thành viên có vai trò quản lý chính được sửa dự án.';

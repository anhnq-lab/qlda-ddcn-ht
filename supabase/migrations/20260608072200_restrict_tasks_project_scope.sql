-- Migration: Restrict tasks SELECT scope to own department for normal employees
-- Date: 2026-06-08
-- Description: Users in functional departments (like KTTD) who have global project scope should not see tasks of other departments.
-- This restricts tasks visibility to:
--   1. Super Admin
--   2. Director
--   3. HCTH Department Head (for consolidating weekly/monthly reports)
--   4. Deputy Director (for departments they manage)
--   5. Own department tasks
--   6. Assignee
--   7. Creator
--   8. Collaborator

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
    OR public.get_current_employee_id() = ANY(tasks.collaborator_ids)
  );

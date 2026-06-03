-- ============================================================
-- Migration: Row-scope RLS theo dự án (B-2)
-- Date: 2026-06-03
--
-- Kết hợp has_permission (action) + can_access_project (scope) cho 8 bảng.
-- Thay allow_all_* (true) → policy có scope. Verify: QLDA1 thấy 235 dự án,
-- HCTH/global thấy 751, QLDA1 UPDATE dự án board khác → 0 dòng.
-- ============================================================

DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM (VALUES
    ('contracts','contracts'),
    ('payments','payments'),
    ('bidding_packages','bidding'),
    ('capital_plans','capital'),
    ('disbursements','capital')
  ) AS t(tbl, res) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'allow_all_select_'||rec.tbl, rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_select_scoped', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_insert_perm', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_update_perm', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_delete_perm', rec.tbl);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_access_project(project_id))',
                   rec.tbl||'_select_scoped', rec.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_permission(%L,%L) AND public.can_access_project(project_id))',
                   rec.tbl||'_insert_perm', rec.tbl, rec.res, 'create');
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_access_project(project_id)) WITH CHECK (public.has_permission(%L,%L) AND public.can_access_project(project_id))',
                   rec.tbl||'_update_perm', rec.tbl, rec.res, 'update');
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_permission(%L,%L) AND public.can_access_project(project_id))',
                   rec.tbl||'_delete_perm', rec.tbl, rec.res, 'delete');
  END LOOP;
END $$;

-- projects (tự tham chiếu: check theo NEW.management_board)
DROP POLICY IF EXISTS allow_all_select_projects ON public.projects;
DROP POLICY IF EXISTS projects_select_scoped ON public.projects;
DROP POLICY IF EXISTS projects_insert_perm ON public.projects;
DROP POLICY IF EXISTS projects_update_perm ON public.projects;
DROP POLICY IF EXISTS projects_delete_perm ON public.projects;

CREATE POLICY projects_select_scoped ON public.projects FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));
CREATE POLICY projects_insert_perm ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('projects','create') AND (
    public.has_global_project_scope()
    OR management_board = public.current_user_board_number()
    OR management_board = ANY(public.get_current_deputy_managed_boards())
  ));
CREATE POLICY projects_update_perm ON public.projects FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id))
  WITH CHECK (public.has_permission('projects','update') AND (
    public.has_global_project_scope()
    OR management_board = public.current_user_board_number()
    OR management_board = ANY(public.get_current_deputy_managed_boards())
  ));
CREATE POLICY projects_delete_perm ON public.projects FOR DELETE TO authenticated
  USING (public.has_permission('projects','delete') AND public.can_access_project(project_id));

-- tasks (cho phép người được giao / người tạo)
DROP POLICY IF EXISTS tasks_select_open ON public.tasks;
DROP POLICY IF EXISTS tasks_select_scoped ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_perm ON public.tasks;
DROP POLICY IF EXISTS tasks_update_perm ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_perm ON public.tasks;

CREATE POLICY tasks_select_scoped ON public.tasks FOR SELECT TO authenticated
  USING (public.can_access_project(project_id)
         OR assignee_id = public.get_current_employee_id()
         OR created_by = auth.uid());
CREATE POLICY tasks_insert_perm ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('tasks','create') AND public.can_access_project(project_id));
CREATE POLICY tasks_update_perm ON public.tasks FOR UPDATE TO authenticated
  USING (public.can_access_project(project_id) OR assignee_id = public.get_current_employee_id())
  WITH CHECK (public.has_permission('tasks','update') AND (public.can_access_project(project_id) OR assignee_id = public.get_current_employee_id()));
CREATE POLICY tasks_delete_perm ON public.tasks FOR DELETE TO authenticated
  USING (public.has_permission('tasks','delete') AND public.can_access_project(project_id));

-- documents (hồ sơ không thuộc dự án: project_id IS NULL)
DROP POLICY IF EXISTS allow_all_select_documents ON public.documents;
DROP POLICY IF EXISTS documents_select_scoped ON public.documents;
DROP POLICY IF EXISTS documents_insert_perm ON public.documents;
DROP POLICY IF EXISTS documents_update_perm ON public.documents;
DROP POLICY IF EXISTS documents_delete_perm ON public.documents;

CREATE POLICY documents_select_scoped ON public.documents FOR SELECT TO authenticated
  USING (project_id IS NULL OR public.can_access_project(project_id));
CREATE POLICY documents_insert_perm ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('documents','create') AND (project_id IS NULL OR public.can_access_project(project_id)));
CREATE POLICY documents_update_perm ON public.documents FOR UPDATE TO authenticated
  USING (project_id IS NULL OR public.can_access_project(project_id))
  WITH CHECK (public.has_permission('documents','update') AND (project_id IS NULL OR public.can_access_project(project_id)));
CREATE POLICY documents_delete_perm ON public.documents FOR DELETE TO authenticated
  USING (public.has_permission('documents','delete') AND (project_id IS NULL OR public.can_access_project(project_id)));

-- ============================================================
-- Migration: Siết action-write bằng has_permission (C-1.1)
-- Date: 2026-06-03
--
-- Bối cảnh: DB này còn policy allow_all_* (= true) cho INSERT/UPDATE/DELETE
-- → mọi authenticated user ghi tự do. Thay 'true' → has_permission(resource,action).
-- CHỈ THẮT CHẶT (không nới lỏng). SELECT giữ nguyên (mở) — row-scope (B-2)
-- xử lý riêng sau khi đối soát project_members vs management_board.
-- ============================================================

DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM (VALUES
    ('projects','projects'),
    ('contracts','contracts'),
    ('payments','payments'),
    ('bidding_packages','bidding'),
    ('capital_plans','capital'),
    ('disbursements','capital'),
    ('documents','documents')
  ) AS t(tbl, res) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'allow_all_insert_'||rec.tbl, rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'allow_all_update_'||rec.tbl, rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'allow_all_delete_'||rec.tbl, rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_insert_perm', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_update_perm', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_delete_perm', rec.tbl);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_permission(%L, %L))',
                   rec.tbl||'_insert_perm', rec.tbl, rec.res, 'create');
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_permission(%L, %L)) WITH CHECK (public.has_permission(%L, %L))',
                   rec.tbl||'_update_perm', rec.tbl, rec.res, 'update', rec.res, 'update');
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_permission(%L, %L))',
                   rec.tbl||'_delete_perm', rec.tbl, rec.res, 'delete');
  END LOOP;
END $$;

-- tasks: policy gốc là FOR ALL 'Enable all for tasks' (phủ cả SELECT)
DROP POLICY IF EXISTS "Enable all for tasks" ON public.tasks;
DROP POLICY IF EXISTS tasks_select_open ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_perm ON public.tasks;
DROP POLICY IF EXISTS tasks_update_perm ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_perm ON public.tasks;

CREATE POLICY tasks_select_open ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY tasks_insert_perm ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.has_permission('tasks','create'));
CREATE POLICY tasks_update_perm ON public.tasks FOR UPDATE TO authenticated USING (public.has_permission('tasks','update')) WITH CHECK (public.has_permission('tasks','update'));
CREATE POLICY tasks_delete_perm ON public.tasks FOR DELETE TO authenticated USING (public.has_permission('tasks','delete'));

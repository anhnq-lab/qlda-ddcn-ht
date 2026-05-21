-- ============================================================
-- Migration: Fix Overly Permissive RLS Policies
-- Date: 2026-05-20
-- Description:
--   1. annual_plan_items  — replace USING(true) with role-based
--   2. monthly_plans      — replace USING(true) with role-based
--   3. monthly_plan_items — replace USING(true) with role-based
--   4. legal_documents    — fix admin policy referencing non-existent
--      column `can_manage` in user_permissions table
-- ============================================================

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  FIX 1: annual_plan_items                                   ║
-- ║  Was: FOR ALL USING(true) WITH CHECK(true)                  ║
-- ║  Now: role-based SELECT for all auth, write for global/admin║
-- ╚══════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "Enable all for annual_plan_items" ON annual_plan_items;

-- SELECT: all authenticated users can read plans (needed for cross-dept reporting)
CREATE POLICY "annual_plan_items_select" ON annual_plan_items
  FOR SELECT TO authenticated USING (true);

-- INSERT: global roles (Admin, Director, etc.) or employees in same department
CREATE POLICY "annual_plan_items_insert" ON annual_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_global_role()
    OR department_code = (
      SELECT COALESCE(
        -- Map department name → code for matching
        CASE e.department
          WHEN 'Văn phòng'                     THEN 'HCTH'
          WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
          WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
          WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
          WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
          WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
          ELSE e.department
        END, ''
      )
      FROM employees e
      JOIN user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- UPDATE: global roles or same department
CREATE POLICY "annual_plan_items_update" ON annual_plan_items
  FOR UPDATE TO authenticated
  USING (
    public.is_global_role()
    OR department_code = (
      SELECT COALESCE(
        CASE e.department
          WHEN 'Văn phòng'                     THEN 'HCTH'
          WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
          WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
          WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
          WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
          WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
          ELSE e.department
        END, ''
      )
      FROM employees e
      JOIN user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    public.is_global_role()
    OR department_code = (
      SELECT COALESCE(
        CASE e.department
          WHEN 'Văn phòng'                     THEN 'HCTH'
          WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
          WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
          WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
          WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
          WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
          ELSE e.department
        END, ''
      )
      FROM employees e
      JOIN user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- DELETE: admin only
CREATE POLICY "annual_plan_items_delete" ON annual_plan_items
  FOR DELETE TO authenticated USING (public.is_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  FIX 2: monthly_plans                                       ║
-- ║  Was: FOR ALL USING(true) WITH CHECK(true)                  ║
-- ╚══════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "Enable all for monthly_plans" ON monthly_plans;

-- SELECT: all authenticated can read (cross-dept visibility needed for reporting)
CREATE POLICY "monthly_plans_select" ON monthly_plans
  FOR SELECT TO authenticated USING (true);

-- INSERT: global roles or same department
CREATE POLICY "monthly_plans_insert" ON monthly_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_global_role()
    OR department_code = (
      SELECT COALESCE(
        CASE e.department
          WHEN 'Văn phòng'                     THEN 'HCTH'
          WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
          WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
          WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
          WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
          WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
          ELSE e.department
        END, ''
      )
      FROM employees e
      JOIN user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- UPDATE: global roles or same department
CREATE POLICY "monthly_plans_update" ON monthly_plans
  FOR UPDATE TO authenticated
  USING (
    public.is_global_role()
    OR department_code = (
      SELECT COALESCE(
        CASE e.department
          WHEN 'Văn phòng'                     THEN 'HCTH'
          WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
          WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
          WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
          WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
          WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
          ELSE e.department
        END, ''
      )
      FROM employees e
      JOIN user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    public.is_global_role()
    OR department_code = (
      SELECT COALESCE(
        CASE e.department
          WHEN 'Văn phòng'                     THEN 'HCTH'
          WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
          WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
          WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
          WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
          WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
          ELSE e.department
        END, ''
      )
      FROM employees e
      JOIN user_accounts ua ON ua.employee_id = e.employee_id
      WHERE ua.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- DELETE: admin only
CREATE POLICY "monthly_plans_delete" ON monthly_plans
  FOR DELETE TO authenticated USING (public.is_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  FIX 3: monthly_plan_items                                  ║
-- ║  Was: FOR ALL USING(true) WITH CHECK(true)                  ║
-- ╚══════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "Enable all for monthly_plan_items" ON monthly_plan_items;

-- SELECT: all authenticated can read
CREATE POLICY "monthly_plan_items_select" ON monthly_plan_items
  FOR SELECT TO authenticated USING (true);

-- INSERT: global roles or the plan belongs to user's department
CREATE POLICY "monthly_plan_items_insert" ON monthly_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_global_role()
    OR EXISTS (
      SELECT 1 FROM monthly_plans mp
      WHERE mp.id = monthly_plan_items.monthly_plan_id
      AND mp.department_code = (
        SELECT COALESCE(
          CASE e.department
            WHEN 'Văn phòng'                     THEN 'HCTH'
            WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
            WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
            WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
            WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
            WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
            ELSE e.department
          END, ''
        )
        FROM employees e
        JOIN user_accounts ua ON ua.employee_id = e.employee_id
        WHERE ua.auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- UPDATE: global roles or user is assigned staff or plan belongs to user's dept
CREATE POLICY "monthly_plan_items_update" ON monthly_plan_items
  FOR UPDATE TO authenticated
  USING (
    public.is_global_role()
    OR staff_id = public.get_current_employee_id()
    OR EXISTS (
      SELECT 1 FROM monthly_plans mp
      WHERE mp.id = monthly_plan_items.monthly_plan_id
      AND mp.department_code = (
        SELECT COALESCE(
          CASE e.department
            WHEN 'Văn phòng'                     THEN 'HCTH'
            WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
            WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
            WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
            WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
            WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
            ELSE e.department
          END, ''
        )
        FROM employees e
        JOIN user_accounts ua ON ua.employee_id = e.employee_id
        WHERE ua.auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  )
  WITH CHECK (
    public.is_global_role()
    OR staff_id = public.get_current_employee_id()
    OR EXISTS (
      SELECT 1 FROM monthly_plans mp
      WHERE mp.id = monthly_plan_items.monthly_plan_id
      AND mp.department_code = (
        SELECT COALESCE(
          CASE e.department
            WHEN 'Văn phòng'                     THEN 'HCTH'
            WHEN 'Phòng Kế hoạch – Đầu tư'       THEN 'KHDT'
            WHEN 'Phòng Tài chính – Kế toán'      THEN 'KTTD'
            WHEN 'Phòng Kỹ thuật – Chất lượng'    THEN 'KTCL'
            WHEN 'Phòng Chính sách – Pháp chế'    THEN 'CSPC'
            WHEN 'Trung tâm Dịch vụ tư vấn'       THEN 'PTDV'
            ELSE e.department
          END, ''
        )
        FROM employees e
        JOIN user_accounts ua ON ua.employee_id = e.employee_id
        WHERE ua.auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- DELETE: admin only
CREATE POLICY "monthly_plan_items_delete" ON monthly_plan_items
  FOR DELETE TO authenticated USING (public.is_admin());


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  FIX 4: legal_documents admin policy                        ║
-- ║  Was: referencing user_permissions.can_manage (NOT EXISTS)   ║
-- ║  Now: uses is_admin() OR is_global_role() helper functions  ║
-- ╚══════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "legal_docs_admin_all" ON legal_documents;

-- Admin/global roles can do all operations (INSERT/UPDATE/DELETE)
CREATE POLICY "legal_docs_admin_write" ON legal_documents
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_global_role())
  WITH CHECK (public.is_admin() OR public.is_global_role());

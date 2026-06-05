-- ============================================================
-- Migration: Loại bỏ quyền approve (Duyệt) khỏi ma trận và RLS
-- Date: 2026-06-04
--
-- Mục tiêu:
--   1. Xoá bỏ hành động 'approve' khỏi các bảng phân quyền defaults và overrides.
--   2. Cập nhật ma trận mặc định của Kế toán trưởng và phòng KH-ĐT đối với Kế hoạch Vốn.
--   3. Thiết lập lại RLS policies UPDATE để chỉ kiểm tra quyền 'update',
--      không còn kiểm tra quyền 'approve' đã bị xoá.
-- ============================================================

-- 1. Dọn dẹp dữ liệu phân quyền defaults (xóa 'approve')
UPDATE public.role_permission_defaults 
SET actions = actions - 'approve' 
WHERE actions ? 'approve';

-- Điều chỉnh ma trận quyền Kế hoạch Vốn (capital)
-- Kế toán trưởng chỉ xem và xuất
UPDATE public.role_permission_defaults 
SET actions = '["view", "export"]'::jsonb 
WHERE role = 'chief_accountant' AND resource = 'capital';

-- Trưởng phòng có thêm quyền xuất
UPDATE public.role_permission_defaults 
SET actions = '["view", "create", "update", "export"]'::jsonb 
WHERE role = 'dept_head' AND resource = 'capital';

-- Phó phòng có thêm quyền xuất
UPDATE public.role_permission_defaults 
SET actions = '["view", "create", "update", "export"]'::jsonb 
WHERE role = 'deputy_head' AND resource = 'capital';

-- Chuyên viên có thêm quyền thêm/sửa
UPDATE public.role_permission_defaults 
SET actions = '["view", "create", "update"]'::jsonb 
WHERE role = 'specialist' AND resource = 'capital';


-- 2. Dọn dẹp dữ liệu phân quyền overrides của cá nhân
UPDATE public.user_permissions 
SET actions = array_remove(actions, 'approve') 
WHERE 'approve' = ANY(actions);


-- 3. Cập nhật RLS UPDATE Policies cho các bảng nghiệp vụ
-- (contracts, payments, bidding_packages, capital_plans, disbursements)
-- Loại bỏ 'approve', chỉ kiểm tra quyền 'update'.
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_update_perm', rec.tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated '
      'USING (public.can_access_project(project_id)) '
      'WITH CHECK (public.has_permission(%L,%L) AND public.can_access_project(project_id))',
      rec.tbl||'_update_perm', rec.tbl, rec.res, 'update');
  END LOOP;
END $$;

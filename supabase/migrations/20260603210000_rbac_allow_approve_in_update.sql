-- ============================================================
-- Migration: Cho phép phê duyệt qua UPDATE (C-1.2)
-- Date: 2026-06-03
--
-- Phê duyệt (approve) hiện được thực hiện bằng UPDATE status. Giám đốc/Phó GĐ
-- có quyền 'approve' nhưng KHÔNG có 'update' → policy update sẽ chặn nhầm việc
-- phê duyệt. Cho phép UPDATE nếu có 'update' HOẶC 'approve' (vẫn chặn role không
-- có cả hai). Áp cho các bảng có nghiệp vụ phê duyệt.
--
-- Verify: GĐ UPDATE được payments (23 dòng); chuyên viên (không update/approve)
-- bị RLS chặn (lỗi 42501).
--
-- Ghi chú: bước hoàn thiện tiếp theo (tùy chọn) là RPC SECURITY DEFINER chỉ cho
-- đổi đúng cột trạng thái khi approve, thay vì mở toàn bộ UPDATE cho approver.
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.tbl||'_update_perm', rec.tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated '
      'USING (public.can_access_project(project_id)) '
      'WITH CHECK ((public.has_permission(%L,%L) OR public.has_permission(%L,%L)) AND public.can_access_project(project_id))',
      rec.tbl||'_update_perm', rec.tbl, rec.res, 'update', rec.res, 'approve');
  END LOOP;
END $$;

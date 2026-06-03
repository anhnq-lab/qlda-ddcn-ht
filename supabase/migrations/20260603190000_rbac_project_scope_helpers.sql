-- ============================================================
-- Migration: Helper scope dự án (B-2)
-- Date: 2026-06-03
--
-- Mô hình scope (khớp hành vi thực tế của app):
--   - Nhân sự Ban QLDA (Phòng QLDA N) → chỉ dự án có management_board = N
--   - Phó GĐ đã phân công → dự án thuộc Ban phụ trách (leadership_assignments)
--   - Nhà thầu → dự án trong allowed_project_ids
--   - Mọi nhân sự khác (lãnh đạo, phòng chức năng) → toàn cục
--
-- KHÔNG phụ thuộc bảng departments (chưa áp trên DB này) — dùng số Ban
-- suy trực tiếp từ tên phòng, đúng như extractBanNumber phía client.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_board_number()
RETURNS INTEGER AS $$
  SELECT NULLIF((regexp_match(
           e.department,
           '(?:Ban Điều hành dự án|Phòng Quản lý dự án|Ban ĐHDA|Phòng QLDA)\s*(\d+)',
           'i'))[1], '')::int
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_global_project_scope()
RETURNS BOOLEAN AS $$
  SELECT
    EXISTS (SELECT 1 FROM employees e JOIN user_accounts ua ON ua.employee_id=e.employee_id WHERE ua.auth_user_id=auth.uid())
    AND public.current_user_board_number() IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM employees e
      JOIN user_accounts ua ON ua.employee_id=e.employee_id
      JOIN leadership_assignments la ON la.deputy_employee_id=e.employee_id
      WHERE ua.auth_user_id=auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
      SELECT 1 FROM public.contractor_accounts ca
      WHERE ca.auth_user_id = auth.uid()
        AND p_project_id = ANY(ca.allowed_project_ids)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_access_project(TEXT)
IS 'TRUE nếu người gọi truy cập được dự án: admin / toàn cục / khớp management_board / PGĐ phụ trách / nhà thầu được gán.';

-- ============================================================
-- Migration: Add Phòng Phát triển dịch vụ (PTDV) to board scoping (ManagementBoard = 4)
-- Date: 2026-06-04
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_board_number()
RETURNS INTEGER AS $$
  SELECT 
    CASE 
      WHEN e.department ILIKE '%Phát triển dịch vụ%' OR e.department ILIKE '%Dịch vụ tư vấn%' THEN 4
      ELSE NULLIF((regexp_match(
               e.department,
               '(?:Ban Điều hành dự án|Phòng Quản lý dự án|Ban ĐHDA|Phòng QLDA)\s*(\d+)',
               'i'))[1], '')::int
    END
  FROM employees e
  JOIN user_accounts ua ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.current_user_board_number()
IS 'Trích xuất mã ban QLDA (1, 2, 3) từ tên phòng ban, riêng Phòng Phát triển dịch vụ / Dịch vụ tư vấn trả về 4.';

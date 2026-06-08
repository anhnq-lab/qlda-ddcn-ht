-- ============================================================
-- Migration: Remove department restriction for projects create and assign PTDV to PGĐ Bảo
-- Target: Specialist in any department can create projects (not just KH-ĐT),
--         and assign PTDV (board 4) to PGĐ Trần Ngọc Bảo (NV003).
-- Date: 2026-06-08
-- ============================================================

-- 1. Cho phép chuyên viên bất cứ phòng ban nào đều có thể tạo dự án
DELETE FROM public.department_permission_rules
WHERE resource = 'projects' AND action = 'create';

-- 2. Gán thêm Phòng Phát triển dịch vụ (board 4) cho PGĐ Trần Ngọc Bảo (NV003)
INSERT INTO public.leadership_assignments(deputy_employee_id, board_number)
VALUES ('NV003', 4)
ON CONFLICT (deputy_employee_id, board_number) DO NOTHING;

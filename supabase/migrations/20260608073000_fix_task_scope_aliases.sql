-- Migration: Fix department aliases for task and project scoping
-- Date: 2026-06-08

UPDATE public.departments
SET name_aliases = ARRAY['Phòng Kế hoạch – Đầu tư', 'Phòng Kế hoạch - Đầu tư', 'Phòng Kế hoạch – Đấu thầu']::TEXT[],
    updated_at = NOW()
WHERE code = 'KHDT';

UPDATE public.departments
SET name_aliases = ARRAY['Phòng Kỹ thuật – Chất lượng', 'Phòng Kỹ thuật - Chất lượng', 'Phòng Kỹ thuật – Thẩm định']::TEXT[],
    updated_at = NOW()
WHERE code = 'KTTD';

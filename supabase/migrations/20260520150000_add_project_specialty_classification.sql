-- Migration: Add project specialty classification fields based on Phụ lục 2
-- Date: 2026-05-20

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS specialty_type TEXT,
ADD COLUMN IF NOT EXISTS specialty_details TEXT;

-- Thêm chú thích cho các cột mới
COMMENT ON COLUMN projects.specialty_type IS 'Chuyên ngành dự án theo Phụ lục 2 Luật Đầu tư công 58/2024/QH15';
COMMENT ON COLUMN projects.specialty_details IS 'Chi tiết chuyên ngành (đối với chuyên ngành hỗn hợp hoặc khác)';

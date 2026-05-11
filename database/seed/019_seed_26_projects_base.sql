-- ============================================================
-- 019_seed_26_projects_base.sql
-- Dữ liệu mẫu: 26 Dự án và Kế hoạch vốn
-- ============================================================

-- Xóa dữ liệu cũ
DELETE FROM projects WHERE project_id LIKE 'SEED-%';

-- ── 1. PROJECTS (26 Dự án) ─────────────────────────────
-- Phân loại: 
-- 10 Chuẩn bị đầu tư (stage: 'preparation', status: 1)
-- 10 Thực hiện đầu tư (stage: 'execution', status: 2)
-- 6 Hoàn thành (stage: 'completion', status: 3)

INSERT INTO projects (
  project_id, project_name, group_code, investment_type, status, stage, total_investment, 
  province_code, is_emergency, requires_bim, management_board, start_date, expected_end_date,
  national_project_code, capital_source, construction_grade, sector
) VALUES
-- NHÓM 1: CHUẨN BỊ ĐẦU TƯ (10 Dự án) - Tổng mức: ~2,500 tỷ
('SEED-CB-001', 'Xây dựng Bệnh viện Đa khoa Cơ sở 2', 'B', 1, 1, 'preparation', 850000000000, '79', false, true, 1, '2025-01-01', '2027-12-31', 'DA-79-11001', 'Ngân sách TP', 'Cấp I', 'Y tế'),
('SEED-CB-002', 'Cải tạo, nâng cấp Bệnh viện Nhi Đồng 1', 'B', 1, 1, 'preparation', 450000000000, '79', false, true, 1, '2025-03-01', '2026-12-31', 'DA-79-11002', 'Ngân sách TP', 'Cấp II', 'Y tế'),
('SEED-CB-003', 'Xây dựng mới Trung tâm Kiểm soát bệnh tật (CDC)', 'B', 1, 1, 'preparation', 320000000000, '79', false, false, 1, '2025-06-01', '2026-12-31', 'DA-79-11003', 'Ngân sách TP', 'Cấp II', 'Y tế'),
('SEED-CB-004', 'Mở rộng đường Trần Quốc Hoàn - Cộng Hòa', 'A', 2, 1, 'preparation', 4800000000000, '79', false, true, 2, '2025-02-01', '2028-12-31', 'DA-79-22001', 'Ngân sách TW + TP', 'Cấp I', 'Giao thông'),
('SEED-CB-005', 'Nâng cấp đường Huỳnh Tấn Phát (Đoạn 3)', 'B', 2, 1, 'preparation', 560000000000, '79', false, false, 2, '2025-04-01', '2026-06-30', 'DA-79-22002', 'Ngân sách TP', 'Cấp II', 'Giao thông'),
('SEED-CB-006', 'Xây dựng cầu đường Bình Tiên', 'A', 2, 1, 'preparation', 3500000000000, '79', false, true, 2, '2025-08-01', '2028-12-31', 'DA-79-22003', 'Ngân sách TP', 'Cấp I', 'Giao thông'),
('SEED-CB-007', 'Xây dựng trường THPT chuyên Lê Hồng Phong (mới)', 'B', 3, 1, 'preparation', 680000000000, '79', false, true, 3, '2025-05-01', '2027-08-30', 'DA-79-33001', 'Ngân sách TP', 'Cấp II', 'Giáo dục'),
('SEED-CB-008', 'Cải tạo Rạch Xuyên Tâm', 'A', 4, 1, 'preparation', 9600000000000, '79', true, true, 4, '2025-01-01', '2029-12-31', 'DA-79-44001', 'Ngân sách TP', 'Cấp I', 'Hạ tầng KT'),
('SEED-CB-009', 'Nhà máy xử lý nước thải Tây Sài Gòn', 'A', 4, 1, 'preparation', 2100000000000, '79', false, true, 4, '2025-07-01', '2028-12-31', 'DA-79-44002', 'ODA + Đối ứng', 'Cấp I', 'Hạ tầng KT'),
('SEED-CB-010', 'Bảo tàng Tôn Đức Thắng (Giai đoạn 2)', 'C', 3, 1, 'preparation', 120000000000, '79', false, false, 3, '2025-09-01', '2026-12-31', 'DA-79-33002', 'Ngân sách TP', 'Cấp III', 'Văn hóa'),

-- NHÓM 2: THỰC HIỆN ĐẦU TƯ (10 Dự án)
('SEED-TH-001', 'Xây dựng Bệnh viện Ung Bướu (Giai đoạn 2)', 'A', 1, 2, 'execution', 1500000000000, '79', false, true, 1, '2023-01-01', '2025-12-31', 'DA-79-11004', 'Ngân sách TP', 'Cấp I', 'Y tế'),
('SEED-TH-002', 'Xây dựng Viện Tim Thành phố (Khu B)', 'B', 1, 2, 'execution', 890000000000, '79', false, true, 1, '2024-03-01', '2026-06-30', 'DA-79-11005', 'Ngân sách TP', 'Cấp I', 'Y tế'),
('SEED-TH-003', 'Trung tâm Hồi sức cấp cứu Bệnh viện Chợ Rẫy', 'B', 1, 2, 'execution', 540000000000, '79', true, false, 1, '2024-06-01', '2025-12-31', 'DA-79-11006', 'Ngân sách TP', 'Cấp II', 'Y tế'),
('SEED-TH-004', 'Nút giao thông An Phú', 'A', 2, 2, 'execution', 3926000000000, '79', false, true, 2, '2022-12-29', '2025-12-31', 'DA-79-22004', 'Ngân sách TW + TP', 'Cấp I', 'Giao thông'),
('SEED-TH-005', 'Mở rộng Quốc lộ 50', 'B', 2, 2, 'execution', 1498000000000, '79', false, true, 2, '2022-12-28', '2025-12-31', 'DA-79-22005', 'Ngân sách TP', 'Cấp II', 'Giao thông'),
('SEED-TH-006', 'Vành đai 3 - Đoạn qua TPHCM', 'A', 2, 2, 'execution', 22411000000000, '79', false, true, 2, '2023-06-18', '2026-06-30', 'DA-79-22006', 'Ngân sách TW + TP', 'Cấp Đặc biệt', 'Giao thông'),
('SEED-TH-007', 'Xây dựng Đại học Sài Gòn (Cơ sở 2)', 'B', 3, 2, 'execution', 750000000000, '79', false, true, 3, '2024-01-01', '2026-12-31', 'DA-79-33003', 'Ngân sách TP', 'Cấp II', 'Giáo dục'),
('SEED-TH-008', 'Hạ tầng kỹ thuật Khu dân cư Nam Sài Gòn', 'B', 4, 2, 'execution', 620000000000, '79', false, false, 4, '2024-04-01', '2025-12-31', 'DA-79-44003', 'Ngân sách TP', 'Cấp II', 'Hạ tầng KT'),
('SEED-TH-009', 'Cải tạo Kênh Tham Lương - Bến Cát - Rạch Nước Lên', 'A', 4, 2, 'execution', 8200000000000, '79', false, true, 4, '2023-02-23', '2025-12-31', 'DA-79-44004', 'Ngân sách TP', 'Cấp I', 'Hạ tầng KT'),
('SEED-TH-010', 'Bảo tồn, tôn tạo Di tích Dinh Độc Lập', 'C', 3, 2, 'execution', 150000000000, '79', false, false, 3, '2024-08-01', '2025-08-30', 'DA-79-33004', 'Ngân sách TP', 'Cấp III', 'Văn hóa'),

-- NHÓM 3: HOÀN THÀNH (6 Dự án)
('SEED-HT-001', 'Xây dựng Bệnh viện Nhi Đồng Thành phố', 'A', 1, 3, 'completion', 4200000000000, '79', false, true, 1, '2019-01-01', '2024-06-30', 'DA-79-11007', 'Ngân sách TW + TP', 'Cấp I', 'Y tế'),
('SEED-HT-002', 'Cải tạo Bệnh viện Truyền máu Huyết học', 'C', 1, 3, 'completion', 250000000000, '79', false, false, 1, '2022-05-01', '2024-12-31', 'DA-79-11008', 'Ngân sách TP', 'Cấp III', 'Y tế'),
('SEED-HT-003', 'Cầu Thủ Thiêm 2 (Cầu Ba Son)', 'A', 2, 3, 'completion', 3082000000000, '79', false, true, 2, '2015-02-01', '2022-04-28', 'DA-79-22007', 'BT / Ngân sách TP', 'Cấp Đặc biệt', 'Giao thông'),
('SEED-HT-004', 'Nâng cấp đường Nguyễn Hữu Cảnh', 'B', 2, 3, 'completion', 472000000000, '79', false, false, 2, '2019-10-05', '2024-04-30', 'DA-79-22008', 'Ngân sách TP', 'Cấp II', 'Giao thông'),
('SEED-HT-005', 'Trường THCS-THPT Trần Đại Nghĩa (CS2)', 'B', 3, 3, 'completion', 350000000000, '79', false, false, 3, '2021-06-01', '2023-08-30', 'DA-79-33005', 'Ngân sách TP', 'Cấp II', 'Giáo dục'),
('SEED-HT-006', 'Công viên bờ sông Sài Gòn (Thủ Thiêm)', 'B', 4, 3, 'completion', 280000000000, '79', false, false, 4, '2023-01-01', '2024-12-20', 'DA-79-44005', 'Xã hội hóa', 'Cấp III', 'Hạ tầng KT')
ON CONFLICT (project_id) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  stage = EXCLUDED.stage,
  status = EXCLUDED.status,
  total_investment = EXCLUDED.total_investment,
  investment_type = EXCLUDED.investment_type;


-- ── 2. CAPITAL PLANS (Kế hoạch vốn trung hạn 2021-2025) ─────
DELETE FROM capital_plans WHERE project_id LIKE 'SEED-%';

-- Các dự án Chuẩn bị: Được phân bổ vốn chuẩn bị đầu tư (khoảng 1-5% tổng mức)
INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, notes)
SELECT 
  'CP-' || project_id || '-2025', 
  project_id, 
  2025, 
  total_investment * 0.02, 
  (total_investment * 0.02) * 0.3, -- Giải ngân 30% kế hoạch vốn
  capital_source, 
  'Vốn chuẩn bị đầu tư 2025'
FROM projects 
WHERE project_id LIKE 'SEED-CB-%';

-- Các dự án Thực hiện: Phân bổ vốn lớn cho năm 2024, 2025
-- Năm 2024
INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, notes)
SELECT 
  'CP-' || project_id || '-2024', 
  project_id, 
  2024, 
  total_investment * 0.2, 
  (total_investment * 0.2) * 0.95, -- Giải ngân 95% vốn 2024
  capital_source, 
  'Vốn thực hiện 2024'
FROM projects 
WHERE project_id LIKE 'SEED-TH-%';

-- Năm 2025
INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, notes)
SELECT 
  'CP-' || project_id || '-2025', 
  project_id, 
  2025, 
  total_investment * 0.3, 
  (total_investment * 0.3) * 0.45, -- Giải ngân 45% vốn 2025 (đang thực hiện)
  capital_source, 
  'Vốn thực hiện 2025'
FROM projects 
WHERE project_id LIKE 'SEED-TH-%';

-- Các dự án Hoàn thành: Vốn quyết toán
INSERT INTO capital_plans (plan_id, project_id, year, amount, disbursed_amount, source, notes)
SELECT 
  'CP-' || project_id || '-2024', 
  project_id, 
  2024, 
  total_investment * 0.1, 
  total_investment * 0.1, -- Giải ngân 100%
  capital_source, 
  'Vốn quyết toán 2024'
FROM projects 
WHERE project_id LIKE 'SEED-HT-%';

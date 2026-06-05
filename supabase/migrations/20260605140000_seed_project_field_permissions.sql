-- ============================================================
-- Migration: Seed phân quyền cấp trường dự án theo Quy chế nhập liệu QLDA
-- Date: 2026-06-05
-- ============================================================

-- 1. Xóa sạch cấu hình cũ để seed lại từ đầu (idempotent)
DELETE FROM public.project_field_permissions;

-- 2. Định nghĩa danh sách các trường dữ liệu dự án theo catalog
-- Cột/trường thuộc tab 'contractors' (đấu thầu/nhà thầu)
-- Chuyên viên KH-ĐT ĐƯỢC PHÉP SỬA các trường này, các vai trò khác bị khóa
-- 'bidding_form', 'applicable_standards', 'main_contractor_name', 'feasibility_contractor', 'survey_contractor', 'review_contractor', 'contractor_details', 'project_management'

-- Seed can_edit = false cho Giám đốc dự án, Trưởng phòng phụ trách, Kế toán dự án, Thành viên (Khóa toàn bộ 50 trường)
INSERT INTO public.project_field_permissions (member_role, field_key, can_edit)
SELECT role, field_key, false
FROM 
  (VALUES 
    ('Giám đốc dự án'),
    ('Trưởng phòng phụ trách'),
    ('Kế toán dự án'),
    ('Thành viên')
  ) AS r(role),
  (VALUES
    ('project_name'), ('group_code'), ('investment_type'), ('management_board'), ('start_date'), 
    ('expected_end_date'), ('duration'), ('province_code'), ('location_code'), ('construction_type'), 
    ('competent_authority'), ('investor_name'), ('objective'), ('investment_scale'), ('specialty_type'), 
    ('specialty_details'), ('is_emergency'), ('is_oda'), ('image_url'), ('coordinates'),
    ('policy_decision_level'), ('policy_decision_number'), ('policy_decision_date'), ('policy_decision_authority'), 
    ('decision_number'), ('decision_authority'), ('approval_date'), ('construction_grade'), 
    ('decision_level_before_handover'), ('old_investor'), ('transfer_decision'),
    ('site_area'), ('construction_area'), ('floor_area'), ('building_height'), 
    ('building_density'), ('land_use_coefficient'), ('above_ground_floors'), ('basement_floors'), ('total_estimate'),
    ('total_investment'), ('capital_source'), ('budget_allocations'), ('cost_breakdown'),
    ('bidding_form'), ('applicable_standards'), ('main_contractor_name'), ('feasibility_contractor'), 
    ('survey_contractor'), ('review_contractor'), ('contractor_details'), ('project_management'),
    ('stage'), ('current_status_code'), ('adjusted_approval'), ('project_status_info')
  ) AS f(field_key);

-- Seed can_edit = false cho Chuyên viên KH-ĐT (Khóa tất cả các trường ngoại trừ các trường tab contractors)
INSERT INTO public.project_field_permissions (member_role, field_key, can_edit)
SELECT 'Chuyên viên KH-ĐT', field_key, false
FROM 
  (VALUES
    ('project_name'), ('group_code'), ('investment_type'), ('management_board'), ('start_date'), 
    ('expected_end_date'), ('duration'), ('province_code'), ('location_code'), ('construction_type'), 
    ('competent_authority'), ('investor_name'), ('objective'), ('investment_scale'), ('specialty_type'), 
    ('specialty_details'), ('is_emergency'), ('is_oda'), ('image_url'), ('coordinates'),
    ('policy_decision_level'), ('policy_decision_number'), ('policy_decision_date'), ('policy_decision_authority'), 
    ('decision_number'), ('decision_authority'), ('approval_date'), ('construction_grade'), 
    ('decision_level_before_handover'), ('old_investor'), ('transfer_decision'),
    ('site_area'), ('construction_area'), ('floor_area'), ('building_height'), 
    ('building_density'), ('land_use_coefficient'), ('above_ground_floors'), ('basement_floors'), ('total_estimate'),
    ('total_investment'), ('capital_source'), ('budget_allocations'), ('cost_breakdown'),
    ('stage'), ('current_status_code'), ('adjusted_approval'), ('project_status_info')
  ) AS f(field_key);

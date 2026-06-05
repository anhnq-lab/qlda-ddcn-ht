/**
 * Catalog trường dữ liệu dự án — nguồn chuẩn cho phân quyền cấp TRƯỜNG
 * theo vai trò thành viên dự án (project_members.role).
 *
 * - `key`   : tên CỘT trong bảng `projects` (snake_case) — dùng cho DB trigger & bảng cấu hình.
 * - `tsKey` : tên field trong form (PascalCase) — dùng để khoá ô trên giao diện.
 * - `label` : nhãn tiếng Việt hiển thị ở UI cấu hình.
 * - `tab`   : nhóm theo tab của form Thêm/Sửa dự án (đồng bộ PROJ_TABS / FIELD_TO_TAB).
 *
 * Dùng chung bởi: ProjectFieldPermissionManager (UI), useProjectFieldAccess (form),
 * và migration enforce_project_field_permissions (DB trigger so theo `key`).
 */

export const PROJECT_MEMBER_ROLES = [
    'Giám đốc dự án',
    'Trưởng phòng phụ trách',
    'Chuyên viên phụ trách',
    'Kế toán dự án',
    'Thành viên',
] as const;

export type ProjectMemberRole = typeof PROJECT_MEMBER_ROLES[number];

export type ProjectFieldTab = 'general' | 'legal' | 'scale' | 'investment' | 'contractors' | 'status';

export interface ProjectFieldDef {
    key: string;    // DB column
    tsKey: string;  // form field
    label: string;
    tab: ProjectFieldTab;
}

export const PROJECT_FIELD_TAB_LABELS: Record<ProjectFieldTab, string> = {
    general: 'Thông tin chung',
    legal: 'Pháp lý',
    scale: 'Quy mô công trình',
    investment: 'Cơ cấu vốn & Chi phí',
    contractors: 'Nhà thầu',
    status: 'Trạng thái',
};

export const PROJECT_FIELD_CATALOG: ProjectFieldDef[] = [
    // ── Thông tin chung ──
    { key: 'project_name', tsKey: 'ProjectName', label: 'Tên dự án', tab: 'general' },
    { key: 'group_code', tsKey: 'GroupCode', label: 'Nhóm dự án', tab: 'general' },
    { key: 'investment_type', tsKey: 'InvestmentType', label: 'Loại đầu tư', tab: 'general' },
    { key: 'management_board', tsKey: 'ManagementBoard', label: 'Ban QLDA phụ trách', tab: 'general' },
    { key: 'start_date', tsKey: 'StartDate', label: 'Ngày bắt đầu', tab: 'general' },
    { key: 'expected_end_date', tsKey: 'ExpectedEndDate', label: 'Ngày kết thúc dự kiến', tab: 'general' },
    { key: 'duration', tsKey: 'Duration', label: 'Thời gian thực hiện', tab: 'general' },
    { key: 'province_code', tsKey: 'ProvinceCode', label: 'Tỉnh/Thành', tab: 'general' },
    { key: 'location_code', tsKey: 'LocationCode', label: 'Địa điểm', tab: 'general' },
    { key: 'construction_type', tsKey: 'ConstructionType', label: 'Loại công trình', tab: 'general' },
    { key: 'competent_authority', tsKey: 'CompetentAuthority', label: 'Cấp quyết định', tab: 'general' },
    { key: 'investor_name', tsKey: 'InvestorName', label: 'Chủ đầu tư', tab: 'general' },
    { key: 'objective', tsKey: 'Objective', label: 'Mục tiêu đầu tư', tab: 'general' },
    { key: 'investment_scale', tsKey: 'InvestmentScale', label: 'Quy mô đầu tư', tab: 'general' },
    { key: 'specialty_type', tsKey: 'SpecialtyType', label: 'Loại chuyên ngành', tab: 'general' },
    { key: 'specialty_details', tsKey: 'SpecialtyDetails', label: 'Chi tiết chuyên ngành', tab: 'general' },
    { key: 'is_emergency', tsKey: 'IsEmergency', label: 'Công trình khẩn cấp', tab: 'general' },
    { key: 'is_oda', tsKey: 'IsODA', label: 'Dự án ODA', tab: 'general' },
    { key: 'image_url', tsKey: 'ImageUrl', label: 'Ảnh dự án', tab: 'general' },
    { key: 'coordinates', tsKey: 'Coordinates', label: 'Toạ độ', tab: 'general' },

    // ── Pháp lý ──
    { key: 'policy_decision_level', tsKey: 'PolicyDecisionLevel', label: 'Cấp QĐ chủ trương', tab: 'legal' },
    { key: 'policy_decision_number', tsKey: 'PolicyDecisionNumber', label: 'Số QĐ chủ trương', tab: 'legal' },
    { key: 'policy_decision_date', tsKey: 'PolicyDecisionDate', label: 'Ngày QĐ chủ trương', tab: 'legal' },
    { key: 'policy_decision_authority', tsKey: 'PolicyDecisionAuthority', label: 'Cơ quan QĐ chủ trương', tab: 'legal' },
    { key: 'decision_number', tsKey: 'DecisionNumber', label: 'Số QĐ đầu tư', tab: 'legal' },
    { key: 'decision_authority', tsKey: 'DecisionAuthority', label: 'Cơ quan QĐ đầu tư', tab: 'legal' },
    { key: 'approval_date', tsKey: 'ApprovalDate', label: 'Ngày phê duyệt', tab: 'legal' },
    { key: 'construction_grade', tsKey: 'ConstructionGrade', label: 'Cấp công trình', tab: 'legal' },
    { key: 'decision_level_before_handover', tsKey: 'DecisionLevelBeforeHandover', label: 'Cấp QĐ trước bàn giao', tab: 'legal' },
    { key: 'old_investor', tsKey: 'OldInvestor', label: 'Chủ đầu tư cũ', tab: 'legal' },
    { key: 'transfer_decision', tsKey: 'TransferDecision', label: 'QĐ bàn giao', tab: 'legal' },

    // ── Quy mô công trình ──
    { key: 'site_area', tsKey: 'SiteArea', label: 'Diện tích khu đất', tab: 'scale' },
    { key: 'construction_area', tsKey: 'ConstructionArea', label: 'Diện tích xây dựng', tab: 'scale' },
    { key: 'floor_area', tsKey: 'FloorArea', label: 'Tổng diện tích sàn', tab: 'scale' },
    { key: 'building_height', tsKey: 'BuildingHeight', label: 'Chiều cao công trình', tab: 'scale' },
    { key: 'building_density', tsKey: 'BuildingDensity', label: 'Mật độ xây dựng', tab: 'scale' },
    { key: 'land_use_coefficient', tsKey: 'LandUseCoefficient', label: 'Hệ số sử dụng đất', tab: 'scale' },
    { key: 'above_ground_floors', tsKey: 'AboveGroundFloors', label: 'Số tầng nổi', tab: 'scale' },
    { key: 'basement_floors', tsKey: 'BasementFloors', label: 'Số tầng hầm', tab: 'scale' },
    { key: 'total_estimate', tsKey: 'TotalEstimate', label: 'Tổng dự toán', tab: 'scale' },

    // ── Cơ cấu vốn & Chi phí ──
    { key: 'total_investment', tsKey: 'TotalInvestment', label: 'Tổng mức đầu tư', tab: 'investment' },
    { key: 'capital_source', tsKey: 'CapitalSource', label: 'Nguồn vốn', tab: 'investment' },
    { key: 'budget_allocations', tsKey: 'BudgetAllocations', label: 'Phân bổ nguồn vốn', tab: 'investment' },
    { key: 'cost_breakdown', tsKey: 'CostBreakdown', label: 'Cơ cấu chi phí', tab: 'investment' },

    // ── Nhà thầu ──
    { key: 'bidding_form', tsKey: 'BiddingForm', label: 'Hình thức lựa chọn nhà thầu', tab: 'contractors' },
    { key: 'applicable_standards', tsKey: 'ApplicableStandards', label: 'Tiêu chuẩn áp dụng', tab: 'contractors' },
    { key: 'main_contractor_name', tsKey: 'MainContractorName', label: 'Nhà thầu thi công chính', tab: 'contractors' },
    { key: 'feasibility_contractor', tsKey: 'FeasibilityContractor', label: 'Nhà thầu lập BC NCKT', tab: 'contractors' },
    { key: 'survey_contractor', tsKey: 'SurveyContractor', label: 'Nhà thầu khảo sát', tab: 'contractors' },
    { key: 'review_contractor', tsKey: 'ReviewContractor', label: 'Nhà thầu thẩm tra', tab: 'contractors' },
    { key: 'contractor_details', tsKey: 'ContractorDetails', label: 'Chi tiết nhà thầu', tab: 'contractors' },
    { key: 'project_management', tsKey: 'ProjectManagement', label: 'Tư vấn QLDA', tab: 'contractors' },

    // ── Trạng thái ──
    { key: 'stage', tsKey: 'Stage', label: 'Giai đoạn dự án', tab: 'status' },
    { key: 'current_status_code', tsKey: 'CurrentStatusCode', label: 'Tình trạng hiện tại', tab: 'status' },
    { key: 'adjusted_approval', tsKey: 'AdjustedApproval', label: 'Điều chỉnh phê duyệt', tab: 'status' },
    { key: 'project_status_info', tsKey: 'ProjectStatusInfo', label: 'Thông tin trạng thái', tab: 'status' },
];

/** Map tsKey → db column key (dùng cho form khoá ô qua canEditField). */
export const TSKEY_TO_FIELD_KEY: Record<string, string> = PROJECT_FIELD_CATALOG.reduce(
    (acc, f) => { acc[f.tsKey] = f.key; return acc; },
    {} as Record<string, string>
);

export const PROJECT_FIELD_TABS: ProjectFieldTab[] = ['general', 'legal', 'scale', 'investment', 'contractors', 'status'];

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
    'Chuyên viên KH-ĐT',
    'Kế toán dự án',
    'Thành viên',
] as const;

export type ProjectMemberRole = typeof PROJECT_MEMBER_ROLES[number];

export type ProjectFieldTab = 'general' | 'legal' | 'investment' | 'contractors';

export interface ProjectFieldDef {
    key: string;    // DB column
    tsKey: string;  // form field
    label: string;
    tab: ProjectFieldTab;
}

export const PROJECT_FIELD_TAB_LABELS: Record<ProjectFieldTab, string> = {
    general: 'Thông tin chung',
    legal: 'Pháp lý',
    investment: 'Cơ cấu vốn & Chi phí',
    contractors: 'Nhà thầu',
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
    { key: 'is_emergency', tsKey: 'IsEmergency', label: 'Công trình khẩn cấp', tab: 'general' },
    { key: 'is_oda', tsKey: 'IsODA', label: 'Dự án ODA', tab: 'general' },
    { key: 'image_url', tsKey: 'ImageUrl', label: 'Ảnh dự án', tab: 'general' },
    { key: 'coordinates', tsKey: 'Coordinates', label: 'Toạ độ', tab: 'general' },

    // ── Pháp lý ──
    { key: 'decision_number', tsKey: 'DecisionNumber', label: 'Số QĐ đầu tư', tab: 'legal' },
    { key: 'decision_authority', tsKey: 'DecisionAuthority', label: 'Cơ quan QĐ đầu tư', tab: 'legal' },
    { key: 'approval_date', tsKey: 'ApprovalDate', label: 'Ngày phê duyệt', tab: 'legal' },
    { key: 'construction_grade', tsKey: 'ConstructionGrade', label: 'Cấp công trình', tab: 'general' },
    { key: 'decision_level_before_handover', tsKey: 'DecisionLevelBeforeHandover', label: 'Cấp QĐ trước bàn giao', tab: 'legal' },
    { key: 'old_investor', tsKey: 'OldInvestor', label: 'Chủ đầu tư cũ', tab: 'legal' },
    { key: 'transfer_decision', tsKey: 'TransferDecision', label: 'QĐ bàn giao', tab: 'legal' },

    // ── Cơ cấu vốn & Chi phí ──
    { key: 'total_investment', tsKey: 'TotalInvestment', label: 'Tổng mức đầu tư', tab: 'investment' },
    { key: 'capital_source', tsKey: 'CapitalSource', label: 'Nguồn vốn', tab: 'investment' },
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
];

/** Map tsKey → db column key (dùng cho form khoá ô qua canEditField). */
export const TSKEY_TO_FIELD_KEY: Record<string, string> = PROJECT_FIELD_CATALOG.reduce(
    (acc, f) => { acc[f.tsKey] = f.key; return acc; },
    {} as Record<string, string>
);

export const PROJECT_FIELD_TABS: ProjectFieldTab[] = ['general', 'legal', 'investment', 'contractors'];

// Project-related types — Luật Đầu tư công 58/2024/QH15

/** Phòng Quản Lý Dự Án (1–3) + Phòng Phát triển dịch vụ */
export const MANAGEMENT_BOARDS = [
    { value: 1, label: 'Phòng QLDA 1', color: 'bg-blue-500',    hex: '#3B82F6' },
    { value: 2, label: 'Phòng QLDA 2', color: 'bg-emerald-500', hex: '#10B981' },
    { value: 3, label: 'Phòng QLDA 3', color: 'bg-violet-500',  hex: '#8B5CF6' },
    { value: 4, label: 'Phòng Phát triển dịch vụ', color: 'bg-amber-500', hex: '#F59E0B' },
] as const;

// 3.1. Bảng dữ liệu: Projects (Dự án Đầu tư)
export enum ProjectGroup {
    QN = 'QN', // Quan trọng quốc gia
    A = 'A',
    B = 'B',
    C = 'C'
}

export enum InvestmentType {
    Public = 1, // Đầu tư công
    StateNonPublic = 2, // Vốn nhà nước ngoài đầu tư công
    PPP = 3, // Đối tác công tư
    Other = 4
}

export enum ProjectStatus {
    Preparation = 1, // GĐ Chuẩn bị dự án
    Execution = 2,   // GĐ Thực hiện dự án
    Completion = 3   // GĐ Kết thúc xây dựng, đưa CT vào khai thác sử dụng
}

/** Bảng màu giai đoạn dự án — Nguồn chân lý duy nhất */
export const PROJECT_PHASE_COLORS: Record<ProjectStatus, { label: string; hex: string; hexDark: string }> = {
    [ProjectStatus.Preparation]: { label: 'Chuẩn bị dự án', hex: '#3B82F6', hexDark: '#2563EB' },   // Blue
    [ProjectStatus.Execution]:   { label: 'Thực hiện dự án', hex: '#F97316', hexDark: '#EA580C' },   // Orange
    [ProjectStatus.Completion]:  { label: 'Kết thúc xây dựng', hex: '#10B981', hexDark: '#059669' }, // Emerald
};

/** Giai đoạn dự án theo NĐ 175/2024 (3 giai đoạn) */
export enum ProjectStage {
    Preparation = 'Preparation',   // GĐ Chuẩn bị dự án
    Execution = 'Execution',       // GĐ Thực hiện dự án
    Completion = 'Completion'      // GĐ Kết thúc xây dựng
}

export enum ProjectCurrentStatus {
    DuyetChuTruong = 1, // Duyệt chủ trương
    DuyetDuAn = 2, // Duyệt dự án nhưng chưa khởi công
    DangThiCong = 3, // Đang thi công
    DaHoanThanhChuaBanGiao = 4, // Đã hoàn thành chưa bàn giao/ đang đề xuất dừng thực hiện
    DaBanGiaoChuaTrinhQuyetToan = 5, // Đã bàn giao/ đã dừng thực hiện nhưng chưa trình quyết toán
    DaTrinhChuaPheDuyetQuyetToan = 6, // Đã trình nhưng chưa phê duyệt quyết toán
    DaQuyetToanConCongNo = 7, // Đã quyết toán còn công nợ
    HetNhiemVuChi = 8, // Hết nhiệm vụ chi nhưng còn xử lý về tài chính (thanh tra, kiểm toán, dư ứng, thu hồi,...)
    KetThuc = 9, // Dự án kết thúc
    ChuaNhanBanGiao = 10, // Chưa nhận bàn giao từ CĐT cũ
}

export const PROJECT_CURRENT_STATUS_CONFIG: Record<number, { label: string; fullLabel: string; hex: string; bgClass: string; textClass: string; borderClass: string }> = {
    1: { label: 'Duyệt chủ trương', fullLabel: 'Duyệt chủ trương', hex: '#6366F1', bgClass: 'bg-indigo-50 dark:bg-indigo-900/30', textClass: 'text-indigo-700 dark:text-indigo-400', borderClass: 'border-indigo-100 dark:border-indigo-800' },
    2: { label: 'Chưa khởi công', fullLabel: 'Duyệt dự án nhưng chưa khởi công', hex: '#8B5CF6', bgClass: 'bg-violet-50 dark:bg-violet-900/30', textClass: 'text-violet-700 dark:text-violet-400', borderClass: 'border-violet-100 dark:border-violet-800' },
    3: { label: 'Đang thi công', fullLabel: 'Đang thi công', hex: '#F59E0B', bgClass: 'bg-amber-50 dark:bg-amber-900/30', textClass: 'text-amber-700 dark:text-amber-400', borderClass: 'border-amber-100 dark:border-amber-800' },
    4: { label: 'Hoàn thành chưa bàn giao', fullLabel: 'Đã hoàn thành chưa bàn giao / Đang đề xuất dừng thực hiện', hex: '#06B6D4', bgClass: 'bg-cyan-50 dark:bg-cyan-900/30', textClass: 'text-cyan-700 dark:text-cyan-400', borderClass: 'border-cyan-100 dark:border-cyan-800' },
    5: { label: 'Bàn giao chưa trình QT', fullLabel: 'Đã bàn giao / Đã dừng thực hiện nhưng chưa trình quyết toán', hex: '#3B82F6', bgClass: 'bg-blue-50 dark:bg-blue-900/30', textClass: 'text-blue-700 dark:text-blue-400', borderClass: 'border-blue-100 dark:border-blue-800' },
    6: { label: 'Đã trình chưa duyệt QT', fullLabel: 'Đã trình nhưng chưa phê duyệt quyết toán', hex: '#EC4899', bgClass: 'bg-pink-50 dark:bg-pink-900/30', textClass: 'text-pink-700 dark:text-pink-400', borderClass: 'border-pink-100 dark:border-pink-800' },
    7: { label: 'Đã QT còn công nợ', fullLabel: 'Đã quyết toán còn công nợ', hex: '#EF4444', bgClass: 'bg-red-50 dark:bg-red-900/30', textClass: 'text-red-700 dark:text-red-400', borderClass: 'border-red-100 dark:border-red-800' },
    8: { label: 'Xử lý tài chính', fullLabel: 'Hết nhiệm vụ chi nhưng còn xử lý về tài chính (thanh tra, kiểm toán, dư ứng, thu hồi,...)', hex: '#F97316', bgClass: 'bg-orange-50 dark:bg-orange-900/30', textClass: 'text-orange-700 dark:text-orange-400', borderClass: 'border-orange-100 dark:border-orange-800' },
    9: { label: 'Dự án kết thúc', fullLabel: 'Dự án kết thúc', hex: '#10B981', bgClass: 'bg-emerald-50 dark:bg-emerald-900/30', textClass: 'text-emerald-700 dark:text-emerald-400', borderClass: 'border-emerald-100 dark:border-emerald-800' },
    10: { label: 'Chưa nhận bàn giao', fullLabel: 'Chưa nhận bàn giao từ CĐT cũ', hex: '#64748B', bgClass: 'bg-slate-50 dark:bg-slate-900/30', textClass: 'text-slate-700 dark:text-slate-400', borderClass: 'border-slate-100 dark:border-slate-800' },
};

/**
 * Lĩnh vực đầu tư - theo Điều 9 Luật ĐTC 58/2024/QH15
 * Phân thành 5 nhóm lĩnh vực (Khoản 1-5 Điều 9) với ngưỡng khác nhau
 */
export enum ProjectSector {
    // === Khoản 2 Điều 9: Nhóm A ≥ 4.600 tỷ ===
    TransportMajor = 'TransportMajor',       // GT: cầu, cảng biển, sân bay, đường sắt, đường QG
    PowerIndustry = 'PowerIndustry',         // Công nghiệp điện
    OilGas = 'OilGas',                       // Khai thác dầu khí
    HeavyIndustry = 'HeavyIndustry',         // Xi măng, Luyện kim, Chế tạo máy
    ResidentialHousing = 'ResidentialHousing', // Xây dựng khu nhà ở

    // === Khoản 3 Điều 9: Nhóm A ≥ 3.000 tỷ ===
    Transport = 'Transport',                 // Giao thông (khác K2)
    WaterResources = 'WaterResources',       // Thủy lợi, cấp thoát nước
    Telecom = 'Telecom',                     // Bưu chính, viễn thông
    BuildingMaterials = 'BuildingMaterials', // Sản xuất vật liệu, Kỹ thuật điện

    // === Khoản 4 Điều 9: Nhóm A ≥ 2.000 tỷ ===
    Agriculture = 'Agriculture',             // Nông lâm ngư nghiệp
    UrbanInfra = 'UrbanInfra',               // Hạ tầng khu đô thị mới
    Industry = 'Industry',                   // Công nghiệp (khác K2, K3)

    // === Khoản 5 Điều 9: Nhóm A ≥ 1.600 tỷ ===
    Health = 'Health',                       // Y tế
    Education = 'Education',                 // Giáo dục
    Culture = 'Culture',                     // Văn hóa, thể thao
    Technology = 'Technology',               // Khoa học công nghệ
    Other = 'Other'                          // Các lĩnh vực khác
}

/**
 * Ngưỡng phân loại dự án - Luật Đầu tư công 58/2024/QH15
 * Căn cứ Điều 8, 9, 10, 11
 * Đơn vị: VND
 */
export const PROJECT_THRESHOLDS_2024 = {
    // Quan trọng quốc gia (Điều 8)
    NATIONAL_IMPORTANCE: 30_000_000_000_000, // 30.000 tỷ

    // Nhóm A - theo nhóm lĩnh vực (Điều 9)
    GROUP_A: {
        K2: 4_600_000_000_000,   // 4.600 tỷ - GT lớn, CN điện, Dầu khí, Luyện kim, Khu nhà ở
        K3: 3_000_000_000_000,   // 3.000 tỷ - GT khác, Thủy lợi, Viễn thông, Vật liệu XD
        K4: 2_000_000_000_000,   // 2.000 tỷ - Nông lâm, Khu đô thị, CN khác
        K5: 1_600_000_000_000,   // 1.600 tỷ - Y tế, GD, Văn hóa, KHCN, khác
    },

    // Nhóm B/C - ngưỡng dưới (Điều 10, 11): dưới mức này → Nhóm C
    GROUP_C: {
        K2: 240_000_000_000,     // 240 tỷ
        K3: 160_000_000_000,     // 160 tỷ
        K4: 120_000_000_000,     // 120 tỷ
        K5: 90_000_000_000,      // 90 tỷ
    },

    // Thời hạn bố trí vốn tối đa (năm)
    CAPITAL_DURATION: {
        GROUP_QN: 6,
        GROUP_A: 6,
        GROUP_B: 4,
        GROUP_C: 3
    }
} as const;

export interface Project {
    ProjectID: string;
    ProjectName: string;
    GroupCode: ProjectGroup;
    InvestmentType: InvestmentType;
    DecisionMakerID: number;
    TotalInvestment: number;
    CapitalSource: string;
    LocationCode: string;
    ApprovalDate: string;
    Status: ProjectStatus;
    IsEmergency: boolean;
    ImageUrl?: string;
    Progress?: number;
    PaymentProgress?: number;
    InvestorName?: string;
    MainContractorName?: string;
    ConstructionType?: string;
    ConstructionGrade?: string;
    Members?: string[];
    ProjectNumber?: string;
    Version?: string;
    Objective?: string;
    CompetentAuthority?: string;
    Duration?: string;
    ManagementForm?: string;
    DecisionNumber?: string;
    DecisionDate?: string;
    DecisionAuthority?: string;
    IsODA?: boolean;
    Coordinates?: { lat: number; lng: number; };
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string;
        SyncError?: string;
    };
    Stage?: ProjectStage;
    Sector?: ProjectSector;
    CalculatedGroup?: ProjectGroup;
    PhysicalProgress?: number;
    FinancialProgress?: number;
    RequiresBIM?: boolean;
    BIMStatus?: 'NotRequired' | 'Pending' | 'EIRApproved' | 'BEPApproved' | 'Active';
    CDEProjectCode?: string;
    ApplicableStandards?: string;
    FeasibilityContractor?: string;
    SurveyContractor?: string;
    ReviewContractor?: string;
    // TT24/2025/TT-BXD
    InvestmentScale?: string;
    // Quy mô công trình
    TotalEstimate?: number;
    SiteArea?: number;
    ConstructionArea?: number;
    FloorArea?: number;
    BuildingHeight?: number;
    BuildingDensity?: number;
    LandUseCoefficient?: number;
    AboveGroundFloors?: number;
    BasementFloors?: number;
    PlanningApprovalNumber?: string;
    PlanningApprovalDate?: string;
    PCCCApprovalNumber?: string;
    PCCCApprovalDate?: string;
    PCCCApprovalAgency?: string;
    EnvApprovalNumber?: string;
    EnvApprovalDate?: string;
    EnvApprovalType?: string;
    AppraisalResultNumber?: string;
    AppraisalResultDate?: string;
    AppraisalAgency?: string;
    CostBreakdown?: CostBreakdown;
    DesignAppraisalNumber?: string;
    DesignAppraisalDate?: string;
    DesignApprovalNumber?: string;
    DesignApprovalDate?: string;
    DesignApprovalAuthority?: string;
    DesignContractor?: string;
    SupervisionContractor?: string;
    ConstructionPermitNumber?: string;
    ConstructionPermitDate?: string;
    ConstructionPermitAgency?: string;
    ActualStartDateConstruction?: string;
    InsuranceContract?: string;
    InsuranceValue?: number;
    AcceptanceResult?: string;
    AcceptanceDate?: string;
    HandoverDate?: string;
    TT24CompletionPct?: number;
    StartDate?: string;
    ExpectedEndDate?: string;
    ActualEndDate?: string;
    ManagementBoard?: number; // Ban QLDA (1–7)
    ProvinceCode?: string; // Mã tỉnh/thành phố (01-96)
    DecisionLevelBeforeHandover?: string;
    OldInvestor?: string;
    TransferDecision?: string;
    CurrentStatusCode?: number;
    // Quyết định chủ trương đầu tư
    PolicyDecisionLevel?: string;     // Cấp quyết định: QH, CP, Thủ tướng, Bộ trưởng, UBND tỉnh
    PolicyDecisionNumber?: string;    // Số QĐ chủ trương (CBT số)
    PolicyDecisionDate?: string;      // Ngày ban hành QĐ chủ trương
    PolicyDecisionAuthority?: string; // Cơ quan ban hành
    // Cơ cấu nguồn vốn chi tiết
    BudgetAllocations?: BudgetAllocations;
    // Hình thức thực hiện
    BiddingForm?: string;             // Hình thức lựa chọn nhà thầu
    // Dữ liệu nhóm (JSONB)
    KHVInfo?: KHVInfo;
    ImplementationTracking?: ImplementationTracking;
    AdjustedApproval?: AdjustedApproval;
    ContractorDetails?: ContractorDetails;
    ProjectManagement?: ProjectManagement;
    ProjectStatusInfo?: ProjectStatusInfo;
}

/** Quyết định giao KHV + kế hoạch vốn */
export interface KHVInfo {
    decisionNumber?: string;    // Số QĐ giao KHV
    decisionDate?: string;      // Ngày QĐ
    fundingSourceCode?: string; // Mã nguồn
    total?: number;             // Tổng KHV
    year2025Extended?: number;  // 2025 kéo dài
    year2026?: number;          // 2026
}

/** Theo dõi khối lượng & giải ngân */
export interface ImplementationTracking {
    totalVolume?: number;           // Tổng cộng KL thực hiện
    ytdVolume?: number;             // Lũy kế đầu năm
    periodVolume?: number;          // Thực hiện trong kỳ
    volumeRate?: number;            // Tỷ lệ %
    totalDisbursed?: number;        // Tổng cộng giải ngân
    ytdDisbursed?: number;          // Lũy kế đầu năm (giải ngân)
    periodDisbursed?: number;       // Giải ngân trong kỳ
    disbursementRate?: number;      // Tỷ lệ giải ngân
    remainingCapital?: number;      // KH vốn còn lại
    completedNotDisbursed?: number; // KL hoàn thành chưa giải ngân
}

/** QĐ điều chỉnh dự án + thời gian điều chỉnh & thực tế */
export interface AdjustedApproval {
    decisionNumber?: string;  // Số QĐ phê duyệt điều chỉnh
    decisionDate?: string;    // Ngày QĐ điều chỉnh
    totalEstimate?: number;   // Tổng dự toán sau điều chỉnh
    adjustedStartDate?: string; // Khởi công sau điều chỉnh
    adjustedEndDate?: string;   // Hoàn thành sau điều chỉnh
    actualStartDate?: string;   // Thực tế khởi công
    actualEndDate?: string;     // Thực tế hoàn thành
}

/** Đơn vị thực hiện (nhà thầu thi công) */
export interface ContractorDetails {
    unitName?: string;        // Tên đơn vị
    taxCode?: string;         // Mã số thuế
    address?: string;         // Địa chỉ
    contractContent?: string; // Nội dung Hợp đồng
    packageNumber?: string;   // Số hiệu gói thầu
    legalRep?: string;        // Đại diện Pháp luật
    siteManager?: string;     // Chỉ huy công trường
    techStaff?: string;       // Cán bộ kỹ thuật
}

/** Nhân sự quản lý dự án (nội bộ) */
export interface ProjectManagement {
    accountant?: string;      // Kế toán theo dõi
    projectDirector?: string; // Giám đốc QLDA
    techStaff?: string;       // Cán bộ kỹ thuật
}

/** Hiện trạng & tình hình dự án */
export interface ProjectStatusInfo {
    isSettled?: boolean;                // Đã hoàn thành Quyết toán
    isHandedOverNotSettled?: boolean;   // Đã nghiệm thu Bàn giao chưa QT
    isCompletedNotHandedOver?: boolean; // Đã hoàn thành chưa bàn giao
    auditStatus?: string;               // Tình hình thanh tra kiểm toán
    delayReason?: string;               // Nguyên nhân chậm tiến độ
    delayResponsibility?: string;       // Trách nhiệm
    delayResolution?: string;           // Kết quả xử lý
    delayRecommendation?: string;       // Kiến nghị, đề xuất giải pháp
    notes?: string;                     // Ghi chú
}

/** Chi tiết tổng mức đầu tư — TT24 A.II.7.4 */
export interface CostBreakdown {
    landClearance?: number; // GPM&B - Giải phóng mặt bằng
    construction?: number;  // XL - Xây lắp
    equipment?: number;     // Thiết bị
    consultancy?: number;   // TV - Tư vấn
    management?: number;    // QL - Quản lý dự án
    other?: number;         // Chi phí khác
    contingency?: number;   // Dự phòng
}

/** Cơ cấu nguồn vốn chi tiết */
export interface BudgetAllocations {
    BudgetNSTW?: number;              // Ngân sách Trung ương
    BudgetNSDiaphuong?: number;       // Ngân sách địa phương
    BudgetLoan?: number;              // Vốn vay
    BudgetODA?: number;               // Vốn ODA/nước ngoài
    BudgetOtherNSNN?: number;         // Vốn khác ngoài NSNN
}

/** Quyết định phê duyệt chủ trương đầu tư */
export interface InvestmentPolicyDecision {
    DecisionNumber: string;
    DecisionDate: string;
    Authority: string;
    Objectives: string;
    PreliminaryInvestment: number;
    CapitalSources: string[];
    Duration: string;
    Location: string;
    DocumentPath?: string;
}

/** Báo cáo nghiên cứu khả thi (BCNCKT / F/S) */
export interface FeasibilityStudy {
    ReportID: string;
    ProjectID: string;
    ApprovalNumber: string;
    ApprovalDate: string;
    ApprovalAuthority: string;
    TotalInvestment: number;
    DesignPhases: 1 | 2 | 3;
    ConstructionScale: string;
    MainTechnology: string;
    EnvironmentalApproval?: string;
    DocumentPath?: string;
}

/** Lịch sử chuyển giai đoạn */
export interface StageTransition {
    stage: ProjectStage;
    startDate: string;
    endDate?: string;
    decisionNumber?: string;
    decisionDate?: string;
}

/** Interface mở rộng đầy đủ cho Project */
export interface ProjectExtended extends Project {
    Stage: ProjectStage;
    StageHistory: StageTransition[];
    InvestmentPolicy?: InvestmentPolicyDecision;
    FeasibilityStudy?: FeasibilityStudy;
    Sector: ProjectSector;
    CalculatedGroup?: ProjectGroup;
    PhysicalProgress: number;
    FinancialProgress: number;
    RequiresBIM: boolean;
    BIMStatus: 'NotRequired' | 'Pending' | 'EIRApproved' | 'BEPApproved' | 'Active';
    CDEProjectCode?: string;
}

export interface ConstructionWork {
    WorkID: string;
    ProjectID: string;
    WorkName: string;
    Grade: number;
    Type: string;
    DesignLevel: number;
    Address: string;
}

export interface SelectedMember {
    employeeId: string;
    role: string;
}

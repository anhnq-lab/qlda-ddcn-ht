// Bidding & Contractor types

// 4.1. Bảng dữ liệu: Contractors (Tổ chức Nhà thầu)

export type ContractorType =
    | 'Construction'    // Thi công xây lắp
    | 'Consultancy'     // Tư vấn thiết kế
    | 'Supervision'     // Tư vấn giám sát
    | 'Survey'          // Khảo sát
    | 'Appraisal'       // Thẩm tra
    | 'Supplier'        // Cung cấp vật tư/thiết bị
    | 'Other';          // Khác

export const CONTRACTOR_TYPE_LABELS: Record<ContractorType, string> = {
    Construction: 'Thi công',
    Consultancy: 'Tư vấn',
    Supervision: 'Giám sát',
    Survey: 'Khảo sát',
    Appraisal: 'Thẩm tra',
    Supplier: 'Vật tư',
    Other: 'Khác',
};

export interface Contractor {
    ContractorID: string;
    CapCertCode: string;
    FullName: string;
    IsForeign: boolean;           // Legacy — kept for backward compat
    ContractorType: ContractorType;
    OpLicenseNo?: string;
    Address: string;
    ContactInfo: string;
    TaxCode?: string;
    Representative?: string;
    EstablishedYear?: number;
    Email?: string;
    Website?: string;
}

// 5.1. Bảng dữ liệu: BiddingPackages (Gói thầu)
export enum PackageStatus {
    Selection = 'Selection',       // Lựa chọn nhà thầu
    Execution = 'Execution',       // Đang thực hiện
    Completed = 'Completed',       // Kết thúc
}

/** Kế hoạch lựa chọn nhà thầu (KHLCNT) */
export interface ProcurementPlan {
    PlanID: string;
    ProjectID: string;
    PlanCode?: string;           // Số hiệu KHLCNT (e.g. PL2500231393)
    PlanName: string;            // Tên KHLCNT
    PlanType: 'EGP' | 'Legacy';  // Phân loại
    DecisionNumber?: string;     // Số QĐ phê duyệt KHLCNT
    DecisionDate?: string;
    DecisionAgency?: string;
    MSCPlanCode?: string;        // Mã trên muasamcong.vn
    TotalValue?: number;         // Tổng giá gói thầu (tính tự động)
    Status: 'Active' | 'Completed' | 'Cancelled';
    Notes?: string;
    CreatedAt?: string;
    UpdatedAt?: string;
}

/**
 * Hạn mức áp dụng hình thức lựa chọn nhà thầu theo NĐ 214/2025/NĐ-CP
 */
export const BIDDING_THRESHOLDS = {
    DIRECT_PURCHASE: 50_000_000,
    CDT_SIMPLIFIED_ESTIMATE: 500_000_000,
    CDT_SIMPLIFIED_CONSULTANCY: 800_000_000,
    CDT_SIMPLIFIED_CONSTRUCTION: 2_000_000_000,
    ONLINE_QUOTATION_ESTIMATE: 2_000_000_000,
    ONLINE_QUOTATION_PROJECT: 5_000_000_000,
    COMPETITIVE_SHOPPING: 10_000_000_000,
} as const;

/** Phân loại hình thức LCNT áp dụng theo hạn mức NĐ 214/2025 */
export type ApplicableSelectionMethod =
    | 'DirectPurchase'
    | 'SimplifiedCDT'
    | 'NormalCDT'
    | 'OnlineQuotation'
    | 'CompetitiveShopping'
    | 'OpenBidding';

export interface PackagePersonnel {
    name: string;
    title: string;    // Chức vụ/chức danh
    role: string;     // Vai trò trong gói thầu
    certNo?: string;  // Số chứng chỉ hành nghề
}

export interface BiddingPackage {
    PackageID: string;
    ProjectID: string;
    PlanID?: string;              // FK → ProcurementPlan
    PackageNumber: string;
    PackageName: string;
    Price: number;
    SelectionMethod:
    | 'OpenBidding'
    | 'LimitedBidding'
    | 'Appointed'
    | 'CompetitiveShopping'
    | 'DirectProcurement'
    | 'SelfExecution'
    | 'CommunityParticipation';
    SelectionProcedure?:
    | 'OneStageOneEnvelope'
    | 'OneStageTwoEnvelope'
    | 'TwoStageOneEnvelope'
    | 'TwoStageTwoEnvelope'
    | 'Reduced'
    | 'Normal';
    BidType: 'Online' | 'Offline';
    ContractType:
    | 'LumpSum'
    | 'UnitPrice'
    | 'AdjustableUnitPrice'
    | 'TimeBased'
    | 'Percentage'
    | 'Mixed';
    Field?:
    | 'Construction'
    | 'Consultancy'
    | 'NonConsultancy'
    | 'Goods'
    | 'Mixed';
    Status: PackageStatus;
    KHLCNTCode?: string;
    NotificationCode?: string;
    PostingDate?: string;
    BidClosingDate?: string;
    BidOpeningDate?: string;
    DecisionNumber?: string;
    DecisionDate?: string;
    WinningContractorID?: string;
    WinningPrice?: number;
    ApprovalDate_Result?: string;
    Duration?: string;
    ContractID?: string;
    FundingSource?: string;
    Description?: string;
    SelectionDuration?: string;
    SelectionStartDate?: string;
    HasOption?: boolean;
    ApplicableMethod?: ApplicableSelectionMethod;
    IsSimplifiedCDT?: boolean;
    SimplifiedReason?: string;
    RequiresAppraisal?: boolean;
    BidFee?: number;
    EstimatePrice?: number;
    DecisionAgency?: string;
    DecisionFile?: string;
    PlanGroupName?: string;
    PlanDecisionNumber?: string;
    PlanDecisionDate?: string;
    MSCPlanCode?: string;
    MSCPackageLink?: string;
    MSCPublishStatus?: 'NotRequired' | 'Pending' | 'Published' | 'Overdue';
    SortOrder?: number;
    // Báo cáo đấu thầu — Biểu 01A PL2
    BiddingScope?: 'Domestic' | 'International';    // Phạm vi: Trong nước / Quốc tế
    BiddersCount?: number;                           // Số nhà thầu nộp HSDT/HSĐX
    EvaluationBiddersCount?: number;                 // Số NTh vào bước đánh giá tài chính
    Personnel?: PackagePersonnel[];                  // Nhân sự nhà thầu tham gia gói thầu
}

/** Tài liệu cần đăng tải trên muasamcong.vn */
export interface MSCPublishingRequirement {
    documentType: string;
    description: string;
    isRequired: boolean;
    legalBasis: string;
    status: 'NotDone' | 'Done' | 'NotApplicable' | 'Overdue';
    deadline?: string;
}

// Risk & Issue Management
export enum RiskLevel {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Critical = 'Critical'
}

export interface PackageIssue {
    IssueID: string;
    PackageID: string;
    Title: string;
    Description: string;
    Status: 'Open' | 'Resolved' | 'InProgress';
    Severity: RiskLevel;
    ReportedDate: string;
    Reporter: string;
}

export interface PackageHealthCheck {
    score: number;
    riskLevel: RiskLevel;
    factors: string[];
    recommendation: string;
}

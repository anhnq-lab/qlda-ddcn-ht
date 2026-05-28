// Capital & Disbursement types

export interface CapitalAllocation {
    AllocationID: string;
    ProjectID: string;
    Year: number;
    Amount: number;
    Source: 'NganSachTrungUong' | 'NganSachDiaPhuong' | 'ODA' | 'Khac';
    DecisionNumber?: string;
    DateAssigned: string;
    DisbursedAmount?: number;
}

// Disbursement (Giải ngân) — NĐ 99/2021/NĐ-CP
export interface Disbursement {
    DisbursementID: string;
    ProjectID: string;
    CapitalPlanID?: string;
    AllocationID?: string;
    PaymentID?: number;
    Amount: number;
    Date: string;
    TreasuryCode?: string;
    FormType?: string;
    Description?: string;
    Status: 'Pending' | 'Approved' | 'Rejected';
    Type?: 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';
    Source?: 'NSTW' | 'NSĐP' | 'ODA' | 'Khác';
    InvoiceNumber?: string;
    Notes?: string;
    ContractNumber?: string;
    CumulativeBefore?: number;
    AdvanceBalance?: number;
}

// Capital Summary Extended (Tổng hợp vốn)
export interface CapitalSummaryExtended {
    totalInvestment: number;
    totalAllocated: number;
    totalDisbursed: number;
    totalAdvance: number;
    advanceRecovered: number;
    advanceBalance: number;
    completionPayment: number;
    disbursementRate: number;
    yearlyTarget: number;
    yearlyDisbursed: number;
}

// Capital Plan (Kế hoạch vốn) — Luật ĐTC 58/2024
export interface CapitalPlan {
    PlanID: string;
    ProjectID: string;
    Year: number;
    Amount: number;
    DecisionNumber?: string;
    DateAssigned?: string;
    Source: string;
    DisbursedAmount?: number;
    Status?: 'Draft' | 'Approved' | 'Allocated' | 'Closed';
    // Mid-term plan fields (Luật 58/2024 Điều 49-55)
    PlanType?: 'mid_term' | 'annual';
    PeriodStart?: number;
    PeriodEnd?: number;
    ApprovalStatus?: 'draft' | 'submitted' | 'approved' | 'adjusted';
    ApprovedBy?: string;
    ApprovedDate?: string;
    Notes?: string;
    LuyKeNghiemThu?: number;
}

// ─── Summary page data models (trang tổng hợp) ─────────

/** Capital plan row with joined project name (DB snake_case) */
export interface CapitalPlanRow {
    plan_id: string;
    project_id: string;
    project_name?: string;
    year: number;
    amount: number;
    disbursed_amount: number;
    luy_ke_nghiem_thu: number;
    source: string;
    decision_number: string;
    date_assigned: string;
    plan_type: 'mid_term' | 'annual' | string;
    period_start: number;
    period_end: number;
    approval_status: string;
    approved_by: string;
    approved_date: string;
    notes: string;
}

/** Disbursement plan row (KH giải ngân theo tháng) */
export interface DisbursementPlanRow {
    id: string;
    project_id: string;
    project_name?: string;
    year: number;
    month: number;
    planned_amount: number;
}

/** Disbursement row (giao dịch giải ngân thực tế) */
export interface DisbursementRow {
    disbursement_id: string;
    project_id: string;
    project_name?: string;
    capital_plan_id?: string;
    amount: number;
    date: string;
    status: string;
    form_type?: string;
    treasury_code?: string;
}

/** Disbursement plan item */
export interface DisbursementPlanItem {
    Id: string;
    ProjectID: string;
    Year: number;
    Month: number;
    PlannedAmount: number;
    ActualAmount: number;
    Notes: string;
}

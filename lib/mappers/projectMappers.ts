/**
 * Project Mappers — snake_case (DB) ↔ PascalCase (Frontend)
 * Includes Project, BiddingPackage, ProcurementPlan, CapitalAllocation
 */
import type {
    Project, ProjectGroup, InvestmentType, ProjectStatus,
    BiddingPackage, CapitalAllocation,
} from '../../types';
import { PackageStatus } from '../../types';

export const dbToProject = (row: any): Project => ({
    ProjectID: row.project_id,
    ProjectName: row.project_name,
    GroupCode: row.group_code?.trim() as ProjectGroup,
    InvestmentType: row.investment_type as InvestmentType,
    TotalInvestment: Number(row.total_investment) || 0,
    CapitalSource: row.capital_source || '',
    LocationCode: row.location_code || '',
    ApprovalDate: row.approval_date || '',
    Status: row.status as ProjectStatus,
    IsEmergency: row.is_emergency || false,
    ImageUrl: row.image_url || '',
    InvestorName: row.investor_name || '',
    MainContractorName: row.main_contractor_name || '',
    ConstructionType: row.construction_type || '',
    ConstructionGrade: row.construction_grade || '',
    ProjectNumber: row.project_number || '',
    Objective: row.objective || '',
    CompetentAuthority: row.competent_authority || '',
    Duration: row.duration || '',
    ManagementForm: row.management_form || '',
    DecisionNumber: row.decision_number || '',
    DecisionDate: row.decision_date || '',
    DecisionAuthority: row.decision_authority || '',
    IsODA: row.is_oda || false,
    Sector: row.sector || 'Other',
    RequiresBIM: row.requires_bim || false,
    BIMStatus: row.bim_status || 'NotRequired',
    Coordinates: row.coordinates || undefined,
    Stage: row.stage || 'Preparation',
    FeasibilityContractor: row.feasibility_contractor || '',
    SurveyContractor: row.survey_contractor || '',
    DesignContractor: row.design_contractor || '',
    SupervisionContractor: row.supervision_contractor || '',
    ReviewContractor: row.review_contractor || '',
    ApplicableStandards: row.applicable_standards || '',
    StartDate: row.start_date || '',
    ExpectedEndDate: row.expected_end_date || '',
    ActualEndDate: row.actual_end_date || '',
    InvestmentScale: row.investment_scale || '',
    CostBreakdown: row.cost_breakdown || {},
    HandoverDate: row.handover_date || '',
    ManagementBoard: row.management_board || undefined,
    ProvinceCode: row.province_code || '',
    DecisionLevelBeforeHandover: row.decision_level_before_handover || '',
    OldInvestor: row.old_investor || '',
    TransferDecision: row.transfer_decision || '',
    CurrentStatusCode: row.current_status_code ? Number(row.current_status_code) : undefined,
    BiddingForm: row.bidding_form || '',
    ContractorDetails: row.contractor_details || {},
    ProjectManagement: row.project_management || {},
    SpecialtyType: row.specialty_type || '',
});

export const projectToDb = (p: Partial<Project>) => {
    const result: Record<string, any> = {};
    if (p.ProjectID !== undefined) result.project_id = p.ProjectID;
    if (p.ProjectName !== undefined) result.project_name = p.ProjectName;
    if (p.GroupCode !== undefined) result.group_code = p.GroupCode;
    if (p.InvestmentType !== undefined) result.investment_type = p.InvestmentType;
    if (p.TotalInvestment !== undefined) result.total_investment = p.TotalInvestment;
    if (p.CapitalSource !== undefined) result.capital_source = p.CapitalSource;
    if (p.Status !== undefined) result.status = p.Status;
    if (p.IsEmergency !== undefined) result.is_emergency = p.IsEmergency;
    if (p.ImageUrl !== undefined) result.image_url = p.ImageUrl;
    if (p.InvestorName !== undefined) result.investor_name = p.InvestorName;
    if (p.MainContractorName !== undefined) result.main_contractor_name = p.MainContractorName;
    if (p.ConstructionType !== undefined) result.construction_type = p.ConstructionType;
    if (p.ConstructionGrade !== undefined) result.construction_grade = p.ConstructionGrade;
    if (p.LocationCode !== undefined) result.location_code = p.LocationCode;
    if (p.CompetentAuthority !== undefined) result.competent_authority = p.CompetentAuthority;
    if (p.ManagementForm !== undefined) result.management_form = p.ManagementForm;
    if (p.Objective !== undefined) result.objective = p.Objective;
    if (p.ProjectNumber !== undefined) result.project_number = p.ProjectNumber;
    if (p.Duration !== undefined) result.duration = p.Duration;
    if (p.Stage !== undefined) result.stage = p.Stage;
    if (p.Sector !== undefined) result.sector = p.Sector;
    if (p.RequiresBIM !== undefined) result.requires_bim = p.RequiresBIM;
    if (p.DecisionNumber !== undefined) result.decision_number = p.DecisionNumber;
    if (p.DecisionDate !== undefined) result.decision_date = p.DecisionDate === '' ? null : p.DecisionDate;
    if (p.DecisionAuthority !== undefined) result.decision_authority = p.DecisionAuthority;
    if (p.StartDate !== undefined) result.start_date = p.StartDate === '' ? null : p.StartDate;
    if (p.ExpectedEndDate !== undefined) result.expected_end_date = p.ExpectedEndDate === '' ? null : p.ExpectedEndDate;
    if (p.InvestmentScale !== undefined) result.investment_scale = p.InvestmentScale;
    if (p.CostBreakdown !== undefined) result.cost_breakdown = p.CostBreakdown;
    if (p.FeasibilityContractor !== undefined) result.feasibility_contractor = p.FeasibilityContractor;
    if (p.SurveyContractor !== undefined) result.survey_contractor = p.SurveyContractor;
    if (p.ReviewContractor !== undefined) result.review_contractor = p.ReviewContractor;
    if (p.ApplicableStandards !== undefined) result.applicable_standards = p.ApplicableStandards;
    if (p.DesignContractor !== undefined) result.design_contractor = p.DesignContractor;
    if (p.SupervisionContractor !== undefined) result.supervision_contractor = p.SupervisionContractor;
    if (p.ApprovalDate !== undefined) result.approval_date = p.ApprovalDate === '' ? null : p.ApprovalDate;
    if (p.IsODA !== undefined) result.is_oda = p.IsODA;
    if (p.BIMStatus !== undefined) result.bim_status = p.BIMStatus;
    if (p.ActualEndDate !== undefined) result.actual_end_date = p.ActualEndDate === '' ? null : p.ActualEndDate;
    if (p.Coordinates !== undefined) result.coordinates = p.Coordinates;
    if (p.HandoverDate !== undefined) result.handover_date = p.HandoverDate === '' ? null : p.HandoverDate;
    if (p.ManagementBoard !== undefined) result.management_board = p.ManagementBoard;
    if (p.ProvinceCode !== undefined) result.province_code = p.ProvinceCode;
    if (p.DecisionLevelBeforeHandover !== undefined) result.decision_level_before_handover = p.DecisionLevelBeforeHandover;
    if (p.OldInvestor !== undefined) result.old_investor = p.OldInvestor;
    if (p.TransferDecision !== undefined) result.transfer_decision = p.TransferDecision;
    if (p.CurrentStatusCode !== undefined) result.current_status_code = p.CurrentStatusCode;
    if (p.BiddingForm !== undefined) result.bidding_form = p.BiddingForm;
    if (p.ContractorDetails !== undefined) result.contractor_details = p.ContractorDetails;
    if (p.ProjectManagement !== undefined) result.project_management = p.ProjectManagement;
    if (p.SpecialtyType !== undefined) result.specialty_type = p.SpecialtyType;
    return result;
};

export const dbToBiddingPackage = (row: any): BiddingPackage => ({
    PackageID: row.package_id,
    ProjectID: row.project_id,
    PackageNumber: row.package_number,
    PackageName: row.package_name,
    Price: Number(row.price) || 0,
    SelectionMethod: row.selection_method || '',
    BidType: row.bid_type || '',
    ContractType: row.contract_type || '',
    Status: (row.status as PackageStatus) || PackageStatus.Selection,
    NotificationCode: row.notification_code || '',
    PostingDate: row.posting_date || '',
    BidClosingDate: row.bid_closing_date || '',
    EstimatePrice: Number(row.estimate_price) || 0,
    WinningContractorID: row.winning_contractor_id || '',
    WinningPrice: row.winning_price !== null && row.winning_price !== undefined ? Number(row.winning_price) : undefined,
    Field: row.field || '',
    Duration: row.duration || '',
    BidFee: Number(row.bid_fee) || 0,
    DecisionNumber: row.decision_number || '',
    DecisionDate: row.decision_date || '',
    DecisionAgency: row.decision_agency || '',
    DecisionFile: row.decision_file || '',
    MSCPackageLink: row.msc_package_link || '',
    MSCPublishStatus: row.msc_publish_status || 'NotRequired',
    SortOrder: row.sort_order ?? 0,
    FundingSource: row.funding_source || '',
    Description: row.description || '',
    SelectionDuration: row.selection_duration || '',
    SelectionStartDate: row.selection_start_date || '',
    SelectionProcedure: row.selection_procedure || '',
    HasOption: row.has_option || false,
    Personnel: Array.isArray(row.personnel) ? row.personnel : [],
    BidOpeningDate: row.bid_opening_date || '',
    ApprovalDate_Result: row.approval_date_result || '',
    ContractID: row.contract_id || '',
    BiddingScope: row.bidding_scope || undefined,
    BiddersCount: row.bidders_count ? Number(row.bidders_count) : undefined,
    EvaluationBiddersCount: row.evaluation_bidders_count ? Number(row.evaluation_bidders_count) : undefined,
    WinningConsortium: Array.isArray(row.winning_consortium) ? row.winning_consortium : [],
    // Tiến độ thực hiện
    CompletionPct: row.completion_pct !== null && row.completion_pct !== undefined ? Number(row.completion_pct) : undefined,
    CompletionUpdatedAt: row.completion_updated_at || undefined,
    // Join data (khi select với contractors)
    WinningContractorName: row.contractors?.full_name || row.winning_contractor_name || undefined,
});

export const biddingPackageToDb = (bp: Partial<BiddingPackage>) => ({
    ...(bp.PackageID !== undefined && { package_id: bp.PackageID }),
    ...(bp.ProjectID !== undefined && { project_id: bp.ProjectID }),
    ...(bp.PackageNumber !== undefined && { package_number: bp.PackageNumber }),
    ...(bp.PackageName !== undefined && { package_name: bp.PackageName }),
    ...(bp.Price !== undefined && { price: bp.Price }),
    ...(bp.SelectionMethod !== undefined && { selection_method: bp.SelectionMethod }),
    ...(bp.BidType !== undefined && { bid_type: bp.BidType }),
    ...(bp.ContractType !== undefined && { contract_type: bp.ContractType }),
    ...(bp.Status !== undefined && { status: bp.Status }),
    ...(bp.Duration !== undefined && { duration: bp.Duration }),
    ...(bp.MSCPackageLink !== undefined && { msc_package_link: bp.MSCPackageLink }),
    ...(bp.MSCPublishStatus !== undefined && { msc_publish_status: bp.MSCPublishStatus }),
    ...(bp.SortOrder !== undefined && { sort_order: bp.SortOrder }),
    ...(bp.FundingSource !== undefined && { funding_source: bp.FundingSource }),
    ...(bp.Description !== undefined && { description: bp.Description }),
    ...(bp.SelectionDuration !== undefined && { selection_duration: bp.SelectionDuration }),
    ...(bp.SelectionStartDate !== undefined && { selection_start_date: bp.SelectionStartDate }),
    ...(bp.SelectionProcedure !== undefined && { selection_procedure: bp.SelectionProcedure }),
    ...(bp.HasOption !== undefined && { has_option: bp.HasOption }),
    ...(bp.NotificationCode !== undefined && { notification_code: bp.NotificationCode }),
    ...(bp.Field !== undefined && { field: bp.Field }),
    ...(bp.DecisionNumber !== undefined && { decision_number: bp.DecisionNumber }),
    ...(bp.DecisionDate !== undefined && { decision_date: bp.DecisionDate }),
    ...(bp.DecisionAgency !== undefined && { decision_agency: bp.DecisionAgency }),
    ...(bp.DecisionFile !== undefined && { decision_file: bp.DecisionFile }),
    // Bidding timeline
    ...(bp.PostingDate !== undefined && { posting_date: bp.PostingDate }),
    ...(bp.BidClosingDate !== undefined && { bid_closing_date: bp.BidClosingDate }),
    ...(bp.BidOpeningDate !== undefined && { bid_opening_date: bp.BidOpeningDate }),
    // Winning result
    ...(bp.WinningContractorID !== undefined && { winning_contractor_id: bp.WinningContractorID }),
    ...(bp.WinningPrice !== undefined && { winning_price: bp.WinningPrice }),
    ...(bp.ApprovalDate_Result !== undefined && { approval_date_result: bp.ApprovalDate_Result }),
    ...(bp.ContractID !== undefined && { contract_id: bp.ContractID }),
    // Pricing & fees
    ...(bp.EstimatePrice !== undefined && { estimate_price: bp.EstimatePrice }),
    ...(bp.BidFee !== undefined && { bid_fee: bp.BidFee }),
    // Reporting (Biểu 01A PL2)
    ...(bp.BiddingScope !== undefined && { bidding_scope: bp.BiddingScope }),
    ...(bp.BiddersCount !== undefined && { bidders_count: bp.BiddersCount }),
    ...(bp.EvaluationBiddersCount !== undefined && { evaluation_bidders_count: bp.EvaluationBiddersCount }),
    ...(bp.Personnel !== undefined && { personnel: bp.Personnel }),
    ...(bp.WinningConsortium !== undefined && { winning_consortium: bp.WinningConsortium }),
    // Tiến độ thực hiện
    ...(bp.CompletionPct !== undefined && { completion_pct: bp.CompletionPct }),
    ...(bp.CompletionUpdatedAt !== undefined && { completion_updated_at: bp.CompletionUpdatedAt }),
});



export const dbToCapitalAllocation = (row: any): CapitalAllocation => ({
    AllocationID: row.plan_id,
    ProjectID: row.project_id,
    Year: row.year,
    Amount: Number(row.amount) || 0,
    Source: row.source || '',
    DecisionNumber: row.decision_number || '',
    DateAssigned: row.date_assigned || '',
    DisbursedAmount: Number(row.disbursed_amount) || 0,
});

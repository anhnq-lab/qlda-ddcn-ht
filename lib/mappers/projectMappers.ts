/**
 * Project Mappers — snake_case (DB) ↔ PascalCase (Frontend)
 * Includes Project, BiddingPackage, ProcurementPlan, CapitalAllocation
 */
import type {
    Project, ProjectGroup, InvestmentType, ProjectStatus,
    BiddingPackage, ProcurementPlan, CapitalAllocation,
} from '../../types';

export const dbToProject = (row: any): Project => ({
    ProjectID: row.project_id,
    ProjectName: row.project_name,
    GroupCode: row.group_code?.trim() as ProjectGroup,
    InvestmentType: row.investment_type as InvestmentType,
    DecisionMakerID: row.decision_maker_id ? parseInt(row.decision_maker_id) : 0,
    TotalInvestment: Number(row.total_investment) || 0,
    CapitalSource: row.capital_source || '',
    LocationCode: row.location_code || '',
    ApprovalDate: row.approval_date || '',
    Status: row.status as ProjectStatus,
    IsEmergency: row.is_emergency || false,
    ImageUrl: row.image_url || '',
    Progress: row.progress || 0,
    PaymentProgress: row.payment_progress || 0,
    InvestorName: row.investor_name || '',
    MainContractorName: row.main_contractor_name || '',
    ConstructionType: row.construction_type || '',
    ConstructionGrade: row.construction_grade || '',
    ProjectNumber: row.project_number || '',
    Version: row.version || '',
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
    CDEProjectCode: row.cde_project_code || '',
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
    PlanningApprovalNumber: row.planning_approval_number || '',
    PlanningApprovalDate: row.planning_approval_date || '',
    PCCCApprovalNumber: row.pccc_approval_number || '',
    PCCCApprovalDate: row.pccc_approval_date || '',
    PCCCApprovalAgency: row.pccc_approval_agency || '',
    EnvApprovalNumber: row.env_approval_number || '',
    EnvApprovalDate: row.env_approval_date || '',
    EnvApprovalType: row.env_approval_type || '',
    AppraisalResultNumber: row.appraisal_result_number || '',
    AppraisalResultDate: row.appraisal_result_date || '',
    AppraisalAgency: row.appraisal_agency || '',
    CostBreakdown: row.cost_breakdown || {},
    DesignAppraisalNumber: row.design_appraisal_number || '',
    DesignAppraisalDate: row.design_appraisal_date || '',
    DesignApprovalNumber: row.design_approval_number || '',
    DesignApprovalDate: row.design_approval_date || '',
    DesignApprovalAuthority: row.design_approval_authority || '',
    ConstructionPermitNumber: row.construction_permit_number || '',
    ConstructionPermitDate: row.construction_permit_date || '',
    ConstructionPermitAgency: row.construction_permit_agency || '',
    ActualStartDateConstruction: row.actual_start_date_construction || '',
    InsuranceContract: row.insurance_contract || '',
    InsuranceValue: Number(row.insurance_value) || 0,
    AcceptanceResult: row.acceptance_result || '',
    AcceptanceDate: row.acceptance_date || '',
    HandoverDate: row.handover_date || '',
    TT24CompletionPct: row.tt24_completion_pct || 0,
    ManagementBoard: row.management_board || undefined,
    ProvinceCode: row.province_code || '',
    // Quy mô công trình
    TotalEstimate: Number(row.total_estimate) || 0,
    SiteArea: Number(row.site_area) || 0,
    ConstructionArea: Number(row.construction_area) || 0,
    FloorArea: Number(row.floor_area) || 0,
    BuildingHeight: Number(row.building_height) || 0,
    BuildingDensity: Number(row.building_density) || 0,
    LandUseCoefficient: Number(row.land_use_coefficient) || 0,
    AboveGroundFloors: Number(row.above_ground_floors) || 0,
    BasementFloors: Number(row.basement_floors) || 0,
    DecisionLevelBeforeHandover: row.decision_level_before_handover || '',
    OldInvestor: row.old_investor || '',
    TransferDecision: row.transfer_decision || '',
    CurrentStatusCode: row.current_status_code ? Number(row.current_status_code) : undefined,
    PolicyDecisionLevel: row.policy_decision_level || '',
    PolicyDecisionNumber: row.policy_decision_number || '',
    PolicyDecisionDate: row.policy_decision_date || '',
    PolicyDecisionAuthority: row.policy_decision_authority || '',
    BudgetAllocations: row.budget_allocations || {},
    BiddingForm: row.bidding_form || '',
    KHVInfo: row.khv_info || {},
    ImplementationTracking: row.implementation_tracking || {},
    AdjustedApproval: row.adjusted_approval || {},
    ContractorDetails: row.contractor_details || {},
    ProjectManagement: row.project_management || {},
    ProjectStatusInfo: row.project_status_info || {},
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
    if (p.Progress !== undefined) result.progress = p.Progress;
    if (p.PaymentProgress !== undefined) result.payment_progress = p.PaymentProgress;
    if (p.InvestorName !== undefined) result.investor_name = p.InvestorName;
    if (p.MainContractorName !== undefined) result.main_contractor_name = p.MainContractorName;
    if (p.ConstructionType !== undefined) result.construction_type = p.ConstructionType;
    if (p.ConstructionGrade !== undefined) result.construction_grade = p.ConstructionGrade;
    if (p.LocationCode !== undefined) result.location_code = p.LocationCode;
    if (p.CompetentAuthority !== undefined) result.competent_authority = p.CompetentAuthority;
    if (p.ManagementForm !== undefined) result.management_form = p.ManagementForm;
    if (p.Version !== undefined) result.version = p.Version;
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
    if (p.PlanningApprovalNumber !== undefined) result.planning_approval_number = p.PlanningApprovalNumber;
    if (p.PlanningApprovalDate !== undefined) result.planning_approval_date = p.PlanningApprovalDate === '' ? null : p.PlanningApprovalDate;
    if (p.PCCCApprovalNumber !== undefined) result.pccc_approval_number = p.PCCCApprovalNumber;
    if (p.PCCCApprovalDate !== undefined) result.pccc_approval_date = p.PCCCApprovalDate === '' ? null : p.PCCCApprovalDate;
    if (p.PCCCApprovalAgency !== undefined) result.pccc_approval_agency = p.PCCCApprovalAgency;
    if (p.EnvApprovalNumber !== undefined) result.env_approval_number = p.EnvApprovalNumber;
    if (p.EnvApprovalDate !== undefined) result.env_approval_date = p.EnvApprovalDate === '' ? null : p.EnvApprovalDate;
    if (p.EnvApprovalType !== undefined) result.env_approval_type = p.EnvApprovalType;
    if (p.AppraisalResultNumber !== undefined) result.appraisal_result_number = p.AppraisalResultNumber;
    if (p.AppraisalResultDate !== undefined) result.appraisal_result_date = p.AppraisalResultDate === '' ? null : p.AppraisalResultDate;
    if (p.AppraisalAgency !== undefined) result.appraisal_agency = p.AppraisalAgency;
    if (p.CostBreakdown !== undefined) result.cost_breakdown = p.CostBreakdown;
    if (p.DesignAppraisalNumber !== undefined) result.design_appraisal_number = p.DesignAppraisalNumber;
    if (p.DesignAppraisalDate !== undefined) result.design_appraisal_date = p.DesignAppraisalDate === '' ? null : p.DesignAppraisalDate;
    if (p.DesignApprovalNumber !== undefined) result.design_approval_number = p.DesignApprovalNumber;
    if (p.DesignApprovalDate !== undefined) result.design_approval_date = p.DesignApprovalDate === '' ? null : p.DesignApprovalDate;
    if (p.DesignApprovalAuthority !== undefined) result.design_approval_authority = p.DesignApprovalAuthority;
    if (p.FeasibilityContractor !== undefined) result.feasibility_contractor = p.FeasibilityContractor;
    if (p.SurveyContractor !== undefined) result.survey_contractor = p.SurveyContractor;
    if (p.ReviewContractor !== undefined) result.review_contractor = p.ReviewContractor;
    if (p.ApplicableStandards !== undefined) result.applicable_standards = p.ApplicableStandards;
    if (p.DesignContractor !== undefined) result.design_contractor = p.DesignContractor;
    if (p.SupervisionContractor !== undefined) result.supervision_contractor = p.SupervisionContractor;
    if (p.ApprovalDate !== undefined) result.approval_date = p.ApprovalDate === '' ? null : p.ApprovalDate;
    if (p.IsODA !== undefined) result.is_oda = p.IsODA;
    if (p.BIMStatus !== undefined) result.bim_status = p.BIMStatus;
    if (p.CDEProjectCode !== undefined) result.cde_project_code = p.CDEProjectCode;
    if (p.ActualEndDate !== undefined) result.actual_end_date = p.ActualEndDate === '' ? null : p.ActualEndDate;
    if (p.Coordinates !== undefined) result.coordinates = p.Coordinates;
    if (p.ConstructionPermitNumber !== undefined) result.construction_permit_number = p.ConstructionPermitNumber;
    if (p.ConstructionPermitDate !== undefined) result.construction_permit_date = p.ConstructionPermitDate === '' ? null : p.ConstructionPermitDate;
    if (p.ConstructionPermitAgency !== undefined) result.construction_permit_agency = p.ConstructionPermitAgency;
    if (p.ActualStartDateConstruction !== undefined) result.actual_start_date_construction = p.ActualStartDateConstruction === '' ? null : p.ActualStartDateConstruction;
    if (p.InsuranceContract !== undefined) result.insurance_contract = p.InsuranceContract;
    if (p.InsuranceValue !== undefined) result.insurance_value = p.InsuranceValue;
    if (p.AcceptanceResult !== undefined) result.acceptance_result = p.AcceptanceResult;
    if (p.AcceptanceDate !== undefined) result.acceptance_date = p.AcceptanceDate === '' ? null : p.AcceptanceDate;
    if (p.HandoverDate !== undefined) result.handover_date = p.HandoverDate === '' ? null : p.HandoverDate;
    if (p.TT24CompletionPct !== undefined) result.tt24_completion_pct = p.TT24CompletionPct;
    if (p.ManagementBoard !== undefined) result.management_board = p.ManagementBoard;
    if (p.ProvinceCode !== undefined) result.province_code = p.ProvinceCode;
    // Quy mô công trình
    if (p.TotalEstimate !== undefined) result.total_estimate = p.TotalEstimate;
    if (p.SiteArea !== undefined) result.site_area = p.SiteArea;
    if (p.ConstructionArea !== undefined) result.construction_area = p.ConstructionArea;
    if (p.FloorArea !== undefined) result.floor_area = p.FloorArea;
    if (p.BuildingHeight !== undefined) result.building_height = p.BuildingHeight;
    if (p.BuildingDensity !== undefined) result.building_density = p.BuildingDensity;
    if (p.LandUseCoefficient !== undefined) result.land_use_coefficient = p.LandUseCoefficient;
    if (p.AboveGroundFloors !== undefined) result.above_ground_floors = p.AboveGroundFloors;
    if (p.BasementFloors !== undefined) result.basement_floors = p.BasementFloors;
    if (p.DecisionLevelBeforeHandover !== undefined) result.decision_level_before_handover = p.DecisionLevelBeforeHandover;
    if (p.OldInvestor !== undefined) result.old_investor = p.OldInvestor;
    if (p.TransferDecision !== undefined) result.transfer_decision = p.TransferDecision;
    if (p.CurrentStatusCode !== undefined) result.current_status_code = p.CurrentStatusCode;
    if (p.PolicyDecisionLevel !== undefined) result.policy_decision_level = p.PolicyDecisionLevel;
    if (p.PolicyDecisionNumber !== undefined) result.policy_decision_number = p.PolicyDecisionNumber;
    if (p.PolicyDecisionDate !== undefined) result.policy_decision_date = p.PolicyDecisionDate === '' ? null : p.PolicyDecisionDate;
    if (p.PolicyDecisionAuthority !== undefined) result.policy_decision_authority = p.PolicyDecisionAuthority;
    if (p.BudgetAllocations !== undefined) result.budget_allocations = p.BudgetAllocations;
    if (p.BiddingForm !== undefined) result.bidding_form = p.BiddingForm;
    if (p.KHVInfo !== undefined) result.khv_info = p.KHVInfo;
    if (p.ImplementationTracking !== undefined) result.implementation_tracking = p.ImplementationTracking;
    if (p.AdjustedApproval !== undefined) result.adjusted_approval = p.AdjustedApproval;
    if (p.ContractorDetails !== undefined) result.contractor_details = p.ContractorDetails;
    if (p.ProjectManagement !== undefined) result.project_management = p.ProjectManagement;
    if (p.ProjectStatusInfo !== undefined) result.project_status_info = p.ProjectStatusInfo;
    return result;
};

export const dbToBiddingPackage = (row: any): BiddingPackage => ({
    PackageID: row.package_id,
    ProjectID: row.project_id,
    PlanID: row.plan_id || undefined,
    PackageNumber: row.package_number,
    PackageName: row.package_name,
    Price: Number(row.price) || 0,
    SelectionMethod: row.selection_method || '',
    BidType: row.bid_type || '',
    ContractType: row.contract_type || '',
    Status: row.status || 'Planning',
    NotificationCode: row.notification_code || '',
    PostingDate: row.posting_date || '',
    BidClosingDate: row.bid_closing_date || '',
    EstimatePrice: Number(row.estimate_price) || 0,
    WinningContractorID: row.winning_contractor_id || '',
    WinningPrice: Number(row.winning_price) || 0,
    KHLCNTCode: row.khlcnt_code || '',
    Field: row.field || '',
    Duration: row.duration || '',
    BidFee: Number(row.bid_fee) || 0,
    DecisionNumber: row.decision_number || '',
    DecisionDate: row.decision_date || '',
    DecisionAgency: row.decision_agency || '',
    DecisionFile: row.decision_file || '',
    PlanGroupName: row.plan_group_name || '',
    PlanDecisionNumber: row.plan_decision_number || '',
    PlanDecisionDate: row.plan_decision_date || '',
    MSCPlanCode: row.msc_plan_code || '',
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
});

export const biddingPackageToDb = (bp: Partial<BiddingPackage>) => ({
    ...(bp.PackageID !== undefined && { package_id: bp.PackageID }),
    ...(bp.ProjectID !== undefined && { project_id: bp.ProjectID }),
    ...(bp.PlanID !== undefined && { plan_id: bp.PlanID }),
    ...(bp.PackageNumber !== undefined && { package_number: bp.PackageNumber }),
    ...(bp.PackageName !== undefined && { package_name: bp.PackageName }),
    ...(bp.Price !== undefined && { price: bp.Price }),
    ...(bp.SelectionMethod !== undefined && { selection_method: bp.SelectionMethod }),
    ...(bp.BidType !== undefined && { bid_type: bp.BidType }),
    ...(bp.ContractType !== undefined && { contract_type: bp.ContractType }),
    ...(bp.Status !== undefined && { status: bp.Status }),
    ...(bp.Duration !== undefined && { duration: bp.Duration }),
    ...(bp.PlanGroupName !== undefined && { plan_group_name: bp.PlanGroupName }),
    ...(bp.PlanDecisionNumber !== undefined && { plan_decision_number: bp.PlanDecisionNumber }),
    ...(bp.PlanDecisionDate !== undefined && { plan_decision_date: bp.PlanDecisionDate }),
    ...(bp.MSCPlanCode !== undefined && { msc_plan_code: bp.MSCPlanCode }),
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
    ...(bp.KHLCNTCode !== undefined && { khlcnt_code: bp.KHLCNTCode }),
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
});

export const dbToProcurementPlan = (row: any): ProcurementPlan => ({
    PlanID: row.plan_id,
    ProjectID: row.project_id,
    PlanCode: row.plan_code || '',
    PlanName: row.plan_name || '',
    PlanType: row.plan_type || 'EGP',
    DecisionNumber: row.decision_number || '',
    DecisionDate: row.decision_date || '',
    DecisionAgency: row.decision_agency || '',
    MSCPlanCode: row.msc_plan_code || '',
    TotalValue: Number(row.total_value) || 0,
    Status: row.status || 'Active',
    Notes: row.notes || '',
    CreatedAt: row.created_at,
    UpdatedAt: row.updated_at,
});

export const procurementPlanToDb = (plan: Partial<ProcurementPlan>) => ({
    ...(plan.PlanID !== undefined && { plan_id: plan.PlanID }),
    ...(plan.ProjectID !== undefined && { project_id: plan.ProjectID }),
    ...(plan.PlanCode !== undefined && { plan_code: plan.PlanCode }),
    ...(plan.PlanName !== undefined && { plan_name: plan.PlanName }),
    ...(plan.PlanType !== undefined && { plan_type: plan.PlanType }),
    ...(plan.DecisionNumber !== undefined && { decision_number: plan.DecisionNumber }),
    ...(plan.DecisionDate !== undefined && { decision_date: plan.DecisionDate }),
    ...(plan.DecisionAgency !== undefined && { decision_agency: plan.DecisionAgency }),
    ...(plan.MSCPlanCode !== undefined && { msc_plan_code: plan.MSCPlanCode }),
    ...(plan.TotalValue !== undefined && { total_value: plan.TotalValue }),
    ...(plan.Status !== undefined && { status: plan.Status }),
    ...(plan.Notes !== undefined && { notes: plan.Notes }),
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

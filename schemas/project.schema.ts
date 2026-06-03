/**
 * Project Zod Schemas — Validation cho entity Dự Án
 *
 * Dùng để validate form input trước khi gửi Supabase.
 * Tập trung error messages Tiếng Việt.
 * Compatible with Zod v4+
 */
import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────
export const ProjectGroupSchema = z.enum(['QN', 'A', 'B', 'C'], {
    error: 'Vui lòng chọn nhóm dự án',
});

export const InvestmentTypeSchema = z.number().int().min(1).max(4);

export const ProjectStatusSchema = z.coerce.number().int().min(1).max(3);

// ─── Create Project Input ─────────────────────────────────
export const ProjectCreateSchema = z.object({
    ProjectName: z.string()
        .min(3, 'Tên dự án phải có ít nhất 3 ký tự')
        .max(500, 'Tên dự án không được quá 500 ký tự'),

    GroupCode: ProjectGroupSchema,

    InvestmentType: InvestmentTypeSchema,

    TotalInvestment: z.coerce.number()
        .min(0, 'Tổng mức đầu tư phải ≥ 0'),

    CapitalSource: z.string()
        .min(1, 'Vui lòng nhập nguồn vốn'),

    LocationCode: z.string()
        .min(1, 'Vui lòng nhập địa điểm dự án'),

    Status: ProjectStatusSchema.default(1),

    IsEmergency: z.boolean().default(false),
    IsODA: z.boolean().default(false),

    // Optional fields
    DecisionMakerID: z.coerce.number().int().optional(),
    ProjectNumber: z.string().optional(),
    Objective: z.string().max(2000, 'Mục tiêu đầu tư không quá 2000 ký tự').optional(),
    CompetentAuthority: z.string().optional(),
    Duration: z.string().optional(),
    ManagementForm: z.string().optional(),
    DecisionNumber: z.string().optional(),
    DecisionDate: z.string().optional(),
    DecisionAuthority: z.string().optional(),
    ApprovalDate: z.string().optional(),
    InvestorName: z.string().optional(),
    InvestmentScale: z.string().optional(),
    ConstructionType: z.string().optional(),
    ConstructionGrade: z.string().optional(),
    ManagementBoard: z.coerce.number().int().min(1).max(7).optional(),
    ProvinceCode: z.string().optional(),
    SpecialtyType: z.string().optional(),
    SpecialtyDetails: z.string().optional(),

    // Quy mô công trình
    SiteArea: z.coerce.number().min(0).optional(),
    ConstructionArea: z.coerce.number().min(0).optional(),
    FloorArea: z.coerce.number().min(0).optional(),
    BuildingHeight: z.coerce.number().min(0).optional(),
    AboveGroundFloors: z.coerce.number().int().min(0).optional(),
    BasementFloors: z.coerce.number().int().min(0).optional(),

    Coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
    }).optional(),
});

// ─── Update Project Input ─────────────────────────────────
export const ProjectUpdateSchema = ProjectCreateSchema.partial().extend({
    ProjectID: z.string().uuid('ID dự án không hợp lệ'),
});

// ─── Types inferred from schemas ──────────────────────────
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;

// ─── Full CreateProjectModal Form Schema ─────────────────
/**
 * Schema đầy đủ cho CreateProjectModal — tất cả các tab.
 *
 * Design note: all fields are declared without `.default()` so that
 * `z.infer<typeof ProjectModalFormSchema>` produces fully-required types
 * compatible with `useForm<ProjectModalFormValues>`. Default values are
 * provided via `defaultValues` in the RHF `useForm()` call.
 *
 * Required fields: ProjectID, ProjectName, GroupCode, InvestmentType, StartDate.
 * All other fields accept empty strings / 0 and can be filled in later.
 */
export const ProjectModalFormSchema = z.object({
    // ── Tab General: Thông tin cơ bản ──
    ProjectID: z.string().min(1, 'Mã dự án là bắt buộc'),
    ProjectName: z.string().min(3, 'Tên dự án phải có ít nhất 3 ký tự').max(500, 'Tên dự án không được quá 500 ký tự'),
    GroupCode: ProjectGroupSchema,
    InvestmentType: InvestmentTypeSchema,
    StartDate: z.string().min(1, 'Vui lòng chọn ngày khởi công'),

    // ── Tab Investment: Cơ cấu vốn & Chi phí ──
    TotalInvestment: z.coerce.number().min(0),
    CapitalSource: z.string(),
    ProvinceCode: z.string(),
    LocationCode: z.string(),
    ConstructionType: z.string(),
    ConstructionGrade: z.string(),
    CompetentAuthority: z.string(),
    InvestorName: z.string(),
    Duration: z.string(),
    ManagementBoard: z.coerce.number().int().min(1),
    ApprovalDate: z.string(),
    DecisionNumber: z.string(),

    // Quyết định chủ trương đầu tư
    PolicyDecisionLevel: z.string(),
    PolicyDecisionNumber: z.string(),
    PolicyDecisionDate: z.string(),
    PolicyDecisionAuthority: z.string(),

    // Phê duyệt dự án
    DecisionAuthority: z.string(),
    ExpectedEndDate: z.string(),

    // Mục tiêu & Quy mô
    Objective: z.string(),
    InvestmentScale: z.string(),

    // Quy mô công trình
    TotalEstimate: z.coerce.number().min(0),
    SiteArea: z.coerce.number().min(0),
    ConstructionArea: z.coerce.number().min(0),
    FloorArea: z.coerce.number().min(0),
    BuildingHeight: z.coerce.number().min(0),
    BuildingDensity: z.coerce.number().min(0),
    LandUseCoefficient: z.coerce.number().min(0),
    AboveGroundFloors: z.coerce.number().int().min(0).optional(),
    BasementFloors: z.coerce.number().int().min(0).optional(),

    // Cơ cấu nguồn vốn chi tiết
    BudgetAllocations: z.object({
        BudgetNSTW: z.coerce.number().min(0),
        BudgetNSDiaphuong: z.coerce.number().min(0),
        BudgetLoan: z.coerce.number().min(0),
        BudgetODA: z.coerce.number().min(0),
        BudgetOtherNSNN: z.coerce.number().min(0),
    }),

    // Hạng mục chi phí (JSONB)
    CostBreakdown: z.record(z.string(), z.coerce.number()),

    // ── Tab Contractors: Nhà thầu & Tiêu chuẩn ──
    ApplicableStandards: z.string().optional(),
    FeasibilityContractor: z.string().optional(),
    SurveyContractor: z.string().optional(),
    ReviewContractor: z.string().optional(),
    BiddingForm: z.string().optional(),

    // ── JSONB groups ──
    KHVInfo: z.record(z.string(), z.unknown()).optional(),
    ImplementationTracking: z.record(z.string(), z.unknown()).optional(),
    AdjustedApproval: z.record(z.string(), z.unknown()).optional(),
    ContractorDetails: z.record(z.string(), z.unknown()).optional(),
    ProjectManagement: z.record(z.string(), z.unknown()).optional(),
    ProjectStatusInfo: z.record(z.string(), z.unknown()).optional(),

    // ── Tab Status: Hiện trạng & Bàn giao ──
    DecisionLevelBeforeHandover: z.string().optional(),
    OldInvestor: z.string().optional(),
    TransferDecision: z.string().optional(),
    CurrentStatusCode: z.number().int().min(1).max(10).nullable().optional(),
    SpecialtyType: z.string().optional(),
    SpecialtyDetails: z.string().optional(),

    // Giai đoạn dự án (Chuẩn bị / Thực hiện / Kết thúc)
    Stage: z.string().optional(),

    // Cờ phân loại
    IsEmergency: z.boolean().optional(),
    IsODA: z.boolean().optional(),

    // Nhà thầu chính
    MainContractorName: z.string().optional(),

    // Ảnh dự án & Tọa độ GPS
    ImageUrl: z.string().optional(),
    Coordinates: z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
    }).partial().optional(),
});

export type ProjectModalFormValues = z.infer<typeof ProjectModalFormSchema>;

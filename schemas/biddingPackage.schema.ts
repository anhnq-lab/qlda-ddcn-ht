/**
 * BiddingPackage Zod Schema — Validation cho Gói Thầu
 *
 * Tuân thủ NĐ 214/2025 và Luật Đấu thầu.
 * Compatible with Zod v4+
 */
import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────
export const FieldSchema = z.enum(['Construction', 'Consultancy', 'NonConsultancy', 'Goods', 'Mixed']);
export const SelectionMethodSchema = z.enum([
    'OpenBidding', 'LimitedBidding', 'Appointed',
    'CompetitiveShopping', 'DirectProcurement', 'SelfExecution', 'CommunityParticipation',
]);
export const SelectionProcedureSchema = z.enum([
    'OneStageOneEnvelope', 'OneStageTwoEnvelope',
    'TwoStageOneEnvelope', 'TwoStageTwoEnvelope',
    'Reduced', 'Normal',
]);
export const BidTypeSchema = z.enum(['Online', 'Offline']);
export const ContractTypeSchema = z.enum([
    'LumpSum', 'UnitPrice', 'AdjustableUnitPrice', 'TimeBased', 'Percentage', 'Mixed',
]);
export const BiddingScopeSchema = z.enum(['Domestic', 'International']);
export const HasOptionSchema = z.enum(['true', 'false']);

// ─── Main Form Schema ─────────────────────────────────────
export const BiddingPackageFormSchema = z.object({
    // Required fields
    PackageNumber: z.string().min(1, 'Số hiệu gói thầu là bắt buộc'),
    PackageName: z.string().min(1, 'Tên gói thầu là bắt buộc'),
    Price: z.string().min(1, 'Giá gói thầu là bắt buộc').refine(
        (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
        'Giá gói thầu phải lớn hơn 0',
    ),
    Duration: z.string().min(1, 'Thời gian thực hiện là bắt buộc'),

    // Enum selects with defaults
    Field: FieldSchema,
    SelectionMethod: SelectionMethodSchema,
    SelectionProcedure: SelectionProcedureSchema,
    BidType: BidTypeSchema,
    ContractType: ContractTypeSchema,
    Status: z.string().min(1),
    BiddingScope: BiddingScopeSchema,
    HasOption: HasOptionSchema,

    // Optional text / date fields (all strings, empty string = absent)
    KHLCNTCode: z.string(),
    NotificationCode: z.string(),
    DecisionNumber: z.string(),
    DecisionDate: z.string(),
    PostingDate: z.string(),
    BidClosingDate: z.string(),
    BidOpeningDate: z.string(),
    WinningContractorID: z.string(),
    WinningPrice: z.string(),
    ApprovalDate_Result: z.string(),
    FundingSource: z.string(),
    Description: z.string(),
    SelectionDuration: z.string(),
    SelectionStartDate: z.string(),
    // Plan Group
    PlanGroupName: z.string(),
    PlanDecisionNumber: z.string(),
    PlanDecisionDate: z.string(),
    // Báo cáo đấu thầu
    BiddersCount: z.string(),
    EvaluationBiddersCount: z.string(),
});

export type BiddingPackageFormValues = z.infer<typeof BiddingPackageFormSchema>;

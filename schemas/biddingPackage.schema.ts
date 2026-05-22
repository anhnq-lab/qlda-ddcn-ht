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
    'OpenBidding', 'LimitedBidding', 'Appointed', 'AppointedSimplified',
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

// Helper to parse Vietnamese formatted numeric string to standard float/integer
export const parseFormattedNumber = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    let s = val.trim();
    if (!s) return 0;

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
        // Standard Vietnamese format: 1.234.567,89
        s = s.replace(/\./g, '').replace(/,/g, '.');
    } else if (hasComma) {
        // E.g. 1,234,567 or 123,45
        const parts = s.split(',');
        if (parts.length > 2 || (parts[1].length !== 2 && parts[1].length !== 1)) {
            s = s.replace(/,/g, '');
        } else {
            s = s.replace(/,/g, '.');
        }
    } else if (hasDot) {
        // E.g. 1.234.567 or 123.45
        const parts = s.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
            s = s.replace(/\./g, '');
        }
    }

    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed;
};

export const BiddingPackageFormSchema = z.object({
    // Required fields
    PackageNumber: z.string().min(1, 'Số hiệu gói thầu là bắt buộc'),
    PackageName: z.string().min(1, 'Tên gói thầu là bắt buộc'),
    Price: z.string().min(1, 'Giá gói thầu là bắt buộc').refine(
        (v) => {
            const parsed = parseFormattedNumber(v);
            return !isNaN(parsed) && parsed > 0;
        },
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
    NotificationCode: z.string(),
    DecisionNumber: z.string(),
    DecisionDate: z.string(),
    PostingDate: z.string(),
    BidClosingDate: z.string(),
    BidOpeningDate: z.string(),
    WinningContractorID: z.string(),
    WinningPrice: z.string().refine(
        (v) => {
            if (!v) return true;
            const parsed = parseFormattedNumber(v);
            return !isNaN(parsed) && parsed >= 0;
        },
        'Giá trúng thầu phải là số không âm',
    ),
    ApprovalDate_Result: z.string(),
    FundingSource: z.string(),
    Description: z.string(),
    SelectionDuration: z.string(),
    SelectionStartDate: z.string(),
    // Báo cáo đấu thầu
    BiddersCount: z.string().refine(
        (v) => !v || (!isNaN(parseInt(v)) && parseInt(v) >= 0),
        'Số lượng nhà thầu tham dự phải là số nguyên không âm',
    ),
    EvaluationBiddersCount: z.string().refine(
        (v) => !v || (!isNaN(parseInt(v)) && parseInt(v) >= 0),
        'Số lượng nhà thầu vào đánh giá TC phải là số nguyên không âm',
    ),
});

export type BiddingPackageFormValues = z.infer<typeof BiddingPackageFormSchema>;

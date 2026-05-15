/**
 * Contract & Payment Zod Schemas (Zod v4+)
 */
import { z } from 'zod';

// ─── Contract ─────────────────────────────────────────────
export const ContractCreateSchema = z.object({
    ContractName: z.string()
        .min(3, 'Tên hợp đồng phải có ít nhất 3 ký tự')
        .max(500, 'Tên hợp đồng không quá 500 ký tự'),

    PackageID: z.string().uuid('Gói thầu không hợp lệ'),
    ContractorID: z.string().uuid('Nhà thầu không hợp lệ'),
    ProjectID: z.string().uuid('Dự án không hợp lệ'),

    ContractType: z.string().optional(),

    SignDate: z.string().min(1, 'Vui lòng nhập ngày ký'),

    Value: z.coerce.number()
        .min(0, 'Giá trị hợp đồng phải ≥ 0'),

    AdvanceRate: z.coerce.number()
        .min(0, 'Tỷ lệ tạm ứng phải ≥ 0')
        .max(100, 'Tỷ lệ tạm ứng không quá 100%')
        .default(0),

    Warranty: z.coerce.number()
        .min(0, 'Bảo hành phải ≥ 0 tháng')
        .default(12),

    Status: z.coerce.number().int().min(1).max(3).default(1),
    HasVAT: z.boolean().default(true),
    Scope: z.string().optional(),
    DurationMonths: z.coerce.number().int().min(0).optional(),
    StartDate: z.string().optional(),
    EndDate: z.string().optional(),
    PaymentTerms: z.string().optional(),
});

export const ContractUpdateSchema = ContractCreateSchema.partial().extend({
    ContractID: z.string().uuid('ID hợp đồng không hợp lệ'),
});

// ─── Payment ──────────────────────────────────────────────
export const PaymentTypeSchema = z.enum(['Advance', 'Volume'], {
    error: 'Loại thanh toán phải là Tạm ứng hoặc Khối lượng',
});

export const PaymentStatusSchema = z.enum(
    ['Draft', 'Pending', 'Approved', 'Transferred', 'Rejected'],
    { error: 'Trạng thái thanh toán không hợp lệ' }
);

export const PaymentCreateSchema = z.object({
    ContractID: z.string().uuid('Hợp đồng không hợp lệ'),
    ProjectID: z.string().uuid('Dự án không hợp lệ').optional(),

    BatchNo: z.coerce.number().int()
        .min(1, 'Số đợt thanh toán phải ≥ 1'),

    Type: PaymentTypeSchema,

    Amount: z.coerce.number()
        .min(0, 'Số tiền thanh toán phải ≥ 0'),

    TreasuryRef: z.string()
        .min(1, 'Vui lòng nhập số tham chiếu Kho bạc'),

    Status: PaymentStatusSchema.default('Draft'),
    Description: z.string().optional(),
    RequestDate: z.string().optional(),
});

export const PaymentUpdateSchema = PaymentCreateSchema.partial().extend({
    PaymentID: z.coerce.number().int(),
});

// ─── Contract Modal Form Schema ────────────────────────────
/**
 * Form schema for ContractModal — all fields are strings because they
 * come from HTML inputs; numeric conversion happens on submit.
 */
export const ContractFormSchema = z.object({
    projectId: z.string().min(1, 'Vui lòng chọn Dự án'),
    packageId: z.string().min(1, 'Vui lòng chọn Gói thầu'),
    contractorId: z.string().min(1, 'Vui lòng chọn Nhà thầu'),
    contractId: z.string().min(1, 'Vui lòng nhập số hợp đồng'),
    contractName: z.string().optional().default(''),
    signDate: z.string().min(1, 'Vui lòng chọn ngày ký'),
    value: z.string().refine(
        (v) => v !== '' && Number(v) > 0,
        { message: 'Giá trị phải > 0' }
    ),
    advanceRate: z.string().optional().default('15'),
    warranty: z.string().optional().default('12'),
    scope: z.string().optional().default(''),
    durationMonths: z.string().optional().default(''),
    startDate: z.string().optional().default(''),
    endDate: z.string().optional().default(''),
    paymentTerms: z.string().optional().default(''),
});

// ─── Types ────────────────────────────────────────────────
export type ContractCreateInput = z.infer<typeof ContractCreateSchema>;
export type ContractUpdateInput = z.infer<typeof ContractUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof PaymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof PaymentUpdateSchema>;
/** Output type (after parse/transform) */
export type ContractFormValues = z.infer<typeof ContractFormSchema>;
/** Input type (what useForm<> needs — matches the resolver's TFieldValues) */
export type ContractFormInput = z.input<typeof ContractFormSchema>;

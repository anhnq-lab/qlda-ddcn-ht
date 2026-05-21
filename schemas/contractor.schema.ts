/**
 * Contractor Zod Schemas (Zod v4+)
 */
import { z } from 'zod';

// ─── Contractor Create ─────────────────────────────────
export const ContractorCreateSchema = z.object({
    FullName: z.string()
        .min(2, 'Tên nhà thầu phải có ít nhất 2 ký tự')
        .max(300, 'Tên nhà thầu không quá 300 ký tự'),

    TaxCode: z.string()
        .min(10, 'Mã số thuế phải có ít nhất 10 ký tự')
        .max(14, 'Mã số thuế không quá 14 ký tự')
        .regex(/^[0-9-]+$/, 'Mã số thuế chỉ chứa số và dấu gạch ngang')
        .optional()
        .or(z.literal('')),

    Address: z.string()
        .max(500, 'Địa chỉ không quá 500 ký tự')
        .optional()
        .or(z.literal('')),

    Phone: z.string()
        .min(10, 'Số điện thoại phải có ít nhất 10 số')
        .max(15, 'Số điện thoại không quá 15 số')
        .regex(/^[0-9+\-\s]+$/, 'Số điện thoại không hợp lệ')
        .optional()
        .or(z.literal('')),

    Email: z.string()
        .email('Email không hợp lệ')
        .optional()
        .or(z.literal('')),

    Representative: z.string()
        .max(100, 'Tên người đại diện không quá 100 ký tự')
        .optional()
        .or(z.literal('')),

    RepresentativeTitle: z.string()
        .max(100, 'Chức danh không quá 100 ký tự')
        .optional()
        .or(z.literal('')),

    BankAccount: z.string()
        .max(30, 'Số tài khoản không quá 30 ký tự')
        .optional()
        .or(z.literal('')),

    BankName: z.string()
        .max(200, 'Tên ngân hàng không quá 200 ký tự')
        .optional()
        .or(z.literal('')),

    BusinessType: z.string().optional(),

    Rating: z.coerce.number()
        .min(0, 'Xếp hạng phải ≥ 0')
        .max(5, 'Xếp hạng không quá 5')
        .optional(),

    Notes: z.string().optional(),
});

export const ContractorUpdateSchema = ContractorCreateSchema.partial().extend({
    ContractorID: z.string().uuid('ID nhà thầu không hợp lệ'),
});

// ─── Types ─────────────────────────────────────────────
export type ContractorCreateInput = z.infer<typeof ContractorCreateSchema>;
export type ContractorUpdateInput = z.infer<typeof ContractorUpdateSchema>;

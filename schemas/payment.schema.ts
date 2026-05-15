/**
 * Payment Zod Schema — Validation cho Phiếu Thanh Toán
 *
 * Compatible with Zod v4+
 */
import { z } from 'zod';

export const PaymentFormSchema = z.object({
    contractId: z.string().min(1, 'Vui lòng chọn hợp đồng'),
    batchNo: z.number().int().min(1, 'Đợt thanh toán phải từ 1 trở lên'),
    type: z.string().min(1, 'Vui lòng chọn loại thanh toán'),
    amount: z.number().positive('Số tiền phải lớn hơn 0'),
    treasuryRef: z.string().min(1, 'Vui lòng nhập mã giao dịch kho bạc'),
    note: z.string(),
    formType: z.enum(['03a', '04a']),
});

export type PaymentFormValues = z.infer<typeof PaymentFormSchema>;

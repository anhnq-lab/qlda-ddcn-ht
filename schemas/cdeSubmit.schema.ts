/**
 * CDESubmit Zod Schema — Validation cho Nộp Hồ Sơ CDE
 *
 * Compatible with Zod v4+
 */
import { z } from 'zod';

export const CDESubmitFormSchema = z.object({
    folderId: z.string().min(1, 'Vui lòng chọn thư mục nộp hồ sơ'),
    discipline: z.string().min(1, 'Vui lòng chọn lĩnh vực'),
    docType: z.string().min(1, 'Vui lòng chọn loại hồ sơ'),
    notes: z.string(),
    sensitivityLevel: z.number().min(1).max(4).default(1),
});

export type CDESubmitFormValues = z.infer<typeof CDESubmitFormSchema>;

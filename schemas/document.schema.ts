/**
 * Document Zod Schemas (Zod v4+)
 */
import { z } from 'zod';

import { DocCategory, ISO19650Status } from '../types/document.types';

// ─── Document Category ─────────────────────────────────
export const DocCategorySchema = z.nativeEnum(DocCategory, {
    error: 'Loại hồ sơ không hợp lệ',
});

// ─── ISO 19650 Status ──────────────────────────────────
export const ISO19650StatusSchema = z.nativeEnum(ISO19650Status, {
    error: 'Trạng thái ISO 19650 không hợp lệ',
});

// ─── Document Create ───────────────────────────────────
export const DocumentCreateSchema = z.object({
    DocName: z.string()
        .min(2, 'Tên tài liệu phải có ít nhất 2 ký tự')
        .max(500, 'Tên tài liệu không quá 500 ký tự'),

    ReferenceID: z.string()
        .min(1, 'Vui lòng nhập số hiệu tài liệu'),

    ProjectID: z.string().uuid('Dự án không hợp lệ').optional(),

    Category: DocCategorySchema.default(DocCategory.Legal),

    StoragePath: z.string()
        .min(1, 'Vui lòng chọn file hoặc nhập đường dẫn'),

    IsDigitized: z.boolean().default(true),

    Version: z.string()
        .max(20, 'Phiên bản không quá 20 ký tự')
        .optional()
        .or(z.literal('')),

    Size: z.string().optional(),

    FolderID: z.string().uuid().optional(),

    ISOStatus: ISO19650StatusSchema.optional(),

    Revision: z.string()
        .max(10, 'Mã revision không quá 10 ký tự')
        .optional()
        .or(z.literal('')),

    VersionGroupID: z.string().uuid().optional(),

    FileHash: z.string().optional(),

    IsLatest: z.boolean().default(true),
});

export const DocumentUpdateSchema = DocumentCreateSchema.partial().extend({
    DocID: z.coerce.number().int().min(1, 'ID tài liệu không hợp lệ'),
});

// ─── Types ─────────────────────────────────────────────
export type DocumentCreateInput = z.infer<typeof DocumentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof DocumentUpdateSchema>;

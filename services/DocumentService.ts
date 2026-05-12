// Document Attachments Service - Supabase CRUD + Storage
import { supabase } from '../lib/supabase';

// ============================================================
// TYPES
// ============================================================

export type RelatedType = 'contract' | 'payment' | 'acceptance' | 'settlement' | 'task';

export interface DocumentAttachment {
    id: string;
    relatedType: RelatedType;
    relatedId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    storagePath: string;
    description: string;
    uploadedBy: string;
    createdAt: string;
    publicUrl?: string;
}

// ============================================================
// DB MAPPERS
// ============================================================

const dbToDocument = (row: any): DocumentAttachment => ({
    id: row.id,
    relatedType: row.related_type,
    relatedId: row.related_id,
    fileName: row.file_name || '',
    fileSize: row.file_size || 0,
    fileType: row.file_type || '',
    storagePath: row.storage_path || '',
    description: row.description || '',
    uploadedBy: row.uploaded_by || '',
    createdAt: row.created_at,
});

// ============================================================
// FILE LABELS
// ============================================================

export const FILE_TYPE_LABELS: Record<RelatedType, string[]> = {
    contract: ['Hợp đồng ký', 'Phụ lục HĐ', 'Bảo lãnh thực hiện HĐ', 'Khác'],
    payment: ['Đề nghị thanh toán', 'Hóa đơn', 'Bảng xác nhận KL', 'Chứng từ kho bạc', 'Khác'],
    acceptance: ['Biên bản nghiệm thu', 'Hồ sơ hoàn công', 'Báo cáo chất lượng', 'Khác'],
    settlement: ['Báo cáo quyết toán', 'Biên bản thanh lý HĐ', 'Bảo lãnh bảo hành', 'Khác'],
    task: ['Tài liệu thiết kế', 'Báo cáo tiến độ', 'Tài liệu tham khảo', 'Khác'],
};

// ============================================================
// SERVICE
// ============================================================

export class DocumentService {
    static async getByRelated(relatedType: RelatedType, relatedId: string): Promise<DocumentAttachment[]> {
        const { data, error } = await supabase
            .from('document_attachments')
            .select('*')
            .eq('related_type', relatedType)
            .eq('related_id', relatedId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch documents: ${error.message}`);

        return (data || []).map(row => {
            const doc = dbToDocument(row);
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(doc.storagePath);
            doc.publicUrl = urlData?.publicUrl;
            return doc;
        });
    }

    static async upload(
        file: File,
        relatedType: RelatedType,
        relatedId: string,
        description?: string
    ): Promise<DocumentAttachment> {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${relatedType}/${relatedId}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data, error } = await supabase
            .from('document_attachments')
            .insert({
                related_type: relatedType,
                related_id: relatedId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                storage_path: storagePath,
                description: description || '',
                uploaded_by: '',
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to save attachment: ${error.message}`);

        const doc = dbToDocument(data);
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(doc.storagePath);
        doc.publicUrl = urlData?.publicUrl;
        return doc;
    }

    static async delete(id: string, storagePath: string): Promise<void> {
        await supabase.storage.from('documents').remove([storagePath]);
        const { error } = await supabase
            .from('document_attachments')
            .delete()
            .eq('id', id);
        if (error) throw new Error(`Failed to delete attachment: ${error.message}`);
    }

    static formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    static getFileIcon(fileType: string): 'pdf' | 'image' | 'excel' | 'word' | 'other' {
        if (fileType.includes('pdf')) return 'pdf';
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.includes('sheet') || fileType.includes('excel')) return 'excel';
        if (fileType.includes('word') || fileType.includes('document')) return 'word';
        return 'other';
    }
}

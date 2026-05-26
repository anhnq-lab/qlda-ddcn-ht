import { useState, useEffect, useMemo, useCallback } from 'react';
import { Document, ProjectStage } from '@/types';
import { supabase } from '@/lib/supabase';
import { useDocuments, useFolders } from '@/hooks/useDocuments';

// Cross-reference mapping: legal doc keywords ↔ TT24 stt/labels
const DOC_CROSS_REFS = [
    { legalKeywords: ['chủ trương', 'qđ chủ trương'], tt24Stt: '1', tt24Label: 'Văn bản chủ trương đầu tư' },
    { legalKeywords: ['quy hoạch'], tt24Stt: '2', tt24Label: 'Quyết định phê duyệt Quy hoạch có liên quan' },
    { legalKeywords: ['pccc'], tt24Stt: '3.1', tt24Label: 'Văn bản kết quả thực hiện thủ tục về PCCC' },
    { legalKeywords: ['môi trường', 'đtm'], tt24Stt: '3.2', tt24Label: 'Văn bản kết quả thực hiện thủ tục về bảo vệ môi trường' },
    { legalKeywords: ['thẩm định', 'bcnckt', 'nghiên cứu khả thi'], tt24Stt: '4', tt24Label: 'Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi' },
    { legalKeywords: ['phê duyệt dự án'], tt24Stt: '5', tt24Label: 'Quyết định phê duyệt dự án (BCNCKT)' },
];

/** Map a Supabase row to our Document type */
const mapDbRow = (row: any, projectID: string): Document & Record<string, any> => ({
    DocID: row.doc_id,
    ReferenceID: row.reference_id || projectID,
    ProjectID: row.project_id,
    Category: row.category || 0,
    DocName: row.doc_name,
    StoragePath: row.storage_path,
    IsDigitized: row.is_digitized ?? true,
    UploadDate: row.upload_date ? new Date(row.upload_date).toLocaleDateString('vi-VN') : '',
    Version: row.version || 'P01.01',
    Size: row.size || '',
    ISOStatus: 'S0' as any,
    source: row.source,
    task_id: row.task_id,
    tt24_field: row.tt24_field,
    doc_type: row.doc_type || '',
    document_number: row.document_number || '',
    issue_date: row.issue_date || '',
    issuing_authority: row.issuing_authority || '',
    updated_by: row.updated_by || '',
    notes: row.notes || '',
    summary: row.summary || '',
    signer: row.signer || '',
    drafting_department: row.drafting_department || '',
    document_symbol: row.document_symbol || '',
    drafter: row.drafter || '',
    legal_status: row.legal_status || 'active',
});

/**
 * Custom hook that encapsulates all document-related data logic:
 * - Loads real docs from Supabase
 * - Merges with mock data + uploaded docs
 * - Computes stats, filtered lists, doc matching
 */
export function useProjectDocuments(projectID: string, projectStage: ProjectStage = ProjectStage.Execution) {
    const { data: folders = [] } = useFolders(projectID);
    const { data: documents = [], isLoading } = useDocuments('FLD-ROOT');

    const [dbDocs, setDbDocs] = useState<Document[]>([]);
    const [uploadedDocs, setUploadedDocs] = useState<Document[]>([]);

    // Load real documents from Supabase
    useEffect(() => {
        if (!projectID) return;
        const loadDocs = async () => {
            const { data } = await supabase
                .from('documents')
                .select('*')
                .eq('project_id', projectID)
                .order('upload_date', { ascending: false }) as any;
            if (data) {
                setDbDocs((data as any[]).map((row: any) => mapDbRow(row, projectID)));
            }
        };
        loadDocs();
    }, [projectID]);

    // All project documents (real from DB + uploaded)
    const projectDocuments = useMemo(() => {
        return [...uploadedDocs, ...dbDocs];
    }, [uploadedDocs, dbDocs]);

    // Dynamic stats
    const stats = useMemo(() => {
        const total = projectDocuments.length;
        return {
            total,
            approved: projectDocuments.filter((d: any) => d.ISOStatus === 'A1' || d.ISOStatus === 'A2').length,
            inProgress: projectDocuments.filter((d: any) => ['S1', 'S2', 'S3'].includes(d.ISOStatus)).length,
            wip: projectDocuments.filter((d: any) => d.ISOStatus === 'S0' || !d.ISOStatus).length,
        };
    }, [projectDocuments]);

    // Match documents to legal categories — enhanced with cross-ref mapping
    const matchDocToCategory = useCallback((keywords: string[]): (Document & { source?: string }) | undefined => {
        // 1. Direct keyword match in doc names
        const byKeyword = projectDocuments.find(doc => {
            const name = doc.DocName.toLowerCase();
            return keywords.some(kw => name.includes(kw.toLowerCase()));
        });
        if (byKeyword) return byKeyword as any;

        // 2. Cross-ref mapping: find mapping for keywords, then check tt24_field
        const crossRef = DOC_CROSS_REFS.find(ref =>
            ref.legalKeywords.some(kw =>
                keywords.some(k => k.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(k.toLowerCase()))
            )
        );
        if (crossRef) {
            const tt24Key = `doc_${crossRef.tt24Stt}_${crossRef.tt24Label}`;
            const byTT24 = projectDocuments.find((doc: any) => doc.tt24_field === tt24Key);
            if (byTT24) return byTT24 as any;
        }

        return undefined;
    }, [projectDocuments]);

    // Count docs per folder
    const folderDocCount = useCallback((folderId: string) => {
        return projectDocuments.filter(d => d.FolderID === folderId).length;
    }, [projectDocuments]);

    return {
        // Data
        folders,
        documents,
        dbDocs,
        setDbDocs,
        uploadedDocs,
        setUploadedDocs,
        projectDocuments,
        isLoading,

        // Computed
        stats,
        matchDocToCategory,
        folderDocCount,
    };
}

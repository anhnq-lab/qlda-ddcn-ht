import { useState, useCallback } from 'react';
import { generateDocument, DOCUMENT_TYPES, DocumentType } from '../../services/ai/documentDrafter';
import { generateNd30Docx } from '../../services/ai/docxGenerator';
export { DOCUMENT_TYPES };
export type { DocumentType };

export function useAIDocumentDraft(projectId: string) {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [draftContent, setDraftContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (selectedType: DocumentType | '') => {
        if (!selectedType) return;
        setLoading(true); setError(null); setDraftContent(null);
        try {
            const content = await generateDocument(projectId, selectedType as DocumentType);
            setDraftContent(content);
        } catch (e: any) {
            setError(e.message || 'Lỗi tạo văn bản');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const downloadDocx = useCallback(async (params: Parameters<typeof generateNd30Docx>[0]) => {
        setDownloading(true);
        try {
            const blob = await generateNd30Docx(params);
            return blob;
        } finally {
            setDownloading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setDraftContent(null);
        setError(null);
    }, []);

    return { loading, downloading, draftContent, error, generate, downloadDocx, reset, DOCUMENT_TYPES };
}

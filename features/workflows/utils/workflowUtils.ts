// ─── Workflow Shared Utilities ─────────────────────────────────
// Centralized helpers to eliminate code duplication across:
// NodeDetailPanel, SubTaskDetailPanel, WorkflowBuilderPanel, FlowchartViewer

import { supabase } from '../../../lib/supabase';

// ─── SLA Parser ────────────────────────────────────────────────
// Was duplicated in FlowchartViewer.parseSla() and WorkflowBuilderPanel.parseSla()
export function parseSla(formula?: string | null): string | null {
    if (!formula) return null;
    const val = formula.match(/^(\d+)/)?.[0] || '';
    if (formula.endsWith('wd')) return `${val} nlv`;
    if (formula.endsWith('h')) return `${val}h`;
    return `${val}n`;
}

// ─── Legal Reference Resolver ──────────────────────────────────
// Was copy-pasted 100% in WorkflowBuilderPanel and SubTaskDetailPanel
export interface LegalSearchTarget {
    docId?: string;
    articleId?: string;
    searchQuery?: string;
}

export function resolveLegalReference(
    basisText: string
): LegalSearchTarget {
    if (!basisText || !basisText.trim()) {
        return {};
    }

    let foundDocId: string | undefined = undefined;
    
    const lowerText = basisText.toLowerCase();

    // 1. Nhận diện văn bản
    if (lowerText.includes('luật đầu tư công') || lowerText.includes('luật số 58') || lowerText.includes('luật đtc')) {
        foundDocId = 'luat-dau-tu-cong-2024';
    }

    return {
        docId: foundDocId,
        // The LegalDocumentSearch component will use the searchQuery to find the article
        searchQuery: basisText,
    };
}

// ─── Template File Upload ──────────────────────────────────────
// Was duplicated between NodeDetailPanel.handleFileUpload and SubTaskDetailPanel.handleFileUpload
export async function uploadTemplateFile(
    file: File,
    nodeId: string,
): Promise<{ url: string; name: string }> {
    const fileExt = file.name.split('.').pop() || '';
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const filePath = `templates/${nodeId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

    const docName = file.name.replace(`.${fileExt}`, '');
    return { url: data.publicUrl, name: docName };
}

// ─── Template Forms Name Helper ────────────────────────────────
// Appends a new document name to the existing comma-separated template_forms string
export function appendTemplateName(existing: string, newName: string): string {
    if (!existing.trim()) return newName;
    if (existing.includes(newName)) return existing;
    return existing + ', ' + newName;
}

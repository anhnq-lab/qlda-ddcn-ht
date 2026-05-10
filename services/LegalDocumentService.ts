/**
 * LegalDocumentService â€” Replaces static legalData.ts (2.1MB)
 * All legal document data is now fetched from Supabase.
 */

import { supabase } from '../lib/supabase';

// TS2589 workaround: the project schema has 45+ tables which causes
// "Type instantiation is excessively deep" for any new table.
// Using `any`-cast client scoped ONLY to legal-document queries.
// All return types are explicitly annotated so type safety is preserved.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type DocType = 'luat' | 'nghi-dinh' | 'thong-tu' | 'qcvn' | 'quyet-dinh';
export type DocStatus = 'hieu-luc' | 'het-hieu-luc' | 'sap-hieu-luc';

export interface LegalArticleDB {
    id: string;
    chapter_id: string;
    document_id: string;
    code: string;
    title: string;
    summary: string | null;
    content: string | null;
    full_content: string | null;
    sort_order: number;
}

export interface LegalChapterDB {
    id: string;
    document_id: string;
    code: string;
    title: string;
    sort_order: number;
    articles?: LegalArticleDB[];
}

export interface LegalDocumentDB {
    id: string;
    code: string;
    title: string;
    short_title: string | null;
    type: DocType;
    issued_date: string | null;
    effective_date: string | null;
    issued_by: string | null;
    status: DocStatus;
    summary: string | null;
    file_name: string | null;
    file_path: string | null;
    file_size: string | null;
    tags: string[];
    related_doc_ids: string[];
    created_at: string;
    updated_at: string;
    chapters?: LegalChapterDB[];
}

export interface LegalDocumentSearchParams {
    searchQuery?: string;
    type?: DocType | '';
    status?: DocStatus | '';
    page?: number;
    pageSize?: number;
}

export interface LegalDocumentSearchResult {
    documents: LegalDocumentDB[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
    'luat': 'Luật',
    'nghi-dinh': 'Nghị định',
    'thong-tu': 'Thông tư',
    'qcvn': 'QCVN/TCVN',
    'quyet-dinh': 'Quyết định',
};

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
    'hieu-luc': 'Còn hiệu lực',
    'het-hieu-luc': 'Hết hiệu lực',
    'sap-hieu-luc': 'Sắp có hiệu lực',
};

export const DOC_TYPE_COLORS: Record<DocType, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
    'luat': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', darkBg: 'dark:bg-red-900/20', darkText: 'dark:text-red-400', darkBorder: 'dark:border-red-800' },
    'nghi-dinh': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', darkBg: 'dark:bg-blue-900/20', darkText: 'dark:text-blue-400', darkBorder: 'dark:border-blue-800' },
    'thong-tu': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', darkBg: 'dark:bg-emerald-900/20', darkText: 'dark:text-emerald-400', darkBorder: 'dark:border-emerald-800' },
    'qcvn': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-400', darkBorder: 'dark:border-purple-800' },
    'quyet-dinh': { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200', darkBg: 'dark:bg-primary-900/20', darkText: 'dark:text-primary-400', darkBorder: 'dark:border-primary-800' },
};

export const DOC_STATUS_COLORS: Record<DocStatus, { bg: string; text: string; dot: string }> = {
    'hieu-luc': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    'het-hieu-luc': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
    'sap-hieu-luc': { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-400', dot: 'bg-primary-500' },
};

export const LegalDocumentService = {
    /**
     * Search documents with pagination and filters.
     */
    async searchDocuments(params: LegalDocumentSearchParams = {}): Promise<LegalDocumentSearchResult> {
        const { searchQuery = '', type = '', status = '', page = 1, pageSize = 12 } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = db
            .from('legal_documents')
            .select('*', { count: 'exact' })
            .order('issued_date', { ascending: false })
            .range(from, to);

        if (type) query = query.eq('type', type);
        if (status) query = query.eq('status', status);

        if (searchQuery.trim()) {
            // Server-side Full Text Search (FTS) using the generated 'fts' tsvector column
            query = query.textSearch('fts', searchQuery, { type: 'websearch', config: 'simple' });
        }

        const { data, error, count } = await query;

        if (error) throw new Error(`Failed to search legal documents: ${error.message}`);

        const total = count ?? 0;
        return {
            documents: (data as LegalDocumentDB[]) ?? [],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    },

    /**
     * Get a single document with its chapters and articles.
     */
    async getDocumentById(id: string): Promise<LegalDocumentDB | null> {
        const { data: doc, error: docErr } = await db
            .from('legal_documents')
            .select('*')
            .eq('id', id)
            .single();

        if (docErr || !doc) return null;

        const { data: chapters, error: chapErr } = await db
            .from('legal_chapters')
            .select('*')
            .eq('document_id', id)
            .order('sort_order', { ascending: true });

        if (chapErr) throw new Error(`Failed to fetch chapters: ${chapErr.message}`);

        const { data: articles, error: artErr } = await db
            .from('legal_articles')
            .select('*')
            .eq('document_id', id)
            .order('sort_order', { ascending: true });

        if (artErr) throw new Error(`Failed to fetch articles: ${artErr.message}`);

        const chaptersWithArticles = (chapters ?? []).map((ch) => ({
            ...ch,
            articles: (articles ?? []).filter((a) => a.chapter_id === ch.id),
        }));

        return {
            ...(doc as LegalDocumentDB),
            chapters: chaptersWithArticles,
        };
    },

    /**
     * Get documents related to a given document ID.
     */
    async getRelatedDocuments(docId: string): Promise<LegalDocumentDB[]> {
        const { data: doc } = await db
            .from('legal_documents')
            .select('related_doc_ids')
            .eq('id', docId)
            .single();

        if (!doc || !doc.related_doc_ids?.length) return [];

        const { data, error } = await db
            .from('legal_documents')
            .select('id, code, title, short_title, type, status, issued_date')
            .in('id', doc.related_doc_ids);

        if (error) throw new Error(`Failed to fetch related docs: ${error.message}`);
        return (data as LegalDocumentDB[]) ?? [];
    },

    /**
     * Search within articles of a document (for inline search).
     */
    async searchArticles(documentId: string, query: string): Promise<LegalArticleDB[]> {
        const { data, error } = await db
            .from('legal_articles')
            .select('*')
            .eq('document_id', documentId)
            .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(50);

        if (error) throw new Error(`Failed to search articles: ${error.message}`);
        return (data as LegalArticleDB[]) ?? [];
    },

    /**
     * Get document stats (count by type/status).
     */
    async getStats(): Promise<{ byType: Record<DocType, number>; byStatus: Record<DocStatus, number>; total: number }> {
        const { data, error } = await db
            .from('legal_documents')
            .select('type, status');

        if (error) throw new Error(`Failed to get stats: ${error.message}`);

        const docs = data ?? [];
        const total = docs.length;

        const byType = docs.reduce((acc, d) => {
            acc[d.type as DocType] = (acc[d.type as DocType] ?? 0) + 1;
            return acc;
        }, {} as Record<DocType, number>);

        const byStatus = docs.reduce((acc, d) => {
            acc[d.status as DocStatus] = (acc[d.status as DocStatus] ?? 0) + 1;
            return acc;
        }, {} as Record<DocStatus, number>);

        return { byType, byStatus, total };
    },
};

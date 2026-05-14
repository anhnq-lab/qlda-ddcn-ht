/**
 * useLegalDocuments — Custom hooks for fetching legal document data from Supabase.
 * Replaces the static legalData.ts imports used in LegalDocumentSearch.tsx.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    LegalDocumentService,
    LegalDocumentDB,
    LegalDocumentSearchParams,
    DocType,
    DocStatus,
} from '../../services/LegalDocumentService';

// ------------------------------------------------------------------ //
// Query keys
// ------------------------------------------------------------------ //
export const LEGAL_QUERY_KEYS = {
    all: ['legal-documents'] as const,
    list: (params: LegalDocumentSearchParams) => ['legal-documents', 'list', params] as const,
    detail: (id: string) => ['legal-documents', 'detail', id] as const,
    stats: () => ['legal-documents', 'stats'] as const,
    related: (id: string) => ['legal-documents', 'related', id] as const,
};

// ------------------------------------------------------------------ //
// Hook: useDocumentList — paginated search list
// ------------------------------------------------------------------ //
export interface UseDocumentListOptions {
    searchQuery?: string;
    type?: DocType | '';
    status?: DocStatus | '';
    page?: number;
    pageSize?: number;
}

export function useDocumentList(options: UseDocumentListOptions = {}) {
    const { searchQuery = '', type = '', status = '', page = 1, pageSize = 50 } = options;

    const params: LegalDocumentSearchParams = useMemo(() => ({
        searchQuery,
        type,
        status,
        page,
        pageSize,
    }), [searchQuery, type, status, page, pageSize]);

    return useQuery({
        queryKey: LEGAL_QUERY_KEYS.list(params),
        queryFn: () => LegalDocumentService.searchDocuments(params),
        staleTime: 5 * 60 * 1000,  // 5 min cache
        placeholderData: (prev) => prev,
    });
}

// ------------------------------------------------------------------ //
// Hook: useDocumentDetail — single document with chapters + articles
// ------------------------------------------------------------------ //
export function useDocumentDetail(id: string | null) {
    return useQuery({
        queryKey: LEGAL_QUERY_KEYS.detail(id ?? ''),
        queryFn: () => LegalDocumentService.getDocumentById(id!),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

// ------------------------------------------------------------------ //
// Hook: useLegalStats — stats for header/sidebar
// ------------------------------------------------------------------ //
export function useLegalStats() {
    return useQuery({
        queryKey: LEGAL_QUERY_KEYS.stats(),
        queryFn: () => LegalDocumentService.getStats(),
        staleTime: 30 * 60 * 1000,
    });
}

// ------------------------------------------------------------------ //
// Hook: useRelatedDocuments
// ------------------------------------------------------------------ //
export function useRelatedDocuments(docId: string | null) {
    return useQuery({
        queryKey: LEGAL_QUERY_KEYS.related(docId ?? ''),
        queryFn: () => LegalDocumentService.getRelatedDocuments(docId!),
        enabled: !!docId,
        staleTime: 10 * 60 * 1000,
    });
}

// ------------------------------------------------------------------ //
// Hook: useDeepSearch — global article-level search
// ------------------------------------------------------------------ //
export function useDeepSearch(query: string, documentId?: string | null) {
    const debouncedQuery = useDebounce(query, 350);

    return useQuery({
        queryKey: ['legal-deep-search', debouncedQuery, documentId],
        queryFn: () => LegalDocumentService.searchArticles(debouncedQuery, documentId || undefined),
        enabled: debouncedQuery.length >= 2,
        staleTime: 2 * 60 * 1000,
    });
}

// ------------------------------------------------------------------ //
// Utility: useDebounce
// ------------------------------------------------------------------ //
export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// ------------------------------------------------------------------ //
// Hook: usePrefetchDocument — prefetch on hover for instant loading
// ------------------------------------------------------------------ //
export function usePrefetchDocument() {
    const queryClient = useQueryClient();
    return useCallback((id: string) => {
        queryClient.prefetchQuery({
            queryKey: LEGAL_QUERY_KEYS.detail(id),
            queryFn: () => LegalDocumentService.getDocumentById(id),
            staleTime: 10 * 60 * 1000,
        });
    }, [queryClient]);
}



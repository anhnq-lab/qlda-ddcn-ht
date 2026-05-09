/**
 * usePaginatedProjects — Server-side paginated project fetching
 * 
 * Replaces the old useProjects() for list views.
 * - Pushes page, pageSize, search, filters, sort to Supabase
 * - Returns { data, total, page, pageSize, totalPages }
 * - React Query handles caching, dedup, retry
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '../services/ProjectService';
import type { QueryParams } from '../types/api';
import type { Project } from '../types';

export const PROJECTS_QUERY_KEY = 'projects-paginated';

export interface PaginatedProjectsResult {
    projects: Project[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;
    refetch: () => void;
}

export function usePaginatedProjects(params?: QueryParams): PaginatedProjectsResult {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: [PROJECTS_QUERY_KEY, JSON.stringify(params)],
        queryFn: () => ProjectService.getPaginated(params),
        staleTime: 30_000,        // 30s — don't refetch if data is fresh
        retry: 2,                  // retry failed requests twice
        refetchOnWindowFocus: false, // don't spam API on tab switch
    });

    return {
        projects: data?.data || [],
        total: data?.total || 0,
        page: data?.page || 1,
        pageSize: data?.pageSize || ProjectService.DEFAULT_PAGE_SIZE,
        totalPages: data?.totalPages || 0,
        isLoading,
        isFetching,
        error: error ? (error as Error).message : null,
        refetch,
    };
}

/**
 * Invalidate all paginated project queries.
 * Call after create/update/delete to force refetch.
 */
export function useInvalidateProjects() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
}

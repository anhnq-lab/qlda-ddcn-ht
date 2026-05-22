/**
 * useProjects — Fetch the full project list (no pagination).
 *
 * Use for: dropdowns, global search, widgets that need all rows in memory.
 * Do NOT use for paginated list views — those should use
 *   `usePaginatedProjects` or, when department scoping matters,
 *   `useScopedProjects`.
 *
 * Cache is shared via the `LEGACY_PROJECTS_QUERY_KEY` namespace so
 * `useProjectsRealtime()` can invalidate it on remote changes alongside
 * the paginated cache.
 */
import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '../services/ProjectService';
import { QueryParams } from '../types/api';

export const LEGACY_PROJECTS_QUERY_KEY = 'projects';

export const useProjects = (params?: QueryParams) => {
    const { data: projects = [], isLoading, error, refetch } = useQuery({
        queryKey: [LEGACY_PROJECTS_QUERY_KEY, JSON.stringify(params)],
        queryFn: () => ProjectService.getAll(params),
    });

    return {
        projects,
        isLoading,
        error: error ? (error as Error).message : null,
        refetch,
    };
};

import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '../services/ProjectService';
import type { QueryParams } from '../types/api';

export const PROJECT_STATS_QUERY_KEY = 'project-stats';

export interface ProjectStatsResult {
    statusCounts: Record<number, number>;
    currentStatusCounts: Record<number, number>;
    groupCounts: Record<string, number>;
    boardCounts: Record<string, number>;
    total: number;
    isLoading: boolean;
    error: string | null;
}

export function useProjectStats(params?: QueryParams): ProjectStatsResult {
    const { data, isLoading, error } = useQuery({
        queryKey: [PROJECT_STATS_QUERY_KEY, JSON.stringify(params)],
        queryFn: () => ProjectService.getStats(params),
        staleTime: 60_000,        // 1 minute stale time
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        statusCounts: data?.statusCounts || {},
        currentStatusCounts: data?.currentStatusCounts || {},
        groupCounts: data?.groupCounts || {},
        boardCounts: data?.boardCounts || {},
        total: data?.total || 0,
        isLoading,
        error: error ? (error as Error).message : null,
    };
}

/**
 * ProjectFilterContext v2
 *
 * Gọi cả useProjectFilters() + useScopedProjects() tại 1 nơi duy nhất.
 * Cung cấp filter state + dữ liệu (counts, projects) cho toàn bộ /projects route.
 *
 * - Header     → subscribe để render filter chips (chỉ dùng state + counts)
 * - ProjectList → subscribe thay vì gọi hooks độc lập
 */
import React, { createContext, useContext } from 'react';
import { useProjectFilters, ProjectFiltersResult } from '../features/projects/hooks/useProjectFilters';
import { useScopedProjects, ScopedProjectsResult } from '../hooks/useScopedProjects';
import type { Project } from '../types';

// ─────────────────────────────────────────────────────────
export interface ProjectFilterContextValue extends ProjectFiltersResult {
    // Data from useScopedProjects
    scopedProjects: Project[];
    total: number;
    totalPages: number;
    pageSize: number;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => void;
    statusCounts: Record<number, number>;
    currentStatusCounts: Record<number, number>;
    groupCounts: Record<string, number>;
    boardCounts: Record<string, number>;
    specialtyCounts: Record<string, number>;
    totalUnfiltered: number;
}

const ProjectFilterContext = createContext<ProjectFilterContextValue | null>(null);

// ─────────────────────────────────────────────────────────
export const ProjectFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const filters = useProjectFilters();
    const scoped: ScopedProjectsResult = useScopedProjects(filters.queryParams);

    const value: ProjectFilterContextValue = {
        // All filter state
        ...filters,
        // All scoped data
        scopedProjects: scoped.scopedProjects,
        total: scoped.total,
        totalPages: scoped.totalPages,
        pageSize: scoped.pageSize,
        isLoading: scoped.isLoading,
        isFetching: scoped.isFetching,
        refetch: scoped.refetch,
        statusCounts: scoped.statusCounts,
        currentStatusCounts: scoped.currentStatusCounts,
        groupCounts: scoped.groupCounts,
        boardCounts: scoped.boardCounts,
        specialtyCounts: scoped.specialtyCounts,
        totalUnfiltered: scoped.totalUnfiltered,
    };

    return (
        <ProjectFilterContext.Provider value={value}>
            {children}
        </ProjectFilterContext.Provider>
    );
};

// ─────────────────────────────────────────────────────────
/** Strict — throws nếu dùng ngoài Provider (dùng trong ProjectList) */
export const useProjectFilterContext = (): ProjectFilterContextValue => {
    const ctx = useContext(ProjectFilterContext);
    if (!ctx) throw new Error('useProjectFilterContext must be used inside ProjectFilterProvider');
    return ctx;
};

/** Safe — trả null nếu ngoài Provider (dùng trong Header) */
export const useProjectFilterContextSafe = (): ProjectFilterContextValue | null => {
    return useContext(ProjectFilterContext);
};

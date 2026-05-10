/**
 * useScopedProjects — QLDA ĐDCN TP.HCM
 *
 * Centralized hook for department-scoped project filtering.
 * Now supports SERVER-SIDE pagination via usePaginatedProjects.
 * 
 * - Ban ĐHDA 1-7: Only see projects with matching management_board
 * - Global departments (Ban GĐ, Phòng KH-ĐT, etc.): See all projects
 * - Contractor: Only see allowed project IDs
 * - Super admin: See all projects
 *
 * The ban/board filter is pushed to the server via QueryParams.filters.board
 */
import { useMemo } from 'react';
import { usePaginatedProjects } from './usePaginatedProjects';
import { useProjectStats, ProjectStatsResult } from './useProjectStats';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import { usePermissionCheck } from './usePermissionCheck';
import type { Project } from '../types';
import type { QueryParams } from '../types/api';

/**
 * Extract the Ban number (1-7) from department name.
 * e.g. "Ban Điều hành dự án 1" → 1, "Ban Điều hành dự án 7" → 7
 * Returns null if not a Ban ĐHDA department.
 */
export function extractBanNumber(department: string | undefined): number | null {
    if (!department) return null;
    const match = department.match(/Ban Điều hành dự án\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
}

export interface ScopedProjectsResult {
    /** Projects visible to current user (paginated from server) */
    scopedProjects: Project[];
    /** Project IDs that the current user can see (derived from scopedProjects) */
    scopedProjectIds: Set<string>;
    /** Alias for scopedProjects (backward compat) */
    allProjects: Project[];
    /** Total count (server-side) */
    total: number;
    /** Current page */
    page: number;
    /** Page size */
    pageSize: number;
    /** Total pages */
    totalPages: number;
    /** Stats: Status counts */
    statusCounts: Record<number, number>;
    /** Stats: Current Status counts */
    currentStatusCounts: Record<number, number>;
    /** Stats: Total (unfiltered by status) */
    totalUnfiltered: number;
    /** Whether user has global scope (sees all) */
    isGlobalScope: boolean;
    /** The Ban number of the effective user (null if global) */
    banNumber: number | null;
    /** Loading state (initial load) */
    isLoading: boolean;
    /** Fetching state (includes pagination refetch) */
    isFetching: boolean;
    /** Refetch trigger */
    refetch: () => void;
}

/**
 * Server-side paginated + scoped projects
 * Pushes board filter to server so pagination counts are accurate.
 */
export function useScopedProjects(params?: QueryParams): ScopedProjectsResult {
    const { currentUser } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();
    const { isGlobalScope, systemRole } = usePermissionCheck();

    // Effective user for scoping
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
    const banNumber = extractBanNumber(effectiveUser?.Department);

    // Build server-side filter params with board scope injected
    const serverParams = useMemo((): QueryParams => {
        const base: QueryParams = { ...params };
        if (!base.filters) base.filters = {};

        // Inject board scope for Ban ĐHDA users
        if (!isGlobalScope && systemRole !== 'super_admin' && systemRole !== 'contractor' && banNumber !== null) {
            base.filters.board = banNumber.toString();
        }

        return base;
    }, [params, isGlobalScope, systemRole, banNumber]);

    // Paginated fetch from server
    const { projects, total, page, pageSize, totalPages, isLoading, isFetching, refetch } = usePaginatedProjects(serverParams);

    // Fetch aggregate stats for the current scope (ignoring status/currentStatus filters)
    const { statusCounts, currentStatusCounts, groupCounts, boardCounts, total: totalUnfiltered, isLoading: isLoadingStats } = useProjectStats(serverParams);

    // Contractor: client-side filter by allowed IDs (small set, OK client-side)
    const scopedProjects = useMemo(() => {
        if (systemRole === 'contractor') {
            const allowedIds = effectiveUser?.AllowedProjectIDs || [];
            if (allowedIds.length === 0) return [];
            return projects.filter(p => allowedIds.includes(p.ProjectID));
        }
        return projects;
    }, [projects, systemRole, effectiveUser]);

    // Derived: set of scoped IDs for quick lookup in other modules
    const scopedProjectIds = useMemo(() => {
        return new Set(scopedProjects.map(p => p.ProjectID));
    }, [scopedProjects]);

    return {
        scopedProjects,
        scopedProjectIds,
        allProjects: scopedProjects,
        total: systemRole === 'contractor' ? scopedProjects.length : total,
        page,
        pageSize,
        totalPages,
        statusCounts,
        currentStatusCounts,
        groupCounts,
        boardCounts,
        totalUnfiltered: systemRole === 'contractor' ? scopedProjects.length : totalUnfiltered,
        isGlobalScope,
        banNumber,
        isLoading: isLoading || isLoadingStats,
        isFetching,
        refetch,
    };
}

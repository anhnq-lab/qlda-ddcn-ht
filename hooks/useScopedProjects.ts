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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { usePaginatedProjects } from './usePaginatedProjects';
import { useProjectStats, ProjectStatsResult } from './useProjectStats';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import { usePermissionCheck } from './usePermissionCheck';
import { extractBanNumber } from '../utils/boardScope';
import type { Project } from '../types';
import type { QueryParams } from '../types/api';

// Re-export để giữ tương thích các nơi đang import từ hook này.
export { extractBanNumber };

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
    /** Stats: Group counts */
    groupCounts: Record<string, number>;
    /** Stats: Board counts */
    boardCounts: Record<string, number>;
    /** Stats: Specialty counts */
    specialtyCounts: Record<string, number>;
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
    const { isGlobalScope, systemRole, managedBoards } = usePermissionCheck();

    // Effective user for scoping
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
    const banNumber = extractBanNumber(effectiveUser?.Department);
    // Khoá theo nội dung để memo ổn định (mảng đổi tham chiếu mỗi render)
    const managedBoardsKey = managedBoards.join(',');
    const allowedIdsKey = (effectiveUser?.AllowedProjectIDs || []).join(',');

    const myProjectsOnly = params?.filters?.myProjectsOnly;

    // Fetch my project IDs
    const { data: myProjectIds = [], isLoading: isLoadingMyProjectIds } = useQuery({
        queryKey: ['my-project-ids', effectiveUser?.EmployeeID],
        queryFn: async () => {
            if (!effectiveUser?.EmployeeID) return [];
            const { data, error } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('employee_id', effectiveUser.EmployeeID);
            if (error) throw error;
            return (data || []).map((row: any) => row.project_id);
        },
        enabled: !!effectiveUser?.EmployeeID && !!myProjectsOnly,
    });
    const myProjectIdsKey = myProjectIds.join(',');

    // Build server-side filter params with board scope injected
    const serverParams = useMemo((): QueryParams => {
        const base: QueryParams = { ...params };
        if (!base.filters) base.filters = {};

        if (myProjectsOnly) {
            base.filters.myProjectsOnly = true;
            base.filters.myProjectIds = myProjectIds;
        }

        // Nhà thầu: scope theo danh sách dự án được gói (đẩy xuống server → phân trang đúng)
        if (systemRole === 'contractor') {
            base.filters.projectIds = effectiveUser?.AllowedProjectIDs || [];
            return base;
        }

        if (isGlobalScope || systemRole === 'super_admin') {
            return base;
        }

        // Phó GĐ: scope theo nhiều Ban phụ trách (leadership_assignments)
        if (systemRole === 'deputy_director' && managedBoards.length > 0) {
            base.filters.boards = managedBoards.map(String);
        }
        // Phòng QLDA / Ban ĐHDA: scope theo đúng Ban của mình
        else if (banNumber !== null) {
            base.filters.board = banNumber.toString();
        }

        return base;
    }, [params, isGlobalScope, systemRole, banNumber, managedBoardsKey, allowedIdsKey, myProjectsOnly, myProjectIdsKey]);

    // Paginated fetch from server
    const { projects, total, page, pageSize, totalPages, isLoading, isFetching, refetch } = usePaginatedProjects(serverParams);

    // Fetch aggregate stats for the current scope (ignoring status/currentStatus filters)
    const { statusCounts, currentStatusCounts, groupCounts, boardCounts, specialtyCounts, total: totalUnfiltered, isLoading: isLoadingStats } = useProjectStats(serverParams);

    // Scope nhà thầu nay được đẩy xuống server (filters.projectIds) + RLS enforce
    // → không cần lọc client, phân trang/đếm chính xác.
    const scopedProjects = projects;

    // Derived: set of scoped IDs for quick lookup in other modules
    const scopedProjectIds = useMemo(() => {
        return new Set(scopedProjects.map(p => p.ProjectID));
    }, [scopedProjects]);

    return {
        scopedProjects,
        scopedProjectIds,
        allProjects: scopedProjects,
        total,
        page,
        pageSize,
        totalPages,
        statusCounts,
        currentStatusCounts,
        groupCounts,
        boardCounts,
        specialtyCounts,
        totalUnfiltered,
        isGlobalScope,
        banNumber,
        isLoading: isLoading || isLoadingStats || (myProjectsOnly ? isLoadingMyProjectIds : false),
        isFetching,
        refetch,
    };
}

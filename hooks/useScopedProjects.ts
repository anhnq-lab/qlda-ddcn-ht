/**
 * useScopedProjects — QLDA ĐDCN Hà Tĩnh
 *
 * Centralized hook for department-scoped project filtering.
 * Now supports SERVER-SIDE pagination via usePaginatedProjects.
 *
 * Phạm vi dữ liệu:
 * - super_admin / director / chief_accountant: Tất cả dự án
 * - deputy_director: Dự án thuộc các Ban phụ trách (leadership_assignments)
 * - Phòng QLDA (PROJECT_SCOPED_DEPARTMENTS): Dự án thuộc Ban mình
 * - Phòng nghiệp vụ - TrP/PhP: Tất cả dự án
 * - Phòng nghiệp vụ - CV/HC: Chỉ dự án là thành viên (project_members)
 * - Contractor: Chỉ dự án trong allowed_project_ids
 *
 * The ban/board/member filter is pushed to the server via QueryParams.filters
 */
import { useMemo, useState, useEffect } from 'react';
import { usePaginatedProjects } from './usePaginatedProjects';
import { useProjectStats, ProjectStatsResult } from './useProjectStats';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import { usePermissionCheck } from './usePermissionCheck';
import { extractBanNumber } from '../utils/boardScope';
import { supabase } from '../lib/supabase';
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
    const effectiveUserId = effectiveUser?.EmployeeID;
    // Khoá theo nội dung để memo ổn định (mảng đổi tham chiếu mỗi render)
    const managedBoardsKey = managedBoards.join(',');
    const allowedIdsKey = (effectiveUser?.AllowedProjectIDs || []).join(',');

    // ── Member-scoped: CV/HC phòng nghiệp vụ chỉ thấy dự án mình là thành viên ──
    // Khi user không global, không có board number, không phải contractor/PGĐ →
    // fetch danh sách project_id từ bảng project_members.
    const isMemberScoped = !isGlobalScope
        && systemRole !== 'super_admin'
        && systemRole !== 'contractor'
        && !(systemRole === 'deputy_director' && managedBoards.length > 0)
        && banNumber === null;

    const [memberProjectIds, setMemberProjectIds] = useState<string[] | null>(null);
    const [memberLoading, setMemberLoading] = useState(false);

    useEffect(() => {
        if (!isMemberScoped || !effectiveUserId) {
            setMemberProjectIds(null);
            return;
        }
        let active = true;
        setMemberLoading(true);
        (async () => {
            try {
                // Lấy project_id từ project_members + projects.created_by
                const [memberRes, createdRes] = await Promise.all([
                    supabase
                        .from('project_members')
                        .select('project_id')
                        .eq('employee_id', effectiveUserId),
                    supabase
                        .from('projects')
                        .select('project_id')
                        .eq('created_by', effectiveUserId),
                ]);
                const ids = new Set<string>();
                (memberRes.data || []).forEach((r: any) => ids.add(r.project_id));
                (createdRes.data || []).forEach((r: any) => ids.add(r.project_id));
                if (active) setMemberProjectIds([...ids]);
            } catch (e) {
                console.warn('[useScopedProjects] Không tải được member project IDs:', e);
                if (active) setMemberProjectIds([]);
            } finally {
                if (active) setMemberLoading(false);
            }
        })();
        return () => { active = false; };
    }, [isMemberScoped, effectiveUserId]);

    // Build server-side filter params with board scope injected
    const memberIdsKey = (memberProjectIds || []).join(',');
    const serverParams = useMemo((): QueryParams => {
        const base: QueryParams = { ...params };
        if (!base.filters) base.filters = {};

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
        // CV/HC phòng nghiệp vụ: chỉ dự án mình là thành viên hoặc tạo
        else if (isMemberScoped && memberProjectIds !== null) {
            base.filters.projectIds = memberProjectIds;
        }

        return base;
    }, [params, isGlobalScope, systemRole, banNumber, managedBoardsKey, allowedIdsKey, isMemberScoped, memberIdsKey]);

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
        isLoading: isLoading || isLoadingStats || memberLoading,
        isFetching,
        refetch,
    };
}

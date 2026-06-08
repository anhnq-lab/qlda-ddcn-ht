/**
 * usePermissionCheck — QLDA ĐDCN TP.HCM
 *
 * IMPERSONATION-AWARE: When impersonating, uses impersonated user's
 * permissions/role instead of the real user.
 *
 * v2: Now reads from PermissionContext (centralized cache) to avoid
 * N+1 DB queries when multiple components use this hook simultaneously.
 * Falls back to direct DB fetch for standalone usage outside provider.
 *
 * Deny-by-default permission checking hook.
 */
import { useCallback } from 'react';
import { usePermissionContext } from '../context/PermissionContext';
import type { PermissionAction, PermissionResource, SystemRole } from '../types/permission.types';

export interface PermissionCheckResult {
    /** Check if user can perform action on resource */
    can: (resource: PermissionResource, action: PermissionAction) => boolean;
    /** Check if user can perform action on a specific project */
    canOnProject: (action: PermissionAction, projectManagementUnit?: string) => boolean;
    /** Lớp 3 — record-level: được phép Sửa một dự án cụ thể (người tạo hoặc thành viên) */
    canEditProject: (project: { createdBy?: string | null; memberIds?: string[] }) => boolean;
    /** Check if user has global view (sees all projects) */
    isGlobalScope: boolean;
    /** Ban QLDA mà PGĐ phụ trách (chỉ deputy_director; rỗng với role khác) */
    managedBoards: number[];
    /** Mã phòng PGĐ phụ trách = Ban QLDA + phòng nghiệp vụ (chỉ deputy_director) */
    managedDeptCodes: string[];
    /** Get the user's system role */
    systemRole: SystemRole;
    /** Whether permissions have been loaded */
    loading: boolean;
    /** All resource permissions (for admin UI) */
    permissionMap: Map<string, PermissionAction[]>;
    /** Refresh permissions from DB */
    refresh: () => Promise<void>;
    /** Whether we are in impersonation mode */
    isImpersonating: boolean;
}

/**
 * Thin wrapper around PermissionContext.
 * All state + logic lives in PermissionContext (single fetch per session).
 * This hook just exposes the context values with the existing interface.
 */
export function usePermissionCheck(): PermissionCheckResult {
    const ctx = usePermissionContext();

    // Map context's refreshPermissions to the expected `refresh` name
    const refresh = useCallback(() => ctx.refreshPermissions(), [ctx.refreshPermissions]);

    return {
        can: ctx.can,
        canOnProject: ctx.canOnProject,
        canEditProject: ctx.canEditProject,
        isGlobalScope: ctx.isGlobalScope,
        managedBoards: ctx.managedBoards,
        managedDeptCodes: ctx.managedDeptCodes,
        systemRole: ctx.systemRole,
        loading: ctx.loading,
        permissionMap: ctx.permissionMap,
        refresh,
        isImpersonating: ctx.isImpersonating,
    };
}

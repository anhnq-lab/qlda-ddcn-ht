/**
 * PermissionContext — QLDA ĐDCN Hà Tĩnh
 *
 * Centralized permission cache to prevent N+1 DB queries.
 * Multiple components can call usePermissionCheck() without
 * triggering extra DB fetches — permissions are fetched ONCE
 * and stored here at the context level.
 *
 * Refresh triggers:
 *  - Login / Logout (user changes)
 *  - Impersonation start / stop
 *  - Explicit call to refreshPermissions()
 */
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
    useMemo,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useImpersonation } from './ImpersonationContext';
import {
    PermissionAction,
    PermissionResource,
    SystemRole,
    DEFAULT_ROLE_PERMISSIONS,
    GLOBAL_VIEW_DEPARTMENTS,
    GLOBAL_VIEW_ROLES,
    PROJECT_SCOPED_DEPARTMENTS,
    DepartmentRule,
    DEFAULT_DEPARTMENT_RULES,
    departmentMatches,
    resolveSystemRole,
} from '../types/permission.types';
import { permissionCache } from '../utils/permissionCache';
import { LeadershipService } from '../services/LeadershipService';
import { extractBanNumber } from '../utils/boardScope';

// ─── Types ────────────────────────────────────────────────

interface PermissionCacheState {
    /** key = resource, value = allowed actions */
    permissionMap: Map<string, PermissionAction[]>;
    systemRole: SystemRole;
    isGlobalScope: boolean;
    /** Ban QLDA mà PGĐ phụ trách (chỉ dùng cho deputy_director) */
    managedBoards: number[];
    loading: boolean;
    loaded: boolean;
    /** Which effectiveUserId this cache is for */
    cachedForUserId: string | null;
}

interface PermissionContextType extends PermissionCacheState {
    /** Check if effective user can perform action on resource */
    can: (resource: PermissionResource, action: PermissionAction) => boolean;
    /** Check if effective user can act on a specific project (dept-scoped) */
    canOnProject: (action: PermissionAction, projectManagementUnit?: string) => boolean;
    /**
     * Lớp 3 — record-level: được phép SỬA một dự án cụ thể hay không.
     * Chỉ TRUE khi có quyền projects.update VÀ (là người tạo HOẶC là thành viên dự án).
     */
    canEditProject: (project: { createdBy?: string | null; memberIds?: string[]; members?: Array<{ employeeId: string; role: string }> }) => boolean;
    /** Force refresh from DB */
    refreshPermissions: () => Promise<void>;
    isImpersonating: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// In-memory cache for role defaults to avoid repeated DB calls across users
const roleDefaultsCache = new Map<SystemRole, Map<string, PermissionAction[]>>();

/**
 * Xoá cache template quyền theo role (gọi sau khi Admin sửa role_permission_defaults).
 * Kết hợp permissionCache.invalidateAll() để mọi user nạp lại quyền mới. [C-5.4]
 */
export function clearRoleDefaultsCache(): void {
    roleDefaultsCache.clear();
}

// Lớp 2 — cache rule giới hạn theo phòng ban (global, không theo user)
let deptRulesCache: DepartmentRule[] | null = null;

/** Xoá cache rule phòng ban (gọi sau khi Admin sửa department_permission_rules). */
export function clearDeptRulesCache(): void {
    deptRulesCache = null;
}

// ─── Provider ─────────────────────────────────────────────

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, userType, isAuthenticated, isLoading: authLoading } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();

    // The "effective" user: impersonated user takes priority
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
    const effectiveUserType = isImpersonating
        ? ((impersonatedUser?.Role as string) === 'contractor' ? 'contractor' : 'employee')
        : userType;

    const [state, setState] = useState<PermissionCacheState>({
        permissionMap: new Map(),
        systemRole: 'staff',
        isGlobalScope: false,
        managedBoards: [],
        loading: true,
        loaded: false,
        cachedForUserId: null,
    });

    const [dbRoleDefaults, setDbRoleDefaults] = useState<Map<string, PermissionAction[]>>(new Map());

    // Lớp 2 — rule giới hạn theo phòng ban (global; nạp 1 lần từ DB, fallback hằng số)
    const [deptRules, setDeptRules] = useState<DepartmentRule[]>(deptRulesCache ?? DEFAULT_DEPARTMENT_RULES);

    useEffect(() => {
        if (deptRulesCache) { setDeptRules(deptRulesCache); return; }
        (async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from('department_permission_rules')
                    .select('resource, action, allowed_departments');
                if (!error && Array.isArray(data)) {
                    const rules: DepartmentRule[] = data.map((r: any) => ({
                        resource: r.resource,
                        action: r.action,
                        allowedDepartments: r.allowed_departments || [],
                    }));
                    deptRulesCache = rules;
                    setDeptRules(rules);
                }
            } catch (e) {
                console.warn('[PermissionCtx] Không tải được department_permission_rules, dùng hằng số:', e);
            }
        })();
    }, []);

    // Prevent concurrent fetches for the same user
    const fetchingRef = useRef<string | null>(null);

    // Compute system role from effective user
    const systemRole = useMemo((): SystemRole => {
        if (!effectiveUser) return 'staff';
        if (effectiveUserType === 'contractor') return 'contractor';
        if ('SystemRole' in effectiveUser && effectiveUser.SystemRole) {
            return effectiveUser.SystemRole as SystemRole;
        }
        return resolveSystemRole(effectiveUser.Role, effectiveUser.Position);
    }, [effectiveUser, effectiveUserType]);

    // Compute global scope flag
    const isGlobalScope = useMemo(() => {
        if (!effectiveUser) return false;

        const userDept = effectiveUser.Department || '';

        // If they are explicitly in a project-scoped department, they ONLY see their projects, regardless of role
        const isProjectScoped = PROJECT_SCOPED_DEPARTMENTS.some(dept => 
            userDept.includes(dept) || dept.includes(userDept)
        ) || userDept.toLowerCase().includes('quản lý dự án');
        
        if (isProjectScoped && systemRole !== 'super_admin') {
            return false;
        }

        // NOTE: deputy_director is intentionally excluded here — their scope is
        // resolved dynamically from leadership_assignments in fetchPermissions().
        if (['super_admin', 'director', 'chief_accountant'].includes(systemRole)) {
            return true;
        }
        const isGlobalDept = GLOBAL_VIEW_DEPARTMENTS.some(dept =>
            userDept.includes(dept) || dept.includes(userDept)
        );
        return isGlobalDept && ['dept_head', 'deputy_head'].includes(systemRole);
    }, [effectiveUser, systemRole]);

    // Fetch role defaults from DB
    const fetchRoleDefaults = useCallback(async (role: SystemRole) => {
        if (role === 'super_admin' || role === 'contractor') return; // Not handled by DB yet
        if (roleDefaultsCache.has(role)) {
            setDbRoleDefaults(roleDefaultsCache.get(role)!);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('role_permission_defaults')
                .select('resource, actions')
                .eq('role', role);

            if (!error && data && data.length > 0) {
                const map = new Map<string, PermissionAction[]>();
                data.forEach((row: any) => {
                    map.set(row.resource, row.actions || []);
                });
                roleDefaultsCache.set(role, map);
                setDbRoleDefaults(map);
            }
        } catch (e) {
            console.error('[PermissionContext] Failed to load role defaults:', e);
        }
    }, []);

    // ── Fetch permissions from DB ──────────────────────────
    const fetchPermissions = useCallback(async () => {
        if (authLoading) {
            setState(prev => {
                if (prev.loading && !prev.loaded) return prev;
                return { ...prev, loading: true, loaded: false };
            });
            return;
        }

        const userId = effectiveUser?.EmployeeID;

        // Await role defaults before marking loaded — prevents hardcoded-fallback window
        await fetchRoleDefaults(systemRole);

        // Not logged in → clear state
        if (!userId || !isAuthenticated) {
            setState(prev => {
                if (prev.cachedForUserId === null && !prev.loading && prev.loaded) return prev;
                return {
                    permissionMap: new Map(),
                    systemRole: 'staff',
                    isGlobalScope: false,
                    managedBoards: [],
                    loading: false,
                    loaded: true,
                    cachedForUserId: null,
                };
            });
            return;
        }

        // Already cached in React state for this user → skip
        if (state.cachedForUserId === userId && state.loaded && !state.loading) {
            return;
        }

        // ── Check sessionStorage cache ────────────────────────
        const cached = permissionCache.get(userId);
        if (cached) {
            const map = new Map<string, PermissionAction[]>(
                cached.permissionPairs as [string, PermissionAction[]][]
            );
            fetchingRef.current = null;
            if (import.meta.env.DEV) {
                console.debug(`[PermissionCtx] 🗃️ Cache HIT for user ${userId}`);
            }
            setState({
                permissionMap: map,
                systemRole: cached.systemRole as SystemRole,
                isGlobalScope: cached.isGlobalScope,
                managedBoards: cached.managedBoards ?? [],
                loading: false,
                loaded: true,
                cachedForUserId: userId,
            });
            return; // ← Cache hit: skip DB query
        }
        if (import.meta.env.DEV) {
            console.debug(`[PermissionCtx] 🌐 Cache MISS for user ${userId} — fetching from DB`);
        }

        // Prevent duplicate concurrent fetches
        if (fetchingRef.current === userId) return;
        fetchingRef.current = userId;

        setState(prev => ({ ...prev, loading: true, loaded: false }));

        // super_admin: skip DB query (full access handled in can())
        if (systemRole === 'super_admin') {
            permissionCache.set(userId, {
                permissionPairs: [],
                systemRole,
                isGlobalScope: true,
                managedBoards: [],
            });
            fetchingRef.current = null;
            setState({
                permissionMap: new Map(),
                systemRole,
                isGlobalScope: true,
                managedBoards: [],
                loading: false,
                loaded: true,
                cachedForUserId: userId,
            });
            return;
        }

        // ── Resolve deputy_director scope từ leadership_assignments ──
        // PGĐ chỉ thấy dự án của các Ban phụ trách. Fallback không phá vỡ:
        // chưa được phân công → tạm giữ Global view cho tới khi admin cấu hình.
        let managedBoards: number[] = [];
        let effectiveGlobalScope = isGlobalScope;
        if (systemRole === 'deputy_director') {
            try {
                managedBoards = await LeadershipService.getManagedBoards(userId);
            } catch (e) {
                console.warn('[PermissionCtx] Không tải được Ban phụ trách của PGĐ:', e);
            }
            effectiveGlobalScope = managedBoards.length === 0;
            if (managedBoards.length === 0) {
                console.warn(`[PermissionCtx] ⚠️ PGĐ ${userId} chưa được phân công Ban phụ trách — tạm giữ Global view. Cấu hình tại Quản trị HT → Cài đặt.`);
            }
        }

        try {
            const queryPromise = (supabase as any)
                .from('user_permissions')
                .select('resource, actions')
                .eq('user_id', userId);

            const timeoutPromise = new Promise<{ data: null; error: Error }>(resolve =>
                setTimeout(() => resolve({ data: null, error: new Error('Permission load timeout') }), 6000)
            );

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            const map = new Map<string, PermissionAction[]>();
            if (!error && data) {
                (data as any[]).forEach(row => {
                    map.set(row.resource, row.actions || []);
                });
            } else if (error) {
                console.error('[PermissionContext] DB fetch failed:', error);
            }

            // ── Save to sessionStorage cache ──────────────────
            if (!error) {
                permissionCache.set(userId, {
                    permissionPairs: [...map.entries()],
                    systemRole,
                    isGlobalScope: effectiveGlobalScope,
                    managedBoards,
                });
            }

            fetchingRef.current = null;
            setState({
                permissionMap: map,
                systemRole,
                isGlobalScope: effectiveGlobalScope,
                managedBoards,
                loading: false,
                loaded: true,
                cachedForUserId: userId,
            });
        } catch (err) {
            console.error('[PermissionContext] Exception:', err);
            fetchingRef.current = null;
            setState(prev => ({
                ...prev,
                systemRole,
                isGlobalScope: effectiveGlobalScope,
                managedBoards,
                loading: false,
                loaded: true,
                cachedForUserId: userId,
            }));
        }
    }, [effectiveUser?.EmployeeID, systemRole, isGlobalScope, isAuthenticated, fetchRoleDefaults, authLoading]);

    // Re-fetch when effective user, impersonation, or auth loading changes
    useEffect(() => {
        const userId = effectiveUser?.EmployeeID ?? null;
        // Re-fetch if:
        // 1. The user has actually changed
        // 2. Auth loading has just finished, to transition out of the loading state
        if (state.cachedForUserId !== userId || !authLoading) {
            fetchPermissions();
        }
    }, [effectiveUser?.EmployeeID, isImpersonating, authLoading]);

    // Public refresh (e.g., after admin saves permissions for themselves)
    const refreshPermissions = useCallback(async () => {
        // Invalidate sessionStorage cache for this user first
        const userId = effectiveUser?.EmployeeID;
        if (userId) permissionCache.invalidate(userId);
        
        // Also invalidate role cache to ensure fresh role defaults
        roleDefaultsCache.delete(state.systemRole);

        // Force re-fetch by clearing cachedForUserId
        setState(prev => ({ ...prev, cachedForUserId: null, loaded: false, loading: true }));
        fetchingRef.current = null;
        await fetchPermissions();
    }, [fetchPermissions, effectiveUser?.EmployeeID, state.systemRole]);

    // ── Lớp 2: cổng giới hạn theo phòng ban ────────────────
    // Khi có rule cho (resource, action): chỉ phòng được phép mới qua.
    // Vai trò lãnh đạo (toàn cục) bypass — ma trận Lớp 1 vốn không cấp action nhạy cảm cho họ.
    const deptGateAllows = useCallback(
        (resource: PermissionResource, action: PermissionAction): boolean => {
            const effRole = systemRole;
            const LEADERSHIP_BYPASS: SystemRole[] = ['super_admin', ...GLOBAL_VIEW_ROLES, 'deputy_director'];
            if (LEADERSHIP_BYPASS.includes(effRole)) return true;
            const rules = deptRules.filter(r => r.resource === resource && r.action === action);
            if (rules.length === 0) return true; // không có giới hạn
            return rules.some(r => departmentMatches(effectiveUser?.Department, r.allowedDepartments));
        },
        [deptRules, systemRole, effectiveUser]
    );

    // ── Core permission check ──────────────────────────────
    const can = useCallback(
        (resource: PermissionResource, action: PermissionAction): boolean => {
            // super_admin bypasses all checks.
            // Dùng `systemRole` (useMemo, đồng bộ từ effectiveUser) thay vì chỉ
            // `state.systemRole` (bất đồng bộ, có thể kẹt do race/cache cũ) để admin
            // luôn có toàn quyền ngay lập tức. `systemRole` đã tính cả impersonation.
            if (systemRole === 'super_admin' || state.systemRole === 'super_admin') return true;

            // Permissions not loaded yet → deny (safe default)
            if (!state.loaded) return false;

            // 1) DB override exists for this user → use it (even empty means "no access").
            //    Ghi đè cá nhân là TUYỆT ĐỐI (QTV chủ ý) → bỏ qua Lớp 2.
            if (state.permissionMap.size > 0) {
                const actions = state.permissionMap.get(resource);
                const result = actions ? actions.includes(action) : false;
                if (import.meta.env.DEV) {
                    console.debug(`[PermissionCtx] [DB-override] ${resource}.${action} = ${result}`);
                }
                return result;
            }

            // 2) Fallback to DB role defaults if available (AND cổng phòng ban Lớp 2)
            if (dbRoleDefaults.size > 0) {
                const actions = dbRoleDefaults.get(resource);
                const result = (actions ? actions.includes(action) : false) && deptGateAllows(resource, action);
                if (import.meta.env.DEV) {
                    console.debug(`[PermissionCtx] [DB-role-defaults] ${resource}.${action} = ${result}`);
                }
                return result;
            }

            // 3) Hardcoded fallback — last resort when DB role defaults unavailable
            const defaults = DEFAULT_ROLE_PERMISSIONS[state.systemRole];
            if (!defaults) return false;
            const defaultActions = defaults[resource as keyof typeof defaults];
            const result = (defaultActions ? (defaultActions as PermissionAction[]).includes(action) : false)
                && deptGateAllows(resource, action);
            // Warn in all environments for non-contractor roles — DB should be authoritative
            // (super_admin is handled above and never reaches here)
            if (state.systemRole !== 'contractor') {
                console.warn(`[PermissionCtx] ⚠️ Hardcoded fallback: role=${state.systemRole} ${resource}.${action}=${result} — DB role defaults unavailable`);
            }
            return result;
        },
        [state.permissionMap, state.loaded, state.systemRole, systemRole, dbRoleDefaults, deptGateAllows]
    );

    // ── Project-scoped check ───────────────────────────────
    const canOnProject = useCallback(
        (action: PermissionAction, projectManagementUnit?: string): boolean => {
            if (!can('projects', action)) return false;
            if (state.isGlobalScope) return true;

            // Phó GĐ: chỉ thao tác trên dự án thuộc Ban mình phụ trách.
            if (state.systemRole === 'deputy_director' && state.managedBoards.length > 0) {
                const projectBoard = extractBanNumber(projectManagementUnit);
                return projectBoard !== null && state.managedBoards.includes(projectBoard);
            }

            if (effectiveUser?.Department && projectManagementUnit) {
                const userDept = effectiveUser.Department;
                
                // Exact match only to prevent permission leakage between units
                // e.g. "Ban Điều hành dự án 1" vs "Ban Điều hành dự án 10"
                const isSameBan = PROJECT_SCOPED_DEPARTMENTS.includes(userDept) && userDept === projectManagementUnit;
                
                if (isSameBan) return true;

                // If user is in ANY project-scoped department but didn't match the project's unit exactly, deny access.
                const isInAnyBan = PROJECT_SCOPED_DEPARTMENTS.includes(userDept);
                if (isInAnyBan) return false;
            }

            if (state.systemRole === 'contractor') return false;
            return true;
        },
        [can, state.isGlobalScope, state.managedBoards, effectiveUser, state.systemRole]
    );

    // ── Lớp 3: record-level — quyền SỬA một dự án cụ thể ───
    // Theo tài liệu Mục 3.3: chỉ người tạo (created_by) hoặc thành viên dự án
    // (project_members) mới được sửa. Lãnh đạo/Trưởng phòng chỉ Xem (matrix đã chặn).
    const canEditProject = useCallback(
        (project: { createdBy?: string | null; memberIds?: string[]; members?: Array<{ employeeId: string; role: string }> }): boolean => {
            if (systemRole === 'super_admin' || state.systemRole === 'super_admin') return true;
            if (!can('projects', 'update')) return false;
            const uid = effectiveUser?.EmployeeID;
            if (!uid) return false;
            if (project.createdBy && project.createdBy === uid) return true;
            
            if (Array.isArray(project.members)) {
                const myMemberObj = project.members.find(m => m.employeeId === uid);
                if (myMemberObj) {
                    return ['Giám đốc dự án', 'Chuyên viên phụ trách', 'Trưởng phòng phụ trách'].includes(myMemberObj.role);
                }
            }
            return false;
        },
        [can, systemRole, state.systemRole, effectiveUser]
    );

    // super_admin được suy ra đồng bộ từ effectiveUser → expose ngay, không chờ
    // state bất đồng bộ (vốn có thể kẹt do race/cache), bảo đảm admin luôn full quyền.
    const isSuperAdmin = systemRole === 'super_admin' || state.systemRole === 'super_admin';

    const contextValue = useMemo<PermissionContextType>(() => ({
        ...state,
        isGlobalScope: isSuperAdmin ? true : state.isGlobalScope,
        systemRole: isSuperAdmin ? 'super_admin' : state.systemRole,
        can,
        canOnProject,
        canEditProject,
        refreshPermissions,
        isImpersonating,
    }), [state, isSuperAdmin, can, canOnProject, canEditProject, refreshPermissions, isImpersonating]);

    return (
        <PermissionContext.Provider value={contextValue}>
            {children}
        </PermissionContext.Provider>
    );
};

// ─── Consumer hook ─────────────────────────────────────────

export const usePermissionContext = (): PermissionContextType => {
    const ctx = useContext(PermissionContext);
    if (!ctx) {
        throw new Error('usePermissionContext must be used within <PermissionProvider>');
    }
    return ctx;
};

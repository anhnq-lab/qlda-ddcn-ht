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
    PROJECT_SCOPED_DEPARTMENTS,
    resolveSystemRole,
} from '../types/permission.types';
import { permissionCache } from '../utils/permissionCache';

// ─── Types ────────────────────────────────────────────────

interface PermissionCacheState {
    /** key = resource, value = allowed actions */
    permissionMap: Map<string, PermissionAction[]>;
    systemRole: SystemRole;
    isGlobalScope: boolean;
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
    /** Force refresh from DB */
    refreshPermissions: () => Promise<void>;
    isImpersonating: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// In-memory cache for role defaults to avoid repeated DB calls across users
const roleDefaultsCache = new Map<SystemRole, Map<string, PermissionAction[]>>();

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
        loading: true,
        loaded: false,
        cachedForUserId: null,
    });

    const [dbRoleDefaults, setDbRoleDefaults] = useState<Map<string, PermissionAction[]>>(new Map());

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

        if (['super_admin', 'director', 'deputy_director', 'chief_accountant'].includes(systemRole)) {
            return true;
        }
        return GLOBAL_VIEW_DEPARTMENTS.some(dept =>
            userDept.includes(dept) || dept.includes(userDept)
        );
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

        // Fetch DB role defaults concurrently or fallback to cache
        fetchRoleDefaults(systemRole);

        // Not logged in → clear state
        if (!userId || !isAuthenticated) {
            setState(prev => {
                if (prev.cachedForUserId === null && !prev.loading && prev.loaded) return prev;
                return {
                    permissionMap: new Map(),
                    systemRole: 'staff',
                    isGlobalScope: false,
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
            });
            fetchingRef.current = null;
            setState({
                permissionMap: new Map(),
                systemRole,
                isGlobalScope: true,
                loading: false,
                loaded: true,
                cachedForUserId: userId,
            });
            return;
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
                    isGlobalScope,
                });
            }

            fetchingRef.current = null;
            setState({
                permissionMap: map,
                systemRole,
                isGlobalScope,
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
                isGlobalScope,
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

    // ── Core permission check ──────────────────────────────
    const can = useCallback(
        (resource: PermissionResource, action: PermissionAction): boolean => {
            // super_admin bypasses all checks
            if (state.systemRole === 'super_admin') return true;

            // Permissions not loaded yet → deny (safe default)
            if (!state.loaded) return false;

            // 1) DB override exists for this user → use it (even empty means "no access")
            if (state.permissionMap.size > 0) {
                const actions = state.permissionMap.get(resource);
                const result = actions ? actions.includes(action) : false;
                if (import.meta.env.DEV) {
                    console.debug(`[PermissionCtx] [DB-override] ${resource}.${action} = ${result}`);
                }
                return result;
            }

            // 2) Fallback to DB role defaults if available
            if (dbRoleDefaults.size > 0) {
                const actions = dbRoleDefaults.get(resource);
                const result = actions ? actions.includes(action) : false;
                if (import.meta.env.DEV) {
                    console.debug(`[PermissionCtx] [DB-role-defaults] ${resource}.${action} = ${result}`);
                }
                return result;
            }

            // 3) Fallback to hardcoded role defaults (Safety Net)
            const defaults = DEFAULT_ROLE_PERMISSIONS[state.systemRole];
            if (!defaults) return false;
            const defaultActions = defaults[resource as keyof typeof defaults];
            const result = defaultActions ? (defaultActions as PermissionAction[]).includes(action) : false;
            if (import.meta.env.DEV) {
                console.debug(`[PermissionCtx] [hardcoded-fallback] ${resource}.${action} = ${result}`);
            }
            return result;
        },
        [state.permissionMap, state.loaded, state.systemRole, dbRoleDefaults]
    );

    // ── Project-scoped check ───────────────────────────────
    const canOnProject = useCallback(
        (action: PermissionAction, projectManagementUnit?: string): boolean => {
            if (!can('projects', action)) return false;
            if (state.isGlobalScope) return true;

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
        [can, state.isGlobalScope, effectiveUser, state.systemRole]
    );

    const contextValue = useMemo<PermissionContextType>(() => ({
        ...state,
        isGlobalScope: state.isGlobalScope,
        systemRole: state.systemRole,
        can,
        canOnProject,
        refreshPermissions,
        isImpersonating,
    }), [state, can, canOnProject, refreshPermissions, isImpersonating]);

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

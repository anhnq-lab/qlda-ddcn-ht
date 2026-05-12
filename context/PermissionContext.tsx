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

// ─── Provider ─────────────────────────────────────────────

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, userType, isAuthenticated } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();

    // The "effective" user: impersonated user takes priority
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
    const effectiveUserType = isImpersonating
        ? (impersonatedUser?.Role === 'contractor' ? 'contractor' : 'employee')
        : userType;

    const [state, setState] = useState<PermissionCacheState>({
        permissionMap: new Map(),
        systemRole: 'staff',
        isGlobalScope: false,
        loading: true,
        loaded: false,
        cachedForUserId: null,
    });

    // Prevent concurrent fetches for the same user
    const fetchingRef = useRef<string | null>(null);

    // Compute system role from effective user
    const systemRole = useMemo((): SystemRole => {
        if (!effectiveUser) return 'staff';
        if (effectiveUserType === 'contractor') return 'contractor';
        return resolveSystemRole(effectiveUser.Role, effectiveUser.Position);
    }, [effectiveUser, effectiveUserType]);

    // Compute global scope flag
    const isGlobalScope = useMemo(() => {
        if (!effectiveUser) return false;
        if (['super_admin', 'director', 'deputy_director', 'chief_accountant'].includes(systemRole)) {
            return true;
        }
        return GLOBAL_VIEW_DEPARTMENTS.some(dept =>
            effectiveUser.Department?.includes(dept) || dept.includes(effectiveUser.Department || '')
        );
    }, [effectiveUser, systemRole]);

    // ── Fetch permissions from DB ──────────────────────────
    const fetchPermissions = useCallback(async () => {
        const userId = effectiveUser?.EmployeeID;

        // Not logged in → clear state
        if (!userId || !isAuthenticated) {
            setState({
                permissionMap: new Map(),
                systemRole: 'staff',
                isGlobalScope: false,
                loading: false,
                loaded: true,
                cachedForUserId: null,
            });
            return;
        }

        // Already cached for this user → skip
        if (state.cachedForUserId === userId && state.loaded && !state.loading) {
            return;
        }

        // Prevent duplicate concurrent fetches
        if (fetchingRef.current === userId) return;
        fetchingRef.current = userId;

        setState(prev => ({ ...prev, loading: true, loaded: false }));

        // super_admin: skip DB query (full access handled in can())
        if (systemRole === 'super_admin') {
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
    }, [effectiveUser?.EmployeeID, systemRole, isGlobalScope, isAuthenticated]);

    // Re-fetch when effective user or impersonation changes
    useEffect(() => {
        const userId = effectiveUser?.EmployeeID ?? null;
        // Only re-fetch if user has actually changed
        if (state.cachedForUserId !== userId) {
            fetchPermissions();
        }
    }, [effectiveUser?.EmployeeID, isImpersonating]);

    // Public refresh (e.g., after admin saves permissions for themselves)
    const refreshPermissions = useCallback(async () => {
        // Force re-fetch by clearing cachedForUserId
        setState(prev => ({ ...prev, cachedForUserId: null, loaded: false, loading: true }));
        fetchingRef.current = null;
        await fetchPermissions();
    }, [fetchPermissions]);

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
                return actions ? actions.includes(action) : false;
            }

            // 2) Fallback to role defaults
            const defaults = DEFAULT_ROLE_PERMISSIONS[state.systemRole];
            if (!defaults) return false;
            const defaultActions = defaults[resource as keyof typeof defaults];
            return defaultActions ? (defaultActions as PermissionAction[]).includes(action) : false;
        },
        [state.permissionMap, state.loaded, state.systemRole]
    );

    // ── Project-scoped check ───────────────────────────────
    const canOnProject = useCallback(
        (action: PermissionAction, projectManagementUnit?: string): boolean => {
            if (!can('projects', action)) return false;
            if (state.isGlobalScope) return true;

            if (effectiveUser?.Department && projectManagementUnit) {
                // Exact match first, then partial
                const isSameBan = PROJECT_SCOPED_DEPARTMENTS.some(dept =>
                    effectiveUser.Department === dept && projectManagementUnit === dept
                ) || PROJECT_SCOPED_DEPARTMENTS.some(dept =>
                    effectiveUser.Department?.includes(dept) && projectManagementUnit.includes(dept)
                );
                if (isSameBan) return true;

                const isInAnyBan = PROJECT_SCOPED_DEPARTMENTS.some(dept =>
                    effectiveUser.Department?.includes(dept) || dept.includes(effectiveUser.Department || '')
                );
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

/**
 * ImpersonationContext — QLDA ĐDCN TP.HCM
 *
 * Allows admin users to "impersonate" other employees to test permissions.
 * Pattern follows cic-erp-contract/contexts/ImpersonationContext.tsx
 *
 * v2 improvements:
 *  - Auto-timeout: impersonation expires after 30 minutes
 *  - Timestamp stored in localStorage to detect stale sessions
 *  - Expiry warning 2 minutes before auto-stop
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Employee } from '../types';
import { supabase } from '../lib/supabase';
import { permissionCache } from '../utils/permissionCache';

// ── Audit logging ─────────────────────────────────────────────
type ImpersonationAction = 'impersonation_start' | 'impersonation_stop' | 'impersonation_auto_expired';

const logImpersonationEvent = (action: ImpersonationAction, targetUser: Employee, adminAuthUid?: string) => {
    // Fire-and-forget: do not await — must not block UI
    supabase.from('audit_logs').insert({
        action,
        target_entity: 'employees',
        target_id: String(targetUser.EmployeeID),
        changed_by: adminAuthUid ?? 'unknown',
        details: JSON.stringify({
            target_name: targetUser.FullName,
            target_role: targetUser.Role,
            target_department: targetUser.Department,
            timestamp: new Date().toISOString(),
        }),
    }).then(({ error }) => {
        if (error) console.warn('[Impersonation] Audit log failed:', error.message);
    });
};

const STORAGE_KEY = 'qlda_impersonation';
const STORAGE_EXPIRY_KEY = 'qlda_impersonation_expiry';
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 2 * 60 * 1000;  // warn 2 minutes before expiry

interface ImpersonationContextType {
    /** The employee being impersonated (or null) */
    impersonatedUser: Employee | null;
    /** Whether we are currently impersonating */
    isImpersonating: boolean;
    /** Minutes remaining before auto-stop (null if not impersonating) */
    minutesRemaining: number | null;
    /** Whether the 2-minute warning is active */
    expiryWarning: boolean;
    /** Start impersonating a user */
    startImpersonation: (user: Employee) => void;
    /** Stop impersonating and return to real user */
    stopImpersonation: () => void;
    /** Extend the session by 30 more minutes */
    extendSession: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Track real admin's auth UID for audit logs
    const [adminAuthUid, setAdminAuthUid] = useState<string | undefined>(undefined);

    // Fetch real admin UID on mount (only once)
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user?.id) setAdminAuthUid(data.session.user.id);
        });
    }, []);

    // Initialize from localStorage — but validate expiry immediately
    const [impersonatedUser, setImpersonatedUser] = useState<Employee | null>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
            if (stored && expiry) {
                const expiryTime = parseInt(expiry, 10);
                if (Date.now() < expiryTime) {
                    const parsed = JSON.parse(stored);
                    console.log('[Impersonation] Restored (expires in', Math.round((expiryTime - Date.now()) / 60000), 'min):', parsed.FullName);
                    return parsed;
                } else {
                    // Expired — clean up
                    console.log('[Impersonation] Session expired, clearing...');
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(STORAGE_EXPIRY_KEY);
                }
            }
        } catch (err) {
            console.warn('[Impersonation] Failed to restore:', err);
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_EXPIRY_KEY);
        }
        return null;
    });

    const [expiryTime, setExpiryTime] = useState<number | null>(() => {
        const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
        return expiry ? parseInt(expiry, 10) : null;
    });

    const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
    const [expiryWarning, setExpiryWarning] = useState(false);

    // ── Countdown timer ──────────────────────────────────────
    useEffect(() => {
        if (!impersonatedUser || !expiryTime) {
            setMinutesRemaining(null);
            setExpiryWarning(false);
            return;
        }

        const tick = () => {
            const remaining = expiryTime - Date.now();
            if (remaining <= 0) {
                // Auto-stop — log the expiry event
                console.log('[Impersonation] Session expired — auto-stopping');
                logImpersonationEvent('impersonation_auto_expired', impersonatedUser, adminAuthUid);
                setImpersonatedUser(null);
                setExpiryTime(null);
                setMinutesRemaining(null);
                setExpiryWarning(false);
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_EXPIRY_KEY);
                return;
            }
            const mins = Math.ceil(remaining / 60000);
            setMinutesRemaining(mins);
            setExpiryWarning(remaining <= WARNING_MS);
        };

        tick(); // immediate update
        const interval = setInterval(tick, 10000); // update every 10s
        return () => clearInterval(interval);
    }, [impersonatedUser, expiryTime]);

    // ── Start impersonation ──────────────────────────────────
    const startImpersonation = useCallback((user: Employee) => {
        const expiry = Date.now() + TIMEOUT_MS;
        setImpersonatedUser(user);
        setExpiryTime(expiry);
        setExpiryWarning(false);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiry));
        } catch (err) {
            console.warn('[Impersonation] Failed to save:', err);
        }
        console.log('[Impersonation] Started as:', user.FullName, user.Role, '— expires at', new Date(expiry).toLocaleTimeString());
        // Invalidate cached permissions for the impersonated user so PermissionContext refetches
        permissionCache.invalidate(user.EmployeeID);
        logImpersonationEvent('impersonation_start', user, adminAuthUid);
    }, [adminAuthUid]);

    // ── Stop impersonation ───────────────────────────────────
    const stopImpersonation = useCallback(() => {
        if (impersonatedUser) {
            logImpersonationEvent('impersonation_stop', impersonatedUser, adminAuthUid);
        }
        // Clear all permission cache so real admin's permissions reload cleanly
        permissionCache.invalidateAll();
        console.log('[Impersonation] Stopped');
        setImpersonatedUser(null);
        setExpiryTime(null);
        setMinutesRemaining(null);
        setExpiryWarning(false);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
    }, [impersonatedUser, adminAuthUid]);

    // ── Extend session ───────────────────────────────────────
    const extendSession = useCallback(() => {
        if (!impersonatedUser) return;
        const newExpiry = Date.now() + TIMEOUT_MS;
        setExpiryTime(newExpiry);
        setExpiryWarning(false);
        localStorage.setItem(STORAGE_EXPIRY_KEY, String(newExpiry));
        console.log('[Impersonation] Session extended to', new Date(newExpiry).toLocaleTimeString());
    }, [impersonatedUser]);

    return (
        <ImpersonationContext.Provider
            value={{
                impersonatedUser,
                isImpersonating: !!impersonatedUser,
                minutesRemaining,
                expiryWarning,
                startImpersonation,
                stopImpersonation,
                extendSession,
            }}
        >
            {children}
        </ImpersonationContext.Provider>
    );
};

export const useImpersonation = () => {
    const context = useContext(ImpersonationContext);
    if (!context) {
        throw new Error('useImpersonation must be used within ImpersonationProvider');
    }
    return context;
};

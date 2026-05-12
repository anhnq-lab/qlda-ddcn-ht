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
                // Auto-stop
                console.log('[Impersonation] Session expired — auto-stopping');
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
    }, []);

    // ── Stop impersonation ───────────────────────────────────
    const stopImpersonation = useCallback(() => {
        console.log('[Impersonation] Stopped');
        setImpersonatedUser(null);
        setExpiryTime(null);
        setMinutesRemaining(null);
        setExpiryWarning(false);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
    }, []);

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

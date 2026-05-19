/**
 * useLoginRateLimit — Brute-force protection for login form
 *
 * - Tracks failed attempts in localStorage (persists across refresh)
 * - Locks out user for LOCKOUT_DURATION_MS after MAX_ATTEMPTS failures
 * - Provides countdown timer for UX feedback
 * - Resets on successful login
 */

import { useState, useEffect, useCallback } from 'react';

const ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_UNTIL_KEY = 'login_lockout_until';

const MAX_ATTEMPTS = 5;
/**
 * Progressive lockout:
 * - Lần 1 block (fail >= 5): 60 giây
 * - Lần 2 block (fail >= 10): 2 phút
 * - Lần 3+ block (fail >= 15): 5 phút
 */
const LOCKOUT_TIERS = [
    { failThreshold: 5,  durationMs: 60 * 1000 },   // 60 giây
    { failThreshold: 10, durationMs: 2 * 60 * 1000 }, // 2 phút
    { failThreshold: 15, durationMs: 5 * 60 * 1000 }, // 5 phút
];
const PERSISTENT_LOCKOUT_THRESHOLD = 10;

interface RateLimitState {
    isLocked: boolean;
    secondsRemaining: number;
    attemptCount: number;
    canAttempt: boolean;
}

interface UseLoginRateLimitReturn extends RateLimitState {
    recordFailedAttempt: () => void;
    resetAttempts: () => void;
}

function getStoredAttempts(): number {
    try {
        return parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
    } catch {
        return 0;
    }
}

function getLockoutUntil(): number {
    try {
        return parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '0', 10);
    } catch {
        return 0;
    }
}

function computeState(): RateLimitState {
    const lockoutUntil = getLockoutUntil();
    const now = Date.now();
    const attemptCount = getStoredAttempts();

    if (lockoutUntil > now) {
        const secondsRemaining = Math.ceil((lockoutUntil - now) / 1000);
        return { isLocked: true, secondsRemaining, attemptCount, canAttempt: false };
    }

    return { isLocked: false, secondsRemaining: 0, attemptCount, canAttempt: true };
}

export function useLoginRateLimit(): UseLoginRateLimitReturn {
    const [state, setState] = useState<RateLimitState>(computeState);

    // Countdown timer — only runs when locked
    useEffect(() => {
        if (!state.isLocked) return;

        const interval = setInterval(() => {
            const next = computeState();
            setState(next);
            if (!next.isLocked) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [state.isLocked]);

    const recordFailedAttempt = useCallback(() => {
        try {
            const current = getStoredAttempts() + 1;
            localStorage.setItem(ATTEMPTS_KEY, String(current));

            // Tính lockout duration theo tier
            const tier = [...LOCKOUT_TIERS].reverse().find(t => current >= t.failThreshold);
            if (tier) {
                const lockoutUntil = Date.now() + tier.durationMs;
                localStorage.setItem(LOCKOUT_UNTIL_KEY, String(lockoutUntil));
            }
        } catch {
            // localStorage unavailable — gracefully degrade
        }
        setState(computeState());
    }, []);

    const resetAttempts = useCallback(() => {
        try {
            localStorage.removeItem(ATTEMPTS_KEY);
            localStorage.removeItem(LOCKOUT_UNTIL_KEY);
        } catch {
            // ignore
        }
        setState(computeState());
    }, []);

    return { ...state, recordFailedAttempt, resetAttempts };
}

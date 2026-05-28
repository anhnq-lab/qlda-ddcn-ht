import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Employee } from '../types';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { permissionCache } from '../utils/permissionCache';

export type LoginResult = 'success' | 'failed' | 'mfa_required';

interface AuthContextType {
    currentUser: Employee | null;
    supabaseUser: User | null;
    session: Session | null;
    userType: 'employee' | 'contractor';
    contractorId: string | null;
    login: (identifier: string, pass: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    mfaPending: boolean;
    completeMfaChallenge: (code: string) => Promise<boolean>;
    cancelMfaChallenge: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Resolve identifier → email via single RPC call.
 * Supports: username (employee or contractor), email, or phone.
 */
async function resolveEmail(identifier: string): Promise<string | null> {
    if (identifier.includes('@')) return identifier;

    try {
        const { data, error } = await supabase.rpc('resolve_user_identity', {
            p_identifier: identifier,
        });

        if (error) {
            console.error('[resolveEmail] RPC error:', error.message);
            return null;
        }

        const resolvedData = data as { email: string | null } | null;
        return resolvedData?.email || null;
    } catch (err) {
        console.error('[resolveEmail] Exception:', err);
        return null;
    }
}

/**
 * Fetch user profile (employee or contractor) via single RPC call.
 */
async function fetchUserProfile(authUserId: string): Promise<{
    user: Employee | null;
    userType: 'employee' | 'contractor';
    contractorId: string | null;
}> {
    try {
        const { data, error } = await supabase.rpc('get_user_profile_by_auth_id', {
            p_auth_user_id: authUserId,
        });

        if (error || !data) {
            return { user: null, userType: 'employee', contractorId: null };
        }

        const profileData = data as Record<string, any>;
        if (profileData.user_type === 'unknown') {
            return { user: null, userType: 'employee', contractorId: null };
        }

        if (profileData.user_type === 'employee') {
            return {
                user: {
                    EmployeeID: profileData.employee_id,
                    FullName: profileData.full_name,
                    Role: profileData.role as any,
                    Department: profileData.department || '',
                    Position: profileData.position || '',
                    Email: profileData.email || '',
                    Phone: profileData.phone || '',
                    AvatarUrl: profileData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.full_name)}&background=0D8ABC&color=fff`,
                    JoinDate: profileData.join_date || '',
                    Status: profileData.status as any || 'Active',
                    Username: profileData.username || '',
                    SystemRole: profileData.system_role || undefined,
                },
                userType: 'employee',
                contractorId: null,
            };
        }

        if (profileData.user_type === 'contractor') {
            const contractorName = profileData.full_name || profileData.display_name || 'Nhà thầu';
            // allowed_project_ids now included in RPC response — no extra query needed
            const allowedProjectIds: string[] = profileData.allowed_project_ids || [];

            return {
                user: {
                    EmployeeID: authUserId,
                    FullName: contractorName,
                    Role: 'contractor' as any,
                    Department: profileData.display_name || '',
                    Position: 'Nhà thầu',
                    Email: profileData.email || '',
                    Phone: profileData.phone || '',
                    AvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(contractorName)}&background=4a90e2&color=fff`,
                    JoinDate: '',
                    Status: 'Active' as any,
                    Username: profileData.username || '',
                    AllowedProjectIDs: allowedProjectIds,
                },
                userType: 'contractor',
                contractorId: profileData.contractor_id,
            };
        }

        return { user: null, userType: 'employee', contractorId: null };
    } catch (err) {
        console.error('[fetchUserProfile] Exception:', err);
        return { user: null, userType: 'employee', contractorId: null };
    }
}

let autoLoginAttempted = false;

// --- INACTIVITY TIMEOUT ---
const INACTIVITY_KEY = 'lastActivityTime';
const INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

function isSessionExpiredByInactivity(): boolean {
    const last = localStorage.getItem(INACTIVITY_KEY);
    // No recorded activity = session predates this feature → treat as expired
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > INACTIVITY_TIMEOUT_MS;
}

let activityDebounceTimer: ReturnType<typeof setTimeout> | null = null;
function recordActivity() {
    if (activityDebounceTimer) return;
    activityDebounceTimer = setTimeout(() => {
        localStorage.setItem(INACTIVITY_KEY, Date.now().toString());
        activityDebounceTimer = null;
    }, 30_000);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userType, setUserType] = useState<'employee' | 'contractor'>('employee');
    const [contractorId, setContractorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingMfa, setPendingMfa] = useState<{ factorId: string; challengeId: string } | null>(null);

    // Add fetching ref to prevent concurrent duplicate profile requests
    const fetchingProfileRef = useRef<string | null>(null);

    const handleAuthUser = useCallback(async (authUser: User | null) => {
        if (!authUser) {
            setCurrentUser(null);
            setSupabaseUser(null);
            setUserType('employee');
            setContractorId(null);
            return;
        }

        // Prevent double fetching for the same user (fixes concurrent RPC calls)
        if (fetchingProfileRef.current === authUser.id) {
            return;
        }
        fetchingProfileRef.current = authUser.id;

        setSupabaseUser(authUser);

        // Single RPC call to resolve user profile (employee or contractor)
        const profile = await fetchUserProfile(authUser.id);

        fetchingProfileRef.current = null;

        if (profile.user) {
            setCurrentUser(profile.user);
            setUserType(profile.userType);
            setContractorId(profile.contractorId);
            return;
        }

        // Orphan auth user — exists in Supabase Auth but NOT linked to any employee/contractor.
        // Force sign-out to prevent a ghost session with no meaningful permissions.
        console.warn('[Auth] Orphan auth user detected (no employee/contractor link). Forcing sign-out.', authUser.id);
        await supabase.auth.signOut({ scope: 'local' });
        setCurrentUser(null);
        setSupabaseUser(null);
        setUserType('employee');
        setContractorId(null);
    }, []);

    // Track user activity to enforce inactivity timeout
    useEffect(() => {
        const events = ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;
        events.forEach(e => window.addEventListener(e, recordActivity, { passive: true }));
        return () => {
            events.forEach(e => window.removeEventListener(e, recordActivity));
        };
    }, []);

    // Initialize: restore session + setup auth listener
    useEffect(() => {
        let mounted = true;

        // Safety timeout
        const timeout = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('[Auth] Session check timed out after 4s - forcing release');
                setIsLoading(false);
            }
        }, 4000);

        const initAuth = async () => {
            try {
                let existingSession: Session | null = null;
                try {
                    const { data, error } = await supabase.auth.getSession();
                    if (!error) existingSession = data.session;
                } catch (e: any) {
                    console.warn('[Auth] getSession failed:', e.message);
                }
                
                // --- INACTIVITY TIMEOUT CHECK ---
                if (existingSession && isSessionExpiredByInactivity()) {
                    console.log('[Auth] Session expired due to inactivity (>8h), signing out');
                    await supabase.auth.signOut({ scope: 'local' });
                    existingSession = null;
                    localStorage.removeItem(INACTIVITY_KEY);
                }

                // ╔════════════════════════════════════════════════════════════╗
                // ║  🔒 SECURITY WARNING — DEV AUTO-LOGIN                      ║
                // ║                                                            ║
                // ║  This block auto-logs in with fallback credentials during  ║
                // ║  local development ONLY. It is COMPLETELY STRIPPED from    ║
                // ║  production builds by Vite (import.meta.env.DEV = false). ║
                // ║                                                            ║
                // ║  ⚠️  DO NOT use these credentials in production.           ║
                // ║  ⚠️  Override via .env.local: VITE_DEV_EMAIL /            ║
                // ║      VITE_DEV_PASSWORD to avoid committing real secrets.   ║
                // ║                                                            ║
                // ║  If import.meta.env.DEV is false, NONE of this code runs. ║
                // ╚════════════════════════════════════════════════════════════╝
                if (import.meta.env.DEV && !existingSession) {
                    const explicitlyLoggedOut = localStorage.getItem('explicitlyLoggedOut') === 'true';
                    const devEmail = import.meta.env.VITE_DEV_EMAIL;
                    const devPassword = import.meta.env.VITE_DEV_PASSWORD;
                    
                    if (!explicitlyLoggedOut && !autoLoginAttempted && devEmail && devPassword) {
                        autoLoginAttempted = true;
                        console.log('[Auth] 🔧 Local Dev: Auto-logging in as Admin...');
                        console.warn('[Auth] ⚠️ DEV AUTO-LOGIN ACTIVE — this MUST NOT run in production!');
                        const demoLogin = await supabase.auth.signInWithPassword({
                            email: devEmail,
                            password: devPassword,
                        });
                        
                        if (demoLogin.data?.session) {
                            if (!mounted) return;
                            setSession(demoLogin.data.session);
                            await handleAuthUser(demoLogin.data.user);
                            setIsLoading(false);
                            clearTimeout(timeout);
                            return;
                        } else if (demoLogin.error) {
                            console.error('[Auth] Local Dev Auto-login failed:', demoLogin.error.message);
                        }
                    } else if (!devEmail || !devPassword) {
                        console.log('[Auth] 🔧 Local Dev: Auto-login skipped (no VITE_DEV_EMAIL/VITE_DEV_PASSWORD in .env)');
                    }
                }
                
                // Normal flow
                if (!mounted) return;
                setSession(existingSession);
                await handleAuthUser(existingSession?.user ?? null);
            } catch (err) {
                console.error('[Auth] initAuth failed:', err);
                if (mounted) {
                    setSession(null);
                    await handleAuthUser(null);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    clearTimeout(timeout);
                }
            }
        };

        initAuth();

        // Listen for auth changes (login/logout/token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
                if (!mounted) return;
                // Ignore INITIAL_SESSION as we already handle it in initAuth()
                if (event === 'INITIAL_SESSION') return;

                setSession(newSession);
                // Do not await here! Awaiting RPC calls inside auth listener causes deadlocks with Supabase navigator.locks
                handleAuthUser(newSession?.user ?? null).catch(err => {
                    console.error('[Auth] Error handling auth state change:', err);
                });
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [handleAuthUser]);

    const login = async (identifier: string, pass: string): Promise<LoginResult> => {
        console.log('[Auth] Login attempt for:', identifier);

        // Server-side rate limit check (defense-in-depth over client-side hook)
        // Cast to any: new RPCs not yet in generated DB types
        try {
            const { data: rlData } = await (supabase as any).rpc('check_auth_rate_limit', { p_identifier: identifier });
            if ((rlData as any)?.blocked) {
                console.warn('[Auth] Server-side rate limit active for:', identifier);
                return 'failed';
            }
        } catch (rlErr) {
            // Non-blocking: if RPC fails, continue login attempt
            console.warn('[Auth] Rate-limit check failed (non-blocking):', rlErr);
        }

        // Resolve username/phone to email for Supabase Auth
        // Do NOT call signOut() before this — it causes lock conflicts
        let email = await resolveEmail(identifier);
        console.log('[Auth] Resolved email:', email);

        if (!email) {
            console.warn('[Auth] Could not resolve email for:', identifier);
            // Record failed attempt even for unknown identifiers (prevents timing attacks)
            (supabase as any).rpc('record_auth_attempt', { p_identifier: identifier, p_success: false }).then(() => {});
            return 'failed';
        }

        // Sign out existing session before new login (local scope only)
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (_) { /* ignore */ }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        // Record attempt result server-side (fire-and-forget)
        (supabase as any).rpc('record_auth_attempt', {
            p_identifier: identifier,
            p_success: !error && !!data.user,
        }).then(() => {});

        if (error || !data.user) {
            console.error('[Auth] Login failed:', error?.message);
            return 'failed';
        }

        // Check if MFA challenge is required (AAL1 session → need AAL2)
        try {
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
                const { data: factors } = await supabase.auth.mfa.listFactors();
                const totp = factors?.totp?.[0];
                if (totp) {
                    const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
                    if (!chalErr && challenge) {
                        setPendingMfa({ factorId: totp.id, challengeId: challenge.id });
                        return 'mfa_required';
                    }
                }
            }
        } catch (mfaErr) {
            console.warn('[Auth] MFA level check failed (non-blocking):', mfaErr);
        }

        // Full login success (no MFA needed)
        console.log('[Auth] Login success for:', email);
        localStorage.removeItem('explicitlyLoggedOut');
        localStorage.setItem(INACTIVITY_KEY, Date.now().toString());

        // Fire-and-forget: ghi audit log đăng nhập thành công
        supabase.from('audit_logs').insert({
            action: 'LOGIN_SUCCESS',
            target_entity: 'auth',
            target_id: data.user.id,
            changed_by: data.user.id,
            details: `Login via: ${identifier}`,
        }).then(() => {});

        // Update last_login (fire-and-forget)
        supabase
            .from('user_accounts')
            .update({ last_login: new Date().toISOString() } as any)
            .eq('auth_user_id', data.user.id)
            .then(() => { });

        supabase
            .from('contractor_accounts')
            .update({ last_login: new Date().toISOString() } as any)
            .eq('auth_user_id', data.user.id)
            .then(() => { });

        return 'success';
    };

    const completeMfaChallenge = async (code: string): Promise<boolean> => {
        if (!pendingMfa) return false;
        const { data: session, error } = await supabase.auth.mfa.verify({
            factorId: pendingMfa.factorId,
            challengeId: pendingMfa.challengeId,
            code: code.replace(/\s/g, ''),
        });
        if (error || !session) {
            console.error('[Auth] MFA verify failed:', error?.message);
            return false;
        }
        setPendingMfa(null);
        localStorage.removeItem('explicitlyLoggedOut');
        localStorage.setItem(INACTIVITY_KEY, Date.now().toString());
        // Auth state listener fires SIGNED_IN with AAL2 session → handleAuthUser completes login
        return true;
    };

    const cancelMfaChallenge = () => {
        setPendingMfa(null);
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    };

    const logout = async () => {
        permissionCache.invalidateAll(); // Clear all cached permissions on logout
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSupabaseUser(null);
        setSession(null);
        setUserType('employee');
        setContractorId(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('demoBypassActive');
        localStorage.removeItem(INACTIVITY_KEY);
        localStorage.setItem('explicitlyLoggedOut', 'true');
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            supabaseUser,
            session,
            userType,
            contractorId,
            login,
            logout,
            isAuthenticated: !!currentUser,
            isLoading,
            mfaPending: !!pendingMfa,
            completeMfaChallenge,
            cancelMfaChallenge,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


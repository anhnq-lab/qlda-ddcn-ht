import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Employee } from '../types';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { permissionCache } from '../utils/permissionCache';

interface AuthContextType {
    currentUser: Employee | null;
    supabaseUser: User | null;
    session: Session | null;
    userType: 'employee' | 'contractor';
    contractorId: string | null;
    login: (identifier: string, pass: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
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
            const contractorName = profileData.full_name || 'Nhà thầu';
            
            // Fetch allowed_project_ids for this contractor account
            let allowedProjectIds: string[] = [];
            try {
                const { data: contractorData, error: contractorErr } = await supabase
                    .from('contractor_accounts')
                    .select('allowed_project_ids')
                    .eq('auth_user_id', authUserId)
                    .single();
                
                if (!contractorErr && contractorData?.allowed_project_ids) {
                    allowedProjectIds = contractorData.allowed_project_ids;
                }
            } catch (err) {
                console.error('[fetchUserProfile] Error fetching contractor accounts:', err);
            }

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

        // Fallback: user exists in Auth but not linked
        setUserType('employee');
        setContractorId(null);
        setCurrentUser({
            EmployeeID: authUser.id,
            FullName: authUser.email || 'User',
            Role: 'Staff' as any,
            Department: '',
            Position: '',
            Email: authUser.email || '',
            Phone: '',
            AvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.email || 'U')}&background=0D8ABC&color=fff`,
            JoinDate: '',
            Status: 'Active' as any,
            Username: authUser.email || '',
        });
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

    const login = async (identifier: string, pass: string): Promise<boolean> => {
        console.log('[Auth] Login attempt for:', identifier);

        // Resolve username/phone to email for Supabase Auth
        // Do NOT call signOut() before this — it causes lock conflicts
        let email = await resolveEmail(identifier);
        console.log('[Auth] Resolved email:', email);

        if (!email) {
            // Identifier không khớp với username / phone nào trong hệ thống
            console.error('[Auth] Could not resolve email for:', identifier);
            // Fire-and-forget: ghi audit log đăng nhập thất bại (username không tồn tại)
            supabase.from('audit_logs').insert({
                action: 'LOGIN_FAILED',
                target_entity: 'auth',
                target_id: 'auth',
                changed_by: identifier,
                details: `Identifier not found: ${identifier}`,
            }).then(() => {});
            return false;
        }

        // Sign out existing session before new login (local scope only)
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (_) { /* ignore */ }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error || !data.user) {
            console.error('[Auth] Login failed:', error?.message);
            // Fire-and-forget: ghi audit log đăng nhập thất bại (sai mật khẩu)
            supabase.from('audit_logs').insert({
                action: 'LOGIN_FAILED',
                target_entity: 'auth',
                target_id: 'auth',
                changed_by: identifier,
                details: `Wrong password for: ${identifier}`,
            }).then(() => {});
            return false;
        }

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

        return true;
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


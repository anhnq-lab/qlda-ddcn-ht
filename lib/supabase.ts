import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ExtendedDatabase as Database } from '../types/database-ext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase environment variables not set. Backend features will be unavailable.');
}

// In-memory lock to avoid navigator.locks getting stuck in some browser states
let lockPromise = Promise.resolve();
const memoryLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
    let resolver: () => void;
    const nextLock = new Promise<void>((resolve) => { resolver = resolve; });
    const prevLock = lockPromise;
    lockPromise = nextLock;

    try {
        await prevLock;
        return await fn();
    } finally {
        resolver!();
    }
};

export const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key',
    {
        auth: {
            storageKey: 'qlda-ddcn-auth',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);

/**
 * Escape hatch for tables added after the last `supabase gen types` run.
 * Use this client for: contractor_accounts, role_permission_defaults,
 * dashboard_widget_config, sidebar_module_config, cde_audit_log, cde_comments,
 * cde_permissions, cde_transmittals.
 * Remove after running: supabase gen types typescript --local > types/database.ts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseExt: SupabaseClient<Database> = supabase;

/** Check if Supabase is properly configured */
export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseKey);
};

/**
 * Privileged Supabase Auth admin operations.
 *
 * The service_role key is NEVER shipped to the browser. These calls are
 * proxied to the `admin-user-ops` Edge Function, which re-verifies that the
 * caller is an admin (DB `is_admin()`) before acting with the service role.
 */
export type AdminUserAction = 'createUser' | 'updateUser' | 'deleteUser';

export async function adminUserOp<T = any>(
    action: AdminUserAction,
    payload: Record<string, unknown>
): Promise<T> {
    const { data, error } = await supabase.functions.invoke('admin-user-ops', {
        body: { action, payload },
    });
    if (error) {
        // Surface the function's JSON error message when available
        let message = error.message;
        try {
            const ctx = (error as any)?.context;
            if (ctx && typeof ctx.json === 'function') {
                const j = await ctx.json();
                if (j?.error) message = j.error;
            }
        } catch {
            /* keep original message */
        }
        throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data as T;
}

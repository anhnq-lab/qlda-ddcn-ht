import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

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

/** Check if Supabase is properly configured */
export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseKey);
};

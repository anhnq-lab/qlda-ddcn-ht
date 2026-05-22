/**
 * RLS integration test harness
 *
 * These tests hit a real Supabase project to verify that Row Level
 * Security policies enforce the intended scope. They are SKIPPED when
 * the required env vars are missing — see README in this folder.
 *
 * Required env (read from .env.test or process.env):
 *   SUPABASE_TEST_URL                 # https://<project>.supabase.co
 *   SUPABASE_TEST_ANON_KEY            # anon key
 *   SUPABASE_TEST_SERVICE_ROLE_KEY    # service-role key (seed + truncate)
 *
 * Optional pre-seeded test fixtures (uuid/text PKs of rows that exist
 * in the test DB and satisfy each persona's expected scope):
 *   SUPABASE_TEST_ADMIN_EMAIL         # admin user (global scope)
 *   SUPABASE_TEST_ADMIN_PASSWORD
 *   SUPABASE_TEST_MEMBER_EMAIL        # employee who IS a member of TEST_PROJECT_ID
 *   SUPABASE_TEST_MEMBER_PASSWORD
 *   SUPABASE_TEST_OUTSIDER_EMAIL      # employee NOT a member of TEST_PROJECT_ID
 *   SUPABASE_TEST_OUTSIDER_PASSWORD
 *   SUPABASE_TEST_CONTRACTOR_EMAIL    # contractor account
 *   SUPABASE_TEST_CONTRACTOR_PASSWORD
 *   SUPABASE_TEST_PROJECT_ID
 *
 * If any of the four credential pairs is missing, the corresponding
 * persona-specific tests are individually skipped.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RlsTestEnv {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    admin: { email: string; password: string } | null;
    member: { email: string; password: string } | null;
    outsider: { email: string; password: string } | null;
    contractor: { email: string; password: string } | null;
    testProjectId: string | null;
}

export function readRlsEnv(): RlsTestEnv | null {
    const url = process.env.SUPABASE_TEST_URL;
    const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) return null;

    const persona = (prefix: string) => {
        const email = process.env[`SUPABASE_TEST_${prefix}_EMAIL`];
        const password = process.env[`SUPABASE_TEST_${prefix}_PASSWORD`];
        return email && password ? { email, password } : null;
    };

    return {
        url,
        anonKey,
        serviceRoleKey,
        admin: persona('ADMIN'),
        member: persona('MEMBER'),
        outsider: persona('OUTSIDER'),
        contractor: persona('CONTRACTOR'),
        testProjectId: process.env.SUPABASE_TEST_PROJECT_ID || null,
    };
}

/** Service-role client — used to seed + cleanup, bypasses RLS. */
export function adminClient(env: RlsTestEnv): SupabaseClient {
    return createClient(env.url, env.serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/** Sign in as a persona; returns an anon-key client bound to that JWT. */
export async function clientAs(
    env: RlsTestEnv,
    creds: { email: string; password: string }
): Promise<SupabaseClient> {
    const client = createClient(env.url, env.anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.auth.signInWithPassword(creds);
    if (error) throw new Error(`Sign-in failed for ${creds.email}: ${error.message}`);
    return client;
}

/** Anonymous client — no session, used to verify RLS denies unauthenticated reads. */
export function anonClient(env: RlsTestEnv): SupabaseClient {
    return createClient(env.url, env.anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * Count rows the given client can SELECT from a table.
 * Use `head: true` so we don't pull data — only the count.
 */
export async function countRows(client: SupabaseClient, table: string, filter?: Record<string, unknown>) {
    let q = client.from(table).select('*', { count: 'exact', head: true });
    for (const [k, v] of Object.entries(filter || {})) {
        q = q.eq(k, v as any);
    }
    const { count, error } = await q;
    return { count: count ?? 0, error: error?.message ?? null };
}

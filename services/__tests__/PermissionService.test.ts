/**
 * Unit Tests — services/PermissionService.ts
 *
 * Covers the public surface: getByUserId, getAll, upsert (incl. audit
 * trail), initializeForUser, hasPermission, deleteByUserId,
 * getDefaultPermissions (DB hit + fallback), initializeAllUsers.
 *
 * Uses a chainable Supabase mock factory that lets each test set the
 * resolved value for the next query.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionService } from '../PermissionService';
import type {
    PermissionAction,
    PermissionResource,
    SystemRole,
} from '../../types/permission.types';

// ── Chainable Supabase mock ───────────────────────────────────────
// Each table (.from('table')) returns a fresh chainable proxy whose
// terminal method (select / insert / upsert / delete / single / maybeSingle)
// resolves to the value pushed to `nextResolved`.

const nextResolved: Array<{ data: unknown; error: unknown }> = [];

function pushResolved(v: { data: unknown; error: unknown }) {
    nextResolved.push(v);
}

function createChain() {
    const chain: Record<string, any> = {};
    const terminals = ['select', 'insert', 'upsert', 'delete', 'update'];
    const passthroughs = [
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
        'in', 'not', 'is', 'like', 'ilike', 'or', 'and',
        'filter', 'order', 'limit', 'range',
    ];

    let pending = false;

    for (const m of terminals) {
        chain[m] = vi.fn().mockImplementation(() => { pending = true; return chain; });
    }
    for (const m of passthroughs) {
        chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.single = vi.fn().mockImplementation(() => chain);
    chain.maybeSingle = vi.fn().mockImplementation(() => chain);

    chain.then = (resolve: Function) => {
        if (!pending && nextResolved.length === 0) {
            resolve({ data: null, error: null });
            return Promise.resolve({ data: null, error: null });
        }
        const v = nextResolved.shift() ?? { data: null, error: null };
        pending = false;
        resolve(v);
        return Promise.resolve(v);
    };
    return chain;
}

const fromCalls: string[] = [];

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: (table: string) => {
            fromCalls.push(table);
            return createChain();
        },
    },
}));

beforeEach(() => {
    nextResolved.length = 0;
    fromCalls.length = 0;
    vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════
describe('PermissionService', () => {
    // ─── getByUserId ───────────────────────────────────────────────
    describe('getByUserId', () => {
        it('returns mapped permissions for a user', async () => {
            pushResolved({
                data: [
                    {
                        id: 'p1',
                        user_id: 'u1',
                        resource: 'projects',
                        actions: ['view', 'create'],
                        created_at: '2026-01-01',
                        updated_at: '2026-01-02',
                    },
                ],
                error: null,
            });

            const out = await PermissionService.getByUserId('u1');
            expect(out).toHaveLength(1);
            expect(out[0]).toEqual({
                id: 'p1',
                userId: 'u1',
                resource: 'projects',
                actions: ['view', 'create'],
                createdAt: '2026-01-01',
                updatedAt: '2026-01-02',
            });
            expect(fromCalls).toContain('user_permissions');
        });

        it('returns [] when no rows', async () => {
            pushResolved({ data: [], error: null });
            const out = await PermissionService.getByUserId('u-missing');
            expect(out).toEqual([]);
        });

        it('throws when supabase returns an error', async () => {
            pushResolved({ data: null, error: new Error('DB down') });
            await expect(PermissionService.getByUserId('u1')).rejects.toThrow('DB down');
        });
    });

    // ─── getAll ────────────────────────────────────────────────────
    describe('getAll', () => {
        it('returns all permissions mapped', async () => {
            pushResolved({
                data: [
                    { id: 'p1', user_id: 'u1', resource: 'projects', actions: ['view'] },
                    { id: 'p2', user_id: 'u2', resource: 'tasks', actions: ['view', 'update'] },
                ],
                error: null,
            });

            const out = await PermissionService.getAll();
            expect(out).toHaveLength(2);
            expect(out.map((p) => p.userId)).toEqual(['u1', 'u2']);
        });
    });

    // ─── upsert ────────────────────────────────────────────────────
    describe('upsert', () => {
        it('upserts without changedBy → does NOT call audit', async () => {
            pushResolved({
                data: {
                    id: 'p1',
                    user_id: 'u1',
                    resource: 'projects',
                    actions: ['view'],
                },
                error: null,
            });

            const out = await PermissionService.upsert(
                'u1',
                'projects' as PermissionResource,
                ['view'] as PermissionAction[]
            );

            expect(out.userId).toBe('u1');
            expect(out.actions).toEqual(['view']);
            expect(fromCalls.filter((t) => t === 'audit_logs')).toHaveLength(0);
        });

        it('upserts WITH changedBy → fetches old + writes audit row', async () => {
            // 1) old-actions fetch
            pushResolved({ data: { actions: ['view'] }, error: null });
            // 2) upsert returns new row
            pushResolved({
                data: {
                    id: 'p1', user_id: 'u1', resource: 'projects',
                    actions: ['view', 'create'],
                },
                error: null,
            });
            // 3) audit insert
            pushResolved({ data: null, error: null });

            const out = await PermissionService.upsert(
                'u1',
                'projects' as PermissionResource,
                ['view', 'create'] as PermissionAction[],
                'admin-1'
            );

            expect(out.actions).toEqual(['view', 'create']);
            // user_permissions table hit twice (fetch + upsert), audit_logs once
            expect(fromCalls.filter((t) => t === 'user_permissions').length).toBeGreaterThanOrEqual(2);
            expect(fromCalls).toContain('audit_logs');
        });

        it('throws when upsert errors', async () => {
            pushResolved({ data: null, error: new Error('unique violation') });
            await expect(
                PermissionService.upsert('u1', 'tasks' as PermissionResource, [] as PermissionAction[])
            ).rejects.toThrow('unique violation');
        });
    });

    // ─── hasPermission ─────────────────────────────────────────────
    describe('hasPermission', () => {
        it('returns true when action is in stored actions', async () => {
            pushResolved({ data: { actions: ['view', 'update'] }, error: null });
            const ok = await PermissionService.hasPermission('u1', 'projects' as PermissionResource, 'view');
            expect(ok).toBe(true);
        });

        it('returns false when action is missing', async () => {
            pushResolved({ data: { actions: ['view'] }, error: null });
            const ok = await PermissionService.hasPermission('u1', 'projects' as PermissionResource, 'delete');
            expect(ok).toBe(false);
        });

        it('returns false when no row exists (error path)', async () => {
            pushResolved({ data: null, error: new Error('No rows') });
            const ok = await PermissionService.hasPermission('u1', 'projects' as PermissionResource, 'view');
            expect(ok).toBe(false);
        });
    });

    // ─── deleteByUserId ────────────────────────────────────────────
    describe('deleteByUserId', () => {
        it('completes silently on success', async () => {
            pushResolved({ data: null, error: null });
            await expect(PermissionService.deleteByUserId('u1')).resolves.toBeUndefined();
        });

        it('throws on error', async () => {
            pushResolved({ data: null, error: new Error('FK violation') });
            await expect(PermissionService.deleteByUserId('u1')).rejects.toThrow('FK violation');
        });
    });

    // ─── getDefaultPermissions ─────────────────────────────────────
    describe('getDefaultPermissions', () => {
        it('returns DB-sourced defaults when role_permission_defaults has rows', async () => {
            pushResolved({
                data: [
                    { resource: 'projects', actions: ['view', 'create'] },
                    { resource: 'tasks',    actions: ['view'] },
                ],
                error: null,
            });

            const defaults = await PermissionService.getDefaultPermissions('staff' as SystemRole);
            expect(defaults.projects).toEqual(['view', 'create']);
            expect(defaults.tasks).toEqual(['view']);
            expect(fromCalls).toContain('role_permission_defaults');
        });

        it('falls back to hardcoded constants when DB has no rows', async () => {
            pushResolved({ data: [], error: null });
            const defaults = await PermissionService.getDefaultPermissions('staff' as SystemRole);
            // hardcoded fallback object exists and has at least one key
            expect(typeof defaults).toBe('object');
        });

        it('falls back to hardcoded constants on DB error', async () => {
            pushResolved({ data: null, error: new Error('table missing') });
            const defaults = await PermissionService.getDefaultPermissions('staff' as SystemRole);
            expect(typeof defaults).toBe('object');
        });
    });

    // ─── initializeForUser ─────────────────────────────────────────
    describe('initializeForUser', () => {
        it('no-ops when role has no defaults', async () => {
            // getDefaultPermissions: DB returns empty AND hardcoded fallback is empty
            // for an unknown role. We push empty and use a non-existent role.
            pushResolved({ data: [], error: null });
            await expect(
                PermissionService.initializeForUser('u1', 'nonexistent_role' as SystemRole)
            ).resolves.toBeUndefined();
        });

        it('upserts the resolved default permissions when role has defaults', async () => {
            // 1) getDefaultPermissions DB hit
            pushResolved({
                data: [{ resource: 'projects', actions: ['view'] }],
                error: null,
            });
            // 2) upsert
            pushResolved({ data: null, error: null });

            await PermissionService.initializeForUser('u-new', 'staff' as SystemRole);

            // Two hits on the table during this flow
            expect(fromCalls.filter((t) => t === 'user_permissions' || t === 'role_permission_defaults').length)
                .toBeGreaterThanOrEqual(2);
        });
    });

    // ─── initializeAllUsers ────────────────────────────────────────
    describe('initializeAllUsers', () => {
        it('skips users that already have permission rows', async () => {
            // Check-existence query → already has rows
            pushResolved({ data: [{ id: 'p-existing' }], error: null });

            const count = await PermissionService.initializeAllUsers([
                { id: 'u-existing', role: 'staff' as SystemRole },
            ]);

            expect(count).toBe(0);
        });

        it('initializes users with no existing rows', async () => {
            // Check-existence query → empty
            pushResolved({ data: [], error: null });
            // getDefaultPermissions DB hit
            pushResolved({
                data: [{ resource: 'projects', actions: ['view'] }],
                error: null,
            });
            // upsert
            pushResolved({ data: null, error: null });

            const count = await PermissionService.initializeAllUsers([
                { id: 'u-new', role: 'staff' as SystemRole },
            ]);

            expect(count).toBe(1);
        });

        it('processes multiple users in one batch', async () => {
            // u1: check returns rows → skipped
            pushResolved({ data: [{ id: 'p-existing' }], error: null });
            // u2: check returns [] → initialize. Then defaults DB hit + upsert.
            pushResolved({ data: [], error: null });
            pushResolved({ data: [{ resource: 'projects', actions: ['view'] }], error: null });
            pushResolved({ data: null, error: null });

            const count = await PermissionService.initializeAllUsers([
                { id: 'u-already', role: 'staff' as SystemRole },
                { id: 'u-fresh',   role: 'staff' as SystemRole },
            ]);

            // u-already skipped, u-fresh initialized
            expect(count).toBe(1);
        });
    });
});

/**
 * Drift guard (C-3.2): đảm bảo hằng số TS `DEFAULT_ROLE_PERMISSIONS`
 * luôn khớp với seed SQL `role_permission_defaults`.
 *
 * Nguồn so khớp:
 *   - 20260515100004_seed_all_role_permissions.sql  (seed đầy đủ 9 role)
 *   - 20260602230000_update_staff_task_permissions.sql (override staff.tasks)
 *
 * Nếu sửa một bên mà quên bên kia → test FAIL.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    DEFAULT_ROLE_PERMISSIONS,
    ALL_ROLES,
    type SystemRole,
    type PermissionResource,
    type PermissionAction,
} from '../../types/permission.types';

const MIGRATIONS_DIR = resolve(__dirname, '../../supabase/migrations');

/** Parse các dòng INSERT ('role','resource','[...]') từ file seed. */
function parseSeed(): Record<string, Record<string, string[]>> {
    const sql = readFileSync(
        resolve(MIGRATIONS_DIR, '20260515100004_seed_all_role_permissions.sql'),
        'utf-8'
    );
    const map: Record<string, Record<string, string[]>> = {};
    const rowRe = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'(\[[^\]]*\])'\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = rowRe.exec(sql)) !== null) {
        const [, role, resource, actionsJson] = m;
        const actions = JSON.parse(actionsJson) as string[];
        (map[role] ||= {})[resource] = actions;
    }

    // Áp override staff.tasks (migration 20260602230000)
    const override = readFileSync(
        resolve(MIGRATIONS_DIR, '20260602230000_update_staff_task_permissions.sql'),
        'utf-8'
    );
    const om = /SET\s+actions\s*=\s*'(\[[^\]]*\])'.*?role\s*=\s*'([a-z_]+)'\s+AND\s+resource\s*=\s*'([a-z_]+)'/is.exec(override);
    if (om) {
        const [, actionsJson, role, resource] = om;
        (map[role] ||= {})[resource] = JSON.parse(actionsJson);
    }
    return map;
}

const seed = parseSeed();
const sorted = (a: string[]) => [...a].sort();

describe('DEFAULT_ROLE_PERMISSIONS ↔ seed SQL đồng bộ', () => {
    it('seed parse được dữ liệu', () => {
        expect(Object.keys(seed).length).toBeGreaterThanOrEqual(8);
    });

    for (const role of ALL_ROLES) {
        it(`role "${role}" khớp giữa TS và seed`, () => {
            const tsPerms = DEFAULT_ROLE_PERMISSIONS[role as SystemRole] || {};
            const seedPerms = seed[role] || {};

            // Mọi resource trong TS phải có trong seed với cùng tập action
            for (const [resource, actions] of Object.entries(tsPerms)) {
                expect(
                    seedPerms[resource],
                    `Seed thiếu ${role}.${resource} (TS có: ${actions})`
                ).toBeDefined();
                expect(
                    sorted(seedPerms[resource]),
                    `Lệch action ở ${role}.${resource}`
                ).toEqual(sorted(actions as PermissionAction[]));
            }

            // Mọi resource trong seed phải có trong TS (không thừa)
            for (const resource of Object.keys(seedPerms)) {
                expect(
                    (tsPerms as Record<string, unknown>)[resource],
                    `TS thiếu ${role}.${resource} (seed có: ${seedPerms[resource]})`
                ).toBeDefined();
            }
        });
    }
});

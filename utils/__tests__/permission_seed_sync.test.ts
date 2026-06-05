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

    // Áp các thay đổi từ migration 20260604180000_remove_approve_permission.sql
    // 1. Loại bỏ 'approve' khỏi tất cả các hành động
    for (const role of Object.keys(map)) {
        for (const resource of Object.keys(map[role])) {
            map[role][resource] = map[role][resource].filter(a => a !== 'approve');
        }
    }
    
    // 2. Cập nhật ma trận Kế hoạch Vốn (capital) mới cho các vai trò
    if (map['chief_accountant']) map['chief_accountant']['capital'] = ['view', 'export'];
    if (map['dept_head']) map['dept_head']['capital'] = ['view', 'create', 'update', 'export'];
    if (map['deputy_head']) map['deputy_head']['capital'] = ['view', 'create', 'update', 'export'];
    if (map['specialist']) map['specialist']['capital'] = ['view', 'create', 'update'];

    // 3. Áp các thay đổi từ migration 20260604190000_adjust_director_permissions.sql
    try {
        const adjustSql = readFileSync(
            resolve(MIGRATIONS_DIR, '20260604190000_adjust_director_permissions.sql'),
            'utf-8'
        );
        const adjustRe = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'(\[[^\]]*\])'\s*::jsonb\s*\)/gi;
        let am: RegExpExecArray | null;
        while ((am = adjustRe.exec(adjustSql)) !== null) {
            const [, role, resource, actionsJson] = am;
            (map[role] ||= {})[resource] = JSON.parse(actionsJson);
        }
    } catch (e) {
        console.error('Lỗi khi đọc hoặc parse migration adjust_director_permissions:', e);
    }

    // 4. Áp seed v2 (giai đoạn 1 — Lớp 1) từ migration 20260605120300.
    //    Định dạng: ('role','resource','[...]'::jsonb, now())
    try {
        const v2Sql = readFileSync(
            resolve(MIGRATIONS_DIR, '20260605120300_seed_role_defaults_and_leadership_v2.sql'),
            'utf-8'
        );
        const v2Re = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'(\[[^\]]*\])'::jsonb\s*,\s*now\(\)\s*\)/gi;
        let vm: RegExpExecArray | null;
        while ((vm = v2Re.exec(v2Sql)) !== null) {
            const [, role, resource, actionsJson] = vm;
            (map[role] ||= {})[resource] = JSON.parse(actionsJson);
        }
    } catch (e) {
        console.error('Lỗi khi đọc hoặc parse migration seed_role_defaults_and_leadership_v2:', e);
    }

    // 5. Áp các thay đổi từ migration 20260604200000_adjust_role_permissions_for_user_comments.sql
    try {
        const adjustCommentsSql = readFileSync(
            resolve(MIGRATIONS_DIR, '20260604200000_adjust_role_permissions_for_user_comments.sql'),
            'utf-8'
        );
        
        // Parse các INSERT
        const insertRe = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'(\[[^\]]*\])'::jsonb\s*\)/gi;
        let cma: RegExpExecArray | null;
        while ((cma = insertRe.exec(adjustCommentsSql)) !== null) {
            const [, role, resource, actionsJson] = cma;
            (map[role] ||= {})[resource] = JSON.parse(actionsJson);
        }

        // Xử lý câu lệnh DELETE cho admin_accounts và admin_audit
        const deleteRe = /DELETE\s+FROM\s+public\.role_permission_defaults\s+WHERE\s+role\s+IN\s*\(([^)]+)\)\s+AND\s+resource\s+IN\s*\(([^)]+)\)/i;
        const dma = deleteRe.exec(adjustCommentsSql);
        if (dma) {
            const roles = dma[1].split(',').map(r => r.trim().replace(/['"]/g, ''));
            const resources = dma[2].split(',').map(r => r.trim().replace(/['"]/g, ''));
            for (const r of roles) {
                if (map[r]) {
                    for (const res of resources) {
                        delete map[r][res];
                    }
                }
            }
        }
    } catch (e) {
        console.error('Lỗi khi đọc hoặc parse migration adjust_role_permissions_for_user_comments:', e);
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

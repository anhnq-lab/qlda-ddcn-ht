#!/usr/bin/env node
/**
 * gen-rbac-matrix.mjs — Generate docs/rbac_matrix.md from DB
 *
 * Reads `role_permission_defaults` (the canonical source of role→resource
 * defaults) plus the static label tables from types/permission.types.ts
 * and emits a single markdown table:
 *
 *   |                  | view | create | update | delete | approve | export |
 *   | dashboard        |  ✓   |        |        |        |         |        |
 *   ...
 *
 * One section per System Role. The output file is intended to be
 * committed so reviewers can diff RBAC changes per PR.
 *
 * Requires:
 *   SUPABASE_DB_PASSWORD          (from .env or env)
 *
 * Optional env:
 *   SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_PORT (defaults from
 *   the same pool as scripts/rls-audit.mjs).
 *
 * Usage:
 *   node scripts/gen-rbac-matrix.mjs            # writes docs/rbac_matrix.md
 *   node scripts/gen-rbac-matrix.mjs --check    # exit 1 if file would change
 */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── load .env ──
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq <= 0) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k]) process.env[k] = v;
    }
}

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!PASSWORD) {
    console.error('✘ Missing SUPABASE_DB_PASSWORD in environment / .env');
    process.exit(3);
}
const HOST = process.env.SUPABASE_DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com';
const USER = process.env.SUPABASE_DB_USER || 'postgres.jkaddjllseephsiaqvds';
const PORT = Number(process.env.SUPABASE_DB_PORT || 6543);

const CHECK_MODE = process.argv.includes('--check');
const OUT = path.resolve(__dirname, '../docs/rbac_matrix.md');

// Mirrors types/permission.types.ts. Keep in sync (the TS file is the
// source of truth for labels; here we only need ordering).
const ACTIONS = ['view', 'create', 'update', 'delete', 'export'];

const ROLE_ORDER = [
    'super_admin', 'director', 'deputy_director', 'chief_accountant',
    'dept_head', 'deputy_head', 'specialist', 'staff', 'contractor',
];

const RESOURCE_LABELS = {
    dashboard: 'Tổng quan',
    projects: 'Dự án',
    tasks: 'Công việc',
    employees: 'Nhân sự',
    contractors: 'Nhà thầu',
    bidding: 'Đấu thầu',
    contracts: 'Hợp đồng',
    payments: 'Thanh toán',
    capital: 'KH Vốn & Giải ngân',
    documents: 'Hồ sơ tài liệu',
    cde: 'CDE',
    bim: 'Mô hình BIM',
    legal_docs: 'VB Pháp luật',
    reports: 'Báo cáo',
    regulations: 'Quy chế',
    workflows: 'Quy trình',
    admin_accounts: 'Tài khoản',
    admin_roles: 'Phân quyền',
    admin_audit: 'Nhật ký HT',
    calendar: 'Lịch',
    site_clearance: 'GPMT',
};

const ROLE_LABELS = {
    super_admin:      'Super Admin',
    director:         'Giám đốc',
    deputy_director:  'Phó Giám đốc',
    chief_accountant: 'Kế toán trưởng',
    dept_head:        'Trưởng phòng',
    deputy_head:      'Phó phòng',
    specialist:       'Chuyên viên',
    staff:            'Nhân viên',
    contractor:       'Nhà thầu',
};

const client = new Client({
    host: HOST, port: PORT, user: USER, password: PASSWORD,
    database: 'postgres', ssl: { rejectUnauthorized: false },
});

async function main() {
    await client.connect();
    const { rows } = await client.query(
        'SELECT role, resource, actions FROM role_permission_defaults ORDER BY role, resource'
    );
    await client.end();

    // index: roleMap[role][resource] = Set(actions)
    const roleMap = {};
    for (const r of rows) {
        roleMap[r.role] = roleMap[r.role] || {};
        roleMap[r.role][r.resource] = new Set(r.actions || []);
    }

    const now = new Date().toISOString().split('T')[0];
    const lines = [];
    lines.push(`# RBAC Matrix — Quyền mặc định theo Vai trò hệ thống`);
    lines.push('');
    lines.push(`> Tự động sinh từ \`role_permission_defaults\` ngày **${now}**.`);
    lines.push(`> KHÔNG sửa file này bằng tay — chạy \`npm run gen:rbac\` sau khi đổi DB.`);
    lines.push('');
    lines.push(`Tổng số vai trò: **${Object.keys(roleMap).length}** · Tổng số tài nguyên: **${Object.keys(RESOURCE_LABELS).length}**`);
    lines.push('');

    const orderedRoles = ROLE_ORDER.filter((r) => roleMap[r]).concat(
        Object.keys(roleMap).filter((r) => !ROLE_ORDER.includes(r))
    );

    for (const role of orderedRoles) {
        const label = ROLE_LABELS[role] || role;
        lines.push(`## ${label} (\`${role}\`)`);
        lines.push('');
        lines.push(`| Tài nguyên | ` + ACTIONS.join(' | ') + ' |');
        lines.push(`| --- |` + ACTIONS.map(() => ' :---: |').join(''));
        for (const [resource, vnLabel] of Object.entries(RESOURCE_LABELS)) {
            const set = roleMap[role][resource] || new Set();
            const cells = ACTIONS.map((a) => (set.has(a) ? '✓' : ''));
            lines.push(`| ${vnLabel} (\`${resource}\`) | ` + cells.join(' | ') + ' |');
        }
        lines.push('');
    }

    const content = lines.join('\n') + '\n';

    if (CHECK_MODE) {
        const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf-8') : '';
        // Ignore the auto-generated date line when comparing — only the matrix shape matters.
        const norm = (s) => s.replace(/ng[àa]y \*\*\d{4}-\d{2}-\d{2}\*\*/g, 'ngày **YYYY-MM-DD**');
        if (norm(existing) === norm(content)) {
            console.log('✓ docs/rbac_matrix.md is in sync with DB.');
            process.exit(0);
        }
        console.error('✘ docs/rbac_matrix.md is out of sync. Run `npm run gen:rbac`.');
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, content);
    console.log(`✓ Wrote ${OUT}`);
}

main().catch((e) => {
    console.error('✘ ' + (e.message || e));
    process.exit(3);
});

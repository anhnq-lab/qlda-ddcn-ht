#!/usr/bin/env node
/**
 * lint-migrations.mjs — Static checks on supabase/migrations/*.sql
 *
 * Rules:
 *   M1  Filename matches `YYYYMMDD[HHMMSS]_<snake_case>.sql`
 *   M2  No two files share the same timestamp prefix
 *   M3  Every CREATE TABLE has a matching ENABLE ROW LEVEL SECURITY in
 *       the same file (or explicit opt-out via `-- rls-skip` comment)
 *   M4  No new write policies (INSERT/UPDATE/DELETE) with USING(true)
 *       or WITH CHECK(true) — RLS hardening rule
 *   M5  No CREATE FUNCTION … LANGUAGE sql/plpgsql without SECURITY
 *       definer/invoker explicitly stated (catches missing SECURITY DEFINER
 *       on helpers that bypass RLS)
 *
 * Exit codes:
 *   0  clean
 *   1  one or more rules violated
 *
 * Usage:  node scripts/lint-migrations.mjs
 *         npm run lint:migrations
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DIR = path.resolve(__dirname, '../supabase/migrations');

if (!fs.existsSync(DIR)) {
    console.error(`✘ Not found: ${DIR}`);
    process.exit(2);
}

const FILENAME_RE = /^(\d{8})(\d{6})?_[a-z0-9_]+\.sql$/;

const COLORS = {
    red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m',
    cyan: '\x1b[36m', dim: '\x1b[2m', reset: '\x1b[0m', bold: '\x1b[1m',
};
const c = (col, s) => `${COLORS[col]}${s}${COLORS.reset}`;

const issues = [];
const note = (file, rule, msg) => issues.push({ file, rule, msg });

const files = fs.readdirSync(DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

if (files.length === 0) {
    console.log(c('yellow', 'No migrations found.'));
    process.exit(0);
}

// ── M1, M2 ────────────────────────────────────────────────────
const timestampCounts = new Map();
for (const f of files) {
    const m = f.match(FILENAME_RE);
    if (!m) {
        note(f, 'M1', `bad filename (expected YYYYMMDD[HHMMSS]_<snake_case>.sql)`);
        continue;
    }
    const ts = (m[1] + (m[2] || '')).padEnd(14, '0');
    const list = timestampCounts.get(ts) || [];
    list.push(f);
    timestampCounts.set(ts, list);
}
for (const [ts, names] of timestampCounts.entries()) {
    if (names.length > 1) {
        for (const n of names) note(n, 'M2', `duplicate timestamp ${ts} (collides with ${names.filter((x) => x !== n).join(', ')})`);
    }
}

// ── Per-file content checks ──────────────────────────────────
for (const f of files) {
    const full = path.join(DIR, f);
    const sql = fs.readFileSync(full, 'utf-8');
    const upper = sql.toUpperCase();

    // M3: CREATE TABLE w/o ENABLE RLS
    const createdTables = [...sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)]
        .map((m) => m[1].toLowerCase());
    if (createdTables.length > 0 && !/--\s*rls-skip/i.test(sql)) {
        const enabledOn = new Set(
            [...sql.matchAll(/ALTER\s+TABLE\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi)]
                .map((m) => m[1].toLowerCase())
        );
        for (const t of createdTables) {
            if (!enabledOn.has(t)) {
                note(f, 'M3', `table "${t}" created but no ENABLE ROW LEVEL SECURITY in this file`);
            }
        }
    }

    // M4: write policy USING(true) / WITH CHECK(true)
    const policyBlocks = [...sql.matchAll(
        /CREATE\s+POLICY[\s\S]*?(?=CREATE\s+POLICY|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+POLICY|\$\$|;\s*--|\Z)/gi
    )];
    for (const m of policyBlocks) {
        const block = m[0];
        const cmdMatch = block.match(/FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)/i);
        const cmd = cmdMatch ? cmdMatch[1].toUpperCase() : 'SELECT';
        if (cmd === 'SELECT') continue;
        // Strip whitespace + look for USING (true) or WITH CHECK (true) literally
        const flat = block.replace(/\s+/g, ' ').toLowerCase();
        if (/using\s*\(\s*true\s*\)/.test(flat) || /with\s+check\s*\(\s*true\s*\)/.test(flat)) {
            const nameMatch = block.match(/CREATE\s+POLICY\s+["']?([^"'\s]+)/i);
            const name = nameMatch ? nameMatch[1] : '(anonymous)';
            note(f, 'M4', `write policy "${name}" (${cmd}) uses USING/WITH CHECK = true — privilege escalation risk`);
        }
    }

    // M5: CREATE FUNCTION without SECURITY clause
    const fns = [...sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+[a-z_.]+\s*\([\s\S]*?LANGUAGE\s+(?:sql|plpgsql)[\s\S]*?(?=\$\$|;)/gi)];
    for (const m of fns) {
        const block = m[0];
        if (!/SECURITY\s+(DEFINER|INVOKER)/i.test(block)) {
            const fnMatch = block.match(/FUNCTION\s+([a-z_.]+)/i);
            const fn = fnMatch ? fnMatch[1] : '(anonymous)';
            note(f, 'M5', `function "${fn}" missing SECURITY DEFINER/INVOKER clause`);
        }
    }
}

// ── Report ────────────────────────────────────────────────────
console.log(c('cyan', `\n  Migration linter — ${files.length} files scanned\n`));

if (issues.length === 0) {
    console.log(c('green', '  ✓ No issues found.\n'));
    process.exit(0);
}

const byFile = new Map();
for (const i of issues) {
    const arr = byFile.get(i.file) || [];
    arr.push(i);
    byFile.set(i.file, arr);
}

for (const [file, arr] of [...byFile.entries()].sort()) {
    console.log(c('bold', `  ${file}`));
    for (const i of arr) {
        console.log(`    ${c('red', i.rule)}  ${i.msg}`);
    }
}

console.log(`\n  ${c('red', String(issues.length))} issue(s) across ${byFile.size} file(s).\n`);
process.exit(1);

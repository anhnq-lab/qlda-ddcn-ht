#!/usr/bin/env node
/**
 * rls-audit.mjs — Run scripts/sql/rls_audit.sql against Supabase Postgres
 * and print a structured report.
 *
 * Usage:
 *   node scripts/rls-audit.mjs
 *
 * Requires .env with:
 *   SUPABASE_DB_PASSWORD=...   # connection password
 *
 * Optional env:
 *   SUPABASE_DB_HOST=...       # default: aws-0-ap-southeast-1.pooler.supabase.com
 *   SUPABASE_DB_USER=...       # default: postgres.jkaddjllseephsiaqvds
 *   SUPABASE_DB_PORT=...       # default: 6543 (pgbouncer)
 *   RLS_AUDIT_OUT=path/to.json # write full result as JSON to disk
 *
 * Exit code:
 *   0  no critical findings
 *   1  found at least one write policy USING(true) — must be fixed
 *   2  found tables without RLS enabled
 */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── load .env (simple parser, no extra deps) ──
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

const sqlPath = path.resolve(__dirname, 'sql/rls_audit.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`✘ Not found: ${sqlPath}`);
  process.exit(3);
}
const sql = fs.readFileSync(sqlPath, 'utf-8');

// ── run each report SELECT separately so we can label them ──
// We split the file on the report markers to keep things simple.
function splitReports(src) {
  const parts = src.split(/-- ──+\s*\n-- BÁO CÁO/);
  const reports = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = '-- BÁO CÁO' + parts[i];
    // extract SELECT statement (everything from first SELECT to next ';' that ends a statement)
    const m = chunk.match(/(SELECT|WITH)[\s\S]*?;\s*$/m);
    if (m) reports.push({ index: i, sql: m[0] });
  }
  return reports;
}

const reports = splitReports(sql);

const client = new Client({
  host: HOST,
  port: PORT,
  user: USER,
  password: PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const COLORS = {
  red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m',
  cyan: '\x1b[36m', bold: '\x1b[1m', reset: '\x1b[0m',
};
const c = (col, s) => `${COLORS[col]}${s}${COLORS.reset}`;

function printTable(rows) {
  if (rows.length === 0) {
    console.log(c('green', '   ✓ none'));
    return;
  }
  const cols = Object.keys(rows[0]).filter((k) => k !== 'report');
  const widths = cols.map((col) =>
    Math.max(col.length, ...rows.map((r) => String(r[col] ?? '').length))
  );
  const header = cols.map((col, i) => col.padEnd(widths[i])).join('  ');
  console.log('   ' + c('bold', header));
  console.log('   ' + cols.map((_, i) => '─'.repeat(widths[i])).join('  '));
  for (const r of rows) {
    console.log('   ' + cols.map((col, i) => String(r[col] ?? '').padEnd(widths[i])).join('  '));
  }
}

async function main() {
  console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c('cyan', `  RLS AUDIT — ${new Date().toISOString()}`));
  console.log(c('cyan', `  Host: ${HOST}:${PORT}  DB: postgres`));
  console.log(c('cyan', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  await client.connect();

  const out = { meta: { at: new Date().toISOString(), host: HOST }, reports: {} };
  let writeUsingTrueCount = 0;
  let noRlsCount = 0;

  const titles = {
    1: { tag: '01_NO_RLS',                 label: 'Tables without RLS enabled',                color: 'red' },
    2: { tag: '02_RLS_NO_POLICY',          label: 'RLS-enabled tables with no policies',       color: 'yellow' },
    3: { tag: '03_WRITE_USING_TRUE',       label: 'Write policies with USING(true) — CRITICAL', color: 'red' },
    4: { tag: '04_SELECT_USING_TRUE',      label: 'Select policies with USING(true)',          color: 'yellow' },
    5: { tag: '05_LEGACY_PERMISSIVE_NAMES',label: 'Legacy permissive-named policies',          color: 'yellow' },
    6: { tag: '06_POLICY_MATRIX',          label: 'Policy matrix per table',                   color: 'cyan' },
  };

  for (const { index, sql: query } of reports) {
    const meta = titles[index] || { tag: `report_${index}`, label: `Report ${index}`, color: 'cyan' };
    console.log(c(meta.color, `\n▸ ${meta.tag} — ${meta.label}`));
    try {
      const { rows } = await client.query(query);
      out.reports[meta.tag] = rows;
      printTable(rows);
      if (meta.tag === '03_WRITE_USING_TRUE') writeUsingTrueCount = rows.length;
      if (meta.tag === '01_NO_RLS') noRlsCount = rows.length;
    } catch (e) {
      console.log(c('red', `   ✘ query failed: ${e.message}`));
    }
  }

  await client.end();

  // ── summary ──
  console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c('bold', '  Summary'));
  console.log(c('cyan', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(`  • Tables without RLS:              ${noRlsCount > 0 ? c('red', String(noRlsCount)) : c('green', '0')}`);
  console.log(`  • Write policies USING(true):       ${writeUsingTrueCount > 0 ? c('red', String(writeUsingTrueCount)) : c('green', '0')}`);

  if (process.env.RLS_AUDIT_OUT) {
    fs.writeFileSync(process.env.RLS_AUDIT_OUT, JSON.stringify(out, null, 2));
    console.log(`  • Wrote full report → ${process.env.RLS_AUDIT_OUT}`);
  }

  if (writeUsingTrueCount > 0) process.exit(1);
  if (noRlsCount > 0) process.exit(2);
  console.log(c('green', '\n  ✓ No critical findings.\n'));
}

main().catch((e) => {
  console.error(c('red', '\n✘ Audit failed: ' + (e.message || e)));
  process.exit(3);
});

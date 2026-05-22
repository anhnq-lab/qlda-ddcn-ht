#!/usr/bin/env node
/**
 * check-bundle-size.mjs — Bundle budget guard
 *
 * Reads dist/assets/*.js and asserts each chunk's gzipped size is
 * within budget. Run after `npm run build`.
 *
 * Budgets (gzip):
 *   • Entry chunks (index*, assets matching ^index)  ≤ 500 KB
 *   • Any other single chunk                         ≤ 700 KB  (BIM/3D vendor is the outlier)
 *   • Total initial JS payload (entry + react vendor) ≤ 800 KB
 *
 * Exit codes:
 *   0  all budgets met
 *   1  one or more budgets exceeded
 *   2  dist/ not present (build first)
 *
 * Usage:
 *   npm run build && npm run check:bundle
 */
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DIST = path.resolve(__dirname, '../dist/assets');
if (!fs.existsSync(DIST)) {
    console.error('✘ dist/assets not found — run `npm run build` first.');
    process.exit(2);
}

const KB = 1024;
const BUDGETS = {
    entryChunk:        500 * KB,      // 500 KB gzip
    otherChunk:        700 * KB,      // 700 KB gzip (BIM vendor exempt below)
    bimVendorChunk:    600 * KB,      // 600 KB gzip — accepted ceiling for vendor-3d
    initialPayload:    800 * KB,      // 800 KB gzip — entry + vendor-react
};

const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.js'));

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', reset: '\x1b[0m' };
const c = (col, s) => `${COLORS[col]}${s}${COLORS.reset}`;
const fmt = (n) => (n / KB).toFixed(1).padStart(7) + ' KB';

const rows = files.map((f) => {
    const full = path.join(DIST, f);
    const raw = fs.readFileSync(full);
    const gz = gzipSync(raw).length;
    return { f, raw: raw.length, gz };
}).sort((a, b) => b.gz - a.gz);

console.log(c('cyan', `\n  Bundle audit — ${files.length} chunks\n`));
console.log('  Top 10 chunks (gzipped):');
for (const r of rows.slice(0, 10)) {
    console.log(`    ${fmt(r.gz)}   ${r.f}`);
}

const failures = [];

const isEntry         = (f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f);
const isBimVendor     = (f) => /^vendor-3d-/.test(f);
const isVendorReact   = (f) => /^vendor-react-/.test(f);

let initialPayloadGz = 0;
for (const r of rows) {
    if (isEntry(r.f) || isVendorReact(r.f)) initialPayloadGz += r.gz;

    let budget = BUDGETS.otherChunk;
    let label  = 'other';
    if (isBimVendor(r.f))     { budget = BUDGETS.bimVendorChunk; label = 'bim-vendor'; }
    else if (isEntry(r.f))    { budget = BUDGETS.entryChunk;     label = 'entry'; }

    if (r.gz > budget) {
        failures.push(`${r.f} (${label}): ${fmt(r.gz)} > ${fmt(budget)}`);
    }
}

if (initialPayloadGz > BUDGETS.initialPayload) {
    failures.push(`Initial payload (index + vendor-react): ${fmt(initialPayloadGz)} > ${fmt(BUDGETS.initialPayload)}`);
}

console.log('');
if (failures.length === 0) {
    console.log(c('green', `  ✓ All ${files.length} chunks within budget.`));
    console.log(c('green', `  ✓ Initial payload: ${fmt(initialPayloadGz)} (budget ${fmt(BUDGETS.initialPayload)})`));
    process.exit(0);
}

for (const msg of failures) console.log(c('red', `  ✘ ${msg}`));
console.log('');
console.log(c('yellow', `  Tip: run \`ANALYZE=1 npm run build\` and open dist/stats.html.`));
process.exit(1);

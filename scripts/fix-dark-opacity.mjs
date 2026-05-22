#!/usr/bin/env node
/**
 * fix-dark-opacity.mjs — one-shot codemod for RULES.md §4.2
 *
 * Rule: neutral dark backgrounds (slate/gray) must use full opacity.
 * This script strips the `/10..50` suffix from any of:
 *   dark:bg-slate-{X}/{N}
 *   dark:bg-gray-{X}/{N}
 *   dark:bg-zinc-{X}/{N}
 *   dark:hover:bg-slate-{X}/{N}    (and gray/zinc variants)
 *
 * Where X is a valid Tailwind shade and N is one of 10/20/30/40/50.
 *
 * Color-coded backgrounds (red/blue/emerald/...) are NOT touched —
 * they use opacity legitimately per the RULES table.
 *
 * Also normalizes the invalid `slate-850` / `slate-650` shades (these
 * don't exist in default Tailwind palette) to the nearest valid one.
 *
 * Usage:
 *   node scripts/fix-dark-opacity.mjs           # apply
 *   node scripts/fix-dark-opacity.mjs --check   # report only, exit 1 if violations
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHECK_MODE = process.argv.includes('--check');

// Find all .tsx files under features/ + components/
function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            out.push(...walk(full));
        } else if (entry.isFile() && (full.endsWith('.tsx') || full.endsWith('.ts'))) {
            out.push(full);
        }
    }
    return out;
}

const files = [
    ...walk(path.join(ROOT, 'features')),
    ...walk(path.join(ROOT, 'components')),
];

// Patterns:
//   - dark:bg-slate-NN/MM     → dark:bg-slate-NN
//   - dark:hover:bg-slate-NN/MM → dark:hover:bg-slate-NN
//   - dark:bg-gray-NN/MM      → dark:bg-gray-NN
//   - same for zinc
const STRIP_OPACITY = /\bdark:(hover:)?bg-(slate|gray|zinc)-(\d{2,3})\/[1-5]0\b/g;

// Invalid shades not in default palette: slate-650, slate-850
// Map them to nearest valid: 650→600, 850→800
const FIX_SHADES = /\b(dark:(?:hover:)?(?:bg|text|border)-(?:slate|gray|zinc))-(650|850|550|250|150|450|350)\b/g;
const SHADE_REMAP = { 150: 100, 250: 200, 350: 300, 450: 400, 550: 500, 650: 600, 850: 800 };

let totalReplacements = 0;
const filesChanged = [];

for (const f of files) {
    const orig = fs.readFileSync(f, 'utf-8');

    let txt = orig;
    txt = txt.replace(STRIP_OPACITY, (_, hov = '', palette, shade) => {
        totalReplacements++;
        return `dark:${hov || ''}bg-${palette}-${shade}`;
    });
    txt = txt.replace(FIX_SHADES, (_m, prefix, badShade) => {
        const good = SHADE_REMAP[Number(badShade)] || badShade;
        totalReplacements++;
        return `${prefix}-${good}`;
    });

    if (txt !== orig) {
        filesChanged.push(path.relative(ROOT, f));
        if (!CHECK_MODE) fs.writeFileSync(f, txt);
    }
}

if (CHECK_MODE) {
    if (filesChanged.length === 0) {
        console.log('✓ Dark-mode opacity rules pass.');
        process.exit(0);
    }
    console.error(`✘ ${totalReplacements} violation(s) in ${filesChanged.length} file(s):`);
    for (const f of filesChanged) console.error('   ' + f);
    console.error('\n  Run `node scripts/fix-dark-opacity.mjs` to autofix.');
    process.exit(1);
}

console.log(`✓ Updated ${filesChanged.length} file(s), ${totalReplacements} replacement(s).`);
for (const f of filesChanged) console.log('   ' + f);

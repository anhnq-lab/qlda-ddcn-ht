// One-shot migration script: replace hardcoded theme-leaking color pairs with theme-aware tokens.
// Run: node scripts/theme-token-migrate.mjs <relative-dir-or-file> [more...]
//
// Replacements are conservative: only pairs that include BOTH a light variant and a dark: variant
// are replaced (so we don't accidentally strip intentional always-dark or always-light styles).
// Run with no args to dry-list candidate files only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Order matters: longer / more-specific patterns first.
const REPLACEMENTS = [
    // ─── Background pairs ───
    [/\bbg-white\s+dark:bg-slate-(?:800|900|850|750|700)\b/g, 'bg-bg-surface'],
    [/\bbg-white\s+dark:bg-\[#[0-9a-fA-F]{6}\]/g, 'bg-bg-surface'],
    [/\bbg-slate-50\s+dark:bg-slate-(?:800|900|850|750)\b/g, 'bg-bg-subtle'],
    [/\bbg-gray-50\s+dark:bg-slate-(?:800|900|850|750)\b/g, 'bg-bg-subtle'],
    [/\bbg-gray-50\s+dark:bg-gray-(?:800|900)\b/g, 'bg-bg-subtle'],
    [/\bbg-slate-100\s+dark:bg-slate-(?:700|800)\b/g, 'bg-bg-muted'],
    [/\bbg-gray-100\s+dark:bg-slate-(?:700|800)\b/g, 'bg-bg-muted'],
    [/\bbg-gray-100\s+dark:bg-gray-(?:700|800)\b/g, 'bg-bg-muted'],

    // Hover bg pairs → hover-row token
    [/\bhover:bg-slate-50\s+dark:hover:bg-slate-(?:700|800)\b/g, 'hover:bg-bg-hover-row'],
    [/\bhover:bg-gray-50\s+dark:hover:bg-slate-(?:700|800)\b/g, 'hover:bg-bg-hover-row'],
    [/\bhover:bg-gray-50\s+dark:hover:bg-gray-(?:700|800)\b/g, 'hover:bg-bg-hover-row'],
    [/\bhover:bg-slate-100\s+dark:hover:bg-slate-(?:700|800)\b/g, 'hover:bg-bg-muted'],
    [/\bhover:bg-gray-100\s+dark:hover:bg-slate-(?:700|800)\b/g, 'hover:bg-bg-muted'],

    // ─── Border pairs ───
    [/\bborder-slate-100\s+dark:border-slate-(?:700|800)(?:\/\d+)?\b/g, 'border-border-subtle'],
    [/\bborder-slate-200\s+dark:border-slate-(?:700|800)(?:\/\d+)?\b/g, 'border-border'],
    [/\bborder-gray-100\s+dark:border-slate-(?:700|800)(?:\/\d+)?\b/g, 'border-border-subtle'],
    [/\bborder-gray-100\s+dark:border-gray-(?:700|800)\b/g, 'border-border-subtle'],
    [/\bborder-gray-200\s+dark:border-slate-(?:700|800)(?:\/\d+)?\b/g, 'border-border'],
    [/\bborder-gray-200\s+dark:border-gray-(?:700|800)\b/g, 'border-border'],

    // ─── Text pairs — primary heading ───
    [/\btext-slate-900\s+dark:text-white\b/g, 'text-txt-primary'],
    [/\btext-slate-900\s+dark:text-slate-(?:50|100|200)\b/g, 'text-txt-primary'],
    [/\btext-gray-900\s+dark:text-white\b/g, 'text-txt-primary'],
    [/\btext-gray-900\s+dark:text-slate-(?:50|100|200)\b/g, 'text-txt-primary'],
    [/\btext-gray-900\s+dark:text-gray-(?:50|100|200)\b/g, 'text-txt-primary'],
    [/\btext-slate-800\s+dark:text-white\b/g, 'text-txt-primary'],
    [/\btext-slate-800\s+dark:text-slate-(?:50|100|200)\b/g, 'text-txt-primary'],
    [/\btext-gray-800\s+dark:text-white\b/g, 'text-txt-primary'],
    [/\btext-gray-800\s+dark:text-slate-(?:50|100|200)\b/g, 'text-txt-primary'],

    // Secondary body text
    [/\btext-slate-700\s+dark:text-slate-(?:200|300)\b/g, 'text-txt-secondary'],
    [/\btext-slate-700\s+dark:text-slate-(?:400)\b/g, 'text-txt-secondary'],
    [/\btext-gray-700\s+dark:text-slate-(?:200|300|400)\b/g, 'text-txt-secondary'],
    [/\btext-gray-700\s+dark:text-gray-(?:200|300|400)\b/g, 'text-txt-secondary'],

    // Muted (default body small / labels)
    [/\btext-slate-600\s+dark:text-slate-(?:300|400)\b/g, 'text-txt-muted'],
    [/\btext-slate-500\s+dark:text-slate-(?:400|300)\b/g, 'text-txt-muted'],
    [/\btext-gray-600\s+dark:text-slate-(?:300|400)\b/g, 'text-txt-muted'],
    [/\btext-gray-500\s+dark:text-slate-(?:300|400)\b/g, 'text-txt-muted'],
    [/\btext-gray-500\s+dark:text-gray-(?:300|400)\b/g, 'text-txt-muted'],
    [/\btext-gray-600\s+dark:text-gray-(?:300|400)\b/g, 'text-txt-muted'],

    // Placeholder
    [/\btext-slate-400\s+dark:text-slate-(?:400|500|600)\b/g, 'text-txt-placeholder'],
    [/\btext-gray-400\s+dark:text-slate-(?:400|500|600)\b/g, 'text-txt-placeholder'],
    [/\btext-gray-400\s+dark:text-gray-(?:400|500|600)\b/g, 'text-txt-placeholder'],

    // Divides
    [/\bdivide-slate-100\s+dark:divide-slate-(?:700|800)(?:\/\d+)?\b/g, 'divide-border-subtle'],
    [/\bdivide-gray-100\s+dark:divide-slate-(?:700|800)(?:\/\d+)?\b/g, 'divide-border-subtle'],
    [/\bdivide-slate-200\s+dark:divide-slate-(?:700|800)(?:\/\d+)?\b/g, 'divide-border'],
    [/\bdivide-gray-200\s+dark:divide-slate-(?:700|800)(?:\/\d+)?\b/g, 'divide-border'],

    // Ring
    [/\bring-slate-200\s+dark:ring-slate-(?:700|800)\b/g, 'ring-border'],
    [/\bring-gray-200\s+dark:ring-slate-(?:700|800)\b/g, 'ring-border'],

    // ─── Shadow upgrades (legacy shadow-sm / shadow-lg on card-like blocks → shadow-card) ───
    // Only do these inside JSX className strings — skip CSS files.
    // (Doing conservatively: replace just `shadow-sm` when paired with rounded-2xl)
    // Skip for safety; manual call only when needed.
];

function walkFiles(target, files = []) {
    const stat = fs.statSync(target);
    if (stat.isFile()) {
        if (target.endsWith('.tsx') || target.endsWith('.ts')) files.push(target);
        return files;
    }
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
        const p = path.join(target, entry.name);
        // Skip node_modules, dist, build
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
        if (entry.isDirectory()) walkFiles(p, files);
        else if (entry.name.endsWith('.tsx')) files.push(p);
    }
    return files;
}

function processFile(filePath) {
    const src = fs.readFileSync(filePath, 'utf8');
    let out = src;
    const matches = {};
    for (const [pattern, replacement] of REPLACEMENTS) {
        const before = out;
        out = out.replace(pattern, (m) => {
            matches[m] = (matches[m] || 0) + 1;
            return replacement;
        });
        if (before === out) continue;
    }
    if (out !== src) {
        fs.writeFileSync(filePath, out, 'utf8');
        const total = Object.values(matches).reduce((a, b) => a + b, 0);
        console.log(`✓ ${path.relative(ROOT, filePath)} (${total} replacements)`);
    }
    return out !== src;
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node scripts/theme-token-migrate.mjs <path1> [path2] ...');
    console.log('  Paths are relative to project root.');
    process.exit(0);
}

let changedCount = 0;
let totalFiles = 0;
for (const arg of args) {
    const target = path.resolve(ROOT, arg);
    if (!fs.existsSync(target)) {
        console.warn(`Skip missing: ${arg}`);
        continue;
    }
    for (const f of walkFiles(target)) {
        totalFiles++;
        if (processFile(f)) changedCount++;
    }
}
console.log(`\nProcessed ${totalFiles} files; modified ${changedCount}.`);

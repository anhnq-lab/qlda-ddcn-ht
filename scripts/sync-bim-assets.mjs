/**
 * sync-bim-assets — Copy ThatOpen fragments worker + web-ifc WASM from
 * node_modules into public/ so they always match the installed library
 * versions. A version mismatch makes IFC models parse but never render.
 *
 * Wired into postinstall / predev / prebuild so it can never go stale.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** src (relative to repo root) → one or more dest paths */
const ASSETS = [
    {
        src: 'node_modules/@thatopen/fragments/dist/Worker/worker.mjs',
        dests: ['public/workers/fragment-worker.mjs', 'public/worker.mjs'],
    },
    {
        src: 'node_modules/web-ifc/web-ifc.wasm',
        dests: ['public/wasm/web-ifc.wasm', 'public/web-ifc.wasm'],
    },
    {
        src: 'node_modules/web-ifc/web-ifc-mt.wasm',
        dests: ['public/wasm/web-ifc-mt.wasm'],
    },
];

const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');

let copied = 0;
for (const { src, dests } of ASSETS) {
    const srcPath = resolve(root, src);
    if (!existsSync(srcPath)) {
        console.warn(`[sync-bim-assets] SKIP — source missing: ${src}`);
        continue;
    }
    const srcHash = md5(srcPath);
    for (const dest of dests) {
        const destPath = resolve(root, dest);
        if (existsSync(destPath) && md5(destPath) === srcHash) continue;
        mkdirSync(dirname(destPath), { recursive: true });
        copyFileSync(srcPath, destPath);
        console.log(`[sync-bim-assets] ${dest}  ←  ${src}`);
        copied++;
    }
}

console.log(
    copied === 0
        ? '[sync-bim-assets] All BIM assets already in sync.'
        : `[sync-bim-assets] Synced ${copied} file(s).`,
);

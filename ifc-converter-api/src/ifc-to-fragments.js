// ─────────────────────────────────────────────────────────────────────
// IFC → Fragments (.frag) — server-side, dùng @thatopen/fragments IfcImporter.
//
// Đây là CÙNG builder mà trình duyệt dùng, nên .frag xuất ra load trực tiếp
// được bằng FragmentsManager.core.load() ở client (không cần parse IFC trong
// trình duyệt nữa). IfcImporter.process() hỗ trợ Node (xem readFromCallback
// trong type definitions của @thatopen/fragments v3.3.x).
//
// @thatopen/fragments là ESM-first → dùng dynamic import() trong CommonJS.
// ─────────────────────────────────────────────────────────────────────

const fs = require('fs/promises');
const path = require('path');

/** Thư mục chứa web-ifc.wasm (IfcImporter cần để parse IFC).
 *  web-ifc chặn require.resolve('web-ifc/package.json') qua "exports", nên
 *  resolve entry chính rồi lấy thư mục (các file .wasm nằm cùng cấp entry). */
function webIfcWasmDir() {
    const entry = require.resolve('web-ifc');
    // Đảm bảo có dấu phân tách cuối — web-ifc nối trực tiếp tên file wasm.
    return path.dirname(entry) + path.sep;
}

let _fragmentsModPromise = null;
function loadFragmentsModule() {
    if (!_fragmentsModPromise) {
        // dynamic import hoạt động cho cả ESM lẫn CJS build của package.
        _fragmentsModPromise = import('@thatopen/fragments');
    }
    return _fragmentsModPromise;
}

/**
 * Convert một file IFC (đường dẫn trên đĩa) thành Fragments (.frag).
 * @param {string} inputPath - đường dẫn file .ifc
 * @param {{ onProgress?: (pct:number, stage:string)=>void }} [opts]
 * @returns {Promise<Buffer>} nội dung .frag
 */
async function convertIfcToFragments(inputPath, opts = {}) {
    const { onProgress } = opts;
    const mod = await loadFragmentsModule();
    const IfcImporter = mod.IfcImporter || (mod.default && mod.default.IfcImporter);
    if (!IfcImporter) {
        throw new Error('Không tìm thấy IfcImporter trong @thatopen/fragments');
    }

    const serializer = new IfcImporter();
    serializer.wasm = { path: webIfcWasmDir(), absolute: true };

    if (onProgress) onProgress(20, 'reading_ifc');
    const fileBuf = await fs.readFile(inputPath);
    const bytes = new Uint8Array(fileBuf);

    if (onProgress) onProgress(45, 'converting_fragments');
    // process() trả về Uint8Array nội dung .frag (đã nén khi raw=false mặc định).
    const fragBytes = await serializer.process({ bytes });

    if (onProgress) onProgress(90, 'finalizing');
    return Buffer.from(fragBytes);
}

module.exports = { convertIfcToFragments };

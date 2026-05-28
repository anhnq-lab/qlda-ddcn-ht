/**
 * ifc-to-glb — Convert an IFC file to a binary glTF (.glb) using web-ifc on Node.
 *
 * Strategy:
 *   1. OpenModel with COORDINATE_TO_ORIGIN=true so geometry is centered near (0,0,0).
 *   2. StreamAllMeshes → for every IfcProduct (wall, slab, door, …) we get a FlatMesh,
 *      which is a list of PlacedGeometry entries (geometryExpressID + flatTransformation + RGBA color).
 *   3. For each unique geometryExpressID we extract the base buffer (vertices interleaved
 *      [x,y,z,nx,ny,nz], + uint32 indices) ONCE and cache it. Multiple PlacedGeometry that
 *      share the same geometry become separate glTF nodes referencing the same mesh —
 *      this is glTF's standard instancing pattern and keeps file size in check.
 *   4. Per IfcProduct we create one glTF node with:
 *        - matrix = flatTransformation (column-major 4x4)
 *        - mesh = the shared instance
 *        - extras.expressId / extras.ifcType so the browser viewer can map a click back to IFC
 *      Material is per-color (cached) using the RGBA from PlacedGeometry.color.
 *
 * The output is a single .glb file written to disk. Properties extraction is intentionally
 * NOT done here — that already exists in /extract-properties and is loaded lazily by the
 * viewer on click.
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const WebIFC = require('web-ifc');

// IFC type IDs we want to surface in the .glb. Anything outside this list is still
// included if web-ifc emits geometry for it — StreamAllMeshes iterates ALL products
// that have a representation. We use this only to look up a human-readable type label.
//
// Source: https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/lexical/
//
// (Express IDs for types — these are the integers web-ifc uses internally.)
function ifcTypeLabel(api, expressID) {
    try {
        const line = api.GetLine(undefined, expressID, false);
        return line?.type || 'Unknown';
    } catch {
        return 'Unknown';
    }
}

/**
 * Reads vertex + index buffers for a single web-ifc IfcGeometry handle.
 * Returns { positions: Float32Array, normals: Float32Array, indices: Uint32Array }.
 *
 * IMPORTANT: the typed arrays returned by GetVertexArray/GetIndexArray are VIEWS into
 * WASM heap. They are invalidated when the WASM heap grows or when CloseModel runs.
 * We .slice() each one so the caller gets owned copies safe to outlive the model.
 */
function readGeometry(api, modelID, geometryExpressID) {
    const geom = api.GetGeometry(modelID, geometryExpressID);
    try {
        const vertexPtr = geom.GetVertexData();
        const vertexSize = geom.GetVertexDataSize();
        const indexPtr = geom.GetIndexData();
        const indexSize = geom.GetIndexDataSize();

        // vertexSize is a count of FLOATS (not bytes). web-ifc lays out vertices as
        // interleaved [x,y,z,nx,ny,nz] — so vertexCount = vertexSize / 6.
        const interleaved = api.GetVertexArray(vertexPtr, vertexSize);
        const indices = api.GetIndexArray(indexPtr, indexSize).slice();

        const vertexCount = vertexSize / 6;
        const positions = new Float32Array(vertexCount * 3);
        const normals = new Float32Array(vertexCount * 3);
        for (let i = 0; i < vertexCount; i++) {
            const src = i * 6;
            const dst = i * 3;
            positions[dst] = interleaved[src];
            positions[dst + 1] = interleaved[src + 1];
            positions[dst + 2] = interleaved[src + 2];
            normals[dst] = interleaved[src + 3];
            normals[dst + 1] = interleaved[src + 4];
            normals[dst + 2] = interleaved[src + 5];
        }
        return { positions, normals, indices };
    } finally {
        geom.delete();
    }
}

/** Encode an RGBA color as a stable cache key. */
function colorKey(c) {
    return `${c.x.toFixed(3)}|${c.y.toFixed(3)}|${c.z.toFixed(3)}|${c.w.toFixed(3)}`;
}

/**
 * Run the conversion.
 *
 * @param {string} inputPath  - path to the uploaded IFC file
 * @param {string} outputPath - path to write the .glb to
 * @param {(progress: number, stage: string) => void} [onProgress]
 * @returns {Promise<{ elementCount: number, vertexCount: number, fileSize: number }>}
 */
async function convertIfcToGlb(inputPath, outputPath, onProgress) {
    const { NodeIO } = await import('@gltf-transform/core');

    onProgress?.(5, 'reading_ifc');
    const buf = await fs.readFile(inputPath);

    onProgress?.(10, 'init_web_ifc');
    const api = new WebIFC.IfcAPI();
    await api.Init();

    let modelID = null;
    try {
        modelID = api.OpenModel(new Uint8Array(buf), {
            // Centre survey-coordinate IFCs at the origin so we don't run into
            // float32 precision on the GPU. This is the same fix the browser
            // viewer used to do by hand, now done once on the server.
            COORDINATE_TO_ORIGIN: true,
            // OPTIMIZE_PROFILES gives smoother curved geometry (pipes, columns).
            OPTIMIZE_PROFILES: true,
        });
        onProgress?.(20, 'streaming_meshes');

        // ── Build glTF document ─────────────────────────────────────────────────
        const { Document } = await import('@gltf-transform/core');
        const doc = new Document();
        const buffer = doc.createBuffer();
        const scene = doc.createScene('IFC');

        /** Cache base geometry (vertices/normals/indices) per geometryExpressID. */
        const meshCache = new Map();
        /** Cache material per RGBA color. */
        const materialCache = new Map();

        const getMaterial = (color) => {
            const key = colorKey(color);
            let mat = materialCache.get(key);
            if (mat) return mat;
            mat = doc.createMaterial(`mat-${key}`)
                .setBaseColorFactor([color.x, color.y, color.z, color.w])
                .setMetallicFactor(0)
                .setRoughnessFactor(0.9)
                .setDoubleSided(true);
            if (color.w < 0.999) {
                mat.setAlphaMode('BLEND');
            }
            materialCache.set(key, mat);
            return mat;
        };

        /**
         * Look up (or build) a glTF Mesh primitive for a base geometryExpressID.
         * Returns { positionAccessor, normalAccessor, indexAccessor }. We don't create
         * a Mesh here because every IfcProduct gets its OWN Mesh (so it can carry its
         * own material — colour per IfcProduct varies even when the base shape is shared).
         */
        const getBaseGeometry = (geometryExpressID) => {
            let cached = meshCache.get(geometryExpressID);
            if (cached) return cached;

            const { positions, normals, indices } = readGeometry(api, modelID, geometryExpressID);

            const position = doc.createAccessor()
                .setType('VEC3')
                .setArray(positions)
                .setBuffer(buffer);
            const normal = doc.createAccessor()
                .setType('VEC3')
                .setArray(normals)
                .setBuffer(buffer);
            const index = doc.createAccessor()
                .setType('SCALAR')
                .setArray(indices)
                .setBuffer(buffer);

            cached = { position, normal, index, vertexCount: positions.length / 3 };
            meshCache.set(geometryExpressID, cached);
            return cached;
        };

        let productCount = 0;
        let primitiveCount = 0;
        let totalVertices = 0;

        // ── Walk every product with geometry ────────────────────────────────────
        api.StreamAllMeshes(modelID, (flatMesh) => {
            const expressID = flatMesh.expressID;
            const geometries = flatMesh.geometries;
            const geomCount = geometries.size();
            if (geomCount === 0) return;

            const ifcType = ifcTypeLabel(api, expressID);

            // One glTF node per IfcProduct. Children = one node per placed geometry,
            // each with its own material + transform. Keeping them as children of a
            // single product node makes raycast-→-product easy on the client (find
            // the closest ancestor with extras.expressId).
            const productNode = doc.createNode(`${ifcType}-${expressID}`)
                .setExtras({ expressId: expressID, ifcType });

            for (let g = 0; g < geomCount; g++) {
                const placed = geometries.get(g);
                const base = getBaseGeometry(placed.geometryExpressID);

                // Build a Mesh for this product+geometry pairing.
                const prim = doc.createPrimitive()
                    .setAttribute('POSITION', base.position)
                    .setAttribute('NORMAL', base.normal)
                    .setIndices(base.index)
                    .setMaterial(getMaterial(placed.color));
                const mesh = doc.createMesh(`${ifcType}-${expressID}-${g}`).addPrimitive(prim);

                const childNode = doc.createNode(`${ifcType}-${expressID}-g${g}`)
                    .setMesh(mesh)
                    .setMatrix(placed.flatTransformation);

                productNode.addChild(childNode);
                primitiveCount++;
                totalVertices += base.vertexCount;
            }

            scene.addChild(productNode);
            productCount++;

            if (productCount % 500 === 0) {
                // Report progress roughly — streamAllMeshes doesn't tell us the total.
                const fakePct = Math.min(85, 25 + (productCount / 500) * 5);
                onProgress?.(fakePct, `processed ${productCount} products`);
            }
        });

        onProgress?.(90, 'writing_glb');

        // Write .glb (binary glTF)
        const io = new NodeIO();
        await io.write(outputPath, doc);

        onProgress?.(98, 'finalizing');

        const stat = await fs.stat(outputPath);

        // Free WASM heap before we return
        api.CloseModel(modelID);
        modelID = null;

        return {
            elementCount: productCount,
            primitiveCount,
            vertexCount: totalVertices,
            uniqueGeometries: meshCache.size,
            materialCount: materialCache.size,
            fileSize: stat.size,
        };
    } catch (err) {
        try { if (modelID != null) api.CloseModel(modelID); } catch { /* ignore */ }
        throw err;
    }
}

module.exports = { convertIfcToGlb };

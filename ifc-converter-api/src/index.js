const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - handle Render.com and all frontends
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : null; // null = allow all

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, warm-up pings)
        if (!origin) return callback(null, true);
        // If no ALLOWED_ORIGINS set, allow everything
        if (!allowedOrigins) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24h
}));

app.use(express.json());

// Create temp directories
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 600 * 1024 * 1024 }, // 600MB limit — covers project IFCs up to ~500MB with headroom
    fileFilter: (req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith('.ifc')) {
            cb(null, true);
        } else {
            cb(new Error('Only .ifc files are allowed'));
        }
    }
});

// web-ifc (Node) — dùng cho /extract-properties (trích thuộc tính + spatial tree).
const WebIFC = require('web-ifc');
// IFC → Fragments (.frag) — pipeline chính, cùng định dạng viewer ThatOpen ở client.
const { convertIfcToFragments } = require('./ifc-to-fragments');

// Store conversion jobs
const jobs = new Map();

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IFC → Fragments Converter API',
        version: '2.0.0',
        endpoints: {
            convertFragments: 'POST /convert-fragments — IFC → .frag (ThatOpen, pipeline chính)',
            downloadFragments: 'GET /download-fragments/:jobId — .frag output',
            extractProperties: 'POST /extract-properties — IFC → properties.json + spatial.json',
            status: 'GET /status/:jobId — poll progress',
            downloadProperties: 'GET /download-properties/:jobId — properties.json',
            downloadSpatial: 'GET /download-spatial/:jobId — spatial.json',
            deleteJob: 'DELETE /job/:jobId — cleanup',
        },
        limits: { maxFileSize: '600 MB' },
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────
// /convert-fragments — IFC → .frag (ThatOpen Fragments)
//
// Đây là pipeline chính: convert IFC sang .frag trên server (1 lần lúc upload)
// để trình duyệt KHÔNG phải parse IFC khi xem. .frag dùng cùng định dạng với
// FragmentsManager ở client nên load trực tiếp được.
//
// Front-end nhận .frag rồi tự upload lên Supabase Storage (converter không giữ
// thông tin storage — giữ service "dumb" về lưu trữ, đúng tinh thần TT47 2.2.16).
// ─────────────────────────────────────────────────────────────────────
app.post('/convert-fragments', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No IFC file uploaded' });
    }

    const jobId = uuidv4();
    const inputPath = req.file.path;
    const fragPath = path.join(OUTPUT_DIR, `${jobId}.frag`);
    const inputFileSize = req.file.size;

    jobs.set(jobId, {
        kind: 'fragments',
        status: 'processing',
        originalName: req.file.originalname,
        inputFileSize,
        inputPath,
        fragPath,
        startedAt: new Date().toISOString(),
        progress: 0,
        stage: 'queued',
    });

    console.log(`[${jobId}] /convert-fragments received ${req.file.originalname} (${(inputFileSize / 1024 / 1024).toFixed(1)} MB)`);

    res.json({
        jobId,
        status: 'processing',
        message: 'Fragment conversion started. Poll /status/:jobId for progress.',
        statusUrl: `/status/${jobId}`,
        downloadUrl: `/download-fragments/${jobId}`,
    });

    // ── Background conversion ────────────────────────────────
    (async () => {
        const updateProgress = (progress, stage) => {
            jobs.set(jobId, { ...jobs.get(jobId), progress, stage });
        };
        try {
            updateProgress(10, 'loading_wasm');
            const fragBuffer = await convertIfcToFragments(inputPath, {
                onProgress: (pct, stage) => updateProgress(pct, stage),
            });

            const fs2 = require('fs/promises');
            await fs2.writeFile(fragPath, fragBuffer);

            jobs.set(jobId, {
                ...jobs.get(jobId),
                status: 'completed',
                progress: 100,
                stage: 'done',
                completedAt: new Date().toISOString(),
                fragSize: fragBuffer.length,
            });
            console.log(`[${jobId}] /convert-fragments done — ${(fragBuffer.length / 1024 / 1024).toFixed(2)} MB .frag`);
        } catch (err) {
            console.error(`[${jobId}] /convert-fragments failed:`, err);
            jobs.set(jobId, { ...jobs.get(jobId), status: 'failed', error: err.message });
        } finally {
            if (fs.existsSync(inputPath)) { try { fs.unlinkSync(inputPath); } catch { /* ignore */ } }
        }
    })();
});

app.get('/download-fragments/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.kind !== 'fragments') return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ error: 'Not completed', status: job.status });
    if (!fs.existsSync(job.fragPath)) return res.status(404).json({ error: 'Output missing' });
    res.download(job.fragPath, `${job.originalName.replace(/\.ifc$/i, '')}.frag`);
});

// Check conversion status (generic — dùng cho mọi loại job)
app.get('/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    const startTime = new Date(job.startedAt).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    res.json({
        jobId,
        kind: job.kind,
        status: job.status,
        progress: job.progress,
        stage: job.stage,
        originalName: job.originalName,
        inputFileSize: job.inputFileSize,
        fragSize: job.fragSize,
        elementCount: job.elementCount,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        elapsedSeconds: elapsed,
        error: job.error,
        downloadUrl: job.status === 'completed' && job.kind === 'fragments' ? `/download-fragments/${jobId}` : null,
    });
});

// ─────────────────────────────────────────────────────────────────────
// /extract-properties — parse IFC server-side and return
//   { propertiesPath, spatialPath, elementCount }
// for large files (>200 MB) so the browser doesn't have to do it.
// ─────────────────────────────────────────────────────────────────────
app.post('/extract-properties', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No IFC file uploaded' });
    }

    const jobId = uuidv4();
    const inputPath = req.file.path;
    const propertiesPath = path.join(OUTPUT_DIR, `${jobId}-properties.json`);
    const spatialPath = path.join(OUTPUT_DIR, `${jobId}-spatial.json`);

    const inputFileSize = req.file.size;
    jobs.set(jobId, {
        kind: 'properties',
        status: 'processing',
        originalName: req.file.originalname,
        inputFileSize,
        inputPath,
        propertiesPath,
        spatialPath,
        startedAt: new Date().toISOString(),
        progress: 0,
        stage: 'parsing',
    });

    console.log(`[${jobId}] /extract-properties received ${req.file.originalname} (${(inputFileSize / 1024 / 1024).toFixed(1)} MB)`);

    res.json({
        jobId,
        status: 'processing',
        message: 'Property extraction started. Poll /status/:jobId for progress.',
        statusUrl: `/status/${jobId}`,
        downloadUrls: {
            properties: `/download-properties/${jobId}`,
            spatial: `/download-spatial/${jobId}`,
        },
    });

    // ── Background extraction ────────────────────────────────
    (async () => {
        const fs2 = require('fs/promises');
        const updateProgress = (progress, stage) => {
            jobs.set(jobId, { ...jobs.get(jobId), progress, stage });
        };

        let ifcApi = null;
        let modelId = null;
        try {
            updateProgress(10, 'loading_wasm');
            const data = await fs2.readFile(inputPath);

            ifcApi = new WebIFC.IfcAPI();
            await ifcApi.Init();
            updateProgress(20, 'parsing_ifc');

            modelId = ifcApi.OpenModel(new Uint8Array(data), { COORDINATE_TO_ORIGIN: false });

            updateProgress(40, 'enumerating_elements');
            const properties = [];
            const ROOT_TYPES = [
                // Spatial
                103090709, 4097777520, 4031249490, 3124254112,
                // Common building elements
                3512223829, 2391406531, 1529196076, 843113511, 753842376,
                395920057, 3304561284, 331165859, 2262370178, 1281925730,
                2058353004, 3856911033, 979105199, 1687234759, 1335981549,
                1051757585, 4105962743, 3758799889, 900683007, 3495092785,
            ];

            for (const typeCode of ROOT_TYPES) {
                try {
                    const ids = ifcApi.GetLineIDsWithType(modelId, typeCode);
                    for (let i = 0; i < ids.size(); i++) {
                        const id = ids.get(i);
                        try {
                            const line = ifcApi.GetLine(modelId, id, false);
                            if (line) properties.push(line);
                        } catch { /* skip malformed lines */ }
                    }
                } catch { /* type not present in this schema */ }
            }

            updateProgress(70, 'building_spatial_tree');
            const spatial = { properties: properties.slice(0, 500_000) };

            updateProgress(85, 'writing_outputs');
            await fs2.writeFile(propertiesPath, JSON.stringify(properties));
            await fs2.writeFile(spatialPath, JSON.stringify(spatial));

            updateProgress(95, 'finalizing');
            jobs.set(jobId, {
                ...jobs.get(jobId),
                status: 'completed',
                progress: 100,
                completedAt: new Date().toISOString(),
                elementCount: properties.length,
                propertiesSize: (await fs2.stat(propertiesPath)).size,
                spatialSize: (await fs2.stat(spatialPath)).size,
            });
            console.log(`[${jobId}] /extract-properties done — ${properties.length} elements`);
        } catch (err) {
            console.error(`[${jobId}] /extract-properties failed:`, err);
            jobs.set(jobId, {
                ...jobs.get(jobId),
                status: 'failed',
                error: err.message,
            });
        } finally {
            try { if (ifcApi && modelId != null) ifcApi.CloseModel(modelId); } catch { /* ignore */ }
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        }
    })();
});

app.get('/download-properties/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.kind !== 'properties') return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ error: 'Not completed', status: job.status });
    if (!fs.existsSync(job.propertiesPath)) return res.status(404).json({ error: 'Output missing' });
    res.download(job.propertiesPath, `${job.originalName.replace(/\.ifc$/i, '')}-properties.json`);
});

app.get('/download-spatial/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.kind !== 'properties') return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ error: 'Not completed', status: job.status });
    if (!fs.existsSync(job.spatialPath)) return res.status(404).json({ error: 'Output missing' });
    res.download(job.spatialPath, `${job.originalName.replace(/\.ifc$/i, '')}-spatial.json`);
});

// Delete job and files
app.delete('/job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    const tryUnlink = (p) => { if (p && fs.existsSync(p)) { try { fs.unlinkSync(p); } catch { /* ignore */ } } };
    tryUnlink(job.inputPath);
    tryUnlink(job.fragPath);
    tryUnlink(job.propertiesPath);
    tryUnlink(job.spatialPath);

    jobs.delete(jobId);
    res.json({ message: 'Job deleted successfully' });
});

// Cleanup old files (run every hour)
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const tryUnlink = (p) => { if (p && fs.existsSync(p)) { try { fs.unlinkSync(p); } catch { /* ignore */ } } };

    for (const [jobId, job] of jobs.entries()) {
        const startedAt = new Date(job.startedAt).getTime();
        if (startedAt < oneHourAgo) {
            tryUnlink(job.inputPath);
            tryUnlink(job.fragPath);
            tryUnlink(job.propertiesPath);
            tryUnlink(job.spatialPath);
            jobs.delete(jobId);
            console.log(`[Cleanup] Removed old job: ${jobId}`);
        }
    }
}, 60 * 60 * 1000);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 IFC → Fragments Converter API running on port ${PORT}`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
    console.log(`   Fragments: POST http://localhost:${PORT}/convert-fragments`);
});

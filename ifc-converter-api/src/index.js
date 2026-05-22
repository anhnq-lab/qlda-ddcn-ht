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

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IFC Converter API',
        version: '1.1.0',
        endpoints: {
            convert: 'POST /convert — IFC → XKT (xeokit) [legacy]',
            extractProperties: 'POST /extract-properties — IFC → properties.json + spatial.json (server-side, for >200 MB files)',
            status: 'GET /status/:jobId — poll progress',
            download: 'GET /download/:jobId — XKT output',
            downloadProperties: 'GET /download-properties/:jobId — properties.json',
            downloadSpatial: 'GET /download-spatial/:jobId — spatial.json',
        },
        limits: {
            maxFileSize: '600 MB',
        },
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Store conversion jobs
const jobs = new Map();

// Import xeokit-convert for IFC to XKT conversion
const { convert2xkt } = require('@xeokit/xeokit-convert');
// WebIFC is REQUIRED for IFC file conversion per xeokit docs
// Import from root package - package.json exports handle the node/browser split
const WebIFC = require('web-ifc');

// Convert IFC to XKT using @xeokit/xeokit-convert API
async function runConvertIFCtoXKT(inputPath, outputPath, jobId, onProgress) {
    console.log(`[${jobId}] Starting conversion with WebIFC...`);

    if (onProgress) onProgress(20, 'loading_ifc');

    await convert2xkt({
        WebIFC,  // Required for IFC conversion per xeokit docs
        source: inputPath,
        output: outputPath,
        log: (msg) => {
            console.log(`[${jobId}] ${msg}`);
            // Update progress based on log messages
            if (msg.includes('Converting')) {
                if (onProgress) onProgress(40, 'converting');
            } else if (msg.includes('Writing')) {
                if (onProgress) onProgress(80, 'writing_xkt');
            }
        }
    });

    if (onProgress) onProgress(95, 'finalizing');
    console.log(`[${jobId}] Conversion completed: ${outputPath}`);
}

// Convert IFC to XKT
app.post('/convert', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No IFC file uploaded' });
    }

    const jobId = uuidv4();
    const inputPath = req.file.path;
    const outputFileName = `${jobId}.xkt`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    // Store job info with file size
    const inputFileSize = req.file.size;
    jobs.set(jobId, {
        status: 'processing',
        originalName: req.file.originalname,
        inputFileSize,
        inputPath,
        outputPath,
        startedAt: new Date().toISOString(),
        progress: 0,
        stage: 'uploading'
    });

    console.log(`[${jobId}] File received: ${req.file.originalname} (${(inputFileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Return job ID immediately
    res.json({
        jobId,
        status: 'processing',
        message: 'Conversion started. Use /status/:jobId to check progress.',
        statusUrl: `/status/${jobId}`,
        downloadUrl: `/download/${jobId}`
    });

    // Process in background
    try {
        console.log(`[${jobId}] Starting conversion: ${req.file.originalname}`);

        // Progress callback for large files
        const updateProgress = (progress, stage) => {
            jobs.set(jobId, { ...jobs.get(jobId), progress, stage });
        };

        updateProgress(10, 'parsing');

        await runConvertIFCtoXKT(inputPath, outputPath, jobId, updateProgress);

        // Verify output exists
        if (!fs.existsSync(outputPath)) {
            throw new Error('Output file was not created');
        }

        // Update job status
        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            fileSize: fs.statSync(outputPath).size
        });

        console.log(`[${jobId}] Conversion completed`);

        // Cleanup input file
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    } catch (error) {
        console.error(`[${jobId}] Conversion failed:`, error);
        jobs.set(jobId, {
            ...jobs.get(jobId),
            status: 'failed',
            error: error.message
        });

        // Cleanup
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    }
});

// Check conversion status
app.get('/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate elapsed time
    const startTime = new Date(job.startedAt).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    res.json({
        jobId,
        status: job.status,
        progress: job.progress,
        stage: job.stage,
        originalName: job.originalName,
        inputFileSize: job.inputFileSize,
        outputFileSize: job.fileSize,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        elapsedSeconds: elapsed,
        error: job.error,
        downloadUrl: job.status === 'completed' ? `/download/${jobId}` : null
    });
});

// Download converted XKT file
app.get('/download/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
        return res.status(400).json({
            error: 'Conversion not completed',
            status: job.status
        });
    }

    if (!fs.existsSync(job.outputPath)) {
        return res.status(404).json({ error: 'Output file not found' });
    }

    const downloadName = job.originalName.replace('.ifc', '.xkt').replace('.IFC', '.xkt');
    res.download(job.outputPath, downloadName);
});

// ─────────────────────────────────────────────────────────────────────
// /extract-properties — parse IFC server-side and return
//   { propertiesPath, spatialPath, elementCount }
// for large files (>200 MB) so the browser doesn't have to do it.
//
// The extracted JSON is written to the response so the front-end can upload
// it to Supabase Storage (we don't bake Supabase service-role creds into this
// service — keep the converter dumb about storage).
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
            // web-ifc on Node — reuse the same package the converter already loads
            const data = await fs2.readFile(inputPath);

            ifcApi = new WebIFC.IfcAPI();
            await ifcApi.Init();
            updateProgress(20, 'parsing_ifc');

            modelId = ifcApi.OpenModel(new Uint8Array(data), { COORDINATE_TO_ORIGIN: false });

            // ── Collect element IDs (limit traversal to common building element types
            //    + their containing spatial elements; full GetAllLines is too broad). ──
            updateProgress(40, 'enumerating_elements');
            const properties = [];
            // IfcRoot subtypes — covers virtually every meaningful element
            // Use IFC2X3 namespace which is widely supported; works across schemas.
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
            // Spatial tree — IFC project → site(s) → building(s) → storey(s)
            // We build a flat list and let the client structure it because IFC
            // hierarchies are graph-shaped, not strictly tree-shaped.
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

    // Cleanup files — `outputPath` exists for /convert jobs, `propertiesPath` /
    // `spatialPath` for /extract-properties jobs. Test each before unlinking.
    const tryUnlink = (p) => { if (p && fs.existsSync(p)) { try { fs.unlinkSync(p); } catch { /* ignore */ } } };
    tryUnlink(job.inputPath);
    tryUnlink(job.outputPath);
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
            tryUnlink(job.outputPath);
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
    console.log(`🚀 IFC Converter API running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Convert: POST http://localhost:${PORT}/convert`);
});

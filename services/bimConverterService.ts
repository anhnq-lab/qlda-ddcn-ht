/**
 * bimConverterService — Thin client for ifc-converter-api. Used by the BIM
 * upload flow when an IFC file is too large to safely parse in the browser
 * (~> 200 MB). The server extracts properties + spatial tree with web-ifc on
 * Node, then this client uploads the resulting JSON to Supabase Storage.
 */

const CONVERTER_URL =
    import.meta.env.VITE_IFC_CONVERTER_URL || 'http://localhost:3001';

export interface ConverterJobStatus {
    jobId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    stage: string;
    originalName?: string;
    elementCount?: number;
    error?: string;
}

export const bimConverterService = {
    /** Returns true if the converter API responds to /health within 2s. */
    async isAvailable(): Promise<boolean> {
        try {
            const ctl = new AbortController();
            const timer = setTimeout(() => ctl.abort(), 2000);
            const res = await fetch(`${CONVERTER_URL}/health`, { signal: ctl.signal });
            clearTimeout(timer);
            return res.ok;
        } catch {
            return false;
        }
    },

    /**
     * Submit an IFC file for server-side property extraction. Returns the jobId;
     * use pollUntilDone() or pollStatus() to track progress.
     */
    async extractProperties(file: File): Promise<{ jobId: string }> {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${CONVERTER_URL}/extract-properties`, {
            method: 'POST',
            body: fd,
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText);
            throw new Error(`Converter API rejected upload: ${errText}`);
        }
        const data = await res.json();
        if (!data.jobId) throw new Error('Converter API did not return a jobId');
        return { jobId: data.jobId };
    },

    async pollStatus(jobId: string): Promise<ConverterJobStatus> {
        const res = await fetch(`${CONVERTER_URL}/status/${jobId}`);
        if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
        return (await res.json()) as ConverterJobStatus;
    },

    /**
     * Poll status every `intervalMs` until completed or failed. Calls `onTick`
     * with the latest status each poll so the UI can show progress.
     */
    async pollUntilDone(
        jobId: string,
        opts: {
            intervalMs?: number;
            timeoutMs?: number;
            onTick?: (s: ConverterJobStatus) => void;
        } = {}
    ): Promise<ConverterJobStatus> {
        const intervalMs = opts.intervalMs ?? 2000;
        const timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000; // 15 min for 500 MB IFCs
        const started = Date.now();

        while (true) {
            const s = await this.pollStatus(jobId);
            opts.onTick?.(s);
            if (s.status === 'completed') return s;
            if (s.status === 'failed') throw new Error(s.error || 'Conversion failed');
            if (Date.now() - started > timeoutMs) {
                throw new Error('Conversion timed out');
            }
            await new Promise((r) => setTimeout(r, intervalMs));
        }
    },

    /**
     * Submit an IFC file for server-side IFC → Fragments (.frag) conversion.
     * Pipeline chính (Phương án A): convert trên server để trình duyệt không
     * phải parse IFC khi xem. Trả về jobId; dùng pollUntilDone() để theo dõi.
     */
    async convertFragments(file: File): Promise<{ jobId: string }> {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${CONVERTER_URL}/convert-fragments`, {
            method: 'POST',
            body: fd,
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText);
            throw new Error(`Converter API rejected upload: ${errText}`);
        }
        const data = await res.json();
        if (!data.jobId) throw new Error('Converter API did not return a jobId');
        return { jobId: data.jobId };
    },

    /** Tải nội dung .frag đã convert xong về (ArrayBuffer) để upload lên Storage. */
    async downloadFragments(jobId: string): Promise<ArrayBuffer> {
        const res = await fetch(`${CONVERTER_URL}/download-fragments/${jobId}`);
        if (!res.ok) throw new Error(`Fragments download failed: ${res.statusText}`);
        return await res.arrayBuffer();
    },

    async downloadProperties(jobId: string): Promise<ArrayBuffer> {
        const res = await fetch(`${CONVERTER_URL}/download-properties/${jobId}`);
        if (!res.ok) throw new Error(`Properties download failed: ${res.statusText}`);
        return await res.arrayBuffer();
    },

    async downloadSpatial(jobId: string): Promise<ArrayBuffer> {
        const res = await fetch(`${CONVERTER_URL}/download-spatial/${jobId}`);
        if (!res.ok) throw new Error(`Spatial download failed: ${res.statusText}`);
        return await res.arrayBuffer();
    },

    /** Clean up server-side files when the job is no longer needed. */
    async deleteJob(jobId: string): Promise<void> {
        try {
            await fetch(`${CONVERTER_URL}/job/${jobId}`, { method: 'DELETE' });
        } catch {
            /* best-effort */
        }
    },
};

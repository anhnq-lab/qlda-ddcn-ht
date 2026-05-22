/**
 * stringifyOffMain — Run JSON.stringify on a dedicated worker so large BIM
 * property payloads don't freeze the renderer. Reuses a single worker instance.
 * Falls back to inline stringify if worker construction fails (e.g. SSR or
 * older browsers).
 */

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<number, {
    resolve: (json: string) => void;
    reject: (err: Error) => void;
}>();

function fallbackInlineStringify(payload: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(payload, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value as object)) return '[Circular]';
            seen.add(value as object);
        }
        return value;
    });
}

function getWorker(): Worker | null {
    if (workerInstance) return workerInstance;
    try {
        workerInstance = new Worker(
            new URL('./propertiesStringifyWorker.ts', import.meta.url),
            { type: 'module' }
        );
        workerInstance.onmessage = (e: MessageEvent<any>) => {
            const { id, ok, json, error } = e.data || {};
            const handler = pending.get(id);
            if (!handler) return;
            pending.delete(id);
            if (ok) handler.resolve(json);
            else handler.reject(new Error(error || 'Stringify failed'));
        };
        workerInstance.onerror = (err) => {
            console.warn('[stringifyOffMain] worker error:', err);
        };
        return workerInstance;
    } catch (err) {
        console.warn('[stringifyOffMain] worker unavailable, falling back inline:', err);
        return null;
    }
}

export async function stringifyOffMain(payload: unknown): Promise<string> {
    const worker = getWorker();
    if (!worker) return fallbackInlineStringify(payload);

    return new Promise<string>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        try {
            worker.postMessage({ id, payload });
        } catch (err: any) {
            // structuredClone failure → fall back inline
            pending.delete(id);
            try {
                resolve(fallbackInlineStringify(payload));
            } catch (e: any) {
                reject(e);
            }
        }
    });
}

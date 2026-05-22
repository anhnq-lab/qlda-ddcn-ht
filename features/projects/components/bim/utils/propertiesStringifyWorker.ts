/**
 * propertiesStringifyWorker — Stringifies BIM properties + spatial-tree payloads
 * off the main thread. For a 200k-element model the resulting JSON can reach
 * tens of megabytes; doing it inline blocks the renderer for several seconds
 * right after upload. Vite picks this up via the `?worker` import.
 */

type StringifyMessage = {
    id: number;
    payload: unknown;
};

type StringifyResponse =
    | { id: number; ok: true; json: string }
    | { id: number; ok: false; error: string };

function circularReplacer() {
    const seen = new WeakSet<object>();
    return (_key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value as object)) return '[Circular]';
            seen.add(value as object);
        }
        return value;
    };
}

self.onmessage = (e: MessageEvent<StringifyMessage>) => {
    const { id, payload } = e.data;
    try {
        const json = JSON.stringify(payload, circularReplacer());
        const response: StringifyResponse = { id, ok: true, json };
        (self as unknown as Worker).postMessage(response);
    } catch (err: any) {
        const response: StringifyResponse = {
            id,
            ok: false,
            error: err?.message || String(err),
        };
        (self as unknown as Worker).postMessage(response);
    }
};

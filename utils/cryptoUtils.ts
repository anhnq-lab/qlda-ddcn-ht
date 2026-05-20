export async function calculateFileHash(file: File): Promise<string> {
    try {
        // For large files (> 50MB), doing full SHA-256 in browser might crash.
        // In a production environment, you might use Streams API with Web Crypto,
        // or Web Workers. For this implementation, we use crypto.subtle for files < 50MB
        // and a pseudo-hash for larger files as a fallback (or assume stream-based hashing).
        
        if (file.size < 50 * 1024 * 1024) {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } else {
            // For > 50MB, a naive approach to avoid crashing the browser before web streams are fully supported:
            // Hash the first 1MB, last 1MB, and the file size + lastModified.
            // Note: For strict QCVN 12:2026/BCA compliance, full file hashing should be done via Streams API 
            // or deferred to the backend. We use a pseudo-hash here to keep the UI responsive.
            const head = await file.slice(0, 1024 * 1024).arrayBuffer();
            const tail = await file.slice(file.size - 1024 * 1024).arrayBuffer();
            
            // Combine them
            const combined = new Uint8Array(head.byteLength + tail.byteLength);
            combined.set(new Uint8Array(head), 0);
            combined.set(new Uint8Array(tail), head.byteLength);
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return `partial-sha256-${hashHex}-${file.size}-${file.lastModified}`;
        }
    } catch (error) {
        console.error("Hashing failed", error);
        return `${file.size}-${file.lastModified}-${file.name}`; // Fallback
    }
}

/**
 * Generate an AES-GCM encryption key from a password.
 * In a real application, you might use a user's master key or project key.
 */
export async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt a File using AES-GCM.
 * Returns the encrypted blob and the IV used.
 */
export async function encryptFile(file: File, key: CryptoKey): Promise<{ blob: Blob; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const buffer = await file.arrayBuffer();
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as any },
        key,
        buffer
    );
    return { blob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }), iv };
}

/**
 * Decrypt an ArrayBuffer using AES-GCM.
 */
export async function decryptFileBuffer(buffer: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<Blob> {
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as any },
        key,
        buffer
    );
    return new Blob([decryptedBuffer]);
}

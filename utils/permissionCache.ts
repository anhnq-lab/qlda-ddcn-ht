/**
 * permissionCache — sessionStorage-backed permission cache with TTL
 *
 * Why sessionStorage (not localStorage)?
 *   - Auto-cleared when browser tab closes → no stale permissions across sessions
 *   - Per-tab isolation → safe for shared computers
 *
 * TTL: 5 minutes — balances freshness vs. DB load for 150 concurrent users
 * Cache key: prefixed with userId → no cross-account contamination
 */

const CACHE_PREFIX = 'perm_v1_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface PermissionCacheEntry {
    /** Map serialized as key-value array (Map is not JSON-serializable) */
    permissionPairs: [string, string[]][];
    systemRole: string;
    isGlobalScope: boolean;
    /** Ban QLDA mà PGĐ phụ trách (chỉ dùng cho deputy_director) */
    managedBoards?: number[];
    cachedAt: number;
    userId: string;
}

function tryRead(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
}

function tryWrite(key: string, value: string): void {
    try { sessionStorage.setItem(key, value); } catch { /* quota exceeded — ignore */ }
}

function tryRemove(key: string): void {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

export const permissionCache = {
    /**
     * Read cache for userId. Returns null on miss, expiry, or parse error.
     */
    get(userId: string): PermissionCacheEntry | null {
        const raw = tryRead(CACHE_PREFIX + userId);
        if (!raw) return null;

        try {
            const entry: PermissionCacheEntry = JSON.parse(raw);
            const age = Date.now() - entry.cachedAt;
            if (age > CACHE_TTL_MS) {
                tryRemove(CACHE_PREFIX + userId);
                return null; // expired
            }
            return entry;
        } catch {
            tryRemove(CACHE_PREFIX + userId);
            return null; // corrupt data
        }
    },

    /**
     * Write cache entry for userId.
     */
    set(
        userId: string,
        data: Omit<PermissionCacheEntry, 'cachedAt' | 'userId'>
    ): void {
        const entry: PermissionCacheEntry = {
            ...data,
            cachedAt: Date.now(),
            userId,
        };
        tryWrite(CACHE_PREFIX + userId, JSON.stringify(entry));
    },

    /**
     * Invalidate cache for a specific user (e.g., after permission change).
     */
    invalidate(userId: string): void {
        tryRemove(CACHE_PREFIX + userId);
    },

    /**
     * Invalidate ALL cached permissions (e.g., on logout).
     */
    invalidateAll(): void {
        try {
            const keys = Object.keys(sessionStorage).filter(k =>
                k.startsWith(CACHE_PREFIX)
            );
            keys.forEach(k => sessionStorage.removeItem(k));
        } catch { /* ignore */ }
    },
};

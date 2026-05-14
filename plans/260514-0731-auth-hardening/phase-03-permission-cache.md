# Phase 03: Permission Cache (sessionStorage + TTL)
Status: ⬜ Pending
Priority: ⚠️ High
Estimated: 2-3 giờ
Dependencies: Phase 01, 02 hoàn thành

## Objective
Giảm số DB queries khi 150 người dùng refresh dashboard.
Hiện tại: mỗi page refresh = 1 query `user_permissions`.
Mục tiêu: Cache trong `sessionStorage` với TTL 5 phút.

---

## Requirements

### Functional
- [ ] Permissions cache trong `sessionStorage` tồn tại qua page refresh
- [ ] TTL 5 phút: hết hạn → tự fetch lại từ DB
- [ ] Cache invalidate khi: login/logout, impersonation start/stop, `refreshPermissions()` được gọi
- [ ] Cache key theo `userId` (không bị nhầm giữa các user trên cùng browser)

### Non-Functional
- [ ] Không tăng bundle size đáng kể (không cần thư viện ngoài)
- [ ] Fail-safe: nếu sessionStorage lỗi → fallback về fetch DB bình thường

---

## Implementation Steps

### Bước 1: Tạo cache utility — `utils/permissionCache.ts` (file mới)

```ts
const CACHE_PREFIX = 'perm_v1_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

interface CacheEntry {
  permissionMap: [string, string[]][]; // Map serialized as array
  systemRole: string;
  isGlobalScope: boolean;
  cachedAt: number;
  userId: string;
}

export const permissionCache = {
  get(userId: string): CacheEntry | null {
    try {
      const raw = sessionStorage.getItem(CACHE_PREFIX + userId);
      if (!raw) return null;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_PREFIX + userId);
        return null;
      }
      return entry;
    } catch { return null; }
  },

  set(userId: string, data: Omit<CacheEntry, 'cachedAt' | 'userId'>) {
    try {
      sessionStorage.setItem(CACHE_PREFIX + userId, JSON.stringify({
        ...data,
        cachedAt: Date.now(),
        userId,
      }));
    } catch { /* sessionStorage full — ignore */ }
  },

  invalidate(userId: string) {
    try { sessionStorage.removeItem(CACHE_PREFIX + userId); } catch {}
  },

  invalidateAll() {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => sessionStorage.removeItem(k));
    } catch {}
  },
};
```

### Bước 2: Tích hợp vào PermissionContext.tsx

```tsx
import { permissionCache } from '../utils/permissionCache';

// Trong fetchPermissions():
const fetchPermissions = useCallback(async () => {
  const userId = effectiveUser?.EmployeeID;
  if (!userId || !isAuthenticated) { /* clear state */ return; }

  // 1. Kiểm tra cache trước
  const cached = permissionCache.get(userId);
  if (cached && cached.userId === userId) {
    const map = new Map(cached.permissionMap);
    setState({
      permissionMap: map,
      systemRole: cached.systemRole as SystemRole,
      isGlobalScope: cached.isGlobalScope,
      loading: false, loaded: true, cachedForUserId: userId,
    });
    return; // ← Skip DB query!
  }

  // 2. Fetch từ DB nếu cache miss
  // ... (giữ nguyên logic cũ) ...

  // 3. Lưu vào cache sau khi fetch xong
  permissionCache.set(userId, {
    permissionMap: [...map.entries()],
    systemRole,
    isGlobalScope,
  });
}, [...]);

// Trong refreshPermissions(): xóa cache trước
const refreshPermissions = useCallback(async () => {
  const userId = effectiveUser?.EmployeeID;
  if (userId) permissionCache.invalidate(userId);
  setState(prev => ({ ...prev, cachedForUserId: null, loaded: false, loading: true }));
  fetchingRef.current = null;
  await fetchPermissions();
}, [fetchPermissions, effectiveUser?.EmployeeID]);
```

### Bước 3: Invalidate cache khi logout — `context/AuthContext.tsx`

```tsx
import { permissionCache } from '../utils/permissionCache';

const logout = async () => {
  permissionCache.invalidateAll(); // ← Thêm dòng này
  await supabase.auth.signOut();
  // ...
};
```

### Bước 4: Invalidate cache khi impersonation — `context/ImpersonationContext.tsx`

```tsx
import { permissionCache } from '../utils/permissionCache';

const startImpersonation = useCallback((user: Employee) => {
  permissionCache.invalidate(user.EmployeeID); // Xóa cache của user bị impersonate
  // ... giữ nguyên logic cũ
}, []);

const stopImpersonation = useCallback(() => {
  permissionCache.invalidateAll(); // Reset toàn bộ khi stop
  // ... giữ nguyên logic cũ
}, []);
```

---

## Files to Create/Modify

| File | Action | Mô tả |
|------|--------|-------|
| `utils/permissionCache.ts` | CREATE | sessionStorage cache utility với TTL |
| `context/PermissionContext.tsx` | MODIFY | Check/set cache trong fetchPermissions |
| `context/AuthContext.tsx` | MODIFY | invalidateAll() khi logout |
| `context/ImpersonationContext.tsx` | MODIFY | invalidate() khi impersonation thay đổi |

---

## Test Criteria
- [ ] Login → navigate Dashboard → F5 → không thấy network request tới `user_permissions`
- [ ] Login → chờ 5 phút → F5 → CÓ request tới `user_permissions` (cache expired)
- [ ] Admin impersonate user A → `sessionStorage` có cache của A
- [ ] Stop impersonation → cache bị xóa
- [ ] Logout → `sessionStorage` sạch (không còn `perm_v1_*` keys)
- [ ] Mở DevTools > Application > sessionStorage: thấy `perm_v1_{userId}` key

---

## Performance Impact Expected
- **Trước**: 150 user refresh dashboard trong 1 phút = 150 DB queries
- **Sau**: 150 user refresh = ~0 DB queries (cache hit) hoặc rất ít (first load / expired)
- **Cache size per user**: ~1-2KB (nhỏ, không lo sessionStorage limit)

---

## Notes
- Dùng `sessionStorage` thay vì `localStorage` vì: tự xóa khi đóng tab → an toàn hơn
- Cache key include userId để tránh nhầm permission giữa các account trên cùng browser
- Không cần React Query hay SWR — đủ đơn giản để tự implement

---
Next Phase: [Phase 04 — Forgot Password & Session Config](./phase-04-session-forgotpw.md)

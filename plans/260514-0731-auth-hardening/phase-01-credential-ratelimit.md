# Phase 01: Credential Cleanup & Login Rate Limiting
Status: ⬜ Pending
Priority: 🔴 Critical
Estimated: 1-2 giờ
Dependencies: Không có

## Objective
Xóa credentials hardcode, thêm brute-force protection (lockout sau 5 lần sai),
và đảm bảo Dev Auto-Login không bị leak sang production build.

---

## Requirements

### Functional
- [ ] Login form KHÔNG có default username/password
- [ ] Sau 5 lần đăng nhập sai: disable button 60 giây + hiện thông báo
- [ ] Sau 10 lần sai liên tục (across sessions): hiện hướng dẫn liên hệ Admin
- [ ] Đồng hồ đếm ngược hiển thị khi bị lockout
- [ ] Dev Auto-Login KHÔNG active trong production build

### Non-Functional
- [ ] UX mượt: error message rõ ràng bằng tiếng Việt
- [ ] Lockout state persist qua page refresh (dùng `localStorage`)
- [ ] Build production (`npm run build`) KHÔNG có dev credentials

---

## Implementation Steps

### Bước 1: Xóa hardcode credentials — `features/auth/Login.tsx`

```tsx
// BEFORE (line 9-10) — XÓA:
const [username, setUsername] = useState('Admin');
const [password, setPassword] = useState('@Abc123456');

// AFTER:
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
```

### Bước 2: Xóa DEV email hardcode — `context/AuthContext.tsx`

```tsx
// BEFORE (line 291-294) — XÓA PHẦN NÀY:
if (!email && import.meta.env.DEV && identifier.toLowerCase() === 'admin') {
    console.warn('[Auth] ⚠️ DEV fallback: using hardcoded admin email');
    email = 'admin@bqlddcn.gov.vn';
}

// AFTER: Không cần fallback vì DEV auto-login đã handle bên trên
```

### Bước 3: Rate limiting logic — `features/auth/useLoginRateLimit.ts` (file mới)

```tsx
// Hook mới: quản lý attempt counter + lockout timer
const LOCKOUT_KEY = 'login_lockout';
const ATTEMPTS_KEY = 'login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 giây

export function useLoginRateLimit() {
  // Đọc từ localStorage
  // Hàm recordFailedAttempt(): tăng counter, set lockout nếu >= MAX_ATTEMPTS
  // Hàm resetAttempts(): gọi khi login thành công
  // Return: { isLocked, secondsRemaining, canAttempt, recordFailedAttempt, resetAttempts }
}
```

### Bước 4: Tích hợp vào Login.tsx

```tsx
const { isLocked, secondsRemaining, canAttempt, recordFailedAttempt, resetAttempts } = useLoginRateLimit();

// Trong handleSubmit:
if (!canAttempt) return; // blocked
if (success) {
    resetAttempts();
    navigate(from, { replace: true });
} else {
    recordFailedAttempt(); // tự động lockout nếu đủ lần
    setError(...);
}

// Trong JSX:
<button disabled={isLoading || isLocked}>
  {isLocked ? `Chờ ${secondsRemaining}s...` : 'Đăng nhập hệ thống'}
</button>
{isLocked && <p>Quá nhiều lần thất bại. Vui lòng chờ {secondsRemaining} giây.</p>}
```

### Bước 5: Verify production build không có dev code

```bash
npm run build
# Kiểm tra dist/ không chứa chuỗi '@Abc123456' hay 'admin@bqlddcn.gov.vn'
grep -r "Abc123456" dist/
grep -r "bqlddcn" dist/
# Kết quả mong đợi: không tìm thấy gì
```

---

## Files to Create/Modify

| File | Action | Mô tả |
|------|--------|-------|
| `features/auth/Login.tsx` | MODIFY | Xóa defaults, tích hợp rate limit |
| `context/AuthContext.tsx` | MODIFY | Xóa DEV email hardcode fallback |
| `features/auth/useLoginRateLimit.ts` | CREATE | Hook mới quản lý lockout |

---

## Test Criteria
- [ ] Login form mở ra: username và password field đều trống
- [ ] Nhập sai 5 lần → button disable, đếm ngược 60s xuất hiện
- [ ] Sau 60s → button enable lại, có thể thử tiếp
- [ ] `npm run build` → `grep -r "Abc123456" dist/` không ra kết quả
- [ ] Dev auto-login vẫn hoạt động trong `npm run dev`

---

## Notes
- Supabase Auth tự có rate limit ở API level, nhưng UI lockout tăng UX
- Lockout dùng `localStorage` (persist qua refresh) không phải `sessionStorage`
- Cân nhắc: Nếu muốn lockout mạnh hơn → implement server-side trong Supabase Edge Function

---
Next Phase: [Phase 02 — Audit Log & RLS Hardening](./phase-02-audit-rls.md)

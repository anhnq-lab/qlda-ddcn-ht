# Phase 04: Forgot Password & Session Configuration
Status: ⬜ Pending
Priority: ⚠️ High
Estimated: 2 giờ
Dependencies: Phase 01, 02

## Objective
Implement tính năng "Quên mật khẩu" thực sự (hiện chỉ là `href="#"`),
cấu hình JWT session timeout phù hợp với môi trường công sở,
và verify PgBouncer connection pooler cho production.

---

## Requirements

### Functional
- [ ] Nút "Quên mật khẩu?" → Modal nhập email → Gửi reset link qua Supabase Auth
- [ ] Email reset link hết hạn sau 1 giờ (Supabase default)
- [ ] Trang `/reset-password` nhận token từ URL và cho phép đặt mật khẩu mới
- [ ] Thông báo thành công/lỗi rõ ràng bằng tiếng Việt

### Non-Functional
- [ ] JWT Access Token: 8 giờ (phù hợp giờ làm việc hành chính)
- [ ] Refresh Token: 7 ngày (không cần re-login hàng ngày)
- [ ] PgBouncer: verify URL dùng port 6543

---

## Implementation Steps

### Bước 1: Cấu hình JWT timeout — Supabase Dashboard

**Không cần code** — vào Supabase Dashboard:
1. Authentication → Settings → JWT Expiry
2. Set **Access Token Expiry**: `28800` (8 giờ = 8 × 3600)
3. Set **Refresh Token Rotation**: ON
4. Set **Refresh Token Expiry**: `604800` (7 ngày)

### Bước 2: Verify PgBouncer — `.env.production`

```env
# Kiểm tra URL trong .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co  # OK - đây là API URL

# Kiểm tra trong lib/supabase.ts
# Supabase JS client tự dùng REST API qua PostgREST
# → KHÔNG cần đổi sang port 6543 cho client-side
# Port 6543 chỉ cần nếu dùng direct SQL connection (backend/scripts)
```

> **Lưu ý**: Supabase JS SDK dùng PostgREST HTTP API, không phải direct PostgreSQL connection. PgBouncer chỉ cần cho external tools (scripts, Prisma, etc).

### Bước 3: Tạo ForgotPasswordModal component — `features/auth/ForgotPasswordModal.tsx`

```tsx
// Modal nhỏ gọn, 2 bước:
// Bước 1: Nhập email → "Gửi link đặt lại mật khẩu"
// Bước 2: Confirm "Đã gửi! Kiểm tra hộp thư của bạn"

// Logic:
const handleSend = async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) setError('Email không tồn tại trong hệ thống.');
  else setStep('sent');
};
```

### Bước 4: Tạo trang ResetPassword — `features/auth/ResetPassword.tsx`

```tsx
// Route: /reset-password (thêm vào App.tsx)
// Supabase tự inject token vào URL hash: /#access_token=...
// Dùng supabase.auth.updateUser({ password: newPassword })
// Sau khi đổi xong → navigate('/login')
```

### Bước 5: Update Login.tsx — đổi link thành onClick

```tsx
// BEFORE:
<a href="#">Quên mật khẩu?</a>

// AFTER:
<button type="button" onClick={() => setShowForgotModal(true)}>
  Quên mật khẩu?
</button>
<ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
```

### Bước 6: Thêm route ResetPassword — `App.tsx`

```tsx
// Thêm route không cần auth:
<Route path="/reset-password" element={<ResetPassword />} />
```

---

## Files to Create/Modify

| File | Action | Mô tả |
|------|--------|-------|
| `features/auth/ForgotPasswordModal.tsx` | CREATE | Modal nhập email reset |
| `features/auth/ResetPassword.tsx` | CREATE | Trang đặt mật khẩu mới |
| `features/auth/Login.tsx` | MODIFY | Link → Modal trigger |
| `App.tsx` | MODIFY | Thêm route /reset-password |

---

## Supabase Dashboard Config (Thủ công)

```
Authentication → Email Templates:
  - "Reset Password" template: Customize với branding tiếng Việt
  - Nội dung: "Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới..."

Authentication → URL Configuration:
  - Site URL: https://[domain-production]
  - Redirect URLs: thêm https://[domain-production]/reset-password
```

---

## Test Criteria
- [ ] Click "Quên mật khẩu?" → Modal xuất hiện
- [ ] Nhập email không tồn tại → hiện lỗi tiếng Việt
- [ ] Nhập email đúng → hiện "Đã gửi!" message
- [ ] Mở email → click link → vào trang /reset-password
- [ ] Nhập mật khẩu mới → Login được với mật khẩu mới
- [ ] JWT expiry: Login xong, chờ 8h 1 phút → auto logout (hoặc refresh token)

---
Next Phase: [Phase 05 — Load Test & Monitoring](./phase-05-loadtest.md)

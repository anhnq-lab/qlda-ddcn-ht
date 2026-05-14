# Phase 05: Load Test & Batch User Onboarding
Status: ⬜ Pending
Priority: ⚠️ High
Estimated: 2-3 giờ
Dependencies: Phase 01, 02, 03, 04 hoàn thành

## Objective
Verify hệ thống chịu được 150 người dùng đồng thời, chuẩn bị script
import tài khoản batch, và thiết lập monitoring dashboard trên Supabase.

---

## Requirements

### Functional
- [ ] Script tạo batch 150 tài khoản từ file Excel/CSV nhân viên
- [ ] Gửi email welcome + hướng dẫn đổi mật khẩu lần đầu
- [ ] Supabase Auth Rate Limit được cấu hình phù hợp production

### Non-Functional
- [ ] Hệ thống không bị timeout khi 50 user đăng nhập đồng thời
- [ ] Dashboard load < 3 giây với 150 session active
- [ ] Realtime connections < 500 (Supabase Pro limit)

---

## Implementation Steps

### Bước 1: Cấu hình Supabase Auth Rate Limits

**Supabase Dashboard → Authentication → Rate Limits:**

```
Sign in attempts:   10 per 5 minutes per IP   (tăng từ default)
Sign up:            3 per hour                 (giữ thấp)
Password recovery:  3 per hour per email
Email OTP:          3 per hour
```

### Bước 2: Script batch tạo tài khoản — `scripts/create-users-batch.ts`

```ts
// Đọc từ DanhSach_TaiKhoan_NguoiDung.xlsx (đã có trong root)
// Với mỗi nhân viên:
//   1. Tạo auth.user qua Admin API (service_role key)
//   2. Set password tạm thời = Ma_NV + "!Change2026"
//   3. Update user_accounts.auth_user_id
//   4. Gửi email "reset password" để user tự đổi

// Dùng @supabase/supabase-js với service_role key (chỉ run server-side)
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY);

for (const employee of employees) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: employee.email,
    password: employee.ma_nv + '!Change2026',
    email_confirm: true, // skip email confirm
  });
  if (!error) {
    await supabaseAdmin
      .from('user_accounts')
      .update({ auth_user_id: data.user.id })
      .eq('employee_id', employee.employee_id);
  }
}
```

### Bước 3: Load Test với k6 — `scripts/load-test-login.js`

```js
// Test scenario: 50 users login simultaneously
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '2m',    // trong 2 phút
};

export default function () {
  // 1. Resolve email (RPC call)
  const resolveRes = http.post(`${SUPABASE_URL}/rest/v1/rpc/resolve_user_identity`, {
    p_identifier: `user_${__VU}`,
  });

  // 2. Sign in
  const loginRes = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    email: resolveRes.json('email'),
    password: 'TestPassword123!',
  });

  // 3. Fetch permissions (as authenticated user)
  http.get(`${SUPABASE_URL}/rest/v1/user_permissions`, {
    headers: { Authorization: `Bearer ${loginRes.json('access_token')}` },
  });

  sleep(1);
}

// Metrics to watch: p95 response time < 2000ms, error rate < 1%
```

### Bước 4: Thiết lập Monitoring — Supabase Dashboard

```
Supabase Dashboard → Reports:
  □ API Requests: monitor RPC calls spike
  □ Database: watch connection count (< 100 cho free, < 500 cho pro)
  □ Auth: monitor sign-in success/failure rates
  □ Realtime: watch concurrent connections

Tạo alert (nếu Supabase Pro):
  □ Alert khi API error rate > 5%
  □ Alert khi DB connection > 80% capacity
```

### Bước 5: Checklist Onboarding 150 Người

```
Tuần trước go-live:
  □ Chạy script create-users-batch.ts (staging trước, production sau)
  □ Verify 10 tài khoản mẫu đăng nhập được
  □ Verify email reset password đến hộp thư
  □ Chạy load test k6 với 50 VU trên staging

Ngày go-live:
  □ Send email hướng dẫn cho 150 nhân viên
  □ Mở màn monitor Supabase Dashboard
  □ Có Admin túc trực hỗ trợ 9h-11h (giờ cao điểm đăng nhập lần đầu)
  □ Sẵn sàng script reset password thủ công nếu cần
```

---

## Files to Create/Modify

| File | Action | Mô tả |
|------|--------|-------|
| `scripts/create-users-batch.ts` | CREATE | Import 150 tài khoản từ Excel |
| `scripts/load-test-login.js` | CREATE | k6 load test script |
| `scripts/reset-user-password.ts` | CREATE | Script reset password thủ công cho admin |

---

## Test Criteria
- [ ] `k6 run load-test-login.js` → p95 < 2000ms, error rate < 1%
- [ ] 150 tài khoản được tạo trong DB với `auth_user_id` không null
- [ ] 10/10 tài khoản mẫu đăng nhập được bằng mật khẩu tạm thời
- [ ] Supabase Dashboard: DB connections < 50 khi 50 user online
- [ ] Realtime connections < 200 khi 50 user active

---

## Notes
- `SERVICE_ROLE_KEY` KHÔNG được commit vào git
- Load test chỉ chạy trên staging, không trên production
- File Excel `DanhSach_TaiKhoan_NguoiDung.xlsx` đã có trong root project

---
✅ **Plan hoàn thành! Bắt đầu thực thi từ Phase 01.**

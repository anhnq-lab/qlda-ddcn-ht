# Kế hoạch Sửa chữa Hệ thống Đăng nhập & Phân quyền

> **Dự án:** QLDA ĐDCN Hà Tĩnh  
> **Ngày lập:** 2026-05-14  
> **Người lập:** anhnq-lab  
> **Trạng thái:** `Chờ thực thi`

---

## Mục lục

1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Tình trạng Hiện tại](#2-tình-trạng-hiện-tại)
3. [Danh sách Vấn đề](#3-danh-sách-vấn-đề)
4. [Kế hoạch Thực thi](#4-kế-hoạch-thực-thi)
5. [Dự kiến Kết quả](#5-dự-kiến-kết-quả)

---

## 1. Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Auth (JWT)                                        │
│  ← login(identifier, password)                             │
│    RPC: resolve_user_identity   (username/phone → email)   │
│    RPC: get_user_profile_by_auth_id  (auth_id → profile)   │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  AuthContext                                                │
│  currentUser · session · userType (employee | contractor)  │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  ImpersonationContext                                       │
│  Admin giả làm user khác · timeout 30 phút · audit log     │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  PermissionContext  ·  can(resource, action)               │
│  ·  canOnProject(action, dept)                             │
│                                                             │
│  Thứ tự ưu tiên:                                           │
│  1. user_permissions (DB)          ← per-user override     │
│  2. role_permission_defaults (DB)  ← role template         │
│  3. DEFAULT_ROLE_PERMISSIONS       ← hardcoded fallback    │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  ProtectedRoute / PermissionGate  ←  UI gating             │
└─────────────────────────────────────────────────────────────┘
```

### Hệ thống Roles (9 vai trò)

| Nhóm | Role | Scope |
|------|------|-------|
| Lãnh đạo | `super_admin` · `director` · `deputy_director` · `chief_accountant` | Global |
| Chuyên môn | `dept_head` · `deputy_head` · `specialist` · `staff` | Global / Project |
| Nhà thầu | `contractor` | Project-scoped |

### Ma trận Quyền

- **22 resources** × **6 actions** (view · create · update · delete · approve · export) = **132 combinations**
- Ma trận quyền UI **hoạt động thực sự** — lưu vào bảng `role_permission_defaults` khi click "Lưu vào DB"
- Nút **"Đồng bộ cho tất cả"** → áp dụng role template vào `user_permissions` cho toàn bộ nhân viên cùng role
- Thay đổi có hiệu lực sau khi user F5 (cache sessionStorage 5 phút)

---

## 2. Tình trạng Hiện tại

### Điểm mạnh ✅

- Real backend Supabase — không mock data cho core flows
- RBAC + ABAC hybrid — role defaults + per-user override
- Deny-by-default — an toàn theo nguyên tắc least privilege
- Impersonation với audit log — ghi lại start / stop / auto-expired
- Rate limiting login — 5 lần / 60 giây lockout
- Project-scoped contractors — `allowed_project_ids` trong DB
- Permission caching — tránh N+1 queries

### Điểm số Hiện tại

| Khía cạnh | Điểm |
|-----------|:----:|
| Kiến trúc auth | 8/10 |
| Mô hình phân quyền | 8/10 |
| Chức năng cơ bản (login) | 2/10 |
| Lưu trữ bí mật | 3/10 |
| Audit & traceability | 2/10 |
| Client-side security | 4/10 |
| **Overall** | **5/10** |

---

## 3. Danh sách Vấn đề

### 🔴 BLOCKING — Không đăng nhập được

| ID | Nguyên nhân | File | Mô tả |
|----|-------------|------|-------|
| B1 | Cột `auth_user_id` chưa có trong DB | `supabase/init_schema.sql` | `UserAccountService.create()` insert `auth_user_id` vào `user_accounts` nhưng cột chưa tồn tại → SQL error |
| B2 | RPC `resolve_user_identity` chưa tạo | Supabase DB | `AuthContext.login()` gọi RPC này để convert username/phone → email → "function does not exist" |
| B3 | RPC `get_user_profile_by_auth_id` chưa tạo | Supabase DB | Gọi sau login để fetch profile → login thành công nhưng không load được user |
| B4 | Email mismatch khi tạo tài khoản | `services/UserAccountService.ts:105` | Tự sinh `{username}@cic.vn` thay vì email thực từ `employees` → resolve không tìm được |
| B5 | Tên bảng sai trong PermissionService | `services/PermissionService.ts:~182` | Query `role_permissions` nhưng bảng thực tế là `role_permission_defaults` |

### 🔴 CRITICAL — Bảo mật

| ID | Vấn đề | File | Mô tả |
|----|--------|------|-------|
| C1 | Plain text password lưu DB | `features/admin/ContractorAccountManager.tsx` | Field `current_password` lưu password nhà thầu plain text. DB bị dump → toàn bộ lộ |
| C2 | AuditLogViewer 100% mock | `features/admin/AuditLogViewer.tsx:23` | `mockAuditLogs` hardcoded, không phản ánh hoạt động thực nào |

### 🟠 HIGH — Bảo mật

| ID | Vấn đề | File | Mô tả |
|----|--------|------|-------|
| H1 | Không audit log account management | `features/admin/UserAccountManager.tsx` | Xóa / reset password / toggle tài khoản không ghi log |
| H2 | CDE PermissionManager thiếu check quyền | `features/cde/CDEPermissionManager` | Không check `can('admin_roles','update')` → privilege escalation |
| H3 | Impersonation timeout client-side only | `context/ImpersonationContext.tsx` | `setInterval` + localStorage → xóa localStorage bypass vô hạn |
| H4 | Dev credentials hardcoded | `context/AuthContext.tsx` | `admin@bqlddcn.gov.vn` / `@Abc123456` visible trong source code |

### 🟡 MEDIUM

| ID | Vấn đề | File | Mô tả |
|----|--------|------|-------|
| M1 | Permission cache stale 5 phút | `context/PermissionContext.tsx` | Quyền bị thu hồi vẫn có hiệu lực tối đa 5 phút |
| M2 | Rate limit chỉ client-side | `features/auth/Login.tsx` | Xóa localStorage → bypass hoàn toàn |
| M3 | Substring match trong `canOnProject()` | `context/PermissionContext.tsx` | "Dự án 1" match "Dự án 10" → cross-project access |
| M4 | Password tự sinh 8 ký tự (yếu) | `services/UserAccountService.ts` | Entropy ~47 bit, nên 12+ ký tự |
| M5 | Hash SHA-256 client-side | `services/UserAccountService.ts` | Pass-the-hash risk nếu hash bị intercept |
| M6 | `PermissionService.upsert()` không validate caller | `services/PermissionService.ts` | Không check changedBy có quyền admin_roles không |

### 🟢 LOW

| ID | Vấn đề | Mô tả |
|----|--------|-------|
| L1 | Không có 2FA | Không có second factor authentication |
| L2 | Audit log fire-and-forget | Lỗi chỉ log warning, không retry |
| L3 | `resolveSystemRole()` fallback ngầm | Fallback về `specialist` nếu không match |
| L4 | Contractor password sync race condition | Supabase Auth fail nhưng DB đã cập nhật |
| L5 | `explicitlyLoggedOut` flag client-side | Xóa flag → dev auto-login trigger |
| L6 | Không có session timeout | Không tự logout sau idle |

---

## 4. Kế hoạch Thực thi

---

### Phase 0 — Fix Blocking *(Ưu tiên số 1)*

> **Mục tiêu:** Tạo tài khoản + đăng nhập hoạt động end-to-end  
> **Số tasks:** 5  
> **Ước tính:** 0.5 ngày

#### B1 — Migration: Thêm cột `auth_user_id`

```sql
-- supabase/migrations/YYYYMMDD_add_auth_user_id.sql
ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_user_id
  ON public.user_accounts(auth_user_id);
```

#### B2 — Tạo RPC `resolve_user_identity`

```sql
CREATE OR REPLACE FUNCTION public.resolve_user_identity(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Match username
  SELECT e.email INTO v_email
  FROM public.user_accounts ua
  JOIN public.employees e ON ua.employee_id = e.employee_id
  WHERE ua.username = p_identifier AND ua.is_active = true
  LIMIT 1;
  IF v_email IS NOT NULL THEN RETURN v_email; END IF;

  -- Match email trực tiếp
  IF p_identifier LIKE '%@%' THEN RETURN p_identifier; END IF;

  -- Match phone
  SELECT e.email INTO v_email
  FROM public.employees e
  WHERE e.phone = p_identifier
  LIMIT 1;

  RETURN v_email;
END;
$$;
```

#### B3 — Tạo RPC `get_user_profile_by_auth_id`

```sql
CREATE OR REPLACE FUNCTION public.get_user_profile_by_auth_id(p_auth_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Employee
  SELECT json_build_object(
    'user_type',    'employee',
    'account_id',   ua.account_id,
    'employee_id',  ua.employee_id,
    'username',     ua.username,
    'is_active',    ua.is_active,
    'full_name',    e.full_name,
    'email',        e.email,
    'phone',        e.phone,
    'department',   e.department,
    'role',         e.role,
    'position',     e.position,
    'avatar_url',   e.avatar_url
  ) INTO v_result
  FROM public.user_accounts ua
  JOIN public.employees e ON ua.employee_id = e.employee_id
  WHERE ua.auth_user_id = p_auth_user_id AND ua.is_active = true;

  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  -- Contractor
  SELECT json_build_object(
    'user_type',            'contractor',
    'account_id',           ca.account_id,
    'contractor_id',        ca.contractor_id,
    'username',             ca.username,
    'display_name',         ca.display_name,
    'is_active',            ca.is_active,
    'allowed_project_ids',  ca.allowed_project_ids
  ) INTO v_result
  FROM public.contractor_accounts ca
  WHERE ca.auth_user_id = p_auth_user_id AND ca.is_active = true;

  RETURN v_result;
END;
$$;
```

#### B4 — Fix email khi tạo tài khoản

- **File:** `services/UserAccountService.ts:105`
- **Thay:** `const authEmail = input.email || \`${input.username}@cic.vn\``
- **Bằng:** Bắt buộc truyền `input.email` (email thực từ bảng `employees`), throw error nếu thiếu
- **Cũng sửa:** `features/admin/UserAccountManager.tsx` → `CreateAccountModal` truyền `employee.email`

#### B5 — Fix tên bảng trong PermissionService

- **File:** `services/PermissionService.ts:~182`
- **Thay:** `.from('role_permissions')` → `.from('role_permission_defaults')`

#### Kiểm tra Phase 0

- [ ] Tạo 1 tài khoản nhân viên mới → không có SQL error
- [ ] Đăng nhập bằng username → vào được app, hiện đúng tên/phòng ban
- [ ] Đăng nhập bằng email → vào được
- [ ] Đăng nhập sai password → báo lỗi đúng
- [ ] Ma trận quyền load đúng (không hardcoded fallback)

---

### Phase 1 — Bảo mật Thiết yếu

> **Mục tiêu:** Vá các lỗ hổng critical & high  
> **Số tasks:** 5  
> **Ước tính:** 1 ngày

#### C1 — Xóa plain text password nhà thầu

- **File:** `features/admin/ContractorAccountManager.tsx`
- Xóa field `current_password` khỏi mọi insert/update vào `contractor_accounts`
- Reset password → chỉ dùng `supabaseAdmin.auth.admin.updateUserById()`
- **Migration:** `ALTER TABLE contractor_accounts DROP COLUMN IF EXISTS current_password;`

#### C2 — Kết nối AuditLogViewer với DB thực

- **File:** `features/admin/AuditLogViewer.tsx`
- Xóa `mockAuditLogs` array
- Thay bằng: `supabase.from('audit_logs').select().order('timestamp', {ascending: false})`
- Thêm pagination (50 rows/page) + filter theo entity_type / action / date range

#### H1 — Thêm audit log cho account management

- **Files:** `features/admin/UserAccountManager.tsx`, `features/admin/ContractorAccountManager.tsx`
- Thêm `supabase.from('audit_logs').insert()` sau mỗi: **delete** / **reset password** / **toggle active**
- Ghi đủ: `action`, `entity_type='Account'`, `entity_id`, `entity_name`, `changed_by`, `details`

#### H2 — Permission check vào CDE PermissionManager

- **File:** `features/cde/CDEPermissionManager.tsx` (hoặc tương đương)
- Thêm vào đầu component:
  ```tsx
  if (!can('admin_roles', 'update')) return <AccessDenied />
  ```

#### M3 — Fix substring match trong `canOnProject()`

- **File:** `context/PermissionContext.tsx`
- **Thay:** `.includes(dept)` → exact match `.some(d => d === dept)` hoặc `=== dept`

#### Kiểm tra Phase 1

- [ ] DB `contractor_accounts` không còn cột `current_password`
- [ ] AuditLogViewer hiển thị log thực từ DB
- [ ] Tạo/xóa/reset tài khoản → xuất hiện trong AuditLog
- [ ] User không có quyền `admin_roles.update` → bị chặn tại CDE PermissionManager
- [ ] Nhân viên Ban 1 không xem được dự án của Ban 10

---

### Phase 2 — Cứng hóa Bảo mật

> **Mục tiêu:** Loại bỏ các bypass client-side  
> **Số tasks:** 5  
> **Ước tính:** 1–2 ngày

#### H4 — Dev credentials vào `.env.local`

- **File:** `context/AuthContext.tsx`
- Thay hardcoded string → `import.meta.env.VITE_DEV_EMAIL` / `import.meta.env.VITE_DEV_PASSWORD`
- Đảm bảo `.env.local` nằm trong `.gitignore`

#### M1 — Giảm permission cache TTL → 1 phút

- **File:** `utils/permissionCache.ts` (hoặc nơi định nghĩa TTL)
- Thay `TTL = 5 * 60 * 1000` → `TTL = 60 * 1000`

#### M2 — Server-side rate limiting

- Tạo bảng `login_attempts(identifier, attempt_time)` với auto-cleanup
- Tạo RPC `check_login_rate_limit(p_identifier TEXT)` → kiểm tra DB
- `AuthContext.login()` gọi RPC này **trước** `signInWithPassword`

#### H3 — Validate impersonation timeout phía server

- **File:** `context/ImpersonationContext.tsx`
- Tạo RPC `validate_impersonation_session(p_session_id)` → kiểm tra timestamp trong `audit_logs`
- Khi khởi tạo impersonation từ localStorage → gọi RPC validate, không chỉ tin localStorage

#### M4 — Password tự sinh 12+ ký tự

- **File:** `services/UserAccountService.ts`
- Thay `length: 8` → `length: 12`

#### Kiểm tra Phase 2

- [ ] Dev credentials không còn trong source code
- [ ] Quyền bị thu hồi có hiệu lực trong vòng 1 phút
- [ ] Xóa localStorage rate limit → vẫn bị block qua server
- [ ] Xóa localStorage impersonation → session không restore được
- [ ] Password sinh ra có ít nhất 12 ký tự

---

### Phase 3 — Nâng cao *(Dài hạn)*

> **Mục tiêu:** Hoàn thiện bảo mật lâu dài  
> **Số tasks:** 4  
> **Ước tính:** 2–3 ngày

#### L2 — Audit log với retry

- **Files:** `context/ImpersonationContext.tsx`, `features/admin/UserAccountManager.tsx`
- Thay fire-and-forget → `await` + retry 1 lần nếu fail + alert admin nếu vẫn fail

#### L6 — Session timeout sau 8 giờ inactive

- **File:** `context/AuthContext.tsx`
- Lưu `lastActivity` timestamp, reset khi user tương tác (click/keypress)
- `setInterval` mỗi phút → nếu > 8h → tự `logout()`

#### M5 — Server-side bcrypt hashing

- Tạo Supabase Edge Function `hash-password` dùng bcrypt
- Sửa `UserAccountService.ts` gọi Edge Function thay vì `crypto.subtle` client-side
- Cân nhắc deprecated cột `password_hash` trong `user_accounts` nếu chỉ dùng Supabase Auth

#### L1 — 2FA optional cho admin

- Implement TOTP qua Supabase Auth MFA API
- Bắt buộc với `super_admin`, optional với các role khác

#### Kiểm tra Phase 3

- [ ] Audit log không bị mất khi ghi thất bại (có retry)
- [ ] App tự logout sau 8 giờ không tương tác
- [ ] Password hash xảy ra ở server, không ở browser
- [ ] `super_admin` buộc phải bật 2FA

---

## 5. Dự kiến Kết quả

| Khía cạnh | Hiện tại | Sau Phase 0 | Sau Phase 1 | Sau Phase 2 | Sau Phase 3 |
|-----------|:--------:|:-----------:|:-----------:|:-----------:|:-----------:|
| Chức năng cơ bản | 2/10 | **9/10** | 9/10 | 9/10 | 9/10 |
| Mô hình phân quyền | 8/10 | **9/10** | **10/10** | 10/10 | 10/10 |
| Lưu trữ bí mật | 3/10 | 3/10 | **7/10** | **9/10** | 9/10 |
| Audit & traceability | 2/10 | 2/10 | **8/10** | 8/10 | **9/10** |
| Client-side security | 4/10 | 4/10 | 5/10 | **8/10** | 8/10 |
| **Overall** | **5/10** | **6.5/10** | **8/10** | **9/10** | **9.5/10** |

---

### Bảng tổng hợp Tasks

| Phase | ID | Mô tả ngắn | File chính | Độ phức tạp |
|:-----:|----|-----------|-----------|:-----------:|
| 0 | B1 | Migration thêm cột `auth_user_id` | `supabase/migrations/` | Thấp |
| 0 | B2 | RPC `resolve_user_identity` | Supabase DB | Trung |
| 0 | B3 | RPC `get_user_profile_by_auth_id` | Supabase DB | Trung |
| 0 | B4 | Fix email khi tạo tài khoản | `UserAccountService.ts` · `UserAccountManager.tsx` | Thấp |
| 0 | B5 | Fix tên bảng PermissionService | `PermissionService.ts` | Thấp |
| 1 | C1 | Xóa plain text password nhà thầu | `ContractorAccountManager.tsx` | Thấp |
| 1 | C2 | Kết nối AuditLogViewer với DB | `AuditLogViewer.tsx` | Trung |
| 1 | H1 | Audit log account management | `UserAccountManager.tsx` | Thấp |
| 1 | H2 | Permission check CDE Manager | `CDEPermissionManager.tsx` | Thấp |
| 1 | M3 | Fix `canOnProject()` exact match | `PermissionContext.tsx` | Thấp |
| 2 | H4 | Dev credentials → `.env.local` | `AuthContext.tsx` | Thấp |
| 2 | M1 | Permission cache TTL → 1 phút | `permissionCache.ts` | Thấp |
| 2 | M2 | Server-side rate limiting | Supabase RPC · `AuthContext.tsx` | Cao |
| 2 | H3 | Server-side impersonation validate | `ImpersonationContext.tsx` · Supabase | Cao |
| 2 | M4 | Password 12+ ký tự | `UserAccountService.ts` | Thấp |
| 3 | L2 | Audit log retry | Multiple files | Trung |
| 3 | L6 | Session timeout 8h | `AuthContext.tsx` | Trung |
| 3 | M5 | Server-side bcrypt hashing | Edge Function · `UserAccountService.ts` | Cao |
| 3 | L1 | 2FA optional cho admin | Supabase Auth MFA | Cao |

---

*Tài liệu này được tạo từ kết quả khảo sát mã nguồn ngày 2026-05-14.*

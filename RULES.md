# Quy Tắc Dự Án (Project Rules)
Tài liệu này định nghĩa các quy tắc làm việc cốt lõi cho dự án này.
## 1. Giao Tiếp (Communication)
- **Ngôn ngữ chính**: Tiếng Việt.
- Mọi trao đổi, giải thích, và tài liệu (trừ code và comments kỹ thuật nếu cần thiết) sẽ được thực hiện bằng Tiếng Việt để đảm bảo sự rõ ràng và thống nhất.
## 2. Quản Lý Mã Nguồn (Source Control)
### Quy trình Git (BẮT BUỘC tuân thủ):

**Bước 1: Pull trước khi code**
```bash
git pull origin main
```
> ⚠️ LUÔN pull trước khi bắt đầu code để đảm bảo có phiên bản mới nhất.

**Bước 2: Code xong → Commit**
```bash
git add .
git commit -m "feat: mô tả thay đổi"
```
> Commit message tuân theo format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

**Bước 3: Pull lại trước khi push**
```bash
git pull origin main
```
> ⚠️ Phòng trường hợp người khác đã push trong lúc mình code.

**Bước 4: Push (nếu không có conflict)**
```bash
git push origin main
```
> ❌ Nếu có conflict → resolve conflict trước → commit lại → rồi mới push.

### Tóm tắt nhanh:
```
pull → code → commit → pull → push
```

## 3. Development Server
- **Port**: `5000` (cấu hình trong `vite.config.ts`)
- **URL**: `http://localhost:5000`
- **Lệnh chạy**: `npm run dev`
> ⚠️ LUÔN dùng port 5000. KHÔNG dùng 5173 hay port khác.

## 4. Auto-Load Skills
Mỗi khi chỉnh sửa liên quan đến giao diện frontend (bao gồm: sửa component, thay đổi layout, styling, colors, animations, responsive, dark mode, typography, spacing, tạo component mới, hoặc bất kỳ thay đổi visual nào), bạn PHẢI:
1. Đọc file skill: `../.agent/skills/ui-ux-pro-max/SKILL.md`
2. Áp dụng các nguyên tắc và hướng dẫn trong skill đó vào quá trình thiết kế/chỉnh sửa
3. Đảm bảo output đạt chất lượng UI/UX cao nhất theo skill guidelines

## 5. 🌙 Dark Mode (BẮT BUỘC)

> App dùng Tailwind `dark:` class strategy. Mọi element PHẢI có dark variant đồng bộ.

### 4.1 KHÔNG dùng text color cứng — Luôn thêm `dark:` variant
```
❌ text-indigo-600
✅ text-indigo-600 dark:text-indigo-400
```
| Light Mode | Dark Mode |
|------------|-----------|
| `text-{color}-600` | `dark:text-{color}-400` |
| `text-{color}-700` | `dark:text-{color}-400` |
| `text-{color}-900` | `dark:text-slate-100` |
| `text-slate-500` | `dark:text-slate-400` |

### 4.2 KHÔNG dùng opacity thấp cho nền dark — Dùng full opacity
```
❌ dark:bg-slate-800/50    (lộ nền trắng)
❌ dark:bg-slate-800/30    (gần như không thấy)
✅ dark:bg-slate-800       (full opacity)
```
| Light Mode | Dark Mode |
|------------|-----------|
| `bg-white` | `dark:bg-slate-900` |
| `bg-slate-50` | `dark:bg-slate-800` |
| `bg-slate-100` | `dark:bg-slate-800` |
| `bg-{color}-50` | `dark:bg-{color}-900/20` |
| `bg-{color}-100` | `dark:bg-{color}-900/30` |

### 4.3 KHÔNG quên hover — Mọi hover PHẢI có `dark:hover:` variant
```
❌ hover:bg-slate-50
✅ hover:bg-slate-50 dark:hover:bg-slate-800
```

### 4.4 KHÔNG quên border
```
❌ border-slate-200
✅ border-slate-200 dark:border-slate-800
```

### Checklist khi viết component mới:
- [ ] Mọi `bg-white` → `dark:bg-slate-900`
- [ ] Mọi `bg-slate-50/100` → `dark:bg-slate-800`
- [ ] Mọi `text-{color}-600/700` → `dark:text-{color}-400`
- [ ] Mọi `text-slate-900` → `dark:text-slate-100`
- [ ] Mọi `border-slate-200` → `dark:border-slate-800`
- [ ] Mọi `hover:bg-*` → `dark:hover:bg-*`
- [ ] KHÔNG dùng opacity < 1.0 cho `dark:bg-slate-*`

## 6. Database Conventions

### 6.1 Primary Keys
- **Bảng mới** PHẢI dùng `UUID` với `DEFAULT gen_random_uuid()` làm PK.
- **KHÔNG** đổi PK của bảng hiện có (có thể gây cascade issues).
- Ngoại lệ: bảng lookup nhỏ có thể dùng `TEXT` PK nếu giá trị có ý nghĩa business (vd: `employee_id`, `departments.code`).

#### Bảng legacy còn dùng `TEXT` PK — KHÔNG đổi
Các bảng cốt lõi sau được tạo từ `init_schema.sql` với `TEXT PK` (thường `gen_random_uuid()::text`). Chúng có nhiều FK cascade phụ thuộc; chi phí refactor cao hơn lợi ích. Giữ nguyên TEXT PK, **không migrate sang UUID**:

```
employees           projects            bidding_packages    contracts
construction_works  payments            capital_plans       disbursements
documents           folders              variation_orders
```

Bảng mới (từ migration ≥ 2026-03-22) đã dùng `UUID DEFAULT gen_random_uuid()` đúng chuẩn. Khi viết code đọc FK của 2 nhóm trên, dùng `string` trong TS — `lib/database.types.ts` đã chuẩn hóa.

### 6.2 Date & Time Columns
- Dùng `DATE` cho ngày thuần (không có thời gian).
- Dùng `TIMESTAMPTZ` cho datetime (luôn có timezone).
- **KHÔNG** dùng `TEXT` để lưu ngày tháng (trừ trường text mô tả như `start_period`).
- Các cột `created_at`, `updated_at` dùng `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

### 6.3 Naming Conventions
- Tên bảng: `snake_case`, số nhiều (vd: `notifications`, `user_preferences`).
- Tên cột: `snake_case` (vd: `created_at`, `user_id`).
- Tên index: `idx_{table}_{column}` (vd: `idx_notifications_user_id`).
- Tên policy: `{table}_{action}` (vd: `notifications_select`, `notifications_insert`).

### 6.4 RLS (Row Level Security)
- Mọi bảng mới PHẢI enable RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Pattern chuẩn: dùng helper functions `is_admin()`, `is_global_role()`, `is_project_member()`, `get_current_employee_id()`.
- **KHÔNG** dùng `USING(true)` cho write policies (INSERT/UPDATE/DELETE).


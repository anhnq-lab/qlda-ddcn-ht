# 📋 KẾ HOẠCH TỐI ƯU & HOÀN THIỆN HỆ THỐNG

> **Dự án:** CIC QLDA — Hệ thống Quản lý Dự án Đầu tư Xây dựng (Ban DDCN HT)
> **Phiên bản:** 1.0 · **Ngày lập:** 2026-05-22 · **Thời gian dự kiến:** 6 tuần (3 sprint)
> **Phạm vi:** Backend (Supabase + Services), Database, Frontend, UI/UX, Build & Quality

---

## 0. Bối cảnh & Hiện trạng

| Khu vực | Quy mô | Trạng thái |
|---|---|---|
| Frontend features | 27 modules, ~245 .tsx | OK — code-splitting đầy đủ qua `lazyWithRetry` |
| Components UI | 64 file (UI/Common/AI) | DataTable, SlidePanel, Toast chuẩn |
| Services | 29 file · 9.117 LOC | TaskService 1.158, CDEService 808 — cần tách |
| Hooks React Query | 27 hook | OK, đã chuẩn hoá |
| Migrations Supabase | 72 file | RLS đã hardening một phần, vẫn còn lỗ hổng cần audit |
| Edge Functions | `admin-user-ops`, `scan-virus` | Pattern bảo mật chuẩn (verify JWT → service_role) |
| Build | TypeScript clean ✅ · Build 34s ✅ | 4 chunk > 500 KB, 10 CSS warnings |
| Tests | 7 file (services + components) | Coverage < 3% — rủi ro cao |

**Build hiện tại:**
- `vendor-3d` **4.088 KB** (gzip 553 KB)
- `ProjectBimTab` **1.702 KB** (gzip 497 KB)
- `index` **1.388 KB** (gzip 446 KB)
- `exceljs.min` **936 KB** (static import)

---

## 1. Phát hiện chính

### 🔴 P0 — Critical (xử lý trong Sprint 1)

| ID | Vấn đề | File / Vị trí | Tác động |
|---|---|---|---|
| P0-1 | Bundle initial quá lớn (~1.4 MB gzip) | `vendor-3d`, `exceljs.min`, `vendor-charts` | UX tải lần đầu chậm |
| P0-2 | 10 CSS warnings ở `theme-overrides.css` (selector arbitrary `.bg-\[\#FCF9F2\]` sai escape) | `styles/theme-overrides.css`, `components.css`, `dark-contrast.css` | Esbuild minifier không parse được, lộ quy ước sai |
| P0-3 | `errorReporting.ts` mix static + dynamic import → vô hiệu code-split | `App.tsx`, `index.tsx`, `components/ui/ErrorBoundary.tsx` | Vendor chunk không tách được |
| P0-4 | `@thatopen/components-front` mix static + dynamic import (5 file BIM) | `features/projects/components/bim/*` | Không tách được BIM chunk |
| P0-5 | RLS còn lỗ hổng (chỉ vừa fix 4 bảng 2026-05-20) | `supabase/migrations/20260520_fix_rls_policies.sql` | Còn nhiều bảng cũ dùng `USING(true)` chưa rà |
| P0-6 | `is_global_role()` hard-code danh sách phòng ban tiếng Việt | `supabase/migrations/20260401120000_rls_hardening_all_tables.sql:42` | Fragile khi đổi tên phòng |
| P0-7 | `aiService.ts` gọi `@google/generative-ai` từ browser → expose API key | `services/aiService.ts`, `components/ai/*` | Rủi ro bảo mật |
| P0-8 | `exceljs` static import 936 KB | nhiều file (Excel export) | Tải vào bundle dù user không xuất Excel |

### 🟠 P1 — High (Sprint 2)

| ID | Vấn đề | Vị trí |
|---|---|---|
| P1-1 | Service file quá dài, đảm nhiệm nhiều trách nhiệm | `TaskService.ts` 1.158 LOC, `CDEService.ts` 808, `CapitalService.ts` 692, `ProjectService.ts` 668, `PlanService.ts` 659 |
| P1-2 | `services/api.ts` (202 LOC) + `taskTemplates.ts` (393 LOC) có thể không còn dùng | `services/api.ts`, `services/taskTemplates.ts` |
| P1-3 | Component file quá lớn, khó test | `BiddingPackageDetail.tsx` 1.406 LOC, `ProjectTaskModal.tsx` 1.056, `ProjectPlanTab.tsx` 1.031 |
| P1-4 | Duplicate giữa `useProjects` và `useProjectsRealtime` | `hooks/useProjects.ts`, `hooks/useProjectsRealtime.ts` |
| P1-5 | Test coverage thấp — không có integration test cho RLS | `services/__tests__/`, `components/ui/__tests__/`, `utils/__tests__/` |
| P1-6 | Mutation `invalidateQueries` không nhất quán giữa các hook | nhiều hook |

### 🟡 P2 — Medium (Sprint 3)

| ID | Vấn đề | Vị trí |
|---|---|---|
| P2-1 | 15 file vẫn dùng `dark:bg-slate-XXX/30..50` (vi phạm RULES.md §4.2) | `MonthlyPlanItemDetail`, `AnnualPlanItemDetail`, `PublicAssetList`, `MidTermCapitalPage`, v.v. |
| P2-2 | BIM IFC parse trên main thread (chỉ có BVH spread qua `requestIdleCallback`) | `features/projects/components/bim/useBimEngine.ts` |
| P2-3 | Không có GitHub Actions CI (lint/test/build mỗi PR) | `.github/` |
| P2-4 | Migration naming hỗn hợp (`YYYYMMDDHHMMSS_*` và `YYYYMMDD_*`) → risk trùng timestamp | `supabase/migrations/` |
| P2-5 | Schema legacy: 12 bảng cốt lõi dùng TEXT PK, bảng mới dùng UUID | `supabase/init_schema.sql` |
| P2-6 | File rác trong root: `scratch/`, `backup_untracked/`, `*.cjs` dumps, `tsc_errors.log`, `build_output.txt` | root |
| P2-7 | Thiếu bundle analyzer & budget guard | `vite.config.ts` |
| P2-8 | RBAC matrix chưa được document tự động | `docs/authorization_specification.md` |

---

## 2. Roadmap 6 tuần

### 🚀 Sprint 1 — Tuần 1-2 · "Stabilize"

**Mục tiêu:** Đóng các lỗ hổng bảo mật P0, giảm 50% bundle initial, loại CSS warnings.

| # | Hạng mục | Effort | Owner | DoD |
|---|---|---|---|---|
| 1.1 | Sửa CSS arbitrary selectors sai escape ở 3 file | S | Frontend | `npm run build` không có warning CSS |
| 1.2 | Dynamic `import('exceljs')` chỉ khi user bấm xuất Excel | S | Frontend | `exceljs.min` chunk không nằm trong initial load |
| 1.3 | Đổi `errorReporting.ts` thành static-only (xoá dynamic import trong ErrorBoundary) | XS | Frontend | Vite không còn warning về chunk |
| 1.4 | Tách BIM chunks: `three` core vs `@thatopen` viewer; preload khi vào project có BIM | M | Frontend (BIM) | `ProjectBimTab` chunk < 1.000 KB |
| 1.5 | Audit RLS toàn DB: `SELECT * FROM pg_policies WHERE qual='true'` → migration fix tất cả write policy `USING(true)` | S | Backend | 0 policy INSERT/UPDATE/DELETE còn `USING(true)` |
| 1.6 | Refactor `is_global_role()` đọc từ bảng `departments` thay hard-code | S | Backend | Đổi tên phòng không cần sửa function |
| 1.7 | Tạo Edge Function `ai-summary` proxy Gemini API; client gọi qua `supabase.functions.invoke` | M | Backend + Frontend | Gemini API key không còn xuất hiện trong `dist/` |
| 1.8 | Audit `.env*` files: confirm không có service key client-side | XS | Backend | Document trong `RULES.md` |

**Acceptance gate Sprint 1:**
- Build warnings = 0
- Initial JS (gzip) < 800 KB
- Không còn API key client-side
- Tất cả write policies có rule (không phải `true`)

---

### 🔧 Sprint 2 — Tuần 3-4 · "Refactor & Test"

**Mục tiêu:** Tách các file quá lớn, dọn dead code, dựng test coverage cho RLS + service quan trọng.

| # | Hạng mục | Effort | Owner | DoD |
|---|---|---|---|---|
| 2.1 | Tách `TaskService.ts` → `taskCrud.ts` + `taskPlanLink.ts` + `taskWorkflowSeed.ts` | M | Backend | Mỗi file < 500 LOC, public API không đổi |
| 2.2 | Verify `services/api.ts` + `services/taskTemplates.ts` unused → xoá | S | Backend | Không có import còn lại |
| 2.3 | Tách `BiddingPackageDetail.tsx` 1.406 LOC thành: `OverviewTab`, `ContractorTab`, `ContractTab`, `SettlementTab` | M | Frontend | File chính < 400 LOC |
| 2.4 | Tách `ProjectTaskModal.tsx` (1.056 LOC) thành form sections + custom hook | M | Frontend | File chính < 400 LOC |
| 2.5 | Tách `ProjectPlanTab.tsx` (1.031 LOC) tương tự | M | Frontend | File chính < 400 LOC |
| 2.6 | Gộp `useProjects` + `useProjectsRealtime` thành 1 hook với option `realtime: true` | S | Frontend | Cache không bị chia đôi |
| 2.7 | Viết integration test RLS cho 5 bảng quan trọng (projects, payments, contracts, documents, tasks) | L | Backend QA | Mỗi bảng: ≥ 4 test (admin / member / non-member / contractor) |
| 2.8 | Unit test cho `PermissionService`, `DashboardService`, `WorkflowService` | M | Backend QA | Coverage 3 service ≥ 70% |
| 2.9 | Chuẩn hoá pattern `invalidateQueries` → tài liệu hoá trong `hooks/index.ts` | S | Frontend | Có README cho hooks |

**Acceptance gate Sprint 2:**
- Không file .tsx/.ts > 700 LOC trong `services/` và `features/projects/components/`
- Service coverage ≥ 50% trên 3 service đã chọn
- 5 bảng RLS có integration test pass

---

### ✨ Sprint 3 — Tuần 5-6 · "Polish & Harden"

**Mục tiêu:** Dọn nốt tech debt UI, hoàn thiện CI/CD, performance BIM.

| # | Hạng mục | Effort | Owner | DoD |
|---|---|---|---|---|
| 3.1 | Fix 15 file vi phạm dark mode opacity (RULES.md §4.2) | M | Frontend | Grep `dark:bg-slate-\d+/[1-5]0` = 0 |
| 3.2 | Đưa IFC parsing vào Web Worker (web-ifc-worker) | L | Frontend (BIM) | Main thread không freeze khi load 200MB IFC |
| 3.3 | GitHub Actions CI: `lint` + `tsc --noEmit` + `test:run` + `build` mỗi PR | S | DevOps | PR fail nếu một bước fail |
| 3.4 | Bundle analyzer (`rollup-plugin-visualizer`) + size-limit budget | S | Frontend | PR comment hiển thị bundle diff |
| 3.5 | Schema migration linter: check naming, trùng timestamp, RLS enabled | S | Backend | Chạy trong CI |
| 3.6 | Sinh RBAC matrix tự động từ `role_permission_defaults` → `docs/rbac_matrix.md` | M | Backend | Script `npm run docs:rbac` |
| 3.7 | Document quy tắc "bảng cũ giữ TEXT PK, bảng mới dùng UUID" trong `RULES.md` | XS | Backend | RULES.md cập nhật |
| 3.8 | Cleanup root: xoá `scratch/`, `backup_untracked/`, `*.cjs` dumps, `tsc_errors.log`, `build_output.txt`, `~$*.doc` | XS | All | `git status` sạch sau merge |

**Acceptance gate Sprint 3:**
- CI bắt buộc pass cho mọi PR
- Bundle budget không quá: initial < 600 KB gzip, single chunk < 1.500 KB
- Dark mode rules pass 100%
- Repo root sạch

---

## 3. Metric theo dõi

| KPI | Hiện tại | Sau Sprint 1 | Sau Sprint 2 | Sau Sprint 3 (mục tiêu) |
|---|---|---|---|---|
| Initial JS load (gzip) | ~1.4 MB | < 800 KB | < 700 KB | **< 600 KB** |
| Largest single chunk (gzip) | 553 KB | < 500 KB | < 500 KB | **< 400 KB** |
| TypeScript errors | 0 ✅ | 0 | 0 | 0 |
| Build warnings (CSS + chunk) | 12 | 0 | 0 | 0 |
| Test coverage (services P0) | < 10% | < 10% | ≥ 50% | **≥ 70%** |
| Integration test RLS | 0 | 0 | 5 bảng | **≥ 10 bảng** |
| File .ts/.tsx > 1.000 LOC | 8 | 8 | ≤ 2 | **0** |
| Policy `USING(true)` (write) | unknown | 0 | 0 | 0 |
| Vi phạm dark mode opacity | 32 chỗ / 15 file | 32 | 32 | **0** |

---

## 4. Khuyến nghị triển khai

1. **Branch model:** Tạo branch `chore/stabilize` cho Sprint 1; tách `refactor/sprint-2` và `polish/sprint-3` về sau. Không trộn feature mới vào các sprint này.
2. **PR size:** Mỗi PR ≤ 500 LOC diff để review hiệu quả. Refactor lớn chia thành nhiều PR liên tiếp.
3. **Không đụng vào TEXT PK của bảng cũ.** Cascade cost > benefit. Chỉ document quy tắc.
4. **Không skip pre-commit hooks** (`--no-verify`) khi merge các thay đổi RLS.
5. **Phân công gợi ý:** 1 senior dev full-time cho Sprint 1 (security + bundle); team chia đôi cho Sprint 2 (backend tách service · frontend tách component); cả team cho Sprint 3 (polish chia nhỏ task).
6. **Demo gate:** Cuối mỗi sprint demo cho Ban Giám đốc — chiếu metric trước/sau để chứng minh hiệu quả.

---

## 5. Phụ lục: Lệnh nhanh

```powershell
# Build + bundle inspection
npm run build
# Type check
npx tsc --noEmit
# Test
npm run test:run
npm run test:coverage
# Lint
npm run lint
# Audit RLS policies dùng USING(true)
# (chạy trong Supabase SQL Editor)
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND qual = 'true' AND cmd <> 'SELECT';
```

---

**Phiên bản:** 1.0 — Lập ngày 2026-05-22.
**Owner:** Tech Lead dự án QLDA ĐDCN HT.
**Reviewer:** Ban Giám đốc CIC.

# KẾ HOẠCH TỐI ƯU & HOÀN THIỆN MODULE QUẢN LÝ DỰ ÁN

> Ngày lập: 2026-06-06 | Phiên bản: 1.1 (cập nhật: bỏ project_approvals, đánh dấu items đã hoàn thành)
> Stack: React + TypeScript + Supabase (PostgreSQL) + TanStack React Query + Tailwind CSS

---

## MỤC LỤC

1. [ĐÁNH GIÁ HIỆN TRẠNG SAU REFACTOR](#1-đánh-giá-hiện-trạng-sau-refactor)
2. [DATABASE — Tối ưu & Bổ sung](#2-database--tối-ưu--bổ-sung)
3. [BACKEND — Service Layer & RPC](#3-backend--service-layer--rpc)
4. [FRONTEND — Kiến trúc & Logic](#4-frontend--kiến-trúc--logic)
5. [UI — Giao diện & Components](#5-ui--giao-diện--components)
6. [UX — Trải nghiệm người dùng](#6-ux--trải-nghiệm-người-dùng)
7. [ROADMAP THỰC HIỆN](#7-roadmap-thực-hiện)

---

## 1. ĐÁNH GIÁ HIỆN TRẠNG SAU REFACTOR

### Những gì đã làm tốt

| Hạng mục | Chi tiết |
|----------|---------|
| **Chuẩn hóa Approval** | 20+ cột phê duyệt inline → bảng `project_approvals` riêng với 7 loại. Giảm ~30 cột trên bảng `projects` |
| **Xóa JSONB dư thừa** | `BudgetAllocations`, `KHVInfo`, `ImplementationTracking` → dữ liệu giờ lấy từ `capital_plans` và RPC |
| **Server-side computed stats** | Type `ProjectComputedStats` sẵn sàng cho RPC `get_project_computed_stats` |
| **Form giảm tải** | Tổng -428 dòng code ở các form (Legal -57, Investment -59, Scale -29, General -24, CreateModal -78) |
| **Schema validation** | `ProjectApprovalSchema` với Zod, `ApprovalTypeSchema` enum — validate chặt trước khi gửi DB |
| **Mapper layer** | `dbToProjectApproval` / `projectApprovalToDb` — nhất quán snake_case ↔ PascalCase |
| **Service layer** | `getById()` tự động fetch approvals kèm project, retry transient errors |

### Những gì còn thiếu / cần hoàn thiện

| Vấn đề | Mức độ | Ghi chú |
|--------|--------|---------|
| RPC `get_project_computed_stats` chưa tạo trên Supabase | **Cao** | Type sẵn nhưng chưa có function, chưa service nào gọi |
| Bảng `project_approvals` chưa có migration | **Cao** | Cần tạo bảng + RLS + index |
| UI hiển thị/CRUD approvals chưa có | **Cao** | Chỉ có type + mapper + service fetch, chưa có component |
| `ComputedStats` chưa được dùng trên UI | **Trung bình** | ProjectInfoTab vẫn tính progress thủ công từ tasks |
| `ProjectConstructionTab` quá lớn (2161 dòng) | **Trung bình** | 4 sub-tabs gộp chung, khó maintain |
| Thiếu optimistic updates cho nhiều mutation | **Trung bình** | Tạo/xóa WBS, nhật ký thi công đều wait server |
| Không có error boundary cho từng tab | **Thấp** | Một tab lỗi → cả ProjectDetail bị trắng |

---

## 2. DATABASE — Tối ưu & Bổ sung

### 2.1 Migration: Bảng `project_approvals` (P0 — Ưu tiên cao nhất)

```sql
-- Migration: create_project_approvals_table
CREATE TABLE IF NOT EXISTS project_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    approval_type TEXT NOT NULL CHECK (approval_type IN (
        'planning', 'pccc', 'environment', 'appraisal',
        'design_appraisal', 'design_approval', 'construction_permit'
    )),
    document_number TEXT,
    document_date DATE,
    agency TEXT,
    extra_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE (project_id, approval_type)
);

-- Indexes
CREATE INDEX idx_project_approvals_project ON project_approvals(project_id);
CREATE INDEX idx_project_approvals_type ON project_approvals(approval_type);

-- RLS
ALTER TABLE project_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approvals"
    ON project_approvals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Project members can manage approvals"
    ON project_approvals FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_approvals.project_id
            AND pm.employee_id = (SELECT employee_id FROM employees WHERE auth_user_id = auth.uid())
            AND pm.role IN ('Giám đốc dự án', 'Trưởng phòng phụ trách', 'Chuyên viên phụ trách')
        )
    );

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_project_approvals
    BEFORE UPDATE ON project_approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 RPC: `get_project_computed_stats` (P0)

```sql
CREATE OR REPLACE FUNCTION get_project_computed_stats(p_project_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'project_id', p.project_id,
        'khv_total', COALESCE((
            SELECT SUM(amount) FROM capital_plans
            WHERE project_id = p.project_id AND plan_type = 'annual'
        ), 0),
        'total_disbursed', COALESCE((
            SELECT SUM(amount) FROM disbursements
            WHERE project_id = p.project_id AND status = 'completed'
        ), 0),
        'disbursement_rate', CASE
            WHEN p.total_investment > 0 THEN ROUND(
                COALESCE((SELECT SUM(amount) FROM disbursements
                    WHERE project_id = p.project_id AND status = 'completed'), 0)
                / p.total_investment * 100, 2
            )
            ELSE 0
        END,
        'physical_progress', COALESCE((
            SELECT ROUND(AVG(actual_percent), 2)
            FROM construction_progress
            WHERE project_id = p.project_id
        ), 0),
        'payment_progress', COALESCE((
            SELECT ROUND(
                SUM(CASE WHEN c.status = 'completed' THEN c.contract_value ELSE 0 END)
                / NULLIF(SUM(c.contract_value), 0) * 100, 2
            )
            FROM contracts c WHERE c.project_id = p.project_id
        ), 0)
    ) INTO result
    FROM projects p
    WHERE p.project_id = p_project_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 2.3 Xóa cột dư thừa trên bảng `projects` (P1)

Sau khi xác nhận không còn code nào tham chiếu, tạo migration xóa các cột đã loại khỏi type:

```
Cột cần xóa (đã remove khỏi Project interface):
- progress, payment_progress
- decision_maker_id, version, sync_status, cde_project_code
- planning_approval_*, pccc_approval_*, env_approval_*
- appraisal_result_*, design_appraisal_*, design_approval_*
- construction_permit_*, actual_start_date_construction
- insurance_*, acceptance_*
- tt24_completion_pct
- policy_decision_*
- budget_allocations (JSONB)
- khv_info (JSONB)
- implementation_tracking (JSONB)
```

**Chiến lược an toàn:**
1. Tạo migration rename cột → `_deprecated_*` (giữ 2 tuần)
2. Monitor xem có query nào fail không
3. Tạo migration xóa hẳn sau 2 tuần

### 2.4 Index tối ưu truy vấn (P1)

```sql
-- ProjectService._applyFilters sử dụng các cột này thường xuyên
CREATE INDEX CONCURRENTLY idx_projects_filters
    ON projects(status, management_board, group_code, specialty_type);

-- Full-text search thay vì ILIKE
CREATE INDEX CONCURRENTLY idx_projects_fts
    ON projects USING gin(to_tsvector('simple',
        coalesce(project_name, '') || ' ' ||
        coalesce(project_id, '') || ' ' ||
        coalesce(investor_name, '')
    ));

-- capital_plans & disbursements — queried per project rất thường xuyên
CREATE INDEX CONCURRENTLY idx_capital_plans_project ON capital_plans(project_id);
CREATE INDEX CONCURRENTLY idx_disbursements_project_status ON disbursements(project_id, status);
```

### 2.5 Materialized View cho Dashboard (P2)

```sql
CREATE MATERIALIZED VIEW mv_project_summary AS
SELECT
    p.project_id,
    p.project_name,
    p.group_code,
    p.management_board,
    p.status,
    p.total_investment,
    p.stage,
    COALESCE(cp_sum.khv_total, 0) AS khv_total,
    COALESCE(disb_sum.total_disbursed, 0) AS total_disbursed,
    COALESCE(prog.physical_progress, 0) AS physical_progress,
    p.start_date,
    p.expected_end_date
FROM projects p
LEFT JOIN LATERAL (
    SELECT SUM(amount) AS khv_total FROM capital_plans WHERE project_id = p.project_id
) cp_sum ON true
LEFT JOIN LATERAL (
    SELECT SUM(amount) AS total_disbursed FROM disbursements
    WHERE project_id = p.project_id AND status = 'completed'
) disb_sum ON true
LEFT JOIN LATERAL (
    SELECT ROUND(AVG(actual_percent), 2) AS physical_progress
    FROM construction_progress WHERE project_id = p.project_id
) prog ON true;

CREATE UNIQUE INDEX ON mv_project_summary(project_id);

-- Refresh mỗi 15 phút qua pg_cron (hoặc Edge Function)
SELECT cron.schedule('refresh_project_summary', '*/15 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_summary');
```

---

## 3. BACKEND — Service Layer & RPC

### 3.1 Tích hợp `ComputedStats` vào ProjectService (P0)

**File:** `services/ProjectService.ts`

```typescript
// Thêm method mới
static async getComputedStats(projectId: string): Promise<ProjectComputedStats> {
    const { data, error } = await supabase.rpc('get_project_computed_stats', {
        p_project_id: projectId
    });
    if (error) throw toServiceError(error, 'Không thể tải thống kê dự án');
    return {
        ProjectID: data.project_id,
        KHVTotal: data.khv_total,
        TotalDisbursed: data.total_disbursed,
        DisbursementRate: data.disbursement_rate,
        PhysicalProgress: data.physical_progress,
        PaymentProgress: data.payment_progress,
    };
}
```

**Hook mới:** `hooks/useProjectComputedStats.ts`

```typescript
export function useProjectComputedStats(projectId: string) {
    return useQuery({
        queryKey: ['project-computed-stats', projectId],
        queryFn: () => ProjectService.getComputedStats(projectId),
        staleTime: 2 * 60 * 1000, // 2 phút
        enabled: !!projectId,
    });
}
```

### 3.2 Tối ưu `getStats()` — Server-side thay Client-side (P1)

Hiện tại `getStats()` fetch tất cả rows rồi đếm trên client. Với 200+ dự án, nên chuyển sang RPC:

```sql
CREATE OR REPLACE FUNCTION get_project_stats(
    p_search TEXT DEFAULT NULL,
    p_stage TEXT DEFAULT NULL,
    p_sector TEXT DEFAULT NULL
)
RETURNS JSON AS $$
    SELECT json_build_object(
        'status_counts', (SELECT json_object_agg(status, cnt) FROM (
            SELECT status, COUNT(*) AS cnt FROM projects
            WHERE ($1 IS NULL OR project_name ILIKE '%' || $1 || '%')
            GROUP BY status
        ) t),
        'group_counts', (SELECT json_object_agg(group_code, cnt) FROM (
            SELECT group_code, COUNT(*) AS cnt FROM projects
            WHERE ($1 IS NULL OR project_name ILIKE '%' || $1 || '%')
            GROUP BY group_code
        ) t),
        'total', (SELECT COUNT(*) FROM projects
            WHERE ($1 IS NULL OR project_name ILIKE '%' || $1 || '%'))
    );
$$ LANGUAGE sql STABLE;
```

### 3.4 Search cải thiện: Full-text thay ILIKE (P2)

```typescript
// Trong _applyFilters, thay:
//   query.or(`project_name.ilike.%${s}%,...`)
// bằng:
if (params.search) {
    query = query.textSearch('fts', params.search, { type: 'websearch' });
}
```

### 3.5 Loại bỏ `getAll()` — chỉ dùng `getPaginated()` (P2)

`getAll()` đánh dấu LEGACY nhưng vẫn tồn tại. Audit tất cả consumer, chuyển sang `getPaginated()`, rồi xóa.

---

## 4. FRONTEND — Kiến trúc & Logic

### 4.1 Tách `ProjectConstructionTab.tsx` (2161 dòng → 4 file) (P1)

```
features/projects/components/tabs/construction/
├── ConstructionOverviewSubTab.tsx    (~400 dòng) — KPIs, S-Curve, thời tiết
├── ConstructionLogsSubTab.tsx        (~500 dòng) — Nhật ký thi công CRUD
├── ConstructionProgressSubTab.tsx    (~400 dòng) — WBS table, import
├── ConstructionGallerySubTab.tsx     (~300 dòng) — Thư viện ảnh
└── index.tsx                         (~60 dòng)  — Sub-tab router, shared state
```

### 4.2 Error Boundary cho từng Tab (P1)

```typescript
// components/common/TabErrorBoundary.tsx
export const TabErrorBoundary: React.FC<{ tabName: string; children: React.ReactNode }> = ...

// Sử dụng trong ProjectDetail.tsx:
<Suspense fallback={<TabSkeleton />}>
    <TabErrorBoundary tabName="Thi công">
        <ProjectConstructionTab ... />
    </TabErrorBoundary>
</Suspense>
```

### 4.3 Thay thế tính toán thủ công bằng `ComputedStats` (P0)

**File:** `ProjectInfoTab.tsx` (dòng ~200-250)

Hiện tại:
- `physicalProgress` = AVG(tasks.actual_percent) — query riêng `tasks` table
- `disbursedAmount` = SUM từ `useProjectCapitalSummary` hook

Nên thay bằng:
```typescript
const { data: stats } = useProjectComputedStats(project.ProjectID);
// Dùng stats.PhysicalProgress, stats.DisbursementRate, stats.TotalDisbursed
// Xóa query tasks chỉ dùng để tính progress
```

### 4.4 Optimistic Updates cho WBS & Nhật ký (P2)

```typescript
const addWbsMutation = useMutation({
    mutationFn: (wbs) => ConstructionService.addProgress(wbs),
    onMutate: async (newWbs) => {
        await queryClient.cancelQueries({ queryKey: ['construction-progress', projectId] });
        const previous = queryClient.getQueryData(['construction-progress', projectId]);
        queryClient.setQueryData(['construction-progress', projectId], (old) => [...old, { ...newWbs, progress_id: 'temp-' + Date.now() }]);
        return { previous };
    },
    onError: (err, _, context) => {
        queryClient.setQueryData(['construction-progress', projectId], context.previous);
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['construction-progress', projectId] });
    },
});
```

### 4.6 Prefetch tab data (P2)

Khi hover vào tab header, prefetch data cho tab đó:

```typescript
const handleTabHover = (tabId: string) => {
    if (tabId === 'capital') {
        queryClient.prefetchQuery({
            queryKey: ['capital-plans', project.ProjectID],
            queryFn: () => CapitalService.getByProject(project.ProjectID),
        });
    }
};
```

---

## 5. UI — Giao diện & Components

### 5.1 Stats KPI Cards dùng ComputedStats (P0)

Thay thế cách tính hiện tại ở `ProjectInfoTab` bằng data từ RPC:

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Tiến độ  │ │ Giải ngân│ │ KHV năm  │ │ Thanh    │
│  65.2%   │ │  42.8%   │ │ 15.2 tỷ  │ │ toán 38% │
│ ████░░░░ │ │ ████░░░░ │ │ ████░░░░ │ │ ████░░░░ │
│ Server ✓ │ │ Server ✓ │ │ Server ✓ │ │ Server ✓ │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 5.3 Empty States cho các tab ít dùng (P2)

Các tab như Thanh tra, Quyết toán, GPMB thường trống khi dự án mới. Thêm empty state có hướng dẫn:

```
┌─────────────────────────────────────────┐
│         📋                              │
│   Chưa có dữ liệu Thanh tra            │
│                                         │
│   Khi có đoàn thanh tra hoặc kiểm tra   │
│   dự án, thông tin sẽ được ghi nhận     │
│   tại đây.                              │
│                                         │
│   [+ Thêm đợt thanh tra]               │
└─────────────────────────────────────────┘
```

### 5.4 Responsive cải thiện cho Mobile (P2)

`ProjectConstructionTab` WBS table — hiện dùng `<table>` cố định, khó xem trên mobile. Chuyển sang card layout khi `< md`:

```typescript
{isMobile ? (
    <div className="space-y-3">
        {progressList.map(p => <WbsCard key={p.progress_id} item={p} />)}
    </div>
) : (
    <table>...</table>
)}
```

---

## 6. UX — Trải nghiệm người dùng

### 6.1 Inline Editing cho ProjectInfoTab (P1)

Hiện tại phải mở modal CreateProjectModal để sửa bất kỳ field nào. Thêm inline edit cho các field thường xuyên cập nhật:

- Giai đoạn dự án (Stage) — dropdown inline
- Trạng thái hiện tại (CurrentStatusCode) — dropdown inline
- Ngày kết thúc dự kiến — date picker inline

### 6.2 Batch Operations cho Bidding Packages (P1)

`ProjectPackagesTab` chỉ hỗ trợ thao tác đơn lẻ. Thêm:
- Chọn nhiều gói thầu → đổi trạng thái hàng loạt
- Export nhiều gói thầu đã chọn ra Excel

### 6.3 Auto-save Draft cho Construction Log (P2)

Nhật ký thi công dài, mất nhiều thời gian nhập. Auto-save draft vào localStorage:

```typescript
useEffect(() => {
    const key = `draft-log-${projectId}-${selectedDate}`;
    localStorage.setItem(key, JSON.stringify(logForm));
}, [logForm]);

// Load draft khi mở form
useEffect(() => {
    const key = `draft-log-${projectId}-${selectedDate}`;
    const draft = localStorage.getItem(key);
    if (draft) setLogForm(JSON.parse(draft));
}, [selectedDate]);
```

### 6.4 Guided Workflow cho Dự án mới (P3)

Sau khi tạo dự án, hiện checklist hướng dẫn:

```
✅ 1. Tạo dự án — Đã hoàn thành
⬜ 2. Thêm thành viên dự án
⬜ 3. Nhập thông tin phê duyệt (7 loại)
⬜ 4. Thiết lập kế hoạch vốn
⬜ 5. Tạo gói thầu
⬜ 6. Import WBS tiến độ thi công
```

### 6.5 Notification cho Cảnh báo quan trọng (P3)

Tích hợp `ProjectSmartAlerts.tsx` với push notification/email khi:
- Tỷ lệ giải ngân < 30% tại thời điểm quý III
- Tiến độ thực tế chậm > 15% so với kế hoạch
- Hợp đồng sắp hết hạn (< 30 ngày)

---

## 7. ROADMAP THỰC HIỆN

### Sprint 1 — P0: Foundation

| # | Task | Layer | Trạng thái |
|---|------|-------|------------|
| ~~1~~ | ~~Tạo migration `project_approvals`~~ | ~~DB~~ | **BỎ** (chưa cần) |
| 2 | Tạo RPC `get_project_computed_stats` + indexes | DB | **DONE** — `20260606_project_computed_stats_rpc.sql` |
| 3 | Tạo `useProjectComputedStats` hook | Frontend | **DONE** — `hooks/useProjectComputedStats.ts` |
| ~~4~~ | ~~Tạo `ProjectApprovalsSection`~~ | ~~UI~~ | **BỎ** (chưa cần) |
| 5 | ErrorBoundary cho ProjectInfoTab | Frontend | **DONE** — `ProjectDetail.tsx` |
| 6 | Prefetch tab data on hover | Frontend | **DONE** — `ProjectDetail.tsx` (capital, packages, construction) |
| 7 | Auto-save draft cho construction log | UX | **DONE** — `ProjectConstructionTab.tsx` (debounced localStorage) |

### Sprint 2 — Đã hoàn thành

| # | Task | Layer | Trạng thái |
|---|------|-------|------------|
| 9 | Tích hợp ComputedStats vào InfoTab | Frontend | **DONE** — `ProjectInfoTab.tsx` dùng `useProjectComputedStats` làm fallback |
| 11 | Chuyển `getStats()` sang RPC server-side | Backend+DB | **DONE** — `get_project_stats` RPC + `ProjectService.getStats()` gọi RPC |
| 14 | Optimistic updates cho WBS progress | Frontend | **DONE** — `useSaveConstructionProgress` & `useDeleteProgressItem` với onMutate/rollback |
| — | Fix bug: `delete()` còn tham chiếu `project_approvals` | Backend | **DONE** — xóa khỏi `ProjectService.delete()` |
| — | Xóa debug console.log trong `ProjectList.tsx` | Frontend | **DONE** — 3 dòng `[DEBUG-ProjectList]` |

### Còn lại — Chưa triển khai (ưu tiên thấp, có thể làm sau khi đi vào sử dụng)

| # | Task | Layer | Effort | Ghi chú |
|---|------|-------|--------|---------|
| 8 | Tách `ProjectConstructionTab` → 4 sub-components | Frontend | 4h | 2161 dòng, cần test kỹ |
| 10 | Tạo migration xóa cột deprecated | DB | 2h | Rename trước, xóa sau 2 tuần |
| 12 | Full-text search thay ILIKE | Backend+DB | 2h | Chỉ cần khi >500 dự án |
| 13 | Loại bỏ `getAll()`, audit consumers | Backend | 2h | Nhiều AI services dùng, rủi ro cao |
| 15 | Inline editing cho Stage, CurrentStatusCode | UI/UX | 4h | LifecycleStepper đã có Stage edit |
| 16 | Batch operations cho Bidding Packages | UI/UX | 3h | |
| 17 | Empty states cho tabs ít dùng | UI | 2h | GPMB đã có empty state tốt |
| 18 | Responsive card layout cho WBS table | UI | 3h | |
| 19 | Materialized view `mv_project_summary` | DB | 3h | Cần pg_cron extension |
| 20 | Guided workflow cho dự án mới | UX | 4h | |
| 21 | Smart alerts push notification | UX | 4h | |

---

## TÓM TẮT

| Metric | Trước | Hiện tại |
|--------|-------|----------|
| RPC computed stats | Chưa có | **Deployed & tích hợp vào InfoTab** |
| RPC project stats (filter badges) | Client-side counting | **Server-side RPC `get_project_stats`** |
| DB indexes (filters, capital, disbursement, construction) | Thiếu | **Deployed** |
| Error handling tất cả tabs | Không có ErrorBoundary | **ErrorBoundary cho tất cả 11 tabs** |
| Tab prefetch | Không có | **Hover prefetch 3 tabs nặng** |
| Construction log draft | Mất dữ liệu khi reload | **Auto-save localStorage + khôi phục** |
| WBS progress mutations | Wait server → invalidate | **Optimistic updates + rollback on error** |
| project_approvals code | Có type + mapper + service | **Đã xóa sạch** (chưa cần) |
| Debug console.log | 3 dòng DEBUG trong ProjectList | **Đã xóa** |
| Bug: delete() tham chiếu bảng bị xóa | project_approvals trong delete cascade | **Đã fix** |

**Trạng thái:** Module quản lý dự án đã sẵn sàng đưa vào sử dụng. Các item còn lại (8-21) là tối ưu hóa dài hạn, không ảnh hưởng đến chức năng chính.

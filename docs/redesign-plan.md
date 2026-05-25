# Kế hoạch Tái thiết Hệ thống Quản lý Công việc

> **Trạng thái:** Bản thiết kế — đã xác nhận 5/5 câu hỏi, sẵn sàng thực thi  
> **Ngày:** 2026-05-24

---

## Mục lục

1. [Quy trình nghiệp vụ](#1-quy-trình-nghiệp-vụ)
2. [Thiết kế Database](#2-thiết-kế-database)
3. [Kế hoạch Backend](#3-kế-hoạch-backend)
4. [Kế hoạch Frontend](#4-kế-hoạch-frontend)
5. [Thứ tự thực thi](#5-thứ-tự-thực-thi)

---

## 1. Quy trình nghiệp vụ

### 1.1 Sơ đồ tổng thể

```
         DỰ ÁN MỚI
              │
    ┌─────────┴──────────┐
    ▼                    ▼
KẾ HOẠCH NĂM       KẾ HOẠCH DỰ ÁN
(Đầu năm, tùy)    (Tự động từ quy trình
annual_plan_items   hoặc thủ công)
    │              monthly_plan_items
    │              [project_step]
    │                    │
    └──────────┬──────────┘
               │  Hàng tháng — lên lịch
               │  (hoặc tạo thẳng, không qua KH năm)
               ▼
        KẾ HOẠCH THÁNG
       monthly_plans (header)
       monthly_plan_items [monthly_plan]
               │
     ┌─────────┴──────────┐
     ▼                    ▼
 Lãnh đạo giao       Nhân viên tự tạo
     └──────────┬──────────┘
                ▼
          CÔNG VIỆC (tasks)
       - Có start_date, due_date riêng
       - Nằm trong bước (monthly_plan_item_id)
       - Hoặc độc lập (từ tab Công việc)
```

### 1.2 Các nguồn tạo KH tháng

KH tháng **không bắt buộc** phải đi qua KH năm. Có 3 cách đưa nhiệm vụ vào KH tháng:

| Nguồn | Cách làm | Bảng dữ liệu |
|---|---|---|
| **Từ KH năm** | Bấm "Sinh từ KH khung" → copy `annual_plan_items` thành `monthly_plan_items` | `annual_plan_items` → `monthly_plan_items` |
| **Từ KH dự án** | Bấm "Sinh từ dự án" → cập nhật `schedule_state` từ `project_step` → `monthly_plan` | Cập nhật `monthly_plan_items` |
| **Tạo thẳng** | Thêm mới trực tiếp trong tab KH tháng (phát sinh, không cần KH năm) | Tạo mới `monthly_plan_items` |

### 1.3 Các điểm tạo công việc (`tasks`)

| Điểm tạo | Gắn với |
|---|---|
| Tab **Công việc** — nút "+ Thêm" | Không gắn bước nào (`monthly_plan_item_id = NULL`) hoặc chọn bước |
| Tab **KH tháng** — trong từng mục | `monthly_plan_item_id` = mục KH tháng đó |
| Tab **KH dự án** — trong từng bước | `monthly_plan_item_id` = bước dự án đó |

### 1.4 Quan hệ bước ↔ công việc

```
monthly_plan_items (1 bước)
    ├── task A  [start_date: 01/06, due_date: 05/06, assignee: Nguyễn Văn A]
    ├── task B  [start_date: 03/06, due_date: 10/06, assignee: Trần Thị B]
    └── task C  [start_date: 08/06, due_date: 15/06, assignee: Lê Văn C]

Tiến độ bước = tổng hợp từ task A + B + C
Hạn bước (monthly_plan_items.due_date) = do user nhập ở cấp bước
Hạn task (tasks.due_date) = do user nhập khi tạo task, nằm trong hạn bước
```

---

## 2. Thiết kế Database

### 2.1 Sơ đồ quan hệ đầy đủ

```
workflows ──────────────► workflow_nodes
                                │
                                │ Khi "Tạo KH dự án từ quy trình"
                                ▼
projects ◄──────────── monthly_plan_items ◄──────── annual_plan_items
    │                       │  schedule_state              │
    │                ┌──────┴──────┐                       │
    │                │             │                       │
    │         [project_step]  [monthly_plan] ─────► monthly_plans
    │                │             │
    │                └──────┬──────┘
    │                       │ 1 bước : N tasks
    │                       ▼
    └──────────────────── tasks
                    (monthly_plan_item_id FK)
```

### 2.2 Tóm tắt thay đổi Schema

| Bảng | Xóa cột | Thêm cột | Ghi chú |
|---|---|---|---|
| `tasks` | `workflow_id`, `workflow_node_id` | — | Giữ `start_date`, `due_date`, `duration_days` |
| `monthly_plan_items` | `group_name` | — | Dùng `phase` thay thế |
| `annual_plan_items` | — | `project_step_id` | Link trực tiếp tới bước dự án |

---

### 2.3 Bảng `tasks` — Công việc cụ thể ⭐

| Cột | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã công việc | uuid | PK |
| `task_type` | Loại công việc | enum | `project` · `internal` · `management` |
| `project_id` | Dự án | text | FK → `projects` · Nullable |
| **`monthly_plan_item_id`** | **Bước / Mục KH chứa task** | **uuid** | **FK → `monthly_plan_items.id` · SET NULL on delete · Nullable** |
| `title` | Tiêu đề | varchar | NOT NULL |
| `description` | Mô tả | text | |
| `status` | Trạng thái | enum | `todo` · `in_progress` · `done` · `incomplete` |
| `priority` | Độ ưu tiên | enum | `low` · `medium` · `high` · `urgent` |
| `progress` | Tiến độ % | int | 0–100, user tự cập nhật |
| `assignee_id` | Người thực hiện | text | FK → nhân viên |
| `approver_id` | Người phê duyệt | text | |
| `collaborator_ids` | Người phối hợp | uuid[] | |
| **`start_date`** | **Ngày bắt đầu kế hoạch** | **date** | **Giữ nguyên — user điền khi tạo task** |
| **`due_date`** | **Hạn hoàn thành kế hoạch** | **date** | **Giữ nguyên — user điền khi tạo task** |
| **`duration_days`** | **Thời lượng (ngày)** | **int** | **Giữ nguyên — mỗi task có thể khác bước** |
| `actual_start_date` | Ngày bắt đầu thực tế | date | Tự động điền khi → `in_progress` |
| `actual_end_date` | Ngày hoàn thành thực tế | date | Tự động điền khi → `done` |
| `phase` | Giai đoạn | varchar | Copy từ bước (để filter nhanh) |
| `step_code` | Mã bước | varchar | Copy từ bước (legacy matching) |
| `sort_order` | Thứ tự trong bước | int | |
| `legal_basis` | Căn cứ pháp lý | text | |
| `output_document` | Sản phẩm đầu ra | text | |
| `predecessor_task_id` | Công việc tiền nhiệm | uuid | FK → `tasks.id` |
| `responsibility_level` | Cấp trách nhiệm | text | `individual` · `team` |
| `parent_id` | Task cha | uuid | FK → `tasks.id` · Nullable |
| `estimated_cost` | Chi phí dự kiến | numeric | |
| `actual_cost` | Chi phí thực tế | numeric | |
| `metadata` | Dữ liệu mở rộng | jsonb | `assignee_role`, `ui_status`, `is_wbs`... |
| `created_by` | Người tạo | uuid | |
| `created_at` / `updated_at` | Audit | timestamptz | |

**Cột XÓA khỏi `tasks`:**

| Cột xóa | Lý do |
|---|---|
| ~~`workflow_id`~~ | Task không cần link trực tiếp tới quy trình — liên kết qua `monthly_plan_items.workflow_id` |
| ~~`workflow_node_id`~~ | Thay bằng `monthly_plan_item_id` làm FK chính xác hơn |

---

### 2.4 Bảng `monthly_plan_items` — Bước / Mục KH tháng ⭐

| Cột | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã bước | uuid | PK |
| **`schedule_state`** | **Trạng thái lập lịch** | text | **`project_step`** · **`monthly_plan`** |
| `monthly_plan_id` | KH tháng | uuid | FK → `monthly_plans.id` · NULL khi `project_step` |
| `project_id` | Dự án | text | FK → `projects` · Nullable |
| `annual_plan_item_id` | Link KH năm | uuid | FK → `annual_plan_items.id` · Nullable |
| `task_name` | Tên bước / nhiệm vụ | text | NOT NULL |
| `deliverable` | Sản phẩm đầu ra | text | |
| **`phase`** | **Giai đoạn** | text | `preparation` · `execution` · `completion` |
| `step_code` | Mã bước semantic | text | |
| `step_order` | Thứ tự bước | int | Sắp xếp WBS |
| `workflow_node_id` | Bước quy trình gốc | uuid | FK → `workflow_nodes.id` · Nullable |
| `workflow_id` | Quy trình gốc | uuid | FK → `workflows.id` · Nullable |
| `start_date` | Ngày bắt đầu bước | date | Khung thời gian của bước |
| `due_date` | Hạn hoàn thành bước | date | Task con phải ≤ due_date này |
| `duration_days` | Thời lượng bước (ngày) | int | |
| `assignee_role` | Vai trò / phòng phụ trách | text | VD: `QLDA1`, `KTTD` |
| `legal_basis` | Căn cứ pháp lý | text | |
| `output_document` | Sản phẩm đầu ra | text | |
| `status` | Kết quả thực hiện | enum | `planned` · `completed` · `incomplete` · `partial` · `deferred` |
| `completion_result` | Mô tả kết quả | text | |
| `incomplete_reason` | Lý do chưa hoàn thành | text | |
| `deferred_to_plan_id` | Chuyển sang KH tháng | uuid | FK → `monthly_plans.id` |
| `source_type` | Nguồn gốc tạo | text | `manual` · `from_annual` · `from_workflow` · `project_step` |
| `scheduled_at` | Thời điểm lên KH tháng | timestamptz | |
| `collaborating_dept_codes` | Phòng phối hợp | varchar[] | |
| `notes` | Ghi chú | text | |
| `sort_order` | Thứ tự (legacy) | int | |
| `created_by` / `created_at` / `updated_at` | Audit | | |

**Cột XÓA khỏi `monthly_plan_items`:**

| Cột xóa | Lý do |
|---|---|
| ~~`group_name`~~ | Dùng `phase` để nhóm giai đoạn — rõ ràng và chuẩn hơn |

---

### 2.5 Bảng `annual_plan_items` — KH Khung năm

| Cột | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã nhiệm vụ | uuid | |
| `plan_year` | Năm | int | |
| `department_code` | Phòng chủ trì | varchar | |
| `department_name` | Tên phòng | varchar | |
| `group_name` | Nhóm nhiệm vụ | varchar | VD: "Công tác đấu thầu" |
| `group_sort_order` | Thứ tự nhóm | int | |
| `task_name` | Tên nhiệm vụ | text | NOT NULL |
| `deliverable` | Sản phẩm đầu ra | text | |
| `start_period` | Thời điểm bắt đầu | varchar | VD: "Quý I", "Tháng 4" |
| `end_period` | Thời điểm kết thúc | varchar | |
| `frequency` | Tần suất | enum | `one_time` · `monthly` · `quarterly` · `daily` · `as_needed` |
| `project_id` | Link dự án | text | Nullable |
| **`project_step_id`** | **Link bước dự án cụ thể** | **uuid** | **MỚI — FK → `monthly_plan_items.id` · SET NULL on delete** |
| `collaborating_dept_codes` | Phòng phối hợp | varchar[] | |
| `notes` | Ghi chú | text | |
| `sort_order` | Thứ tự | int | |
| `source_type` | Nguồn gốc | text | `manual` · `from_project_task` |
| `created_by` / `created_at` / `updated_at` | Audit | | |

---

### 2.6 Bảng `monthly_plans` — Header KH tháng

> Không thay đổi cấu trúc.

| Cột | Tên tiếng Việt | Kiểu |
|---|---|---|
| `id` | Mã KH tháng | uuid |
| `plan_month` | Tháng (1–12) | int |
| `plan_year` | Năm | int |
| `department_code` | Mã phòng | varchar |
| `department_name` | Tên phòng | varchar |
| `status` | Trạng thái | `draft` · `published` · `closed` |
| `notes` | Ghi chú | text |

**Unique:** `(plan_month, plan_year, department_code)`

---

### 2.7 Bảng `workflows` + `workflow_nodes` — Quy trình mẫu

> Không thay đổi. Chỉ đọc tại runtime.

---

### 2.8 SQL Migration

```sql
-- ── 1. tasks: xóa 2 cột workflow ──────────────────────────────
ALTER TABLE tasks
    DROP COLUMN IF EXISTS workflow_id,
    DROP COLUMN IF EXISTS workflow_node_id;

-- ── 2. monthly_plan_items: xóa group_name ─────────────────────
ALTER TABLE monthly_plan_items
    DROP COLUMN IF EXISTS group_name;

-- ── 3. annual_plan_items: thêm link bước dự án ────────────────
ALTER TABLE annual_plan_items
    ADD COLUMN IF NOT EXISTS project_step_id uuid
        REFERENCES monthly_plan_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_annual_plan_items_project_step
    ON annual_plan_items(project_step_id)
    WHERE project_step_id IS NOT NULL;
```

---

## 3. Kế hoạch Backend

### 3.1 TypeScript Types cần cập nhật

#### `types/task.types.ts`

```typescript
// XÓA 2 trường này:
// WorkflowID?: string;
// WorkflowNodeID?: string;

// GIỮ NGUYÊN (đừng xóa):
StartDate?: string;       // User điền khi tạo task
DueDate: string;          // User điền khi tạo task
DurationDays?: number;    // Mỗi task có thể có thời lượng riêng

// GIỮ NGUYÊN:
MonthlyPlanItemID?: string;   // FK chính → monthly_plan_items
StepCode?: string;            // Fallback matching
Phase?: string;
ActualStartDate?: string;
ActualEndDate?: string;
```

#### `types/plan.types.ts`

```typescript
// MonthlyPlanItem: XÓA group_name
// group_name?: string;  ← XÓA

// AnnualPlanItem: THÊM project_step_id
project_step_id?: string;  // FK → monthly_plan_items.id
```

---

### 3.2 `lib/mappers/workflowTaskMappers.ts`

**`workflowTaskToTask()`** — Cập nhật:

```typescript
// XÓA:
// TimelineStep: wt.workflow_node_id || wt.node_id || '',

// GIỮ (không thay đổi):
StartDate: wt.start_date || '',      // Task có ngày riêng
DueDate: wt.due_date || '',
DurationDays: wt.duration_days || 0,
MonthlyPlanItemID: wt.monthly_plan_item_id || undefined,
StepCode: wt.step_code || '',
```

**`taskToDbTask()`** — Cập nhật:

```typescript
// XÓA:
// workflow_id: task.WorkflowID || null,
// workflow_node_id: task.TimelineStep || null,

// GIỮ:
start_date: task.StartDate || null,
due_date: task.DueDate || null,
duration_days: task.DurationDays || null,
monthly_plan_item_id: task.MonthlyPlanItemID || null,
step_code: task.StepCode || null,
```

---

### 3.3 `lib/progressCalculator.ts`

**`isTaskInStep()`** — Đơn giản hóa, bỏ `TimelineStep`:

```typescript
export function isTaskInStep(
    task: Task,
    step: { id?: string; code?: string | null }
): boolean {
    // Ưu tiên 1: FK match (chính xác nhất)
    if (step.id && task.MonthlyPlanItemID === step.id) return true;
    // Ưu tiên 2: StepCode fallback (legacy tasks chưa có FK)
    if (step.code && compareStepCode(task.StepCode, step.code)) return true;
    // Không còn TimelineStep (workflow_node_id) matching
    return false;
}
```

---

### 3.4 `services/ProjectStepsService.ts`

**`createFromCustomPlan()`** — Cập nhật tasks insert:

```typescript
tasksToInsert.push({
    // XÓA: workflow_id, workflow_node_id
    // GIỮ: start_date, due_date (phân bổ từ bước)
    start_date: subDates.start,
    due_date: subDates.end,
    monthly_plan_item_id: stepId,  // FK chính
    step_code: step.workflow_node_id || stepId,
    // ...
});
```

---

### 3.5 RPCs Supabase

| RPC | Mô tả | Trạng thái |
|---|---|---|
| `schedule_project_steps_to_month` | Chuyển bước → KH tháng (update schedule_state) | ✅ Đã có |
| `unschedule_steps` | Gỡ bước khỏi KH tháng | ✅ Đã có |
| `seed_monthly_from_annual` | Copy annual_plan_items → monthly_plan_items cho tháng | 🔲 Cần tạo |

**Spec `seed_monthly_from_annual`:**
```sql
-- Input: p_annual_item_ids uuid[], p_monthly_plan_id uuid
-- Logic:
--   1. Lấy các annual_plan_items theo ids
--   2. INSERT vào monthly_plan_items với:
--      - monthly_plan_id = p_monthly_plan_id
--      - schedule_state = 'monthly_plan'
--      - source_type = 'from_annual'
--      - annual_plan_item_id = annual item id
--      - project_id = annual item's project_id (nếu có)
--   3. Nếu annual item có project_step_id → update schedule_state
--      của step đó thay vì tạo mới
-- Output: inserted_count int
```

---

## 4. Kế hoạch Frontend

### 4.1 Luồng dữ liệu

```
annual_plan_items ──"Sinh KH tháng"──► monthly_plan_items [monthly_plan]
                                               │
monthly_plan_items [project_step] ─────────────┘
(Bước dự án chưa lên lịch)

Cả 2 nguồn trên → monthly_plan_items [monthly_plan]
                          │
               Thêm task từ 3 điểm:
          ┌────────┬──────────┬──────────────┐
          │        │          │              │
      Tab CV   Tab KH T   Tab KH DA    (tất cả → tasks)
```

### 4.2 Thay đổi từng module

#### Tab Kế hoạch dự án

| Thay đổi | Chi tiết |
|---|---|
| **WBS matching** | Bỏ `TimelineStep` — chỉ dùng `MonthlyPlanItemID` + `StepCode` |
| **Nhóm giai đoạn** | Dùng `phase` thay `group_name` |
| **Form tạo task** | Giữ `start_date`, `due_date` — user điền, validate ≤ due_date của bước |
| **Hiển thị bước** | Ngày của bước lấy từ `monthly_plan_items.start_date / due_date` |

#### Tab KH tháng

| Thay đổi | Chi tiết |
|---|---|
| **"Sinh từ KH khung"** | Gọi RPC `seed_monthly_from_annual` — tạo MPI từ annual items |
| **"Sinh từ dự án"** | Gọi `schedule_project_steps_to_month` — đã hoạt động |
| **"Tạo thẳng"** | Tạo `monthly_plan_items` mới không cần KH năm (`source_type = 'manual'`) |
| **Thêm task vào mục** | Tạo task với `monthly_plan_item_id` = mục đang chọn |

#### Tab Công việc

| Thay đổi | Chi tiết |
|---|---|
| **Form tạo task** | Giữ `StartDate`/`DueDate` — user điền bình thường |
| **Hiển thị** | Nếu task gắn bước → show tên bước (join `monthly_plan_items`) |
| **Bỏ `TimelineStep`** | Không còn hiển thị / filter theo `workflow_node_id` |

#### `ProjectTaskModal` — Form tạo/sửa task

| Field | Trạng thái | Ghi chú |
|---|---|---|
| `StartDate` | ✅ Giữ | User điền ngày bắt đầu task |
| `DueDate` | ✅ Giữ | User điền hạn task |
| `DurationDays` | ✅ Giữ | Tự tính hoặc user nhập |
| `ActualStartDate` | ✅ Giữ | Tự động |
| `ActualEndDate` | ✅ Giữ | Tự động |
| ~~`WorkflowID`~~ | ❌ Xóa | |
| ~~`WorkflowNodeID`~~ | ❌ Xóa | |
| ~~`TimelineStep`~~ | ❌ Xóa | Alias của `WorkflowNodeID` |
| Validation mới | 🆕 Thêm | `task.due_date ≤ step.due_date` (cảnh báo, không block) |

#### Gantt Chart

| Thay đổi | Chi tiết |
|---|---|
| **Ngày task** | Lấy từ `tasks.start_date / due_date` (giữ nguyên vì task vẫn có ngày) |
| **Ngày bước** | Lấy từ `monthly_plan_items.start_date / due_date` |
| **Matching** | Dùng `isTaskInStep` mới (không có TimelineStep) |

### 4.3 Hooks cần cập nhật

| Hook | Thay đổi |
|---|---|
| `useStepAggregates` | Bỏ TimelineStep matching trong `isTaskInStep` |
| `useWorkflowTasks` | Không select `workflow_id`, `workflow_node_id` từ tasks |
| `useMonthlyPlan` | Bỏ `group_name` khỏi state/display |
| `useProjectSteps` | Không thay đổi |

---

## 5. Thứ tự thực thi

### Phase 1 — Database Migration ✅

```
[x] 1a. DROP tasks.workflow_id, tasks.workflow_node_id
[x] 1b. DROP monthly_plan_items.group_name
[x] 1c. ADD annual_plan_items.project_step_id (FK → monthly_plan_items)
[x] 1d. Backfill annual_plan_items.project_step_id — N/A (data hiện tại chưa có link)
[x] 1e. Verify: không còn cột bị xóa trong schema ✅
```

### Phase 2 — TypeScript & Mappers ✅

```
[x] 2a. types/task.types.ts — xóa WorkflowID, WorkflowNodeID, TimelineStep
[x] 2b. types/plan.types.ts — xóa group_name (MonthlyPlanItem), thêm project_step_id (AnnualPlanItem)
[x] 2c. services/task/helpers.ts (DbTask) — xóa workflow_id, workflow_node_id
[x] 2d. lib/mappers/workflowTaskMappers.ts — xóa TimelineStep mapping, xóa workflow_node_id insert
[x] 2e. Chạy tsc — 0 errors ✅
```

### Phase 3 — Services & Business Logic ✅

```
[x] 3a. lib/progressCalculator.ts — isTaskInStep bỏ TimelineStep, chỉ còn MonthlyPlanItemID + StepCode
[x] 3b. services/ProjectStepsService.ts — createFromCustomPlan không insert workflow_id/node_id vào tasks, bỏ group_name
[x] 3c. services/TaskService.ts — không cần thay đổi (delegates to sub-modules)
[x] 3d. services/PlanService.ts — xóa group_name trong seedFromAnnualPlan + seedFromProjectTasks
[x] 3e. Tạo RPC seed_monthly_from_annual trên Supabase ✅
```

### Phase 4 — Frontend Components ✅

```
[x] 4a. ProjectTaskModal — xóa TimelineStep, thay bằng StepCode
[x] 4b. ProjectPlanWBSView — dùng isTaskInStep (không còn TimelineStep)
[x] 4c. MonthlyPlanPage/Detail — dùng source_type thay group_name để nhóm
[x] 4d. ProjectGanttChart, StepDetailModal — matching mới (MonthlyPlanItemID + StepCode)
[x] 4e. Tab KH tháng — seedFromAnnualPlan gọi RPC seed_monthly_from_annual
[x] 4f. schemas/monthlyPlan.schema.ts — xóa group_name, group_sort_order
```

### Phase 5 — Kiểm thử

```
[ ] 5a. Tạo KH dự án từ quy trình → bước hiển thị đúng
[ ] 5b. Thêm task vào bước → task.monthly_plan_item_id đúng
[ ] 5c. Task có start_date/due_date riêng, tiến độ bước tính đúng
[ ] 5d. Lên KH tháng từ bước dự án → schedule_state chuyển đúng
[ ] 5e. Tạo KH tháng trực tiếp (không qua KH năm) → hoạt động
[ ] 5f. Sinh KH tháng từ KH khung → RPC hoạt động đúng
[ ] 5g. Báo cáo tháng → trạng thái bước cập nhật đúng
```

---

## Tóm tắt quyết định đã xác nhận

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Task có `duration_days` riêng? | ✅ Có — mỗi task có thể có thời lượng khác bước |
| 2 | Task có `start_date`/`due_date`? | ✅ Có — user điền khi tạo task, nằm trong khung bước |
| 3 | KH năm có bắt buộc? | ✅ Không — KH tháng có thể tạo trực tiếp (phát sinh) |
| 4 | Bước → KH tháng: copy hay update? | ✅ Update `schedule_state` — không tạo row mới |
| 5 | `annual_plan_items.project_step_id`? | ✅ Cần thiết — link trực tiếp KH năm với bước dự án |

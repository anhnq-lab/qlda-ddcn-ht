# Tài liệu Database — Hệ thống QLDA DDCN-HT

> **Trạng thái:** Bản nháp — chỉnh sửa trước khi thực thi code  
> **Cập nhật:** 2026-05-23

---

## Mục lục

1. [Sơ đồ tổng thể](#1-sơ-đồ-tổng-thể)
2. [Bảng `tasks` — Công việc](#2-bảng-tasks--công-việc)
3. [Bảng `monthly_plan_items` — Bước KH / Mục KH tháng](#3-bảng-monthly_plan_items--bước-kh--mục-kh-tháng)
4. [Bảng `monthly_plans` — Header Kế hoạch tháng](#4-bảng-monthly_plans--header-kế-hoạch-tháng)
5. [Bảng `annual_plan_items` — KH Khung năm](#5-bảng-annual_plan_items--kh-khung-năm)
6. [Bảng `workflows` + `workflow_nodes` — Quy trình mẫu](#6-bảng-workflows--workflow_nodes--quy-trình-mẫu)
7. [Quan hệ giữa các bảng](#7-quan-hệ-giữa-các-bảng)
8. [Vai trò từng module](#8-vai-trò-từng-module)
9. [Dòng chảy nghiệp vụ điển hình](#9-dòng-chảy-nghiệp-vụ-điển-hình)

---

## 1. Sơ đồ tổng thể

```
workflows ──────────────► workflow_nodes
    │                          │
    │  (tạo KH tổng thể)       │ (template bước)
    ▼                          ▼
workflow_instances       monthly_plan_items ◄────── annual_plan_items
    │                          │  (schedule_state)
    │                    ┌─────┤
    │                    │     │
    ▼                    ▼     ▼
  projects ◄─────── tasks   monthly_plans
                (monthly_plan_item_id)  (header tháng/phòng)
```

---

## 2. Bảng `tasks` — Công việc

> Bảng trung tâm — tất cả module đều đọc/ghi vào đây.

| Cột (DB) | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã công việc | uuid | Khóa chính, tự sinh |
| `task_type` | Loại công việc | enum | `project` = dự án · `internal` = nội bộ · `management` = điều hành |
| `project_id` | Mã dự án | text | FK → `projects` · NULL = không thuộc dự án |
| `title` | Tiêu đề | varchar | NOT NULL |
| `description` | Mô tả | text | |
| `status` | Trạng thái | enum | `todo` · `in_progress` · `done` · `incomplete` · `review` |
| `priority` | Độ ưu tiên | enum | `low` · `medium` · `high` · `urgent` |
| `progress` | Tiến độ % | int | 0–100, cập nhật thủ công |
| `assignee_id` | Người thực hiện | text | FK → nhân viên |
| `approver_id` | Người phê duyệt | text | FK → nhân viên |
| `collaborator_ids` | Người phối hợp | uuid[] | Mảng ID nhân viên |
| `actual_start_date` | Ngày bắt đầu thực tế | date | Tự động điền khi chuyển sang `in_progress` |
| `actual_end_date` | Ngày hoàn thành thực tế | date | Tự động điền khi chuyển sang `done` |
| `duration_days` | Thời lượng (ngày) | int | |
| `phase` | Giai đoạn | varchar | `preparation` · `execution` · `completion` |
| `step_code` | Mã bước | varchar | Mã ngắn semantic (VD: `2.1`, `IMPL_DESIGN`) |
| `sort_order` | Thứ tự hiển thị | int | |
| `estimated_cost` | Chi phí dự kiến | numeric | |
| `actual_cost` | Chi phí thực tế | numeric | |
| `legal_basis` | Căn cứ pháp lý | text | VD: "Điều 4 NĐ 175/2024" |
| `output_document` | Sản phẩm đầu ra | text | VD: "Quyết định phê duyệt" |
| `predecessor_task_id` | Công việc tiền nhiệm | uuid | FK → `tasks.id` (dependency) |
| `responsibility_level` | Cấp trách nhiệm | text | `individual` = cá nhân · `team` = phòng |
| `parent_id` | Công việc cha | uuid | FK → `tasks.id` (nếu dùng cây task) |
| **`monthly_plan_item_id`** | **ID bước KH dự án** | **uuid** | **FK → `monthly_plan_items.id` · Liên kết chính xác nhất** |
| `metadata` | Dữ liệu mở rộng | jsonb | Lưu: `assignee_role`, `ui_status`, `attachments`, `is_wbs`... |
| `created_by` | Người tạo | uuid | |
| `created_at` | Thời điểm tạo | timestamptz | |
| `updated_at` | Thời điểm cập nhật | timestamptz | |

### Cột bị xóa khỏi `tasks`

| Cột | Lý do bỏ |
|---|---|
| ~~`start_date`~~ | → Chuyển sang `monthly_plan_items.start_date` (quản lý ở cấp bước) |
| ~~`due_date`~~ | → Chuyển sang `monthly_plan_items.due_date` |
| ~~`workflow_id`~~ | → Không cần liên kết trực tiếp tới quy trình từ task |
| ~~`workflow_node_id`~~ | → Thay bằng `monthly_plan_item_id` làm FK chính |

### Enums của `tasks`

**`task_type`**
- `project` — Công việc thuộc dự án đầu tư xây dựng
- `internal` — Công việc nội bộ phòng ban
- `management` — Công việc điều hành (Ban lãnh đạo)

**`status`**
- `todo` — Chưa bắt đầu
- `in_progress` — Đang thực hiện
- `done` — Hoàn thành
- `incomplete` — Chưa hoàn thành (quá hạn)
- `review` — Chờ review *(legacy, ẩn trên UI)*

---

## 3. Bảng `monthly_plan_items` — Bước KH / Mục KH tháng

> Bảng phức tạp nhất — phục vụ **2 mục đích** qua cột `schedule_state`.

| Cột (DB) | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã bước | uuid | Khóa chính |
| **`schedule_state`** | **Trạng thái lập lịch** | text | **`project_step`** = bước dự án chưa lên KH tháng · **`monthly_plan`** = đã vào KH tháng |
| `monthly_plan_id` | Thuộc KH tháng nào | uuid | FK → `monthly_plans.id` · NULL khi `schedule_state = 'project_step'` |
| `project_id` | Thuộc dự án nào | text | FK → `projects` |
| `annual_plan_item_id` | Link KH khung năm | uuid | FK → `annual_plan_items.id` |
| `task_name` | Tên bước / nhiệm vụ | text | NOT NULL |
| `deliverable` | Sản phẩm đầu ra | text | |
| `phase` | Giai đoạn | text | `preparation` · `execution` · `completion` |
| `step_code` | Mã bước semantic | text | Dùng để match legacy tasks qua `step_code` |
| `step_order` | Thứ tự bước | int | Sắp xếp hiển thị trong WBS |
| `workflow_node_id` | Bước quy trình gốc | uuid | FK → `workflow_nodes.id` (bước template gốc) |
| `workflow_id` | Quy trình gốc | uuid | FK → `workflows.id` |
| `start_date` | Ngày bắt đầu | date | Ngày bắt đầu bước (tính ở cấp bước, không ở task) |
| `due_date` | Hạn hoàn thành | date | |
| `duration_days` | Thời lượng (ngày) | int | |
| `assignee_role` | Vai trò phụ trách | text | VD: `QLDA1`, `KTTD` |
| `legal_basis` | Căn cứ pháp lý | text | |
| `output_document` | Sản phẩm đầu ra | text | |
| `status` | Kết quả thực hiện | enum | `planned` · `completed` · `incomplete` · `partial` · `deferred` |
| `completion_result` | Kết quả cụ thể | text | Mô tả kết quả khi báo cáo |
| `incomplete_reason` | Lý do chưa hoàn thành | text | |
| `deferred_to_plan_id` | Chuyển sang KH tháng | uuid | FK → `monthly_plans.id` |
| `source_type` | Nguồn gốc tạo | text | `manual` · `from_annual` · `from_project_task` · `project_step` |
| `scheduled_at` | Thời điểm lên KH tháng | timestamptz | Ghi khi chuyển từ `project_step` → `monthly_plan` |
| `collaborating_dept_codes` | Phòng phối hợp | varchar(20)[] | Mảng mã phòng |
| `collaborating_text` | Ghi chú phối hợp | text | |
| `notes` | Ghi chú | text | |
| `sort_order` | Thứ tự (legacy) | int | Dùng `step_order` ưu tiên |
| `created_by` | Người tạo | uuid | |
| `created_at` | Thời điểm tạo | timestamptz | |
| `updated_at` | Thời điểm cập nhật | timestamptz | |

### Cột bị xóa khỏi `monthly_plan_items`

| Cột | Lý do bỏ |
|---|---|
| ~~`group_name`~~ | → Thay bằng `phase` để nhóm giai đoạn (preparation / execution / completion) |

### Ý nghĩa `schedule_state`

```
schedule_state = 'project_step'
  ┌─ Hiện trong: Tab Kế hoạch dự án
  ├─ monthly_plan_id = NULL
  ├─ Chưa lên lịch tháng nào
  └─ N tasks con (qua tasks.monthly_plan_item_id)

schedule_state = 'monthly_plan'
  ┌─ Hiện trong: Tab Kế hoạch dự án + Tab Kế hoạch tháng
  ├─ monthly_plan_id ≠ NULL (đã vào tháng cụ thể)
  ├─ scheduled_at = thời điểm được lên lịch
  └─ N tasks con vẫn giữ nguyên
```

---

## 4. Bảng `monthly_plans` — Header Kế hoạch tháng

> Mỗi phòng mỗi tháng có 1 bản kế hoạch (tự động tạo nếu chưa có).

| Cột (DB) | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã KH tháng | uuid | Khóa chính |
| `plan_month` | Tháng | int | 1–12 |
| `plan_year` | Năm | int | |
| `department_code` | Mã phòng | varchar | `HCTH` · `KHDT` · `KTTD` · `QLDA1` · `QLDA2` · `QLDA3` · `PTDV` · `TCKT` |
| `department_name` | Tên phòng đầy đủ | varchar | VD: "Phòng Kỹ thuật - Thẩm định" |
| `status` | Trạng thái bản KH | enum | `draft` · `published` · `closed` |
| `notes` | Ghi chú | text | |
| `created_by` | Người tạo | uuid | |
| `created_at` | Thời điểm tạo | timestamptz | |
| `updated_at` | Thời điểm cập nhật | timestamptz | |

**Unique constraint:** `(plan_month, plan_year, department_code)` — mỗi phòng mỗi tháng chỉ có 1 bản KH.

---

## 5. Bảng `annual_plan_items` — KH Khung năm

> Nhiệm vụ thường xuyên / theo năm của từng phòng, không nhất thiết gắn dự án.

| Cột (DB) | Tên tiếng Việt | Kiểu | Ghi chú |
|---|---|---|---|
| `id` | Mã nhiệm vụ | uuid | Khóa chính |
| `plan_year` | Năm kế hoạch | int | |
| `department_code` | Phòng chủ trì | varchar | |
| `department_name` | Tên phòng | varchar | |
| `group_name` | Nhóm nhiệm vụ | varchar | VD: "Công tác đấu thầu", "Quản lý dự án" |
| `group_sort_order` | Thứ tự nhóm | int | |
| `task_name` | Tên nhiệm vụ | text | NOT NULL |
| `deliverable` | Sản phẩm đầu ra | text | |
| `start_period` | Thời điểm bắt đầu | varchar | VD: "Quý I", "Tháng 4", "Hàng tháng" |
| `end_period` | Thời điểm kết thúc | varchar | |
| `frequency` | Tần suất | enum | `one_time` · `monthly` · `quarterly` · `daily` · `as_needed` |
| `project_id` | Link dự án | text | Nullable — nếu nhiệm vụ gắn với 1 dự án cụ thể |
| `collaborating_dept_codes` | Phòng phối hợp | varchar[] | |
| `collaborating_text` | Ghi chú phối hợp | text | |
| `notes` | Ghi chú | text | |
| `sort_order` | Thứ tự | int | |
| `source_type` | Nguồn gốc | text | `manual` · `from_project_task` |
| `created_by` | Người tạo | uuid | |
| `created_at` | Thời điểm tạo | timestamptz | |
| `updated_at` | Thời điểm cập nhật | timestamptz | |

**Enums `frequency`:**
- `one_time` — Một lần trong năm
- `monthly` — Hàng tháng
- `quarterly` — Hàng quý
- `daily` — Hàng ngày
- `as_needed` — Khi phát sinh

---

## 6. Bảng `workflows` + `workflow_nodes` — Quy trình mẫu

> ⚠️ **Chỉ đọc tại runtime** — chỉ Admin mới chỉnh sửa template.

### `workflows` — Quy trình mẫu

| Cột (DB) | Tên tiếng Việt | Ghi chú |
|---|---|---|
| `id` | Mã quy trình | uuid |
| `code` | Mã ngắn | VD: `DECREE_175_GROUP_C`, `DECREE_175_GROUP_A` |
| `name` | Tên quy trình | VD: "Quy trình đầu tư xây dựng Nhóm C" |
| `description` | Mô tả | |
| `category` | Loại | `project` · `procurement` · `finance` · `hr`... |
| `version` | Phiên bản | int |
| `is_active` | Đang áp dụng | bool |

### `workflow_nodes` — Bước trong quy trình

| Cột (DB) | Tên tiếng Việt | Ghi chú |
|---|---|---|
| `id` | Mã bước | uuid |
| `workflow_id` | Thuộc quy trình | FK → `workflows.id` |
| `name` | Tên bước | VD: "Lập, thẩm định, phê duyệt BCNCKT" |
| `type` | Loại nút | `start` · `end` · `approval` · `input` · `automated` |
| `assignee_role` | Vai trò thực hiện | VD: "KTTD", "QLDA1" |
| `sla_formula` | Công thức SLA | VD: `+30d`, `+15wd` |
| `sort_order` | Thứ tự | int |
| `is_deleted` | Đã xóa mềm | bool |
| `metadata.phase` | Giai đoạn | `preparation` · `execution` · `completion` |
| `metadata.sub_process` | Nhóm con trong giai đoạn | VD: "I.1. Lập chủ trương" |
| `metadata.sub_tasks` | Danh sách việc con template | JSON array |
| `metadata.legal_basis` | Căn cứ pháp lý | VD: "Điều 52 Luật Xây dựng" |
| `metadata.output` | Sản phẩm đầu ra | VD: "Tờ trình phê duyệt" |

### `workflow_instances` — Thực thể quy trình đã kích hoạt

| Cột (DB) | Tên tiếng Việt | Ghi chú |
|---|---|---|
| `id` | Mã instance | uuid |
| `workflow_id` | Theo quy trình nào | FK → `workflows.id` |
| `reference_id` | Đối tượng áp dụng | VD: `project_id` |
| `reference_type` | Loại đối tượng | VD: `project` |
| `status` | Trạng thái | `in_progress` · `completed` |
| `started_at` | Thời điểm bắt đầu | |

---

## 7. Quan hệ giữa các bảng

### Sơ đồ chi tiết

```
annual_plan_items
    │ annual_plan_item_id (nullable)
    ▼
monthly_plan_items ◄────────────────── workflows / workflow_nodes
    │  schedule_state                       (workflow_id, workflow_node_id)
    │
    ├── [project_step]  → project_id → projects
    │       │
    │       │ 1 bước : N công việc
    │       ▼
    │     tasks (monthly_plan_item_id = step.id)
    │
    └── [monthly_plan]  → monthly_plan_id → monthly_plans
            │                                    │
            │                                    ├─ plan_month
            │                                    ├─ plan_year
            │                                    └─ department_code
            │
            └─ vẫn có tasks con (qua monthly_plan_item_id)
```

### Bảng quan hệ

| Từ | Đến | Loại | Cột FK |
|---|---|---|---|
| `tasks` | `monthly_plan_items` | N:1 | `tasks.monthly_plan_item_id` → `monthly_plan_items.id` |
| `tasks` | `projects` | N:1 | `tasks.project_id` |
| `monthly_plan_items` | `monthly_plans` | N:1 | `monthly_plan_items.monthly_plan_id` |
| `monthly_plan_items` | `projects` | N:1 | `monthly_plan_items.project_id` |
| `monthly_plan_items` | `annual_plan_items` | N:1 | `monthly_plan_items.annual_plan_item_id` |
| `monthly_plan_items` | `workflow_nodes` | N:1 | `monthly_plan_items.workflow_node_id` |
| `workflow_nodes` | `workflows` | N:1 | `workflow_nodes.workflow_id` |
| `workflow_instances` | `workflows` | N:1 | `workflow_instances.workflow_id` |
| `annual_plan_items` | `projects` | N:1 | `annual_plan_items.project_id` |

### FK Constraint quan trọng

```sql
-- tasks → monthly_plan_items: SET NULL (không cascade xóa tasks)
tasks.monthly_plan_item_id → monthly_plan_items.id ON DELETE SET NULL

-- Khi xóa 1 bước (monthly_plan_items), tasks con giữ nguyên
-- nhưng monthly_plan_item_id = NULL (mồ côi)
-- → Service phải xóa tasks TRƯỚC khi xóa bước
```

---

## 8. Vai trò từng module

| Module | Bảng đọc chính | Bảng ghi | Điều kiện lọc |
|---|---|---|---|
| **Tab Kế hoạch dự án** | `monthly_plan_items` · `tasks` | `monthly_plan_items` · `tasks` | `project_id = X` (mọi `schedule_state`) |
| **Tab Tiến độ (Tổng quan)** | `tasks` | — | `project_id = X` |
| **Tab Công việc** | `tasks` | `tasks` | Không lọc dự án (xem tất cả) |
| **Tab KH năm** | `annual_plan_items` | `annual_plan_items` | `plan_year = Y` · `department_code = D` |
| **Tab KH tháng** | `monthly_plan_items` · `monthly_plans` | `monthly_plan_items` · `monthly_plans` | `monthly_plan_id IS NOT NULL` · `plan_month/year/dept` |
| **Module Quy trình** | `workflows` · `workflow_nodes` | *(chỉ admin)* | `is_active = true` |

---

## 9. Dòng chảy nghiệp vụ điển hình

### 9.1 Tạo kế hoạch dự án mới

```
1. Admin chọn quy trình (workflows) phù hợp với nhóm dự án (A/B/C)
        ↓
2. Hệ thống đọc workflow_nodes → tạo hàng loạt:
   - monthly_plan_items (schedule_state = 'project_step', monthly_plan_id = NULL)
   - tasks (task_type = 'project', monthly_plan_item_id = step.id)
        ↓
3. Tab Kế hoạch dự án hiển thị WBS (đọc monthly_plan_items theo project_id)
   - Tính tiến độ bước = trung bình progress của tasks con
   - Tính tiến độ giai đoạn = trung bình progress của các bước
```

### 9.2 Lên lịch tháng

```
4. Cuối tháng, QLDA chọn các bước cần thực hiện trong tháng X
        ↓
5. Gọi RPC schedule_project_steps_to_month(step_ids, monthly_plan_id):
   - monthly_plan_items.schedule_state = 'monthly_plan'
   - monthly_plan_items.monthly_plan_id = monthly_plans.id
   - monthly_plan_items.scheduled_at = NOW()
        ↓
6. Tab KH tháng hiển thị các bước đã lên lịch (lọc theo monthly_plan_id)
```

### 9.3 Báo cáo tháng

```
7. Cuối tháng: cập nhật monthly_plan_items.status
   - 'completed' → Hoàn thành
   - 'incomplete' → Chưa hoàn thành (kèm incomplete_reason)
   - 'partial' → Hoàn thành một phần (kèm completion_result)
   - 'deferred' → Chuyển sang tháng sau (kèm deferred_to_plan_id)
```

### 9.4 Gỡ lịch (nếu cần)

```
8. Gọi RPC unschedule_steps(step_ids):
   - monthly_plan_items.schedule_state = 'project_step'
   - monthly_plan_items.monthly_plan_id = NULL
   - monthly_plan_items.scheduled_at = NULL
```

---

## Ghi chú kỹ thuật

### Thuật toán match task vào bước (`isTaskInStep`)

Ưu tiên theo thứ tự:
1. **FK match** (chính xác): `task.monthly_plan_item_id === step.id`
2. **Step code fallback**: `task.step_code === step.step_code` (case-insensitive)

### Các cột `metadata` trong `tasks` (jsonb)

| Key | Ý nghĩa |
|---|---|
| `assignee_role` | Mã phòng phụ trách (khi assignee là phòng, không phải người) |
| `ui_status` | Trạng thái UI gốc (lưu để restore khi reload) |
| `is_wbs` | `true` nếu task được tạo từ WBS workflow |
| `attachments` | Danh sách file đính kèm |
| `dependencies` | Các task phụ thuộc |

---

*Tài liệu này mô tả trạng thái sau migration ngày 2026-05-23. Cần cập nhật lại sau mỗi lần thay đổi schema.*

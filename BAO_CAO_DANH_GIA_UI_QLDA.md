# BÁO CÁO ĐÁNH GIÁ UI MODULE QUẢN LÝ DỰ ÁN

> Ngày rà soát: 06/06/2026
> Phạm vi: Toàn bộ UI chi tiết dự án (`ProjectDetail`) — 11 tab chức năng
> Phương pháp: Đọc source code component, truy vết mapper, hook, service → database table/column

---

## MỤC LỤC

1. [Tổng quan kiến trúc dữ liệu](#1-tổng-quan-kiến-trúc-dữ-liệu)
2. [Tab TỔNG QUAN (ProjectInfoTab)](#2-tab-tổng-quan)
3. [Tab KẾ HOẠCH (ProjectPlanTab)](#3-tab-kế-hoạch)
4. [Tab GÓI THẦU (ProjectPackagesTab)](#4-tab-gói-thầu)
5. [Tab THI CÔNG (ProjectConstructionTab)](#5-tab-thi-công)
6. [Tab VỐN & GIẢI NGÂN (ProjectCapitalTab)](#6-tab-vốn--giải-ngân)
7. [Tab THANH TRA (ProjectInspectionTab)](#7-tab-thanh-tra)
8. [Tab QUYẾT TOÁN (ProjectSettlementTab)](#8-tab-quyết-toán)
9. [Tab QUY TRÌNH (ProjectWorkflowTab)](#9-tab-quy-trình)
10. [Tab GPMB (ProjectClearanceTab)](#10-tab-gpmb)
11. [Tab HỒ SƠ (ProjectDocumentsTab)](#11-tab-hồ-sơ)
12. [Tab ĐỒNG BỘ CSDL / TT24 (ProjectComplianceTab)](#12-tab-đồng-bộ-csdl)
13. [Tổng hợp phân loại](#13-tổng-hợp-phân-loại)

---

## 1. Tổng quan kiến trúc dữ liệu

### Luồng dữ liệu

```
Supabase (PostgreSQL)
  └─ projects (92 cột)          ← Bảng chính
  └─ bidding_packages            ← Gói thầu
  └─ contracts                   ← Hợp đồng
  └─ contractors                 ← Nhà thầu
  └─ capital_plans               ← Kế hoạch vốn
  └─ disbursements               ← Giải ngân
  └─ disbursement_plans          ← KH giải ngân theo tháng
  └─ payments                    ← Thanh toán
  └─ tasks                       ← Công việc/kế hoạch
  └─ workflow_instances          ← Phiên quy trình
  └─ workflow_tasks              ← Bước quy trình
  └─ construction_logs           ← Nhật ký thi công
  └─ construction_log_details    ← Chi tiết hạng mục
  └─ construction_manpower       ← Nhân lực thi công
  └─ construction_equipment      ← Máy móc thiết bị
  └─ construction_progress       ← Tiến độ nhà thầu (WBS)
  └─ construction_photos         ← Ảnh công trường
  └─ construction_kpis           ← KPI thi công (materialized)
  └─ inspections                 ← Thanh tra / kiểm tra
  └─ documents / cde_documents   ← Hồ sơ tài liệu
  └─ project_members             ← Thành viên dự án
  └─ employees                   ← Danh bạ nhân sự
        │
        ▼
  Mapper: dbToProject() (snake_case → PascalCase)
        │
        ▼
  React Component (hiển thị trên UI)
```

### Quy ước trong báo cáo

| Ký hiệu | Ý nghĩa |
|----------|----------|
| 📝 NHẬP LIỆU | Người dùng nhập thủ công qua form |
| 🔄 TỰ TÍNH TOÁN | Hệ thống tự tính từ dữ liệu khác |
| 📊 TỔNG HỢP | Aggregate/query từ nhiều bảng |
| 🌐 API NGOÀI | Lấy từ API bên ngoài (Open-Meteo, v.v.) |
| 📋 ENUM/HẰNG SỐ | Giá trị cố định trong code |

---

## 2. Tab TỔNG QUAN

**Component:** `ProjectInfoTab.tsx`
**Nguồn dữ liệu chính:** Bảng `projects`

### 2.1 Section: Thông tin dự án

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Mã dự án | `project_number` hoặc `project_id` | `projects` | 📝 NHẬP LIỆU |
| Nhóm dự án | `group_code` | `projects` | 📝 NHẬP LIỆU |
| Chuyên ngành | `specialty_type` | `projects` | 📝 NHẬP LIỆU |
| Chi tiết chuyên ngành | `specialty_details` | `projects` | 📝 NHẬP LIỆU |
| Địa điểm | `location_code` | `projects` | 📝 NHẬP LIỆU |
| Thời gian thực hiện | `duration` | `projects` | 📝 NHẬP LIỆU |
| Hình thức quản lý | `management_form` | `projects` | 📝 NHẬP LIỆU |
| Nguồn vốn | `capital_source` | `projects` | 📝 NHẬP LIỆU |
| Mục tiêu đầu tư | `objective` | `projects` | 📝 NHẬP LIỆU |
| Tóm tắt quy mô đầu tư | `investment_scale` | `projects` | 📝 NHẬP LIỆU |
| Nhãn chuyên ngành (hiển thị) | — | — | 📋 ENUM/HẰNG SỐ (map trong code) |

### 2.2 Section: Quy mô công trình

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tổng dự toán | `total_estimate` | `projects` | 📝 NHẬP LIỆU |
| Diện tích khu đất | `site_area` | `projects` | 📝 NHẬP LIỆU |
| DT xây dựng | `construction_area` | `projects` | 📝 NHẬP LIỆU |
| DT sàn sử dụng | `floor_area` | `projects` | 📝 NHẬP LIỆU |
| Chiều cao | `building_height` | `projects` | 📝 NHẬP LIỆU |
| Mật độ XD | `building_density` | `projects` | 📝 NHẬP LIỆU |
| Hệ số SDĐ | `land_use_coefficient` | `projects` | 📝 NHẬP LIỆU |
| Tầng nổi | `above_ground_floors` | `projects` | 📝 NHẬP LIỆU |
| Tầng hầm | `basement_floors` | `projects` | 📝 NHẬP LIỆU |

### 2.3 Section: Lifecycle Stepper (Giai đoạn dự án)

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Giai đoạn hiện tại | `stage` | `projects` | 📝 NHẬP LIỆU |
| Lịch sử giai đoạn | `stage_history` (JSONB) | `projects` | 📝 NHẬP LIỆU |
| Màu giai đoạn | — | — | 📋 ENUM/HẰNG SỐ (`PROJECT_PHASE_COLORS`) |

### 2.4 Section: Tiến độ giải ngân (BudgetVarianceCard)

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Tổng mức đầu tư | `total_investment` | `projects` | 📝 NHẬP LIỆU |
| Đã giải ngân | `SUM(amount)` WHERE status='Approved' | `disbursements` | 🔄 TỰ TÍNH TOÁN (aggregate) |
| Lũy kế nghiệm thu | `SUM(luy_ke_nghiem_thu)` | `disbursements` | 📊 TỔNG HỢP |
| KH giải ngân năm | `SUM(amount)` WHERE plan_type='annual' & year=current | `capital_plans` | 📊 TỔNG HỢP |
| Giải ngân tháng trước | Filter disbursements by prev month | `disbursements` | 🔄 TỰ TÍNH TOÁN |
| Tỷ lệ giải ngân (%) | disbursed / totalInvestment × 100 | — | 🔄 TỰ TÍNH TOÁN |

### 2.5 Section: Tiến độ dự án (Progress)

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Tiến độ vật lý (%) | AVG(progress) từ tasks của dự án | `tasks` | 🔄 TỰ TÍNH TOÁN |
| Tiến độ thi công (%) | = tiến độ vật lý (fallback) | `tasks` | 🔄 TỰ TÍNH TOÁN |
| Fallback nếu không có tasks | `physical_progress` hoặc `progress` | `projects` | 📝 NHẬP LIỆU |

### 2.6 Section: Thông tin bàn giao & Tiếp nhận

| Trường UI | DB Column / JSONB path | DB Table | Loại |
|-----------|------------------------|----------|------|
| Chủ đầu tư cũ | `old_investor` | `projects` | 📝 NHẬP LIỆU |
| Cấp QĐ trước bàn giao | `decision_level_before_handover` | `projects` | 📝 NHẬP LIỆU |
| QĐ bàn giao | `transfer_decision` | `projects` | 📝 NHẬP LIỆU |
| Ngày bàn giao | `project_management.thoi_diem_ban_giao` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Đơn vị tiếp nhận | `project_management.ban_tiep_nhan` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Hồ sơ bàn giao | `project_management.ho_so_ban_giao` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Giá trị KL bàn giao | `project_management.gia_tri_khoi_luong_ban_giao` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Trạng thái QT (mốc 30/6) | `project_status_info.tinh_trang_quyet_toan_den_30_6_2025` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Công nợ (mốc 30/6) | `project_status_info.cong_no_den_30_6_2025` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Trạng thái QT (sau bàn giao) | `project_status_info.tinh_trang_quyet_toan_sau_ban_giao` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Công nợ sau bàn giao | `project_status_info.cong_no_sau_ban_giao` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Tồn tại vướng mắc | `project_status_info.ton_tai_vuong_mac_ban_giao` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Hạn hoàn thành | `project_status_info.cham_tien_do.thoi_gian_hoan_thanh` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Thời gian chậm | `project_status_info.cham_tien_do.thoi_gian_cham` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Nguyên nhân chậm | `project_status_info.cham_tien_do.nguyen_nhan` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Biện pháp đã áp dụng | `project_status_info.cham_tien_do.bien_phap_da_ap_dung` | `projects` (JSONB) | 📝 NHẬP LIỆU |
| Kiến nghị | `project_status_info.cham_tien_do.kien_nghi_de_xuat` | `projects` (JSONB) | 📝 NHẬP LIỆU |

### 2.7 Section: Gantt Chart (Tiến độ thực hiện)

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Danh sách tasks + ngày bắt đầu/kết thúc | `title`, `start_date`, `due_date`, `status`, `progress` | `tasks` | 📝 NHẬP LIỆU (tasks) |
| Thanh Gantt (vị trí, độ dài) | Tính từ start_date, due_date | — | 🔄 TỰ TÍNH TOÁN |

### 2.8 Section: Key Dates (Mốc thời gian quan trọng)

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Tasks quá hạn | `due_date < now()` AND status ≠ Done | `tasks` | 🔄 TỰ TÍNH TOÁN (query filter) |
| Tasks sắp đến hạn | `due_date` trong 90 ngày tới | `tasks` | 🔄 TỰ TÍNH TOÁN |
| Ngày kết thúc hợp đồng | `end_date` WHERE status=1 | `contracts` | 📝 NHẬP LIỆU (contract) |
| Thanh toán chờ duyệt | `request_date`, `status`, `amount` | `payments` | 📝 NHẬP LIỆU (payment) |
| Số ngày quá hạn / còn lại | now() − due_date | — | 🔄 TỰ TÍNH TOÁN |

### 2.9 Section: Nhà thầu dự án

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Tên nhà thầu | `full_name` | `contractors` | 📝 NHẬP LIỆU |
| MST | `tax_code` | `contractors` | 📝 NHẬP LIỆU |
| Địa chỉ | `address` | `contractors` | 📝 NHẬP LIỆU |
| Tên hợp đồng liên kết | `contract_name` | `contracts` | 📝 NHẬP LIỆU |
| Tên gói thầu liên kết | `package_name` | `bidding_packages` | 📝 NHẬP LIỆU |
| *Danh sách nhà thầu* | JOIN contracts → contractors | `contracts` + `contractors` | 📊 TỔNG HỢP |

### 2.10 Section: Đội ngũ dự án

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Danh sách thành viên | JOIN project_members → employees | `project_members` + `employees` | 📝 NHẬP LIỆU (gán thành viên) |
| Vai trò | `role` | `project_members` | 📝 NHẬP LIỆU |

---

## 3. Tab KẾ HOẠCH

**Component:** `ProjectPlanTab.tsx`
**Nguồn dữ liệu chính:** Bảng `tasks` + `workflow_instances` + `workflow_tasks`

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tên công việc | `title` | `tasks` | 📝 NHẬP LIỆU |
| Mô tả | `description` | `tasks` | 📝 NHẬP LIỆU |
| Ngày bắt đầu | `start_date` | `tasks` | 📝 NHẬP LIỆU |
| Hạn hoàn thành | `due_date` | `tasks` | 📝 NHẬP LIỆU |
| Trạng thái | `status` | `tasks` | 📝 NHẬP LIỆU |
| Tiến độ (%) | `progress` | `tasks` | 📝 NHẬP LIỆU |
| Người phụ trách | `assignee_id` → employees | `tasks` + `employees` | 📝 NHẬP LIỆU |
| Ưu tiên | `priority` | `tasks` | 📝 NHẬP LIỆU |
| Biểu đồ WBS / Gantt | Tính từ tasks | — | 🔄 TỰ TÍNH TOÁN |
| Tiến độ tổng (%) | AVG(progress) các tasks | — | 🔄 TỰ TÍNH TOÁN |

---

## 4. Tab GÓI THẦU

**Component:** `ProjectPackagesTab.tsx`
**Nguồn dữ liệu chính:** Bảng `bidding_packages`

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tên gói thầu | `package_name` | `bidding_packages` | 📝 NHẬP LIỆU |
| Mã gói thầu | `package_number` | `bidding_packages` | 📝 NHẬP LIỆU |
| Giá trị (VNĐ) | `price` | `bidding_packages` | 📝 NHẬP LIỆU |
| Giá trúng thầu | `winning_price` | `bidding_packages` | 📝 NHẬP LIỆU |
| Nhà thầu trúng thầu | `winning_contractor_id` → `contractors.full_name` | `bidding_packages` JOIN `contractors` | 📝 NHẬP LIỆU |
| % Thực hiện | `completion_pct` | `bidding_packages` | 📝 NHẬP LIỆU |
| Loại hợp đồng | `contract_type` | `bidding_packages` | 📝 NHẬP LIỆU |
| Trạng thái | `status` | `bidding_packages` | 📝 NHẬP LIỆU |
| Hình thức lựa chọn | `selection_method` | `bidding_packages` | 📝 NHẬP LIỆU |
| Loại đấu thầu | `bid_type` | `bidding_packages` | 📝 NHẬP LIỆU |
| Thời gian thực hiện | `duration` | `bidding_packages` | 📝 NHẬP LIỆU |
| Nguồn vốn | `funding_source` | `bidding_packages` | 📝 NHẬP LIỆU |
| Ngày đăng tải | `posting_date` | `bidding_packages` | 📝 NHẬP LIỆU |
| Ngày đóng/mở thầu | `bid_closing_date`, `bid_opening_date` | `bidding_packages` | 📝 NHẬP LIỆU |
| Ngày phê duyệt kết quả | `approval_date_result` | `bidding_packages` | 📝 NHẬP LIỆU |
| Số QĐ phê duyệt KHLCNT | `decision_number`, `decision_date` | `bidding_packages` | 📝 NHẬP LIỆU |
| Link Muasamcong | `msc_package_link` | `bidding_packages` | 📝 NHẬP LIỆU |
| Thứ tự sắp xếp | `sort_order` | `bidding_packages` | 🔄 TỰ TÍNH TOÁN (drag-drop) |

### PackageStatsDashboard (phần thống kê phía trên)

| Trường UI | Nguồn | Loại |
|-----------|-------|------|
| Tổng số gói thầu | `COUNT(*)` | 🔄 TỰ TÍNH TOÁN |
| Tổng giá trị | `SUM(price)` | 🔄 TỰ TÍNH TOÁN |
| Số gói theo trạng thái | `GROUP BY status` | 🔄 TỰ TÍNH TOÁN |
| Tỷ lệ tiết kiệm | `(SUM(price) - SUM(winning_price)) / SUM(price)` | 🔄 TỰ TÍNH TOÁN |

---

## 5. Tab THI CÔNG

**Component:** `ProjectConstructionTab.tsx`
**Nguồn dữ liệu chính:** 6 bảng `construction_*`

### 5.1 Sub-tab: Tổng quan (KPI)

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Tiến độ thực tế (%) | Weighted AVG: `actual_percent × weight_percent` | `construction_progress` | 🔄 TỰ TÍNH TOÁN |
| Tiến độ kế hoạch (%) | Weighted AVG: `planned_percent × weight_percent` | `construction_progress` | 🔄 TỰ TÍNH TOÁN |
| Mức độ lệch tiến độ (%) | actual − planned | — | 🔄 TỰ TÍNH TOÁN |
| An toàn lao động | `safety_status` từ log details | `construction_log_details` | 🔄 TỰ TÍNH TOÁN |
| Đường cong S-Curve | Mock data + KPI thực tế | — | 🔄 TỰ TÍNH TOÁN |
| Dự báo thời tiết 7 ngày | `coordinates` → Open-Meteo API | 🌐 API NGOÀI | 🌐 API NGOÀI |
| Khuyến nghị thi công | Weather code → mapping | — | 📋 ENUM/HẰNG SỐ |
| Nhật ký gần đây | `log_date`, `weather_desc`, `construction_status` | `construction_logs` | 📝 NHẬP LIỆU |
| Máy móc hôm nay | `equipment_name`, `quantity`, `operating_hours` | `construction_equipment` | 📝 NHẬP LIỆU |

### 5.2 Sub-tab: Nhật ký thi công

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Ngày nhật ký | `log_date` | `construction_logs` | 📝 NHẬP LIỆU |
| Mô tả thời tiết | `weather_desc` | `construction_logs` | 📝 NHẬP LIỆU / 🌐 API |
| Nhiệt độ (°C) | `weather_temp` | `construction_logs` | 📝 NHẬP LIỆU / 🌐 API |
| Gió | `weather_wind` | `construction_logs` | 📝 NHẬP LIỆU / 🌐 API |
| Trạng thái thi công | `construction_status` | `construction_logs` | 📝 NHẬP LIỆU |
| Ghi chú | `notes` | `construction_logs` | 📝 NHẬP LIỆU |
| Hạng mục công việc | `work_item`, `status`, `safety_status` | `construction_log_details` | 📝 NHẬP LIỆU |
| Nhân lực | `role_title`, `quantity`, `notes` | `construction_manpower` | 📝 NHẬP LIỆU |
| Máy móc | `equipment_name`, `quantity`, `status`, `operating_hours` | `construction_equipment` | 📝 NHẬP LIỆU |

### 5.3 Sub-tab: Tiến độ nhà thầu (WBS)

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tên hạng mục | `task_name` | `construction_progress` | 📝 NHẬP LIỆU |
| Ngày bắt đầu KH | `planned_start_date` | `construction_progress` | 📝 NHẬP LIỆU |
| Ngày kết thúc KH | `planned_end_date` | `construction_progress` | 📝 NHẬP LIỆU |
| Trọng số (%) | `weight_percent` | `construction_progress` | 📝 NHẬP LIỆU |
| Tiến độ KH (%) | `planned_percent` | `construction_progress` | 📝 NHẬP LIỆU |
| Tiến độ TT (%) | `actual_percent` | `construction_progress` | 📝 NHẬP LIỆU |
| Trạng thái | `status` | `construction_progress` | 🔄 TỰ TÍNH TOÁN (auto từ actual_percent) |
| Ghi chú | `notes` | `construction_progress` | 📝 NHẬP LIỆU |

### 5.4 Sub-tab: Ảnh công trường

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Ảnh | `photo_url` | `construction_photos` | 📝 NHẬP LIỆU (upload) |
| Chú thích | `caption` | `construction_photos` | 📝 NHẬP LIỆU |
| Ngày chụp | `created_at` | `construction_photos` | 🔄 TỰ TÍNH TOÁN (timestamp) |

---

## 6. Tab VỐN & GIẢI NGÂN

**Component:** `ProjectCapitalTab.tsx`
**Nguồn dữ liệu chính:** `capital_plans` + `disbursements` + `disbursement_plans`

### 6.1 KPI Dashboard

| Trường UI | Nguồn | Loại |
|-----------|-------|------|
| Tổng mức đầu tư | `total_investment` từ `projects` | 📝 NHẬP LIỆU |
| Tổng vốn giao | `SUM(amount)` từ `capital_plans` | 📊 TỔNG HỢP |
| Tổng giải ngân | `SUM(amount)` từ `disbursements` WHERE status='Approved' | 📊 TỔNG HỢP |
| Tổng tạm ứng | `SUM(amount)` WHERE type='TamUng' | 📊 TỔNG HỢP |
| Đã thu hồi tạm ứng | `SUM(amount)` WHERE type='ThuHoiTamUng' | 📊 TỔNG HỢP |
| Dư tạm ứng | tạm ứng − thu hồi | 🔄 TỰ TÍNH TOÁN |
| Thanh toán KLHT | `SUM(amount)` WHERE type='ThanhToanKLHT' | 📊 TỔNG HỢP |
| Tỷ lệ giải ngân (%) | totalDisbursed / totalAllocated × 100 | 🔄 TỰ TÍNH TOÁN |
| KH vốn năm | `SUM(amount)` WHERE plan_type='annual' & year=current | 📊 TỔNG HỢP |
| Giải ngân năm | Filter disbursements by current year | 📊 TỔNG HỢP |

### 6.2 Kế hoạch vốn (Capital Plans)

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Năm | `year` | `capital_plans` | 📝 NHẬP LIỆU |
| Loại KH (trung hạn/hằng năm) | `plan_type` | `capital_plans` | 📝 NHẬP LIỆU |
| Số tiền | `amount` | `capital_plans` | 📝 NHẬP LIỆU |
| Nguồn vốn | `source` | `capital_plans` | 📝 NHẬP LIỆU |
| Số QĐ giao vốn | `decision_number` | `capital_plans` | 📝 NHẬP LIỆU |
| Ngày giao | `date_assigned` | `capital_plans` | 📝 NHẬP LIỆU |
| Ghi chú | `notes` | `capital_plans` | 📝 NHẬP LIỆU |
| Đã giải ngân cho KH này | `disbursed_amount` | `capital_plans` | 📊 TỔNG HỢP |
| Tỷ lệ giải ngân / KH (%) | disbursed / amount × 100 | — | 🔄 TỰ TÍNH TOÁN |
| Biểu đồ Donut nguồn vốn | Group by source | — | 🔄 TỰ TÍNH TOÁN |

### 6.3 Kế hoạch giải ngân theo tháng

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tháng | `month` | `disbursement_plans` | 📝 NHẬP LIỆU |
| Năm | `year` | `disbursement_plans` | 📝 NHẬP LIỆU |
| Số tiền kế hoạch | `planned_amount` | `disbursement_plans` | 📝 NHẬP LIỆU |
| Số tiền thực tế | `actual_amount` | `disbursement_plans` | 📝 NHẬP LIỆU |
| Ghi chú | `notes` | `disbursement_plans` | 📝 NHẬP LIỆU |
| Biểu đồ cột KH vs TT | planned vs actual | — | 🔄 TỰ TÍNH TOÁN |
| Tổng KH năm / Tổng TT năm | SUM by year | — | 🔄 TỰ TÍNH TOÁN |

### 6.4 Lịch sử giải ngân

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Ngày giải ngân | `date` (mapped từ month/year) | `disbursements` | 📝 NHẬP LIỆU |
| Số tiền | `amount` | `disbursements` | 📝 NHẬP LIỆU |
| Loại (Tạm ứng/KLHT/Thu hồi) | `type` | `disbursements` | 📝 NHẬP LIỆU |
| Trạng thái | `status` | `disbursements` | 📝 NHẬP LIỆU |
| Mô tả | `description` | `disbursements` | 📝 NHẬP LIỆU |
| Lũy kế nghiệm thu | `luy_ke_nghiem_thu` | `disbursements` | 📝 NHẬP LIỆU |

### 6.5 Cảnh báo rủi ro vốn

| Trường UI | Nguồn | Loại |
|-----------|-------|------|
| Vượt TMĐT | totalAllocated > totalInvestment | 🔄 TỰ TÍNH TOÁN |
| Giải ngân chậm | disbursementRate < ngưỡng | 🔄 TỰ TÍNH TOÁN |
| Dư tạm ứng cao | advanceBalance > ngưỡng % | 🔄 TỰ TÍNH TOÁN |

---

## 7. Tab THANH TRA

**Component:** `ProjectInspectionTab.tsx`
**Nguồn dữ liệu chính:** Bảng `inspections`

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tiêu đề thanh tra | `title` | `inspections` | 📝 NHẬP LIỆU |
| Loại thanh tra | `type` | `inspections` | 📝 NHẬP LIỆU |
| Ngày thanh tra | `inspection_date` | `inspections` | 📝 NHẬP LIỆU |
| Cơ quan thanh tra | `authority` | `inspections` | 📝 NHẬP LIỆU |
| Kết quả | `result` | `inspections` | 📝 NHẬP LIỆU |
| Kiến nghị | `recommendations` | `inspections` | 📝 NHẬP LIỆU |
| Trạng thái xử lý | `status` | `inspections` | 📝 NHẬP LIỆU |
| File đính kèm | `attachments` | `inspections` | 📝 NHẬP LIỆU |

---

## 8. Tab QUYẾT TOÁN

**Component:** `ProjectSettlementTab.tsx`
**Nguồn dữ liệu chính:** `contracts` + `disbursements` + `projects`

| Trường UI | Nguồn | DB Table | Loại |
|-----------|-------|----------|------|
| Tổng mức đầu tư | `total_investment` | `projects` | 📝 NHẬP LIỆU |
| Tổng dự toán | `total_estimate` | `projects` | 📝 NHẬP LIỆU |
| Tổng giá trị HĐ | `SUM(contract_value)` | `contracts` | 📊 TỔNG HỢP |
| Đã thanh toán | `SUM(paid_amount)` | `contracts` | 📊 TỔNG HỢP |
| Tỷ lệ thanh toán/HĐ | paid / contract_value × 100 | — | 🔄 TỰ TÍNH TOÁN |
| Danh sách HĐ | `contract_name`, `contract_value`, `paid_amount`, `status` | `contracts` | 📝 NHẬP LIỆU |
| Lịch sử giải ngân | `amount`, `type`, `status`, `month`, `year` | `disbursements` | 📝 NHẬP LIỆU |
| Quy trình quyết toán (stepper) | — | — | 📋 ENUM/HẰNG SỐ (5 bước cố định) |
| Chênh lệch dự toán/thực tế | totalEstimate − SUM(contract_value) | — | 🔄 TỰ TÍNH TOÁN |

---

## 9. Tab QUY TRÌNH

**Component:** `ProjectWorkflowTab.tsx`
**Nguồn dữ liệu chính:** `workflow_instances` + `workflow_tasks`

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tên quy trình | `template_name` / `name` | `workflow_instances` | 📝 NHẬP LIỆU |
| Trạng thái quy trình | `status` | `workflow_instances` | 📝 NHẬP LIỆU / 🔄 TỰ TÍNH |
| Các bước (steps) | `step_name`, `status`, `assignee` | `workflow_tasks` | 📝 NHẬP LIỆU |
| Ngày bắt đầu/kết thúc | `started_at`, `completed_at` | `workflow_tasks` | 📝 NHẬP LIỆU / 🔄 TỰ TÍNH |
| Tiến độ quy trình (%) | completed_steps / total_steps × 100 | — | 🔄 TỰ TÍNH TOÁN |

---

## 10. Tab GPMB

**Component:** `ProjectClearanceTab.tsx`
**Nguồn dữ liệu chính:** Bảng `clearance` hoặc JSONB trong `projects`

| Trường UI | Nguồn | Loại |
|-----------|-------|------|
| Diện tích GPMB | Nhập liệu | 📝 NHẬP LIỆU |
| Số hộ ảnh hưởng | Nhập liệu | 📝 NHẬP LIỆU |
| Tiến độ GPMB (%) | Nhập liệu hoặc tính | 📝 NHẬP LIỆU |
| Kinh phí bồi thường | Nhập liệu | 📝 NHẬP LIỆU |
| Trạng thái | Nhập liệu | 📝 NHẬP LIỆU |

---

## 11. Tab HỒ SƠ

**Component:** `ProjectDocumentsTab.tsx`
**Nguồn dữ liệu chính:** `documents` / `cde_documents` + Supabase Storage

| Trường UI | DB Column | DB Table | Loại |
|-----------|-----------|----------|------|
| Tên tài liệu | `name` / `file_name` | `documents` | 📝 NHẬP LIỆU |
| Loại tài liệu | `type` / `category` | `documents` | 📝 NHẬP LIỆU |
| Phiên bản | `version` | `documents` | 📝 NHẬP LIỆU |
| File đính kèm | `file_url` | Supabase Storage | 📝 NHẬP LIỆU (upload) |
| Ngày tải lên | `created_at` | `documents` | 🔄 TỰ TÍNH TOÁN (timestamp) |
| Người tải | `uploaded_by` | `documents` | 🔄 TỰ TÍNH TOÁN (auth user) |

---

## 12. Tab ĐỒNG BỘ CSDL

**Component:** `ProjectComplianceTab.tsx`
**Mục đích:** Kiểm tra hoàn thiện hồ sơ theo TT24/2025/TT-BXD

| Trường UI | Nguồn | Loại |
|-----------|-------|------|
| Tên dự án | `project_name` từ `projects` | 📝 (auto-fill từ DB) |
| Nhóm dự án | `group_code` từ `projects` | 📝 (auto-fill từ DB) |
| Địa điểm | `location_code` từ `projects` | 📝 (auto-fill từ DB) |
| Người QĐ đầu tư | `competent_authority` từ `projects` | 📝 (auto-fill từ DB) |
| Chủ đầu tư | `investor_name` từ `projects` | 📝 (auto-fill từ DB) |
| Mục tiêu đầu tư | `objective` từ `projects` | 📝 (auto-fill từ DB) |
| Quy mô đầu tư | `investment_scale` từ `projects` | 📝 (auto-fill từ DB) |
| Văn bản pháp lý (upload) | Upload file → Gemini AI trích xuất | 📝 NHẬP LIỆU + 🔄 AI trích xuất |
| Trạng thái hoàn thiện | Tính từ có/không có dữ liệu | 🔄 TỰ TÍNH TOÁN |
| Cơ cấu chi phí | `cost_breakdown` (JSONB) từ `projects` | 📝 NHẬP LIỆU |

---

## 13. Tổng hợp phân loại

### Thống kê theo loại dữ liệu

| Loại | Số lượng trường (ước tính) | Tỷ lệ |
|------|---------------------------|-------|
| 📝 NHẬP LIỆU (thủ công qua form) | ~150+ | ~65% |
| 🔄 TỰ TÍNH TOÁN (aggregate, formula) | ~50+ | ~22% |
| 📊 TỔNG HỢP (query nhiều bảng) | ~20+ | ~9% |
| 🌐 API NGOÀI | ~5 | ~2% |
| 📋 ENUM/HẰNG SỐ | ~5 | ~2% |

### Thống kê theo bảng database

| Bảng DB | Số cột hiển thị trên UI | Vai trò |
|---------|------------------------|---------|
| `projects` | 92 cột (gồm 8 JSONB) | Bảng chính — lưu mọi thông tin cốt lõi dự án |
| `bidding_packages` | ~30 cột | Quản lý gói thầu, đấu thầu |
| `contracts` | ~10 cột hiển thị | Hợp đồng với nhà thầu |
| `contractors` | ~8 cột | Thông tin nhà thầu |
| `capital_plans` | ~8 cột | Kế hoạch vốn trung hạn/hằng năm |
| `disbursements` | ~8 cột | Giải ngân thực tế |
| `disbursement_plans` | ~5 cột | KH giải ngân theo tháng |
| `tasks` | ~10 cột | Công việc, kế hoạch, WBS |
| `construction_logs` | ~6 cột | Nhật ký thi công hằng ngày |
| `construction_log_details` | ~3 cột | Chi tiết hạng mục/ngày |
| `construction_manpower` | ~3 cột | Nhân lực thi công/ngày |
| `construction_equipment` | ~4 cột | Máy móc thiết bị/ngày |
| `construction_progress` | ~8 cột | Tiến độ WBS nhà thầu |
| `construction_photos` | ~3 cột | Ảnh công trường |
| `payments` | ~5 cột | Thanh toán (hiện ở Key Dates) |
| `project_members` + `employees` | ~3 cột | Đội ngũ dự án |
| `documents` | ~5 cột | Hồ sơ tài liệu |
| `inspections` | ~7 cột | Thanh tra |
| `workflow_instances` + `workflow_tasks` | ~5 cột | Quy trình nghiệp vụ |

### Các giá trị TỰ TÍNH TOÁN quan trọng

| Giá trị | Công thức | Tính ở đâu |
|---------|-----------|------------|
| Tiến độ dự án (%) | `AVG(tasks.progress)` | `ProjectInfoTab` → `useQuery` |
| Tổng giải ngân | `SUM(disbursements.amount)` WHERE Approved | `useProjectCapitalSummary` |
| Tỷ lệ giải ngân | `totalDisbursed / totalAllocated × 100` | `useCapitalComputed` |
| Dư tạm ứng | `SUM(TamUng) − SUM(ThuHoiTamUng)` | `useProjectCapitalSummary` |
| Tiến độ thi công thực tế | `Σ(actual_percent × weight_percent) / Σ(weight_percent)` | `ProjectConstructionTab` |
| Mức lệch tiến độ | `actualProgress − plannedProgress` | `ProjectConstructionTab` |
| Sức khỏe dự án (0-100) | `30×completion + 30×onTime + 20×assigned + 20×progress` | `ProjectHealthScore` |
| Tasks quá hạn | `due_date < NOW() AND status ≠ Done` | `ProjectInfoTab` → `useQuery` |
| Giải ngân tháng trước | Filter by prev month from `disbursements` | `ProjectInfoTab` → `useMemo` |
| Tiết kiệm đấu thầu | `(SUM(price) − SUM(winning_price)) / SUM(price)` | `PackageStatsDashboard` |
| Trạng thái WBS | Auto set: 0%→pending, >0%→in_progress, 100%→completed | `ProjectConstructionTab` |

### Dữ liệu lấy từ API ngoài

| Dữ liệu | API | Trigger |
|----------|-----|---------|
| Dự báo thời tiết 7 ngày | Open-Meteo (`/v1/forecast`) | Khi vào tab Thi công |
| Thời tiết tự động (nhật ký) | Open-Meteo (current weather) | Nút "Lấy TT Tự động" |
| Toạ độ → vị trí | `projects.coordinates` (JSONB) | Luôn sẵn |

---

## Ghi chú kỹ thuật

1. **JSONB fields** trong bảng `projects` lưu trữ các cấu trúc phức tạp: `cost_breakdown`, `budget_allocations`, `khv_info`, `implementation_tracking`, `adjusted_approval`, `contractor_details`, `project_management`, `project_status_info`. Tất cả đều là **nhập liệu** qua form nhiều tab.

2. **Mapper layer** (`projectMappers.ts`) chuyển đổi `snake_case` (DB) ↔ `PascalCase` (Frontend) — không thay đổi logic dữ liệu, chỉ đổi tên.

3. **Form nhập liệu** được tổ chức thành 6 tab: Thông tin chung, Pháp lý, Quy mô công trình, Cơ cấu vốn, Nhà thầu, Trạng thái — tương ứng `projectFieldCatalog.ts`.

4. **Phân quyền cấp trường** (`ProjectFieldPermissionManager`) kiểm soát ai được sửa trường nào dựa trên vai trò trong `project_members.role`.

5. **Real-time updates**: Sử dụng Supabase Realtime subscriptions cho danh sách dự án (`useProjectsRealtime`).

---

*Báo cáo được tạo tự động bởi Claude Code — 06/06/2026*

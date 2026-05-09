# Phase 03: Hardcoded References Audit & Replacement (Sửa đổi các tệp cứng)
Status: 🟡 In Progress
Dependencies: Phase 02 (Completed)

## Objective
Kiểm tra toàn bộ mã nguồn và thay thế các giá trị màu cam cứng (`#f97316`, `f97316`, `#ea580c`) bằng màu xanh lam/xám Nordic Slate tương ứng để giao diện đạt được độ nhất quán thị giác 100%.

## 📋 Danh sách các tệp cần cập nhật & Sơ đồ thay thế

### 1. Nền tảng cấu hình chung & Môi trường chạy
- **`index.html`** (Dòng 10):
  - Cũ: `<meta name="theme-color" content="#f97316" />`
  - Mới: `<meta name="theme-color" content="#4a90e2" />`

### 2. Các hàm Mapper & Context (Avatar mặc định của người dùng)
- **`lib/mappers/employeeMappers.ts`** (Dòng 14) & **`context/AuthContext.tsx`** (Dòng 113) & **`features/settings/UserImpersonator.tsx`** (Dòng 132):
  - Cũ: `background=f97316`
  - Mới: `background=4a90e2` (Tạo màu nền avatar xanh Bắc Âu thanh lịch)

### 3. Sơ đồ tổ chức (Org Chart)
- **`features/organization/OrgChartPage.tsx`**:
  - Dòng 163 (Đường nối - stroke): Cũ `#f97316` -> Mới `#4a90e2`
  - Dòng 326 (Màu của Phó giám đốc): Cũ `#f97316` -> Mới `#4a90e2`

### 4. Giao diện Chatbot Trí tuệ Nhân tạo (AIChatbot)
- **`components/common/AIChatbot.tsx`**:
  - Dòng 229: Đổi gradient bong bóng chat từ Cam sang Slate gradient (`linear-gradient(135deg, #1c456c 0%, #4a90e2 100%)`) và shadow của nó sang `rgba(74, 144, 226, 0.4)`.
  - Dòng 251: Đổi gradient tiêu đề chatbot từ Cam sang Slate gradient (`linear-gradient(135deg, #1c456c 0%, #4a90e2 100%)`).
  - Dòng 387: Đổi nút gửi chat từ `linear-gradient(135deg, #ea580c 0%, #f97316 100%)` sang `linear-gradient(135deg, #357abd 0%, #4a90e2 100%)`.

### 5. Biểu đồ, Tiến độ & Quản lý dự án (Charts & Progress Bars)
- **`features/contracts/ContractDetail.tsx`**:
  - Đổi màu biểu đồ tròn `Đã thanh toán` và gradient vùng (Area Chart) dưới biểu đồ từ Cam sang `#4a90e2`.
- **`features/dashboard/components/CapitalDisbursementChart.tsx`**:
  - Đổi màu cột giải ngân thực tế và legend từ `#f97316` sang `#4a90e2`.
- **`features/dashboard/components/OverviewTab.tsx`**:
  - Đổi fallback color của `ProgressBar` từ `#f97316` sang `#4a90e2`.
- **`features/employees/EmployeeSlideContent.tsx`** & **`features/employees/EmployeeDetail.tsx`**:
  - Đổi màu trạng thái `Đang thực hiện` từ `#f97316` sang `#4a90e2`.
- **`features/projects/components/tabs/ProjectPlanTab.tsx`** & **`ProjectOverallProgress.tsx`**:
  - Đổi các thanh tiến độ gradient ba màu từ Cam sang Nordic Slate gradient (`linear-gradient(90deg, #b9d9eb, #8fbeee, #4a90e2)`).
- **`features/projects/components/GanttChartWidget.tsx`** & **`DualProgressCard.tsx`** & **`BiddingPackageDetail.tsx`**:
  - Đổi màu tiến độ từ gradient màu cam sang gradient xanh Bắc Âu (`linear-gradient(90deg, #8fbeee, #4a90e2)`).
- **`features/projects/components/BudgetVarianceCard.tsx`**:
  - Đổi thanh tiến độ từ gradient cam sang gradient xanh (`linear-gradient(90deg, #b9d9eb, #4a90e2)`).

### 6. Biểu mẫu thanh toán (Payment Form)
- **`features/payments/PaymentForm.tsx`** (Dòng 95):
  - Cũ: `background: 'linear-gradient(135deg, #4A4230 0%, #9a3412 50%, #f97316 100%)'`
  - Mới: `background: 'linear-gradient(135deg, #112d4e 0%, #1c456c 50%, #4a90e2 100%)'` (Đổi sang gradient Xanh Nordic Slate kết hợp Navy huyền bí cực kỳ sang trọng).

---

## 🚀 Trạng thái thực thi
- [ ] Cập nhật `index.html` -> **Sắp thực hiện**
- [ ] Cập nhật các avatar mappers (`employeeMappers.ts`, `AuthContext.tsx`, `UserImpersonator.tsx`) -> **Sắp thực hiện**
- [ ] Cập nhật Org Chart (`OrgChartPage.tsx`) -> **Sắp thực hiện**
- [ ] Cập nhật AI Chatbot (`AIChatbot.tsx`) -> **Sắp thực hiện**
- [ ] Cập nhật Dashboard & Project progress components (`ContractDetail.tsx`, `CapitalDisbursementChart.tsx`, `OverviewTab.tsx`, `EmployeeSlideContent.tsx`, `EmployeeDetail.tsx`, `ProjectPlanTab.tsx`, `ProjectOverallProgress.tsx`, `GanttChartWidget.tsx`, `DualProgressCard.tsx`, `BiddingPackageDetail.tsx`, `BudgetVarianceCard.tsx`) -> **Sắp thực hiện**
- [ ] Cập nhật Payment Form (`PaymentForm.tsx`) -> **Sắp thực hiện**
- [ ] Dọn dẹp gradient phụ thuộc trong `index.css` -> **Sắp thực hiện**

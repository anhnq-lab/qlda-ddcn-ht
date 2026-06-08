# CƠ SỞ DỮ LIỆU DỰ ÁN QLDA-DDCN-HT

*Tài liệu mô tả chi tiết cấu trúc cơ sở dữ liệu hiện tại của hệ thống Quản lý dự án Đầu tư Xây dựng và Điều hành tác nghiệp công sở (Supabase Postgres).*

> [!NOTE]
> Tài liệu này được tạo tự động từ cấu trúc database thực tế đang vận hành trên môi trường Supabase.

## I. Nhận xét & Đánh giá sự Trùng lặp (Dành cho việc Tối ưu hóa Schema)

Qua phân tích cấu trúc 102 bảng trong database, chúng tôi phát hiện một số điểm trùng lặp hoặc chồng chéo cấu trúc cần cân nhắc tối ưu hóa và chỉnh sửa:

1. **Phân mảnh cấu trúc Văn bản/Quy chế (Quy trình tương đồng):**
   - **Bảng liên quan:** `legal_documents` (Văn bản pháp luật) và `regulations` / `regulation_documents` (Quy chế nội bộ).
   - **Nhận xét:** Cả hai phân hệ đều sử dụng chung một mô hình phân cấp: Tài liệu → Chương (`legal_chapters`, `regulation_chapters`) → Điều (`legal_articles`, `regulation_articles`).
   - **Đề xuất:** Có thể hợp nhất các bảng này thành một bộ bảng duy nhất `documents`, `document_chapters`, `document_articles` và sử dụng một trường phân loại `type` (`legal` cho văn bản pháp lý nhà nước, `internal_regulation` cho quy chế nội bộ). Điều này giúp giảm số lượng bảng, chuẩn hóa mã nguồn xử lý phân cấp và dễ dàng phát triển tính năng chung (như Tìm kiếm toàn văn FTS hoặc Đánh dấu Bookmark).

2. **Trùng lặp & Tách biệt hệ thống Quy trình (Workflow Engines):**
   - **Bảng liên quan:**
     - Quy trình nghiệp vụ chung: `workflows`, `workflow_nodes`, `workflow_edges`, `workflow_instances`, `workflow_tasks`
     - Quy trình CDE: `cde_workflow_instances`, `cde_workflow_step_records`
     - Quy trình nội bộ CDE: `cde_internal_workflow_instances`, `cde_internal_workflow_step_records`, `cde_workflow_history`
   - **Nhận xét:** Có 3 bộ bảng chạy quy trình khác nhau. Workflow engine chung (`workflow_instances`, `workflow_tasks`) hoàn toàn có thể cấu hình động để phục vụ cho các quy trình nghiệp vụ CDE hoặc quy trình khác thay vì viết riêng các bảng lưu vết chạy bước cho CDE.
   - **Đề xuất:** Chuẩn hóa toàn bộ quy trình phê duyệt hồ sơ của CDE về chạy trên Workflow engine chung. Bản thân bảng `workflow_instances` có trường `reference_type` và `reference_id` giúp tham chiếu trực tiếp đến tài liệu hoặc thư mục CDE cần phê duyệt.

3. **Trùng lặp cấu trúc quản lý thư mục (Folders):**
   - **Bảng liên quan:** `folders` (Quản lý thư mục chung) và `cde_folders` (Thư mục CDE).
   - **Nhận xét:** Cấu trúc của hai bảng này rất giống nhau (quản lý cây thư mục có quan hệ cha-con `parent_id`).
   - **Đề xuất:** Gộp chung thành một bảng `folders` duy nhất, bổ sung thêm cột `is_cde` (boolean) hoặc `context` (enum: 'general', 'cde') để phân loại. Như vậy sẽ tận dụng được các hàm đệ quy duyệt cây thư mục dùng chung.

4. **Trùng lặp dữ liệu lỗi/vấn đề phát sinh (Issues):**
   - **Bảng liên quan:** `package_issues` (Vướng mắc gói thầu) và `bim_issues` (Vướng mắc mô hình BIM).
   - **Nhận xét:** Đều mô tả một vấn đề phát sinh cần theo dõi, giao người xử lý, cập nhật trạng thái và bình luận thảo luận.
   - **Đề xuất:** Gộp thành một bảng `issues` chung có trường `target_type` ('bidding_package', 'bim_model', 'task') và `target_id` (UUID hoặc mã dạng text) tương ứng. Thiết kế này vừa sạch vừa dễ mở rộng thêm các loại issue khác sau này.

5. **Công việc & Nhật ký thi công / Nhật ký tuần:**
   - **Bảng liên quan:** `tasks` (Quản lý công việc giao việc) và `task_weekly_updates` (Cập nhật tuần), `construction_logs` (Nhật ký thi công).
   - **Nhận xét:** Cần làm rõ phân định giữa công việc văn phòng/quản lý (`tasks`) và phần thi công thực tế tại hiện trường (`construction_progress`, `construction_logs`) để tránh việc trùng lặp báo cáo.

## II. Danh mục Hệ thống Bảng CSDL theo Phân hệ

### 1. Quản lý Nhân sự & Phân quyền (Employees, Departments & RBAC)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`employees`](#employees) | **Nhân viên cơ quan** | 23 | **129** |
| 2 | [`user_accounts`](#user_accounts) | **Tài khoản đăng nhập** | 9 | **129** |
| 3 | [`user_permissions`](#user_permissions) | **Bảng phân quyền chi tiết của người dùng** | 7 | **42** |
| 4 | [`role_permission_defaults`](#role_permission_defaults) | **Quyền mặc định của các nhóm vai trò** | 6 | **151** |
| 5 | [`leadership_assignments`](#leadership_assignments) | **Phân công lãnh đạo phụ trách dự án** | 6 | **3** |
| 6 | [`department_permission_rules`](#department_permission_rules) | **Quy tắc kiểm soát quyền theo phòng ban** | 5 | **8** |
| 7 | [`departments`](#departments) | **Danh sách phòng ban chuyên môn** | 8 | **10** |

### 2. Quản lý Dự án (Project Management)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`projects`](#projects) | **Thông tin dự án đầu tư xây dựng** | 108 | **751** |
| 2 | [`project_members`](#project_members) | **Thành viên tham gia ban quản lý dự án** | 5 | **723** |
| 3 | [`project_field_permissions`](#project_field_permissions) | **Phân quyền chỉnh sửa chi tiết các trường dữ liệu dự án** | 4 | **272** |
| 4 | [`stage_transitions`](#stage_transitions) | **Nhật ký chuyển đổi giai đoạn dự án** | 8 | **0** |
| 5 | [`stakeholder_types`](#stakeholder_types) | **Phân loại các bên liên quan** | 7 | **18** |
| 6 | [`site_clearances`](#site_clearances) | **Thông tin tổng hợp giải phóng mặt bằng** | 11 | **2** |
| 7 | [`site_clearance_milestones`](#site_clearance_milestones) | **Các mốc tiến độ giải phóng mặt bằng** | 9 | **32** |

### 3. Kế hoạch & Tiến độ (Planning & Execution)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`project_plan_steps`](#project_plan_steps) | **Các bước kế hoạch tiến độ tổng thể dự án** | 21 | **110** |
| 2 | [`project_plan_items`](#project_plan_items) | **Hạng mục kế hoạch công việc dự án** | 25 | **25** |
| 3 | [`project_plan_raci`](#project_plan_raci) | **Phân công ma trận trách nhiệm RACI cho từng bước dự án** | 9 | **92** |
| 4 | [`annual_plan_items`](#annual_plan_items) | **Hạng mục kế hoạch công tác năm** | 30 | **308** |
| 5 | [`monthly_plans`](#monthly_plans) | **Danh mục kế hoạch công tác tháng (Thông tin chung)** | 15 | **101** |
| 6 | [`monthly_plan_items`](#monthly_plan_items) | **Chi tiết các hạng mục kế hoạch công tác tháng** | 23 | **0** |
| 7 | [`annual_evaluations`](#annual_evaluations) | **Thông tin đánh giá tổng kết cuối năm** | 24 | **0** |

### 4. Gói thầu, Nhà thầu & Hợp đồng (Bidding, Contractors & Contracts)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`bidding_packages`](#bidding_packages) | **Thông tin các gói thầu của dự án** | 50 | **26** |
| 2 | [`package_bidders`](#package_bidders) | **Nhà thầu tham dự thầu gói thầu** | 22 | **0** |
| 3 | [`package_issues`](#package_issues) | **Các vấn đề/vướng mắc liên quan đến gói thầu** | 8 | **0** |
| 4 | [`procurement_plans`](#procurement_plans) | **Kế hoạch lựa chọn nhà thầu** | 14 | **4** |
| 5 | [`contractors`](#contractors) | **Danh sách các nhà thầu tham gia dự án** | 16 | **11** |
| 6 | [`contractor_accounts`](#contractor_accounts) | **Tài khoản đăng nhập dành cho nhà thầu** | 9 | **0** |
| 7 | [`contracts`](#contracts) | **Hợp đồng ký kết với nhà thầu** | 19 | **16** |
| 8 | [`variation_orders`](#variation_orders) | **Phụ lục hợp đồng hoặc khối lượng phát sinh** | 9 | **0** |

### 5. Quản lý Tài chính & Giải ngân (Finance, Capital & Disbursements)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`capital_plans`](#capital_plans) | **Kế hoạch vốn (kế hoạch trung hạn, năm)** | 18 | **860** |
| 2 | [`disbursement_plans`](#disbursement_plans) | **Kế hoạch giải ngân chi tiết** | 8 | **0** |
| 3 | [`disbursements`](#disbursements) | **Số liệu giải ngân thực tế** | 15 | **122** |
| 4 | [`payments`](#payments) | **Yêu cầu thanh toán / Hồ sơ thanh toán** | 15 | **23** |

### 6. Quản lý Công việc & Tương tác (Tasks & Collaboration)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`tasks`](#tasks) | **Nhiệm vụ, công việc giao cho nhân viên** | 44 | **336** |
| 2 | [`sub_tasks`](#sub_tasks) | **Công việc con chi tiết** | 9 | **0** |
| 3 | [`task_activities`](#task_activities) | **Lịch sử hoạt động cập nhật công việc** | 6 | **0** |
| 4 | [`task_comments`](#task_comments) | **Thảo luận và ý kiến đóng góp cho công việc** | 7 | **0** |
| 5 | [`task_weekly_updates`](#task_weekly_updates) | **Báo cáo cập nhật tiến độ công việc hàng tuần** | 12 | **0** |

### 7. Quản lý Tài liệu & CDE (Common Data Environment)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`documents`](#documents) | **Văn bản, hồ sơ quản lý dự án** | 43 | **2** |
| 2 | [`document_attachments`](#document_attachments) | **File đính kèm của hồ sơ/tài liệu** | 11 | **4** |
| 3 | [`folders`](#folders) | **Cấu trúc thư mục quản lý hồ sơ chung** | 5 | **0** |
| 4 | [`cde_folders`](#cde_folders) | **Cấu trúc thư mục trong môi trường dữ liệu chung CDE** | 12 | **0** |
| 5 | [`cde_permissions`](#cde_permissions) | **Bảng phân quyền tài liệu CDE cho nhà thầu** | 7 | **0** |
| 6 | [`cde_reviews`](#cde_reviews) | **Yêu cầu phê duyệt, đánh giá tài liệu trên CDE** | 10 | **0** |
| 7 | [`cde_review_items`](#cde_review_items) | **Các file/tài liệu đính kèm yêu cầu đánh giá CDE** | 4 | **0** |
| 8 | [`cde_review_approvers`](#cde_review_approvers) | **Danh sách người tham gia phê duyệt tài liệu CDE** | 9 | **0** |
| 9 | [`cde_comments`](#cde_comments) | **Ý kiến thảo luận và ghi chú trên tài liệu CDE** | 8 | **0** |
| 10 | [`cde_transmittals`](#cde_transmittals) | **Phiếu giao nhận hồ sơ, tài liệu CDE** | 16 | **0** |
| 11 | [`cde_audit_log`](#cde_audit_log) | **Nhật ký kiểm toán hoạt động trên CDE** | 10 | **0** |
| 12 | [`view_comments`](#view_comments) | **Ý kiến đóng góp khi xem tài liệu** | 9 | **1** |

### 8. Quy trình Phê duyệt & Workflow Engine

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`workflows`](#workflows) | **Định nghĩa quy trình nghiệp vụ hệ thống** | 11 | **7** |
| 2 | [`workflow_nodes`](#workflow_nodes) | **Các bước (nút) trong quy trình nghiệp vụ** | 14 | **105** |
| 3 | [`workflow_edges`](#workflow_edges) | **Đường nối chuyển bước giữa các nút quy trình** | 6 | **98** |
| 4 | [`workflow_instances`](#workflow_instances) | **Các lượt chạy quy trình nghiệp vụ thực tế** | 11 | **2** |
| 5 | [`workflow_tasks`](#workflow_tasks) | **Nhiệm vụ phê duyệt trong lượt chạy quy trình** | 19 | **0** |
| 6 | [`workflow_node_raci`](#workflow_node_raci) | **Thiết lập RACI mặc định cho từng bước quy trình** | 6 | **196** |
| 7 | [`cde_workflow_instances`](#cde_workflow_instances) | **Quy trình phê duyệt tài liệu CDE** | 13 | **5** |
| 8 | [`cde_workflow_step_records`](#cde_workflow_step_records) | **Nhật ký thực hiện từng bước quy trình CDE** | 13 | **9** |
| 9 | [`cde_internal_workflow_instances`](#cde_internal_workflow_instances) | **Lượt chạy quy trình nghiệp vụ nội bộ CDE** | 17 | **2** |
| 10 | [`cde_internal_workflow_step_records`](#cde_internal_workflow_step_records) | **Chi tiết bước xử lý quy trình nội bộ CDE** | 15 | **2** |
| 11 | [`cde_workflow_history`](#cde_workflow_history) | **Lịch sử chung của quy trình CDE** | 11 | **0** |

### 9. Thi công & Giám sát hiện trường (Construction & Site Supervision)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`construction_works`](#construction_works) | **Danh mục hạng mục công trình xây dựng** | 7 | **0** |
| 2 | [`construction_logs`](#construction_logs) | **Nhật ký thi công hàng ngày** | 11 | **7** |
| 3 | [`construction_log_details`](#construction_log_details) | **Chi tiết công việc thi công trong ngày** | 11 | **17** |
| 4 | [`construction_manpower`](#construction_manpower) | **Báo cáo nhân lực thi công tại hiện trường** | 6 | **27** |
| 5 | [`construction_equipment`](#construction_equipment) | **Báo cáo thiết bị thi công tại hiện trường** | 7 | **15** |
| 6 | [`construction_progress`](#construction_progress) | **Sản lượng thi công thực tế** | 15 | **11** |
| 7 | [`construction_site_photos`](#construction_site_photos) | **Hình ảnh nhật ký công trường thực tế** | 7 | **8** |
| 8 | [`inspections`](#inspections) | **Biên bản kiểm tra và nghiệm thu công việc** | 21 | **16** |
| 9 | [`material_mines`](#material_mines) | **Mỏ vật liệu xây dựng phục vụ dự án** | 10 | **10** |

### 10. Mô hình thông tin công trình BIM (Building Information Modeling)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`bim_models`](#bim_models) | **Quản lý tệp tin mô hình 3D/BIM** | 23 | **3** |
| 2 | [`bim_project_settings`](#bim_project_settings) | **Cấu hình toạ độ và thông số BIM dự án** | 3 | **2** |
| 3 | [`bim_saved_views`](#bim_saved_views) | **Góc nhìn phối cảnh BIM được lưu trữ** | 9 | **0** |
| 4 | [`bim_issues`](#bim_issues) | **Quản lý các vấn đề, va chạm trên mô hình BIM** | 22 | **0** |
| 5 | [`bim_issue_comments`](#bim_issue_comments) | **Thảo luận và phản hồi vấn đề BIM** | 5 | **0** |

### 11. Đánh giá KPI & Điểm số tháng (KPIs & Monthly Scores)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`individual_monthly_scores`](#individual_monthly_scores) | **Bảng điểm KPI đánh giá cá nhân theo tháng** | 39 | **258** |
| 2 | [`individual_project_disbursement`](#individual_project_disbursement) | **Chi tiết điểm giải ngân dự án của cá nhân** | 8 | **0** |
| 3 | [`department_monthly_scores`](#department_monthly_scores) | **Bảng điểm đánh giá phòng ban theo tháng** | 36 | **16** |
| 4 | [`evaluation_forms`](#evaluation_forms) | **Mẫu đánh giá KPI tiêu chuẩn** | 34 | **256** |

### 12. Quản lý Tài sản công (Public Asset Management)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`public_assets`](#public_assets) | **Danh sách tài sản công được quản lý** | 23 | **102** |
| 2 | [`public_asset_categories`](#public_asset_categories) | **Danh mục nhóm tài sản công** | 8 | **16** |
| 3 | [`public_asset_inventories`](#public_asset_inventories) | **Phiếu kiểm kê tài sản công định kỳ** | 7 | **0** |
| 4 | [`public_asset_inventory_details`](#public_asset_inventory_details) | **Chi tiết kết quả kiểm kê tài sản công** | 8 | **0** |
| 5 | [`public_asset_transactions`](#public_asset_transactions) | **Lịch sử biến động, điều chuyển tài sản công** | 12 | **0** |

### 13. Văn bản Pháp luật & Quy chế nội bộ (Legal & Regulations)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`legal_documents`](#legal_documents) | **Văn bản pháp luật, quy chuẩn nhà nước** | 18 | **19** |
| 2 | [`legal_chapters`](#legal_chapters) | **Chương trong văn bản pháp luật** | 5 | **91** |
| 3 | [`legal_articles`](#legal_articles) | **Điều khoản cụ thể trong văn bản pháp luật** | 10 | **846** |
| 4 | [`regulations`](#regulations) | **Quy định, quy chế nội bộ cơ quan** | 10 | **30** |
| 5 | [`regulation_documents`](#regulation_documents) | **Tài liệu đính kèm quy chế nội bộ** | 11 | **4** |
| 6 | [`regulation_chapters`](#regulation_chapters) | **Chương của quy định nội bộ** | 8 | **11** |
| 7 | [`regulation_articles`](#regulation_articles) | **Điều khoản cụ thể của quy định nội bộ** | 10 | **53** |
| 8 | [`regulation_bookmarks`](#regulation_bookmarks) | **Danh sách điều khoản quy định được lưu đánh dấu** | 5 | **0** |

### 14. Hệ thống & Khác (System & Utilities)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`audit_logs`](#audit_logs) | **Nhật ký hoạt động chung toàn hệ thống** | 8 | **661** |
| 2 | [`notifications`](#notifications) | **Thông báo gửi đến người dùng** | 8 | **0** |
| 3 | [`user_preferences`](#user_preferences) | **Cấu hình tùy chọn hiển thị cá nhân** | 6 | **0** |
| 4 | [`sidebar_module_config`](#sidebar_module_config) | **Cấu hình hiển thị menu chức năng sidebar** | 5 | **16** |
| 5 | [`update_compliance_log`](#update_compliance_log) | **Nhật ký cập nhật tuân thủ quy định** | 5 | **0** |

### 15. Các bảng bổ sung khác (Other Tables)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện có |
|---|---|---|---|---|
| 1 | [`agency_event_attendees`](#agency_event_attendees) | **Chưa định nghĩa tên tiếng Việt** | 4 | **45** |
| 2 | [`agency_events`](#agency_events) | **Chưa định nghĩa tên tiếng Việt** | 13 | **14** |
| 3 | [`cde_items_view`](#cde_items_view) | **Chưa định nghĩa tên tiếng Việt** | 29 | **0** |
| 4 | [`cde_project_stats_view`](#cde_project_stats_view) | **Chưa định nghĩa tên tiếng Việt** | 7 | **0** |
| 5 | [`facility_assets`](#facility_assets) | **Chưa định nghĩa tên tiếng Việt** | 19 | **0** |
| 6 | [`feasibility_studies`](#feasibility_studies) | **Chưa định nghĩa tên tiếng Việt** | 13 | **0** |
| 7 | [`investment_policy_decisions`](#investment_policy_decisions) | **Chưa định nghĩa tên tiếng Việt** | 12 | **0** |
| 8 | [`monthly_report_view`](#monthly_report_view) | **Chưa định nghĩa tên tiếng Việt** | 23 | **336** |

### 1. Quản lý Nhân sự & Phân quyền (Employees, Departments & RBAC)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`employees`](#employees) | **Nhân viên cơ quan** | 23 | `[Đang lấy dữ liệu]` |
| 2 | [`user_accounts`](#user_accounts) | **Tài khoản đăng nhập** | 9 | `[Đang lấy dữ liệu]` |
| 3 | [`user_permissions`](#user_permissions) | **Bảng phân quyền chi tiết của người dùng** | 7 | `[Đang lấy dữ liệu]` |
| 4 | [`role_permission_defaults`](#role_permission_defaults) | **Quyền mặc định của các nhóm vai trò** | 6 | `[Đang lấy dữ liệu]` |
| 5 | [`leadership_assignments`](#leadership_assignments) | **Phân công lãnh đạo phụ trách dự án** | 6 | `[Đang lấy dữ liệu]` |
| 6 | [`department_permission_rules`](#department_permission_rules) | **Quy tắc kiểm soát quyền theo phòng ban** | 5 | `[Đang lấy dữ liệu]` |
| 7 | [`departments`](#departments) | **Danh sách phòng ban chuyên môn** | 8 | `[Đang lấy dữ liệu]` |

### 2. Quản lý Dự án (Project Management)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`projects`](#projects) | **Thông tin dự án đầu tư xây dựng** | 108 | `[Đang lấy dữ liệu]` |
| 2 | [`project_members`](#project_members) | **Thành viên tham gia ban quản lý dự án** | 5 | `[Đang lấy dữ liệu]` |
| 3 | [`project_field_permissions`](#project_field_permissions) | **Phân quyền chỉnh sửa chi tiết các trường dữ liệu dự án** | 4 | `[Đang lấy dữ liệu]` |
| 4 | [`stage_transitions`](#stage_transitions) | **Nhật ký chuyển đổi giai đoạn dự án** | 8 | `[Đang lấy dữ liệu]` |
| 5 | [`stakeholder_types`](#stakeholder_types) | **Phân loại các bên liên quan** | 7 | `[Đang lấy dữ liệu]` |
| 6 | [`site_clearances`](#site_clearances) | **Thông tin tổng hợp giải phóng mặt bằng** | 11 | `[Đang lấy dữ liệu]` |
| 7 | [`site_clearance_milestones`](#site_clearance_milestones) | **Các mốc tiến độ giải phóng mặt bằng** | 9 | `[Đang lấy dữ liệu]` |

### 3. Kế hoạch & Tiến độ (Planning & Execution)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`project_plan_steps`](#project_plan_steps) | **Các bước kế hoạch tiến độ tổng thể dự án** | 21 | `[Đang lấy dữ liệu]` |
| 2 | [`project_plan_items`](#project_plan_items) | **Hạng mục kế hoạch công việc dự án** | 25 | `[Đang lấy dữ liệu]` |
| 3 | [`project_plan_raci`](#project_plan_raci) | **Phân công ma trận trách nhiệm RACI cho từng bước dự án** | 9 | `[Đang lấy dữ liệu]` |
| 4 | [`annual_plan_items`](#annual_plan_items) | **Hạng mục kế hoạch công tác năm** | 30 | `[Đang lấy dữ liệu]` |
| 5 | [`monthly_plans`](#monthly_plans) | **Danh mục kế hoạch công tác tháng (Thông tin chung)** | 15 | `[Đang lấy dữ liệu]` |
| 6 | [`monthly_plan_items`](#monthly_plan_items) | **Chi tiết các hạng mục kế hoạch công tác tháng** | 23 | `[Đang lấy dữ liệu]` |
| 7 | [`annual_evaluations`](#annual_evaluations) | **Thông tin đánh giá tổng kết cuối năm** | 24 | `[Đang lấy dữ liệu]` |

### 4. Gói thầu, Nhà thầu & Hợp đồng (Bidding, Contractors & Contracts)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`bidding_packages`](#bidding_packages) | **Thông tin các gói thầu của dự án** | 50 | `[Đang lấy dữ liệu]` |
| 2 | [`package_bidders`](#package_bidders) | **Nhà thầu tham dự thầu gói thầu** | 22 | `[Đang lấy dữ liệu]` |
| 3 | [`package_issues`](#package_issues) | **Các vấn đề/vướng mắc liên quan đến gói thầu** | 8 | `[Đang lấy dữ liệu]` |
| 4 | [`procurement_plans`](#procurement_plans) | **Kế hoạch lựa chọn nhà thầu** | 14 | `[Đang lấy dữ liệu]` |
| 5 | [`contractors`](#contractors) | **Danh sách các nhà thầu tham gia dự án** | 16 | `[Đang lấy dữ liệu]` |
| 6 | [`contractor_accounts`](#contractor_accounts) | **Tài khoản đăng nhập dành cho nhà thầu** | 9 | `[Đang lấy dữ liệu]` |
| 7 | [`contracts`](#contracts) | **Hợp đồng ký kết với nhà thầu** | 19 | `[Đang lấy dữ liệu]` |
| 8 | [`variation_orders`](#variation_orders) | **Phụ lục hợp đồng hoặc khối lượng phát sinh** | 9 | `[Đang lấy dữ liệu]` |

### 5. Quản lý Tài chính & Giải ngân (Finance, Capital & Disbursements)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`capital_plans`](#capital_plans) | **Kế hoạch vốn (kế hoạch trung hạn, năm)** | 18 | `[Đang lấy dữ liệu]` |
| 2 | [`disbursement_plans`](#disbursement_plans) | **Kế hoạch giải ngân chi tiết** | 8 | `[Đang lấy dữ liệu]` |
| 3 | [`disbursements`](#disbursements) | **Số liệu giải ngân thực tế** | 15 | `[Đang lấy dữ liệu]` |
| 4 | [`payments`](#payments) | **Yêu cầu thanh toán / Hồ sơ thanh toán** | 15 | `[Đang lấy dữ liệu]` |

### 6. Quản lý Công việc & Tương tác (Tasks & Collaboration)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`tasks`](#tasks) | **Nhiệm vụ, công việc giao cho nhân viên** | 44 | `[Đang lấy dữ liệu]` |
| 2 | [`sub_tasks`](#sub_tasks) | **Công việc con chi tiết** | 9 | `[Đang lấy dữ liệu]` |
| 3 | [`task_activities`](#task_activities) | **Lịch sử hoạt động cập nhật công việc** | 6 | `[Đang lấy dữ liệu]` |
| 4 | [`task_comments`](#task_comments) | **Thảo luận và ý kiến đóng góp cho công việc** | 7 | `[Đang lấy dữ liệu]` |
| 5 | [`task_weekly_updates`](#task_weekly_updates) | **Báo cáo cập nhật tiến độ công việc hàng tuần** | 12 | `[Đang lấy dữ liệu]` |

### 7. Quản lý Tài liệu & CDE (Common Data Environment)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`documents`](#documents) | **Văn bản, hồ sơ quản lý dự án** | 43 | `[Đang lấy dữ liệu]` |
| 2 | [`document_attachments`](#document_attachments) | **File đính kèm của hồ sơ/tài liệu** | 11 | `[Đang lấy dữ liệu]` |
| 3 | [`folders`](#folders) | **Cấu trúc thư mục quản lý hồ sơ chung** | 5 | `[Đang lấy dữ liệu]` |
| 4 | [`cde_folders`](#cde_folders) | **Cấu trúc thư mục trong môi trường dữ liệu chung CDE** | 12 | `[Đang lấy dữ liệu]` |
| 5 | [`cde_permissions`](#cde_permissions) | **Bảng phân quyền tài liệu CDE cho nhà thầu** | 7 | `[Đang lấy dữ liệu]` |
| 6 | [`cde_reviews`](#cde_reviews) | **Yêu cầu phê duyệt, đánh giá tài liệu trên CDE** | 10 | `[Đang lấy dữ liệu]` |
| 7 | [`cde_review_items`](#cde_review_items) | **Các file/tài liệu đính kèm yêu cầu đánh giá CDE** | 4 | `[Đang lấy dữ liệu]` |
| 8 | [`cde_review_approvers`](#cde_review_approvers) | **Danh sách người tham gia phê duyệt tài liệu CDE** | 9 | `[Đang lấy dữ liệu]` |
| 9 | [`cde_comments`](#cde_comments) | **Ý kiến thảo luận và ghi chú trên tài liệu CDE** | 8 | `[Đang lấy dữ liệu]` |
| 10 | [`cde_transmittals`](#cde_transmittals) | **Phiếu giao nhận hồ sơ, tài liệu CDE** | 16 | `[Đang lấy dữ liệu]` |
| 11 | [`cde_audit_log`](#cde_audit_log) | **Nhật ký kiểm toán hoạt động trên CDE** | 10 | `[Đang lấy dữ liệu]` |
| 12 | [`view_comments`](#view_comments) | **Ý kiến đóng góp khi xem tài liệu** | 9 | `[Đang lấy dữ liệu]` |

### 8. Quy trình Phê duyệt & Workflow Engine

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`workflows`](#workflows) | **Định nghĩa quy trình nghiệp vụ hệ thống** | 11 | `[Đang lấy dữ liệu]` |
| 2 | [`workflow_nodes`](#workflow_nodes) | **Các bước (nút) trong quy trình nghiệp vụ** | 14 | `[Đang lấy dữ liệu]` |
| 3 | [`workflow_edges`](#workflow_edges) | **Đường nối chuyển bước giữa các nút quy trình** | 6 | `[Đang lấy dữ liệu]` |
| 4 | [`workflow_instances`](#workflow_instances) | **Các lượt chạy quy trình nghiệp vụ thực tế** | 11 | `[Đang lấy dữ liệu]` |
| 5 | [`workflow_tasks`](#workflow_tasks) | **Nhiệm vụ phê duyệt trong lượt chạy quy trình** | 19 | `[Đang lấy dữ liệu]` |
| 6 | [`workflow_node_raci`](#workflow_node_raci) | **Thiết lập RACI mặc định cho từng bước quy trình** | 6 | `[Đang lấy dữ liệu]` |
| 7 | [`cde_workflow_instances`](#cde_workflow_instances) | **Quy trình phê duyệt tài liệu CDE** | 13 | `[Đang lấy dữ liệu]` |
| 8 | [`cde_workflow_step_records`](#cde_workflow_step_records) | **Nhật ký thực hiện từng bước quy trình CDE** | 13 | `[Đang lấy dữ liệu]` |
| 9 | [`cde_internal_workflow_instances`](#cde_internal_workflow_instances) | **Lượt chạy quy trình nghiệp vụ nội bộ CDE** | 17 | `[Đang lấy dữ liệu]` |
| 10 | [`cde_internal_workflow_step_records`](#cde_internal_workflow_step_records) | **Chi tiết bước xử lý quy trình nội bộ CDE** | 15 | `[Đang lấy dữ liệu]` |
| 11 | [`cde_workflow_history`](#cde_workflow_history) | **Lịch sử chung của quy trình CDE** | 11 | `[Đang lấy dữ liệu]` |

### 9. Thi công & Giám sát hiện trường (Construction & Site Supervision)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`construction_works`](#construction_works) | **Danh mục hạng mục công trình xây dựng** | 7 | `[Đang lấy dữ liệu]` |
| 2 | [`construction_logs`](#construction_logs) | **Nhật ký thi công hàng ngày** | 11 | `[Đang lấy dữ liệu]` |
| 3 | [`construction_log_details`](#construction_log_details) | **Chi tiết công việc thi công trong ngày** | 11 | `[Đang lấy dữ liệu]` |
| 4 | [`construction_manpower`](#construction_manpower) | **Báo cáo nhân lực thi công tại hiện trường** | 6 | `[Đang lấy dữ liệu]` |
| 5 | [`construction_equipment`](#construction_equipment) | **Báo cáo thiết bị thi công tại hiện trường** | 7 | `[Đang lấy dữ liệu]` |
| 6 | [`construction_progress`](#construction_progress) | **Sản lượng thi công thực tế** | 15 | `[Đang lấy dữ liệu]` |
| 7 | [`construction_site_photos`](#construction_site_photos) | **Hình ảnh nhật ký công trường thực tế** | 7 | `[Đang lấy dữ liệu]` |
| 8 | [`inspections`](#inspections) | **Biên bản kiểm tra và nghiệm thu công việc** | 21 | `[Đang lấy dữ liệu]` |
| 9 | [`material_mines`](#material_mines) | **Mỏ vật liệu xây dựng phục vụ dự án** | 10 | `[Đang lấy dữ liệu]` |

### 10. Mô hình thông tin công trình BIM (Building Information Modeling)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`bim_models`](#bim_models) | **Quản lý tệp tin mô hình 3D/BIM** | 23 | `[Đang lấy dữ liệu]` |
| 2 | [`bim_project_settings`](#bim_project_settings) | **Cấu hình toạ độ và thông số BIM dự án** | 3 | `[Đang lấy dữ liệu]` |
| 3 | [`bim_saved_views`](#bim_saved_views) | **Góc nhìn phối cảnh BIM được lưu trữ** | 9 | `[Đang lấy dữ liệu]` |
| 4 | [`bim_issues`](#bim_issues) | **Quản lý các vấn đề, va chạm trên mô hình BIM** | 22 | `[Đang lấy dữ liệu]` |
| 5 | [`bim_issue_comments`](#bim_issue_comments) | **Thảo luận và phản hồi vấn đề BIM** | 5 | `[Đang lấy dữ liệu]` |

### 11. Đánh giá KPI & Điểm số tháng (KPIs & Monthly Scores)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`individual_monthly_scores`](#individual_monthly_scores) | **Bảng điểm KPI đánh giá cá nhân theo tháng** | 39 | `[Đang lấy dữ liệu]` |
| 2 | [`individual_project_disbursement`](#individual_project_disbursement) | **Chi tiết điểm giải ngân dự án của cá nhân** | 8 | `[Đang lấy dữ liệu]` |
| 3 | [`department_monthly_scores`](#department_monthly_scores) | **Bảng điểm đánh giá phòng ban theo tháng** | 36 | `[Đang lấy dữ liệu]` |
| 4 | [`evaluation_forms`](#evaluation_forms) | **Mẫu đánh giá KPI tiêu chuẩn** | 34 | `[Đang lấy dữ liệu]` |

### 12. Quản lý Tài sản công (Public Asset Management)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`public_assets`](#public_assets) | **Danh sách tài sản công được quản lý** | 23 | `[Đang lấy dữ liệu]` |
| 2 | [`public_asset_categories`](#public_asset_categories) | **Danh mục nhóm tài sản công** | 8 | `[Đang lấy dữ liệu]` |
| 3 | [`public_asset_inventories`](#public_asset_inventories) | **Phiếu kiểm kê tài sản công định kỳ** | 7 | `[Đang lấy dữ liệu]` |
| 4 | [`public_asset_inventory_details`](#public_asset_inventory_details) | **Chi tiết kết quả kiểm kê tài sản công** | 8 | `[Đang lấy dữ liệu]` |
| 5 | [`public_asset_transactions`](#public_asset_transactions) | **Lịch sử biến động, điều chuyển tài sản công** | 12 | `[Đang lấy dữ liệu]` |

### 13. Văn bản Pháp luật & Quy chế nội bộ (Legal & Regulations)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`legal_documents`](#legal_documents) | **Văn bản pháp luật, quy chuẩn nhà nước** | 18 | `[Đang lấy dữ liệu]` |
| 2 | [`legal_chapters`](#legal_chapters) | **Chương trong văn bản pháp luật** | 5 | `[Đang lấy dữ liệu]` |
| 3 | [`legal_articles`](#legal_articles) | **Điều khoản cụ thể trong văn bản pháp luật** | 10 | `[Đang lấy dữ liệu]` |
| 4 | [`regulations`](#regulations) | **Quy định, quy chế nội bộ cơ quan** | 10 | `[Đang lấy dữ liệu]` |
| 5 | [`regulation_documents`](#regulation_documents) | **Tài liệu đính kèm quy chế nội bộ** | 11 | `[Đang lấy dữ liệu]` |
| 6 | [`regulation_chapters`](#regulation_chapters) | **Chương của quy định nội bộ** | 8 | `[Đang lấy dữ liệu]` |
| 7 | [`regulation_articles`](#regulation_articles) | **Điều khoản cụ thể của quy định nội bộ** | 10 | `[Đang lấy dữ liệu]` |
| 8 | [`regulation_bookmarks`](#regulation_bookmarks) | **Danh sách điều khoản quy định được lưu đánh dấu** | 5 | `[Đang lấy dữ liệu]` |

### 14. Hệ thống & Khác (System & Utilities)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`audit_logs`](#audit_logs) | **Nhật ký hoạt động chung toàn hệ thống** | 8 | `[Đang lấy dữ liệu]` |
| 2 | [`notifications`](#notifications) | **Thông báo gửi đến người dùng** | 8 | `[Đang lấy dữ liệu]` |
| 3 | [`user_preferences`](#user_preferences) | **Cấu hình tùy chọn hiển thị cá nhân** | 6 | `[Đang lấy dữ liệu]` |
| 4 | [`sidebar_module_config`](#sidebar_module_config) | **Cấu hình hiển thị menu chức năng sidebar** | 5 | `[Đang lấy dữ liệu]` |
| 5 | [`update_compliance_log`](#update_compliance_log) | **Nhật ký cập nhật tuân thủ quy định** | 5 | `[Đang lấy dữ liệu]` |

### 15. Các bảng bổ sung khác (Other Tables)

| STT | Tên bảng vật lý | Tên nghiệp vụ (Giải thích Tiếng Việt) | Số cột | Số dòng hiện tại |
|---|---|---|---|---|
| 1 | [`agency_event_attendees`](#agency_event_attendees) | **Chưa định nghĩa tên tiếng Việt** | 4 | `[Đang lấy dữ liệu]` |
| 2 | [`agency_events`](#agency_events) | **Chưa định nghĩa tên tiếng Việt** | 13 | `[Đang lấy dữ liệu]` |
| 3 | [`cde_items_view`](#cde_items_view) | **Chưa định nghĩa tên tiếng Việt** | 29 | `[Đang lấy dữ liệu]` |
| 4 | [`cde_project_stats_view`](#cde_project_stats_view) | **Chưa định nghĩa tên tiếng Việt** | 7 | `[Đang lấy dữ liệu]` |
| 5 | [`facility_assets`](#facility_assets) | **Chưa định nghĩa tên tiếng Việt** | 19 | `[Đang lấy dữ liệu]` |
| 6 | [`feasibility_studies`](#feasibility_studies) | **Chưa định nghĩa tên tiếng Việt** | 13 | `[Đang lấy dữ liệu]` |
| 7 | [`investment_policy_decisions`](#investment_policy_decisions) | **Chưa định nghĩa tên tiếng Việt** | 12 | `[Đang lấy dữ liệu]` |
| 8 | [`monthly_report_view`](#monthly_report_view) | **Chưa định nghĩa tên tiếng Việt** | 23 | `[Đang lấy dữ liệu]` |

## III. Cấu trúc Chi tiết và Ví dụ Dữ liệu từng Bảng

Dưới đây là chi tiết các trường thông tin của các bảng cùng dữ liệu mẫu thực tế được trích xuất từ cơ sở dữ liệu.

### 1. Quản lý Nhân sự & Phân quyền (Employees, Departments & RBAC)

#### <a id="employees"></a> 1. `employees` (Nhân viên cơ quan)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `employee_id` | `text` | `NO` | `` |
| 2 | `full_name` | `text` | `NO` | `` |
| 3 | `email` | `text` | `YES` | `` |
| 4 | `phone` | `text` | `YES` | `` |
| 5 | `position` | `text` | `YES` | `` |
| 6 | `department` | `text` | `YES` | `` |
| 7 | `role` | `text` | `NO` | `'User'::text` |
| 8 | `status` | `integer` | `NO` | `1` |
| 9 | `avatar_url` | `text` | `YES` | `` |
| 10 | `join_date` | `text` | `YES` | `` |
| 11 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 13 | `gender` | `text` | `YES` | `` |
| 14 | `managed_unit_ids` | `ARRAY` | `YES` | `` |
| 15 | `management_rank` | `integer` | `YES` | `` |
| 16 | `job_content` | `text` | `YES` | `` |
| 17 | `completion_criteria` | `text` | `YES` | `` |
| 18 | `system_role` | `text` | `YES` | `` |
| 19 | `date_of_birth` | `date` | `YES` | `` |
| 20 | `permanent_address` | `text` | `YES` | `` |
| 21 | `specialty` | `text` | `YES` | `` |
| 22 | `political_theory` | `text` | `YES` | `` |
| 23 | `tenure_info` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "employee_id": "NV105",
  "full_name": "Trần Khắc Tiến",
  "email": "tientk.ddht@gmail.com",
  "phone": "0900000105",
  "position": "Chuyên viên",
  "department": "Phòng Quản lý dự án 3",
  "role": "staff",
  "status": 1,
  "avatar_url": null,
  "join_date": "2025-01-01",
  "created_at": "2026-05-09T07:41:46.819Z",
  "updated_at": "2026-05-09T07:41:46.819Z",
  "gender": null,
  "managed_unit_ids": null,
  "management_rank": null,
  "job_content": "Thực hiện nhiệm vụ chuyên môn nghiệp vụ về quản lý dự án đầu tư xây dựng được cấp có thẩm quyền giao, gồm quản lý về phạm vi, kế hoạch công việc; khối lượng công việc; chất lượng xây dựng; tiến độ xây dựng; chi phí đầu tư xây dựng; an toàn; bảo vệ môi trường; lựa chọn nhà thầu và hợp đồng xây dựng; quản lý rủi ro; quản lý hệ thống thông tin công trình và một số công việc khác theo chức năng, nhiệm vụ, quyền hạn của đơn vị sự nghiệp.\nTham gia thực hiện các nhiệm vụ khai thác, quản lý vận hành, bảo trì, bảo dưỡng, nâng cấp, cải tạo, sửa chữa các công trình xây dựng theo chức năng, nhiệm vụ của đơn vị.\nTham gia nghiên cứu, đề xuất, xây dựng các chủ trương, chính sách, định hướng, kế hoạch phát triển và ứng dụng khoa học công nghệ trong hoạt động quản lý dự án đầu tư xây dựng.\nTham gia nghiên cứu, xây dựng quy chế, hướng dẫn chuyên môn về quản lý dự án đầu tư xây dựng.\nTham gia nghiên cứu đề tài, đề án, các công trình nghiên cứu khoa học nhằm đổi mới, hoàn thiện cơ chế quản lý, nâng cao hiệu lực, hiệu quả hoạt động quản lý dự án đầu tư xây dựng.\nTham gia chuẩn bị nội dung cho các cuộc hội thảo chuyên môn, nghiệp vụ.\nTham gia biên soạn, biên tập các tài liệu, giáo trình hướng dẫn chuyên môn, nghiệp vụ trong quản lý dự án đầu tư xây dựng công trình.\nXây dựng và thực hiện kế hoạch công tác năm, quý, tháng, tuần của cá nhân.\nThực hiện các nhiệm vụ khác do cấp có thẩm quyền giao.",
  "completion_criteria": "Các nhiệm vụ, sản phẩm đảm bảo chất lượng, tiến độ.\nCác nhiệm vụ, sản phẩm đảm bảo chất lượng, tiến độ.\nCác văn bản được cấp có thẩm quyền ban hành, báo cáo thực hiện đảm bảo chất lượng, tiến độ.\nCác sản phẩm đảm bảo chất lượng, tiến độ.\nSản phẩm đề tài, dự án được nghiệm thu, áp dụng đảm bảo chất lượng, tiến độ.\nTham dự đầy đủ, tiếp thu, trao đổi thông tin, triển khai thực hiện theo kết luận cuộc họp.\nGiáo trình, tài liệu hướng dẫn nghiệp vụ chuyên môn và dùng để đào tạo, bồi dưỡng.\nXây dựng, thực hiện kế hoạch theo đúng kế hoạch công tác của đơn vị, cơ quan và nhiệm vụ được giao.",
  "system_role": null,
  "date_of_birth": null,
  "permanent_address": null,
  "specialty": null,
  "political_theory": null,
  "tenure_info": null
}
```

---

#### <a id="user_accounts"></a> 2. `user_accounts` (Tài khoản đăng nhập)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `account_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `employee_id` | `text` | `YES` | `` |
| 3 | `username` | `text` | `NO` | `` |
| 4 | `password_hash` | `text` | `NO` | `'123456'::text` |
| 5 | `is_active` | `boolean` | `NO` | `true` |
| 6 | `last_login` | `timestamp with time zone` | `YES` | `` |
| 7 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 8 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 9 | `auth_user_id` | `uuid` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "account_id": "8b8662b0-a434-45cf-aa5a-947b4fdf108b",
  "employee_id": "NV055",
  "username": "nguyenduylinh",
  "password_hash": "e6d999fdf72033cbb091f1e8039639d83003762f9876cc2bd5a48b89bf97c5b1",
  "is_active": true,
  "last_login": "2026-06-04T02:58:46.879Z",
  "created_at": "2026-05-14T13:28:40.713Z",
  "updated_at": "2026-06-04T02:59:16.772Z",
  "auth_user_id": "fcee0de5-a4c5-4c08-8425-08cdc0a20885"
}
```

---

#### <a id="user_permissions"></a> 3. `user_permissions` (Bảng phân quyền chi tiết của người dùng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `user_id` | `text` | `NO` | `` |
| 3 | `resource` | `text` | `NO` | `` |
| 4 | `actions` | `ARRAY` | `NO` | `'{}'::text[]` |
| 5 | `created_by` | `text` | `YES` | `` |
| 6 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 7 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "64ea8ccd-d305-4b14-9876-1d3b659a2281",
  "user_id": "NV019",
  "resource": "dashboard",
  "actions": [
    "view"
  ],
  "created_by": null,
  "created_at": "2026-05-15T03:57:01.201Z",
  "updated_at": "2026-05-15T03:57:00.155Z"
}
```

---

#### <a id="role_permission_defaults"></a> 4. `role_permission_defaults` (Quyền mặc định của các nhóm vai trò)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `role` | `text` | `NO` | `` |
| 3 | `resource` | `text` | `NO` | `` |
| 4 | `actions` | `jsonb` | `NO` | `'[]'::jsonb` |
| 5 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 6 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "7f640df0-ebf7-4ed1-ba0a-960a4d16bc3d",
  "role": "super_admin",
  "resource": "dashboard",
  "actions": [
    "view",
    "export"
  ],
  "created_at": "2026-05-15T02:36:16.776Z",
  "updated_at": "2026-05-15T02:36:16.776Z"
}
```

---

#### <a id="leadership_assignments"></a> 5. `leadership_assignments` (Phân công lãnh đạo phụ trách dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `deputy_employee_id` | `text` | `NO` | `` |
| 3 | `board_number` | `integer` | `NO` | `` |
| 4 | `created_by` | `text` | `YES` | `` |
| 5 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 6 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "2b9bc13d-8d02-4f3a-90e5-a14517bccc84",
  "deputy_employee_id": "NV003",
  "board_number": 1,
  "created_by": null,
  "created_at": "2026-06-04T14:03:19.869Z",
  "updated_at": "2026-06-04T14:03:19.869Z"
}
```

---

#### <a id="department_permission_rules"></a> 6. `department_permission_rules` (Quy tắc kiểm soát quyền theo phòng ban)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `resource` | `text` | `NO` | `` |
| 2 | `action` | `text` | `NO` | `` |
| 3 | `allowed_departments` | `ARRAY` | `NO` | `'{}'::text[]` |
| 4 | `note` | `text` | `YES` | `` |
| 5 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "resource": "projects",
  "action": "create",
  "allowed_departments": [
    "Phòng Kế hoạch – Đấu thầu"
  ],
  "note": "Chỉ Chuyên viên phòng KH-ĐT được tạo dự án (Mục 3.3)",
  "updated_at": "2026-06-04T14:02:26.847Z"
}
```

---

#### <a id="departments"></a> 7. `departments` (Danh sách phòng ban chuyên môn)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `code` | `text` | `NO` | `` |
| 2 | `name` | `text` | `NO` | `` |
| 3 | `name_aliases` | `ARRAY` | `NO` | `ARRAY[]::text[]` |
| 4 | `is_global_scope` | `boolean` | `NO` | `false` |
| 5 | `sort_order` | `integer` | `NO` | `0` |
| 6 | `is_active` | `boolean` | `NO` | `true` |
| 7 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 8 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "code": "BGD",
  "name": "Ban Giám đốc",
  "name_aliases": [
    "Ban Giám đốc"
  ],
  "is_global_scope": true,
  "sort_order": 1,
  "is_active": true,
  "created_at": "2026-06-04T15:39:51.746Z",
  "updated_at": "2026-06-04T15:39:51.746Z"
}
```

---

### 2. Quản lý Dự án (Project Management)

#### <a id="projects"></a> 8. `projects` (Thông tin dự án đầu tư xây dựng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `project_id` | `text` | `NO` | `` |
| 2 | `project_name` | `text` | `NO` | `` |
| 3 | `project_number` | `text` | `YES` | `` |
| 4 | `group_code` | `text` | `NO` | `'C'::text` |
| 5 | `investment_type` | `integer` | `NO` | `1` |
| 6 | `total_investment` | `numeric` | `NO` | `0` |
| 7 | `capital_source` | `text` | `YES` | `` |
| 8 | `status` | `integer` | `NO` | `0` |
| 9 | `progress` | `numeric` | `YES` | `0` |
| 10 | `payment_progress` | `numeric` | `YES` | `0` |
| 11 | `start_date` | `text` | `YES` | `` |
| 12 | `expected_end_date` | `text` | `YES` | `` |
| 13 | `actual_end_date` | `text` | `YES` | `` |
| 14 | `location_code` | `text` | `YES` | `` |
| 15 | `sector` | `text` | `YES` | `` |
| 16 | `stage` | `text` | `YES` | `` |
| 17 | `duration` | `text` | `YES` | `` |
| 18 | `objective` | `text` | `YES` | `` |
| 19 | `decision_number` | `text` | `YES` | `` |
| 20 | `decision_date` | `text` | `YES` | `` |
| 21 | `decision_authority` | `text` | `YES` | `` |
| 22 | `decision_maker_id` | `text` | `YES` | `` |
| 23 | `approval_date` | `text` | `YES` | `` |
| 24 | `competent_authority` | `text` | `YES` | `` |
| 25 | `investor_name` | `text` | `YES` | `` |
| 26 | `management_form` | `text` | `YES` | `` |
| 27 | `construction_type` | `text` | `YES` | `` |
| 28 | `construction_grade` | `text` | `YES` | `` |
| 29 | `applicable_standards` | `text` | `YES` | `` |
| 30 | `is_emergency` | `boolean` | `NO` | `false` |
| 31 | `is_oda` | `boolean` | `YES` | `false` |
| 32 | `requires_bim` | `boolean` | `YES` | `false` |
| 33 | `bim_status` | `text` | `YES` | `` |
| 34 | `cde_project_code` | `text` | `YES` | `` |
| 35 | `national_project_code` | `text` | `YES` | `` |
| 36 | `is_synced` | `boolean` | `YES` | `false` |
| 37 | `last_sync_date` | `text` | `YES` | `` |
| 38 | `sync_error` | `text` | `YES` | `` |
| 39 | `coordinates` | `jsonb` | `YES` | `` |
| 40 | `image_url` | `text` | `YES` | `` |
| 41 | `version` | `text` | `YES` | `` |
| 42 | `main_contractor_name` | `text` | `YES` | `` |
| 43 | `design_contractor` | `text` | `YES` | `` |
| 44 | `supervision_contractor` | `text` | `YES` | `` |
| 45 | `survey_contractor` | `text` | `YES` | `` |
| 46 | `feasibility_contractor` | `text` | `YES` | `` |
| 47 | `review_contractor` | `text` | `YES` | `` |
| 48 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 49 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 50 | `total_estimate` | `numeric` | `YES` | `0` |
| 51 | `site_area` | `numeric` | `YES` | `0` |
| 52 | `construction_area` | `numeric` | `YES` | `0` |
| 53 | `floor_area` | `numeric` | `YES` | `0` |
| 54 | `building_height` | `numeric` | `YES` | `0` |
| 55 | `building_density` | `numeric` | `YES` | `0` |
| 56 | `land_use_coefficient` | `numeric` | `YES` | `0` |
| 57 | `above_ground_floors` | `integer` | `YES` | `0` |
| 58 | `basement_floors` | `integer` | `YES` | `0` |
| 59 | `investment_scale` | `text` | `YES` | `` |
| 60 | `management_board` | `integer` | `YES` | `` |
| 61 | `decision_level_before_handover` | `text` | `YES` | `` |
| 62 | `old_investor` | `text` | `YES` | `` |
| 63 | `transfer_decision` | `text` | `YES` | `` |
| 64 | `current_status_code` | `integer` | `YES` | `` |
| 65 | `policy_decision_level` | `text` | `YES` | `` |
| 66 | `policy_decision_number` | `text` | `YES` | `` |
| 67 | `policy_decision_date` | `date` | `YES` | `` |
| 68 | `policy_decision_authority` | `text` | `YES` | `` |
| 69 | `bidding_form` | `text` | `YES` | `` |
| 70 | `khv_info` | `jsonb` | `YES` | `'{}'::jsonb` |
| 71 | `implementation_tracking` | `jsonb` | `YES` | `'{}'::jsonb` |
| 72 | `adjusted_approval` | `jsonb` | `YES` | `'{}'::jsonb` |
| 73 | `contractor_details` | `jsonb` | `YES` | `'{}'::jsonb` |
| 74 | `project_management` | `jsonb` | `YES` | `'{}'::jsonb` |
| 75 | `project_status_info` | `jsonb` | `YES` | `'{}'::jsonb` |
| 76 | `budget_allocations` | `jsonb` | `YES` | `` |
| 77 | `planning_approval_number` | `text` | `YES` | `` |
| 78 | `planning_approval_date` | `date` | `YES` | `` |
| 79 | `pccc_approval_number` | `text` | `YES` | `` |
| 80 | `pccc_approval_date` | `date` | `YES` | `` |
| 81 | `pccc_approval_agency` | `text` | `YES` | `` |
| 82 | `env_approval_number` | `text` | `YES` | `` |
| 83 | `env_approval_date` | `date` | `YES` | `` |
| 84 | `env_approval_type` | `text` | `YES` | `` |
| 85 | `appraisal_result_number` | `text` | `YES` | `` |
| 86 | `appraisal_result_date` | `date` | `YES` | `` |
| 87 | `appraisal_agency` | `text` | `YES` | `` |
| 88 | `cost_breakdown` | `jsonb` | `YES` | `'{}'::jsonb` |
| 89 | `design_appraisal_number` | `text` | `YES` | `` |
| 90 | `design_appraisal_date` | `date` | `YES` | `` |
| 91 | `design_approval_number` | `text` | `YES` | `` |
| 92 | `design_approval_date` | `date` | `YES` | `` |
| 93 | `design_approval_authority` | `text` | `YES` | `` |
| 94 | `construction_permit_number` | `text` | `YES` | `` |
| 95 | `construction_permit_date` | `date` | `YES` | `` |
| 96 | `construction_permit_agency` | `text` | `YES` | `` |
| 97 | `actual_start_date_construction` | `date` | `YES` | `` |
| 98 | `insurance_contract` | `text` | `YES` | `` |
| 99 | `insurance_value` | `numeric` | `YES` | `` |
| 100 | `acceptance_result` | `text` | `YES` | `` |
| 101 | `acceptance_date` | `date` | `YES` | `` |
| 102 | `handover_date` | `date` | `YES` | `` |
| 103 | `tt24_completion_pct` | `numeric` | `YES` | `` |
| 104 | `province_code` | `text` | `YES` | `` |
| 105 | `specialty_type` | `text` | `YES` | `` |
| 106 | `specialty_details` | `text` | `YES` | `` |
| 107 | `leader_comment` | `text` | `YES` | `` |
| 108 | `created_by` | `uuid` | `YES` | `auth.uid()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "project_id": "8156067",
  "project_name": "Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 2)…",
  "project_number": null,
  "group_code": "C",
  "investment_type": 1,
  "total_investment": "90000000000",
  "capital_source": null,
  "status": 1,
  "progress": "0",
  "payment_progress": "0",
  "start_date": null,
  "expected_end_date": null,
  "actual_end_date": null,
  "location_code": null,
  "sector": null,
  "stage": null,
  "duration": "2025-2027",
  "objective": null,
  "decision_number": "1947/QĐ-UBND ngày 05/6/2025",
  "decision_date": null,
  "decision_authority": null,
  "decision_maker_id": null,
  "approval_date": null,
  "competent_authority": null,
  "investor_name": null,
  "management_form": null,
  "construction_type": null,
  "construction_grade": null,
  "applicable_standards": null,
  "is_emergency": false,
  "is_oda": false,
  "requires_bim": false,
  "bim_status": null,
  "cde_project_code": null,
  "national_project_code": "8156067",
  "is_synced": false,
  "last_sync_date": null,
  "sync_error": null,
  "coordinates": {
    "lat": 18.38757,
    "lng": 105.77632
  },
  "image_url": null,
  "version": null,
  "main_contractor_name": null,
  "design_contractor": null,
  "supervision_contractor": null,
  "survey_contractor": null,
  "feasibility_contractor": null,
  "review_contractor": null,
  "created_at": "2026-05-09T09:28:45.794Z",
  "updated_at": "2026-05-10T05:11:41.408Z",
  "total_estimate": "0",
  "site_area": "0",
  "construction_area": "0",
  "floor_area": "0",
  "building_height": "0",
  "building_density": "0",
  "land_use_coefficient": "0",
  "above_ground_floors": 0,
  "basement_floors": 0,
  "investment_scale": "Nâng cấp, mở rộng đường Thị - Sơn, huyện Can Lộc (giai đoạn 2) với tổng chiều dài 6.392,97m; có điểm đầu đấu nối tuyến đường Thị Sơn đã được đầu tư trong giai đoạn 1 tại Km0+993,44; điểm cuối giao với đường Quốc lộ 15B tại Km6+120.",
  "management_board": 2,
  "decision_level_before_handover": "H",
  "old_investor": "Huyện Can Lộc",
  "transfer_decision": "số 1947/QĐ-UBND ngày 05/06/2025; UBND huyện Can Lộc",
  "current_status_code": 3,
  "policy_decision_level": null,
  "policy_decision_number": null,
  "policy_decision_date": null,
  "policy_decision_authority": null,
  "bidding_form": null,
  "khv_info": {
    "total": 1000000000
  },
  "implementation_tracking": {
    "volumeRate": 0,
    "totalVolume": 0,
    "totalDisbursed": 500000000
  },
  "adjusted_approval": {
    "chu_truong_dau_tu": {
      "quyet_dinh": "số 1947/QĐ-UBND ngày 05/06/2025; UBND huyện Can Lộc"
    },
    "quyet_dinh_dau_tu": {
      "quyet_dinh": null
    },
    "dieu_chinh_du_an_hop_dong": null
  },
  "contractor_details": {},
  "project_management": {
    "ban_tiep_nhan": "Ban QLDA ĐTXD công trình dân dụng và Hạ tầng khu vực tỉnh",
    "ho_so_ban_giao": "Đầy đủ",
    "thoi_diem_ban_giao": "2025-07-01",
    "gia_tri_khoi_luong_ban_giao": 0
  },
  "project_status_info": {
    "cham_tien_do": {
      "nguyen_nhan": null,
      "kien_nghi_de_xuat": null,
      "thoi_gian_hoan_thanh": null,
      "dieu_chinh_du_an_hop_dong": null
    },
    "validation_errors": [],
    "ton_tai_vuong_mac_ban_giao": null,
    "tinh_trang_quyet_toan_sau_ban_giao": null
  },
  "budget_allocations": {
    "LuyKeNguonVonDen31_12_2025": 500000000
  },
  "planning_approval_number": null,
  "planning_approval_date": null,
  "pccc_approval_number": null,
  "pccc_approval_date": null,
  "pccc_approval_agency": null,
  "env_approval_number": null,
  "env_approval_date": null,
  "env_approval_type": null,
  "appraisal_result_number": null,
  "appraisal_result_date": null,
  "appraisal_agency": null,
  "cost_breakdown": {},
  "design_appraisal_number": null,
  "design_appraisal_date": null,
  "design_approval_number": null,
  "design_approval_date": null,
  "design_approval_authority": null,
  "construction_permit_number": null,
  "construction_permit_date": null,
  "construction_permit_agency": null,
  "actual_start_date_construction": null,
  "insurance_contract": null,
  "insurance_value": null,
  "acceptance_result": null,
  "acceptance_date": null,
  "handover_date": "2025-06-30T17:00:00.000Z",
  "tt24_completion_pct": null,
  "province_code": null,
  "specialty_type": "transport_urban",
  "specialty_details": "Cầu, đường bộ",
  "leader_comment": null,
  "created_by": "e74c0f20-d143-4b5c-bc88-dac4257140d0"
}
```

---

#### <a id="project_members"></a> 9. `project_members` (Thành viên tham gia ban quản lý dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `employee_id` | `text` | `NO` | `` |
| 4 | `role` | `text` | `YES` | `` |
| 5 | `joined_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "5ec6de2c-2d9c-4af7-9186-7800b2098bbc",
  "project_id": "8156067",
  "employee_id": "NV014",
  "role": "Kế toán phụ trách",
  "joined_at": "2026-05-09T09:28:47.544Z"
}
```

---

#### <a id="project_field_permissions"></a> 10. `project_field_permissions` (Phân quyền chỉnh sửa chi tiết các trường dữ liệu dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `member_role` | `text` | `NO` | `` |
| 2 | `field_key` | `text` | `NO` | `` |
| 3 | `can_edit` | `boolean` | `NO` | `true` |
| 4 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "member_role": "Giám đốc dự án",
  "field_key": "project_name",
  "can_edit": false,
  "updated_at": "2026-06-05T06:36:00.936Z"
}
```

---

#### <a id="stage_transitions"></a> 11. `stage_transitions` (Nhật ký chuyển đổi giai đoạn dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `stage` | `text` | `NO` | `` |
| 4 | `start_date` | `text` | `NO` | `(now())::text` |
| 5 | `end_date` | `text` | `YES` | `` |
| 6 | `decision_number` | `text` | `YES` | `` |
| 7 | `decision_date` | `text` | `YES` | `` |
| 8 | `notes` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="stakeholder_types"></a> 12. `stakeholder_types` (Phân loại các bên liên quan)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `code` | `character varying` | `NO` | `` |
| 2 | `name` | `character varying` | `NO` | `` |
| 3 | `category` | `character varying` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `` |
| 5 | `default_sort_order` | `integer` | `YES` | `0` |
| 6 | `is_active` | `boolean` | `YES` | `true` |
| 7 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "code": "BQL",
  "name": "Ban QLDA (Ban Giám đốc)",
  "category": "owner",
  "description": null,
  "default_sort_order": 1,
  "is_active": true,
  "created_at": "2026-05-24T02:19:36.678Z"
}
```

---

#### <a id="site_clearances"></a> 13. `site_clearances` (Thông tin tổng hợp giải phóng mặt bằng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `uuid_generate_v4()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `total_area` | `numeric` | `YES` | `0` |
| 4 | `cleared_area` | `numeric` | `YES` | `0` |
| 5 | `total_households` | `integer` | `YES` | `0` |
| 6 | `resettled_households` | `integer` | `YES` | `0` |
| 7 | `compensation_budget` | `numeric` | `YES` | `0` |
| 8 | `disbursed_compensation` | `numeric` | `YES` | `0` |
| 9 | `status` | `text` | `YES` | `'Chưa bắt đầu'::text` |
| 10 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "a83b44d4-5871-4616-8410-87003a4fbd57",
  "project_id": "7535585",
  "total_area": "12.50",
  "cleared_area": "8.20",
  "total_households": 45,
  "resettled_households": 30,
  "compensation_budget": "15000000000.00",
  "disbursed_compensation": "9500000000.00",
  "status": "Đang thực hiện",
  "created_at": "2026-05-12T16:25:09.619Z",
  "updated_at": "2026-05-12T16:25:09.619Z"
}
```

---

#### <a id="site_clearance_milestones"></a> 14. `site_clearance_milestones` (Các mốc tiến độ giải phóng mặt bằng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `uuid_generate_v4()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `step_number` | `integer` | `NO` | `` |
| 4 | `step_name` | `text` | `NO` | `` |
| 5 | `status` | `text` | `YES` | `'pending'::text` |
| 6 | `completed_date` | `date` | `YES` | `` |
| 7 | `notes` | `text` | `YES` | `` |
| 8 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "4446c806-49c0-4244-b419-91e75207e272",
  "project_id": "7535585",
  "step_number": 1,
  "step_name": "Thành lập Hội đồng bồi thường, hỗ trợ, tái định cư",
  "status": "completed",
  "completed_date": "2025-01-14T17:00:00.000Z",
  "notes": "Đã có QĐ thành lập HĐ GPMB",
  "created_at": "2026-05-12T16:25:09.619Z",
  "updated_at": "2026-05-12T16:25:09.619Z"
}
```

---

### 3. Kế hoạch & Tiến độ (Planning & Execution)

#### <a id="project_plan_steps"></a> 15. `project_plan_steps` (Các bước kế hoạch tiến độ tổng thể dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `workflow_instance_id` | `uuid` | `YES` | `` |
| 4 | `workflow_node_id` | `uuid` | `YES` | `` |
| 5 | `workflow_id` | `uuid` | `YES` | `` |
| 6 | `step_order` | `integer` | `NO` | `0` |
| 7 | `step_code` | `character varying` | `YES` | `` |
| 8 | `phase` | `character varying` | `YES` | `'preparation'::character varying` |
| 9 | `step_name` | `text` | `NO` | `` |
| 10 | `legal_basis` | `text` | `YES` | `` |
| 11 | `output_document` | `text` | `YES` | `` |
| 12 | `start_date` | `date` | `YES` | `` |
| 13 | `due_date` | `date` | `YES` | `` |
| 14 | `duration_days` | `integer` | `YES` | `` |
| 15 | `status` | `character varying` | `NO` | `'planned'::character varying` |
| 16 | `completion_result` | `text` | `YES` | `` |
| 17 | `incomplete_reason` | `text` | `YES` | `` |
| 18 | `notes` | `text` | `YES` | `` |
| 19 | `sort_order` | `integer` | `YES` | `0` |
| 20 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 21 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "bfaaff24-fbee-4823-90f0-f9021f71cb38",
  "project_id": "8062923",
  "workflow_instance_id": null,
  "workflow_node_id": null,
  "workflow_id": null,
  "step_order": 5,
  "step_code": "2.1",
  "phase": "execution",
  "step_name": "Khảo sát, lập thiết kế bản vẽ thi công và dự toán",
  "legal_basis": null,
  "output_document": null,
  "start_date": "2026-05-03T17:00:00.000Z",
  "due_date": "2026-05-28T17:00:00.000Z",
  "duration_days": null,
  "status": "completed",
  "completion_result": null,
  "incomplete_reason": null,
  "notes": null,
  "sort_order": 0,
  "created_at": "2026-05-26T05:15:43.352Z",
  "updated_at": "2026-05-26T05:15:43.352Z"
}
```

---

#### <a id="project_plan_items"></a> 16. `project_plan_items` (Hạng mục kế hoạch công việc dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `workflow_id` | `uuid` | `YES` | `` |
| 4 | `workflow_node_id` | `uuid` | `YES` | `` |
| 5 | `step_code` | `text` | `YES` | `` |
| 6 | `step_order` | `integer` | `NO` | `0` |
| 7 | `phase` | `text` | `YES` | `` |
| 8 | `task_name` | `text` | `NO` | `` |
| 9 | `deliverable` | `text` | `YES` | `` |
| 10 | `legal_basis` | `text` | `YES` | `` |
| 11 | `output_document` | `text` | `YES` | `` |
| 12 | `assignee_role` | `text` | `YES` | `` |
| 13 | `collaborating_dept_codes` | `ARRAY` | `NO` | `'{}'::character varying[]` |
| 14 | `collaborating_text` | `text` | `YES` | `` |
| 15 | `start_date` | `date` | `YES` | `` |
| 16 | `due_date` | `date` | `YES` | `` |
| 17 | `duration_days` | `integer` | `YES` | `` |
| 18 | `status` | `text` | `NO` | `'planned'::text` |
| 19 | `completion_result` | `text` | `YES` | `` |
| 20 | `incomplete_reason` | `text` | `YES` | `` |
| 21 | `notes` | `text` | `YES` | `` |
| 22 | `sort_order` | `integer` | `NO` | `0` |
| 23 | `created_by` | `uuid` | `YES` | `` |
| 24 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 25 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "efbf0967-a48a-4023-806b-3a42c56b8a0b",
  "project_id": "8133114",
  "workflow_id": null,
  "workflow_node_id": null,
  "step_code": "46b4ca1d-8792-4b0c-8cc8-e33c4feb1fe2",
  "step_order": 15,
  "phase": null,
  "task_name": "Bước 46b4ca1d-8792-4b0c-8cc8-e33c4feb1fe2",
  "deliverable": null,
  "legal_basis": null,
  "output_document": null,
  "assignee_role": null,
  "collaborating_dept_codes": [],
  "collaborating_text": null,
  "start_date": null,
  "due_date": null,
  "duration_days": null,
  "status": "planned",
  "completion_result": null,
  "incomplete_reason": null,
  "notes": null,
  "sort_order": 0,
  "created_by": null,
  "created_at": "2026-05-23T09:07:09.885Z",
  "updated_at": "2026-05-23T09:07:09.885Z"
}
```

---

#### <a id="project_plan_raci"></a> 17. `project_plan_raci` (Phân công ma trận trách nhiệm RACI cho từng bước dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `step_id` | `uuid` | `NO` | `` |
| 3 | `stakeholder_code` | `character varying` | `NO` | `` |
| 4 | `raci_type` | `character varying` | `NO` | `` |
| 5 | `stakeholder_name` | `text` | `YES` | `` |
| 6 | `assigned_employee_id` | `uuid` | `YES` | `` |
| 7 | `assigned_department_id` | `uuid` | `YES` | `` |
| 8 | `note` | `text` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "9b63f9d5-3405-4458-80d8-6d91fca77cf1",
  "step_id": "ffc0763d-88a9-4fd7-bfd7-339806e4f27a",
  "stakeholder_code": "BQL_PTDV",
  "raci_type": "I",
  "stakeholder_name": null,
  "assigned_employee_id": null,
  "assigned_department_id": null,
  "note": null,
  "created_at": "2026-06-01T10:35:14.810Z"
}
```

---

#### <a id="annual_plan_items"></a> 18. `annual_plan_items` (Hạng mục kế hoạch công tác năm)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `plan_year` | `integer` | `NO` | `` |
| 3 | `department_code` | `character varying` | `NO` | `` |
| 4 | `department_name` | `character varying` | `NO` | `` |
| 5 | `group_name` | `character varying` | `YES` | `` |
| 6 | `group_sort_order` | `integer` | `YES` | `0` |
| 7 | `task_name` | `text` | `NO` | `` |
| 8 | `deliverable` | `text` | `YES` | `` |
| 9 | `start_period` | `character varying` | `YES` | `` |
| 10 | `end_period` | `character varying` | `YES` | `` |
| 11 | `frequency` | `USER-DEFINED` | `NO` | `'one_time'::plan_frequency` |
| 12 | `project_id` | `text` | `YES` | `` |
| 13 | `responsible_text` | `text` | `YES` | `` |
| 14 | `collaborating_text` | `text` | `YES` | `` |
| 15 | `notes` | `text` | `YES` | `` |
| 16 | `sort_order` | `integer` | `YES` | `0` |
| 17 | `created_by` | `uuid` | `YES` | `` |
| 18 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 19 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 20 | `source_task_id` | `uuid` | `YES` | `` |
| 21 | `source_type` | `text` | `NO` | `'manual'::text` |
| 22 | `collaborating_dept_codes` | `ARRAY` | `YES` | `'{}'::character varying(20)[]` |
| 23 | `project_step_id` | `uuid` | `YES` | `` |
| 24 | `approval_status` | `text` | `YES` | `'draft'::text` |
| 25 | `submitted_by` | `text` | `YES` | `` |
| 26 | `submitted_at` | `timestamp with time zone` | `YES` | `` |
| 27 | `approved_by` | `text` | `YES` | `` |
| 28 | `approved_at` | `timestamp with time zone` | `YES` | `` |
| 29 | `rejected_reason` | `text` | `YES` | `` |
| 30 | `adjustment_reason` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "a0a06e3a-3a01-4156-a538-e93b13373047",
  "plan_year": 2026,
  "department_code": "HCTH",
  "department_name": "Phòng Hành chính - Tổng hợp",
  "group_name": "Công tác Hành chính - Quản trị",
  "group_sort_order": 1,
  "task_name": "Tham, mưu xây dựng các quy chế",
  "deliverable": "Xây dựng dự thảo, lấy ý kiến, trình phê duyệt các quy chế",
  "start_period": "QuýI",
  "end_period": "Quý II",
  "frequency": "quarterly",
  "project_id": null,
  "responsible_text": "HCTH/ Lộc, Minh/ Hữu",
  "collaborating_text": null,
  "notes": null,
  "sort_order": 1,
  "created_by": null,
  "created_at": "2026-05-26T03:22:19.335Z",
  "updated_at": "2026-05-26T03:22:19.335Z",
  "source_task_id": null,
  "source_type": "manual",
  "collaborating_dept_codes": [],
  "project_step_id": null,
  "approval_status": "draft",
  "submitted_by": null,
  "submitted_at": null,
  "approved_by": null,
  "approved_at": null,
  "rejected_reason": null,
  "adjustment_reason": null
}
```

---

#### <a id="monthly_plans"></a> 19. `monthly_plans` (Danh mục kế hoạch công tác tháng (Thông tin chung))

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `plan_month` | `integer` | `NO` | `` |
| 3 | `plan_year` | `integer` | `NO` | `` |
| 4 | `department_code` | `character varying` | `NO` | `` |
| 5 | `department_name` | `character varying` | `NO` | `` |
| 6 | `status` | `USER-DEFINED` | `NO` | `'draft'::plan_status` |
| 7 | `notes` | `text` | `YES` | `` |
| 8 | `created_by` | `uuid` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 11 | `report_status` | `text` | `YES` | `'open'::text` |
| 12 | `finalized_by` | `text` | `YES` | `` |
| 13 | `finalized_at` | `timestamp with time zone` | `YES` | `` |
| 14 | `report_approved_by` | `text` | `YES` | `` |
| 15 | `report_approved_at` | `timestamp with time zone` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "21ef44b2-06a4-478e-9753-86529a3eac21",
  "plan_month": 4,
  "plan_year": 2026,
  "department_code": "QLDA2",
  "department_name": "Phòng Quản lý dự án 2",
  "status": "draft",
  "notes": null,
  "created_by": null,
  "created_at": "2026-05-26T03:18:22.131Z",
  "updated_at": "2026-05-26T03:18:22.131Z",
  "report_status": "open",
  "finalized_by": null,
  "finalized_at": null,
  "report_approved_by": null,
  "report_approved_at": null
}
```

---

#### <a id="monthly_plan_items"></a> 20. `monthly_plan_items` (Chi tiết các hạng mục kế hoạch công tác tháng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `monthly_plan_id` | `uuid` | `YES` | `` |
| 3 | `annual_plan_item_id` | `uuid` | `YES` | `` |
| 4 | `task_name` | `text` | `NO` | `` |
| 5 | `deliverable` | `text` | `YES` | `` |
| 6 | `deadline_note` | `character varying` | `YES` | `` |
| 7 | `due_date` | `date` | `YES` | `` |
| 8 | `status` | `USER-DEFINED` | `NO` | `'planned'::monthly_task_status` |
| 9 | `completion_result` | `text` | `YES` | `` |
| 10 | `incomplete_reason` | `text` | `YES` | `` |
| 11 | `deferred_to_plan_id` | `uuid` | `YES` | `` |
| 12 | `notes` | `text` | `YES` | `` |
| 13 | `sort_order` | `integer` | `YES` | `0` |
| 14 | `created_by` | `uuid` | `YES` | `` |
| 15 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 16 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 17 | `source_task_id` | `uuid` | `YES` | `` |
| 18 | `source_subtask_id` | `uuid` | `YES` | `` |
| 19 | `source_type` | `text` | `NO` | `'manual'::text` |
| 20 | `collaborating_dept_codes` | `ARRAY` | `YES` | `'{}'::character varying(20)[]` |
| 21 | `collaborating_text` | `text` | `YES` | `` |
| 22 | `source_project_plan_item_id` | `uuid` | `YES` | `` |
| 23 | `project_id` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="annual_evaluations"></a> 21. `annual_evaluations` (Thông tin đánh giá tổng kết cuối năm)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `entity_type` | `text` | `YES` | `` |
| 3 | `entity_id` | `text` | `NO` | `` |
| 4 | `eval_year` | `integer` | `NO` | `` |
| 5 | `monthly_scores` | `jsonb` | `YES` | `` |
| 6 | `monthly_avg` | `numeric` | `YES` | `` |
| 7 | `quarterly_scores` | `jsonb` | `YES` | `` |
| 8 | `annual_b_score` | `numeric` | `YES` | `` |
| 9 | `annual_c_score` | `numeric` | `YES` | `` |
| 10 | `final_score` | `numeric` | `YES` | `` |
| 11 | `classification` | `text` | `YES` | `` |
| 12 | `classification_conditions` | `jsonb` | `YES` | `` |
| 13 | `current_step` | `text` | `YES` | `'self_eval'::text` |
| 14 | `self_eval_data` | `jsonb` | `YES` | `` |
| 15 | `dept_meeting_date` | `date` | `YES` | `` |
| 16 | `dept_meeting_notes` | `text` | `YES` | `` |
| 17 | `head_proposed_class` | `text` | `YES` | `` |
| 18 | `head_proposal_notes` | `text` | `YES` | `` |
| 19 | `leadership_final_class` | `text` | `YES` | `` |
| 20 | `leadership_notes` | `text` | `YES` | `` |
| 21 | `published` | `boolean` | `YES` | `false` |
| 22 | `published_at` | `timestamp with time zone` | `YES` | `` |
| 23 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 24 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 4. Gói thầu, Nhà thầu & Hợp đồng (Bidding, Contractors & Contracts)

#### <a id="bidding_packages"></a> 22. `bidding_packages` (Thông tin các gói thầu của dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `package_id` | `text` | `NO` | `` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `package_number` | `text` | `NO` | `` |
| 4 | `package_name` | `text` | `NO` | `` |
| 5 | `price` | `numeric` | `NO` | `0` |
| 6 | `estimate_price` | `numeric` | `YES` | `` |
| 7 | `status` | `text` | `NO` | `'pending'::text` |
| 8 | `bid_type` | `text` | `YES` | `` |
| 9 | `selection_method` | `text` | `YES` | `` |
| 10 | `contract_type` | `text` | `YES` | `` |
| 11 | `field` | `text` | `YES` | `` |
| 12 | `capital_source` | `text` | `YES` | `` |
| 13 | `duration` | `text` | `YES` | `` |
| 14 | `bid_fee` | `numeric` | `YES` | `` |
| 15 | `bid_closing_date` | `text` | `YES` | `` |
| 16 | `posting_date` | `text` | `YES` | `` |
| 17 | `notification_code` | `text` | `YES` | `` |
| 18 | `khlcnt_code` | `text` | `YES` | `` |
| 19 | `decision_number` | `text` | `YES` | `` |
| 20 | `decision_date` | `text` | `YES` | `` |
| 21 | `decision_agency` | `text` | `YES` | `` |
| 22 | `decision_file` | `text` | `YES` | `` |
| 23 | `winning_contractor_id` | `text` | `YES` | `` |
| 24 | `winning_price` | `numeric` | `YES` | `` |
| 25 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 26 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 27 | `plan_id` | `character varying` | `YES` | `` |
| 28 | `description` | `text` | `YES` | `` |
| 29 | `funding_source` | `text` | `YES` | `` |
| 30 | `selection_duration` | `character varying` | `YES` | `` |
| 31 | `selection_start_date` | `character varying` | `YES` | `` |
| 32 | `selection_procedure` | `character varying` | `YES` | `` |
| 33 | `has_option` | `boolean` | `YES` | `false` |
| 34 | `sort_order` | `integer` | `YES` | `0` |
| 35 | `plan_group_name` | `character varying` | `YES` | `` |
| 36 | `plan_decision_number` | `character varying` | `YES` | `` |
| 37 | `plan_decision_date` | `timestamp with time zone` | `YES` | `` |
| 38 | `msc_plan_code` | `character varying` | `YES` | `` |
| 39 | `msc_package_link` | `text` | `YES` | `` |
| 40 | `msc_publish_status` | `character varying` | `YES` | `` |
| 41 | `personnel` | `jsonb` | `YES` | `'[]'::jsonb` |
| 42 | `bidding_scope` | `text` | `YES` | `` |
| 43 | `bidders_count` | `integer` | `YES` | `` |
| 44 | `evaluation_bidders_count` | `integer` | `YES` | `` |
| 45 | `bid_opening_date` | `text` | `YES` | `` |
| 46 | `approval_date_result` | `text` | `YES` | `` |
| 47 | `completion_pct` | `numeric` | `YES` | `0` |
| 48 | `completion_updated_at` | `timestamp with time zone` | `YES` | `` |
| 49 | `contract_id` | `text` | `YES` | `` |
| 50 | `winning_consortium` | `jsonb` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "package_id": "PKG-17786004590500",
  "project_id": "7942217",
  "package_number": "01.9/XL-CĐVĐ",
  "package_name": "Xây dựng công trình",
  "price": "29323604100",
  "estimate_price": null,
  "status": "Posted",
  "bid_type": "Online",
  "selection_method": "OpenBidding",
  "contract_type": "FixedUnitPrice",
  "field": "Construction",
  "capital_source": "Ngân sách trung ương và Ngân sách tỉnh",
  "duration": "100 ngày",
  "bid_fee": null,
  "bid_closing_date": null,
  "posting_date": null,
  "notification_code": null,
  "khlcnt_code": null,
  "decision_number": null,
  "decision_date": null,
  "decision_agency": null,
  "decision_file": null,
  "winning_contractor_id": null,
  "winning_price": null,
  "created_at": "2026-05-12T15:40:59.243Z",
  "updated_at": "2026-05-12T15:40:59.243Z",
  "plan_id": "PLN-1778600458346",
  "description": "Xây dựng Trường nghề chất lượng cao, Trường cao đẳng Kỹ thuật Việt - Đức Hà Tĩnh (giai đoạn 1)",
  "funding_source": null,
  "selection_duration": "30 ngày kể từ ngày phát hành HSMT",
  "selection_start_date": "Tháng 8, 2025",
  "selection_procedure": "Một giai đoạn một túi hồ sơ",
  "has_option": false,
  "sort_order": 1,
  "plan_group_name": null,
  "plan_decision_number": null,
  "plan_decision_date": null,
  "msc_plan_code": null,
  "msc_package_link": null,
  "msc_publish_status": null,
  "personnel": [],
  "bidding_scope": null,
  "bidders_count": null,
  "evaluation_bidders_count": null,
  "bid_opening_date": null,
  "approval_date_result": null,
  "completion_pct": "0.00",
  "completion_updated_at": null,
  "contract_id": null,
  "winning_consortium": null
}
```

---

#### <a id="package_bidders"></a> 23. `package_bidders` (Nhà thầu tham dự thầu gói thầu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `package_id` | `character varying` | `NO` | `` |
| 3 | `contractor_id` | `character varying` | `NO` | `` |
| 4 | `bid_price` | `numeric` | `YES` | `` |
| 5 | `status` | `character varying` | `YES` | `` |
| 6 | `rank` | `integer` | `YES` | `` |
| 7 | `technical_score` | `numeric` | `YES` | `` |
| 8 | `financial_score` | `numeric` | `YES` | `` |
| 9 | `combined_score` | `numeric` | `YES` | `` |
| 10 | `appointment_reason` | `text` | `YES` | `` |
| 11 | `decision_agency` | `character varying` | `YES` | `` |
| 12 | `decision_date` | `date` | `YES` | `` |
| 13 | `decision_number` | `character varying` | `YES` | `` |
| 14 | `evaluation_file_name` | `character varying` | `YES` | `` |
| 15 | `evaluation_file_url` | `text` | `YES` | `` |
| 16 | `hsdx_date` | `date` | `YES` | `` |
| 17 | `hsyc_date` | `date` | `YES` | `` |
| 18 | `legal_basis` | `text` | `YES` | `` |
| 19 | `negotiated_price` | `numeric` | `YES` | `` |
| 20 | `notes` | `text` | `YES` | `` |
| 21 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 22 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="package_issues"></a> 24. `package_issues` (Các vấn đề/vướng mắc liên quan đến gói thầu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `issue_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `package_id` | `text` | `NO` | `` |
| 3 | `title` | `text` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `` |
| 5 | `severity` | `text` | `NO` | `'medium'::text` |
| 6 | `status` | `text` | `NO` | `'open'::text` |
| 7 | `reporter` | `text` | `YES` | `` |
| 8 | `reported_date` | `text` | `NO` | `(now())::text` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="procurement_plans"></a> 25. `procurement_plans` (Kế hoạch lựa chọn nhà thầu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `plan_id` | `character varying` | `NO` | `` |
| 2 | `project_id` | `character varying` | `NO` | `` |
| 3 | `plan_name` | `text` | `NO` | `` |
| 4 | `plan_code` | `character varying` | `YES` | `` |
| 5 | `msc_plan_code` | `character varying` | `YES` | `` |
| 6 | `plan_type` | `character varying` | `YES` | `` |
| 7 | `total_value` | `numeric` | `YES` | `` |
| 8 | `status` | `character varying` | `YES` | `` |
| 9 | `decision_agency` | `character varying` | `YES` | `` |
| 10 | `decision_date` | `date` | `YES` | `` |
| 11 | `decision_number` | `character varying` | `YES` | `` |
| 12 | `notes` | `text` | `YES` | `` |
| 13 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 14 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "plan_id": "71cc8b28-cae6-412e-a4be-e1e6bd5a3256",
  "project_id": "7936829",
  "plan_name": "Kế hoạch lựa chọn nhà thầu dự án Đường trục ngang ven biển huyện Thạch Hà",
  "plan_code": "3334/QĐ-UBND",
  "msc_plan_code": null,
  "plan_type": "EGP",
  "total_value": null,
  "status": null,
  "decision_agency": null,
  "decision_date": null,
  "decision_number": "3334/QĐ-UBND",
  "notes": null,
  "created_at": "2026-05-12T09:49:25.595Z",
  "updated_at": "2026-05-12T09:49:25.595Z"
}
```

---

#### <a id="contractors"></a> 26. `contractors` (Danh sách các nhà thầu tham gia dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `contractor_id` | `text` | `NO` | `` |
| 2 | `full_name` | `text` | `NO` | `` |
| 3 | `tax_code` | `text` | `YES` | `` |
| 4 | `address` | `text` | `YES` | `` |
| 5 | `representative` | `text` | `YES` | `` |
| 6 | `contact_info` | `text` | `YES` | `` |
| 7 | `established_year` | `integer` | `YES` | `` |
| 8 | `is_foreign` | `boolean` | `NO` | `false` |
| 9 | `cap_cert_code` | `text` | `YES` | `` |
| 10 | `op_license_no` | `text` | `YES` | `` |
| 11 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 13 | `contractor_type` | `text` | `YES` | `'Construction'::text` |
| 14 | `email` | `text` | `YES` | `` |
| 15 | `website` | `text` | `YES` | `` |
| 16 | `cap_cert_link` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "contractor_id": "869b5494-6e9b-4fdd-b1be-7a5d37e3dff1",
  "full_name": "Viện Quy hoạch - Kiến trúc xây dựng Hà Tĩnh",
  "tax_code": "3000229719",
  "address": "Số 14, đường Võ Liêm Sơn, Phường Thành Sen, Tỉnh Hà Tĩnh, Việt Nam",
  "representative": "Hà Quang Trung",
  "contact_info": "",
  "established_year": 0,
  "is_foreign": false,
  "cap_cert_code": "00015005",
  "op_license_no": null,
  "created_at": "2026-05-19T07:55:25.323Z",
  "updated_at": "2026-05-19T07:55:25.323Z",
  "contractor_type": "Consultancy",
  "email": null,
  "website": null,
  "cap_cert_link": null
}
```

---

#### <a id="contractor_accounts"></a> 27. `contractor_accounts` (Tài khoản đăng nhập dành cho nhà thầu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `account_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `auth_user_id` | `uuid` | `YES` | `` |
| 3 | `contractor_id` | `text` | `YES` | `` |
| 4 | `username` | `text` | `NO` | `` |
| 5 | `display_name` | `text` | `YES` | `` |
| 6 | `is_active` | `boolean` | `NO` | `true` |
| 7 | `allowed_project_ids` | `ARRAY` | `YES` | `'{}'::text[]` |
| 8 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="contracts"></a> 28. `contracts` (Hợp đồng ký kết với nhà thầu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `contract_id` | `text` | `NO` | `` |
| 2 | `project_id` | `text` | `YES` | `` |
| 3 | `package_id` | `text` | `YES` | `` |
| 4 | `contractor_id` | `text` | `YES` | `` |
| 5 | `contract_name` | `text` | `YES` | `` |
| 6 | `contract_type` | `text` | `YES` | `` |
| 7 | `value` | `numeric` | `NO` | `0` |
| 8 | `sign_date` | `text` | `YES` | `` |
| 9 | `start_date` | `text` | `YES` | `` |
| 10 | `end_date` | `text` | `YES` | `` |
| 11 | `duration_months` | `integer` | `YES` | `` |
| 12 | `status` | `integer` | `NO` | `0` |
| 13 | `scope` | `text` | `YES` | `` |
| 14 | `payment_terms` | `text` | `YES` | `` |
| 15 | `advance_rate` | `numeric` | `YES` | `` |
| 16 | `has_vat` | `boolean` | `YES` | `true` |
| 17 | `warranty` | `integer` | `YES` | `` |
| 18 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 19 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "contract_id": "HD-SVK1-01.1",
  "project_id": "8173865",
  "package_id": "PKG-1779258056092",
  "contractor_id": "869b5494-6e9b-4fdd-b1be-7a5d37e3dff1",
  "contract_name": "Hợp đồng Tư vấn khảo sát, lập quy hoạch, lập Báo cáo nghiên cứu khả thi dự án Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS Sơn Kim 1",
  "contract_type": "LumpSum",
  "value": "1285065700",
  "sign_date": "2025-10-31",
  "start_date": "2025-10-31",
  "end_date": "2026-01-25",
  "duration_months": 1,
  "status": 2,
  "scope": null,
  "payment_terms": null,
  "advance_rate": "0",
  "has_vat": true,
  "warranty": null,
  "created_at": "2026-05-21T07:08:07.472Z",
  "updated_at": "2026-05-21T07:08:07.472Z"
}
```

---

#### <a id="variation_orders"></a> 29. `variation_orders` (Phụ lục hợp đồng hoặc khối lượng phát sinh)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `vo_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `contract_id` | `text` | `NO` | `` |
| 3 | `number` | `text` | `NO` | `` |
| 4 | `content` | `text` | `YES` | `` |
| 5 | `adjusted_amount` | `numeric` | `NO` | `0` |
| 6 | `adjusted_duration` | `integer` | `YES` | `` |
| 7 | `sign_date` | `text` | `YES` | `` |
| 8 | `approval_file` | `text` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 5. Quản lý Tài chính & Giải ngân (Finance, Capital & Disbursements)

#### <a id="capital_plans"></a> 30. `capital_plans` (Kế hoạch vốn (kế hoạch trung hạn, năm))

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `plan_id` | `text` | `NO` | `` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `year` | `integer` | `NO` | `` |
| 4 | `amount` | `numeric` | `NO` | `0` |
| 5 | `disbursed_amount` | `numeric` | `NO` | `0` |
| 6 | `source` | `text` | `YES` | `` |
| 7 | `decision_number` | `text` | `YES` | `` |
| 8 | `date_assigned` | `text` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 10 | `plan_type` | `text` | `NO` | `'annual'::text` |
| 11 | `period_start` | `integer` | `YES` | `` |
| 12 | `period_end` | `integer` | `YES` | `` |
| 13 | `status` | `text` | `YES` | `'Approved'::text` |
| 14 | `approval_status` | `text` | `YES` | `'draft'::text` |
| 15 | `approved_by` | `text` | `YES` | `` |
| 16 | `approved_date` | `text` | `YES` | `` |
| 17 | `notes` | `text` | `YES` | `` |
| 18 | `luy_ke_nghiem_thu` | `numeric` | `YES` | `0` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "plan_id": "CP_7959984_2026",
  "project_id": "7959984",
  "year": 2026,
  "amount": "6706064000",
  "disbursed_amount": "6706064000",
  "source": "Ngân sách nhà nước",
  "decision_number": null,
  "date_assigned": null,
  "created_at": "2026-05-28T04:03:42.370Z",
  "plan_type": "annual",
  "period_start": null,
  "period_end": null,
  "status": "Approved",
  "approval_status": "draft",
  "approved_by": null,
  "approved_date": null,
  "notes": "{\"kh_von_ban_giao\":{\"tong\":6706064000,\"huyen\":0,\"khac\":0},\"kh_von_dieu_chinh_bo_sung\":3500000000,\"luy_ke_nghiem_thu_den_31_3_2026\":{\"tong\":12744342000,\"xay_lap\":11196888000,\"ty_le\":\"1\"},\"luy_ke_giai_ngan_den_31_3_2026\":{\"tong\":8706064000,\"tam_ung\":0}}",
  "luy_ke_nghiem_thu": "12744342000"
}
```

---

#### <a id="disbursement_plans"></a> 31. `disbursement_plans` (Kế hoạch giải ngân chi tiết)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `year` | `integer` | `NO` | `` |
| 4 | `month` | `integer` | `NO` | `` |
| 5 | `planned_amount` | `numeric` | `NO` | `0` |
| 6 | `actual_amount` | `numeric` | `NO` | `0` |
| 7 | `notes` | `text` | `YES` | `` |
| 8 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="disbursements"></a> 32. `disbursements` (Số liệu giải ngân thực tế)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `disbursement_id` | `text` | `NO` | `` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `capital_plan_id` | `text` | `YES` | `` |
| 4 | `payment_id` | `integer` | `YES` | `` |
| 5 | `amount` | `numeric` | `NO` | `0` |
| 6 | `date` | `text` | `NO` | `` |
| 7 | `status` | `text` | `NO` | `'pending'::text` |
| 8 | `form_type` | `text` | `YES` | `` |
| 9 | `treasury_code` | `text` | `YES` | `` |
| 10 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 11 | `type` | `text` | `NO` | `'ThanhToanKLHT'::text` |
| 12 | `description` | `text` | `YES` | `` |
| 13 | `contract_number` | `text` | `YES` | `` |
| 14 | `cumulative_before` | `numeric` | `NO` | `0` |
| 15 | `advance_balance` | `numeric` | `NO` | `0` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "disbursement_id": "GN-SVK1-01.1",
  "project_id": "8173865",
  "capital_plan_id": "0411db45-934d-4661-8e10-5a4f960dd67f",
  "payment_id": 1,
  "amount": "1285065700",
  "date": "2026-01-25",
  "status": "Approved",
  "form_type": "C4-02/KB",
  "treasury_code": "KB-SVK1-01.1",
  "created_at": "2026-05-21T07:16:42.882Z",
  "type": "ThanhToanKLHT",
  "description": "Thanh toán 100% khối lượng hoàn thành hợp đồng tư khảo sát, lập quy hoạch và BC NCKT",
  "contract_number": "HD-SVK1-01.1",
  "cumulative_before": "0",
  "advance_balance": "0"
}
```

---

#### <a id="payments"></a> 33. `payments` (Yêu cầu thanh toán / Hồ sơ thanh toán)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `payment_id` | `integer` | `NO` | `nextval('payments_payment_id_seq'::regclass)` |
| 2 | `contract_id` | `text` | `NO` | `` |
| 3 | `project_id` | `text` | `YES` | `` |
| 4 | `batch_no` | `integer` | `NO` | `1` |
| 5 | `type` | `text` | `NO` | `'interim'::text` |
| 6 | `amount` | `numeric` | `NO` | `0` |
| 7 | `status` | `text` | `NO` | `'draft'::text` |
| 8 | `description` | `text` | `YES` | `` |
| 9 | `request_date` | `text` | `YES` | `` |
| 10 | `approved_date` | `text` | `YES` | `` |
| 11 | `approved_by` | `text` | `YES` | `` |
| 12 | `paid_date` | `text` | `YES` | `` |
| 13 | `treasury_ref` | `text` | `YES` | `` |
| 14 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 15 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "payment_id": 1,
  "contract_id": "HD-SVK1-01.1",
  "project_id": "8173865",
  "batch_no": 1,
  "type": "Volume",
  "amount": "1285065700",
  "status": "Transferred",
  "description": "Thanh toán 100% khối lượng hoàn thành hợp đồng tư khảo sát, lập quy hoạch và BC NCKT",
  "request_date": "2026-01-20",
  "approved_date": "2026-01-22",
  "approved_by": "BQLDA",
  "paid_date": "2026-01-25",
  "treasury_ref": "KB-SVK1-01.1",
  "created_at": "2026-05-21T07:16:42.882Z",
  "updated_at": "2026-05-21T07:16:42.882Z"
}
```

---

### 6. Quản lý Công việc & Tương tác (Tasks & Collaboration)

#### <a id="tasks"></a> 34. `tasks` (Nhiệm vụ, công việc giao cho nhân viên)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `task_type` | `USER-DEFINED` | `NO` | `'project'::task_type` |
| 3 | `project_id` | `text` | `YES` | `` |
| 4 | `title` | `character varying` | `NO` | `` |
| 5 | `description` | `text` | `YES` | `` |
| 6 | `status` | `USER-DEFINED` | `NO` | `'todo'::task_status` |
| 7 | `priority` | `USER-DEFINED` | `NO` | `'medium'::task_priority` |
| 8 | `progress` | `integer` | `NO` | `0` |
| 9 | `assignee_id` | `text` | `YES` | `` |
| 10 | `approver_id` | `text` | `YES` | `` |
| 11 | `start_date` | `date` | `YES` | `` |
| 12 | `due_date` | `date` | `YES` | `` |
| 13 | `duration_days` | `integer` | `YES` | `` |
| 14 | `actual_start_date` | `date` | `YES` | `` |
| 15 | `actual_end_date` | `date` | `YES` | `` |
| 16 | `phase` | `character varying` | `YES` | `` |
| 17 | `step_code` | `character varying` | `YES` | `` |
| 18 | `sort_order` | `integer` | `YES` | `0` |
| 19 | `legal_basis` | `text` | `YES` | `` |
| 20 | `output_document` | `text` | `YES` | `` |
| 21 | `predecessor_task_id` | `uuid` | `YES` | `` |
| 22 | `metadata` | `jsonb` | `YES` | `'{}'::jsonb` |
| 23 | `created_by` | `uuid` | `YES` | `` |
| 24 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 25 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 26 | `monthly_plan_item_id` | `uuid` | `YES` | `` |
| 27 | `responsibility_level` | `text` | `NO` | `'team'::text` |
| 28 | `parent_id` | `uuid` | `YES` | `` |
| 29 | `collaborator_ids` | `ARRAY` | `YES` | `'{}'::text[]` |
| 30 | `project_plan_item_id` | `uuid` | `YES` | `` |
| 31 | `project_plan_step_id` | `uuid` | `YES` | `` |
| 32 | `category` | `text` | `YES` | `` |
| 33 | `completion_result` | `text` | `YES` | `` |
| 34 | `incomplete_reason` | `text` | `YES` | `` |
| 35 | `notes` | `text` | `YES` | `` |
| 36 | `incomplete_reason_type` | `text` | `YES` | `` |
| 37 | `is_self_proposed` | `boolean` | `YES` | `false` |
| 38 | `proposal_status` | `text` | `YES` | `` |
| 39 | `proposal_approved_by` | `text` | `YES` | `` |
| 40 | `proposal_approved_at` | `timestamp with time zone` | `YES` | `` |
| 41 | `department_code` | `text` | `YES` | `` |
| 42 | `annual_plan_item_id` | `uuid` | `YES` | `` |
| 43 | `source_type` | `text` | `YES` | `'manual'::text` |
| 44 | `obstacles` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "48d831ce-48b1-4387-8c21-60458a2e8363",
  "task_type": "internal",
  "project_id": null,
  "title": "Phối hợp hồ sơ số liệu chi phí GPMB cho quyết toán các công trình thuộc dự án BIIG2, dự án Ngân sách",
  "description": "Phối hợp với đơn vị kiểm toán và nhà thầu soát xét hồ sơ hoàn công, hoàn thiện các thủ tục lập, trình duyệt quyết toán dự án hoàn thành cho: Phối hợp soát xét hồ sơ hoàn công, đối chiếu khối lượng thực tế và lập báo cáo quyết toán vốn đầu tư dự án hoàn thành tại để trình cấp có thẩm quyền phê duyệt.",
  "status": "todo",
  "priority": "medium",
  "progress": 0,
  "assignee_id": "NV051",
  "approver_id": null,
  "start_date": "2026-05-31T17:00:00.000Z",
  "due_date": "2026-06-29T17:00:00.000Z",
  "duration_days": null,
  "actual_start_date": null,
  "actual_end_date": null,
  "phase": "preparation",
  "step_code": null,
  "sort_order": 0,
  "legal_basis": null,
  "output_document": "Báo cáo quyết toán dự án hoàn thành, biên bản quyết toán hợp đồng",
  "predecessor_task_id": null,
  "metadata": {
    "office": "VP tỉnh",
    "co_assignees": [
      {
        "name": "Nguyễn Thị Hồng Lam",
        "employeeId": "NV051"
      }
    ],
    "incomplete_reason": null,
    "raw_excel_project": "Phối hợp hồ sơ số liệu chi phí GPMB cho quyết toán các công trình thuộc dự án BIIG2, dự án Ngân sách",
    "raw_excel_assignee": "Nguyễn Thị Hồng Lam"
  },
  "created_by": null,
  "created_at": "2026-05-31T01:26:16.639Z",
  "updated_at": "2026-05-31T01:44:07.464Z",
  "monthly_plan_item_id": null,
  "responsibility_level": "team",
  "parent_id": null,
  "collaborator_ids": [],
  "project_plan_item_id": null,
  "project_plan_step_id": null,
  "category": "quyet_toan",
  "completion_result": null,
  "incomplete_reason": "Nhà thầu cũ chậm phối hợp đối chiếu công nợ và hoàn thiện các biên bản thanh lý hợp đồng thi công.",
  "notes": null,
  "incomplete_reason_type": "subjective",
  "is_self_proposed": false,
  "proposal_status": null,
  "proposal_approved_by": null,
  "proposal_approved_at": null,
  "department_code": "PTDV",
  "annual_plan_item_id": null,
  "source_type": "manual",
  "obstacles": "Nhà thầu xây lắp chậm nộp hồ sơ hoàn công quyết toán dự án hoàn thành mặc dù đã được đôn đốc nhiều lần. Công tác kiểm toán độc lập kéo dài thời gian soát xét chứng từ do khối lượng hồ sơ phát sinh qua nhiều năm phức tạp, cần làm rõ nguồn gốc pháp lý."
}
```

---

#### <a id="sub_tasks"></a> 35. `sub_tasks` (Công việc con chi tiết)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `task_id` | `uuid` | `NO` | `` |
| 3 | `title` | `character varying` | `NO` | `` |
| 4 | `status` | `character varying` | `NO` | `'todo'::character varying` |
| 5 | `assignee_id` | `text` | `YES` | `` |
| 6 | `due_date` | `date` | `YES` | `` |
| 7 | `sort_order` | `integer` | `YES` | `0` |
| 8 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="task_activities"></a> 36. `task_activities` (Lịch sử hoạt động cập nhật công việc)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `task_id` | `uuid` | `NO` | `` |
| 3 | `user_id` | `uuid` | `YES` | `` |
| 4 | `action_type` | `character varying` | `NO` | `` |
| 5 | `new_value` | `jsonb` | `YES` | `'{}'::jsonb` |
| 6 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="task_comments"></a> 37. `task_comments` (Thảo luận và ý kiến đóng góp cho công việc)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `task_id` | `uuid` | `NO` | `` |
| 3 | `user_id` | `uuid` | `YES` | `` |
| 4 | `content` | `text` | `NO` | `` |
| 5 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 6 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 7 | `attachments` | `jsonb` | `YES` | `'[]'::jsonb` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="task_weekly_updates"></a> 38. `task_weekly_updates` (Báo cáo cập nhật tiến độ công việc hàng tuần)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `task_id` | `uuid` | `NO` | `` |
| 3 | `week_number` | `integer` | `NO` | `` |
| 4 | `year` | `integer` | `NO` | `` |
| 5 | `report_date` | `date` | `NO` | `CURRENT_DATE` |
| 6 | `progress` | `integer` | `YES` | `0` |
| 7 | `work_done` | `text` | `YES` | `` |
| 8 | `obstacles` | `text` | `YES` | `` |
| 9 | `plan_next_week` | `text` | `YES` | `` |
| 10 | `created_by` | `uuid` | `YES` | `` |
| 11 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 7. Quản lý Tài liệu & CDE (Common Data Environment)

#### <a id="documents"></a> 39. `documents` (Văn bản, hồ sơ quản lý dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `doc_id` | `integer` | `NO` | `nextval('documents_doc_id_seq'::regclass)` |
| 2 | `doc_name` | `text` | `NO` | `` |
| 3 | `storage_path` | `text` | `NO` | `` |
| 4 | `category` | `integer` | `NO` | `0` |
| 5 | `project_id` | `text` | `YES` | `` |
| 6 | `folder_id` | `text` | `YES` | `` |
| 7 | `uploaded_by` | `text` | `YES` | `` |
| 8 | `upload_date` | `text` | `NO` | `(now())::text` |
| 9 | `version` | `text` | `YES` | `` |
| 10 | `revision` | `text` | `YES` | `` |
| 11 | `size` | `text` | `YES` | `` |
| 12 | `reference_id` | `text` | `YES` | `` |
| 13 | `iso_status` | `text` | `YES` | `` |
| 14 | `is_digitized` | `boolean` | `YES` | `false` |
| 15 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 16 | `version_group_id` | `uuid` | `YES` | `gen_random_uuid()` |
| 17 | `file_hash` | `character varying` | `YES` | `` |
| 18 | `is_latest` | `boolean` | `YES` | `true` |
| 19 | `doc_type` | `text` | `YES` | `` |
| 20 | `document_number` | `text` | `YES` | `` |
| 21 | `issue_date` | `text` | `YES` | `` |
| 22 | `issuing_authority` | `text` | `YES` | `` |
| 23 | `notes` | `text` | `YES` | `` |
| 24 | `document_book` | `text` | `YES` | `` |
| 25 | `book_number` | `text` | `YES` | `` |
| 26 | `summary` | `text` | `YES` | `` |
| 27 | `signer` | `text` | `YES` | `` |
| 28 | `drafting_department` | `text` | `YES` | `` |
| 29 | `document_symbol` | `text` | `YES` | `` |
| 30 | `drafter` | `text` | `YES` | `` |
| 31 | `source` | `text` | `YES` | `` |
| 32 | `legal_status` | `text` | `YES` | `'active'::text` |
| 33 | `cde_folder_id` | `uuid` | `YES` | `` |
| 34 | `cde_status` | `text` | `YES` | `'S0'::text` |
| 35 | `discipline` | `text` | `YES` | `` |
| 36 | `submitted_by` | `text` | `YES` | `` |
| 37 | `submitted_by_org` | `text` | `YES` | `` |
| 38 | `contractor_id` | `text` | `YES` | `` |
| 39 | `deadline` | `text` | `YES` | `` |
| 40 | `priority` | `text` | `YES` | `` |
| 41 | `is_encrypted` | `boolean` | `YES` | `false` |
| 42 | `encryption_key_id` | `text` | `YES` | `` |
| 43 | `sensitivity_level` | `integer` | `YES` | `1` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "doc_id": 3,
  "doc_name": "QD-phe-duyet-du-an-Truong-noi-tru-lien-cap-Son-Kim-1(30.12.2025_21h40p53)_signed.pdf",
  "storage_path": "https://jkaddjllseephsiaqvds.supabase.co/storage/v1/object/public/documents/8173865/docs/1778835585554.pdf",
  "category": 0,
  "project_id": "8173865",
  "folder_id": null,
  "uploaded_by": null,
  "upload_date": "2026-05-15 08:59:47.073916+00",
  "version": null,
  "revision": null,
  "size": "894 KB",
  "reference_id": null,
  "iso_status": null,
  "is_digitized": true,
  "created_at": "2026-05-15T08:59:47.073Z",
  "version_group_id": "9e3d3dd2-e9b3-47f8-b27f-5097d8167806",
  "file_hash": null,
  "is_latest": true,
  "doc_type": "Quyết định",
  "document_number": "3319/QĐ-UBND",
  "issue_date": "2025-12-29",
  "issuing_authority": "ỦY BAN NHÂN DÂN TỈNH HÀ TĨNH",
  "notes": null,
  "document_book": null,
  "book_number": null,
  "summary": "Về việc phê duyệt dự án Xây dựng Trường phổ thông nội trú liên cấp Tiểu học và THCS Sơn Kim 1",
  "signer": "Nguyễn Thị Nguyệt",
  "drafting_department": "Sở Xây dựng",
  "document_symbol": "QĐ-UBND",
  "drafter": null,
  "source": "manual",
  "legal_status": "active",
  "cde_folder_id": null,
  "cde_status": "S0",
  "discipline": null,
  "submitted_by": null,
  "submitted_by_org": null,
  "contractor_id": null,
  "deadline": null,
  "priority": null,
  "is_encrypted": false,
  "encryption_key_id": null,
  "sensitivity_level": 1
}
```

---

#### <a id="document_attachments"></a> 40. `document_attachments` (File đính kèm của hồ sơ/tài liệu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `related_type` | `text` | `NO` | `` |
| 3 | `related_id` | `text` | `NO` | `` |
| 4 | `file_name` | `text` | `NO` | `` |
| 5 | `file_size` | `bigint` | `NO` | `` |
| 6 | `file_type` | `text` | `NO` | `` |
| 7 | `storage_path` | `text` | `NO` | `` |
| 8 | `description` | `text` | `YES` | `''::text` |
| 9 | `uploaded_by` | `text` | `YES` | `` |
| 10 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "28ffbcbb-4352-4c60-b847-114f7473bbbf",
  "related_type": "agency_event",
  "related_id": "4be8b305-36a7-447f-8654-97586cc397f7",
  "file_name": "z7472890974276_cfdb2c118db8c2008c95fed5b4bd03da.jpg",
  "file_size": "140276",
  "file_type": "image/jpeg",
  "storage_path": "agency_event/4be8b305-36a7-447f-8654-97586cc397f7/1779763314448_z7472890974276_cfdb2c118db8c2008c95fed5b4bd03da.jpg",
  "description": "Hình ảnh hiện trường",
  "uploaded_by": "",
  "created_at": "2026-05-26T02:41:55.933Z",
  "updated_at": "2026-05-26T02:41:55.933Z"
}
```

---

#### <a id="folders"></a> 41. `folders` (Cấu trúc thư mục quản lý hồ sơ chung)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `folder_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `name` | `text` | `NO` | `` |
| 3 | `parent_id` | `text` | `YES` | `` |
| 4 | `path` | `text` | `NO` | `` |
| 5 | `type` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_folders"></a> 42. `cde_folders` (Cấu trúc thư mục trong môi trường dữ liệu chung CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `parent_id` | `uuid` | `YES` | `` |
| 4 | `name` | `text` | `NO` | `` |
| 5 | `container_type` | `text` | `NO` | `` |
| 6 | `path` | `text` | `YES` | `` |
| 7 | `phase` | `text` | `YES` | `` |
| 8 | `sort_order` | `integer` | `YES` | `0` |
| 9 | `icon` | `text` | `YES` | `` |
| 10 | `description` | `text` | `YES` | `` |
| 11 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_permissions"></a> 43. `cde_permissions` (Bảng phân quyền tài liệu CDE cho nhà thầu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `account_id` | `uuid` | `NO` | `` |
| 4 | `cde_role` | `text` | `NO` | `` |
| 5 | `granted_by` | `text` | `YES` | `` |
| 6 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 7 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_reviews"></a> 44. `cde_reviews` (Yêu cầu phê duyệt, đánh giá tài liệu trên CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `title` | `text` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `` |
| 5 | `due_date` | `date` | `YES` | `` |
| 6 | `status` | `text` | `NO` | `'open'::text` |
| 7 | `created_by` | `text` | `YES` | `` |
| 8 | `created_by_name` | `text` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_review_items"></a> 45. `cde_review_items` (Các file/tài liệu đính kèm yêu cầu đánh giá CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `review_id` | `uuid` | `NO` | `` |
| 3 | `doc_id` | `integer` | `NO` | `` |
| 4 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_review_approvers"></a> 46. `cde_review_approvers` (Danh sách người tham gia phê duyệt tài liệu CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `review_id` | `uuid` | `NO` | `` |
| 3 | `approver_id` | `text` | `YES` | `` |
| 4 | `approver_name` | `text` | `NO` | `` |
| 5 | `decision` | `text` | `NO` | `'pending'::text` |
| 6 | `comment` | `text` | `YES` | `` |
| 7 | `signed` | `boolean` | `NO` | `false` |
| 8 | `decided_at` | `timestamp with time zone` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_comments"></a> 47. `cde_comments` (Ý kiến thảo luận và ghi chú trên tài liệu CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `doc_id` | `integer` | `NO` | `` |
| 3 | `parent_id` | `uuid` | `YES` | `` |
| 4 | `author_id` | `text` | `NO` | `` |
| 5 | `author_name` | `text` | `YES` | `` |
| 6 | `content` | `text` | `NO` | `` |
| 7 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 8 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_transmittals"></a> 48. `cde_transmittals` (Phiếu giao nhận hồ sơ, tài liệu CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `transmittal_no` | `text` | `NO` | `` |
| 4 | `subject` | `text` | `NO` | `` |
| 5 | `from_org` | `text` | `YES` | `` |
| 6 | `from_person` | `text` | `YES` | `` |
| 7 | `to_org` | `text` | `YES` | `` |
| 8 | `to_person` | `text` | `YES` | `` |
| 9 | `cc_list` | `jsonb` | `YES` | `'[]'::jsonb` |
| 10 | `doc_ids` | `jsonb` | `YES` | `'[]'::jsonb` |
| 11 | `purpose` | `text` | `YES` | `` |
| 12 | `notes` | `text` | `YES` | `` |
| 13 | `status` | `text` | `YES` | `'draft'::text` |
| 14 | `sent_at` | `timestamp with time zone` | `YES` | `` |
| 15 | `created_by` | `text` | `NO` | `` |
| 16 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_audit_log"></a> 49. `cde_audit_log` (Nhật ký kiểm toán hoạt động trên CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `entity_type` | `text` | `NO` | `` |
| 4 | `entity_id` | `text` | `NO` | `` |
| 5 | `action` | `text` | `NO` | `` |
| 6 | `actor_id` | `text` | `NO` | `` |
| 7 | `actor_name` | `text` | `YES` | `` |
| 8 | `details` | `jsonb` | `YES` | `'{}'::jsonb` |
| 9 | `ip_address` | `text` | `YES` | `` |
| 10 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="view_comments"></a> 50. `view_comments` (Ý kiến đóng góp khi xem tài liệu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `view_type` | `text` | `NO` | `` |
| 3 | `reference_id` | `text` | `NO` | `` |
| 4 | `comment_month` | `integer` | `NO` | `` |
| 5 | `comment_year` | `integer` | `NO` | `` |
| 6 | `content` | `text` | `YES` | `` |
| 7 | `commented_by` | `text` | `YES` | `` |
| 8 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "89ad8bc4-095e-41f9-bc3c-f6f3678d17ab",
  "view_type": "briefing",
  "reference_id": "8173865",
  "comment_month": 5,
  "comment_year": 2026,
  "content": "ksdnbl;sdbsdbs",
  "commented_by": null,
  "created_at": "2026-05-26T07:03:11.896Z",
  "updated_at": "2026-05-26T07:03:11.896Z"
}
```

---

### 8. Quy trình Phê duyệt & Workflow Engine

#### <a id="workflows"></a> 51. `workflows` (Định nghĩa quy trình nghiệp vụ hệ thống)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `code` | `character varying` | `NO` | `` |
| 3 | `name` | `character varying` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `` |
| 5 | `category` | `USER-DEFINED` | `YES` | `'other'::workflow_category` |
| 6 | `version` | `integer` | `YES` | `1` |
| 7 | `is_active` | `boolean` | `YES` | `true` |
| 8 | `metadata` | `jsonb` | `YES` | `'{}'::jsonb` |
| 9 | `created_by` | `uuid` | `YES` | `` |
| 10 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "0866c0fb-91b6-4056-8a66-7fdaba4f3e87",
  "code": "QT-TK1B",
  "name": "BCKTKT — Thiết kế 1 bước",
  "description": "Quy trình nội bộ QLDA2 — áp dụng cho dự án chỉ lập BCKTKT (thiết kế 1 bước). BCKTKT đã bao gồm TKBVTC và dự toán. Áp dụng từ 01/7/2026 theo Luật Xây dựng số 135/2025/QH15.",
  "category": "other",
  "version": 1,
  "is_active": true,
  "metadata": {},
  "created_by": null,
  "created_at": "2026-05-13T00:55:16.369Z",
  "updated_at": "2026-05-18T11:29:37.650Z"
}
```

---

#### <a id="workflow_nodes"></a> 52. `workflow_nodes` (Các bước (nút) trong quy trình nghiệp vụ)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `workflow_id` | `uuid` | `NO` | `` |
| 3 | `name` | `character varying` | `NO` | `` |
| 4 | `type` | `USER-DEFINED` | `YES` | `'approval'::workflow_node_type` |
| 5 | `assignee_role` | `character varying` | `YES` | `` |
| 6 | `sla_formula` | `character varying` | `YES` | `` |
| 7 | `form_config` | `jsonb` | `YES` | `'{}'::jsonb` |
| 8 | `metadata` | `jsonb` | `YES` | `'{}'::jsonb` |
| 9 | `is_deleted` | `boolean` | `YES` | `false` |
| 10 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |
| 12 | `sort_order` | `integer` | `YES` | `0` |
| 13 | `legal_basis` | `text` | `YES` | `` |
| 14 | `output_document` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "fbd65c59-91d1-4482-b1db-ed27a7cb1230",
  "workflow_id": "f145577e-60be-4995-a212-9e8160dd6d15",
  "name": "1.1 Lập, thẩm định, phê duyệt chủ trương đầu tư (nếu có)",
  "type": "start",
  "assignee_role": "CĐT / Cấp thẩm quyền",
  "sla_formula": "30d",
  "form_config": {},
  "metadata": {
    "phase": "preparation"
  },
  "is_deleted": false,
  "created_at": "2026-05-18T11:21:41.908Z",
  "updated_at": "2026-05-24T02:19:36.678Z",
  "sort_order": 0,
  "legal_basis": null,
  "output_document": null
}
```

---

#### <a id="workflow_edges"></a> 53. `workflow_edges` (Đường nối chuyển bước giữa các nút quy trình)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `workflow_id` | `uuid` | `NO` | `` |
| 3 | `source_node` | `uuid` | `YES` | `` |
| 4 | `target_node` | `uuid` | `YES` | `` |
| 5 | `condition_expr` | `text` | `YES` | `` |
| 6 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "1f00fffa-7267-4130-884f-08527c9fc784",
  "workflow_id": "f145577e-60be-4995-a212-9e8160dd6d15",
  "source_node": "fbd65c59-91d1-4482-b1db-ed27a7cb1230",
  "target_node": "73005875-ae80-4588-b5c8-f80591130aa2",
  "condition_expr": null,
  "created_at": "2026-05-18T11:21:42.232Z"
}
```

---

#### <a id="workflow_instances"></a> 54. `workflow_instances` (Các lượt chạy quy trình nghiệp vụ thực tế)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `workflow_id` | `uuid` | `NO` | `` |
| 3 | `reference_id` | `text` | `YES` | `` |
| 4 | `reference_type` | `character varying` | `YES` | `` |
| 5 | `status` | `USER-DEFINED` | `YES` | `'in_progress'::workflow_instance_status` |
| 6 | `current_node_id` | `uuid` | `YES` | `` |
| 7 | `context_data` | `jsonb` | `YES` | `'{}'::jsonb` |
| 8 | `created_by` | `uuid` | `YES` | `` |
| 9 | `started_at` | `timestamp with time zone` | `YES` | `now()` |
| 10 | `completed_at` | `timestamp with time zone` | `YES` | `` |
| 11 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "4d1a9cdf-929c-4ca8-bb33-25c94cfbde14",
  "workflow_id": "f145577e-60be-4995-a212-9e8160dd6d15",
  "reference_id": "733161",
  "reference_type": "project",
  "status": "in_progress",
  "current_node_id": null,
  "context_data": {},
  "created_by": null,
  "started_at": "2026-05-31T10:43:36.735Z",
  "completed_at": null,
  "updated_at": "2026-05-31T10:43:44.562Z"
}
```

---

#### <a id="workflow_tasks"></a> 55. `workflow_tasks` (Nhiệm vụ phê duyệt trong lượt chạy quy trình)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `instance_id` | `uuid` | `NO` | `` |
| 3 | `node_id` | `uuid` | `YES` | `` |
| 4 | `assignee_id` | `uuid` | `YES` | `` |
| 5 | `status` | `USER-DEFINED` | `YES` | `'pending'::workflow_task_status` |
| 6 | `action_taken` | `character varying` | `YES` | `` |
| 7 | `comments` | `text` | `YES` | `` |
| 8 | `digital_signature` | `jsonb` | `YES` | `` |
| 9 | `due_date` | `timestamp with time zone` | `YES` | `` |
| 10 | `completed_at` | `timestamp with time zone` | `YES` | `` |
| 11 | `name` | `character varying` | `YES` | `` |
| 12 | `task_type` | `character varying` | `YES` | `'workflow'::character varying` |
| 13 | `start_date` | `timestamp with time zone` | `YES` | `` |
| 14 | `started_at` | `timestamp with time zone` | `YES` | `` |
| 15 | `progress` | `integer` | `YES` | `0` |
| 16 | `metadata` | `jsonb` | `YES` | `'{}'::jsonb` |
| 17 | `cde_folder_id` | `character varying` | `YES` | `` |
| 18 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |
| 19 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="workflow_node_raci"></a> 56. `workflow_node_raci` (Thiết lập RACI mặc định cho từng bước quy trình)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `workflow_node_id` | `uuid` | `NO` | `` |
| 3 | `stakeholder_code` | `character varying` | `NO` | `` |
| 4 | `raci_type` | `character varying` | `NO` | `` |
| 5 | `note` | `text` | `YES` | `` |
| 6 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "97fba3ad-582b-4ba0-acf4-88f0dbfb9fd4",
  "workflow_node_id": "61e9418e-b38f-464b-8c03-59e4e45cdf04",
  "stakeholder_code": "BQL",
  "raci_type": "R",
  "note": null,
  "created_at": "2026-05-24T02:20:47.318Z"
}
```

---

#### <a id="cde_workflow_instances"></a> 57. `cde_workflow_instances` (Quy trình phê duyệt tài liệu CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `workflow_code` | `text` | `NO` | `` |
| 4 | `workflow_id` | `uuid` | `YES` | `` |
| 5 | `current_step_index` | `integer` | `NO` | `0` |
| 6 | `total_steps` | `integer` | `NO` | `17` |
| 7 | `status` | `text` | `NO` | `'active'::text` |
| 8 | `state_code` | `text` | `NO` | `'01'::text` |
| 9 | `initiated_by` | `uuid` | `YES` | `` |
| 10 | `officer_name` | `text` | `YES` | `` |
| 11 | `notes` | `text` | `YES` | `` |
| 12 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 13 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "add8c791-38ec-46fd-80bd-7fffb5f4cd94",
  "project_id": "7292327",
  "workflow_code": "QT-TK1B",
  "workflow_id": null,
  "current_step_index": 4,
  "total_steps": 17,
  "status": "active",
  "state_code": "04",
  "initiated_by": "983aa0ed-7d53-4d11-8b53-9862fe986f64",
  "officer_name": null,
  "notes": null,
  "created_at": "2026-05-18T14:11:59.760Z",
  "updated_at": "2026-05-18T15:08:48.246Z"
}
```

---

#### <a id="cde_workflow_step_records"></a> 58. `cde_workflow_step_records` (Nhật ký thực hiện từng bước quy trình CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `instance_id` | `uuid` | `NO` | `` |
| 3 | `step_index` | `integer` | `NO` | `` |
| 4 | `node_id` | `uuid` | `YES` | `` |
| 5 | `form_code` | `text` | `YES` | `` |
| 6 | `form_data` | `jsonb` | `NO` | `'{}'::jsonb` |
| 7 | `conclusion` | `text` | `YES` | `` |
| 8 | `is_completed` | `boolean` | `NO` | `false` |
| 9 | `completed_by` | `uuid` | `YES` | `` |
| 10 | `completed_at` | `timestamp with time zone` | `YES` | `` |
| 11 | `notes` | `text` | `YES` | `` |
| 12 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 13 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "d650cf22-ebee-495f-9c55-52cb5734df46",
  "instance_id": "fded1f4a-4733-42b3-8deb-3c838f698844",
  "step_index": 0,
  "node_id": null,
  "form_code": null,
  "form_data": {},
  "conclusion": null,
  "is_completed": true,
  "completed_by": "983aa0ed-7d53-4d11-8b53-9862fe986f64",
  "completed_at": "2026-05-18T13:23:04.536Z",
  "notes": "",
  "created_at": "2026-05-18T13:23:13.218Z",
  "updated_at": "2026-05-18T13:23:13.218Z"
}
```

---

#### <a id="cde_internal_workflow_instances"></a> 59. `cde_internal_workflow_instances` (Lượt chạy quy trình nghiệp vụ nội bộ CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `doc_id` | `integer` | `YES` | `` |
| 4 | `template_id` | `text` | `NO` | `` |
| 5 | `template_code` | `text` | `NO` | `` |
| 6 | `template_name` | `text` | `NO` | `` |
| 7 | `title` | `text` | `NO` | `` |
| 8 | `current_step_no` | `integer` | `NO` | `1` |
| 9 | `status` | `USER-DEFINED` | `NO` | `'in_progress'::internal_workflow_instance_status` |
| 10 | `created_by` | `text` | `NO` | `` |
| 11 | `created_by_name` | `text` | `NO` | `''::text` |
| 12 | `started_at` | `timestamp with time zone` | `NO` | `now()` |
| 13 | `completed_at` | `timestamp with time zone` | `YES` | `` |
| 14 | `due_date` | `timestamp with time zone` | `YES` | `` |
| 15 | `metadata` | `jsonb` | `NO` | `'{}'::jsonb` |
| 16 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 17 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "5f19bcc9-ef86-40a6-8110-47c1c32c4e5d",
  "project_id": "7702138",
  "doc_id": null,
  "template_id": "qt_04_qtvdtdaht",
  "template_code": "QT.04.QTVDTDAHT",
  "template_name": "Quyết toán vốn đầu tư dự án hoàn thành",
  "title": "QTA",
  "current_step_no": 1,
  "status": "in_progress",
  "created_by": "NV001",
  "created_by_name": "Quản trị viên",
  "started_at": "2026-05-10T01:28:36.311Z",
  "completed_at": null,
  "due_date": null,
  "metadata": {},
  "created_at": "2026-05-10T01:28:36.311Z",
  "updated_at": "2026-05-10T01:28:36.311Z"
}
```

---

#### <a id="cde_internal_workflow_step_records"></a> 60. `cde_internal_workflow_step_records` (Chi tiết bước xử lý quy trình nội bộ CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `instance_id` | `uuid` | `NO` | `` |
| 3 | `step_no` | `integer` | `NO` | `` |
| 4 | `step_code` | `text` | `NO` | `` |
| 5 | `step_name` | `text` | `NO` | `` |
| 6 | `department` | `text` | `NO` | `` |
| 7 | `department_label` | `text` | `NO` | `''::text` |
| 8 | `actor_id` | `text` | `YES` | `` |
| 9 | `actor_name` | `text` | `YES` | `` |
| 10 | `status` | `USER-DEFINED` | `NO` | `'waiting'::internal_step_status` |
| 11 | `comment` | `text` | `NO` | `''::text` |
| 12 | `attachments` | `ARRAY` | `NO` | `'{}'::text[]` |
| 13 | `acted_at` | `timestamp with time zone` | `YES` | `` |
| 14 | `deadline` | `timestamp with time zone` | `YES` | `` |
| 15 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "88bdee71-3541-468f-8eda-a98b608a505f",
  "instance_id": "5f19bcc9-ef86-40a6-8110-47c1c32c4e5d",
  "step_no": 1,
  "step_code": "B1_PREPARE",
  "step_name": "Chuẩn bị hồ sơ đề nghị quyết toán A-B",
  "department": "REQUESTOR",
  "department_label": "Đơn vị đề nghị quyết toán",
  "actor_id": null,
  "actor_name": null,
  "status": "pending",
  "comment": "",
  "attachments": [],
  "acted_at": null,
  "deadline": null,
  "created_at": "2026-05-10T01:28:36.940Z"
}
```

---

#### <a id="cde_workflow_history"></a> 61. `cde_workflow_history` (Lịch sử chung của quy trình CDE)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `doc_id` | `integer` | `NO` | `` |
| 3 | `step_name` | `text` | `NO` | `` |
| 4 | `step_code` | `text` | `NO` | `` |
| 5 | `actor_id` | `text` | `NO` | `` |
| 6 | `actor_name` | `text` | `YES` | `` |
| 7 | `actor_role` | `text` | `YES` | `` |
| 8 | `status` | `text` | `NO` | `` |
| 9 | `comment` | `text` | `YES` | `''::text` |
| 10 | `attachments` | `jsonb` | `YES` | `'[]'::jsonb` |
| 11 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 9. Thi công & Giám sát hiện trường (Construction & Site Supervision)

#### <a id="construction_works"></a> 62. `construction_works` (Danh mục hạng mục công trình xây dựng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `work_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `work_name` | `text` | `NO` | `` |
| 3 | `project_id` | `text` | `NO` | `` |
| 4 | `type` | `text` | `YES` | `` |
| 5 | `grade` | `integer` | `YES` | `` |
| 6 | `design_level` | `integer` | `YES` | `` |
| 7 | `address` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="construction_logs"></a> 63. `construction_logs` (Nhật ký thi công hàng ngày)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `log_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `log_date` | `date` | `NO` | `` |
| 4 | `weather_temp` | `numeric` | `YES` | `` |
| 5 | `weather_desc` | `text` | `YES` | `` |
| 6 | `weather_wind` | `text` | `YES` | `` |
| 7 | `construction_status` | `text` | `NO` | `'normal'::text` |
| 8 | `notes` | `text` | `YES` | `` |
| 9 | `created_by` | `uuid` | `YES` | `` |
| 10 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "log_id": "5e15a7d3-c132-4e05-9750-986e9a869264",
  "project_id": "8173865",
  "log_date": "2026-05-23T17:00:00.000Z",
  "weather_temp": "32",
  "weather_desc": "Nắng ráo, trời ít mây",
  "weather_wind": "Gió nhẹ",
  "construction_status": "normal",
  "notes": "Ngày Chủ nhật công trường nghỉ tuần, chỉ bố trí bộ phận bảo vệ trực gác và vệ sinh công nghiệp khuôn viên.",
  "created_by": null,
  "created_at": "2026-05-30T03:28:22.515Z",
  "updated_at": "2026-05-30T03:28:22.515Z"
}
```

---

#### <a id="construction_log_details"></a> 64. `construction_log_details` (Chi tiết công việc thi công trong ngày)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `detail_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `log_id` | `uuid` | `NO` | `` |
| 3 | `contract_id` | `text` | `YES` | `` |
| 4 | `work_item` | `text` | `NO` | `` |
| 5 | `location` | `text` | `YES` | `` |
| 6 | `work_volume` | `text` | `YES` | `` |
| 7 | `status` | `text` | `NO` | `'completed'::text` |
| 8 | `safety_status` | `text` | `NO` | `'safe'::text` |
| 9 | `safety_notes` | `text` | `YES` | `` |
| 10 | `issues` | `text` | `YES` | `` |
| 11 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "detail_id": "4b898f1d-cc07-4ac5-a5a8-ba5129db7b7a",
  "log_id": "8f83c819-c801-4aff-84cd-7f4055f1c339",
  "contract_id": "HD-SVK1-04.1",
  "work_item": "Lắp dựng cốp pha cột tầng 3 trục A-C",
  "location": "Tầng 3, phân khu A",
  "work_volume": "Lắp đặt 18 cột ván khuôn gỗ",
  "status": "in_progress",
  "safety_status": "safe",
  "safety_notes": null,
  "issues": null,
  "created_at": "2026-05-30T03:28:27.036Z"
}
```

---

#### <a id="construction_manpower"></a> 65. `construction_manpower` (Báo cáo nhân lực thi công tại hiện trường)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `manpower_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `log_id` | `uuid` | `NO` | `` |
| 3 | `contractor_id` | `text` | `YES` | `` |
| 4 | `role_title` | `text` | `NO` | `` |
| 5 | `quantity` | `integer` | `NO` | `0` |
| 6 | `notes` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "manpower_id": "2c95b6dc-041b-4a6d-8c54-cd72dfa7dc80",
  "log_id": "5e15a7d3-c132-4e05-9750-986e9a869264",
  "contractor_id": null,
  "role_title": "Bảo vệ trực ca",
  "quantity": 3,
  "notes": "Trực 24/24 bảo vệ tài sản công trường"
}
```

---

#### <a id="construction_equipment"></a> 66. `construction_equipment` (Báo cáo thiết bị thi công tại hiện trường)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `equipment_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `log_id` | `uuid` | `NO` | `` |
| 3 | `equipment_name` | `text` | `NO` | `` |
| 4 | `quantity` | `integer` | `NO` | `1` |
| 5 | `operating_hours` | `numeric` | `YES` | `8` |
| 6 | `status` | `text` | `NO` | `'active'::text` |
| 7 | `notes` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "equipment_id": "8768073e-7c45-488c-a0d7-11ccd573e1e4",
  "log_id": "8f83c819-c801-4aff-84cd-7f4055f1c339",
  "equipment_name": "Cẩu tháp trục đứng",
  "quantity": 1,
  "operating_hours": "8",
  "status": "active",
  "notes": null
}
```

---

#### <a id="construction_progress"></a> 67. `construction_progress` (Sản lượng thi công thực tế)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `progress_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `contract_id` | `text` | `YES` | `` |
| 4 | `task_name` | `text` | `NO` | `` |
| 5 | `planned_start_date` | `date` | `YES` | `` |
| 6 | `planned_end_date` | `date` | `YES` | `` |
| 7 | `actual_start_date` | `date` | `YES` | `` |
| 8 | `actual_end_date` | `date` | `YES` | `` |
| 9 | `weight_percent` | `numeric` | `YES` | `0` |
| 10 | `planned_percent` | `numeric` | `YES` | `0` |
| 11 | `actual_percent` | `numeric` | `YES` | `0` |
| 12 | `status` | `text` | `NO` | `'pending'::text` |
| 13 | `notes` | `text` | `YES` | `` |
| 14 | `sort_order` | `integer` | `YES` | `0` |
| 15 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "progress_id": "9170eca1-a927-4c3c-bbef-30fe604b0545",
  "project_id": "8173865",
  "contract_id": "HD-SVK1-03.1",
  "task_name": "Phát hoang giải toả mặt bằng hiện trạng",
  "planned_start_date": "2026-03-09T17:00:00.000Z",
  "planned_end_date": "2026-03-14T17:00:00.000Z",
  "actual_start_date": "2026-03-09T17:00:00.000Z",
  "actual_end_date": "2026-03-13T17:00:00.000Z",
  "weight_percent": "10.00",
  "planned_percent": "100.00",
  "actual_percent": "100.00",
  "status": "completed",
  "notes": "Bàn giao mặt bằng sạch đúng hạn",
  "sort_order": 1,
  "updated_at": "2026-05-30T03:16:27.539Z"
}
```

---

#### <a id="construction_site_photos"></a> 68. `construction_site_photos` (Hình ảnh nhật ký công trường thực tế)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `photo_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `log_id` | `uuid` | `YES` | `` |
| 4 | `image_path` | `text` | `NO` | `` |
| 5 | `caption` | `text` | `YES` | `` |
| 6 | `uploaded_by` | `uuid` | `YES` | `` |
| 7 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "photo_id": "f5417268-fc4f-4456-95d9-0e3f8a015df3",
  "project_id": "8173865",
  "log_id": "b3c869ba-fc4d-4456-95d9-0e3f8a015df3",
  "image_path": "documents/construction/mau_thi_cong_1.jpg",
  "caption": "Công tác đổ bê tông sàn tầng 3 khu trường nội trú Sơn Kim 1",
  "uploaded_by": null,
  "created_at": "2026-05-29T07:30:00.000Z"
}
```

---

#### <a id="inspections"></a> 69. `inspections` (Biên bản kiểm tra và nghiệm thu công việc)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `inspection_id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `project_id` | `text` | `YES` | `` |
| 3 | `inspection_type` | `text` | `NO` | `` |
| 4 | `inspection_name` | `text` | `NO` | `` |
| 5 | `inspection_agency` | `text` | `YES` | `` |
| 6 | `inspector_name` | `text` | `YES` | `` |
| 7 | `decision_number` | `text` | `YES` | `` |
| 8 | `decision_date` | `date` | `YES` | `` |
| 9 | `start_date` | `date` | `YES` | `` |
| 10 | `end_date` | `date` | `YES` | `` |
| 11 | `conclusion` | `text` | `YES` | `` |
| 12 | `recommendations` | `text` | `YES` | `` |
| 13 | `penalties` | `numeric` | `YES` | `0` |
| 14 | `follow_up_status` | `text` | `YES` | `'pending'::text` |
| 15 | `follow_up_deadline` | `date` | `YES` | `` |
| 16 | `follow_up_notes` | `text` | `YES` | `` |
| 17 | `attachments` | `jsonb` | `YES` | `'[]'::jsonb` |
| 18 | `status` | `text` | `YES` | `'active'::text` |
| 19 | `created_by` | `text` | `YES` | `` |
| 20 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 21 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "inspection_id": "1c1eb06e-f01c-43d1-a451-923e51125034",
  "project_id": "7935693",
  "inspection_type": "kiem_toan",
  "inspection_name": "Kiểm toán dự án theo Quyết định 228/KTNN-TH",
  "inspection_agency": "Kiểm toán Nhà nước",
  "inspector_name": null,
  "decision_number": "228/KTNN-TH",
  "decision_date": "2025-09-15T17:00:00.000Z",
  "start_date": null,
  "end_date": null,
  "conclusion": "Thông tin kết luận: 228/KTNN-TH ngày 16/9/2025\n\n* Giai đoạn đến ngày 30/6/2025:\n  - Thu hồi: Kiến nghị 0.000 tr.đ, đã thực hiện 0.000 tr.đ\n  - Giảm trừ: Kiến nghị 0.000 tr.đ, đã thực hiện 0.000 tr.đ\n  - Xử lý khác: Kiến nghị 0.000 tr.đ, đã thực hiện 0.000 tr.đ\n  - Xử lý hành chính: Kiến nghị 0.000 tập thể/cá nhân, đã thực hiện 0.000\n\n* Giai đoạn từ 01/7/2025 đến 31/3/2026:\n  - Thu hồi: Kiến nghị 0.000 tr.đ, đã thực hiện 0.000 tr.đ\n  - Giảm trừ: Kiến nghị 12.586 tr.đ, đã thực hiện 12.586 tr.đ\n  - Xử lý khác: Kiến nghị 145.696 tr.đ, đã thực hiện 145.696 tr.đ\n  - Xử lý hành chính: Kiến nghị 0.000 tập thể/cá nhân, đã thực hiện 0.000",
  "recommendations": null,
  "penalties": "158282000",
  "follow_up_status": "completed",
  "follow_up_deadline": null,
  "follow_up_notes": null,
  "attachments": [],
  "status": "active",
  "created_by": null,
  "created_at": "2026-05-28T16:00:29.350Z",
  "updated_at": "2026-05-28T16:00:29.350Z"
}
```

---

#### <a id="material_mines"></a> 70. `material_mines` (Mỏ vật liệu xây dựng phục vụ dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | `NO` | `` |
| 3 | `mine_type` | `USER-DEFINED` | `NO` | `'Khác'::mine_type_enum` |
| 4 | `status` | `USER-DEFINED` | `NO` | `'Quy hoạch'::mine_status_enum` |
| 5 | `capacity` | `character varying` | `YES` | `` |
| 6 | `address` | `text` | `YES` | `` |
| 7 | `coordinates` | `jsonb` | `YES` | `` |
| 8 | `notes` | `text` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "93e1f1e4-8de7-4cbb-9751-14b4763cfe77",
  "name": "Mỏ đá Thạch Ngọc",
  "mine_type": "Đá",
  "status": "Đang khai thác",
  "capacity": "5.2 triệu m3",
  "address": "Xã Thạch Ngọc, Huyện Thạch Hà, Tỉnh Hà Tĩnh",
  "coordinates": {
    "lat": 18.3541,
    "lng": 105.8234
  },
  "notes": "Chuyên cung cấp đá xây dựng, đá hộc, đá dăm các loại.",
  "created_at": "2026-05-12T06:35:59.389Z",
  "updated_at": "2026-05-12T06:35:59.389Z"
}
```

---

### 10. Mô hình thông tin công trình BIM (Building Information Modeling)

#### <a id="bim_models"></a> 71. `bim_models` (Quản lý tệp tin mô hình 3D/BIM)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `file_name` | `text` | `NO` | `` |
| 4 | `file_size` | `bigint` | `YES` | `` |
| 5 | `ifc_path` | `text` | `YES` | `` |
| 6 | `frag_path` | `text` | `YES` | `` |
| 7 | `properties_path` | `text` | `YES` | `` |
| 8 | `status` | `text` | `YES` | `'uploaded'::text` |
| 9 | `discipline` | `text` | `YES` | `` |
| 10 | `element_count` | `integer` | `YES` | `` |
| 11 | `error_message` | `text` | `YES` | `` |
| 12 | `uploaded_by` | `text` | `YES` | `` |
| 13 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 14 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |
| 15 | `cde_folder_id` | `uuid` | `YES` | `` |
| 16 | `cde_status` | `text` | `YES` | `` |
| 17 | `version_group_id` | `uuid` | `YES` | `gen_random_uuid()` |
| 18 | `is_latest` | `boolean` | `YES` | `true` |
| 19 | `sensitivity_level` | `integer` | `YES` | `1` |
| 20 | `submitted_by_org` | `text` | `YES` | `` |
| 21 | `contractor_id` | `text` | `YES` | `` |
| 22 | `file_hash` | `text` | `YES` | `` |
| 23 | `is_encrypted` | `boolean` | `YES` | `false` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "8cc40676-d1e3-44c2-888b-efdd52c3adb4",
  "project_id": "8133114",
  "file_name": "25001-BVBC_CIC_LAND_XX_XX.ifc",
  "file_size": "1188197",
  "ifc_path": "8133114/25001-BVBC_CIC_LAND_XX_XX.ifc",
  "frag_path": "8133114/25001-BVBC_CIC_LAND_XX_XX.frag",
  "properties_path": "8133114/25001-BVBC_CIC_LAND_XX_XX-properties.json",
  "status": "ready",
  "discipline": "LAND",
  "element_count": null,
  "error_message": null,
  "uploaded_by": null,
  "created_at": "2026-05-29T09:29:47.996Z",
  "updated_at": "2026-05-29T09:29:47.996Z",
  "cde_folder_id": null,
  "cde_status": null,
  "version_group_id": "c32df417-a88b-4a9d-9f79-aae71d6a9ae0",
  "is_latest": true,
  "sensitivity_level": 1,
  "submitted_by_org": null,
  "contractor_id": null,
  "file_hash": "aaa3c1dab1cdf45b0ac44f710eddd0c0ee35f0945bebaaac9f36e84e2c65d8c5",
  "is_encrypted": false
}
```

---

#### <a id="bim_project_settings"></a> 72. `bim_project_settings` (Cấu hình toạ độ và thông số BIM dự án)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `project_id` | `text` | `NO` | `` |
| 2 | `coord_offset` | `jsonb` | `YES` | `` |
| 3 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "project_id": "8133114",
  "coord_offset": {
    "x": -270636834.67977077,
    "y": 3122.597370176898,
    "z": 1014994068.9545119
  },
  "updated_at": "2026-05-29T09:00:37.367Z"
}
```

---

#### <a id="bim_saved_views"></a> 73. `bim_saved_views` (Góc nhìn phối cảnh BIM được lưu trữ)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `name` | `text` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `` |
| 5 | `state` | `jsonb` | `NO` | `` |
| 6 | `thumbnail_url` | `text` | `YES` | `` |
| 7 | `created_by` | `text` | `YES` | `` |
| 8 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="bim_issues"></a> 74. `bim_issues` (Quản lý các vấn đề, va chạm trên mô hình BIM)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `title` | `text` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `` |
| 5 | `status` | `text` | `NO` | `'open'::text` |
| 6 | `priority` | `text` | `NO` | `'normal'::text` |
| 7 | `viewpoint` | `jsonb` | `YES` | `` |
| 8 | `screenshot_url` | `text` | `YES` | `` |
| 9 | `target_express_id` | `integer` | `YES` | `` |
| 10 | `target_model_id` | `text` | `YES` | `` |
| 11 | `assigned_to` | `text` | `YES` | `` |
| 12 | `due_date` | `date` | `YES` | `` |
| 13 | `created_by` | `text` | `YES` | `` |
| 14 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 15 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |
| 16 | `resolved_at` | `timestamp with time zone` | `YES` | `` |
| 17 | `source` | `text` | `NO` | `'bim_3d'::text` |
| 18 | `doc_id` | `integer` | `YES` | `` |
| 19 | `page` | `integer` | `YES` | `` |
| 20 | `pin_x` | `real` | `YES` | `` |
| 21 | `pin_y` | `real` | `YES` | `` |
| 22 | `markup` | `jsonb` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="bim_issue_comments"></a> 75. `bim_issue_comments` (Thảo luận và phản hồi vấn đề BIM)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `issue_id` | `text` | `NO` | `` |
| 3 | `body` | `text` | `NO` | `` |
| 4 | `author` | `text` | `YES` | `` |
| 5 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 11. Đánh giá KPI & Điểm số tháng (KPIs & Monthly Scores)

#### <a id="individual_monthly_scores"></a> 76. `individual_monthly_scores` (Bảng điểm KPI đánh giá cá nhân theo tháng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `employee_id` | `text` | `NO` | `` |
| 3 | `department_code` | `text` | `NO` | `` |
| 4 | `eval_month` | `integer` | `NO` | `` |
| 5 | `eval_year` | `integer` | `NO` | `` |
| 6 | `a1_total_tasks` | `integer` | `YES` | `0` |
| 7 | `a1_done_tasks` | `integer` | `YES` | `0` |
| 8 | `a1_completion_rate` | `numeric` | `YES` | `0` |
| 9 | `a1_score` | `numeric` | `YES` | `0` |
| 10 | `a2_score` | `numeric` | `YES` | `0` |
| 11 | `a2_notes` | `text` | `YES` | `` |
| 12 | `a3_on_time_done` | `integer` | `YES` | `0` |
| 13 | `a3_total_done` | `integer` | `YES` | `0` |
| 14 | `a3_on_time_rate` | `numeric` | `YES` | `0` |
| 15 | `a3_score` | `numeric` | `YES` | `0` |
| 16 | `has_projects` | `boolean` | `YES` | `false` |
| 17 | `b1_weighted_rate` | `numeric` | `YES` | `0` |
| 18 | `b1_score` | `numeric` | `YES` | `0` |
| 19 | `b2_score` | `numeric` | `YES` | `0` |
| 20 | `b2_notes` | `text` | `YES` | `` |
| 21 | `c1_score` | `numeric` | `YES` | `0` |
| 22 | `c1_notes` | `text` | `YES` | `` |
| 23 | `c2_score` | `numeric` | `YES` | `0` |
| 24 | `c2_notes` | `text` | `YES` | `` |
| 25 | `c3_score` | `numeric` | `YES` | `0` |
| 26 | `c3_notes` | `text` | `YES` | `` |
| 27 | `is_disbursement_staff` | `boolean` | `YES` | `true` |
| 28 | `group_a_total` | `numeric` | `YES` | `0` |
| 29 | `group_b_total` | `numeric` | `YES` | `0` |
| 30 | `group_c_total` | `numeric` | `YES` | `0` |
| 31 | `total_score` | `numeric` | `YES` | `0` |
| 32 | `classification` | `text` | `YES` | `` |
| 33 | `status` | `text` | `YES` | `'draft'::text` |
| 34 | `scored_by` | `text` | `YES` | `` |
| 35 | `scored_at` | `timestamp with time zone` | `YES` | `` |
| 36 | `approved_by` | `text` | `YES` | `` |
| 37 | `approved_at` | `timestamp with time zone` | `YES` | `` |
| 38 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 39 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "fdc23b0e-2061-4da4-ab8a-8763ddd63a09",
  "employee_id": "NV053",
  "department_code": "Phòng Quản lý dự án 1",
  "eval_month": 5,
  "eval_year": 2026,
  "a1_total_tasks": 4,
  "a1_done_tasks": 0,
  "a1_completion_rate": "0.00",
  "a1_score": "4.0",
  "a2_score": "0.0",
  "a2_notes": null,
  "a3_on_time_done": 0,
  "a3_total_done": 0,
  "a3_on_time_rate": "0.00",
  "a3_score": "3.0",
  "has_projects": false,
  "b1_weighted_rate": "0.00",
  "b1_score": "0.0",
  "b2_score": "0.0",
  "b2_notes": null,
  "c1_score": "0.0",
  "c1_notes": null,
  "c2_score": "0.0",
  "c2_notes": null,
  "c3_score": "0.0",
  "c3_notes": null,
  "is_disbursement_staff": true,
  "group_a_total": "0.00",
  "group_b_total": "0.00",
  "group_c_total": "0.00",
  "total_score": "7.00",
  "classification": "khong_hoan_thanh",
  "status": "calculated",
  "scored_by": null,
  "scored_at": null,
  "approved_by": null,
  "approved_at": null,
  "created_at": "2026-05-26T06:34:48.000Z",
  "updated_at": "2026-05-26T06:34:48.000Z"
}
```

---

#### <a id="individual_project_disbursement"></a> 77. `individual_project_disbursement` (Chi tiết điểm giải ngân dự án của cá nhân)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `score_id` | `uuid` | `YES` | `` |
| 3 | `project_id` | `uuid` | `YES` | `` |
| 4 | `project_name` | `text` | `YES` | `` |
| 5 | `capital_plan` | `numeric` | `YES` | `0` |
| 6 | `disbursed` | `numeric` | `YES` | `0` |
| 7 | `rate` | `numeric` | `YES` | `0` |
| 8 | `weight` | `numeric` | `YES` | `0` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="department_monthly_scores"></a> 78. `department_monthly_scores` (Bảng điểm đánh giá phòng ban theo tháng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `department_code` | `text` | `NO` | `` |
| 3 | `eval_month` | `integer` | `NO` | `` |
| 4 | `eval_year` | `integer` | `NO` | `` |
| 5 | `a1_total_tasks` | `integer` | `YES` | `0` |
| 6 | `a1_done_tasks` | `integer` | `YES` | `0` |
| 7 | `a1_completion_rate` | `numeric` | `YES` | `0` |
| 8 | `a1_score` | `numeric` | `YES` | `0` |
| 9 | `a2_score` | `numeric` | `YES` | `0` |
| 10 | `a2_notes` | `text` | `YES` | `` |
| 11 | `a3_on_time_done` | `integer` | `YES` | `0` |
| 12 | `a3_total_done` | `integer` | `YES` | `0` |
| 13 | `a3_on_time_rate` | `numeric` | `YES` | `0` |
| 14 | `a3_score` | `numeric` | `YES` | `0` |
| 15 | `b1_disbursement_rate` | `numeric` | `YES` | `0` |
| 16 | `b1_score` | `numeric` | `YES` | `0` |
| 17 | `b2_target_rate` | `numeric` | `YES` | `0` |
| 18 | `b2_score` | `numeric` | `YES` | `0` |
| 19 | `c1_score` | `numeric` | `YES` | `0` |
| 20 | `c1_notes` | `text` | `YES` | `` |
| 21 | `c2_score` | `numeric` | `YES` | `0` |
| 22 | `c2_notes` | `text` | `YES` | `` |
| 23 | `is_disbursement_dept` | `boolean` | `YES` | `true` |
| 24 | `group_a_total` | `numeric` | `YES` | `0` |
| 25 | `group_b_total` | `numeric` | `YES` | `0` |
| 26 | `group_c_total` | `numeric` | `YES` | `0` |
| 27 | `total_score` | `numeric` | `YES` | `0` |
| 28 | `classification` | `text` | `YES` | `` |
| 29 | `status` | `text` | `YES` | `'draft'::text` |
| 30 | `calculated_at` | `timestamp with time zone` | `YES` | `` |
| 31 | `reviewed_by` | `text` | `YES` | `` |
| 32 | `reviewed_at` | `timestamp with time zone` | `YES` | `` |
| 33 | `approved_by` | `text` | `YES` | `` |
| 34 | `approved_at` | `timestamp with time zone` | `YES` | `` |
| 35 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 36 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "e55932f6-459d-44c8-ba93-108950de48b3",
  "department_code": "HCTH",
  "eval_month": 5,
  "eval_year": 2026,
  "a1_total_tasks": 0,
  "a1_done_tasks": 0,
  "a1_completion_rate": "0.00",
  "a1_score": "4.0",
  "a2_score": "0.0",
  "a2_notes": null,
  "a3_on_time_done": 0,
  "a3_total_done": 0,
  "a3_on_time_rate": "0.00",
  "a3_score": "3.0",
  "b1_disbursement_rate": "0.00",
  "b1_score": "0.0",
  "b2_target_rate": "0.00",
  "b2_score": "0.0",
  "c1_score": "0.0",
  "c1_notes": null,
  "c2_score": "0.0",
  "c2_notes": null,
  "is_disbursement_dept": false,
  "group_a_total": "0.00",
  "group_b_total": "0.00",
  "group_c_total": "0.00",
  "total_score": "7.00",
  "classification": "khong_hoan_thanh",
  "status": "reviewed",
  "calculated_at": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "approved_by": null,
  "approved_at": null,
  "created_at": "2026-05-26T06:34:43.662Z",
  "updated_at": "2026-05-26T06:34:43.662Z"
}
```

---

#### <a id="evaluation_forms"></a> 79. `evaluation_forms` (Mẫu đánh giá KPI tiêu chuẩn)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `employee_id` | `text` | `NO` | `` |
| 3 | `employee_name` | `text` | `NO` | `''::text` |
| 4 | `department_code` | `character varying` | `NO` | `''::character varying` |
| 5 | `department_name` | `text` | `NO` | `''::text` |
| 6 | `eval_month` | `integer` | `NO` | `` |
| 7 | `eval_year` | `integer` | `NO` | `` |
| 8 | `self_score_1` | `numeric` | `NO` | `0` |
| 9 | `self_score_2` | `numeric` | `NO` | `0` |
| 10 | `self_score_3` | `numeric` | `NO` | `0` |
| 11 | `self_score_4` | `numeric` | `NO` | `0` |
| 12 | `self_score_5` | `numeric` | `NO` | `0` |
| 13 | `self_score_6` | `numeric` | `NO` | `0` |
| 14 | `self_score_7` | `numeric` | `NO` | `0` |
| 15 | `self_notes` | `text` | `YES` | `` |
| 16 | `self_submitted_at` | `timestamp with time zone` | `YES` | `` |
| 17 | `manager_score_1` | `numeric` | `YES` | `` |
| 18 | `manager_score_2` | `numeric` | `YES` | `` |
| 19 | `manager_score_3` | `numeric` | `YES` | `` |
| 20 | `manager_score_4` | `numeric` | `YES` | `` |
| 21 | `manager_score_5` | `numeric` | `YES` | `` |
| 22 | `manager_score_6` | `numeric` | `YES` | `` |
| 23 | `manager_score_7` | `numeric` | `YES` | `` |
| 24 | `manager_notes` | `text` | `YES` | `` |
| 25 | `manager_id` | `text` | `YES` | `` |
| 26 | `manager_name` | `text` | `YES` | `` |
| 27 | `reviewed_at` | `timestamp with time zone` | `YES` | `` |
| 28 | `status` | `text` | `NO` | `'draft'::text` |
| 29 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 30 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 31 | `chuc_vu` | `text` | `YES` | `` |
| 32 | `self_scores` | `jsonb` | `YES` | `'{}'::jsonb` |
| 33 | `manager_scores` | `jsonb` | `YES` | `'{}'::jsonb` |
| 34 | `form_type` | `text` | `NO` | `'staff'::text` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "06d7606f-99df-4b9c-a1ed-2b233c40d27e",
  "employee_id": "NV110",
  "employee_name": "Từ Hữu Tuấn",
  "department_code": "QLDA3",
  "department_name": "Phòng Quản lý dự án 3",
  "eval_month": 4,
  "eval_year": 2026,
  "self_score_1": "0.00",
  "self_score_2": "0.00",
  "self_score_3": "0.00",
  "self_score_4": "0.00",
  "self_score_5": "0.00",
  "self_score_6": "0.00",
  "self_score_7": "0.00",
  "self_notes": null,
  "self_submitted_at": "2026-04-30T03:41:24.000Z",
  "manager_score_1": null,
  "manager_score_2": null,
  "manager_score_3": null,
  "manager_score_4": null,
  "manager_score_5": null,
  "manager_score_6": null,
  "manager_score_7": null,
  "manager_notes": null,
  "manager_id": null,
  "manager_name": null,
  "reviewed_at": "2026-05-02T03:41:24.000Z",
  "status": "approved",
  "created_at": "2026-05-11T04:56:06.567Z",
  "updated_at": "2026-05-11T05:03:35.624Z",
  "chuc_vu": "Lao động hợp đồng",
  "self_scores": {
    "g1": {
      "s1": 5,
      "s2": 5,
      "s3": 2,
      "s4": 5
    },
    "g3": {
      "bonus1": false,
      "bonus2": true
    },
    "g4": {
      "d1": false,
      "d2": false,
      "d3": false,
      "d4": false,
      "d5": false
    },
    "g2_1": {
      "s1": 1,
      "s2": 1,
      "s3": 2,
      "s4": 2,
      "s5": 2,
      "s6": 2,
      "s7": 2,
      "s8": 2,
      "s9": 2,
      "s10": 2
    },
    "g2_2": {
      "level": "2.1",
      "score": 55
    },
    "formType": "staff"
  },
  "manager_scores": {
    "g1": {
      "s1": 4,
      "s2": 5,
      "s3": 2,
      "s4": 6
    },
    "g3": {
      "bonus1": false,
      "bonus2": false
    },
    "g4": {
      "d1": false,
      "d2": false,
      "d3": false,
      "d4": false,
      "d5": false
    },
    "g2_1": {
      "s1": 1,
      "s2": 1,
      "s3": 2,
      "s4": 2,
      "s5": 2,
      "s6": 2,
      "s7": 2,
      "s8": 2,
      "s9": 2,
      "s10": 2
    },
    "g2_2": {
      "level": "2.1",
      "score": 55
    },
    "formType": "staff"
  },
  "form_type": "staff"
}
```

---

### 12. Quản lý Tài sản công (Public Asset Management)

#### <a id="public_assets"></a> 80. `public_assets` (Danh sách tài sản công được quản lý)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `asset_code` | `character varying` | `NO` | `` |
| 3 | `asset_name` | `character varying` | `NO` | `` |
| 4 | `category_id` | `uuid` | `NO` | `` |
| 5 | `description` | `text` | `YES` | `` |
| 6 | `unit` | `character varying` | `NO` | `` |
| 7 | `quantity` | `integer` | `NO` | `1` |
| 8 | `location` | `character varying` | `YES` | `` |
| 9 | `department` | `character varying` | `YES` | `` |
| 10 | `custodian_id` | `text` | `YES` | `` |
| 11 | `project_id` | `text` | `YES` | `` |
| 12 | `purchase_date` | `date` | `NO` | `` |
| 13 | `use_date` | `date` | `NO` | `` |
| 14 | `original_cost` | `numeric` | `NO` | `0.00` |
| 15 | `funding_budget_cost` | `numeric` | `YES` | `0.00` |
| 16 | `funding_other_cost` | `numeric` | `YES` | `0.00` |
| 17 | `depreciation_rate` | `numeric` | `NO` | `0.00` |
| 18 | `accumulated_depreciation` | `numeric` | `NO` | `0.00` |
| 19 | `remaining_value` | `numeric` | `NO` | `0.00` |
| 20 | `status` | `character varying` | `NO` | `'active'::character varying` |
| 21 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 22 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |
| 23 | `branch` | `character varying` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "4cf065e7-05cf-4cb5-b893-9ee985d39c50",
  "asset_code": "DAT-CANLC-001",
  "asset_name": "Đất xây dựng trụ sở làm việc Can Lộc",
  "category_id": "3bc28e91-5804-4586-a0dc-cef4e72ef2b8",
  "description": null,
  "unit": "M2",
  "quantity": 1,
  "location": "Can Lộc",
  "department": null,
  "custodian_id": null,
  "project_id": null,
  "purchase_date": "2018-12-31T17:00:00.000Z",
  "use_date": "2018-12-31T17:00:00.000Z",
  "original_cost": "2239650000.00",
  "funding_budget_cost": "0.00",
  "funding_other_cost": "0.00",
  "depreciation_rate": "0.00",
  "accumulated_depreciation": "0.00",
  "remaining_value": "2239650000.00",
  "status": "active",
  "created_at": "2026-05-21T09:19:23.281Z",
  "updated_at": "2026-05-21T09:19:23.281Z",
  "branch": "Can Lộc"
}
```

---

#### <a id="public_asset_categories"></a> 81. `public_asset_categories` (Danh mục nhóm tài sản công)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `code` | `character varying` | `NO` | `` |
| 3 | `name` | `character varying` | `NO` | `` |
| 4 | `parent_id` | `uuid` | `YES` | `` |
| 5 | `asset_type` | `character varying` | `NO` | `` |
| 6 | `depreciation_rate` | `numeric` | `YES` | `0.00` |
| 7 | `useful_life_years` | `integer` | `YES` | `0` |
| 8 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "3bc28e91-5804-4586-a0dc-cef4e72ef2b8",
  "code": "LAND",
  "name": "Đất (Khuôn viên trụ sở, cơ sở sự nghiệp)",
  "parent_id": null,
  "asset_type": "tangible",
  "depreciation_rate": "0.00",
  "useful_life_years": 0,
  "created_at": "2026-05-21T02:10:52.053Z"
}
```

---

#### <a id="public_asset_inventories"></a> 82. `public_asset_inventories` (Phiếu kiểm kê tài sản công định kỳ)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `title` | `character varying` | `NO` | `` |
| 3 | `inventory_date` | `date` | `NO` | `` |
| 4 | `status` | `character varying` | `YES` | `'draft'::character varying` |
| 5 | `notes` | `text` | `YES` | `` |
| 6 | `created_by` | `uuid` | `YES` | `` |
| 7 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="public_asset_inventory_details"></a> 83. `public_asset_inventory_details` (Chi tiết kết quả kiểm kê tài sản công)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `inventory_id` | `uuid` | `NO` | `` |
| 3 | `asset_id` | `uuid` | `NO` | `` |
| 4 | `book_quantity` | `integer` | `NO` | `` |
| 5 | `actual_quantity` | `integer` | `NO` | `` |
| 6 | `difference_quantity` | `integer` | `YES` | `` |
| 7 | `condition` | `character varying` | `YES` | `` |
| 8 | `notes` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="public_asset_transactions"></a> 84. `public_asset_transactions` (Lịch sử biến động, điều chuyển tài sản công)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `asset_id` | `uuid` | `NO` | `` |
| 3 | `transaction_date` | `date` | `NO` | `` |
| 4 | `transaction_type` | `character varying` | `NO` | `` |
| 5 | `reason` | `character varying` | `NO` | `` |
| 6 | `description` | `text` | `YES` | `` |
| 7 | `decision_number` | `character varying` | `YES` | `` |
| 8 | `decision_date` | `date` | `YES` | `` |
| 9 | `cost_change` | `numeric` | `YES` | `0.00` |
| 10 | `depreciation_change` | `numeric` | `YES` | `0.00` |
| 11 | `created_by` | `uuid` | `YES` | `` |
| 12 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 13. Văn bản Pháp luật & Quy chế nội bộ (Legal & Regulations)

#### <a id="legal_documents"></a> 85. `legal_documents` (Văn bản pháp luật, quy chuẩn nhà nước)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `code` | `text` | `NO` | `` |
| 3 | `title` | `text` | `NO` | `` |
| 4 | `short_title` | `text` | `YES` | `` |
| 5 | `type` | `USER-DEFINED` | `NO` | `` |
| 6 | `issued_date` | `text` | `YES` | `` |
| 7 | `effective_date` | `text` | `YES` | `` |
| 8 | `issued_by` | `text` | `YES` | `` |
| 9 | `status` | `USER-DEFINED` | `NO` | `'hieu-luc'::doc_status` |
| 10 | `summary` | `text` | `YES` | `` |
| 11 | `file_name` | `text` | `YES` | `` |
| 12 | `file_path` | `text` | `YES` | `` |
| 13 | `file_size` | `text` | `YES` | `` |
| 14 | `tags` | `ARRAY` | `YES` | `'{}'::text[]` |
| 15 | `related_doc_ids` | `ARRAY` | `YES` | `'{}'::text[]` |
| 16 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 17 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 18 | `fts` | `tsvector` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "luat-dau-tu-cong-2024",
  "code": "Luật số 58/2024/QH15",
  "title": "Luật Đầu tư công",
  "short_title": "Luật Đầu tư công 2024",
  "type": "luat",
  "issued_date": "29/11/2024",
  "effective_date": "01/01/2025",
  "issued_by": "Quốc hội",
  "status": "hieu-luc",
  "summary": "Quy định việc quản lý nhà nước về đầu tư công; quản lý và sử dụng vốn đầu tư công; quyền, nghĩa vụ và trách nhiệm của cơ quan, đơn vị, tổ chức, cá nhân liên quan đến hoạt động đầu tư công. Thay thế Luật Đầu tư công số 39/2019/QH14.",
  "file_name": "Luật đầu tư công.pdf",
  "file_path": "/resources/Luật đầu tư công.pdf",
  "file_size": "12.6 MB",
  "tags": [
    "đầu tư công",
    "vốn nhà nước",
    "kế hoạch đầu tư",
    "thẩm định dự án",
    "ODA",
    "giám sát đầu tư"
  ],
  "related_doc_ids": [
    "nd-175-2024",
    "nd-111-2024"
  ],
  "created_at": "2026-05-12T04:23:01.762Z",
  "updated_at": "2026-05-12T04:36:23.348Z",
  "fts": "'39/2019/qh14':55 '58/2024/qh15':58 'chức':37 'cá':38 'công':4,15,24,47,53 'cơ':32 'của':31 'dụng':20 'hoạt':43 'liên':40 'luật':1,50,56 'lý':9,17 'nghĩa':26 'nhiệm':30 'nhà':10 'nhân':39 'nước':11 'quan':33,41 'quy':5 'quyền':25 'quản':8,16 'số':54,57 'sử':19 'thay':48 'thế':49 'trách':29 'tư':3,14,23,46,52 'tổ':36 'việc':7 'và':18,28 'về':12 'vị':35 'vốn':21 'vụ':27 'đơn':34 'đầu':2,13,22,45,51 'đến':42 'định':6 'động':44"
}
```

---

#### <a id="legal_chapters"></a> 86. `legal_chapters` (Chương trong văn bản pháp luật)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `document_id` | `text` | `NO` | `` |
| 3 | `code` | `text` | `NO` | `` |
| 4 | `title` | `text` | `NO` | `` |
| 5 | `sort_order` | `integer` | `NO` | `0` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "luat93-ch1",
  "document_id": "luat-khcn-2025",
  "code": "Chương I",
  "title": "Quy định chung",
  "sort_order": 0
}
```

---

#### <a id="legal_articles"></a> 87. `legal_articles` (Điều khoản cụ thể trong văn bản pháp luật)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `chapter_id` | `text` | `NO` | `` |
| 3 | `document_id` | `text` | `NO` | `` |
| 4 | `code` | `text` | `NO` | `` |
| 5 | `title` | `text` | `NO` | `` |
| 6 | `summary` | `text` | `YES` | `` |
| 7 | `content` | `text` | `YES` | `` |
| 8 | `full_content` | `text` | `YES` | `` |
| 9 | `sort_order` | `integer` | `NO` | `0` |
| 10 | `fts` | `tsvector` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "luat58-d3",
  "chapter_id": "luat58-ch1",
  "document_id": "luat-dau-tu-cong-2024",
  "code": "Điều 3",
  "title": "Áp dụng Luật Đầu tư công, điều ước quốc tế, thỏa thuận quốc tế",
  "summary": "1. Việc quản lý, sử dụng vốn đầu tư công, hoạt động đầu tư công phải tuân thủ quy định của Luật này và quy định khác của pháp luật có liên quan. 2. Trường hợp điều ước quốc tế mà nước Cộng hòa xã hội chủ nghĩa Việt Nam là thành viên có quy định kh...",
  "content": "1. Việc quản lý, sử dụng vốn đầu tư công, hoạt động đầu tư công phải tuân thủ quy định của Luật này và quy định khác của pháp luật có liên quan.\n2. Trường hợp điều ước quốc tế mà nước Cộng hòa xã hội chủ nghĩa Việt Nam là thành viên có quy định khác với quy định của Luật này thì áp dụng theo quy định của điều ước quốc tế đó.\n3. Việc thực hiện chương trình, dự án đầu tư công tại nước ngoài tuân thủ quy định của điều ước quốc tế mà nước Cộng hòa xã hội chủ nghĩa Việt Nam là thành viên, thỏa thuận quốc tế giữa bên Việt Nam với bên nước ngoài.\n4. Việc quản lý, sử dụng vốn đầu tư của Nhà nước tại doanh nghiệp thực hiện theo quy định của pháp luật về quản lý, sử dụng vốn nhà nước đầu tư vào sản xuất, kinh doanh tại doanh nghiệp.",
  "full_content": null,
  "sort_order": 2,
  "fts": "'1':15,72 '2':48,105 '3':147 '4':195 'bên':188,192 'chương':151 'chủ':61,118,176 'có':45,68,102,125 'công':6,24,29,81,86,157 'cộng':57,114,172 'của':35,42,92,99,132,141,165,204,215 'doanh':208,232,234 'dụng':2,20,77,137,200,222 'dự':153 'giữa':187 'hiện':150,211 'hoạt':25,82 'hòa':58,115,173 'hội':60,117,175 'hợp':50,107 'kh':71 'khác':41,98,128 'kinh':231 'liên':46,103 'luật':3,36,44,93,101,133,217 'là':65,122,180 'lý':18,75,198,220 'mà':55,112,170 'nam':64,121,179,190 'nghiệp':209,235 'nghĩa':62,119,177 'ngoài':160,194 'nhà':205,224 'này':37,94,134 'nước':56,113,159,171,193,206,225 'pháp':43,100,216 'phải':30,87 'quan':47,104 'quy':33,39,69,90,96,126,130,139,163,213 'quản':17,74,197,219 'quốc':9,13,53,110,144,168,185 'sản':229 'sử':19,76,199,221 'theo':138,212 'thuận':12,184 'thành':66,123,181 'thì':135 'thỏa':11,183 'thủ':32,89,162 'thực':149,210 'trình':152 'trường':49,106 'tuân':31,88,161 'tư':5,23,28,80,85,156,203,227 'tại':158,207,233 'tế':10,14,54,111,145,169,186 'viên':67,124,182 'việc':16,73,148,196 'việt':63,120,178,189 'và':38,95 'vào':228 'về':218 'vốn':21,78,201,223 'với':129,191 'xuất':230 'xã':59,116,174 'án':154 'áp':1,136 'điều':7,51,108,142,166 'đó':146 'đầu':4,22,27,79,84,155,202,226 'định':34,40,70,91,97,127,131,140,164,214 'động':26,83 'ước':8,52,109,143,167"
}
```

---

#### <a id="regulations"></a> 88. `regulations` (Quy định, quy chế nội bộ cơ quan)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `chapter_code` | `text` | `NO` | `` |
| 3 | `chapter_title` | `text` | `NO` | `` |
| 4 | `article_code` | `text` | `NO` | `` |
| 5 | `article_title` | `text` | `NO` | `` |
| 6 | `content` | `text` | `NO` | `` |
| 7 | `content_json` | `jsonb` | `YES` | `` |
| 8 | `embedding` | `USER-DEFINED` | `YES` | `` |
| 9 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "df0b6727-c8a5-4675-bed6-0f50f8435da4",
  "chapter_code": "Chương I",
  "chapter_title": "NHỮNG QUY ĐỊNH CHUNG",
  "article_code": "Điều 1",
  "article_title": "Phạm vi điều chỉnh và đối tượng áp dụng",
  "content": "1. Phạm vi điều chỉnh\nQuy chế này quy định nguyên tắc làm việc; chức năng, nhiệm vụ các phòng; quyền hạn, trách nhiệm, cách thức giải quyết công việc; chế độ làm việc; mối quan hệ công tác; trình tự giải quyết công việc của Ban QLDA đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh (sau đây gọi tắt là Ban QLDA).\n2. Đối tượng áp dụng\nQuy chế này áp dụng đối với tất cả viên chức (VC), người lao động (NLĐ) của Ban QLDA.\nCác tổ chức, cá nhân bên ngoài khi đến làm việc, liên hệ công tác với Ban QLDA phải chấp hành quy định của Ban QLDA và các quy định liên quan trong phạm vi trách nhiệm, quyền hạn của mình.",
  "content_json": [
    "1. Phạm vi điều chỉnh",
    "Quy chế này quy định nguyên tắc làm việc; chức năng, nhiệm vụ các phòng; quyền hạn, trách nhiệm, cách thức giải quyết công việc; chế độ làm việc; mối quan hệ công tác; trình tự giải quyết công việc của Ban QLDA đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh (sau đây gọi tắt là Ban QLDA).",
    "2. Đối tượng áp dụng",
    "Quy chế này áp dụng đối với tất cả viên chức (VC), người lao động (NLĐ) của Ban QLDA.",
    "Các tổ chức, cá nhân bên ngoài khi đến làm việc, liên hệ công tác với Ban QLDA phải chấp hành quy định của Ban QLDA và các quy định liên quan trong phạm vi trách nhiệm, quyền hạn của mình."
  ],
  "embedding": null,
  "created_at": "2026-05-17T06:40:53.816Z",
  "updated_at": "2026-05-17T06:40:53.816Z"
}
```

---

#### <a id="regulation_documents"></a> 89. `regulation_documents` (Tài liệu đính kèm quy chế nội bộ)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `code` | `text` | `NO` | `` |
| 3 | `title` | `text` | `NO` | `` |
| 4 | `description` | `text` | `YES` | `''::text` |
| 5 | `date` | `text` | `YES` | `''::text` |
| 6 | `effective_date` | `text` | `YES` | `` |
| 7 | `status` | `text` | `NO` | `'draft'::text` |
| 8 | `pdf_url` | `text` | `YES` | `` |
| 9 | `sort_order` | `integer` | `YES` | `0` |
| 10 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "doc-qclv",
  "code": "QCLV-2026",
  "title": "Quy chế làm việc Ban QLDA",
  "description": "Quy chế làm việc của Ban Quản lý dự án đầu tư xây dựng các công trình dân dụng và công nghiệp.",
  "date": "2026",
  "effective_date": null,
  "status": "active",
  "pdf_url": null,
  "sort_order": 1,
  "created_at": "2026-06-04T09:35:06.689Z",
  "updated_at": "2026-06-04T09:35:06.689Z"
}
```

---

#### <a id="regulation_chapters"></a> 90. `regulation_chapters` (Chương của quy định nội bộ)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `document_id` | `text` | `NO` | `` |
| 3 | `code` | `text` | `NO` | `` |
| 4 | `title` | `text` | `NO` | `` |
| 5 | `icon` | `text` | `YES` | `` |
| 6 | `sort_order` | `integer` | `YES` | `0` |
| 7 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 8 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "qclv-chuong-i",
  "document_id": "doc-qclv",
  "code": "Chương I",
  "title": "NHỮNG QUY ĐỊNH CHUNG",
  "icon": "FileText",
  "sort_order": 1,
  "created_at": "2026-06-04T09:35:06.689Z",
  "updated_at": "2026-06-04T09:35:06.689Z"
}
```

---

#### <a id="regulation_articles"></a> 91. `regulation_articles` (Điều khoản cụ thể của quy định nội bộ)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `` |
| 2 | `chapter_id` | `text` | `NO` | `` |
| 3 | `code` | `text` | `NO` | `` |
| 4 | `title` | `text` | `NO` | `` |
| 5 | `content` | `text` | `YES` | `''::text` |
| 6 | `content_type` | `text` | `YES` | `'text'::text` |
| 7 | `component_key` | `text` | `YES` | `` |
| 8 | `sort_order` | `integer` | `YES` | `0` |
| 9 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "chuong-i-ieu-1",
  "chapter_id": "qclv-chuong-i",
  "code": "Điều 1",
  "title": "Phạm vi điều chỉnh và đối tượng áp dụng",
  "content": "1. Phạm vi điều chỉnh\n\nQuy chế này quy định nguyên tắc làm việc; chức năng, nhiệm vụ các phòng; quyền hạn, trách nhiệm, cách thức giải quyết công việc; chế độ làm việc; mối quan hệ công tác; trình tự giải quyết công việc của Ban QLDA đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh (sau đây gọi tắt là Ban QLDA).\n\n2. Đối tượng áp dụng\n\nQuy chế này áp dụng đối với tất cả viên chức (VC), người lao động (NLĐ) của Ban QLDA.\n\nCác tổ chức, cá nhân bên ngoài khi đến làm việc, liên hệ công tác với Ban QLDA phải chấp hành quy định của Ban QLDA và các quy định liên quan trong phạm vi trách nhiệm, quyền hạn của mình.",
  "content_type": "text",
  "component_key": null,
  "sort_order": 1,
  "created_at": "2026-06-04T09:44:14.857Z",
  "updated_at": "2026-06-04T09:44:14.857Z"
}
```

---

#### <a id="regulation_bookmarks"></a> 92. `regulation_bookmarks` (Danh sách điều khoản quy định được lưu đánh dấu)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | `NO` | `` |
| 3 | `document_id` | `text` | `NO` | `` |
| 4 | `article_id` | `text` | `NO` | `` |
| 5 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 14. Hệ thống & Khác (System & Utilities)

#### <a id="audit_logs"></a> 93. `audit_logs` (Nhật ký hoạt động chung toàn hệ thống)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `log_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `action` | `text` | `NO` | `` |
| 3 | `target_entity` | `text` | `NO` | `` |
| 4 | `target_id` | `text` | `NO` | `` |
| 5 | `changed_by` | `text` | `NO` | `` |
| 6 | `details` | `text` | `YES` | `` |
| 7 | `timestamp` | `timestamp with time zone` | `NO` | `now()` |
| 8 | `created_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "log_id": "0fb08886-01e3-4616-b030-cd9eba95ea98",
  "action": "impersonation_start",
  "target_entity": "employees",
  "target_id": "NV005",
  "changed_by": "983aa0ed-7d53-4d11-8b53-9862fe986f64",
  "details": "{\"target_name\":\"Đoàn Chính Hữu\",\"target_role\":\"Manager\",\"target_department\":\"Phòng Hành chính – Tổng hợp\",\"timestamp\":\"2026-05-14T03:16:20.418Z\"}",
  "timestamp": "2026-05-14T03:16:20.710Z",
  "created_at": "2026-05-14T08:27:07.256Z"
}
```

---

#### <a id="notifications"></a> 94. `notifications` (Thông báo gửi đến người dùng)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `user_id` | `text` | `NO` | `` |
| 3 | `title` | `text` | `NO` | `` |
| 4 | `message` | `text` | `YES` | `` |
| 5 | `type` | `text` | `NO` | `'info'::text` |
| 6 | `read_at` | `timestamp with time zone` | `YES` | `` |
| 7 | `action_url` | `text` | `YES` | `` |
| 8 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="user_preferences"></a> 95. `user_preferences` (Cấu hình tùy chọn hiển thị cá nhân)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `user_id` | `text` | `NO` | `` |
| 2 | `theme` | `text` | `NO` | `'nature'::text` |
| 3 | `density` | `text` | `NO` | `'comfortable'::text` |
| 4 | `dashboard_layout` | `jsonb` | `NO` | `'{}'::jsonb` |
| 5 | `notification_settings` | `jsonb` | `NO` | `'{}'::jsonb` |
| 6 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="sidebar_module_config"></a> 96. `sidebar_module_config` (Cấu hình hiển thị menu chức năng sidebar)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `module_key` | `text` | `NO` | `` |
| 3 | `is_visible` | `boolean` | `NO` | `true` |
| 4 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 5 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "b2f25b25-8273-43bb-8dd2-90374b4c4f24",
  "module_key": "/",
  "is_visible": true,
  "created_at": "2026-06-04T01:06:39.544Z",
  "updated_at": "2026-06-05T01:48:39.186Z"
}
```

---

#### <a id="update_compliance_log"></a> 97. `update_compliance_log` (Nhật ký cập nhật tuân thủ quy định)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `employee_id` | `text` | `YES` | `` |
| 3 | `week_start` | `date` | `NO` | `` |
| 4 | `has_updated` | `boolean` | `YES` | `false` |
| 5 | `updated_at` | `timestamp with time zone` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

### 15. Các bảng bổ sung khác (Other Tables)

#### <a id="agency_event_attendees"></a> 98. `agency_event_attendees` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `event_id` | `uuid` | `NO` | `` |
| 3 | `user_id` | `text` | `NO` | `` |
| 4 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "4c4ffc84-f1f3-403c-914c-65f58e1d17d0",
  "event_id": "9adcf598-5f91-4676-94fb-696cc0ca0142",
  "user_id": "NV041",
  "created_at": "2026-06-01T09:00:43.150Z"
}
```

---

#### <a id="agency_events"></a> 99. `agency_events` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | `title` | `text` | `NO` | `` |
| 3 | `description` | `text` | `YES` | `` |
| 4 | `event_type` | `USER-DEFINED` | `NO` | `'meeting'::agency_event_type` |
| 5 | `room` | `USER-DEFINED` | `YES` | `` |
| 6 | `start_time` | `timestamp with time zone` | `NO` | `` |
| 7 | `end_time` | `timestamp with time zone` | `NO` | `` |
| 8 | `location` | `text` | `YES` | `` |
| 9 | `created_by` | `uuid` | `NO` | `` |
| 10 | `created_at` | `timestamp with time zone` | `NO` | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | `NO` | `now()` |
| 12 | `leader_id` | `text` | `YES` | `` |
| 13 | `vehicle` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "id": "800c0634-1069-4e1c-875b-c8906dea87cb",
  "title": "Họp rà soát Báo cáo",
  "description": "Họp rà soát báo cáo thực hiện các quy định của pháp luật về quản lý, sử dụng vốn đầu tư công đối với các dự án từ cấp huyện (cũ) chuyển về cấp tỉnh khi thực hiện chính quyền địa phương 2 cấp",
  "event_type": "meeting",
  "room": null,
  "start_time": "2026-05-27T02:00:00.000Z",
  "end_time": "2026-05-27T03:00:00.000Z",
  "location": "Phòng GĐ",
  "created_by": "983aa0ed-7d53-4d11-8b53-9862fe986f64",
  "created_at": "2026-05-27T01:57:32.757Z",
  "updated_at": "2026-05-27T01:57:32.757Z",
  "leader_id": "NV002",
  "vehicle": null
}
```

---

#### <a id="cde_items_view"></a> 100. `cde_items_view` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `item_id` | `text` | `YES` | `` |
| 2 | `kind` | `text` | `YES` | `` |
| 3 | `ref_id` | `text` | `YES` | `` |
| 4 | `project_id` | `text` | `YES` | `` |
| 5 | `cde_folder_id` | `uuid` | `YES` | `` |
| 6 | `name` | `text` | `YES` | `` |
| 7 | `discipline` | `text` | `YES` | `` |
| 8 | `doc_type` | `text` | `YES` | `` |
| 9 | `status` | `text` | `YES` | `` |
| 10 | `iso_status` | `text` | `YES` | `` |
| 11 | `version` | `text` | `YES` | `` |
| 12 | `revision` | `text` | `YES` | `` |
| 13 | `is_latest` | `boolean` | `YES` | `` |
| 14 | `version_group_id` | `uuid` | `YES` | `` |
| 15 | `file_hash` | `text` | `YES` | `` |
| 16 | `sensitivity_level` | `integer` | `YES` | `` |
| 17 | `is_encrypted` | `boolean` | `YES` | `` |
| 18 | `size` | `text` | `YES` | `` |
| 19 | `file_size` | `bigint` | `YES` | `` |
| 20 | `storage_path` | `text` | `YES` | `` |
| 21 | `frag_path` | `text` | `YES` | `` |
| 22 | `properties_path` | `text` | `YES` | `` |
| 23 | `element_count` | `integer` | `YES` | `` |
| 24 | `uploaded_by` | `text` | `YES` | `` |
| 25 | `submitted_by` | `text` | `YES` | `` |
| 26 | `submitted_by_org` | `text` | `YES` | `` |
| 27 | `contractor_id` | `text` | `YES` | `` |
| 28 | `created_at` | `timestamp with time zone` | `YES` | `` |
| 29 | `updated_at` | `timestamp with time zone` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="cde_project_stats_view"></a> 101. `cde_project_stats_view` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `project_id` | `text` | `YES` | `` |
| 2 | `total` | `bigint` | `YES` | `` |
| 3 | `wip` | `bigint` | `YES` | `` |
| 4 | `shared` | `bigint` | `YES` | `` |
| 5 | `published` | `bigint` | `YES` | `` |
| 6 | `archived` | `bigint` | `YES` | `` |
| 7 | `rejected` | `bigint` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="facility_assets"></a> 102. `facility_assets` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `asset_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `asset_name` | `text` | `NO` | `` |
| 4 | `asset_code` | `text` | `YES` | `` |
| 5 | `category` | `text` | `YES` | `` |
| 6 | `location` | `text` | `YES` | `` |
| 7 | `manufacturer` | `text` | `YES` | `` |
| 8 | `model` | `text` | `YES` | `` |
| 9 | `install_date` | `text` | `YES` | `` |
| 10 | `warranty_expiry` | `text` | `YES` | `` |
| 11 | `condition` | `text` | `YES` | `` |
| 12 | `status` | `text` | `YES` | `'active'::text` |
| 13 | `bim_element_id` | `text` | `YES` | `` |
| 14 | `maintenance_cycle_days` | `integer` | `YES` | `` |
| 15 | `last_maintenance` | `text` | `YES` | `` |
| 16 | `next_maintenance` | `text` | `YES` | `` |
| 17 | `notes` | `text` | `YES` | `` |
| 18 | `created_at` | `timestamp with time zone` | `YES` | `now()` |
| 19 | `updated_at` | `timestamp with time zone` | `YES` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="feasibility_studies"></a> 103. `feasibility_studies` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `report_id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `report_type` | `text` | `YES` | `` |
| 4 | `total_investment` | `numeric` | `YES` | `` |
| 5 | `construction_scale` | `text` | `YES` | `` |
| 6 | `main_technology` | `text` | `YES` | `` |
| 7 | `design_phases` | `integer` | `YES` | `` |
| 8 | `environmental_approval` | `text` | `YES` | `` |
| 9 | `approval_number` | `text` | `YES` | `` |
| 10 | `approval_date` | `text` | `YES` | `` |
| 11 | `approval_authority` | `text` | `YES` | `` |
| 12 | `document_path` | `text` | `YES` | `` |
| 13 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="investment_policy_decisions"></a> 104. `investment_policy_decisions` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `id` | `text` | `NO` | `(gen_random_uuid())::text` |
| 2 | `project_id` | `text` | `NO` | `` |
| 3 | `decision_number` | `text` | `NO` | `` |
| 4 | `decision_date` | `text` | `YES` | `` |
| 5 | `authority` | `text` | `YES` | `` |
| 6 | `objectives` | `text` | `YES` | `` |
| 7 | `location` | `text` | `YES` | `` |
| 8 | `duration` | `text` | `YES` | `` |
| 9 | `preliminary_investment` | `numeric` | `YES` | `` |
| 10 | `capital_sources` | `ARRAY` | `YES` | `` |
| 11 | `document_path` | `text` | `YES` | `` |
| 12 | `created_at` | `timestamp with time zone` | `NO` | `now()` |

**Ví dụ dữ liệu hiện có:**

*Hiện chưa có dữ liệu mẫu hoặc bảng đang rỗng.*

---

#### <a id="monthly_report_view"></a> 105. `monthly_report_view` (Chưa định nghĩa)

**Cấu trúc bảng:**

| STT | Tên cột | Kiểu dữ liệu | Cho phép Null? | Giá trị mặc định |
|---|---|---|---|---|
| 1 | `task_id` | `uuid` | `YES` | `` |
| 2 | `title` | `character varying` | `YES` | `` |
| 3 | `description` | `text` | `YES` | `` |
| 4 | `status` | `USER-DEFINED` | `YES` | `` |
| 5 | `priority` | `USER-DEFINED` | `YES` | `` |
| 6 | `task_type` | `USER-DEFINED` | `YES` | `` |
| 7 | `category` | `text` | `YES` | `` |
| 8 | `due_date` | `date` | `YES` | `` |
| 9 | `actual_end_date` | `date` | `YES` | `` |
| 10 | `progress` | `integer` | `YES` | `` |
| 11 | `completion_result` | `text` | `YES` | `` |
| 12 | `incomplete_reason` | `text` | `YES` | `` |
| 13 | `notes` | `text` | `YES` | `` |
| 14 | `project_id` | `text` | `YES` | `` |
| 15 | `project_name` | `text` | `YES` | `` |
| 16 | `assignee_id` | `text` | `YES` | `` |
| 17 | `assignee_name` | `text` | `YES` | `` |
| 18 | `department_code` | `text` | `YES` | `` |
| 19 | `report_month` | `integer` | `YES` | `` |
| 20 | `report_year` | `integer` | `YES` | `` |
| 21 | `is_on_time` | `boolean` | `YES` | `` |
| 22 | `annual_plan_item_id` | `uuid` | `YES` | `` |
| 23 | `source_type` | `text` | `YES` | `` |

**Ví dụ dữ liệu hiện có:**

```json
{
  "task_id": "48d831ce-48b1-4387-8c21-60458a2e8363",
  "title": "Phối hợp hồ sơ số liệu chi phí GPMB cho quyết toán các công trình thuộc dự án BIIG2, dự án Ngân sách",
  "description": "Phối hợp với đơn vị kiểm toán và nhà thầu soát xét hồ sơ hoàn công, hoàn thiện các thủ tục lập, trình duyệt quyết toán dự án hoàn thành cho: Phối hợp soát xét hồ sơ hoàn công, đối chiếu khối lượng thực tế và lập báo cáo quyết toán vốn đầu tư dự án hoàn thành tại để trình cấp có thẩm quyền phê duyệt.",
  "status": "todo",
  "priority": "medium",
  "task_type": "internal",
  "category": "quyet_toan",
  "due_date": "2026-06-29T17:00:00.000Z",
  "actual_end_date": null,
  "progress": 0,
  "completion_result": null,
  "incomplete_reason": "Nhà thầu cũ chậm phối hợp đối chiếu công nợ và hoàn thiện các biên bản thanh lý hợp đồng thi công.",
  "notes": null,
  "project_id": null,
  "project_name": null,
  "assignee_id": "NV051",
  "assignee_name": "Nguyễn Thị Hồng Lam",
  "department_code": "PTDV",
  "report_month": 6,
  "report_year": 2026,
  "is_on_time": null,
  "annual_plan_item_id": null,
  "source_type": "manual"
}
```

---


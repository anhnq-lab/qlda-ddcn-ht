# 🔐 TÀI LIỆU PHÂN QUYỀN HỆ THỐNG

**Ban QLDA Đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh**

> **Phiên bản:** Dự thảo 1.1 · **Cập nhật:** 2026-06-04
> **Mục đích:** Đây là **bản nháp nguồn-sự-thật** để cùng rà soát, chỉnh sửa — sau đó dùng để sửa code cho khớp.
> **Cách dùng:** Mỗi module bên thanh menu (sidebar) là một mục. Trong mỗi mục có **một bảng**: hàng = hành động (Xem / Thêm / Sửa / Xóa / Xuất), cột = vai trò. Bạn chỉ cần sửa ✅/❌ trong bảng, tôi sẽ chỉnh code theo đúng bảng đã chốt.
>
> 📌 Tài liệu căn cứ: **Quy chế làm việc Ban QLDA** (ban hành 11/2025) · **QĐ phân công nhiệm vụ Ban Giám đốc** (07/11/2025) · cấu hình code hiện tại (`types/permission.types.ts`).

> [!IMPORTANT]
> **Phạm vi giai đoạn 1 (tài liệu này):** chỉ phân quyền các module đã vận hành. Các module sau **để giai đoạn sau** (chưa đưa vào phân quyền lần này):
> ❌ Nhà thầu · ❌ Đấu thầu & Hợp đồng · ❌ Thanh toán · ❌ KH Vốn & Giải ngân · ❌ Môi trường dữ liệu chung (CDE) & Hồ sơ tài liệu · ❌ Mô hình BIM.
> ⇒ Vai trò **Nhà thầu** cũng tạm gác (chưa cấp tài khoản nhà thầu ở giai đoạn này).

---

## 1. Cách đọc tài liệu

### 1.1. Năm hành động cơ bản
| Ký hiệu | Hành động | Nghĩa là |
| :--- | :--- | :--- |
| 👁️ **Xem** | `view` | Mở, đọc danh sách & chi tiết. Không sửa được gì. |
| ➕ **Thêm** | `create` | Tạo bản ghi mới. |
| ✏️ **Sửa** | `update` | Thay đổi bản ghi đã có. |
| 🗑️ **Xóa** | `delete` | Xóa bản ghi. |
| 📤 **Xuất** | `export` | Tải xuống Excel/PDF. |

### 1.2. Quy ước trong bảng
- ✅ = được phép · ❌ = không được phép
- **QTV** (Quản trị viên hệ thống) **luôn có toàn quyền** mọi module → không liệt kê thành cột cho gọn.
- Cột 🟧 = **đề xuất cần chốt** (chỗ code hiện tại có thể đang lệch với Quy chế). Xem ghi chú dưới mỗi bảng.
- **Phạm vi dữ liệu** (thấy dự án nào) là một lớp **độc lập** với hành động — xem [Mục 4](#4-phạm-vi-dữ-liệu--ai-thấy-dự-án-nào).

### 1.3. Hai lớp bảo vệ
Mọi quyền được kiểm tra ở **2 tầng**: giao diện (ẩn/khóa nút) và cơ sở dữ liệu (RLS chặn thao tác trái phép kể cả khi gọi thẳng API).

---

## 2. Các vai trò trên hệ thống

Hệ thống tự suy vai trò từ **chức vụ** + **phòng ban** trong hồ sơ nhân sự; QTV có thể gán thủ công để ghi đè.

| # | Vai trò (nhãn hiển thị) | Mã hệ thống | Ai thuộc nhóm này |
| :--- | :--- | :--- | :--- |
| 1 | 🔑 **Quản trị viên HT** | `super_admin` | Người quản trị phần mềm. Toàn quyền. |
| 2 | 👔 **Giám đốc** | `director` | Giám đốc Ban. |
| 3 | 👔 **Phó Giám đốc** | `deputy_director` | 03 Phó Giám đốc. |
| 4 | 📊 **Kế toán trưởng** | `chief_accountant` | Kế toán trưởng. |
| 5 | 📋 **Trưởng phòng** | `dept_head` | Trưởng phòng, Chánh Văn phòng, GĐ Trung tâm. |
| 6 | 📋 **Phó phòng** | `deputy_head` | Phó Trưởng phòng, Phó Văn phòng. |
| 7 | 🔧 **Chuyên viên** | `specialist` | Chuyên viên, Kỹ sư, Tư vấn giám sát, Thành viên. |
| 8 | 📝 **Hành chính** | `staff` | Nhân viên văn thư, hành chính, kế toán viên. |

> 💡 Hai vai trò Giám đốc và Phó Giám đốc cùng hiển thị nhãn **"Lãnh đạo Ban"** trên giao diện, nhưng **khác nhau về phạm vi dữ liệu** (xem Mục 4) và một số quyền quản trị (xem [3.8](#38-️-cài-đặt-hệ-thống)).
>
> *(Vai trò 👷 Nhà thầu để giai đoạn sau — xem khung phạm vi ở đầu tài liệu.)*

### 2.1. 🔧 Chuyên viên: "phụ trách dự án" vs "hỗ trợ"

Theo Quy chế (Điều 2.3: *mỗi việc chỉ giao một cá nhân phụ trách và chịu trách nhiệm chính*) và Điều 5.4 (*Phòng QLDA chủ trì dự án*), vai trò Chuyên viên được tách làm **2 mức theo từng dự án**:

| Mức | Là ai | Quyền trên dự án đó |
| :--- | :--- | :--- |
| **CV phụ trách** (CV·PT) | Chuyên viên/Kỹ sư thuộc **Phòng QLDA chủ trì**, được giao **phụ trách chính** dự án (1 người/dự án) | Tác nghiệp đầy đủ: lập/sửa dự án, giao & quản lý công việc, cập nhật hồ sơ của **dự án mình phụ trách** |
| **CV hỗ trợ** (CV·HT) | Chuyên viên các **phòng khác** (KH-ĐT, KT-TĐ, HC-TH, PTDV...) **hoặc** CV cùng phòng nhưng không được giao phụ trách dự án đó | Chủ yếu **Xem** + phối hợp; cập nhật phần việc được giao; **không** tự lập/sửa dự án |

> ⚠️ Đây là **phân công theo từng dự án**, không phải vai trò cố định: một người có thể là CV·PT ở dự án A nhưng là CV·HT ở dự án B.

#### Dữ liệu đã có sẵn — "Vai trò trong dự án"
Khi **thêm mới / sửa dự án** (tab *Thành viên*), mỗi nhân sự được gán một **vai trò trong dự án**, lưu ở cột `project_members.role`. Hiện có 5 giá trị:

| Vai trò trong dự án (`project_members.role`) | Tương ứng quyền tác nghiệp trên dự án |
| :--- | :--- |
| **Giám đốc dự án** | Lãnh đạo phụ trách dự án |
| **Trưởng phòng phụ trách** | Như Trưởng phòng — quản lý dự án |
| **Chuyên viên phụ trách** | ⇒ **CV·PT** (người phụ trách chính) |
| **Kế toán dự án** | Theo dõi tài chính dự án |
| **Thành viên** *(mặc định)* | ⇒ **CV·HT** (hỗ trợ) |

> ✅ Vậy **không cần thêm trường mới** — "người phụ trách" chính là thành viên có vai trò **"Chuyên viên phụ trách"**.
> 🟧 **Hạn chế hiện tại:** 5 vai trò này mới là **nhãn hiển thị**, **engine phân quyền chưa dùng đến**. Cần nối vào logic kiểm tra quyền (xem điểm cần chốt #2 ở [Mục 6](#6--những-điểm-cần-bạn-chốt)).

---

## 3. Phân quyền theo từng module (sidebar)

> Bảng dưới đây **phản ánh đúng code hiện tại** (`DEFAULT_ROLE_PERMISSIONS`). Ô có 🟧 là chỗ tôi nghi ngờ lệch với Quy chế — cần bạn quyết định.
>
> Viết tắt cột: **GĐ** Giám đốc · **PGĐ** Phó GĐ · **KTT** Kế toán trưởng · **TrP** Trưởng phòng · **PhP** Phó phòng · **CV** Chuyên viên · **HC** Hành chính.

### 3.1. 🏠 Tổng quan (Dashboard)
*Đường dẫn: `/` · Bảng điều khiển thống kê tổng hợp.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📤 Xuất | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> 📌 **Nguyên tắc hiển thị:** "Dashboard cá nhân" (`/my-dashboard`) ai đăng nhập cũng thấy, dữ liệu hiển thị hoàn toàn tuân thủ nguyên tắc "của ai thấy của người đấy": Chuyên viên/Nhân viên chỉ thấy dự án/công việc/kế hoạch tháng được phân công; Trưởng phòng chỉ thấy của phòng quản lý; Lãnh đạo Ban thấy của phòng phụ trách hoặc toàn bộ.

---

### 3.2. 📅 Lịch cơ quan
*Đường dẫn: `/calendar` · Lịch họp, sự kiện cơ quan.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Thêm | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| ✏️ Sửa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 🗑️ Xóa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> *Theo Quy chế (Điều 25), Phòng HC-TH chủ trì thông báo, bố trí lịch họp. 🟧 **Cần chốt:** có nên cấp Thêm/Sửa lịch cho Trưởng/Phó phòng HC-TH (hiện chỉ Lãnh đạo Ban được Sửa/Xóa)?*

---

### 3.3. 📁 Quản lý dự án
*Đường dẫn: `/projects` · Thông tin dự án đầu tư xây dựng.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV·PT | CV·HT | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Thêm | ❌ | ❌ | ❌ | ❌ | ❌ | 📢✅ | ❌ | ❌ |
| ✏️ Sửa | ❌ | ❌ | ❌ | ❌ | ❌ | 📝✅ | ❌ | ❌ |
| 🗑️ Xóa | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **CV·PT** = Chuyên viên phụ trách dự án. Theo Quy chế nhập liệu QLDA (Điều 23):
> - 📢 **Quyền Thêm mới dự án:** Dành cho **Chuyên viên phụ trách** (khi được phân công phụ trách chuẩn bị/thực hiện dự án, họ sẽ trực tiếp tạo mới dự án trên hệ thống).
> - 📝 **Quyền Sửa thông tin dự án:** Chỉ dành cho người tạo dự án (`created_by = auth.uid()`), hoặc thành viên dự án (`project_members`) có vai trò quản lý chính (`'Giám đốc dự án'`, `'Chuyên viên phụ trách'`, `'Trưởng phòng phụ trách'`). Các chuyên viên hỗ trợ (`CV·HT`) và nhân viên hành chính (`HC`) khác không có quyền trực tiếp chỉnh sửa thông tin dự án này (chỉ xem và phối hợp cập nhật phần việc được giao).
> - Các vị trí Lãnh đạo Ban/Phòng chỉ có quyền **Xem**, không trực tiếp thêm/sửa thông tin dự án trên hệ thống.

---

### 3.4. ✅ Quản lý công việc
*Đường dẫn: `/work-plan` · Giao việc, theo dõi tiến độ.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Thêm | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| ✏️ Sửa | ❌ | ❌ | ❌ | ✅ | ✅ | 📝✅ | 📝✅ |
| 🗑️ Xóa | ❌ | ❌ | ❌ | 📢✅ | ❌ | ❌ | ❌ |

> 📌 **Phạm vi hiển thị công việc (Phân quyền phòng ban):**
> - Nhân sự thuộc phòng ban nào chỉ thấy công việc của phòng ban đó (`department_code`).
> - **Ngoại lệ xem toàn bộ:** Chỉ có **Quản trị viên (QTV)**, **Giám đốc Ban**, và **Trưởng phòng Hành chính – Tổng hợp** (HCTH) được xem toàn bộ công việc trên hệ thống.
> - **Phó Giám đốc Ban:** Chỉ thấy được công việc của các phòng ban mình trực tiếp phụ trách (được phân công trong `leadership_assignments`).
> - **Trách nhiệm tác nghiệp & Quyền Sửa/Cập nhật/Bình luận:** Chỉ người liên quan trực tiếp đến công việc (Người tạo công việc `created_by`, Người được giao việc `assignee_id`, hoặc Người phối hợp `collaborator_ids`) mới được phép Sửa thông tin, Cập nhật tiến độ hoặc viết Bình luận (`task_comments`) vào công việc đó. Trưởng/Phó phòng có quyền tạo mới công việc của phòng mình; Trưởng phòng chỉ xóa (📢✅) được công việc của phòng mình. Lãnh đạo Ban, Kế toán trưởng và các phòng ban khác không được tự ý can thiệp ghi dữ liệu vào công việc không liên quan.

---

### 3.5. 👤 Nhân sự
*Đường dẫn: `/employees` · Hồ sơ viên chức, người lao động.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Thêm | ❌ | ❌ | ❌ | 📢✅ | ❌ | ❌ | ❌ |
| ✏️ Sửa | ❌ | ❌ | ❌ | 📢✅ | ❌ | ❌ | ❌ |
| 🗑️ Xóa | ❌ | ❌ | ❌ | 📢✅ | ❌ | ❌ | ❌ |

> **Phân quyền Nhân sự:** Quản trị viên hệ thống (QTV) và **Trưởng phòng Hành chính – Tổng hợp** (HC-TH) (📢✅) được phép Thêm/Sửa/Xóa hồ sơ nhân sự của Ban. Giám đốc, Phó Giám đốc, Kế toán trưởng, các Trưởng phòng khác và chuyên viên chỉ có quyền Xem.

---

### 3.6. ⚖️ Văn bản pháp luật & Quy chế làm việc
*Đường dẫn: `/legal-documents`, `/regulations` · Tra cứu văn bản, quy chế.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Thêm | ❌ | ❌ | ❌ | 📢✅ | 📢✅ | 📢✅ | 📢✅ |
| ✏️ Sửa | ❌ | ❌ | ❌ | 📢✅ | 📢✅ | 📢✅ | 📢✅ |

> **Quy chế làm việc (`regulations`):** Cán bộ thuộc **Phòng Hành chính – Tổng hợp** (HC-TH) (📢✅) và Quản trị viên hệ thống được phép Thêm/Sửa điều khoản quy chế và thang điểm đánh giá. Lãnh đạo Ban, các phòng ban khác chỉ có quyền Xem.

---

### 3.7. 📊 Báo cáo
*Đường dẫn: `/reports` · Thống kê, xuất báo cáo.*

| Hành động | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📤 Xuất | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### 3.8. ⚙️ Cài đặt hệ thống
*Đường dẫn: `/settings` · Tài khoản, phân quyền, nhật ký. Footer sidebar — chỉ QTV thấy.*

| Chức năng | GĐ | PGĐ | KTT | TrP | PhP | CV | HC |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 👁️ Xem tài khoản người dùng | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ⚙️ Quản lý tài khoản (T/S/X) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 🔐 Phân quyền / Mẫu vai trò | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 📜 Xem nhật ký hệ thống | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> *Cài đặt hệ thống (quản lý tài khoản, phân quyền, xem nhật ký) là **đặc quyền duy nhất của Quản trị viên (super_admin)**. Lãnh đạo Ban (Giám đốc, Phó Giám đốc) và các phòng ban khác không có quyền truy cập vào phân hệ này.*

---

## 4. Phạm vi dữ liệu — Ai thấy dự án nào?

Quyền hành động (Mục 3) trả lời *"được làm gì"*; **phạm vi dữ liệu** trả lời *"được thấy dữ liệu của ai"*. Hai người cùng vai trò "Chuyên viên" nhưng khác phòng sẽ thấy tập dự án khác nhau.

### 4.1. Bốn loại phạm vi
| Phạm vi | Áp dụng cho | Thấy được |
| :--- | :--- | :--- |
| 🌍 **Toàn bộ** | QTV, Giám đốc, Kế toán trưởng, và **Trưởng/Phó phòng ban chức năng** (HC-TH, KH-ĐT, KT-TĐ, PTDV) | Tất cả dự án |
| 👔 **Theo phụ trách** | **Phó Giám đốc** | Dự án của **các phòng PGĐ đó phụ trách** (Mục 4.3) |
| 🏢 **Theo phòng** | **Phòng QLDA 1/2/3 & PTDV (chuyên viên)** | Chỉ dự án phòng mình quản lý / phụ trách |
| 👥 **Theo thành viên** | **Chuyên viên & Nhân viên phòng chức năng** (HC-TH, KH-ĐT, KT-TĐ, PTDV) | Chỉ thấy dự án khi được gán làm thành viên phối hợp (`project_members`) |

> *Vì sao có sự phân biệt phạm vi? Trưởng/Phó phòng chức năng cần thấy toàn bộ dự án để tham mưu, tổng hợp báo cáo. Tuy nhiên, đối với Chuyên viên và Nhân viên phòng chức năng, họ chỉ thấy dự án khi được chỉ định làm thành viên phối hợp của dự án đó để bảo đảm an toàn thông tin. Các phòng QLDA 1/2/3 và PTDV chỉ chủ trì dự án được giao (Điều 5.4.đ).*

### 4.2. Phân công Phòng QLDA quản lý dự án (Quy chế Điều 5.4.đ)
| Phòng | Địa bàn / lĩnh vực dự án |
| :--- | :--- |
| **QLDA 1** | Dự án chuyển tiếp Đức Thọ, Vũ Quang; lĩnh vực văn hóa, y tế, giáo dục, quản lý nhà nước; hạ tầng khởi công mới Đức Thọ, Vũ Quang. |
| **QLDA 2** | Dự án ODA, BIG2; chuyển tiếp Can Lộc, Cẩm Xuyên; hạ tầng khởi công mới Can Lộc, Cẩm Xuyên. |
| **QLDA 3** | Dự án chuyển tiếp Thạch Hà, Hương Khê; hạ tầng khởi công mới Thạch Hà, Hương Khê. |

### 4.3. ⭐ Phân công Phó Giám đốc phụ trách phòng — theo **QĐ phân công nhiệm vụ BGĐ (07/11/2025)**

> Đây là **điểm chỉnh quan trọng nhất**: tài liệu cũ "đoán" PGĐ phụ trách phòng nào theo thứ tự danh sách (dễ sai). Dưới đây là phân công **chính thức** từ Quyết định của Giám đốc — nên đưa thành dữ liệu trong bảng `leadership_assignments`.

| Lãnh đạo | Phòng trực tiếp phụ trách | ⇒ Phạm vi dữ liệu dự án | Lĩnh vực / địa bàn |
| :--- | :--- | :--- | :--- |
| **GĐ Nguyễn Quang Linh** | Phòng Kế hoạch - Đấu thầu | 🌍 **Toàn bộ** (phụ trách chung) | Tài chính, kế hoạch, tổ chức bộ máy, nhân sự, thi đua-khen thưởng, kiểm tra-giám sát. |
| **PGĐ Trần Ngọc Bảo** | **Phòng QLDA 1** + Phòng Phát triển dịch vụ | Dự án của **QLDA 1** (+ dự án tư vấn của PTDV) | Văn hóa, giáo dục; địa bàn Đức Thọ, Vũ Quang; phát triển dịch vụ, giám sát công trình tự thực hiện. |
| **PGĐ Nguyễn Văn Nhân** | **Phòng QLDA 2** + Phòng Hành chính - Tổng hợp *(trừ tài chính & tổ chức bộ máy)* | Dự án của **QLDA 2** | Y tế, hạ tầng nông thôn; địa bàn Cẩm Xuyên, Can Lộc; dự án BIG2; công tác đoàn thể, thi đua. Điều hành thay khi GĐ vắng. |
| **PGĐ Ngô Đức Quý** | **Phòng QLDA 3** + Phòng Kỹ thuật - Thẩm định | Dự án của **QLDA 3** | Thủy lợi, giao thông; địa bàn Thạch Hà, Hương Khê; vận động dự án ODA; kỹ thuật-thẩm định; kiểm soát nội bộ. |

> 💡 **Ghi chú:** Phòng HC-TH, KT-TĐ, PTDV là **phòng chức năng** (không "sở hữu" dự án theo board), nên phạm vi dữ liệu dự án của mỗi PGĐ chủ yếu = dự án của Phòng QLDA mà PGĐ đó phụ trách. Việc PGĐ kiêm phụ trách phòng chức năng ảnh hưởng tới chỉ đạo nghiệp vụ, không mở rộng tập dự án.
>
> PGĐ Bảo phụ trách thêm PTDV — gán cả board đó cho PGĐ Bảo trong `leadership_assignments` (Đã chốt ok).

---

## 5. Tổng hợp — Ma trận đầy đủ (1 bảng)

> Ký hiệu hành động: **X**=Xem · **T**=Thêm · **S**=Sửa · **D**=Xóa · **E**=Xuất · **—**=không có quyền. (QTV = toàn quyền, không liệt kê.)

| Module | GĐ | PGĐ | KTT | TrP | PhP | CV·PT | CV·HT | HC |
| :--- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Tổng quan | X E | X E | X E | X | X | X | X | X |
| Lịch cơ quan | X T S D | X T S D | X | X T | X T | X | X | X |
| Dự án | X | X | X | X | X | X T S | X | X |
| Công việc | X | X | X | X T S D | X T S | X T S | X T S | X T S |
| Nhân sự | X | X | X | X T S D | X | X | X | X |
| VB Pháp luật / Quy chế | X | X | X | X T S | X T S | X T S | X T S | X T S |
| Báo cáo | X E | X E | X E | X E | X E | X | X | X |
| Cài đặt: xem tài khoản | — | — | — | — | — | — | — | — |
| Cài đặt: nhật ký HT | — | — | — | — | — | — | — | — |

> **CV·PT** = Chuyên viên phụ trách dự án · **CV·HT** = Chuyên viên hỗ trợ. Khác biệt rõ nhất ở module **Dự án** (CV·PT được Thêm/Sửa; CV·HT chỉ Xem).

---

## 6. ✅ Những điểm cần bạn chốt

Tôi đã đánh dấu 🟧 ở các mục. Tóm tắt để bạn quyết một lượt — chốt xong tôi sửa code theo:

| # | Vấn đề | Hiện tại (code) | Đề xuất | Quyết định (Đã chốt) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Lãnh đạo Ban thao tác trực tiếp dự án** | GĐ/PGĐ được Thêm/Sửa/Xóa dự án | Theo Quy chế lãnh đạo chỉ đạo/duyệt → hạ về **chỉ Xem**, giao tác nghiệp cho phòng QLDA | **Hạ về Xem** |
| 2 | **Chuyên viên phụ trách vs hỗ trợ** | Có sẵn `project_members.role` nhưng chỉ là nhãn, engine phân quyền chưa dùng | Nối `project_members.role` và `created_by` vào logic RLS: Chuyên viên phụ trách được Tạo mới; chỉ Kỹ sư phụ trách chính hoặc người tạo mới được Sửa dự án. | **Đồng ý** |
| 3 | **Nhân sự** | Chỉ QTV được sửa | Có cấp Thêm/Sửa cho Trưởng phòng HC-TH? | **Mở cho Trưởng phòng HC-TH** |
| 4 | **Lịch cơ quan** | Chỉ Lãnh đạo Ban Sửa/Xóa | HC-TH chủ trì lịch → cấp Thêm/Sửa cho HC-TH? | **Mở cho HC-TH** |
| 5 | **Quy chế (Thêm/Sửa điều khoản)** | Chỉ có quyền Xem | Cấp Thêm/Sửa cho QTV/HC-TH? | **Mở cho QTV/HC-TH** |
| 6 | **Phân công PGĐ** | Đoán theo thứ tự mảng | Seed `leadership_assignments` theo QĐ 07/11/2025 (Mục 4.3) | **Đồng ý seed** |
| 7 | **Số Phòng QLDA** | Code còn tham chiếu QLDA 1–5 | Thực tế chỉ **QLDA 1/2/3** → dọn QLDA 4/5 | **Dọn QLDA 4/5, giữ PTDV** |

---

## 7. 🕓 Module để giai đoạn sau

Các module dưới đây **chưa phân quyền trong tài liệu này**, sẽ bổ sung khi đưa vào vận hành:

| Module | Lý do hoãn |
|---|---|
| 🏢 **Tài sản công** (chức năng `/tai-san-cong`) | Loại bỏ ra ngoài và thực hiện ở giai đoạn sau theo yêu cầu. |
| 👷 **Nhà thầu** (vai trò + module quản lý nhà thầu) | Chưa cấp tài khoản nhà thầu giai đoạn này. |
| 📋 **Đấu thầu & Hợp đồng** | Giai đoạn sau. |
| 💳 **Thanh toán** | Cùng chuỗi tài chính với Hợp đồng/KH Vốn — giai đoạn sau. |
| 💰 **KH Vốn & Giải ngân** | Giai đoạn sau. |
| 🗂️ **Môi trường dữ liệu chung (CDE) & Hồ sơ tài liệu** | Giai đoạn sau. |
| 🧊 **Mô hình BIM** | Giai đoạn sau. |

> Khi mở các module này, ta bổ sung bảng quyền tương ứng + (với Nhà thầu) khôi phục cột vai trò Nhà thầu và 5 mức quyền CDE theo ISO 19650.

---

> *Khi bạn sửa xong các ✅/❌ trong bảng và chốt các điểm ở Mục 6, tôi sẽ cập nhật `DEFAULT_ROLE_PERMISSIONS`, seed `role_permission_defaults`, `leadership_assignments` và các RLS tương ứng cho khớp.*

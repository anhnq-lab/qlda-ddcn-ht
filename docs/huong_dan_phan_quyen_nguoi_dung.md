# 📋 HƯỚNG DẪN PHÂN QUYỀN HỆ THỐNG QUẢN LÝ DỰ ÁN

**Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh**

> **Phiên bản:** 1.0 — Ngày ban hành: ../../2026  
> **Đối tượng áp dụng:** Toàn thể viên chức, người lao động và nhà thầu sử dụng hệ thống  
> **Mục đích:** Giúp người dùng hiểu rõ quyền hạn của mình trên hệ thống, biết mình được làm gì và không được làm gì

---

## 📖 Giải thích thuật ngữ

Trước khi đọc tài liệu, bạn cần hiểu một số khái niệm cơ bản:

| Thuật ngữ | Ý nghĩa | Ví dụ |
|:----------|:--------|:------|
| **Vai trò** | Chức danh của bạn trên hệ thống, quyết định bạn được làm gì | Giám đốc, Trưởng phòng, Chuyên viên... |
| **Phân hệ** | Một mục chức năng trên hệ thống (ví dụ: Dự án, Thanh toán, Hợp đồng...) | Khi bạn bấm vào menu bên trái, mỗi mục là một phân hệ |
| **Xem** | Bạn được phép mở và đọc thông tin, nhưng không thay đổi được gì | Xem danh sách dự án, xem chi tiết hợp đồng |
| **Thêm mới** | Bạn được phép tạo một bản ghi mới | Thêm dự án mới, tạo phiếu thanh toán |
| **Chỉnh sửa** | Bạn được phép thay đổi thông tin đã có | Cập nhật tiến độ, sửa thông tin hợp đồng |
| **Xóa** | Bạn được phép xóa bỏ một bản ghi | Xóa công việc đã tạo nhầm |
| **Xuất dữ liệu** | Bạn được phép tải xuống file Excel/PDF | Xuất báo cáo, xuất danh sách dự án |
| **Phạm vi dữ liệu** | Bạn được xem dữ liệu của phòng nào, dự án nào | Phòng QLDA 1 chỉ thấy dự án của phòng mình |

---

## 👥 Bạn thuộc vai trò nào?

Hệ thống tự động xác định vai trò của bạn dựa trên **chức vụ** và **phòng ban** ghi trong hồ sơ nhân sự. Quản trị viên cũng có thể gán vai trò thủ công nếu cần.

### 🏛️ Nhóm Lãnh đạo Ban

| Vai trò | Ai thuộc nhóm này? | Phạm vi xem dữ liệu |
|:--------|:-------------------|:--------------------|
| 🔑 **Quản trị viên hệ thống** | Người được giao quản trị phần mềm | Toàn bộ hệ thống, mọi dự án |
| 👔 **Giám đốc** | Giám đốc Ban QLDA | Toàn bộ dự án của Ban |
| 👔 **Phó Giám đốc** | Các Phó Giám đốc Ban QLDA | Chỉ dự án thuộc **các phòng do mình phụ trách** *(xem mục "Phạm vi dữ liệu" bên dưới)* |
| 📊 **Kế toán trưởng** | Kế toán trưởng Ban QLDA | Toàn bộ dự án (về mặt tài chính) |

### 🏢 Nhóm Phòng ban chuyên môn

| Vai trò | Ai thuộc nhóm này? | Phạm vi xem dữ liệu |
|:--------|:-------------------|:--------------------|
| 📋 **Trưởng phòng** | Trưởng phòng, Trưởng ban, Chánh Văn phòng, Giám đốc Trung tâm | Dự án thuộc phòng/ban mình (*) |
| 📋 **Phó phòng** | Phó Trưởng phòng, Phó Văn phòng | Dự án thuộc phòng/ban mình (*) |
| 🔧 **Chuyên viên / Kỹ sư** | Chuyên viên, Kỹ sư, Tư vấn giám sát | Dự án thuộc phòng/ban mình (*) |
| 📝 **Nhân viên hành chính** | Nhân viên văn thư, hành chính, kế toán viên | Dự án thuộc phòng/ban mình (*) |

> (*) **Lưu ý phạm vi theo phòng:**
> - Các phòng **chức năng** (HC-TH, KH-ĐT, KT-TĐ, PTDV) → Xem **toàn bộ** dự án (vì phối hợp nhiều phòng)
> - Các phòng **QLDA 1, 2, 3** → Chỉ xem dự án do phòng mình quản lý

### 👷 Nhóm Nhà thầu

| Vai trò | Ai thuộc nhóm này? | Phạm vi xem dữ liệu |
|:--------|:-------------------|:--------------------|
| 🏗️ **Nhà thầu** | Đại diện nhà thầu được cấp tài khoản | Chỉ dự án được Ban QLDA chỉ định |

---

## 📊 Bảng quyền chi tiết theo vai trò

### Cách đọc bảng
- ✅ = Được phép thực hiện
- ❌ = Không được phép
- Mỗi hàng là một **phân hệ** (mục chức năng trên hệ thống)
- Mỗi cột là một **vai trò**

---

### 📁 PHÂN HỆ: DỰ ÁN & CÔNG VIỆC

*Quản lý thông tin dự án đầu tư xây dựng, giao việc và theo dõi tiến độ.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| **Dự án** | | | | | | | | |
| Xem danh sách & chi tiết | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Thêm dự án mới | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Chỉnh sửa dự án | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xóa dự án | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Công việc** | | | | | | | | |
| Xem công việc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Thêm / Giao việc | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cập nhật tiến độ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xóa công việc | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Lịch cơ quan** | | | | | | | | |
| Xem lịch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tạo / Sửa / Xóa sự kiện | ✅ | ✅ | ❌ | Tạo | Tạo | ❌ | ❌ | ❌ |
| **Giải phóng mặt bằng** | | | | | | | | |
| Xem thông tin GPMB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Thêm / Sửa hồ sơ GPMB | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xuất dữ liệu GPMB | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### ⚖️ PHÂN HỆ: ĐẤU THẦU & HỢP ĐỒNG

*Quản lý hoạt động lựa chọn nhà thầu và quản lý hợp đồng xây dựng.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| **Đấu thầu** | | | | | | | | |
| Xem gói thầu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tạo / Sửa gói thầu | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xuất dữ liệu đấu thầu | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Hợp đồng** | | | | | | | | |
| Xem hợp đồng | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo / Sửa hợp đồng | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### 💳 PHÂN HỆ: TÀI CHÍNH & THANH TOÁN

*Quản lý nghiệp vụ thanh toán, kế hoạch vốn và giải ngân các nguồn vốn đầu tư.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| **Thanh toán** | | | | | | | | |
| Xem phiếu thanh toán | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo phiếu thanh toán | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sửa phiếu thanh toán | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xóa phiếu thanh toán | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Kế hoạch vốn & Giải ngân** | | | | | | | | |
| Xem kế hoạch vốn | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tạo / Sửa kế hoạch vốn | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xuất dữ liệu KH vốn | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> 💡 **Lưu ý:** Kế toán trưởng là người có quyền cao nhất với phân hệ Thanh toán, phù hợp với nhiệm vụ soát xét tài chính theo Quy chế làm việc.

---

### 📂 PHÂN HỆ: TÀI LIỆU & HỆ THỐNG CDE

*Quản lý hồ sơ tài liệu dự án và Hệ thống CDE (Common Data Environment — Môi trường dữ liệu chung) theo tiêu chuẩn quốc tế ISO 19650.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| **Hồ sơ tài liệu** | | | | | | | | |
| Xem tài liệu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tạo / Tải lên tài liệu | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Chỉnh sửa tài liệu | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xóa tài liệu | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CDE (Dữ liệu chung dự án)** | | | | | | | | |
| Xem tài liệu CDE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nộp / Tải lên hồ sơ CDE | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Chỉnh sửa trên CDE | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Mô hình BIM** | | | | | | | | |
| Xem mô hình | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tạo / Sửa mô hình | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **VB Pháp luật & Quy chế** | | | | | | | | |
| Xem văn bản | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

> 💡 **Nhà thầu trên CDE:** Nhà thầu chỉ được **xem** và **nộp hồ sơ** trên CDE đối với các dự án mà mình tham gia. Nhà thầu **không** thể xem tài liệu nội bộ, nhân sự, báo cáo hay bất kỳ phân hệ nào khác.

---

### 👥 PHÂN HỆ: NHÂN SỰ & NHÀ THẦU

*Quản lý thông tin viên chức, người lao động và nhà thầu tham gia dự án.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| **Nhân sự** | | | | | | | | |
| Xem danh sách nhân sự | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Thêm / Sửa nhân sự | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Nhà thầu** | | | | | | | | |
| Xem danh sách nhà thầu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Thêm / Sửa nhà thầu | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |

> 💡 **Lưu ý:** Chỉ Quản trị viên hệ thống mới có quyền Thêm/Sửa/Xóa thông tin nhân sự. Đây là nghiệp vụ nhạy cảm, được quản lý tập trung.

---

### 📊 PHÂN HỆ: TỔNG QUAN & BÁO CÁO

*Bảng điều khiển tổng quan, thống kê và xuất báo cáo.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| **Tổng quan (Dashboard)** | | | | | | | | |
| Xem bảng tổng quan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xuất dữ liệu tổng quan | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Báo cáo** | | | | | | | | |
| Xem báo cáo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xuất báo cáo (Excel/PDF) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### ⚙️ PHÂN HỆ: QUẢN TRỊ HỆ THỐNG

*Quản lý tài khoản, phân quyền và nhật ký hoạt động — chỉ dành cho Quản trị viên và Lãnh đạo.*

| Thao tác | Giám đốc | Phó GĐ | KT Trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Hành chính | Nhà thầu |
|:---------|:--------:|:------:|:---------:|:------------:|:---------:|:-----------:|:----------:|:--------:|
| Xem tài khoản người dùng | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quản lý tài khoản (thêm/sửa/xóa) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xem nhật ký hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> 💡 **Lưu ý:** Quản lý tài khoản và phân quyền là nghiệp vụ dành riêng cho **Quản trị viên hệ thống**. Lãnh đạo Ban được xem nhưng không được sửa.

---

## 🌐 Phạm vi dữ liệu — Bạn thấy dự án nào?

Không phải ai cũng thấy tất cả dự án. Hệ thống tự động lọc dữ liệu theo phạm vi phù hợp với vai trò và phòng ban của bạn.

### Sơ đồ phạm vi

```
🔑 Quản trị viên ──────────── Thấy TẤT CẢ dự án, TẤT CẢ dữ liệu
👔 Giám đốc ────────────────── Thấy TẤT CẢ dự án
📊 Kế toán trưởng ──────────── Thấy TẤT CẢ dự án (về mặt tài chính)

👔 Phó Giám đốc ────────────── Thấy dự án của CÁC PHÒNG mình phụ trách
                                (Ví dụ: PGĐ phụ trách Phòng QLDA 1 và 
                                 Phòng PTDV → thấy dự án của 2 phòng này)

📋 Phòng HC-TH, KH-ĐT ─────── Thấy TẤT CẢ dự án (phòng chức năng)
📋 Phòng KT-TĐ, PTDV ──────── Thấy TẤT CẢ dự án (phòng chức năng)

📋 Phòng QLDA 1 ────────────── Chỉ thấy dự án của Phòng QLDA 1
📋 Phòng QLDA 2 ────────────── Chỉ thấy dự án của Phòng QLDA 2
📋 Phòng QLDA 3 ────────────── Chỉ thấy dự án của Phòng QLDA 3

🏗️ Nhà thầu ─────────────────── Chỉ thấy dự án ĐƯỢC CHỈ ĐỊNH
```

### Giải thích chi tiết

| Bạn thuộc nhóm | Bạn sẽ thấy | Lý do |
|:---------------|:------------|:------|
| **Phòng chức năng** (HC-TH, KH-ĐT, KT-TĐ, PTDV) | Toàn bộ dự án | Vì nhiệm vụ phối hợp, tham mưu xuyên suốt cho tất cả dự án |
| **Phòng QLDA 1** | Chỉ dự án giao cho Phòng QLDA 1 | Theo phân công quản lý dự án tại Điều 5, Quy chế làm việc |
| **Phòng QLDA 2** | Chỉ dự án giao cho Phòng QLDA 2 | Tương tự |
| **Phòng QLDA 3** | Chỉ dự án giao cho Phòng QLDA 3 | Tương tự |
| **Phó Giám đốc** | Dự án của các phòng do PGĐ phụ trách | Theo QĐ phân công của Giám đốc. Quản trị viên cấu hình trong hệ thống |
| **Nhà thầu** | Chỉ dự án đã được gán | Quản trị viên gán quyền truy cập cho từng nhà thầu |

---

## 🏗️ Dành riêng cho Nhà thầu

Nếu bạn là đại diện nhà thầu được cấp tài khoản, hãy lưu ý:

### ✅ Bạn ĐƯỢC phép:
- **Xem** thông tin dự án mà bạn tham gia
- **Xem** hợp đồng liên quan đến bạn
- **Xem** phiếu thanh toán liên quan đến bạn
- **Xem** tài liệu CDE của dự án
- **Nộp hồ sơ** lên CDE (upload tài liệu vào khu vực WIP)

### ❌ Bạn KHÔNG được phép:
- Xem dự án mà bạn không được chỉ định
- Truy cập mục Tổng quan, Nhân sự, Đấu thầu, Báo cáo
- Truy cập mục Quản trị hệ thống
- Xem Quy chế nội bộ, Văn bản pháp luật
- Sửa hoặc xóa bất kỳ dữ liệu nào

---

## ❓ Câu hỏi thường gặp

### 1. "Tôi không thấy nút Thêm mới / Chỉnh sửa, tại sao?"
→ Vai trò của bạn không có quyền thao tác đó trên phân hệ này. Kiểm tra bảng quyền phía trên để biết bạn được làm gì. Nếu bạn cần quyền bổ sung, hãy liên hệ Quản trị viên.

### 2. "Tôi không thấy dự án mà đồng nghiệp thấy?"
→ Bạn và đồng nghiệp có thể thuộc phòng ban khác nhau. Hệ thống tự giới hạn dữ liệu theo phòng/ban. Nếu bạn cần xem dự án ngoài phạm vi, hãy liên hệ Quản trị viên.

### 3. "Tôi muốn được cấp thêm quyền, liên hệ ai?"
→ Liên hệ **Quản trị viên hệ thống**. Quản trị viên có thể bật thêm quyền cho bạn mà không cần thay đổi vai trò.

### 4. "Tại sao Kế toán trưởng lại có quyền Xóa thanh toán?"
→ Theo Quy chế làm việc (Điều 10), Kế toán trưởng chịu trách nhiệm chuyên môn về công tác kế toán. Hệ thống cấp quyền đầy đủ để KTT quản lý nghiệp vụ tài chính, bao gồm xóa phiếu sai.

### 5. "Phó Giám đốc chỉ thấy một số dự án, muốn thấy hết thì sao?"
→ Theo mô hình tổ chức, mỗi PGĐ phụ trách một nhóm phòng cụ thể. Quản trị viên cấu hình phân công phòng phụ trách tại **Cài đặt → Phân công lãnh đạo**. Nếu PGĐ chưa được phân công phòng nào, hệ thống mặc định cho xem toàn bộ.

### 6. "Tôi là nhà thầu, không truy cập được hệ thống?"
→ Kiểm tra tài khoản và mật khẩu đã được cung cấp. Nếu quên mật khẩu hoặc tài khoản bị khóa, liên hệ Quản trị viên.

### 7. "Quyền trên hệ thống có bảo vệ ở tầng nào?"
→ Hệ thống bảo vệ quyền ở **2 tầng**: 
- **Giao diện:** Nếu bạn không có quyền, nút bấm sẽ bị ẩn/khóa
- **Cơ sở dữ liệu:** Dù ai đó cố truy cập trực tiếp, cơ sở dữ liệu cũng chặn thao tác không được phép

---

## 📌 Nguyên tắc bảo mật chung

| # | Nguyên tắc | Mô tả |
|:--|:-----------|:------|
| 1 | **Chỉ được làm những gì được phép** | Bạn chỉ thao tác được trong phạm vi quyền của mình. Ngoài phạm vi → hệ thống tự chặn |
| 2 | **Mỗi người một tài khoản** | Không chia sẻ tài khoản. Mọi thao tác đều được ghi nhận theo tên bạn |
| 3 | **Tự động đăng xuất** | Nếu không thao tác trong 8 tiếng, hệ thống tự đăng xuất để bảo mật |
| 4 | **Bảo mật đăng nhập** | Hệ thống có xác thực 2 bước (MFA). Nếu đăng nhập sai nhiều lần, tài khoản sẽ bị tạm khóa |
| 5 | **Lưu vết mọi thao tác** | Mọi thay đổi về quyền, dữ liệu đều được ghi nhật ký tự động, không ai có thể xóa |

---

## 📝 Liên hệ hỗ trợ

Nếu bạn gặp vấn đề về quyền truy cập hoặc cần điều chỉnh quyền, hãy liên hệ:

| Nội dung | Liên hệ |
|:---------|:--------|
| Không truy cập được hệ thống | Quản trị viên hệ thống |
| Cần cấp thêm quyền thao tác | Lãnh đạo phòng → Quản trị viên |
| Nhà thầu cần tài khoản mới | Phòng Kế hoạch - Đấu thầu → Quản trị viên |
| Góp ý về hệ thống | Phòng Hành chính - Tổng hợp |

---

> *Tài liệu này được ban hành kèm theo Quyết định số .../QĐ-BQLDA ngày .../..../2026 của Ban QLDA ĐTXD CT Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh.*
>
> *Tài liệu dựa trên Quy chế làm việc Ban QLDA (ban hành 11/2025) và cấu hình hệ thống thực tế.*

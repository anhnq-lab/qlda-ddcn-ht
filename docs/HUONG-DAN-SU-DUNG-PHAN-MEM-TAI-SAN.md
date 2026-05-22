# HƯỚNG DẪN SỬ DỤNG PHẦN MỀM QUẢN LÝ TÀI SẢN CÔNG

**Hệ thống Quản lý Dự án Dân dụng và Hạ tầng — Ban QLDA ĐTXD CT Dân dụng và Hạ tầng khu vực**

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan)
2. [Truy cập module Tài sản công](#2-truy-cập)
3. [Màn hình danh sách tài sản](#3-danh-sách)
4. [Ghi tăng tài sản mới](#4-ghi-tăng)
5. [Sửa thông tin tài sản](#5-sửa-thông-tin)
6. [Xem lịch sử biến động](#6-lịch-sử)
7. [Đề xuất thanh lý](#7-thanh-lý)
8. [Tính hao mòn tự động](#8-hao-mòn)
9. [Báo cáo Phụ lục 2 (BK02)](#9-báo-cáo)
10. [Kiểm kê tài sản](#10-kiểm-kê)
11. [Câu hỏi thường gặp](#11-faq)

---

## 1. Tổng quan hệ thống

Module **Quản lý Tài sản công** nằm trong hệ thống quản lý Ban QLDA, cho phép:

- Theo dõi toàn bộ tài sản cố định theo chuẩn Thông tư 23/2023/TT-BTC
- Quản lý vòng đời tài sản: nhập mới → theo dõi → thanh lý
- Tính hao mòn tự động cuối năm
- Lập báo cáo BK02 (Bảng kê chi tiết TSCĐ) xuất thẳng ra Excel
- Kiểm kê thực tế và đối chiếu sổ sách

**Phân quyền:**

| Vai trò | Quyền thao tác |
|---|---|
| Quản trị viên | Toàn quyền: thêm, sửa, xóa, thanh lý, tính hao mòn |
| Kế toán | Thêm, sửa tài sản; tính hao mòn; lập báo cáo; kiểm kê |
| Cán bộ | Xem danh sách, xem lịch sử biến động |

---

## 2. Truy cập module Tài sản công

1. Đăng nhập hệ thống bằng tài khoản được cấp.
2. Trên thanh menu bên trái, chọn **Tài sản công** (biểu tượng tòa nhà).
3. Hệ thống hiển thị trang **Quản lý Tài sản công** với 3 tab:
   - **Danh sách tài sản** — quản lý hồ sơ tài sản
   - **Báo cáo Phụ lục 2** — lập và xuất báo cáo BK02
   - **Đối chiếu & Kiểm kê thực tế** — tổ chức kiểm kê

---

## 3. Màn hình danh sách tài sản

### 3.1 Tổng quan số liệu (4 ô thống kê đầu trang)

| Ô thống kê | Ý nghĩa |
|---|---|
| **Đang dùng** | Số tài sản đang ở trạng thái Hoạt động |
| **Nguyên giá** | Tổng nguyên giá toàn bộ tài sản đang hoạt động (VNĐ) |
| **Hao mòn lũy kế** | Tổng hao mòn tích lũy từ khi đưa vào sử dụng (VNĐ) |
| **Còn lại** | Giá trị thuần còn lại = Nguyên giá − Hao mòn (VNĐ) |

### 3.2 Bộ lọc tìm kiếm

- **Ô tìm kiếm**: Nhập mã tài sản, tên tài sản hoặc vị trí để lọc tức thì.
- **Lọc theo phân loại**: Chọn nhóm tài sản (Máy vi tính, Xe ô tô, Nhà cửa...).
- **Lọc theo trạng thái**: Hoạt động / Chờ thanh lý / Đã thanh lý / Điều chuyển.
- **Lọc theo phòng ban**: Trụ sở chính / Thạch Hà / Can Lộc / Hương Khê / Cẩm Xuyên / Đức Thọ / Vũ Quang.

### 3.3 Bảng danh sách tài sản

Bảng hiển thị các cột:

| Cột | Nội dung |
|---|---|
| STT | Số thứ tự theo danh sách đang hiển thị |
| Mã tài sản | Mã định danh duy nhất của tài sản |
| Tên tài sản | Tên tài sản + nhóm phân loại |
| Người sử dụng | Tên người/bộ phận đang sử dụng trực tiếp |
| Nguyên giá | Nguyên giá theo sổ sách |
| Giá trị còn lại | Giá trị thuần + hao mòn lũy kế |
| Bộ phận | Phòng ban/chi nhánh quản lý |
| Trạng thái | Hoạt động / Chờ thanh lý / Đã thanh lý / Điều chuyển |
| Hành động | Xem lịch sử / Sửa / Thanh lý / Xóa |

> **Lưu ý**: Click vào tiêu đề cột để sắp xếp tăng/giảm dần.

---

## 4. Ghi tăng tài sản mới

Dùng khi: Mua sắm tài sản mới, tiếp nhận tài sản điều chuyển, được tặng/tài trợ.

**Các bước thực hiện:**

1. Click nút **+ Ghi tăng tài sản** (góc trên phải).
2. Hệ thống mở form nhập liệu. Điền đầy đủ các trường:

**Phần Thông tin chung:**

| Trường | Bắt buộc | Hướng dẫn |
|---|---|---|
| Mã tài sản | ✓ | Nhập mã duy nhất, ví dụ: `OTO-2026-001`. Hệ thống sẽ báo lỗi nếu trùng |
| Tên tài sản | ✓ | Tên đầy đủ, rõ ràng theo hóa đơn/biên bản nghiệm thu |
| Phân loại | ✓ | Chọn nhóm phù hợp; hệ thống tự điền tỷ lệ hao mòn mặc định |
| Đơn vị tính | ✓ | Chiếc / M2 / Bộ... |
| Số lượng | ✓ | Mặc định 1 |
| Mô tả | — | Ghi chú thêm về đặc tính kỹ thuật |

**Phần Quản lý & Sử dụng:**

| Trường | Hướng dẫn |
|---|---|
| Vị trí sử dụng | Phòng, tầng, tòa nhà cụ thể |
| Bộ phận quản lý | Chọn từ danh sách phòng ban |
| Người phụ trách | Tìm kiếm theo tên nhân viên |
| Dự án liên quan | Chọn dự án nếu tài sản gắn với dự án cụ thể |

**Phần Ngày & Khấu hao:**

| Trường | Hướng dẫn |
|---|---|
| Ngày mua | Ngày trên hóa đơn mua sắm |
| Ngày đưa vào sử dụng | Ngày bắt đầu tính hao mòn (thường là ngày nghiệm thu) |
| Tỷ lệ hao mòn (%) | Tự động điền theo nhóm; có thể chỉnh nếu khác mặc định |
| Số năm sử dụng | Hiển thị tự động = 100 ÷ Tỷ lệ hao mòn |

**Phần Giá trị:**

| Trường | Hướng dẫn |
|---|---|
| Từ ngân sách nhà nước | Phần vốn NSNN trong nguyên giá |
| Từ nguồn khác | Phần vốn ODA, tài trợ... |
| Nguyên giá (tổng) | Tự động tính = NSNN + Nguồn khác |
| Hao mòn lũy kế | Nhập nếu tài sản đã qua sử dụng trước khi nhập hệ thống |

3. Kiểm tra lại tất cả thông tin, click **Lưu tài sản**.
4. Hệ thống tự động ghi nhận một giao dịch "Ghi tăng" vào lịch sử biến động.

> **Lưu ý**: Sau khi lưu, hệ thống **không cho phép thay đổi mã tài sản**. Nếu nhập sai mã cần xóa và tạo lại.

---

## 5. Sửa thông tin tài sản

Dùng khi: Cập nhật nơi sử dụng, người phụ trách, sửa lỗi nhập liệu, ghi nhận nâng cấp/sửa chữa lớn.

**Các bước:**
1. Tìm tài sản cần sửa (dùng ô tìm kiếm hoặc lọc).
2. Click biểu tượng **✏️ (bút chì)** ở cột Hành động.
3. Form mở ra với thông tin hiện tại đã điền sẵn.
4. Chỉnh sửa các trường cần thay đổi.
5. Click **Cập nhật tài sản**.

> **Lưu ý**: Khi thay đổi **Nguyên giá** hoặc **Hao mòn lũy kế**, hệ thống tự tính lại Giá trị còn lại và ghi nhận vào lịch sử biến động.

---

## 6. Xem lịch sử biến động

Mỗi tài sản lưu toàn bộ lịch sử thay đổi. Để xem:

1. Click biểu tượng **🕐 (đồng hồ)** ở cột Hành động.
2. Bảng lịch sử hiện ra bên phải màn hình, hiển thị theo trình tự thời gian:
   - **Ngày** giao dịch
   - **Loại** biến động: Ghi tăng / Ghi giảm / Đánh giá lại / Hao mòn
   - **Lý do** cụ thể
   - **Thay đổi** nguyên giá và hao mòn

3. Click **✕** hoặc click ngoài vùng để đóng bảng lịch sử.

---

## 7. Đề xuất thanh lý

Dùng khi: Tài sản hết khấu hao, hư hỏng, lạc hậu kỹ thuật hoặc không có nhu cầu sử dụng.

**Các bước:**

1. Tìm tài sản cần thanh lý.
2. Click biểu tượng **⚠️ (tam giác cảnh báo)** — chỉ hiển thị với tài sản đang Hoạt động.
3. Dialog xác nhận xuất hiện:
   - **Tên tài sản**: Hiển thị để xác nhận đúng tài sản
   - **Lý do thanh lý**: Chọn từ danh sách:
     - Hết giá trị khấu hao
     - Hỏng hóc không sửa được
     - Lạc hậu kỹ thuật
     - Không có nhu cầu sử dụng
     - Lý do khác
4. Click **Xác nhận thanh lý**.
5. Tài sản chuyển sang trạng thái **Chờ thanh lý** (màu vàng).
6. Sau khi Hội đồng thanh lý hoàn tất thủ tục, cán bộ kế toán vào sửa trạng thái thành **Đã thanh lý**.

> **Lưu ý**: Đề xuất thanh lý không xóa tài sản khỏi hệ thống. Tài sản vẫn được lưu lịch sử để phục vụ kiểm tra, kiểm toán.

---

## 8. Tính hao mòn tự động

Chức năng này tính hao mòn một lần cho **toàn bộ tài sản đang Hoạt động**, thực hiện vào **cuối năm (31/12)**.

**Các bước:**

1. Click nút **🔄 Tính hao mòn tự động** (góc trên phải trang).
2. Hộp thoại xác nhận hiện ra: *"Bạn có chắc chắn muốn thực hiện tính hao mòn tài sản công tự động cho năm tài chính [năm hiện tại]?"*
3. Click **OK** để xác nhận.
4. Hệ thống tự động:
   - Lấy toàn bộ tài sản đang **Hoạt động**
   - Tính: **Mức hao mòn = Nguyên giá × Tỷ lệ hao mòn (%)**
   - Không tính thêm với tài sản đã hết khấu hao (Còn lại = 0)
   - Ghi nhận giao dịch "Hao mòn tự động năm [năm]" vào lịch sử từng tài sản
   - Cập nhật Hao mòn lũy kế và Giá trị còn lại
5. Thông báo thành công: *"Đã hoàn thành tính hao mòn cho [N] tài sản công đang hoạt động"*.

> **Quan trọng**:
> - Chỉ thực hiện **một lần/năm** vào ngày 31/12. Nếu chạy nhiều lần trong cùng năm sẽ tính hao mòn trùng.
> - Sau khi chạy, kiểm tra lại số liệu trước khi in báo cáo.
> - Đất và tài sản có tỷ lệ hao mòn = 0% không bị ảnh hưởng.

---

## 9. Báo cáo Phụ lục 2 (BK02)

Module tự động tổng hợp dữ liệu thành **Bảng kê chi tiết tài sản cố định (BK02)** theo mẫu Thông tư 23/2023/TT-BTC.

### 9.1 Xem báo cáo

1. Click tab **Báo cáo Phụ lục 2**.
2. Trang hiển thị:
   - **4 ô thống kê**: Tổng số tài sản, Nguyên giá, Hao mòn lũy kế, Giá trị còn lại
   - **Bảng BK02**: Nhóm theo các mục (I. Đất, II. Nhà cửa vật kiến trúc, III. Xe ô tô...), có dòng cộng từng mục và tổng cộng
3. Kiểm tra số liệu khớp với sổ kế toán.

### 9.2 In báo cáo

1. Click nút **🖨️ In báo cáo**.
2. Hộp thoại in của trình duyệt mở ra.
3. Chọn máy in hoặc "Lưu thành PDF", chọn khổ giấy **A4 nằm ngang**, click In.

### 9.3 Xuất file Excel

1. Click nút **📥 Xuất Excel**.
2. File `BK02_TSCĐ_[năm].xlsx` tự động tải về máy tính.
3. File Excel bao gồm:
   - Tiêu đề đơn vị, tên báo cáo, năm
   - Dữ liệu nhóm theo từng mục tài sản
   - Dòng cộng từng mục và tổng cộng
   - Định dạng cột độ rộng phù hợp, chữ hoa mục tiêu đề
4. Mở file Excel, kiểm tra, bổ sung chữ ký trước khi nộp.

---

## 10. Kiểm kê tài sản

### 10.1 Tạo phiên kiểm kê mới

1. Click tab **Đối chiếu & Kiểm kê thực tế**.
2. Click nút **+ Tạo phiên kiểm kê mới**.
3. Điền thông tin:
   - **Tên phiên kiểm kê**: Ví dụ "Kiểm kê TSCĐ năm 2026"
   - **Ngày kiểm kê**: Chọn ngày thực hiện
   - **Ghi chú**: Mô tả phạm vi, đoàn kiểm kê...
4. Click **Tạo kiểm kê**.
5. Hệ thống tự động tạo danh sách tất cả tài sản đang hoạt động với số lượng sổ sách, chờ nhập số lượng thực tế.

### 10.2 Nhập kết quả kiểm kê

1. Chọn phiên kiểm kê cần nhập từ danh sách bên trái.
2. Với mỗi tài sản trong danh sách:
   - Cột **Số lượng sổ sách**: Số liệu từ hệ thống (chỉ xem)
   - Cột **Số lượng thực tế**: Nhập số đếm được thực tế
   - Cột **Tình trạng**: Chọn Tốt / Hư hỏng / Cần sửa chữa
   - Cột **Ghi chú**: Ghi nhận thêm nếu có
3. Cột **Chênh lệch** tự động tính = Thực tế − Sổ sách (màu đỏ nếu âm, xanh nếu dương).
4. Click **Lưu bản nháp** để lưu tiến độ giữa chừng.

### 10.3 Hoàn thành kiểm kê

1. Sau khi nhập đủ tất cả tài sản, click **Hoàn thành kiểm kê**.
2. Xác nhận trong hộp thoại.
3. Hệ thống:
   - Cập nhật trạng thái phiên kiểm kê thành **Hoàn thành**
   - Tự động điều chỉnh số lượng tài sản theo kết quả thực tế (nếu có chênh lệch)
   - Ghi nhận giao dịch điều chỉnh vào lịch sử biến động từng tài sản
4. Lưu trữ kết quả kiểm kê để tra cứu về sau.

> **Lưu ý**: Sau khi **Hoàn thành**, không thể chỉnh sửa dữ liệu kiểm kê. Đảm bảo kiểm tra kỹ trước khi bấm Hoàn thành.

---

## 11. Câu hỏi thường gặp

**Q: Tôi nhập sai mã tài sản, có sửa được không?**
> Mã tài sản không thể sửa sau khi lưu. Cần xóa tài sản và tạo lại với mã đúng. Lưu ý xóa sẽ mất lịch sử biến động nếu đã có giao dịch.

**Q: Tôi bấm "Tính hao mòn tự động" nhưng không thấy thay đổi gì?**
> Kiểm tra: (1) tài sản có trạng thái Hoạt động không; (2) tỷ lệ hao mòn có > 0% không; (3) tài sản có còn giá trị để khấu hao không (giá trị còn lại > 0).

**Q: Xuất Excel BK02 nhưng file bị lỗi font chữ tiếng Việt?**
> Mở Excel → chọn tất cả → định dạng font **Times New Roman** hoặc **Arial**. Đảm bảo máy tính đã cài bộ gõ tiếng Việt Unicode.

**Q: Tài sản đã thanh lý có thể phục hồi lại trạng thái Hoạt động không?**
> Có thể sửa trạng thái qua chức năng **Sửa tài sản**. Tuy nhiên cần có lý do hợp lệ và được phê duyệt theo quy chế.

**Q: Tôi muốn xem danh sách tài sản của một chi nhánh cụ thể?**
> Dùng bộ lọc **"-- Tất cả phòng ban --"** → chọn chi nhánh mong muốn. Danh sách sẽ lọc tức thì.

**Q: Sự khác biệt giữa "Vị trí sử dụng" và "Bộ phận quản lý" là gì?**
> - **Vị trí sử dụng (Người sử dụng)**: Vị trí cụ thể / tên người đang trực tiếp dùng tài sản (ví dụ: "Phòng kế toán tầng 2", "Nguyễn Văn A")
> - **Bộ phận quản lý**: Phòng ban / chi nhánh chịu trách nhiệm về tài sản đó (ví dụ: "Trụ sở chính", "Can Lộc")

**Q: Tôi không thấy nút Thanh lý (⚠️) trên một số tài sản?**
> Nút Thanh lý chỉ hiển thị với tài sản đang ở trạng thái **Hoạt động**. Tài sản đang Chờ thanh lý hoặc đã Thanh lý không có nút này.

---

## Phụ lục: Danh mục nhóm tài sản và mã phân loại

| Mã nhóm | Tên nhóm | Tỷ lệ HM/năm |
|---|---|---|
| LAND | Đất (khuôn viên trụ sở, cơ sở sự nghiệp) | 0% |
| BUILDING_HQ | Nhà làm việc, nhà trụ sở | 2% |
| BUILDING_OTHER | Nhà khác (kho, xe, nghỉ công vụ) | 4% |
| STRUCTURE | Vật kiến trúc (sân bãi, tường rào, đường) | 10% |
| CAR_OFFICIAL | Xe ô tô phục vụ công tác chung | 10% |
| CAR_SPECIAL | Xe ô tô chuyên dùng | 10% |
| VEHICLE_OTHER | Phương tiện vận tải khác | 12,5% |
| PC_DESKTOP | Máy vi tính để bàn | 20% |
| PC_LAPTOP | Máy vi tính xách tay (Laptop) | 20% |
| PRINTER_PHOTO | Máy in, máy photocopy | 20% |
| AIR_CON | Thiết bị điều hòa không khí | 12,5% |
| OFFICE_EQUIP | Thiết bị văn phòng khác | 20% |
| SPECIAL_EQUIP | Thiết bị chuyên dùng | 12,5% |
| INTANGIBLE_SOFTWARE | Phần mềm ứng dụng | 20% |
| INTANGIBLE_LAND_RIGHT | Quyền sử dụng đất | 0% |
| TANGIBLE_OTHER | Tài sản cố định hữu hình khác | 10% |

---

*Mọi vướng mắc trong quá trình sử dụng phần mềm, liên hệ bộ phận IT hoặc Phòng Tài chính - Kế toán để được hỗ trợ.*

---

*Tài liệu phiên bản 1.0 — Tháng 5/2026*

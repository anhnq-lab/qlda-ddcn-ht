# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU VÀ CẢNH BÁO SAI LỆCH LOGIC SỐ LIỆU
## Danh mục dự án cấp huyện chuyển giao về Ban QLDA đầu tư xây dựng công trình Dân dụng và Công nghiệp tỉnh Hà Tĩnh
*(Kết quả rà soát chi tiết từ file Excel: `28.5.26 BC  dự án các huyện chuyển về.xlsx`)*

---

## I. TỔNG QUAN KẾT QUẢ RÀ SOÁT LOGIC (AUDIT SUMMARY)

Áp dụng các thuật toán đối chiếu chéo số liệu tự động giữa các cột: **Tổng mức đầu tư (TMDT)**, **Kế hoạch vốn đã bố trí**, **Lũy kế giá trị nghiệm thu**, **Lũy kế giải ngân** và **Công nợ**, hệ thống đã phát hiện số lượng lỗi logic rất lớn trên cả hai bảng biểu chính:

*   **Sheet PL03 (Dự án đã hoàn thành):** Phát hiện **136 lỗi logic** (bao gồm lệch cộng nguồn vốn, giải ngân vượt kế hoạch vốn, giải ngân vượt nghiệm thu thực tế, và công nợ lệch công thức).
*   **Sheet PL04 (Dự án đang thi công / Chuẩn bị đầu tư):** Phát hiện **59 lỗi logic** (nhiều lỗi có chênh lệch giá trị cực lớn, lên tới hàng trăm tỷ đồng do gõ sai định dạng).

Dưới đây là phân tích chi tiết các nhóm lỗi logic điển hình và danh sách các dự án sai lệch nghiêm trọng nhất cần được làm rõ với Ban QLDA các huyện trước khi tiếp nhận chính thức.

---

## II. CHI TIẾT CÁC NHÓM LỖI LOGIC ĐIỂN HÌNH

### 1. Nhóm 1: Giải ngân vượt giá trị Khối lượng nghiệm thu (Lỗi nghiêm trọng)
Về nguyên tắc quản lý đầu tư công, lũy kế giải ngân thực thanh không được vượt quá giá trị khối lượng nghiệm thu hoàn thành (trừ phần tạm ứng theo hợp đồng). Nếu giải ngân thực thanh vượt quá lớn so với nghiệm thu, công trình đang ở trạng thái **tạm ứng quá mức** hoặc **số liệu giải ngân bị ghi nhận sai lệch**.

#### Các dự án tiêu biểu ở Sheet PL04 (Đang thi công):
*   **Dòng 44 (Cẩm Xuyên): Dự án "Đường Cẩm Sơn đi Cẩm Thịnh (Đường tránh lũ)"**
    *   *Số liệu báo cáo:* Lũy kế giải ngân = **17.833,53 triệu đồng** vs Lũy kế nghiệm thu = **470 triệu đồng**.
    *   *Sai lệch:* Giải ngân vượt nghiệm thu **17.363,53 triệu đồng (gấp 38 lần giá trị nghiệm thu)**. Dự án đang tạm ứng quá lớn hoặc số liệu nghiệm thu chưa được cập nhật đầy đủ.
*   **Dòng 62 (Can Lộc): Dự án "Đường giao thông liên xã Khánh Vĩnh Yên - Thanh Lộc"**
    *   *Số liệu báo cáo:* Lũy kế giải ngân = **23.120 triệu đồng** vs Lũy kế nghiệm thu = **7.813 triệu đồng**.
    *   *Sai lệch:* Giải ngân vượt nghiệm thu **15.307 triệu đồng (gấp 3 lần giá trị nghiệm thu)**.
*   **Dòng 93 (Hương Khê): Dự án "Đường giao thông tránh lũ kết hợp vào khu xử lý chất thải rắn..."**
    *   *Số liệu báo cáo:* Lũy kế giải ngân = **8.500 triệu đồng** vs Lũy kế nghiệm thu = **5.900 triệu đồng** (Vượt **2.600 triệu đồng**).
*   **Dòng 130 (Thạch Hà): Dự án "Đường giao thông tổ 9, thị trấn Thạch Hà"**
    *   *Số liệu báo cáo:* Lũy kế giải ngân = **3.500 triệu đồng** vs Lũy kế nghiệm thu = **394 triệu đồng** (Vượt **3.106 triệu đồng**).
*   **Dòng 145 (Thạch Hà): "Tiểu dự án cải thiện cơ sở hạ tầng đô thị Thạch Hà"**
    *   *Số liệu báo cáo:* Lũy kế giải ngân = **580.712 triệu đồng** vs Lũy kế nghiệm thu = **483.305,41 triệu đồng**.
    *   *Sai lệch:* Giải ngân vượt nghiệm thu thực tế **97.406,59 triệu đồng (97,4 tỷ đồng)**.

#### Các dự án tiêu biểu ở Sheet PL03 (Đã hoàn thành):
*   **Dòng 306 (Hương Khê): Dự án "Nhà máy nước và Hệ thống cấp nước sạch cho Nhân dân thị trấn Hương Khê..."**
    *   *Số liệu báo cáo:* Lũy kế giải ngân = **219.412 triệu đồng** vs Lũy kế nghiệm thu = **225,443 triệu đồng** (ở dạng hiển thị dấu chấm thập phân bị gõ nhầm).
    *   *Sai lệch:* Chênh lệch hiển thị làm giải ngân vượt nghiệm thu tới **219.186,56 triệu đồng** do giá trị nghiệm thu gốc bị lưu dưới dạng số thực bé (`225.443` triệu đồng thay vì `225,443` triệu đồng).

---

### 2. Nhóm 2: Lỗi dấu chấm thập phân làm TMDT bị thu nhỏ 1.000 lần (Lỗi nhập liệu)
Tại địa bàn huyện Thạch Hà, người nhập liệu đã sử dụng dấu chấm thập phân thay vì dấu phẩy phân cách hàng ngàn cho cột **Tổng mức đầu tư**, khiến TMDT bị Excel hiểu là một số lẻ cực nhỏ (vài triệu đồng), trong khi vốn bố trí và giải ngân lại lên tới hàng tỷ hoặc hàng chục tỷ đồng.

#### Các sai lệch nghiêm trọng nhất ở Sheet PL04 (Đang thi công):
*   **Dòng 150 (Thạch Hà): Dự án "Xử lý cấp bách đê Hữu Phủ, huyện Thạch Hà..."**
    *   *Số liệu báo cáo:* TMDT = **130 triệu đồng** (Excel hiểu là 130 triệu đồng do gõ `130` thay vì `130.000`).
    *   *Vô lý:* Kế hoạch vốn bố trí = **100.398 triệu đồng (100,3 tỷ đồng)** and Lũy kế giải ngân = **57.249 triệu đồng (57,2 tỷ đồng)**. Vốn bố trí gấp **772 lần** Tổng mức đầu tư phê duyệt!
*   **Dòng 120 (Thạch Hà): Dự án "Xây dựng tràn điều tiết kết hợp đường giao thông nội đồng..."**
    *   *Số liệu báo cáo:* TMDT = **2 triệu đồng** (Gõ `2` thay vì `2.000` hoặc `2.500`).
    *   *Vô lý:* Kế hoạch vốn bố trí = **2.000 triệu đồng (2 tỷ đồng)** và Lũy kế giải ngân = **214,59 triệu đồng**. Vốn bố trí gấp **1.000 lần** TMDT!

#### Các sai lệch ở Sheet PL03 (Đã hoàn thành):
*   **Dòng 358 (Thạch Hà): Dự án "Đường giao thông liên xã Ngọc Sơn - Lưu Vĩnh Sơn"**
    *   *Số liệu báo cáo:* TMDT = **10,96 triệu đồng** (Excel đọc giá trị gõ `10.961`).
    *   *Vô lý:* Vốn bố trí = **9.609 triệu đồng (9,6 tỷ đồng)** và Giải ngân = **9.609 triệu đồng**.
*   **Dòng 362 (Thạch Hà): Dự án "Hạ tầng khuôn viên, bếp ăn bán trú... Trường mầm non Thạch Hải"**
    *   *Số liệu báo cáo:* TMDT = **5,99 triệu đồng** (Excel đọc từ `5.994`).
    *   *Vô lý:* Vốn bố trí = **5.588 triệu đồng (5,5 tỷ đồng)**.
*   **Dòng 366 (Thạch Hà): Dự án "Nhà HCQT... trường TH Tượng Sơn"**
    *   *Số liệu báo cáo:* TMDT = **10 triệu đồng** (Gõ `10` thay vì `10.000`).
    *   *Vô lý:* Vốn bố trí = **9.240,56 triệu đồng (9,2 tỷ đồng)**.

---

### 3. Nhóm 3: Giải ngân vượt Kế hoạch vốn đã bố trí
Lũy kế giải ngân của dự án vượt quá kế hoạch vốn đã cấp, đây là lỗi vi phạm nguyên tắc kiểm soát chi của Kho bạc Nhà nước.

#### Các dự án tiêu biểu ở Sheet PL04 (Đang thi công):
*   **Dòng 118 (Thạch Hà): Dự án "Xây dựng trạm bơm Cồn Đình, xã Thạch Long"**
    *   *Số liệu báo cáo:* Kế hoạch vốn bố trí = **500 triệu đồng** vs Lũy kế giải ngân = **88.133 triệu đồng**.
    *   *Sai lệch:* Giải ngân vượt kế hoạch vốn **87.633 triệu đồng (87,6 tỷ đồng)**. Đây là lỗi nhập sai số liệu giải ngân hoặc vốn bố trí cực kỳ nghiêm trọng.
*   **Dòng 119 (Thạch Hà): Dự án "Hàng rào và các công trình phụ trợ Trường THCS Ngọc Sơn"**
    *   *Số liệu báo cáo:* Kế hoạch vốn bố trí = **600 triệu đồng** vs Lũy kế giải ngân = **115.015 triệu đồng**.
    *   *Sai lệch:* Giải ngân vượt kế hoạch vốn **114.415 triệu đồng (114,4 tỷ đồng)**.
*   **Dòng 132 (Thạch Hà): Dự án "Nâng cấp Kênh tiêu cầu Trung Nghĩa, thị trấn Lộc Hà..."**
    *   *Số liệu báo cáo:* Kế hoạch vốn bố trí = **12.500 triệu đồng** vs Lũy kế giải ngân = **14.233 triệu đồng** (Vượt **1.733 triệu đồng**).

#### Các dự án tiêu biểu ở Sheet PL03 (Đã hoàn thành):
*   **Dòng 236 (Hương Khê): Dự án "Nâng cấp, cải tạo trường THCS và TH Phúc Đồng"**
    *   *Số liệu báo cáo:* Kế hoạch vốn bố trí = **1.678 triệu đồng** vs Lũy kế giải ngân = **2.515 triệu đồng** (Vượt **837 triệu đồng**).
*   **Dòng 243 (Hương Khê): Dự án "Đường GT từ đường HCM đi khu xử lý chất thải rắn..."**
    *   *Số liệu báo cáo:* Kế hoạch vốn báo cáo = **10.763 triệu đồng** vs Lũy kế giải ngân = **11.008 triệu đồng** (Vượt **245 triệu đồng**).

---

### 4. Nhóm 4: Tổng nguồn vốn thành phần không khớp với Tổng số vốn đã bố trí
Tổng số vốn đã bố trí (Cột 6) phải bằng tổng của các nguồn vốn thành phần: `NS Trung ương (Cột 7) + NS Tỉnh (Cột 8) + NS Huyện (Cột 9) + Khác (Cột 10)`. Rất nhiều dòng dữ liệu cộng tay bị lệch số.

#### Các dự án tiêu biểu:
*   **Dòng 42 (Cẩm Xuyên - PL04): Dự án "Đường trục xã TX.05 xã Cẩm Thành"**
    *   *Số liệu báo cáo:* Kế hoạch vốn ghi nhận **11.834,04 triệu đồng**.
    *   *Thành phần nguồn vốn:* NS Tỉnh = **10.493 triệu đồng**, NS Huyện = **11.834 triệu đồng**.
    *   *Sai lệch:* Cộng các nguồn thành phần là **22.327 triệu đồng**, lệch **10.492,96 triệu đồng** so với cột Tổng số báo cáo.
*   **Dòng 54 (Cẩm Xuyên - PL04): Dự án "Nâng cấp, mở rộng tuyến đường Cẩm Thạch - Thạch Hội..."**
    *   *Số liệu báo cáo:* Kế hoạch vốn báo cáo = **116.994 triệu đồng**.
    *   *Thành phần nguồn vốn:* Tất cả các cột NS TW, NS Tỉnh, NS Huyện, Khác đều để trống (`0` hoặc `null`). Lệch **116.994 triệu đồng** (Chưa phân rã nguồn vốn).
*   **Dòng 144 (Cẩm Xuyên - PL03): Dự án "Khắc phục cấp bách kè chống sạt lở bờ tả hạ lưu cầu Chợ Vực..."**
    *   *Số liệu báo cáo:* Vốn bố trí = **14.382 triệu đồng**, nhưng tổng nguồn cộng lại = **14.318,38 triệu đồng** (Lệch **63,62 triệu đồng**).

---

### 5. Nhóm 5: Số liệu Công nợ báo cáo lệch so với Công thức kế toán
Công nợ lý thuyết phải bằng: `Lũy kế giá trị nghiệm thu (Cột 11) - Lũy kế giải ngân (Cột 13)`. Tuy nhiên số liệu thực tế nhập vào cột Công nợ báo cáo (Cột 15) lệch rất xa.

#### Các dự án tiêu biểu ở Sheet PL03 (Đã hoàn thành):
*   **Dòng 75 (Vũ Quang): Dự án "Mở rộng, nâng cấp đường trục xã Trục Thác - Ngõ Bà Tuyết..."**
    *   *Số liệu báo cáo:* Nghiệm thu = **2.120 triệu đồng**, Giải ngân = **1.875 triệu đồng** (Chênh lệch thực tế là **245 triệu đồng**).
    *   *Công nợ báo cáo:* Ghi nhận **1.709,82 triệu đồng** (Lệch **1.464,82 triệu đồng** so với công thức).
*   **Dòng 176 (Can Lộc): Dự án "Đường Xô Viết kéo dài thị trấn Nghèn"**
    *   *Số liệu báo cáo:* Nghiệm thu = **49.212 triệu đồng**, Giải ngân = **49.069 triệu đồng** (Chênh lệch thực tế là **143 triệu đồng**).
    *   *Công nợ báo cáo:* Ghi nhận **637,48 triệu đồng** (Lệch **494,48 triệu đồng**).
*   **Dòng 182 (Hương Khê): Dự án "Nâng cấp đường GTNT xã Phúc Trạch..."**
    *   *Số liệu báo cáo:* Nghiệm thu = **7.096 triệu đồng**, Giải ngân = **8.646 triệu đồng** (Giải ngân vượt nghiệm thu **1.550 triệu đồng**).
    *   *Công nợ báo cáo:* Vẫn ghi nhận công nợ dương **608 triệu đồng** (Lệch **2.158 triệu đồng**).

---

## III. KHUYẾN NGHỊ VỀ PHƯƠNG ÁN XỬ LÝ SỐ LIỆU TRƯỚC KHI IMPORT ERP

Để đảm bảo tính toàn vẹn dữ liệu cho hệ thống **CIC ERP** và tránh các lỗi tính toán tự động trên hệ thống, đề xuất các hành động khẩn cấp sau:

1.  **Từ chối tiếp nhận số liệu thô chưa chuẩn hóa:** Trả lại tệp dữ liệu cho tổ chuyên môn của huyện Thạch Hà và huyện Hương Khê yêu cầu đính chính toàn bộ các dòng lỗi dấu chấm thập phân (TMDT bị thu nhỏ 1000 lần) và lỗi giải ngân vượt kế hoạch vốn đột biến tại dòng 118, 119 (Thạch Hà).
2.  **Yêu cầu cung cấp Thư xác nhận số dư Kho bạc:** Đối với các dự án có chênh lệch lớn giữa Lũy kế giải ngân và Lũy kế nghiệm thu (như dự án *Đường Cẩm Sơn đi Cẩm Thịnh* dôi dư 17,3 tỷ giải ngân), yêu cầu Kho bạc cấp huyện cung cấp sao kê/xác nhận số dư tạm ứng thực tế để kiểm tra dòng tiền dở dang.
3.  **Khóa tính năng tự động tính toán trên ERP:** Khi IT thực hiện viết code import dữ liệu từ file Excel này, bắt buộc phải viết các hàm kiểm tra ràng buộc (Constraint Checks) dựa trên các quy tắc logic nêu trên để tự động cách ly các dòng lỗi, không cho phép ghi đè vào bảng dữ liệu chính thức của hệ thống.

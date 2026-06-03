# QUY CHẾ NHẬP LIỆU MODULE QUẢN LÝ DỰ ÁN
## Ban QLDA Đầu tư Xây dựng Công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh
### Hệ thống QLDA-DDCN-HT

> **Phiên bản:** 3.0 | **Ban hành:** 02/06/2026 | **Áp dụng từ:** 02/06/2026
> **Đơn vị soạn thảo:** Phòng Hành chính – Tổng hợp
> **Phạm vi:** Quy chế chỉ điều chỉnh hoạt động **NHẬP LIỆU và CẬP NHẬT dữ liệu**. Hệ thống hiện **chưa có chức năng phê duyệt** — mọi thao tác ký duyệt/khóa sổ thực hiện theo hồ sơ giấy và phần mềm TDO, không nằm trong quy chế này.


# PHẦN A — QUY CHẾ


## CHƯƠNG I. QUY ĐỊNH CHUNG

### Điều 1. Phạm vi và đối tượng áp dụng

**1.1.** Quy chế này quy định tiêu chuẩn, trách nhiệm và hướng dẫn nhập liệu cho các phân hệ trong hệ thống QLDA-DDCN-HT:

| Phân hệ | Chức năng nhập liệu chính |
|---|---|
| Quản lý Dự án | Tạo, cập nhật, theo dõi thông tin dự án đầu tư công |
| Quản lý Nhiệm vụ | Tạo công việc, công việc con; theo dõi tiến độ; cộng tác |
| Kế hoạch | Kế hoạch khung năm, kế hoạch tháng, cập nhật kết quả tháng |
| Quy trình | Bước dự án, phân công trách nhiệm theo bước |

**1.2.** Đối tượng áp dụng: Toàn bộ viên chức, người lao động thuộc Ban (theo QĐ 1865/QĐ-UBND và Quy chế làm việc):

| Mã phòng | Tên phòng | Phạm vi dữ liệu | Chức năng chính |
|---|---|---|---|
| BGĐ | Ban Giám đốc (1 GĐ + 3 PGĐ) | Toàn bộ | Chỉ đạo, điều hành, theo dõi (Không trực tiếp nhập liệu) |
| HCTH | Phòng Hành chính – Tổng hợp | Toàn bộ | HC-Quản trị, Tổ chức, **Tài chính – Kế toán**, **Hợp đồng & Thanh toán**, Văn thư |
| KHDT | Phòng Kế hoạch – Đấu thầu | Toàn bộ | Kế hoạch vốn, Lựa chọn nhà thầu |
| KTTD | Phòng Kỹ thuật – Thẩm định | Toàn bộ | Thẩm định TK-DT, Kiểm tra QLCL, Kỹ thuật |
| QLDA1 | Phòng Quản lý Dự án 1 | Dự án được phân công | DA lĩnh vực VH, YT, GD, QLNN; khu vực Đức Thọ, Vũ Quang |
| QLDA2 | Phòng Quản lý Dự án 2 | Dự án được phân công | DA ODA, BIG2; khu vực Can Lộc, Cẩm Xuyên |
| QLDA3 | Phòng Quản lý Dự án 3 | Dự án được phân công | DA khu vực Thạch Hà, Hương Khê |
| PTDV | Phòng Phát triển Dịch vụ | Toàn bộ | TV QLDA, TV giám sát cho CĐT khác, Tự thực hiện |

**1.3.** Vai trò của các thành viên trực tiếp tham gia quản lý dự án trên hệ thống (được phân công cụ thể tại Tab Nhân sự & Thành viên):

| Vai trò thành viên | Đối tượng gán | Nhiệm vụ chính trên hệ thống | Giới hạn quyền thao tác |
|---|---|---|---|
| **Giám đốc QLDA** | Giám đốc Ban QLDA phụ trách dự án | - Theo dõi tiến độ tổng thể dự án.<br>- Rà soát, duyệt Master Plan (ngoài hệ thống).<br>- Theo dõi cảnh báo rủi ro về vốn, tiến độ. | **Chỉ xem**, không trực tiếp nhập liệu hoặc sửa thông tin chi tiết. |
| **Kế toán theo dõi** | Kế toán viên (Phòng HCTH) được phân công theo dõi dự án | - Nhập đợt giải ngân thực tế (tạm ứng, thanh toán KLHT, thu hồi tạm ứng).<br>- Nhập hồ sơ thanh toán, thông tin hợp đồng.<br>- Theo dõi số dư công nợ và quyết toán dự án hoàn thành. | **Tạo/Sửa** tại Tab Vốn (giải ngân) và Tab Quyết toán. **Chỉ xem** các tab khác. |
| **Cán bộ phụ trách chính** | Kỹ sư Ban QLDA (QLDA1/2/3) phụ trách chính dự án | - Lập kế hoạch thực hiện dự án (Master Plan).<br>- Cập nhật thông tin dự án (sau khi khởi tạo).<br>- Cập nhật tiến độ hạng mục, quy trình GPMB 16 bước.<br>- Nhập thông tin gói thầu (tab Gói thầu), đính kèm tài liệu pháp lý.<br>- Ghi nhận thông tin nhật ký thi công hàng ngày. | **Tạo/Sửa** toàn bộ các tab của dự án (trừ tab giải ngân thực tế của Kế toán). |
| **Chuyên viên phối hợp (Phòng KHDT)** | Chuyên viên phòng Kế hoạch – Đấu thầu | - Nhập kế hoạch vốn năm, trung hạn và quyết định giao vốn.<br>- Nhập kế hoạch lựa chọn nhà thầu, thông tin gói thầu.<br>- Phối hợp theo dõi tiến độ đấu thầu. | **Tạo/Sửa** tại tab Vốn (Kế hoạch vốn) và tab Gói thầu (thông tin ban đầu). |
| **Chuyên viên phối hợp (Phòng KTTD)** | Kỹ sư phòng Kỹ thuật – Thẩm định | - Nhập kết quả thẩm định thiết kế, dự toán (TK-DT).<br>- Nhập thông tin quy mô công trình và nghiệm thu QLCL. | **Tạo/Sửa** tại tab Thông tin chung (Pháp lý/Quy mô) và các nhiệm vụ thẩm định. |
| **Chuyên viên phối hợp (Phòng HCTH)** | Chuyên viên mảng hành chính, văn phòng | - Nhập văn bản chỉ đạo điều hành chung của dự án.<br>- Quản lý, tải lên các tài liệu pháp lý chung.<br>- Hỗ trợ tổng hợp báo cáo tiến độ tuần/tháng. | **Tạo/Sửa** nhiệm vụ điều hành và tab Tài liệu được phân công. |


### Điều 2. Nguyên tắc chung

1. **Chính xác:** Dữ liệu nhập phải phản ánh đúng thực tế, có căn cứ pháp lý hoặc văn bản nội bộ.
2. **Kịp thời:** Nhập liệu trong vòng **24 giờ** kể từ khi phát sinh sự kiện.
3. **Đầy đủ:** Tất cả các trường bắt buộc (dấu *) phải được điền.
4. **Nhất quán:** Tuân theo chuẩn định dạng thống nhất (Điều 3).
5. **Trách nhiệm cá nhân:** Người nhập liệu chịu trách nhiệm về dữ liệu mình nhập.
6. **Phân cấp:** Chỉ nhập liệu trong phạm vi được phân quyền.
7. **Không nhập trùng:** Trường nào hệ thống đã tự tính thì không nhập tay (xem Điều 5 và tài liệu *Khảo sát nhập liệu dự án*).

### Điều 3. Quy ước định dạng

| Loại dữ liệu | Định dạng bắt buộc | Ví dụ |
|---|---|---|
| Ngày tháng | Ngày/Tháng/Năm | 15/06/2026 |
| Số tiền | Đồng (VND), đầy đủ, không làm tròn | 4.600.000.000.000 |
| Mã dự án | Mã quan hệ ngân sách (Mã QHNS) gồm 7 chữ số | 8156067 |
| Số quyết định | Đầy đủ số, ký hiệu | 123/QĐ-UBND |
| Tên người | Họ và tên đầy đủ, viết hoa chữ cái đầu | Nguyễn Văn A |
| Phần trăm | Số nguyên 0–100 | 75 |

### Điều 4. Quy ước ký hiệu trạng thái trường dữ liệu

Trong quy chế này, mỗi trường thông tin được gắn một trong các ký hiệu sau:

| Ký hiệu | Ý nghĩa | Yêu cầu |
|---|---|---|
| ✍️ **Nhập tay** | Người dùng phải tự điền | Nhập đầy đủ, chính xác |
| ⚙️ **Tự động** | Hệ thống tự tính từ dữ liệu khác | **Không nhập tay** — chỉ xem |
| ⏳ **Đang bổ sung** | Chưa có ô nhập, đang phát triển | Tạm thời ghi nhận ngoài hệ thống |


## CHƯƠNG II. QUY ĐỊNH NHẬP LIỆU DỰ ÁN

### Điều 5. Thông tin cơ bản dự án

#### 5.1. Nhóm thông tin định danh

| STT | Trường | Ký hiệu | Vị trí trên phần mềm | Ghi chú |
|---|---|---|---|---|
| 1 | Tên dự án (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin cơ bản | Tên đầy đủ theo QĐ phê duyệt, không viết tắt |
| 2 | Mã dự án (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin cơ bản | Bắt buộc nhập theo Mã quan hệ ngân sách (Mã QHNS) |
| 3 | Chuyên ngành dự án (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin cơ bản | Dân dụng & CN / Giao thông & ĐT / Nông nghiệp & NT / Hỗn hợp / Khác |
| 4 | **Nhóm dự án (QN/A/B/C)** | ⚙️ Tự động | Tab Thông tin chung → Phân mục Thông tin cơ bản | Tính từ Tổng mức ĐT + Chuyên ngành (Luật ĐTC 58/2024) — **không chọn tay** |
| 5 | Phòng QLDA phụ trách (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin cơ bản | QLDA1 / QLDA2 / QLDA3 |

> **Áp dụng:** Nhập Loại hình đầu tư từ danh sách. Nhóm dự án (QN/A/B/C) được hệ thống tự động xác định dựa trên Tổng mức đầu tư và Chuyên ngành dự án theo quy định của Luật Đầu tư công.

#### 5.2. Nhóm thông tin tài chính

| STT | Trường | Ký hiệu | Vị trí trên phần mềm | Ghi chú |
|---|---|---|---|---|
| 8 | Tổng mức đầu tư (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin tài chính | VND theo QĐ phê duyệt, không làm tròn |
| 9 | Nguồn vốn (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin tài chính | Chọn nhiều nguồn |
| 10 | Cơ cấu vốn (NSTW, NSĐP, vay, ODA, khác) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin tài chính | 5 ô riêng |
| 11 | Cơ cấu chi phí (GPMB, XL, TB, QLDA, TV, khác, dự phòng) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Thông tin tài chính | 7 ô riêng |
| 12 | **Tổng cơ cấu chi phí** | ⚙️ Tự động | Tab Thông tin chung → Phân mục Thông tin tài chính | Hệ thống cộng 7 hạng mục |
| 13 | Tổng dự toán (ban đầu) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Quy mô công trình | Nhập tại phân mục Quy mô công trình |

> **Lưu ý nhất quán số liệu:** Tổng mức đầu tư **nên bằng** tổng cơ cấu chi phí và tổng cơ cấu vốn. Hệ thống hiện **chưa cảnh báo tự động** khi lệch (đã đưa vào kế hoạch bổ sung). Người nhập tự rà soát.

#### 5.3. Nhóm thông tin tiến độ

| STT | Trường | Ký hiệu | Vị trí trên phần mềm | Ghi chú |
|---|---|---|---|---|
| 14 | Giai đoạn (Chuẩn bị/Thực hiện/Kết thúc) (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Hiện trạng & Tiến độ | Chọn từ dropdown: Chuẩn bị dự án / Thực hiện dự án / Kết thúc xây dựng |
| 15 | Hiện trạng dự án (*) | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Hiện trạng & Tiến độ | 1 trong 10 mã (mục 5.5) |
| 16 | Ngày khởi công | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Hiện trạng & Tiến độ | Bắt buộc nếu hiện trạng ≥ 3 |
| 17 | Ngày hoàn thành dự kiến | ✍️ Nhập tay | Tab Thông tin chung → Phân mục Hiện trạng & Tiến độ | Bắt buộc nếu đang thi công |
| 18 | **Tiến độ chung (%)** | ⚙️ Tự động | Tab Kế hoạch (hoặc Tab Thi công) | Trung bình tiến độ các nhiệm vụ của dự án |
| 19 | Tiến độ tài chính / Tỷ lệ giải ngân (%) | ⏳ Đang bổ sung | Tab Vốn (hoặc Tab Quyết toán) | Sẽ tự tính = Tổng giải ngân / Tổng KHV |
| 20 | Tiến độ vật lý (%) | ⏳ Đang bổ sung | Tab Thi công | Sẽ tự tính từ khối lượng nghiệm thu |

> **Quan trọng:** **Tiến độ chung không nhập tay.** Muốn thay đổi tiến độ dự án → cập nhật tiến độ từng nhiệm vụ.

#### 5.5. Bảng hiện trạng dự án (10 mã)

| Mã | Hiện trạng | Điều kiện chuyển vào |
|---|---|---|
| 1 | Duyệt chủ trương | Có QĐ chủ trương đầu tư |
| 2 | Duyệt dự án chưa khởi công | Có QĐ phê duyệt dự án |
| 3 | Đang thi công | Đã khởi công thực tế |
| 4 | Hoàn thành chưa bàn giao | Có biên bản nghiệm thu hoàn thành |
| 5 | Bàn giao chưa trình quyết toán | Có biên bản bàn giao |
| 6 | Đã trình chưa duyệt quyết toán | Đã nộp hồ sơ quyết toán |
| 7 | Đã quyết toán còn công nợ | Có QĐ phê duyệt quyết toán |
| 8 | Xử lý tài chính | Hết nhiệm vụ chi, còn tồn đọng |
| 9 | Dự án kết thúc | Xử lý xong toàn bộ |
| 10 | Chưa nhận bàn giao từ CĐT cũ | Dự án tiếp nhận |

### Điều 6. Thông tin pháp lý dự án (đều ✍️ Nhập tay)

| Cụm | Trường | Bắt buộc | Vị trí trên phần mềm | Ghi chú |
|---|---|---|---|---|
| Chủ trương đầu tư | Cấp QĐ, Số QĐ, Ngày ban hành, Cơ quan ban hành | Có | Tab Thông tin chung → Phân mục Thông tin pháp lý | Quyết định phê duyệt chủ trương đầu tư |
| Phê duyệt dự án | Số QĐ, Ngày phê duyệt, Cơ quan phê duyệt | Có | Tab Thông tin chung → Phân mục Thông tin pháp lý | Quyết định phê duyệt dự án đầu tư |
| Thiết kế – Dự toán | Số QĐ phê duyệt TK-DT, Ngày QĐ, Cơ quan thẩm định, Tổng dự toán | Bắt buộc khi vào giai đoạn Thực hiện | Tab Thông tin chung → Phân mục Thông tin pháp lý | Thiết kế bản vẽ thi công và dự toán |
| Nhận bàn giao (nếu có) | Chủ đầu tư cũ, Số QĐ chuyển CĐT, Cấp QĐ trước bàn giao | Khi tiếp nhận | Tab Thông tin chung → Phân mục Thông tin pháp lý | Dành cho dự án tiếp nhận |

### Điều 7. Thông tin quy mô công trình (đều ✍️ Nhập tay)

Nhập tại **Tab Thông tin chung → Phân mục Quy mô công trình**:

DT khu đất, DT xây dựng, DT sàn, Chiều cao, Mật độ xây dựng, Hệ số sử dụng đất, Số tầng nổi, Số tầng hầm, Tổng dự toán ban đầu.

### Điều 8. Thông tin nhân sự dự án (✍️ Nhập tay nhân sự / ⚙️ Tự động liên kết nhà thầu)

| Trường | Bắt buộc | Vị trí trên phần mềm | Nguồn |
|---|---|---|---|
| Kế toán theo dõi (*) | Có | Tab Thông tin chung → Phân mục Nhân sự & Thành viên | Chọn từ bộ phận Kế toán (thuộc Phòng HCTH) |
| Giám đốc QLDA (*) | Có | Tab Thông tin chung → Phân mục Nhân sự & Thành viên | Chỉ định vị trí Giám đốc Ban QLDA phụ trách (lãnh đạo chỉ rà soát/phê duyệt, không nhập liệu) |
| Cán bộ phụ trách chính (*) | Có | Tab Thông tin chung → Phân mục Nhân sự & Thành viên | Chọn từ cán bộ kỹ thuật (chuyên viên) thuộc phòng QLDA đang phụ trách dự án đó (QLDA1/2/3) |
| Nhà thầu (BCNCKT, khảo sát, thẩm tra, thi công...) | ⚙️ Tự động (Cập nhật sau) | Tab Thông tin chung → Phân mục Nhân sự & Thành viên | Được cập nhật tự động từ phân hệ Đấu thầu (gói thầu) khi có kết quả trúng thầu — không nhập khi khởi tạo dự án ban đầu |


### Điều 8b. Thông tin gói thầu dự án (Bidding Package)

1. **Bắt buộc khởi tạo:** Mọi gói thầu thuộc dự án đầu tư phải được tạo đầy đủ trên hệ thống tại Tab Gói thầu của dự án tương ứng.
2. **Quy định trường thông tin:**
   - *Thông tin cơ bản (Số hiệu, Tên gói thầu, Giá gói thầu, Thời gian thực hiện, Nguồn vốn)*: Bắt buộc điền đúng theo Quyết định phê duyệt Kế hoạch lựa chọn nhà thầu (KHLCNT).
   - *Thông tin pháp lý*: Ghi nhận đúng Lĩnh vực, Hình thức lựa chọn nhà thầu, Phương thức lựa chọn, Đấu thầu qua mạng, và Loại hợp đồng theo quy định của Luật Đấu thầu hiện hành.
3. **Quy tắc chuyển đổi trạng thái gói thầu:**
   - Trạng thái gói thầu bao gồm: *Lựa chọn nhà thầu* (mới tạo, đang chuẩn bị/đang đấu thầu), *Đang thực hiện* (đã ký hợp đồng thi công/thực hiện), và *Kết thúc* (hoàn thành thanh quyết toán gói thầu).
   - **Ràng buộc hệ thống:** Khi chuyển trạng thái gói thầu từ "Lựa chọn nhà thầu" sang "Đang thực hiện", bắt buộc phải hoàn thành việc cập nhật **Nhà thầu trúng thầu**, **Giá trúng thầu**, và **Ngày phê duyệt kết quả LCNT**. Hệ thống sẽ cảnh báo ngăn chặn nếu thiếu các thông tin này.

### Điều 8c. Thông tin kế hoạch vốn và giải ngân dự án

1. **Kế hoạch vốn (Mid-term / Annual Capital Plan):**
   - Bắt buộc cập nhật kế hoạch vốn trung hạn và kế hoạch vốn năm ngay khi nhận được Quyết định giao kế hoạch vốn của cấp có thẩm quyền (HĐND Tỉnh, UBND Tỉnh, Thủ tướng Chính phủ...).
   - Hồ sơ nhập liệu phải điền đầy đủ: Năm/Giai đoạn, Số quyết định giao vốn, Ngày quyết định, Nguồn vốn chi tiết, và Số vốn phân bổ.
2. **Kế hoạch giải ngân tháng (Monthly Disbursement Plan):**
   - Trước ngày **31/01** hàng năm hoặc trong vòng **10 ngày** kể từ khi nhận được kế hoạch vốn năm, cán bộ phụ trách dự án trực tiếp lập kế hoạch giải ngân chi tiết cho 12 tháng.
   - **Ràng buộc:** Tổng kế hoạch giải ngân 12 tháng không được phép vượt quá giới hạn vốn năm được phân bổ của dự án.
3. **Bút toán giải ngân thực tế (Disbursements):**
   - Trong vòng **24 giờ** kể từ khi Kho bạc Nhà nước thực hiện chuyển tiền (thanh toán/tạm ứng), bộ phận Kế toán (kế toán viên phụ trách) phải ghi nhận bút toán giải ngân thực tế vào hệ thống.
   - Phải chọn đúng **Loại giải ngân**: *Tạm ứng*, *Thanh toán KLHT* (Khối lượng hoàn thành), hoặc *Thu hồi tạm ứng* làm cơ sở để hệ thống tự động kiểm soát số dư tạm ứng.
   - Phải liên kết đợt giải ngân với đúng kế hoạch vốn năm tương ứng và ghi rõ số chứng từ/quyết định thanh toán.
4. **Kiểm soát cảnh báo tự động:**
   - Cán bộ nghiệp vụ (chuyên viên/kỹ sư) có trách nhiệm thường xuyên rà soát và xử lý các cảnh báo từ hệ thống ở phân hệ Vốn (giải ngân vượt kế hoạch năm, tổng vốn giao vượt tổng mức đầu tư, số dư tạm ứng tồn đọng kéo dài, v.v.). Mọi sai lệch số liệu phải được sửa đổi trong vòng 4 giờ.

### Điều 8d. Thông tin nhật ký thi công và tiến độ xây lắp (Tab Thi công)

1. **Nhập nhật ký hiện trường hàng ngày:**
   - Kỹ sư phụ trách dự án (Ban QLDA) chịu trách nhiệm lập nhật ký hiện trường hàng ngày trên hệ thống (hoạt động thu thập dữ liệu hiện trường từ Tư vấn giám sát bên ngoài để cập nhật).
   - Nội dung nhật ký bắt buộc gồm: Thời tiết/Nhiệt độ, Tổng số nhân công thi công trên công trường, Số lượng máy móc thiết bị đang hoạt động, Mô tả chi tiết nội dung công việc triển khai trong ngày, và đính kèm tối thiểu 2 hình ảnh thực địa.
   - Hạn nhập: Trước **08:00 sáng ngày hôm sau**.
2. **Cập nhật tiến độ thi công:**
   - Định kỳ trước 17:00 thứ Sáu hàng tuần, kỹ sư phụ trách dự án phải rà soát và cập nhật tỷ lệ hoàn thành (%) thực tế của từng hạng mục thi công (San nền, Xây dựng thô, Cơ điện...).

### Điều 8e. Thông tin Giải phóng mặt bằng (Tab GPMB) và Mô hình BIM (Tab BIM)

1. **Giải phóng mặt bằng:**
   - Ngay sau khi có quyết định phê duyệt phương án bồi thường GPMB, cán bộ phụ trách dự án phải khởi tạo quy trình GPMB 16 bước trên hệ thống.
   - Số liệu tổng quan (diện tích thu hồi, số hộ tái định cư, kinh phí bồi thường, lũy kế giải ngân GPMB) phải được cập nhật định kỳ trước ngày 05 hàng tháng.
   - Trạng thái và ngày hoàn thành thực tế của từng bước trong 16 bước quy trình phải được ghi nhận trong vòng 24 giờ kể từ khi hoàn tất thủ tục tương ứng.
2. **Mô hình BIM:**
   - Đối với các dự án thuộc diện bắt buộc áp dụng mô hình thông tin công trình (BIM) theo quy định của Chính phủ, cán bộ phụ trách dự án phải upload file mô hình định dạng `.ifc` lên hệ thống.
   - Thường xuyên cập nhật phiên bản mô hình khi có điều chỉnh thiết kế.

### Điều 8f. Thông tin tài liệu, kiểm tra và quyết toán dự án (Tab Tài liệu, Kiểm tra, Quyết toán)

1. **Tài liệu dự án:**
   - Mọi hồ sơ pháp lý, quyết định phê duyệt, bản vẽ thiết kế, hợp đồng và biên bản nghiệm thu phải được tải lên hệ thống tại tab Tài liệu.
   - Định dạng tên file tải lên bắt buộc phải tuân thủ quy tắc đặt tên tại Phụ lục A.
2. **Thanh tra / Kiểm tra:**
   - Trong vòng 48 giờ sau khi nhận được kết luận thanh tra, kiểm tra của các cơ quan có thẩm quyền hoặc biên bản kiểm tra nội bộ, cán bộ phụ trách dự án phải ghi nhận thông tin cuộc kiểm tra (ngày kiểm tra, cơ quan kiểm tra, kiến nghị kết luận, tình hình khắc phục) vào tab Kiểm tra.
3. **Quyết toán dự án hoàn thành:**
   - Trong vòng 5 ngày sau khi lập báo cáo quyết toán hoặc nhận được Quyết định phê duyệt quyết toán dự án hoàn thành, bộ phận Kế toán (kế toán viên phụ trách) phải cập nhật đầy đủ thông tin: Giá trị đề nghị quyết toán, Giá trị được duyệt quyết toán, Số quyết định phê duyệt quyết toán, Ngày quyết định phê duyệt và theo dõi công nợ còn lại.

### Điều 9. Cập nhật dữ liệu dự án định kỳ

Trước ngày **05** hàng tháng, cán bộ phụ trách dự án cập nhật:

1. Hiện trạng dự án (nếu thay đổi) - Nhập tại **Tab Thông tin chung → Phân mục Hiện trạng & Tiến độ**.
2. Số liệu khối lượng và đợt giải ngân trong kỳ - Nhập tại **Tab Vốn → Đợt giải ngân**. *Tiến độ tài chính sẽ tự tính sau khi tính năng được bổ sung.*
3. Tình hình thực tế và vướng mắc (nếu có) - Nhập tại **Tab Thông tin chung → Phân mục Hiện trạng & Tiến độ**.

> **Không nhập tay** Tiến độ chung, Tổng KHV, Tổng giải ngân — các trường này hệ thống tự tính (Điều 5.3, tài liệu Khảo sát).


## CHƯƠNG III. QUY ĐỊNH NHẬP LIỆU NHIỆM VỤ / CÔNG VIỆC

### Điều 10. Phân loại nhiệm vụ

| Loại công việc | Mô tả |
|---|---|
| Công việc dự án | Thuộc một dự án cụ thể, bắt buộc liên kết dự án |
| Công việc điều hành | Điều hành chung, không thuộc dự án |
| Công việc nội bộ | Nội bộ phòng ban |

### Điều 11. Thông tin bắt buộc khi tạo nhiệm vụ (đều ✍️ Nhập tay)

| STT | Trường | Ghi chú |
|---|---|---|
| 1 | Tiêu đề (*) | Theo quy tắc Điều 13, tối đa 500 ký tự |
| 2 | Loại công việc (*) | Dự án / Điều hành / Nội bộ |
| 3 | Phân loại nghiệp vụ (*) | 1 trong 13 loại (Điều 12) |
| 4 | Người thực hiện (*) | Chọn từ danh sách nhân viên đang hoạt động |
| 5 | Hạn hoàn thành (*) | Không được là ngày quá khứ |
| 6 | Mức độ ưu tiên (*) | Thấp / Trung bình / Cao / Khẩn cấp |
| 7 | Trạng thái (*) | Mặc định: "Chưa thực hiện" khi tạo mới |
| 8 | Dự án liên kết | Bắt buộc nếu là Công việc dự án |
| 9 | Cấp trách nhiệm | Cấp phòng / Cá nhân |
| 10 | Kết quả đầu ra dự kiến (*) | Ghi rõ sản phẩm, tài liệu hoặc kết quả cần đạt được |

### Điều 12. Phân loại nghiệp vụ (13 loại cố định)

Mỗi nhiệm vụ **bắt buộc** gán đúng 1 phân loại. Phân loại ảnh hưởng trực tiếp đến tổng hợp tháng.

| Phân loại | Ví dụ |
|---|---|
| Điều hành | Họp giao ban, chỉ đạo, xử lý văn bản |
| Thẩm định / Phê duyệt | Thẩm tra TK-DT, soát xét hồ sơ |
| Thi công / Giám sát | Kiểm tra hiện trường, giám sát |
| Quyết toán | Lập, thẩm tra quyết toán |
| Thanh toán | Thanh toán khối lượng, tạm ứng |
| GPMB | Kiểm đếm, bồi thường, giải phóng mặt bằng |
| Đấu thầu | Lập HSMT, đánh giá HSDT, ký hợp đồng |
| Điều chỉnh | Điều chỉnh dự án, thiết kế, tiến độ |
| Góp ý / Văn bản | Góp ý hồ sơ, soạn thảo văn bản |
| Báo cáo | Báo cáo định kỳ, chuyên đề |
| Kiểm tra / QLCL | Kiểm tra chất lượng, nghiệm thu khối lượng |
| Bàn giao / Nghiệm thu | Nghiệm thu hoàn thành, bàn giao công trình |
| Khác | Dùng khi không thuộc 12 loại trên |

> Nếu tỷ lệ "Khác" vượt 20%/phòng/tháng, Trưởng phòng rà soát lại việc phân loại.

### Điều 13. Quy tắc đặt tiêu đề nhiệm vụ

1. **Bắt đầu bằng động từ hành động**: Lập / Thẩm tra / Kiểm tra / Tổng hợp / Gửi / Trình...
2. **Nêu đối tượng cụ thể**: Tên dự án, tên hồ sơ, số văn bản.
3. **Không viết tắt** không thông dụng.
4. **Độ dài tối ưu**: 10–200 ký tự.

| | Ví dụ |
|---|---|
| Đúng | Thẩm tra hồ sơ thiết kế BVTC – DA Cầu Đò Quan |
| Đúng | Tổng hợp số liệu giải ngân tháng 6/2026 toàn Ban |
| Sai | Việc dự án (quá chung) |
| Sai | Làm theo yêu cầu sếp (không rõ đối tượng) |

### Điều 14. Quản lý trạng thái nhiệm vụ

#### 14.1. Vòng đời trạng thái

```
[Chưa thực hiện] → [Đang thực hiện] → [Hoàn thành]
                                     ↘ [Chưa hoàn thành]
```

#### 14.2. Quy tắc chuyển trạng thái

| Từ → Sang | Điều kiện bắt buộc |
|---|---|
| Chưa thực hiện → Đang thực hiện | Có ngày bắt đầu thực tế |
| Đang thực hiện → Hoàn thành | Tiến độ = 100%, có kết quả thực hiện |
| Đang thực hiện → Chưa hoàn thành | Hết hạn + ghi rõ lý do + loại lý do (khách quan/chủ quan) |
| Chưa hoàn thành → Hoàn thành | Ghi ngày hoàn thành thực tế |

### Điều 15. Mức độ ưu tiên

| Mức | Tiêu chí |
|---|---|
| Khẩn cấp | Ảnh hưởng trực tiếp tiến độ DA hoặc yêu cầu cấp trên |
| Cao | Hạn ≤ 3 ngày hoặc ảnh hưởng nhiều bên |
| Trung bình | Công việc thường xuyên |
| Thấp | Linh hoạt thời gian |

> Nghiêm cấm gắn "Khẩn cấp" cho việc thường xuyên. Trưởng phòng rà soát, yêu cầu chỉnh lại nếu sai.

### Điều 16. Cập nhật tiến độ hàng tuần

Nhiệm vụ có thời gian > 1 tuần: người thực hiện cập nhật trước **17:00 thứ Sáu**:

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| Tiến độ (%) | Có | Số nguyên 0–100 |
| Cập nhật tình trạng | Có | Tóm tắt công việc đã làm trong tuần |
| Vướng mắc | Không | Khó khăn cần hỗ trợ |

### Điều 17. Nhiệm vụ phát sinh ngoài kế hoạch

1. Nhân viên tạo nhiệm vụ phát sinh, điền đầy đủ thông tin + **căn cứ phát sinh**.
2. Báo cáo Trưởng phòng (qua trao đổi/họp giao ban) để ghi nhận vào kế hoạch tháng.
3. Trưởng phòng rà soát, thống nhất phân công.

> Hệ thống **chưa có** chức năng phê duyệt nhiệm vụ điện tử. Việc thống nhất thực hiện ngoài hệ thống; cán bộ chỉ nhập nhiệm vụ vào hệ thống sau khi đã được phân công.


## CHƯƠNG IV. QUY ĐỊNH KẾ HOẠCH CÔNG VIỆC

### Điều 18. Kế hoạch khung năm

#### 18.1. Thời hạn

| Mốc thời gian | Hành động (nhập liệu) |
|---|---|
| Trước 15/11 | Các phòng nhập dự thảo KH khung năm tiếp theo |
| Trước 30/11 | HCTH tổng hợp KH khung năm toàn Ban |
| Trước 05/12 | Hoàn tất nhập KH khung năm chính thức vào hệ thống |

#### 18.2. Thông tin bắt buộc cho mỗi đầu việc (đều ✍️ Nhập tay)

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| Tên đầu việc (*) | Có | Theo chuẩn Điều 13 |
| Sản phẩm dự kiến (*) | Có | Cụ thể, đo lường được |
| Tần suất (*) | Có | Một lần / Hàng tháng / Hàng quý / Hàng ngày / Khi phát sinh |
| Thời gian thực hiện (*) | Có | Quý I / Tháng 4 / Hàng tháng... |
| Liên kết dự án | Nếu có | Đầu việc thuộc dự án cụ thể |
| Phòng phối hợp | Nếu có | Phòng tham gia |

### Điều 19. Kế hoạch tháng

> **Vị trí nhập liệu trên phần mềm:** Phân hệ **Kế hoạch** → Chọn Tab **Kế hoạch tháng** (đường dẫn `/work-plan?tab=monthly`).

#### 19.1. Thời hạn

| Mốc thời gian | Hành động (nhập liệu) |
|---|---|
| Trước ngày 25 tháng trước | Nhân viên nhập KH tháng tới |
| Trước ngày 28 tháng trước | Trưởng phòng rà soát, hoàn tất KH tháng của phòng |

> Sau khi hoàn tất, hạn chế chỉnh sửa; chỉ bổ sung công việc phát sinh theo Điều 17.

#### 19.2. Thông tin bắt buộc (đều ✍️ Nhập tay)

| Trường | Bắt buộc |
|---|---|
| Tên nhiệm vụ (*) | Có |
| Hạn hoàn thành (*) | Có, trong tháng kế hoạch |
| Sản phẩm dự kiến (*) | Có |
| Nguồn gốc (*) | Từ KH khung / Thủ công / Từ dự án / Bước dự án |

#### 19.3. Cập nhật kết quả tháng (trước ngày 05 tháng sau)

Cập nhật trạng thái và kết quả cho từng nhiệm vụ:

| Trạng thái | Trường bổ sung bắt buộc |
|---|---|
| Hoàn thành | Kết quả thực hiện |
| Chưa hoàn thành | Lý do (khách quan/chủ quan) |
| Hoàn thành một phần | Kết quả đạt + phần chưa xong |
| Chuyển tháng sau | Lý do + tháng chuyển sang |

#### 19.4. Tổng hợp tháng

1. Mỗi phòng hoàn tất cập nhật kết quả tháng trước ngày 05.
2. Bộ phận tổng hợp HCTH tổng hợp số liệu toàn Ban trước ngày 06 để phục vụ giao ban.

> Hệ thống **chưa có** chức năng khóa sổ/phê duyệt báo cáo điện tử. Việc duyệt báo cáo thực hiện theo hồ sơ giấy/TDO ngoài hệ thống.


## CHƯƠNG V. QUY ĐỊNH BƯỚC DỰ ÁN VÀ PHÂN CÔNG TRÁCH NHIỆM

### Điều 20. Kế hoạch bước dự án (đều ✍️ Nhập tay)

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| Tên bước (*) | Có | Theo danh mục bước quy trình |
| Giai đoạn (*) | Có | Chuẩn bị / Thực hiện / Kết thúc |
| Thứ tự (*) | Có | Số nguyên, không trùng trong dự án |
| Sản phẩm (*) | Có | Văn bản/hồ sơ đầu ra |
| Hạn hoàn thành (*) | Có | Ngày/Tháng/Năm |
| Căn cứ pháp lý | Khuyến nghị | Văn bản pháp luật áp dụng |

### Điều 21. Ma trận phân công trách nhiệm theo bước

Mỗi bước dự án được gán 4 nhóm trách nhiệm:

| Vai trò | Số lượng | Ý nghĩa |
|---|---|---|
| Người thực hiện | ≥ 1 | Trực tiếp thực hiện bước |
| Người chịu trách nhiệm chính | Đúng 1 | Theo dõi, rà soát kết quả bước |
| Người phối hợp / cho ý kiến | ≥ 0 | Tham gia góp ý |
| Người nhận thông tin | ≥ 0 | Được thông báo kết quả |

**Quy tắc:**
1. Mỗi bước phải có **đúng 1** người chịu trách nhiệm chính và **ít nhất 1** người thực hiện.
2. Người chịu trách nhiệm chính có thể đồng thời là người thực hiện.
3. Việc phân công này chỉ ghi nhận trách nhiệm trên hệ thống, **không phải là cơ chế phê duyệt điện tử**.

### Điều 21b. Quy định tạo kế hoạch thực hiện dự án (Master Plan)

1. **Bắt buộc áp dụng:** Mọi dự án khi khởi tạo đều phải thiết lập Kế hoạch thực hiện dự án (Master Plan) tại Tab Kế hoạch để làm cơ sở theo dõi tiến độ và giao nhiệm vụ tự động.
2. **Quy trình chuẩn hóa:** Cán bộ lập kế hoạch phải chọn đúng Quy trình mẫu (1 bước, 2 bước hoặc 3 bước) tương thích với quy mô thiết kế và số bước lập dự án đã phê duyệt.
3. **Tính liên kết và xâu chuỗi (Cascade):** Phải duy trì mối quan hệ phụ thuộc giữa các công việc. Khi điều chỉnh tiến độ của một bước, phải sử dụng tính năng tự động xâu chuỗi (Cascade) để cập nhật đồng bộ các bước phía sau.
4. **Phân vai trách nhiệm RACI:** Ma trận phân công trách nhiệm RACI phải được cấu hình đầy đủ cho tất cả các bước công việc theo quy định phối hợp giữa chủ đầu tư, ban quản lý dự án, các phòng ban chuyên môn và các nhà thầu/đơn vị tư vấn.
5. **Kiểm soát thay đổi (Ghi đè):** Hạn chế ghi đè hoặc thay đổi kế hoạch thực hiện dự án sau khi đã lưu chính thức. Việc ghi đè kế hoạch chỉ được thực hiện khi có quyết định điều chỉnh tiến độ hoặc điều chỉnh dự án được Ban Giám đốc phê duyệt bằng văn bản.


## CHƯƠNG VI. PHÂN QUYỀN NHẬP LIỆU

### Điều 22. Nhóm quyền trên hệ thống

| Nhóm quyền | Cấp chức danh tương ứng | Phạm vi dữ liệu |
|---|---|---|
| Quản trị hệ thống | Cán bộ quản trị | Toàn bộ |
| Giám đốc | Giám đốc Ban | Toàn bộ (Chỉ xem/theo dõi/rà soát, không nhập liệu, duyệt ngoài hệ thống) |
| Phó Giám đốc | Phó Giám đốc Ban | Toàn bộ (Chỉ xem/theo dõi/rà soát, không nhập liệu, duyệt ngoài hệ thống) |
| Kế toán trưởng | Kế toán trưởng (thuộc P. HCTH) | Toàn bộ (Chỉ xem/theo dõi/rà soát, không nhập liệu) |
| Trưởng phòng | Trưởng phòng / Chánh Văn phòng | Phòng toàn bộ (Chỉ xem/theo dõi/rà soát, không nhập liệu, duyệt ngoài hệ thống) |
| Phó phòng | Phó phòng / Phó Văn phòng | Phòng toàn bộ (Chỉ xem/theo dõi/rà soát, không nhập liệu) |
| Chuyên viên | CV chính / KS chính / CV / KS / KTV | Theo phạm vi phòng (Quyền nhập liệu, tạo, sửa theo vai trò) |
| Nhân viên | Nhân viên hành chính | Theo phạm vi phòng (Chủ yếu xem) |

### Điều 23. Ma trận phân quyền nhập liệu

Hệ thống hiện chỉ có 4 quyền thao tác dữ liệu: **Xem / Tạo / Sửa / Xóa**. (Chưa có quyền "Phê duyệt".)

| Chức năng | Quản trị | GĐ / PGĐ | Kế toán trưởng | Trưởng phòng | Phó phòng | Chuyên viên | Nhân viên |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dự án** | | | | | | | |
| Tạo dự án | Tạo,Sửa,Xóa | Xem | Xem | Xem | Xem | Tạo,Sửa (Chuyên viên KHDT) | Xem |
| Sửa thông tin dự án | Tạo,Sửa,Xóa | Xem | Xem | Xem | Xem | Tạo,Sửa (Kỹ sư phụ trách) | Xem |
| Xóa dự án | Xóa | Xem | — | — | — | — | — |
| **Nhiệm vụ** | | | | | | | |
| Tạo nhiệm vụ | Tạo | Xem | Xem | Xem | Xem | Tạo | Xem |
| Sửa nhiệm vụ | Sửa | Xem | Xem | Xem | Xem | Sửa (của mình) | Xem |
| Xóa nhiệm vụ | Xóa | — | — | — | — | — | — |
| **Kế hoạch** | | | | | | | |
| Nhập / Sửa KH tháng | Tạo,Sửa | Xem | Xem | Xem | Xem | Tạo,Sửa | Xem |
| Cập nhật kết quả tháng | Sửa | Xem | Xem | Xem | Xem | Sửa (của mình) | Xem |
| **Quy trình / Vốn** | | | | | | | |
| Bước dự án, phân công trách nhiệm | Tạo,Sửa,Xóa | Xem | Xem | Xem | Xem | Tạo,Sửa (Kỹ sư phụ trách) | Xem |
| Nhập số liệu thanh toán, giải ngân | Tạo,Sửa,Xóa | Xem | Xem | Xem | Xem | Tạo,Sửa (Kế toán viên) | Xem |
| Nhập kế hoạch vốn | Tạo,Sửa,Xóa | Xem | Xem | Xem | Xem | Tạo,Sửa (Chuyên viên KHDT) | Xem |

> **Chú thích:** Ô trống/— nghĩa là chỉ được Xem hoặc không có quyền. Lãnh đạo cấp Ban và Trưởng/Phó phòng thực hiện rà soát và duyệt ngoài hệ thống, trên hệ thống chỉ có quyền Xem và giám sát tiến độ để đảm bảo tính phân cấp, không trực tiếp thao tác ghi dữ liệu thô.


## CHƯƠNG VII. CHẤT LƯỢNG DỮ LIỆU VÀ XỬ LÝ SAI SÓT

### Điều 24. Chỉ số chất lượng dữ liệu

| Chỉ số | Ngưỡng | Cách đo |
|---|---|---|
| Nhiệm vụ đủ thông tin bắt buộc | ≥ 95% | Hệ thống tự thống kê |
| Cập nhật tiến độ tuần đúng hạn | ≥ 85% | Thứ Sáu hàng tuần |
| Cập nhật kết quả tháng đúng hạn | ≥ 95% | Trước ngày 05 |
| Dự án cập nhật số liệu hàng tháng | 100% | Trước ngày 05 |
| Tỷ lệ phân loại "Khác" | ≤ 5% | Hệ thống tự thống kê |

### Điều 25. Xử lý sai sót

| Loại sai sót | Mức độ | Xử lý |
|---|---|---|
| Thiếu trường bắt buộc | Nhẹ | Cảnh báo, nhập lại trong 24h |
| Sai phân loại nghiệp vụ | Nhẹ | Chuyên viên rà soát và sửa lại |
| Sai số liệu tài chính | Nghiêm trọng | Báo cáo Quản trị, sửa trong 4h |
| Nhập không đúng quyền | Nghiêm trọng | Quản trị khóa bản ghi, xác minh |
| Xóa dữ liệu trái phép | Rất nghiêm trọng | Phục hồi từ nhật ký, xử lý kỷ luật |

### Điều 26. Hiệu lực

1. Quy chế có hiệu lực từ **02/06/2026**.
2. Phòng HCTH phối hợp đơn vị phát triển cập nhật khi quy trình hoặc hệ thống thay đổi (đặc biệt khi bổ sung chức năng phê duyệt điện tử).
3. Mọi vướng mắc phản ánh về Phòng HCTH.


# PHẦN B — HƯỚNG DẪN NHẬP LIỆU CHI TIẾT THEO PHÒNG BAN

> Toàn bộ nhiệm vụ dưới đây là **nhập liệu, cập nhật, tổng hợp, rà soát** — không bao gồm phê duyệt điện tử. Ban Giám đốc và Lãnh đạo các phòng ban không thực hiện nhập liệu trực tiếp trên phần mềm, chỉ Chuyên viên (Kỹ sư, Kế toán viên, Chuyên viên phòng ban) trực tiếp thao tác.


## I. BAN GIÁM ĐỐC (BGĐ)

### Nhiệm vụ trên hệ thống

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Giám đốc Ban** | Theo dõi tổng thể tiến độ, số liệu dự án toàn Ban (Không nhập liệu) | Tuần/Tháng |
| **Các Phó Giám đốc Ban** | Theo dõi tiến độ dự án thuộc lĩnh vực phụ trách (Không nhập liệu) | Tuần/Tháng |
| **Cán bộ quản trị hệ thống** | Quản lý tài khoản, phân quyền, danh mục | Khi phát sinh |
| | Xử lý sự cố dữ liệu, phục hồi từ nhật ký | Trong 4h |
| | Kiểm tra chất lượng dữ liệu toàn hệ thống | Tháng (ngày 10) |

### Hướng dẫn thao tác

**Theo dõi báo cáo tháng:**
1. Vào **Kế hoạch** → **Tổng hợp tháng** → chọn tháng/năm.
2. Xem số liệu tổng hợp các phòng ban để thực hiện chỉ đạo điều hành.


## II. PHÒNG HÀNH CHÍNH – TỔNG HỢP (HCTH)

> Theo Điều 5 Quy chế làm việc, Phòng HCTH thực hiện các mảng: (a) Hành chính – Quản trị, (b) Tổ chức bộ máy, (c) **Quản lý tài chính – Kế toán**, (d) **Hợp đồng & Thanh toán**, (e) Văn phòng Đảng ủy.

### Nhiệm vụ trên hệ thống

#### A. Mảng Hành chính – Tổng hợp

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Chánh Văn phòng / Phó Văn phòng** | Rà soát KH tháng phòng HCTH trên hệ thống, phê duyệt ngoài hệ thống (Không trực tiếp nhập liệu) | Tháng (ngày 28 tháng trước) |
| | Rà soát số liệu tổng hợp tháng toàn Ban | Tháng (ngày 06) |
| | Kiểm tra chất lượng dữ liệu phòng HCTH | Tháng (ngày 10) |
| **Nhân viên (Văn thư, Hành chính) / Chuyên viên** | Nhập KH tháng cá nhân | Tháng (ngày 25 tháng trước) |
| | Cập nhật tiến độ nhiệm vụ hàng tuần | Tuần (17:00 Thứ 6) |
| | Cập nhật kết quả công việc tháng | Tháng (ngày 03) |
| | Hỗ trợ tổng hợp dữ liệu tháng toàn Ban theo chỉ đạo của CVP | Tháng (ngày 06) |
| | Tạo các nhiệm vụ điều hành theo chỉ đạo của Ban Giám đốc và Chánh Văn phòng | Khi phát sinh |

#### B. Mảng Tài chính – Kế toán, Hợp đồng & Thanh toán

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Kế toán trưởng / Phó phòng phụ trách Kế toán** | Kiểm soát nội bộ số liệu tài chính, hợp đồng trên hệ thống (Không nhập liệu) | Tháng (ngày 10) |
| | Rà soát báo cáo tài chính, kế hoạch giải ngân, hợp đồng | Tháng/Quý |
| **Kế toán viên (Theo dõi dự án)** | Nhập đợt giải ngân, hồ sơ thanh toán, thông tin hợp đồng | Khi phát sinh |
| | Cập nhật thông tin "Kế toán theo dõi" trên dự án được phân công | Khi phát sinh |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |
| **Kế toán viên (Theo dõi tạm ứng)** | Nhập đợt giải ngân, tạm ứng, thu hồi tạm ứng, thông tin hợp đồng | Khi phát sinh |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |

### Hướng dẫn thao tác đặc thù

**Tổng hợp số liệu tháng toàn Ban (Chuyên viên HCTH thực hiện, Chánh Văn phòng duyệt):**
1. Vào **Kế hoạch** → **Tổng hợp tháng** → chọn tháng/năm.
2. Kiểm tra lần lượt các phòng ban đã cập nhật kết quả.
3. Xuất bảng tổng hợp (Excel) trình Chánh Văn phòng và Ban Giám đốc Ban.

**Nhập đợt giải ngân (Kế toán viên):**
1. Vào **Dự án** → chọn DA → tab **Vốn** → **Thêm đợt giải ngân**.
2. Nhập số tiền, ngày, nguồn vốn.
3. ⚙️ Hệ thống tự cộng **Tổng giải ngân** — không nhập số tổng.

**Cập nhật "Kế toán theo dõi" trên dự án:**
1. Vào **Dự án** → chọn DA → tab **Nhà thầu / Nhân sự**.
2. Mục "Kế toán theo dõi": chọn Kế toán viên được phân công phụ trách dự án. Lưu.


## III. PHÒNG KẾ HOẠCH – ĐẤU THẦU (KHDT)

### Nhiệm vụ trên hệ thống

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Trưởng phòng / Phó phòng KHDT** | Rà soát KH tháng phòng KHDT trên hệ thống, phê duyệt ngoài hệ thống (Không trực tiếp nhập liệu) | Tháng (ngày 28 tháng trước) |
| | Kiểm tra chất lượng nhập liệu phòng | Tháng (ngày 10) |
| **Chuyên viên (Kế hoạch vốn)** | Tạo dự án mới (thông tin cơ bản) khi có quyết định chủ trương đầu tư | Khi phát sinh |
| | Nhập kế hoạch vốn theo năm, nhập quyết định giao kế hoạch vốn (KHV) | Năm/Quý/Khi phát sinh |
| | Tổng hợp số liệu giải ngân từ các phòng QLDA | Tháng (ngày 05) |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |
| **Chuyên viên (Đấu thầu)** | Nhập kế hoạch lựa chọn nhà thầu, thông tin gói thầu khi bắt đầu đấu thầu | Khi phát sinh |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |

### Hướng dẫn thao tác đặc thù

**Nhập nhiệm vụ đấu thầu (Chuyên viên đấu thầu):**
1. Vào **Nhiệm vụ** → **Tạo mới**.
2. Loại: Công việc dự án | Phân loại: Đấu thầu | Liên kết dự án.
3. Tiêu đề ví dụ: Lập HSMT gói thầu XL-01 – DA Cầu Đò Quan.
4. Sản phẩm: ghi rõ hồ sơ đầu ra (HSMT, báo cáo đánh giá...).


## IV. PHÒNG KỸ THUẬT – THẨM ĐỊNH (KTTD)

### Nhiệm vụ trên hệ thống

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Trưởng phòng / Phó phòng KTTD** | Rà soát KH tháng phòng KTTD trên hệ thống, phê duyệt ngoài hệ thống (Không trực tiếp nhập liệu) | Tháng (ngày 28 tháng trước) |
| | Kiểm tra chất lượng nhập liệu phòng | Tháng (ngày 10) |
| **Kỹ sư chính (Thẩm định)** | Nhập kết quả thẩm tra thiết kế - dự toán (TK-DT), TK bản vẽ thi công | Khi phát sinh (24h) |
| | Cập nhật thông tin phê duyệt thiết kế trên dự án | Khi phát sinh (24h) |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |
| **Kỹ sư (Quản lý chất lượng)** | Nhập thông tin quy mô công trình (Điều 7) | Khi phát sinh |
| | Cập nhật kết quả nghiệm thu quản lý chất lượng (QLCL) | Khi phát sinh (24h) |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |

### Hướng dẫn thao tác đặc thù

**Nhập nhiệm vụ thẩm định (Kỹ sư thẩm định):**
1. Vào **Nhiệm vụ** → **Tạo mới**.
2. Loại: Công việc dự án | Phân loại: Thẩm định / Phê duyệt | Liên kết dự án.
3. Tiêu đề: Thẩm tra hồ sơ TK BVTC – gói thầu [X] – DA [Y].
4. Căn cứ pháp lý: ghi NĐ/TT liên quan.

**Cập nhật thông tin thiết kế trên dự án (Kỹ sư thẩm định):**
1. Vào **Dự án** → chọn DA → tab **Pháp lý**.
2. Nhập: Số QĐ phê duyệt TK-DT, Ngày QĐ, Cơ quan thẩm định, Tổng dự toán, nhà thầu thiết kế/thẩm tra.


## V. BAN QUẢN LÝ DỰ ÁN 1 (QLDA1)

### Nhiệm vụ trên hệ thống

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Giám đốc / Phó Giám đốc Ban QLDA 1** | Rà soát KH tháng của phòng và kế hoạch thực hiện dự án (Master Plan / WBS / RACI) trên hệ thống (Không trực tiếp nhập liệu, phê duyệt ngoài hệ thống) | Tháng / Khi phát sinh |
| | Kiểm tra chất lượng nhập liệu của Ban | Tháng (ngày 10) |
| **Kỹ sư phụ trách dự án (Cán bộ kỹ thuật phụ trách chính)** | Cập nhật thông tin dự án kể từ sau khi được tạo mới cho đến khi kết thúc dự án | Khi phát sinh |
| | Lập kế hoạch thực hiện dự án (Master Plan) và thiết lập bước dự án | Khi có DA mới (5 ngày) |
| | Nhập thông tin nhà thầu thi công, thông tin gói thầu | Khi phát sinh |
| | Nhập kế hoạch giải ngân chi tiết 12 tháng (tab Vốn) | Trước 31/01 hàng năm |
| | Nhập nhật ký hiện trường hàng ngày, cập nhật tiến độ hạng mục | Hàng ngày / Tuần |
| | Khởi tạo và cập nhật quy trình GPMB 16 bước, số liệu GPMB tổng hợp | Khi phát sinh / Tháng |
| | Tải lên mô hình BIM, tải tài liệu dự án, ghi nhận kiểm tra, quyết toán dự án | Khi phát sinh / Quyết toán |
| | Nhập KH tháng cá nhân, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |
| **Chuyên viên QLDA** | Nhập hồ sơ pháp lý dự án (QĐ, BB, CV) khi có phát sinh, phối hợp đính kèm tài liệu | Khi phát sinh (24h) |
| | Nhập KH tháng, cập nhật tiến độ tuần, kết quả tháng | Theo lịch |

### Hướng dẫn thao tác đặc thù

**Cập nhật thông tin dự án (Kỹ sư phụ trách dự án):**
1. Nhận thông tin bàn giao dự án đã được khởi tạo bởi chuyên viên Phòng KHDT.
2. Vào **Dự án** → Chọn dự án → Cập nhật các trường thông tin pháp lý, nguồn vốn và cơ cấu chi tiết, ngày khởi công, ngày hoàn thành dự kiến.
3. Tab **Nhân sự**: Gán Giám đốc QLDA phụ trách (chỉ định); chọn Kế toán viên theo dõi (Phòng HCTH); chọn bản thân làm Cán bộ phụ trách chính.
4. Tab **Thành viên**: Thêm các thành viên tham gia dự án (Chuyên viên phối hợp). Lưu.

**Tạo kế hoạch thực hiện dự án / Lập kế hoạch dự án (Kỹ sư phụ trách dự án trực tiếp lập, Giám đốc Ban QLDA phê duyệt):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Kế hoạch**.
2. Bấm **Tạo kế hoạch** để mở bảng cấu hình:
   - **Chọn Quy trình mẫu:** Chọn quy trình tương ứng (ví dụ: Quy trình đầu tư công 1 bước, 2 bước hoặc 3 bước tùy thuộc vào quy mô thiết kế của dự án).
   - **Chọn Chế độ lập lịch:** *Tự động (Auto)* hoặc *Thủ công (Manual)*.
   - Bấm **Khởi tạo bản thảo** để sinh danh sách công việc WBS.
3. **Điều chỉnh thời gian và thiết lập xâu chuỗi (Cascade):**
   - Chỉnh sửa trực tiếp số ngày thực hiện, ngày bắt đầu hoặc hạn hoàn thành của từng bước trên bản nháp.
   - Bật tính năng **Cascade (Tự động xâu chuỗi)** để khi thay đổi ngày của một bước, hệ thống tự động cập nhật các bước phụ thuộc phía sau.
4. **Cấu hình ma trận trách nhiệm RACI:**
   - Tại mỗi bước công việc, cấu hình phân công vai trò (R, A, C, I) cho các bên liên quan từ danh sách thành viên.
5. **Lưu kế hoạch và trình duyệt:**
   - Bấm **Lưu kế hoạch** (hoặc xác nhận ghi đè). Báo cáo Giám đốc Ban QLDA phụ trách để kiểm tra, rà soát số liệu trên hệ thống và phê duyệt bản kế hoạch giấy ngoài hệ thống.

**Quản lý và nhập dữ liệu Gói thầu (Tab Gói thầu):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Gói thầu**.
2. **Thêm mới gói thầu:** Bấm nút **Thêm gói thầu** để mở bảng điều hướng 4 tab:
   - **Tab Thông tin cơ bản:** Nhập Số hiệu gói thầu (VD: XL-01), Tên gói thầu, Giá gói thầu, Thời gian thực hiện, Nguồn vốn.
   - **Tab Phân loại pháp lý:** Chọn Lĩnh vực (Xây lắp/Tư vấn/Phi tư vấn/Hàng hóa/Hỗn hợp), Hình thức lựa chọn nhà thầu, Phương thức lựa chọn, Đấu thầu qua mạng, Loại hợp đồng, Phạm vi đấu thầu.
   - **Tab Mốc thời gian:** Nhập Mã TBMT, Ngày đăng tải, Thời điểm đóng/mở thầu (nếu đấu thầu qua mạng).
   - **Tab Kết quả LCNT:** Chọn Nhà thầu trúng thầu, Giá trúng thầu, Ngày phê duyệt KQLCNT.
   - Bấm **Tạo gói thầu** để lưu.
3. **Chỉnh sửa / Cập nhật kết quả LCNT:**
   - Khi có kết quả trúng thầu, cán bộ phụ trách vào lại tab **Gói thầu** → Chọn gói thầu cần cập nhật → Chọn **Chỉnh sửa**.
   - Chuyển sang **Tab Kết quả LCNT** để chọn Nhà thầu trúng thầu, nhập Giá trúng thầu và Ngày phê duyệt kết quả.
   - Chuyển Trạng thái gói thầu sang **Đang thực hiện** để hệ thống ghi nhận.

**Quản lý Kế hoạch vốn và Giải ngân (Tab Vốn - Kỹ sư phụ trách dự án phối hợp Kế toán viên):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Vốn**.
2. **Nhập Kế hoạch giải ngân theo tháng (Phân mục Kế hoạch giải ngân):**
   - Chọn năm kế hoạch, bấm **Lập kế hoạch giải ngân** để mở bảng 12 tháng.
   - Kỹ sư phụ trách dự án nhập số tiền dự kiến giải ngân cho từng tháng (từ tháng 1 đến tháng 12) dựa trên tiến độ các hạng mục thực tế.
   - Bấm **Lưu**. **Lưu ý:** Tổng kế hoạch giải ngân 12 tháng không được vượt quá giới hạn vốn năm đã được phân bổ.
3. **Ghi nhận Giải ngân thực tế (Phân mục Lịch sử giải ngân - Kế toán viên thực hiện):**
   - Bấm **Thêm đợt giải ngân** (hoặc import hàng loạt từ Excel).
   - Chọn đúng *Tạm ứng*, *Thanh toán KLHT*, hoặc *Thu hồi tạm ứng*.
   - Nhập Số tiền, Ngày giải ngân, Số chứng từ/quyết định thanh toán, Nhà thầu thụ hưởng.
   - Bấm **Lưu** để hệ thống tính toán lũy kế và cập nhật.

**Quản lý và nhập dữ liệu Nhật ký thi công (Tab Thi công - Kỹ sư phụ trách dự án):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Thi công**.
2. **Lập nhật ký hàng ngày (Phân mục Nhật ký thi công):**
   - Bấm **Lập nhật ký mới** (hoặc chọn ngày trên lịch và bấm **Lập nhật ký ngay**).
   - Chọn tính năng **Sao chép dữ liệu ngày hôm trước** để điền nhanh danh sách nhân công, máy móc của ngày gần nhất, sau đó điều chỉnh số lượng thực tế.
   - Nhập thời tiết, nhiệt độ.
   - Mục **Nhân lực** và **Thiết bị**: Thêm/sửa số lượng lao động của từng nhà thầu và các loại máy thi công tại công trường.
   - Mục **Nội dung chi tiết**: Ghi ngắn gọn các công việc đã thực hiện.
   - Mục **Ảnh công trường**: Tải lên hình ảnh thi công thực tế tại hiện trường.
   - Bấm **Lưu nhật ký**. Cán bộ có thể xuất nhật ký ra tệp Word bằng cách bấm **Xuất Nhật ký (Word)**.
3. **Cập nhật tiến độ hạng mục (Phân mục Tiến độ nhà thầu):**
   - Nhập tỷ lệ (%) hoàn thành của các hạng mục thi công cốt lõi.

**Quản lý Giải phóng mặt bằng (Tab GPMB - Kỹ sư phụ trách dự án):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **GPMB**.
2. **Khởi tạo quy trình:** Nếu dự án chưa có dữ liệu GPMB, bấm **Khởi tạo Quy trình GPMB** để hệ thống tự động sinh 16 bước thủ tục tiêu chuẩn.
3. **Cập nhật số liệu tổng hợp:** Bấm **Cập nhật số liệu**, điền: Tổng diện tích thu hồi đất (ha), Diện tích đã bàn giao (ha), Tổng số hộ ảnh hưởng, Số hộ đã tái định cư, Tổng kinh phí bồi thường và số tiền bồi thường đã giải ngân thực tế. Bấm **Lưu số liệu**.
4. **Cập nhật 16 bước thủ tục:** Tại dòng bước thủ tục tương ứng, bấm biểu tượng chiếc bút **Cập nhật**, chọn trạng thái, điền Ngày hoàn thành thực tế và Ghi chú chi tiết khó khăn/vướng mắc. Bấm **Lưu**.

**Quản lý Mô hình BIM (Tab BIM - Kỹ sư phụ trách dự án):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **BIM**.
2. Bấm **Tải lên mô hình BIM**, chọn tệp IFC từ máy tính, điền thông tin phiên bản và mô tả.

**Quản lý Tài liệu dự án (Tab Tài liệu - Kỹ sư phụ trách dự án hoặc Chuyên viên):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Tài liệu**.
2. Bấm **Tải lên tài liệu**, chọn tệp tin đính kèm, điền thông tin tóm tắt và đặt tên tệp đúng quy ước tại Phụ lục A.

**Ghi nhận Thanh tra / Kiểm tra (Tab Kiểm tra - Kỹ sư phụ trách dự án):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Kiểm tra**.
2. Bấm **Thêm đợt kiểm tra**, điền: Ngày kiểm tra, Cơ quan/Đoàn kiểm tra, Nội dung kiểm tra, Kết luận/Kiến nghị chính, Trạng thái khắc phục sai lỗi, và đính kèm biên bản/kết luận (dạng PDF). Bấm **Lưu**.

**Ghi nhận Quyết toán dự án (Tab Quyết toán - Kỹ sư phụ trách dự án phối hợp Kế toán viên):**
1. Vào phân hệ **Dự án** → Chọn dự án cụ thể → Chuyển sang tab **Quyết toán**.
2. Kỹ sư phối hợp với Kế toán viên cập nhật hồ sơ quyết toán: điền Giá trị đề nghị quyết toán (VNĐ), Giá trị được phê duyệt quyết toán (VNĐ), Số quyết định phê duyệt quyết toán, Ngày quyết định phê duyệt.
3. Hệ thống tự động tính chênh lệch quyết toán và số dư công nợ còn phải thu hồi/thanh toán.


## VI. BAN QUẢN LÝ DỰ ÁN 2 (QLDA2)

### Nhiệm vụ trên hệ thống

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Giám đốc / Phó Giám đốc Ban QLDA 2** | Rà soát KH tháng của phòng và kế hoạch thực hiện dự án (Master Plan / WBS / RACI) trên hệ thống (Không trực tiếp nhập liệu, phê duyệt ngoài hệ thống) | Tháng / Khi phát sinh |
| **Kỹ sư Ban QLDA 2 (Kỹ sư phụ trách dự án)** | Cập nhật thông tin dự án, kế hoạch thực hiện (Master Plan), gói thầu, vốn, thi công, GPMB, BIM, tài liệu, kiểm tra, quyết toán | Theo lịch / Khi phát sinh |
| **Chuyên viên Ban QLDA 2** | Nhập hồ sơ pháp lý, đính kèm tài liệu; KH tháng; kết quả tháng | Theo lịch / Khi phát sinh |

> Hướng dẫn thao tác: áp dụng như Ban QLDA1 (mục V), khác phạm vi dự án phân công cho QLDA2.


## VII. BAN QUẢN LÝ DỰ ÁN 3 (QLDA3)

### Nhiệm vụ trên hệ thống

| Vai trò | Nhiệm vụ | Tần suất |
|----------------|----------|----------|
| **Giám đốc / Phó Giám đốc Ban QLDA 3** | Rà soát KH tháng của phòng và kế hoạch thực hiện dự án (Master Plan / WBS / RACI) trên hệ thống (Không trực tiếp nhập liệu, phê duyệt ngoài hệ thống) | Tháng / Khi phát sinh |
| **Kỹ sư Ban QLDA 3 (Kỹ sư phụ trách dự án)** | Cập nhật thông tin dự án, kế hoạch thực hiện (Master Plan), gói thầu, vốn, thi công, GPMB, BIM, tài liệu, kiểm tra, quyết toán | Theo lịch / Khi phát sinh |

> **Lưu ý:** Ban QLDA 3 chỉ phân bổ 3 vai trò, mỗi người kiêm nhiều việc hơn. Giám đốc Ban thực hiện vai trò rà soát, phê duyệt. Kỹ sư phụ trách dự án thực hiện toàn bộ thao tác nhập liệu.


## VIII. PHÒNG PHÁT TRIỂN DỊCH VỤ (PTDV) VÀ BAN QLDA 4, 5 (MỞ RỘNG)

### Phòng Phát triển Dịch vụ (PTDV)
- Chuyên viên phòng PTDV nhập nhiệm vụ tư vấn QLDA, tư vấn giám sát cho chủ đầu tư khác và các gói "tự thực hiện". Lãnh đạo phòng rà soát và duyệt.
- Áp dụng quy tắc nhập nhiệm vụ và KH tháng như các phòng khác.

### Ban QLDA 4 (Công nghệ & Chuyển đổi số) — dự phòng mở rộng
- Áp dụng phân vai trách nhiệm tương tự Ban QLDA 1 (mục V): Giám đốc Ban QLDA (rà soát/phê duyệt), Chuyên viên/Kỹ sư (nhập liệu, cập nhật dự án, lập Master Plan...).

### Ban QLDA 5 (Môi trường & Thủy lợi) — dự phòng mở rộng
- Áp dụng phân vai trách nhiệm tương tự Ban QLDA 1 (mục V): Giám đốc Ban QLDA (rà soát/phê duyệt), Chuyên viên/Kỹ sư (nhập liệu, cập nhật dự án, lập Master Plan...).

> *(Lưu ý: Quy chế làm việc hiện tại chỉ quy định 3 phòng QLDA; các Ban QLDA 4 và 5 là cấu hình dự phòng để mở rộng tổ chức khi cần thiết).*


# PHẦN C — BẢNG TỔNG HỢP PHÂN CÔNG NHẬP LIỆU TOÀN BAN

> Cột "Người rà soát" là người kiểm tra chất lượng dữ liệu và phê duyệt nội dung (không phải phê duyệt điện tử trên phần mềm). Ban Giám đốc và các lãnh đạo phòng/Ban chỉ thực hiện rà soát/phê duyệt số liệu, không trực tiếp nhập liệu.

## Bảng 1. Phân công nhập liệu DỰ ÁN

| Nội dung nhập liệu | Người nhập | Người rà soát / Phê duyệt | Ghi chú |
|---------------------|-----------|---------------|---------|
| Tạo dự án mới (thông tin cơ bản) | Chuyên viên Phòng KHDT phụ trách | Trưởng phòng KHDT | Tạo mới khi có quyết định chủ trương đầu tư |
| Cập nhật thông tin dự án (sau khi khởi tạo) | Kỹ sư phụ trách dự án (Ban QLDA) | Giám đốc Ban QLDA phụ trách | Cập nhật liên tục cho đến khi dự án kết thúc |
| Thông tin pháp lý (QĐ, phê duyệt) | Kỹ sư phụ trách dự án / Chuyên viên | Giám đốc Ban QLDA phụ trách | Quyết định chủ trương, phê duyệt dự án, TK-DT |
| Thông tin tài chính (tổng mức ĐT, cơ cấu chi phí, nguồn vốn) | Kỹ sư phụ trách dự án (Ban QLDA) | Kế toán trưởng | Phối hợp với chuyên viên Phòng KHDT |
| Thông tin nhân sự dự án (Kế toán, GĐ QLDA, Cán bộ phụ trách chính) | Kỹ sư phụ trách dự án (Ban QLDA) | Giám đốc Ban QLDA phụ trách | Chỉ định nhân sự tham gia dự án |
| Kế toán theo dõi | Kế toán viên phụ trách (Phòng HCTH) | Kế toán trưởng | Chọn kế toán viên theo dõi chi tiết |
| Khối lượng, đợt giải ngân hàng tháng | Kỹ sư phụ trách dự án (Ban QLDA) | Giám đốc Ban QLDA phụ trách | Lũy kế khối lượng thực hiện định kỳ |
| Thông tin thiết kế, thẩm định | Kỹ sư Phòng KTTD phụ trách | Trưởng phòng KTTD | Kết quả thẩm tra thiết kế, quy mô xây dựng |
| Thông tin nhà thầu thi công | ⚙️ Tự động cập nhật từ phân hệ Đấu thầu | — | Lấy từ kết quả lựa chọn nhà thầu gói thầu |
| Số liệu thanh toán, giải ngân thực tế | Kế toán viên phụ trách (Phòng HCTH) | Kế toán trưởng / Phó phòng phụ trách | Nhập từ chứng từ chuyển tiền Kho bạc thực tế |
| Kế hoạch vốn, QĐ giao KHV | Chuyên viên Phòng KHDT phụ trách | Trưởng phòng KHDT | Nhập kế hoạch vốn năm, trung hạn |

> ⚙️ **Không phân công nhập:** Nhóm dự án, Tiến độ chung, Tổng KHV, Tổng giải ngân, Tổng cơ cấu chi phí — hệ thống tự tính.

## Bảng 2. Phân công nhập liệu NHIỆM VỤ

| Loại nhiệm vụ | Người nhập | Phân loại chủ yếu |
|---------------|-----------|-------------------|
| CV dự án — QLDA1 | Kỹ sư phụ trách dự án, Chuyên viên Ban QLDA 1 | Thi công, Kiểm tra, GPMB, Bàn giao |
| CV dự án — QLDA2 | Kỹ sư phụ trách dự án, Chuyên viên Ban QLDA 2 | Thi công, Kiểm tra, GPMB, Bàn giao |
| CV dự án — QLDA3 | Kỹ sư phụ trách dự án Ban QLDA 3 | Thi công, Kiểm tra, GPMB, Bàn giao |
| CV thẩm định | Kỹ sư Phòng KTTD phụ trách | Thẩm định, Kiểm tra |
| CV đấu thầu | Chuyên viên Phòng KHDT phụ trách | Đấu thầu |
| CV thanh toán, quyết toán | Kế toán viên phụ trách (BP Kế toán Phòng HCTH) | Thanh toán, Quyết toán |
| CV điều hành | Chuyên viên HCTH (nhập theo chỉ đạo của BGĐ/CVP) | Điều hành |
| CV báo cáo, góp ý | Chuyên viên/Kỹ sư/Kế toán viên phụ trách | Báo cáo, Góp ý |

## Bảng 3. Phân công KẾ HOẠCH VÀ TỔNG HỢP THÁNG

| Hành động | Ai thực hiện | Hạn |
|-----------|-------------|-----|
| Nhập KH tháng cá nhân | Toàn bộ chuyên viên, kỹ sư, kế toán viên | Ngày 25 tháng trước |
| Rà soát, phê duyệt KH tháng phòng | Trưởng các phòng ban (chỉ rà soát trên hệ thống, phê duyệt ngoài hệ thống, không nhập liệu) | Ngày 28 tháng trước |
| Cập nhật tiến độ tuần | Toàn bộ chuyên viên, kỹ sư, kế toán viên có nhiệm vụ > 1 tuần | 17:00 Thứ Sáu |
| Cập nhật kết quả tháng (cá nhân) | Toàn bộ chuyên viên, kỹ sư, kế toán viên | Ngày 03 tháng sau |
| Cập nhật số liệu dự án tháng | Kỹ sư phụ trách dự án (Ban QLDA) | Ngày 05 tháng sau |
| Tổng hợp số liệu tháng toàn Ban | Chuyên viên Văn phòng HCTH (Chánh Văn phòng rà soát, phê duyệt) | Ngày 06 tháng sau |
| Kiểm tra chất lượng nhập liệu phòng | Trưởng các phòng ban (rà soát, đánh giá chất lượng) | Ngày 10 hàng tháng |

## Bảng 4. Phân công BƯỚC DỰ ÁN VÀ TRÁCH NHIỆM

| Hành động | Ai thực hiện (Lập trực tiếp) | Ai rà soát / Phê duyệt | Ghi chú |
|-----------|-------------|---------|---|
| Tạo bước dự án / Lập kế hoạch thực hiện | Kỹ sư phụ trách dự án | Giám đốc Ban QLDA phụ trách (Rà soát trên hệ thống, phê duyệt ngoài hệ thống) | Trong 5 ngày kể từ khi tạo DA |
| Gán Người thực hiện | Kỹ sư phụ trách dự án | Giám đốc Ban QLDA phụ trách (Rà soát trên hệ thống, phê duyệt ngoài hệ thống) | Chọn kỹ sư/chuyên viên thực hiện bước |
| Gán Người chịu trách nhiệm chính | Kỹ sư phụ trách dự án | Giám đốc Ban QLDA phụ trách (Rà soát trên hệ thống, phê duyệt ngoài hệ thống) | Chọn người chịu trách nhiệm chính của bước |
| Gán Người phối hợp | Kỹ sư phụ trách dự án | Giám đốc Ban QLDA phụ trách (Rà soát trên hệ thống, phê duyệt ngoài hệ thống) | Phòng KTTD, Phòng KHDT khi liên quan |
| Gán Người nhận thông tin | Kỹ sư phụ trách dự án | Giám đốc Ban QLDA phụ trách (Rà soát trên hệ thống, phê duyệt ngoài hệ thống) | Ban Giám đốc Ban, bộ phận Kế toán |
| Đưa bước vào KH tháng | Kỹ sư phụ trách dự án | Giám đốc Ban QLDA phụ trách (Rà soát trên hệ thống, phê duyệt ngoài hệ thống) | Nhấn "Đưa vào KH tháng" |


# PHẦN D — PHỤ LỤC


### Phụ lục A. Quy tắc đặt tên file đính kèm

| Loại tài liệu | Quy tắc | Ví dụ |
|---|---|---|
| Quyết định | QD_[SốQĐ]_[NgàyKý]_[TómTắt] | QD_123-QD-UBND_20260601_PheduyetDA.pdf |
| Hợp đồng | HD_[LoạiHĐ]_[SốHĐ]_[NămKý] | HD_XDCT_45-2026_ThiCongXL01.pdf |
| Biên bản | BB_[LoạiBB]_[Ngày]_[TómTắt] | BB_NghiemThu_20260530_KhoiLuong.pdf |
| Báo cáo | BC_[Loại]_[Tháng-Năm]_[Phòng] | BC_GiaiNgan_T06-2026_QLDA1.xlsx |
| Bản vẽ | BV_[MãDA]_[HạngMục]_[PhiênBản] | BV_DA001_TangHam_V3.pdf |

### Phụ lục B. Lịch nhập liệu định kỳ tổng hợp

| Thời điểm | Hành động | Phụ trách |
|-----------|-----------|-----------|
| Hàng ngày | Nhập nhiệm vụ phát sinh (trong 24h) | Chuyên viên, kỹ sư, kế toán viên |
| Thứ Sáu hàng tuần (17:00) | Cập nhật tiến độ nhiệm vụ tuần | Cán bộ có nhiệm vụ > 1 tuần |
| Ngày 25 hàng tháng | Nhập KH tháng tiếp theo (cá nhân) | Chuyên viên, kỹ sư, kế toán viên |
| Ngày 28 hàng tháng | Rà soát, phê duyệt KH tháng của phòng | Trưởng các phòng ban |
| Ngày 03 tháng sau | Cập nhật kết quả công việc tháng (cá nhân) | Chuyên viên, kỹ sư, kế toán viên |
| Ngày 05 tháng sau | Cập nhật số liệu dự án tháng | Kỹ sư phụ trách dự án (Ban QLDA) |
| Ngày 06 tháng sau | Tổng hợp số liệu tháng toàn Ban | Chuyên viên Văn phòng HCTH (CVP rà soát và duyệt) |
| Ngày 10 hàng tháng | Kiểm tra chất lượng nhập liệu phòng | Trưởng các phòng ban |
| Trước 15/11 hàng năm | Nhập KH khung năm tiếp theo (phòng) | Các chuyên viên phòng phối hợp lập |
| Trước 30/11 hàng năm | Tổng hợp KH khung năm toàn Ban | Chuyên viên Văn phòng HCTH (CVP rà soát) |
| Trước 05/12 hàng năm | Hoàn tất nhập KH khung năm vào hệ thống | Chuyên viên HCTH + Cán bộ quản trị hệ thống |


*Quy chế nhập liệu phiên bản 3.0 — Ban hành ngày 02/06/2026.*
*Soạn thảo: Phòng Hành chính – Tổng hợp.*
*Tài liệu liên quan: "Khảo sát & Hướng dẫn nhập liệu module Quản lý Dự án" (chi tiết trạng thái từng trường và kế hoạch bổ sung).*
*Khi hệ thống bổ sung chức năng phê duyệt điện tử, quy chế sẽ được cập nhật tương ứng.*

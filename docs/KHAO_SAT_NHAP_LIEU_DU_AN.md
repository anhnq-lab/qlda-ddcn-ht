# KHẢO SÁT & HƯỚNG DẪN NHẬP LIỆU MODULE QUẢN LÝ DỰ ÁN
## Phân tích hiện trạng — Hướng dẫn nhập liệu — Kế hoạch bổ sung

> **Phiên bản:** 1.0 | **Ngày khảo sát:** 02/06/2026
> **Phạm vi:** Toàn bộ trường thông tin của Dự án (Project) trong hệ thống QLDA-DDCN-HT
> **Căn cứ:** Khảo sát trực tiếp mã nguồn (form, service, migration, trigger)

---

## I. PHƯƠNG PHÁP VÀ KÝ HIỆU

Mỗi trường thông tin của dự án được phân vào **một** trong bốn nhóm sau:

| Ký hiệu | Nhóm | Ý nghĩa | Yêu cầu với người dùng |
|---------|------|---------|------------------------|
| 🟢 **NHẬP** | Cần nhập tay | Trường có ô nhập trên giao diện, người dùng phải điền | Nhập đầy đủ, chính xác |
| 🔵 **TỰ ĐỘNG** | Hệ thống tự tính | Hệ thống tính từ dữ liệu khác (task, vốn, công thức) | **Không nhập** — chỉ xem |
| 🔴 **THIẾU** | Chưa có ô nhập | Trường có trong CSDL nhưng giao diện chưa có chỗ nhập | Cần bổ sung (xem Phần V) |
| 🟡 **TRÙNG** | Trùng lặp | Trường có nhiều ô nhập ở nhiều nơi, hoặc vừa nhập tay vừa tự tính | Cần xử lý (xem Phần VI) |
| ⚪ **KHÔNG CẦN** | Không áp dụng | Trường không cần dùng do đặc thù của Ban | Bỏ qua, không cần nhập/bổ sung |

**Nguyên tắc vàng:**
1. Trường 🔵 **TỰ ĐỘNG** thì **tuyệt đối không nhập tay** — nhập tay sẽ bị ghi đè hoặc gây sai lệch số liệu.
2. Trường 🟡 **TRÙNG** chỉ được nhập ở **một** vị trí quy định (xem hướng dẫn từng trường).
3. Trường 🔴 **THIẾU** tạm thời chưa nhập được, chờ bổ sung theo kế hoạch Phần VII.

---

## II. BẢNG TỔNG HỢP TÌNH TRẠNG TOÀN BỘ TRƯỜNG

### Nhóm 1 — Định danh & Phân loại

| Trường (tiếng Việt) | Tình trạng | Nơi nhập / Cách tính |
|---------------------|-----------|----------------------|
| Tên dự án | 🟢 NHẬP | Tab Thông tin chung |
| Mã dự án | 🟢 NHẬP | Tab Thông tin chung (để trống → tự sinh theo TT24) |
| Chuyên ngành dự án | 🟢 NHẬP | Tab Thông tin chung (chọn) |
| Chi tiết chuyên ngành | 🟢 NHẬP | Tab Thông tin chung |
| **Nhóm dự án (QN/A/B/C)** | 🟡 TRÙNG | Vừa có ô chọn tay, vừa **tự tính** từ Tổng mức ĐT + chuyên ngành |
| Loại hình đầu tư | ⚪ KHÔNG CẦN | Ban **chỉ quản lý dự án đầu tư công** → cố định "Đầu tư công", không cần ô chọn |
| Lĩnh vực đầu tư (Sector, 17 loại) | ⚪ KHÔNG CẦN | Không áp dụng — đã có "Chuyên ngành dự án" đủ để tính nhóm |

### Nhóm 2 — Tài chính & Vốn

| Trường | Tình trạng | Nơi nhập / Cách tính |
|--------|-----------|----------------------|
| Tổng mức đầu tư | 🟢 NHẬP | Tab Đầu tư |
| Nguồn vốn (chọn nhiều) | 🟢 NHẬP | Tab Đầu tư |
| Cơ cấu vốn (NSTW, NSĐP, vay, ODA, khác) | 🟢 NHẬP | Tab Đầu tư — 5 ô |
| Cơ cấu chi phí (GPMB, XL, TB, QLDA, TV, khác, dự phòng) | 🟢 NHẬP | Tab Đầu tư — 7 ô |
| **Tổng cơ cấu chi phí** | 🔵 TỰ ĐỘNG | Cộng tự động 7 hạng mục (chỉ hiển thị) |
| Tổng dự toán (ban đầu) | 🟢 NHẬP | Tab Quy mô công trình |
| Tổng dự toán (sau điều chỉnh) | 🟢 NHẬP | Tab Trạng thái — phần điều chỉnh |
| **Tổng KHV (kế hoạch vốn)** | 🔵 TỰ ĐỘNG | Cộng từ bảng `capital_plans` (trigger) |
| Đợt giải ngân (từng lần: số tiền, ngày, nguồn) | 🟢 NHẬP | Nhập từng đợt tại Tab Vốn |
| **Tổng số tiền giải ngân** | 🔵 TỰ ĐỘNG | Tổng hợp tự động từ các đợt giải ngân (không nhập số tổng) |
| QĐ giao KHV (số, ngày, năm 2026...) | 🔴 THIẾU | Chưa có ô nhập phần kế hoạch vốn theo năm |

### Nhóm 3 — Tiến độ

| Trường | Tình trạng | Nơi nhập / Cách tính |
|--------|-----------|----------------------|
| **Tiến độ chung (%)** | 🔵 TỰ ĐỘNG | Trung bình tiến độ các nhiệm vụ (trigger CSDL) |
| Tiến độ vật lý (%) | 🔴 THIẾU | Định nghĩa có, chưa có ô nhập & chưa có công thức |
| Tiến độ tài chính (%) | 🔴 THIẾU | Định nghĩa có, chưa có ô nhập & chưa có công thức |
| Tiến độ thanh toán (%) | 🔴 THIẾU | Nhập tay nhưng chưa có ô nhập trên UI |
| Tỷ lệ giải ngân (%) | 🔴 THIẾU | Định nghĩa có, chưa có công thức tính |
| **Tỷ lệ khối lượng (volumeRate)** | 🟡 TRÙNG | Đang gán = Tiến độ chung (sao chép thừa) |

### Nhóm 4 — Pháp lý

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| Cấp QĐ chủ trương | 🟢 NHẬP | Tab Pháp lý |
| Số QĐ chủ trương | 🟢 NHẬP | Tab Pháp lý |
| Ngày QĐ chủ trương | 🟢 NHẬP | Tab Pháp lý |
| Cơ quan ban hành chủ trương | 🟢 NHẬP | Tab Pháp lý |
| Số QĐ phê duyệt dự án | 🟢 NHẬP | Tab Pháp lý |
| Ngày phê duyệt dự án | 🟢 NHẬP | Tab Pháp lý |
| Cơ quan phê duyệt dự án | 🟢 NHẬP | Tab Pháp lý |
| Cấp công trình | 🟢 NHẬP | Tab Pháp lý |
| Cấp QĐ trước bàn giao | 🟢 NHẬP | Tab Pháp lý |
| Chủ đầu tư cũ | 🟢 NHẬP | Tab Pháp lý |
| Số QĐ chuyển CĐT | 🟢 NHẬP | Tab Pháp lý |

### Nhóm 5 — Địa điểm & Thời gian

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| Khởi công dự kiến | 🟢 NHẬP | Tab Thông tin chung |
| Hoàn thành dự kiến | 🟢 NHẬP | Tab Thông tin chung |
| Thời gian thực hiện | 🟢 NHẬP | Tab Thông tin chung |
| Địa điểm xây dựng | 🟢 NHẬP | Tab Thông tin chung |
| Tỉnh/Thành phố | 🟢 NHẬP | Tab Thông tin chung (mặc định Hà Tĩnh) |
| Khởi công thực tế | 🟢 NHẬP | Tab Trạng thái — phần điều chỉnh |
| Hoàn thành thực tế | 🟢 NHẬP | Tab Trạng thái — phần điều chỉnh |
| Tọa độ GPS (lat/lng) | 🔴 THIẾU | Chưa có ô nhập |

### Nhóm 6 — Quản lý & Mục tiêu

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| Phòng QLDA phụ trách (1/2/3) | 🟢 NHẬP | Tab Thông tin chung |
| Người quyết định đầu tư | 🟢 NHẬP | Tab Thông tin chung |
| Tên chủ đầu tư | 🟢 NHẬP | Tab Thông tin chung |
| Loại công trình | 🟢 NHẬP | Tab Thông tin chung |
| Mục tiêu đầu tư | 🟢 NHẬP | Tab Thông tin chung |
| Tóm tắt quy mô đầu tư | 🟢 NHẬP | Tab Thông tin chung |

### Nhóm 7 — Quy mô công trình

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| **DT khu đất (m²)** | 🟡 TRÙNG | Có ở **2 tab**: Quy mô + Pháp lý |
| **DT xây dựng (m²)** | 🟡 TRÙNG | Có ở **2 tab**: Quy mô + Pháp lý |
| **DT sàn (m²)** | 🟡 TRÙNG | Có ở **2 tab**: Quy mô + Pháp lý |
| **Chiều cao (m)** | 🟡 TRÙNG | Có ở **2 tab**: Quy mô + Pháp lý |
| **Mật độ xây dựng (%)** | 🟡 TRÙNG | Có ở **2 tab**: Quy mô + Pháp lý |
| **Hệ số sử dụng đất** | 🟡 TRÙNG | Có ở **2 tab**: Quy mô + Pháp lý |
| Số tầng nổi | 🟢 NHẬP | Tab Quy mô công trình |
| Số tầng hầm | 🟢 NHẬP | Tab Quy mô công trình |

### Nhóm 8 — Nhân sự & Nhà thầu

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| Thành viên dự án | 🟢 NHẬP | Tab Thành viên |
| Hình thức lựa chọn nhà thầu | 🟢 NHẬP | Tab Nhà thầu |
| Tiêu chuẩn áp dụng | 🟢 NHẬP | Tab Nhà thầu |
| Nhà thầu lập BCNCKT | 🟢 NHẬP | Tab Nhà thầu |
| Nhà thầu khảo sát | 🟢 NHẬP | Tab Nhà thầu |
| Nhà thầu thẩm tra | 🟢 NHẬP | Tab Nhà thầu |
| Đơn vị thi công (8 trường chi tiết) | 🟢 NHẬP | Tab Nhà thầu |
| Nhân sự QLDA nội bộ (kế toán, GĐ QLDA, cán bộ KT) | 🟢 NHẬP | Tab Nhà thầu |
| Tên nhà thầu chính | 🔴 THIẾU | Chưa có ô nhập riêng |

### Nhóm 9 — Trạng thái & Điều chỉnh

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| Hiện trạng dự án (10 mã) | 🟢 NHẬP | Tab Trạng thái |
| QĐ điều chỉnh (số, ngày, dự toán) | 🟢 NHẬP | Tab Trạng thái |
| Thời gian điều chỉnh (KC/HT) | 🟢 NHẬP | Tab Trạng thái |
| Tình hình thanh tra, kiểm toán | 🟢 NHẬP | Tab Trạng thái |
| Nguyên nhân chậm tiến độ | 🟢 NHẬP | Tab Trạng thái |
| Trách nhiệm / Kết quả xử lý / Kiến nghị | 🟢 NHẬP | Tab Trạng thái |
| Ghi chú | 🟢 NHẬP | Tab Trạng thái |
| **Giai đoạn dự án (Chuẩn bị/Thực hiện/Kết thúc)** | 🔴 THIẾU | Chỉ hiển thị, chưa có ô chọn |
| Dự án khẩn cấp (có/không) | 🔴 THIẾU | Chưa có ô chọn |
| Dự án ODA (có/không) | 🔴 THIẾU | Chưa có ô chọn |

### Nhóm 10 — BIM & CDE

| Trường | Tình trạng | Nơi nhập |
|--------|-----------|----------|
| Yêu cầu BIM (có/không) | 🔴 THIẾU | Chưa có ô chọn |
| Trạng thái BIM | 🔴 THIẾU | Chưa có ô chọn |
| Mã CDE dự án | 🔴 THIẾU | Chưa có ô nhập |
| Ảnh dự án | 🔴 THIẾU | Chưa có ô tải ảnh |

---

## III. THỐNG KÊ TỔNG QUAN

| Nhóm tình trạng | Số lượng | Tỷ lệ |
|-----------------|----------|-------|
| 🟢 NHẬP (đã có ô nhập, dùng tốt) | ~46 trường | ~61% |
| 🔵 TỰ ĐỘNG (hệ thống tự tính) | 5 trường | ~7% |
| 🔴 THIẾU (cần bổ sung ô nhập/công thức) | ~12 trường | ~16% |
| 🟡 TRÙNG (cần xử lý) | ~7 trường | ~9% |
| ⚪ KHÔNG CẦN (không áp dụng) | 2 trường | ~3% |

**Kết luận nhanh:**
- Khối thông tin cơ bản, pháp lý, nhà thầu, điều chỉnh: **đã đầy đủ ô nhập**.
- Khối **tiến độ và vốn theo năm**: còn nhiều khoảng trống, cần bổ sung.
- Khối **quy mô công trình**: bị trùng nhập ở 2 tab, cần gộp.
- Khối **phân loại tự động**: cần làm rõ để người dùng không nhập tay nhầm.

---

## IV. HƯỚNG DẪN NHẬP LIỆU CỤ THỂ THEO TỪNG TAB

> Trình tự khuyến nghị khi tạo/cập nhật một dự án: **Thông tin chung → Đầu tư → Pháp lý → Quy mô → Nhà thầu → Thành viên → Trạng thái**.

### Tab 1 — Thông tin chung

1. **Tên dự án**: nhập đầy đủ theo quyết định phê duyệt, không viết tắt.
2. **Mã dự án**: để trống nếu muốn hệ thống tự sinh; hoặc nhập theo quy tắc cơ quan.
3. **Chuyên ngành dự án**: chọn đúng (Dân dụng & Công nghiệp / Giao thông & Đô thị / Nông nghiệp & NT / Hỗn hợp / Khác).
   - ⚠️ Trường này **ảnh hưởng đến việc tự tính Nhóm dự án** — chọn sai sẽ ra nhóm sai.
4. **Tổng mức đầu tư** (nhập ở Tab Đầu tư): ⚠️ cùng với chuyên ngành, đây là **đầu vào để hệ thống tự tính Nhóm dự án**.
5. **Phòng QLDA phụ trách**: chọn đúng phòng 1/2/3 theo phân công.
6. **Khởi công / Hoàn thành dự kiến**: nhập ngày theo định dạng DD/MM/YYYY.
7. **Mục tiêu, Tóm tắt quy mô**: nhập mô tả ngắn gọn, đủ ý.

> 🔵 **Nhóm dự án (QN/A/B/C)**: **không cần nhập tay.** Hệ thống tự tính sau khi có Tổng mức đầu tư + Chuyên ngành. Chỉ kiểm tra lại kết quả, không tự sửa (xem Phần VI.1).

### Tab 2 — Đầu tư

1. **Tổng mức đầu tư**: nhập số tiền VND đầy đủ, không làm tròn.
2. **Nguồn vốn**: tích chọn các nguồn áp dụng.
3. **Cơ cấu vốn** (5 ô): nhập NSTW, NSĐP, vốn vay, ODA, vốn khác.
4. **Cơ cấu chi phí** (7 ô): nhập GPMB, xây lắp, thiết bị, QLDA, tư vấn, khác, dự phòng.
   - 🔵 Dòng **Tổng cộng** ở cuối bảng **tự cộng** — không nhập.
   - ⚠️ Lưu ý nhất quán: tổng 7 hạng mục **nên bằng** Tổng mức đầu tư. Hệ thống hiện **chưa cảnh báo** nếu lệch (xem Phần VII — bổ sung kiểm tra).

### Tab 3 — Pháp lý

1. Nhập đầy đủ 2 cụm quyết định: **Chủ trương đầu tư** (cấp, số, ngày, cơ quan) và **Phê duyệt dự án** (số, ngày, cơ quan).
2. **Cấp công trình**: chọn từ danh mục.
3. **Phần Quy mô** trong tab này (DT khu đất, DT xây dựng...): 🟡 **KHÔNG nhập ở đây** — nhập tại Tab Quy mô công trình (xem Phần VI.2).
4. Dự án nhận bàn giao: nhập Chủ đầu tư cũ, Số QĐ chuyển CĐT, Cấp QĐ trước bàn giao.

### Tab 4 — Quy mô công trình

1. **Tổng dự toán (ban đầu)**: nhập số tiền VND.
2. **Các thông số quy mô** (DT khu đất, DT xây dựng, DT sàn, chiều cao, mật độ XD, hệ số SDĐ): nhập tại đây.
   - 🟡 **Đây là nơi nhập chính thức** cho các thông số quy mô (không nhập ở Tab Pháp lý).
3. **Số tầng nổi / Số tầng hầm**: nhập số nguyên.

### Tab 5 — Nhà thầu

1. **Hình thức lựa chọn nhà thầu**: chọn từ danh mục.
2. **Tiêu chuẩn áp dụng**: nhập danh mục TCVN/QCVN.
3. **Các nhà thầu** (lập BCNCKT, khảo sát, thẩm tra): nhập tên đơn vị.
4. **Đơn vị thi công**: nhập đầy đủ tên, MST, địa chỉ, nội dung HĐ, số gói thầu, đại diện PL, chỉ huy CT, cán bộ KT.
5. **Nhân sự QLDA nội bộ**: chọn kế toán theo dõi, GĐ QLDA, cán bộ kỹ thuật.

### Tab 6 — Thành viên

1. Tìm kiếm nhân viên theo tên/phòng, thêm vào dự án và gán vai trò.
2. Có thể bổ sung thành viên sau khi đã tạo dự án.

### Tab 7 — Trạng thái

1. **Hiện trạng dự án**: chọn 1 trong 10 mã (Duyệt chủ trương → Kết thúc).
2. **Điều chỉnh dự án** (nếu có): nhập số/ngày QĐ điều chỉnh, **Tổng dự toán sau điều chỉnh**, thời gian KC/HT điều chỉnh và thực tế.
   - Lưu ý: đây là "Tổng dự toán **sau điều chỉnh**", khác với "Tổng dự toán **ban đầu**" ở Tab Quy mô.
3. **Tình hình & vướng mắc**: nhập thanh tra/kiểm toán, nguyên nhân chậm, trách nhiệm, kết quả xử lý, kiến nghị, ghi chú.

> 🔵 **Tiến độ chung, Tổng KHV, Tổng giải ngân**: **không nhập ở đây.** Hệ thống tự tính từ nhiệm vụ và bảng vốn/giải ngân (xem Phần V).

---

## V. CÁC TRƯỜNG TỰ ĐỘNG — KHÔNG ĐƯỢC NHẬP TAY

Bảng dưới đây là các trường hệ thống **tự tính**. Người dùng chỉ xem, **không nhập**.

| Trường | Công thức / Nguồn | Cập nhật khi nào |
|--------|-------------------|------------------|
| **Nhóm dự án (QN/A/B/C)** | Tính từ Tổng mức ĐT + Chuyên ngành theo ngưỡng Luật ĐTC 58/2024 | Ngay khi thay đổi Tổng mức ĐT hoặc Chuyên ngành |
| **Tổng cơ cấu chi phí** | Cộng 7 hạng mục chi phí | Ngay khi nhập từng hạng mục |
| **Tiến độ chung (%)** | Trung bình tiến độ tất cả nhiệm vụ của dự án | Mỗi khi thêm/sửa/xóa nhiệm vụ |
| **Tổng KHV (kế hoạch vốn)** | Cộng số tiền các dòng kế hoạch vốn | Mỗi khi cập nhật bảng kế hoạch vốn |
| **Tổng giải ngân** | Cộng số tiền các đợt giải ngân | Mỗi khi cập nhật đợt giải ngân |

> **Hệ quả thực hành:** Muốn thay đổi **Tiến độ chung** của dự án → phải cập nhật **tiến độ của từng nhiệm vụ**, không sửa trực tiếp ở dự án. Muốn thay đổi **Tổng giải ngân** → nhập **đợt giải ngân**, không sửa số tổng.

---

## VI. CÁC CHỖ TRÙNG LẶP — ĐỀ XUẤT XỬ LÝ

### VI.1. Nhóm dự án: vừa nhập tay vừa tự tính 🟡

**Hiện trạng:** Tab Thông tin chung có ô **chọn Nhóm dự án** (QN/A/B/C), đồng thời hệ thống lại **tự tính** nhóm này từ Tổng mức ĐT + Chuyên ngành và ghi đè. Người dùng dễ nhầm tưởng đã chọn nhưng giá trị bị thay đổi.

**Đề xuất:**
- **Bỏ ô chọn tay**, thay bằng **ô hiển thị chỉ đọc** kết quả tự tính, kèm dòng giải thích: *"Nhóm dự án được xác định tự động theo Tổng mức đầu tư và Chuyên ngành (Luật ĐTC 58/2024)."*
- Trường hợp cần ghi đè thủ công (hiếm): thêm nút "Điều chỉnh thủ công" có ghi chú lý do, tách biệt rõ với giá trị tự tính.

### VI.2. Thông số quy mô công trình: trùng nguồn ở mã nguồn 🟡 → ✅ ĐÃ XỬ LÝ

**Đính chính sau khi rà soát kỹ:** 3 form `ProjectFormScale`, `ProjectFormStatus`, `ProjectFormContractors` trước đây **là code chết** (không được render ở đâu — modal tạo/sửa dự án chỉ dùng 4 tab). Do đó 6 trường quy mô **không thực sự trùng khi chạy**; chúng chỉ nhập được qua Tab Pháp lý, còn bản sao trong `ProjectFormScale` nằm trong file chết.

**Đã thực hiện (✅):**
- **Nối 3 form chết vào `CreateProjectModal`** thành các tab: Quy mô công trình, Nhà thầu, Trạng thái → khôi phục ~20 trường trước đây không nhập được (Tổng dự toán, số tầng, QĐ điều chỉnh, hiện trạng, nhà thầu, đơn vị thi công...).
- **Gỡ 6 trường quy mô khỏi Tab Pháp lý**, chỉ giữ tại Tab Quy mô công trình → hết trùng nguồn nhập. Tab Pháp lý giữ lại Cấp công trình + dẫn chú.

### VI.3. volumeRate = Tiến độ chung (sao chép thừa) 🟡

**Hiện trạng:** Trường "Tỷ lệ khối lượng" (volumeRate) đang được gán bằng đúng "Tiến độ chung" — lưu thừa một bản sao.

**Đề xuất:**
- **Bỏ lưu volumeRate riêng.** Nơi nào cần thì dùng thẳng Tiến độ chung.
- Hoặc nếu "Tỷ lệ khối lượng" có ý nghĩa khác (khối lượng nghiệm thu / tổng khối lượng), thì **định nghĩa lại công thức đúng** thay vì sao chép tiến độ.

### VI.4. Số liệu giải ngân lưu ở 2 bảng 🟡

**Hiện trạng:** Giải ngân lưu cả ở bảng `disbursements` (từng đợt) lẫn cột `disbursed_amount` của `capital_plans`. Trigger phải dùng cơ chế "ưu tiên đợt giải ngân, nếu trống thì lấy từ kế hoạch vốn" — dễ lệch nếu nhập cả hai.

**Đề xuất:**
- **Chốt một nguồn duy nhất**: chỉ nhập giải ngân qua **đợt giải ngân** (`disbursements`).
- Cột `disbursed_amount` ở kế hoạch vốn chuyển thành **tự tính** (cộng từ các đợt) hoặc bỏ.

### VI.5. Tổng KHV lưu hai nơi 🟡

**Hiện trạng:** Tổng KHV vừa lưu dạng riêng (JSONB `khv_info.total`) vừa được trigger tính từ `capital_plans`. Nếu ai đó sửa trực tiếp JSONB sẽ lệch.

**Đề xuất:**
- **Không cho nhập tay** `khv_info.total`; để trigger là nguồn duy nhất.
- Các trường KHV cần nhập tay (số QĐ giao vốn, năm) tách riêng khỏi trường tổng tự tính.

---

## VII. CÁC TRƯỜNG CÒN THIẾU Ô NHẬP — KẾ HOẠCH BỔ SUNG

Sắp xếp theo mức ưu tiên. Mỗi mục ghi rõ: trường thiếu, đề xuất xử lý (nhập tay hay tính tự động), vị trí bổ sung.

### Mức ưu tiên CAO (ảnh hưởng nghiệp vụ cốt lõi)

| # | Trường thiếu | Đề xuất | Vị trí bổ sung |
|---|--------------|---------|----------------|
| 1 | **Giai đoạn dự án** (Chuẩn bị/Thực hiện/Kết thúc) | 🟢 NHẬP (ô chọn) — hoặc 🔵 tự suy từ Hiện trạng | Tab Trạng thái |
| 2 | **Kế hoạch vốn theo năm** (QĐ giao KHV: số, ngày, năm 2025 kéo dài, 2026) | 🟢 NHẬP | Tab Vốn (bảng theo năm) |
| 3 | **Giải ngân theo đợt** (số tiền, ngày, nguồn) | 🟢 NHẬP | Tab Vốn (bảng đợt giải ngân) |
| 4 | **Tiến độ vật lý (%)** | 🔵 TỰ ĐỘNG — tính từ khối lượng nghiệm thu | Tính ở CSDL, hiển thị Tab Trạng thái |
| 5 | **Tiến độ tài chính / Tỷ lệ giải ngân (%)** | 🔵 TỰ ĐỘNG — = Tổng giải ngân / Tổng KHV | Tính ở CSDL, hiển thị Tab Vốn |

### Mức ưu tiên TRUNG BÌNH

| # | Trường thiếu | Đề xuất | Vị trí bổ sung |
|---|--------------|---------|----------------|
| 6 | **Dự án khẩn cấp** (có/không) | 🟢 NHẬP (công tắc) | Tab Thông tin chung |
| 7 | **Dự án ODA** (có/không) | 🟢 NHẬP (công tắc) | Tab Thông tin chung |
| 8 | **Tên nhà thầu chính** | 🟢 NHẬP | Tab Nhà thầu |
| 9 | **Yêu cầu BIM + Trạng thái BIM** | 🟢 NHẬP (ô chọn) | Tab BIM |
| 10 | **Mã CDE dự án** | 🟢 NHẬP | Tab CDE hoặc Thông tin chung |

### Mức ưu tiên THẤP

| # | Trường thiếu | Đề xuất | Vị trí bổ sung |
|---|--------------|---------|----------------|
| 11 | **Tọa độ GPS** (lat/lng) | 🟢 NHẬP (hoặc chọn trên bản đồ) | Tab Thông tin chung |
| 12 | **Ảnh dự án** | 🟢 NHẬP (tải ảnh) | Tab Thông tin chung |

> **Đã loại khỏi danh sách bổ sung** (theo đặc thù của Ban — chỉ quản lý dự án đầu tư công):
> - **Loại hình đầu tư**: cố định = "Đầu tư công", không cần ô chọn.
> - **Lĩnh vực đầu tư chi tiết (17 loại)**: không áp dụng — đã có "Chuyên ngành dự án" đủ để hệ thống tự tính Nhóm dự án.

---

## VIII. KẾ HOẠCH TRIỂN KHAI BỔ SUNG

Chia làm 3 đợt, làm cuốn chiếu.

### Đợt 1 — Dọn trùng lặp (1–2 ngày công)

Mục tiêu: dữ liệu sạch, không ghi đè nhầm. **Làm trước vì rủi ro cao nhất.**

- [ ] VI.1 — Chuyển Nhóm dự án sang ô hiển thị chỉ đọc (tự tính).
- [ ] VI.2 — Bỏ 6 trường quy mô khỏi Tab Pháp lý, chỉ giữ Tab Quy mô.
- [ ] VI.3 — Bỏ lưu volumeRate thừa (hoặc định nghĩa lại đúng).
- [ ] VI.4 / VI.5 — Chốt một nguồn cho giải ngân và Tổng KHV.

### Đợt 2 — Bổ sung nhập liệu ưu tiên CAO (3–5 ngày công)

Mục tiêu: đủ chỗ nhập cho nghiệp vụ vốn & tiến độ.

- [ ] #2, #3 — Thêm bảng **Kế hoạch vốn theo năm** và **Đợt giải ngân** ở Tab Vốn.
- [ ] #4, #5 — Thêm công thức tự tính **Tiến độ tài chính / Tỷ lệ giải ngân** (= Tổng giải ngân / Tổng KHV) và **Tiến độ vật lý** (từ khối lượng nghiệm thu).
- [ ] #1 — Thêm ô chọn **Giai đoạn dự án** (hoặc tự suy từ Hiện trạng).

### Đợt 3 — Bổ sung nhập liệu còn lại (2–3 ngày công)

Mục tiêu: hoàn thiện đầy đủ trường thông tin.

- [ ] #6–#10 — Dự án khẩn cấp, ODA, nhà thầu chính, BIM, CDE.
- [ ] #11–#12 — Tọa độ GPS, ảnh dự án.
- [ ] Thêm **kiểm tra nhất quán** (Tab Đầu tư): cảnh báo khi Tổng mức ĐT ≠ tổng cơ cấu chi phí / tổng cơ cấu vốn.

### Tiêu chí hoàn thành

1. Mỗi trường trong CSDL có **đúng một** ô nhập (hoặc được tính tự động rõ ràng).
2. Không còn trường vừa nhập tay vừa tự tính (trừ trường hợp có nút ghi đè thủ công có ghi chú).
3. Người dùng phân biệt rõ ô **nhập** và ô **chỉ xem** qua giao diện (màu/khóa nhập).

---

## IX. TRẠNG THÁI THỰC HIỆN (cập nhật sau khi sửa code)

> **Đính chính quan trọng:** Bản khảo sát ban đầu chỉ soi *modal tạo/sửa dự án* nên đánh "THIẾU" nhiều trường thực ra **đã có ô nhập ở các tab chi tiết khác** của trang dự án. Sau khi rà soát kỹ codebase, trạng thái thực tế như sau:

### Đã thực hiện ✅

| Việc | Chi tiết |
|------|----------|
| Nối 3 form chết vào modal | Thêm tab Quy mô / Nhà thầu / Trạng thái → khôi phục ~20 trường |
| Gỡ trùng 6 trường quy mô | Chỉ còn nhập ở tab Quy mô (bỏ khỏi Pháp lý) |
| Nhóm dự án → chỉ đọc | Hiển thị giá trị tự tính, bỏ ô chọn tay |
| Giai đoạn dự án (Stage) | Thêm ô chọn ở tab Trạng thái |
| Dự án khẩn cấp / ODA | Thêm 2 công tắc ở tab Thông tin chung |
| Tên nhà thầu chính | Thêm ô nhập ở tab Nhà thầu |
| Cảnh báo nhất quán vốn | Cảnh báo khi Tổng mức ĐT ≠ tổng chi phí / tổng nguồn vốn |
| Tọa độ GPS (vĩ độ/kinh độ) | Thêm ô nhập ở tab Thông tin chung |
| Ảnh dự án (URL) | Thêm ô nhập ở tab Thông tin chung |
| VI.3 — bỏ `volumeRate` thừa | Migration `20260603000000_remove_redundant_volume_rate.sql` (an toàn — nơi đọc có fallback sang Progress) |

### Đã có sẵn — KHÔNG cần làm (tránh trùng) ✅

| Hạng mục | Nơi đã có |
|----------|-----------|
| Kế hoạch vốn theo năm (#2) | Tab **Vốn** (`ProjectCapitalTab`) — CRUD đầy đủ |
| Đợt giải ngân (#3) | Tab **Vốn** — `DisbursementModal`, lịch sử giải ngân |
| Tỷ lệ giải ngân (#5) | Tab **Vốn** — `summary.disbursementRate` |
| Kế hoạch giải ngân theo tháng | Tab **Vốn** — `MonthlyDisbursementSection` |
| Quản lý BIM (#9) | Tab **BIM** (`ProjectBimTab`) |
| CDE (#10) | Phân hệ **CDE** riêng |

### Chưa làm — để lại đợt sau ⏳

| Hạng mục | Lý do |
|----------|-------|
| Tiến độ vật lý tự động (#4) | Cần mô hình khối lượng nghiệm thu — phạm vi lớn, cần chốt nguồn dữ liệu |
| VI.4/VI.5 — chốt 1 nguồn giải ngân/KHV | Đây thực chất là **cơ chế fallback có chủ đích** (ưu tiên `disbursements`, thiếu thì lấy `capital_plans`), không phải lỗi. Giữ nguyên để không phá Tab Vốn; cần test trực tiếp CSDL nếu muốn đổi |

> **Lưu ý migration:** File `20260603000000_remove_redundant_volume_rate.sql` cần được **apply vào Supabase** (chưa chạy tự động). Cho tới khi apply, `ProjectCard` vẫn hiển thị đúng nhờ fallback `volumeRate || Progress`.

---

*Tài liệu khảo sát lập từ việc đọc trực tiếp mã nguồn: các form trong `features/projects/components/forms/`, các tab trong `features/projects/components/tabs/`, service trong `services/`, công thức trong `utils/` và `lib/`, trigger trong `supabase/migrations/`.*

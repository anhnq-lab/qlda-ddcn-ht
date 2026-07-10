# NỘI DUNG TRÌNH BÀY DEMO PHẦN MỀM
## Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh

**Buổi:** Sáng thứ Sáu, 23/05/2026  
**Thành phần:** Ban QLDA (Lãnh đạo Ban và các Trưởng phòng)  
**Thời lượng dự kiến:** 45 – 60 phút  
**Đơn vị cung cấp phần mềm:** Công ty Cổ phần Công nghệ và Tư vấn CIC

---

## PHẦN I: GIỚI THIỆU ĐƠN VỊ VÀ BỐI CẢNH TRIỂN KHAI (5 phút)

### 1.1 Giới thiệu CIC

**Công ty Cổ phần Công nghệ và Tư vấn CIC** được thành lập năm 1990, tiền thân là Trung tâm Tin học thuộc Bộ Xây dựng — đơn vị đầu ngành về ứng dụng công nghệ thông tin trong lĩnh vực xây dựng tại Việt Nam với hơn **35 năm kinh nghiệm**.

| Thông tin | Chi tiết |
|---|---|
| Trụ sở | Tòa nhà VG Building, 235 Nguyễn Trãi, Hà Nội |
| Chi nhánh HCM | 36 Nguyễn Huy Lượng, Bình Thạnh, TP.HCM |
| Điện thoại | 086 893 4576 / 024 3976 1381 |
| Email | info@cic.com.vn |

**Lĩnh vực chuyên môn cốt lõi:**
- Tư vấn và triển khai BIM (Building Information Modeling)
- Phần mềm Quản lý dự án đầu tư xây dựng
- Chuyển đổi số ngành xây dựng
- Tư vấn chi phí xây dựng (đơn giá, chỉ số giá)
- Giải pháp Web 360 / trực quan hóa số thông minh
- Đối tác chiến lược của Bentley, IDEA StatiCa, Leapfrog

**Giải thưởng tiêu biểu:** Sao Khuê, Huân chương Lao động — đánh dấu đóng góp xuất sắc cho ngành công nghệ Việt Nam.

---

### 1.2 Bối cảnh và sự cần thiết của hệ thống

**Ban QLDA đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh** được thành lập theo Quyết định số 1865/QĐ-UBND ngày 22/7/2025 của UBND tỉnh Hà Tĩnh, với nhiệm vụ quản lý, điều hành hàng chục dự án đầu tư xây dựng công trình dân dụng và hạ tầng khu vực trên địa bàn tỉnh.

**Những thách thức trong công tác quản lý dự án hiện nay:**

| Vấn đề | Biểu hiện thực tế |
|---|---|
| Phân tán dữ liệu | Mỗi phòng lưu số liệu riêng trên file Excel, khó tổng hợp |
| Chậm báo cáo | Tổng hợp báo cáo tháng mất nhiều ngày, thiếu kịp thời |
| Thiếu cảnh báo sớm | Dự án chậm tiến độ chỉ phát hiện khi đã xảy ra |
| Khó tra cứu hồ sơ | Hồ sơ pháp lý, hợp đồng phân tán nhiều nơi |
| Giải ngân thụ động | Không có công cụ dự báo, đôn đốc giải ngân theo tiến độ |

**Hệ thống phần mềm CIC QLDA** được xây dựng đặc thù cho Ban QLDA, nhằm **tin học hóa toàn bộ quy trình nghiệp vụ** và cung cấp **công cụ chỉ đạo điều hành** trực tiếp, kịp thời cho Lãnh đạo Ban.

---

## PHẦN II: TỔNG QUAN HỆ THỐNG PHẦN MỀM QUẢN LÝ DỰ ÁN (10 phút)

### 2.1 Kiến trúc tổng thể

Hệ thống được thiết kế theo mô hình **3 lớp người dùng**, mỗi lớp có giao diện và quyền hạn phù hợp:

```
┌─────────────────────────────────────────────────────┐
│         LÃNH ĐẠO BAN (Giám đốc / Phó GĐ)          │
│   Dashboard tổng hợp • Cảnh báo rủi ro • AI        │
├─────────────────────────────────────────────────────┤
│    LÃNH ĐẠO PHÒNG (Trưởng/Phó phòng)              │
│   Theo dõi phòng • Phân công việc • Duyệt hồ sơ   │
├─────────────────────────────────────────────────────┤
│       CÁN BỘ CHUYÊN MÔN (Chuyên viên)             │
│   Cập nhật dữ liệu • Xử lý hồ sơ • Báo cáo       │
└─────────────────────────────────────────────────────┘
```

### 2.2 Các phân hệ chức năng chính

| # | Phân hệ | Chức năng cốt lõi |
|---|---|---|
| 1 | **Dashboard / Tổng quan** | KPI toàn Ban, biểu đồ giải ngân, cảnh báo dự án, Trợ lý AI |
| 2 | **Quản lý Dự án** | Hồ sơ dự án toàn trình, thông tin pháp lý, tiến độ |
| 3 | **Kế hoạch lựa chọn nhà thầu** | Quản lý gói thầu, theo dõi đấu thầu, tỷ lệ tiết kiệm |
| 4 | **Quản lý Hợp đồng** | Hợp đồng thi công/tư vấn, phụ lục, bảo lãnh |
| 5 | **Vốn & Giải ngân** | Kế hoạch vốn, nghiệm thu, thanh toán Kho bạc |
| 6 | **Quản lý Quy trình** | Số hóa quy trình công việc, luồng phê duyệt |
| 7 | **Kế hoạch Công tác** | Kế hoạch tháng/năm, giao việc, theo dõi hoàn thành |
| 8 | **BIM / Mô hình 3D** | Xem mô hình công trình trực tiếp trên trình duyệt |
| 9 | **Trợ lý AI** | Hỏi đáp tự nhiên, phân tích dữ liệu dự án tức thời |
| 10 | **Báo cáo & Văn bản** | Biểu mẫu chuẩn, báo cáo tự động, hệ thống văn bản |

---

## PHẦN III: DEMO TRỰC TIẾP – CÁC MODULE CHÍNH (25–30 phút)

### 3.1 MODULE 1: DASHBOARD LÃNH ĐẠO (8 phút)

**Mở màn hình Tổng quan — Đăng nhập bằng tài khoản Lãnh đạo Ban**

> **Nội dung trình bày:**  
> "Đây là giao diện đầu tiên mà Lãnh đạo Ban nhìn thấy sau khi đăng nhập. Thay vì phải đọc hàng chục file Excel hoặc báo cáo giấy, toàn bộ tình hình hoạt động của Ban được tổng hợp tự động trên một màn hình duy nhất."

**Tab 1 — Chỉ tiêu KPI (Tổng hợp toàn Ban):**
- **Tổng mức đầu tư** toàn danh mục dự án
- **Kế hoạch vốn** được giao trong năm ngân sách
- **Lũy kế giải ngân** thực tế đến hiện tại
- **Tỷ lệ giải ngân** (% so với kế hoạch)
- Số liệu **tự động cập nhật** khi cán bộ nhập hồ sơ thanh toán

**Tab 2 — Biểu đồ Giải ngân & Dòng tiền:**
- Biểu đồ cột/đường: đối chiếu **Kế hoạch vs Thực tế** từng tháng
- Xác định ngay tháng nào đang giải ngân chậm → Lãnh đạo có phương án đôn đốc kịp thời

**Tab 3 — Cảnh báo & Trạng thái Dự án:**
- 🟢 Đang thi công đúng tiến độ
- 🟡 Có nguy cơ chậm trễ — cần theo dõi
- 🔴 Đã chậm tiến độ — cần chỉ đạo xử lý ngay
- Dự án vướng mặt bằng/pháp lý → **tự động đẩy lên đầu danh sách**

**Tab 4 — Báo cáo giao ban tháng:**
- Trích xuất tự động các số liệu cốt lõi: tiến độ, giải ngân, vướng mắc
- Thay thế hoàn toàn việc soạn báo cáo PowerPoint thủ công
- Họp giao ban nhanh hơn, tập trung hơn, dựa trên số liệu thực

**Tab 5 — Trợ lý AI (tính năng nổi bật):**
- Hỏi bằng **ngôn ngữ tự nhiên**: *"Dự án nào giải ngân chậm nhất?", "Tháng này còn bao nhiêu vốn chưa giải ngân?"*
- AI truy xuất toàn bộ CSDL → phân tích → trả lời ngay lập tức
- Đóng vai trò **thư ký số** cho Lãnh đạo Ban

---

### 3.2 MODULE 2: QUẢN LÝ DỰ ÁN CHUYÊN SÂU (10 phút)

**Thao tác:** Click vào một dự án có cảnh báo từ Dashboard → vào Hồ sơ dự án

> **Nội dung trình bày:**  
> "Khi Lãnh đạo phát hiện một dự án đang có cảnh báo, chỉ cần một cú click để xem toàn bộ hồ sơ dự án đó. Mọi thông tin về vòng đời công trình đều được quản lý khép kín, thay thế hoàn toàn hệ thống file Excel rời rạc."

**Tab 1 — Thông tin chung & Pháp lý:**
- Quyết định phê duyệt chủ trương, phê duyệt dự án
- Ngày khởi công, dự kiến hoàn thành, các mốc gia hạn
- Quy mô, tổng mức đầu tư, nguồn vốn
- → Mọi cán bộ mở hồ sơ là nắm được tình trạng pháp lý ngay

**Tab 2 — Kế hoạch lựa chọn nhà thầu (KHLCNT):**
- Toàn bộ gói thầu theo **cấu trúc cây phân cấp**
- Theo dõi từng gói: đang lập HSMT / đang chấm thầu / đã có QĐ trúng thầu
- Tự động tính **tỷ lệ tiết kiệm** = (Giá dự toán − Giá trúng thầu) / Giá dự toán

**Tab 3 — Quản lý Hợp đồng & Phụ lục:**
- Toàn bộ hợp đồng thi công, tư vấn, giám sát
- Giá trị hợp đồng gốc + phụ lục phát sinh
- **Cảnh báo tự động** khi sắp hết hạn bảo lãnh tạm ứng / bảo lãnh thực hiện HĐ

**Tab 4 — Vốn & Giải ngân:**
- Kế hoạch vốn được giao từng năm
- Từng đợt nghiệm thu khối lượng
- Từng lần thanh toán Kho bạc (tên đề nghị, ngày, giá trị)
- Thanh tiến độ **tự động cập nhật** % hoàn thành giải ngân

**Tab 5 — Rủi ro & Vướng mắc:**
- Cán bộ QLDA cập nhật vướng mắc: mặt bằng, năng lực nhà thầu, thủ tục...
- Lãnh đạo theo dõi **trực tiếp** trên màn hình, không chờ báo cáo giấy
- Phân mức độ: Bình thường / Cần lưu ý / Nghiêm trọng

**Tab 6 — BIM / Mô hình 3D:**
- Xem mô hình công trình 3D **ngay trên trình duyệt** (không cần cài phần mềm)
- Lãnh đạo có thể đối chiếu trực quan giữa thiết kế và thực tế thi công
- *(Trình bày ở Phần IV — Chuyển đổi số)*

---

### 3.3 MODULE 3: QUẢN LÝ QUY TRÌNH & ĐIỀU HÀNH NỘI BỘ (7 phút)

**Thao tác:** Chuyển sang màn hình Quản lý Công việc / Kế hoạch tháng

> **Nội dung trình bày:**  
> "Bên cạnh nghiệp vụ dự án, hệ thống hỗ trợ Ban Giám đốc quản lý toàn bộ hoạt động điều hành nội bộ theo đúng Quy chế làm việc của Ban."

**Kế hoạch Công tác Tháng:**
- Toàn bộ đầu việc của các phòng được lập thành kế hoạch tháng
- Giao việc cụ thể đến từng cán bộ, có hạn định thực hiện
- Trạng thái: Chưa thực hiện / Đang xử lý / Hoàn thành / Quá hạn
- Lãnh đạo kiểm tra **mọi lúc, mọi nơi**, không cần họp giao ban riêng

**Số hóa Quy trình Luân chuyển Hồ sơ:**
- Quy trình thẩm định, phê duyệt được chuẩn hóa theo đúng Quy chế
- Lịch sử trình ký: Chuyên viên → Lãnh đạo phòng → Lãnh đạo Ban
- Ghi nhận **thời gian lưu hồ sơ** tại từng bước, trách nhiệm rõ ràng
- Không còn tình trạng hồ sơ "thất lạc" giữa các phòng

**Đánh giá Kết quả Công tác:**
- Tự động tổng hợp tỷ lệ hoàn thành nhiệm vụ từng tập thể/cá nhân
- Nguồn dữ liệu **khách quan, minh bạch** cho đánh giá thi đua hàng tháng/quý

---

## PHẦN IV: CHUYỂN ĐỔI SỐ TRONG XÂY DỰNG — BIM VÀ CÁC GIẢI PHÁP TIÊN TIẾN (10 phút)

### 4.1 Tổng quan về chuyển đổi số ngành xây dựng

**Xu hướng quốc gia:** Chính phủ đang đẩy mạnh ứng dụng BIM trong đầu tư xây dựng theo Quyết định 258/QĐ-TTg và các văn bản hướng dẫn của Bộ Xây dựng. Các Ban QLDA là đầu mối tiên phong triển khai.

**Chuyển đổi số trong xây dựng bao gồm 3 trụ cột:**

```
     SỐ HÓA DỮ LIỆU          →    PHÂN TÍCH THÔNG MINH    →    TỰ ĐỘNG HÓA QUY TRÌNH
  (Digitization)                   (Analytics & AI)              (Process Automation)
  
  • Số hóa hồ sơ                   • Dashboard thực thời          • Phê duyệt điện tử
  • Mô hình BIM                     • Cảnh báo sớm                 • Luồng công việc tự động
  • CSDL tập trung                  • Trợ lý AI                    • Báo cáo tự động
```

### 4.2 Giải pháp BIM (Building Information Modeling)

**BIM là gì?**  
BIM là phương pháp quản lý thông tin công trình bằng **mô hình 3D thông minh**, tích hợp đầy đủ dữ liệu kỹ thuật, chi phí và tiến độ vào một mô hình duy nhất.

**CIC QLDA tích hợp BIM với 3 lớp chức năng:**

**Lớp 1 — Xem mô hình trực tuyến (BIM Viewer):**
- Lãnh đạo xem mô hình 3D ngay trên trình duyệt, không cần cài phần mềm chuyên dụng
- Xoay, zoom, di chuyển mô hình để kiểm tra tổng thể công trình
- So sánh trực quan thiết kế với ảnh/báo cáo thi công thực tế

**Lớp 2 — Kho dữ liệu chung (CDE - Common Data Environment):**
- Lưu trữ tập trung tất cả file BIM, bản vẽ, tài liệu kỹ thuật
- Phân quyền truy cập theo vai trò (thiết kế, giám sát, thi công)
- Lịch sử phiên bản — theo dõi thay đổi thiết kế qua thời gian

**Lớp 3 — Trợ lý AI phân tích BIM (BIM Agent):**
- Chat trực tiếp với AI về mô hình: *"Khối lượng bê tông tầng 3 là bao nhiêu?", "Cấu kiện nào chưa được thi công?"*
- Kết nối dữ liệu BIM với tiến độ và thanh toán thực tế
- Hỗ trợ phát hiện sai lệch giữa thiết kế và thi công

### 4.3 Lợi ích đo lường được khi áp dụng BIM + QLDA số

| Chỉ tiêu | Trước (thủ công) | Sau (BIM + Phần mềm) |
|---|---|---|
| Thời gian tổng hợp báo cáo tháng | 3–5 ngày | Tức thời (real-time) |
| Sai sót khối lượng thanh toán | Khó kiểm soát | Đối chiếu tự động với BIM |
| Thời gian phát hiện dự án chậm | Sau khi xảy ra | Cảnh báo sớm 2–4 tuần |
| Tra cứu hồ sơ hợp đồng | 30–60 phút | Dưới 30 giây |
| Họp giao ban chuẩn bị số liệu | 1–2 ngày trước | Không cần chuẩn bị thêm |

### 4.4 Lộ trình triển khai đề xuất

**Giai đoạn 1 (Tháng 1–3): Nền tảng số**
- Triển khai phần mềm QLDA cho toàn Ban
- Số hóa dữ liệu dự án hiện có vào hệ thống
- Đào tạo cán bộ sử dụng phần mềm

**Giai đoạn 2 (Tháng 4–6): Kết nối & Vận hành**
- Kết nối với hệ thống của Kho bạc Nhà nước (nếu có API)
- Áp dụng quy trình luân chuyển hồ sơ điện tử
- Vận hành ổn định Dashboard Lãnh đạo

**Giai đoạn 3 (Tháng 7–12): BIM & Nâng cao**
- Triển khai mô hình BIM cho các dự án mới
- Tích hợp CDE và BIM Viewer
- Khai thác Trợ lý AI và báo cáo nâng cao

---

## PHẦN V: SO SÁNH TÍNH NĂNG VÀ ĐỊNH VỊ PHẦN MỀM (5 phút)

### 5.1 CIC QLDA vs. Phương pháp quản lý truyền thống

| Tiêu chí | Excel / Thủ công | CIC QLDA |
|---|---|---|
| **Cập nhật số liệu** | Mỗi phòng tự cập nhật riêng | Một điểm nhập, tất cả cùng thấy |
| **Báo cáo Lãnh đạo** | Soạn thủ công, mất nhiều ngày | Tự động, cập nhật liên tục |
| **Cảnh báo rủi ro** | Không có | Tự động phân màu xanh/vàng/đỏ |
| **Tra cứu hồ sơ** | Tìm trong nhiều thư mục | Tìm kiếm toàn văn, tức thì |
| **Tính minh bạch** | Khó kiểm soát ai sửa gì, khi nào | Lịch sử đầy đủ mọi thao tác |
| **Phân tích AI** | Không có | Hỏi – đáp tự nhiên với AI |
| **BIM 3D** | Cần phần mềm chuyên dụng | Xem ngay trên trình duyệt |

### 5.2 Tính phù hợp với đặc thù Ban QLDA Hà Tĩnh

Phần mềm được **xây dựng đặc thù** theo nghiệp vụ của Ban QLDA công trình Dân dụng và Hạ tầng:
- Tuân thủ quy trình theo **Luật Đầu tư công 2024**, **Luật Xây dựng** và **Luật Đấu thầu 2023**
- Phù hợp với **Quy chế làm việc** của Ban (phòng HCTH, QLDA 1-2-3, KH-ĐT, KT-TĐ, PTDV)
- Hỗ trợ đầy đủ nghiệp vụ từ **chuẩn bị đầu tư** đến **quyết toán dự án hoàn thành**

---

## PHẦN VI: KẾT LUẬN VÀ XIN Ý KIẾN CHỈ ĐẠO (5 phút)

### 6.1 Tóm tắt lợi ích cốt lõi

Hệ thống phần mềm CIC QLDA và giải pháp chuyển đổi số trong xây dựng sẽ giúp Ban QLDA:

1. **Tập trung hóa dữ liệu** — Xóa bỏ tình trạng mỗi phòng lưu số liệu riêng lẻ
2. **Tăng tốc báo cáo** — Lãnh đạo có số liệu thực theo thời gian thực, không chờ đợi
3. **Chủ động phòng ngừa rủi ro** — Phát hiện dự án chậm tiến độ / chậm giải ngân từ sớm
4. **Minh bạch hóa quy trình** — Mọi bước xử lý hồ sơ đều có dấu thời gian và người chịu trách nhiệm
5. **Nâng cao năng lực quản lý** — Tiếp cận tiêu chuẩn BIM và AI, bắt kịp xu hướng quốc gia

### 6.2 Các bước tiếp theo đề xuất

- [ ] Thống nhất danh mục dự án sẽ đưa vào hệ thống đợt đầu
- [ ] Xác định nhân sự đầu mối của từng phòng phụ trách vận hành
- [ ] Lên lịch đào tạo chuyên sâu theo nhóm người dùng
- [ ] Thảo luận về kết nối với các hệ thống hiện có (Kho bạc, UBND tỉnh)
- [ ] Xây dựng kế hoạch triển khai BIM cho các dự án mới khởi công

### 6.3 Lời kết

> "Kính thưa Ban Giám đốc và Lãnh đạo các Phòng/Ban,  
> Chuyển đổi số không chỉ là công nghệ — đó là cách chúng ta **quản trị tốt hơn**, **phục vụ nhân dân hiệu quả hơn** và **đáp ứng yêu cầu ngày càng cao của Nhà nước** về minh bạch, trách nhiệm trong đầu tư công.  
> Hệ thống CIC QLDA được xây dựng bởi đơn vị có hơn 35 năm đồng hành cùng ngành Xây dựng Việt Nam, sẵn sàng đồng hành cùng Ban QLDA Hà Tĩnh trong hành trình này.  
> Kính đề nghị Ban Giám đốc cho ý kiến chỉ đạo để đơn vị chúng tôi tiếp tục hoàn thiện hệ thống phù hợp với đặc thù của Ban."

---

## PHỤ LỤC: TÓM TẮT Q&A DỰ KIẾN

| Câu hỏi có thể gặp | Gợi ý trả lời |
|---|---|
| *Bảo mật dữ liệu như thế nào?* | Dữ liệu lưu trên máy chủ riêng, phân quyền theo vai trò, mọi thao tác đều có log kiểm toán |
| *Đào tạo mất bao lâu?* | 1–2 ngày/nhóm, có tài liệu hướng dẫn và hỗ trợ trực tuyến sau triển khai |
| *Tích hợp được với hệ thống của Kho bạc/UBND không?* | Hỗ trợ xuất file theo định dạng chuẩn; tích hợp API sẽ được khảo sát theo từng hệ thống cụ thể |
| *Chi phí bảo trì hàng năm?* | Theo hợp đồng dịch vụ riêng, bao gồm cập nhật pháp lý và hỗ trợ kỹ thuật |
| *Nếu nhà cung cấp không hỗ trợ nữa thì sao?* | Cam kết hợp đồng dịch vụ dài hạn; dữ liệu thuộc sở hữu của Ban và có thể xuất toàn bộ |
| *BIM áp dụng cho dự án nào trước?* | Nên bắt đầu với các dự án mới đang lập thiết kế để dễ tích hợp hơn |

---

*Tài liệu này được chuẩn bị bởi CIC QLDA — Hệ thống Quản lý Dự án Đầu tư Xây dựng*  
*Phiên bản: Demo sáng thứ Sáu 23/05/2026 — Ban QLDA DDCN-HT Hà Tĩnh*

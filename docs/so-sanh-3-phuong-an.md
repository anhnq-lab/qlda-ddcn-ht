# SO SÁNH 3 PHƯƠNG ÁN HẠ TẦNG
## Lựa chọn phù hợp cho Ban QLDA ĐTXD Dân Dụng Hà Tĩnh

---

## BẢNG SO SÁNH TỔNG QUAN

| Tiêu chí | A – VPS trong nước | B – 1 Máy chủ vật lý | C – 2 Máy chủ vật lý |
|---|:---:|:---:|:---:|
| **Chi phí/tháng** | ~4–5,3 triệu | ~10–14,5 triệu | ~22–23 triệu |
| **Chi phí triển khai** | ~17–23 triệu | ~30–40 triệu | ~45–60 triệu |
| **Tuân thủ TT47** | ✅ | ✅ | ✅ |
| **Máy chủ VN** | ✅ | ✅ | ✅ |
| **Phí bản quyền PM** | Miễn phí | Miễn phí | Miễn phí |
| **Người dùng tối đa** | ~200 | ~300 | ~500+ |
| **Uptime cam kết** | ~99,5% | ~99,7% | ~99,9% |
| **Thời gian phục hồi sự cố** | 15 phút–2 giờ | 4–8 giờ | <1 giờ |
| **Dự phòng phần cứng** | ❌ | ❌ | ✅ |
| **Thời gian triển khai** | 3–4 tuần | 4–6 tuần | 6–8 tuần |
| **Yêu cầu IT vận hành** | Cơ bản | Trung bình | Trung bình |
| **Độ phức tạp vận hành** | Thấp | Trung bình | Cao hơn |
| **Phù hợp quy mô hiện tại** | ✅ | ✅ | ⚠️ Hơi dư |

---

## HIỂU ĐƠN GIẢN QUA HÌNH ẢNH

```
PHƯƠNG ÁN A – VPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Giống như:  Thuê một căn hộ trong chung cư
             (tòa nhà là của nhà cung cấp,
              căn hộ là của riêng bạn)
 Chi phí:    ████░░░░░░  Thấp
 An toàn:    ████░░░░░░  Trung bình
 Phức tạp:   ██░░░░░░░░  Đơn giản nhất


PHƯƠNG ÁN B – 1 MÁY CHỦ VẬT LÝ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Giống như:  Thuê nguyên một ngôi nhà riêng
             (toàn bộ là của bạn, không ai khác)
 Chi phí:    ██████░░░░  Trung bình
 An toàn:    ███████░░░  Khá tốt
 Phức tạp:   ████░░░░░░  Trung bình


PHƯƠNG ÁN C – 2 MÁY CHỦ VẬT LÝ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Giống như:  Thuê nhà riêng + có nhà kho dự phòng
             (nếu nhà chính hỏng, dữ liệu vẫn an toàn)
 Chi phí:    ██████████  Cao nhất
 An toàn:    ██████████  Tốt nhất
 Phức tạp:   ██████░░░░  Phức tạp hơn
```

---

## CHI TIẾT TỪNG TIÊU CHÍ

### 1. Chi phí vận hành hàng tháng

```
                   0          5tr        10tr        15tr       20tr       25tr
                   │          │           │           │          │          │
Hiện tại ($25)  ▌ 650.000 VNĐ

Phương án A     ████ ~4–5,3 triệu VNĐ

Phương án B     ████████████ ~10–14,5 triệu VNĐ

Phương án C     ████████████████████████ ~22–23 triệu VNĐ
```

**Lưu ý quan trọng:** Tăng chi phí là bắt buộc khi chuyển từ dùng chung (cloud) sang hạ tầng riêng. Đây là chi phí của việc **tuân thủ pháp lý và chủ quyền dữ liệu**.

---

### 2. Độ tin cậy – Điều gì xảy ra khi có sự cố?

#### Phương án A – VPS

```
Tình huống: VPS bị lỗi phần cứng

[Nhà cung cấp phát hiện]
        │
        ▼ (tự động, ~5–15 phút)
[Khởi động lại VPS trên node khác]
        │
        ▼ (15–30 phút)
[Hệ thống hoạt động trở lại từ snapshot]

Tổng thời gian ngừng: 15 phút – 2 giờ
Mất dữ liệu tối đa: 0–6 giờ dữ liệu mới nhất
                    (tùy tần suất backup)
```

#### Phương án B – 1 Máy chủ vật lý

```
Tình huống: Máy chủ bị hỏng linh kiện

[Kỹ thuật viên FPT đến IDC]
        │
        ▼ (2–4 giờ)
[Thay linh kiện hoặc chuyển sang máy dự phòng]
        │
        ▼ (1–2 giờ)
[Khôi phục từ backup]

Tổng thời gian ngừng: 4–8 giờ
Mất dữ liệu tối đa: 0–1 giờ (nếu backup thường xuyên)
```

#### Phương án C – 2 Máy chủ vật lý

```
Tình huống: Máy chủ Database bị hỏng

[Hệ thống tự động phát hiện]
        │
        ▼ (5–10 phút, tự động)
[Chuyển sang backup database]

Tổng thời gian ngừng: <30 phút
Mất dữ liệu tối đa: Gần như 0
                    (database được nhân bản liên tục)
```

---

### 3. Khả năng chịu tải người dùng

| Số người dùng đồng thời | Phương án A | Phương án B | Phương án C |
|---|:---:|:---:|:---:|
| 50 người | ✅ Thoải mái | ✅ Thoải mái | ✅ Thoải mái |
| 100 người | ✅ Ổn | ✅ Thoải mái | ✅ Thoải mái |
| 150 người | ⚠️ Hơi chậm | ✅ Ổn | ✅ Thoải mái |
| 200 người | ⚠️ Chậm | ✅ Ổn | ✅ Thoải mái |
| 300 người | ❌ Quá tải | ⚠️ Hơi chậm | ✅ Ổn |
| 500 người | ❌ Quá tải | ❌ Quá tải | ✅ Ổn |

> **Thực tế:** Ban QLDA Hà Tĩnh có bao nhiêu cán bộ dùng cùng lúc? Nếu dưới 100 người → Phương án A hoàn toàn đủ.

---

### 4. Yêu cầu nhân sự IT vận hành

| Kỹ năng cần có | Phương án A | Phương án B | Phương án C |
|---|:---:|:---:|:---:|
| Linux cơ bản | Bắt buộc | Bắt buộc | Bắt buộc |
| Docker | Bắt buộc | Bắt buộc | Bắt buộc |
| PostgreSQL cơ bản | Cơ bản | Trung bình | Trung bình |
| Cấu hình mạng/tường lửa | Cơ bản | Trung bình | Trung bình |
| Quản lý RAID/phần cứng | ❌ Không cần | ⚠️ Cơ bản | ⚠️ Cơ bản |
| Replication/HA setup | ❌ Không cần | ❌ Không cần | ✅ Cần biết |
| **Số cán bộ IT cần** | 1 người | 1–2 người | 1–2 người |

---

### 5. Quy trình triển khai

```
         Tuần 1    Tuần 2    Tuần 3    Tuần 4    Tuần 5    Tuần 6    Tuần 7    Tuần 8
         ────────  ────────  ────────  ────────  ────────  ────────  ────────  ────────
PA A     [Chuẩn bị][Supabase][DL────────][Test+Cut]
         3–4 tuần

PA B     [─Chuẩn bị─][──Supabase──][DL────────][──Test+Cut──]
         4–6 tuần

PA C     [──Chuẩn bị──][────Supabase────][DL────────][────Test+Cut────]
         6–8 tuần
```

---

## PHÂN TÍCH RỦI RO

| Rủi ro | Phương án A | Phương án B | Phương án C |
|---|---|---|---|
| Mất điện IDC | Nhà cung cấp tự xử lý | FPT UPS/máy phát | FPT UPS/máy phát |
| Hỏng ổ cứng | Nhà cung cấp tự xử lý | Thay thế (RAID tự bảo vệ data) | Thay thế (RAID + DB nhân bản) |
| Hết dung lượng | Nâng cấp online, không cần tắt | Cần tắt máy để gắn thêm ổ | Cần tắt máy để gắn thêm ổ |
| Tấn công mạng | Tường lửa + Nginx | Tường lửa + Nginx | Tường lửa + Nginx |
| Quá tải người dùng | Nâng cấu hình VPS (nhanh) | Phải mua thêm máy (chậm) | Phải mua thêm máy (chậm) |
| **Mức độ rủi ro tổng** | Trung bình | Thấp–Trung bình | Thấp |

---

## ĐỀ XUẤT LỰA CHỌN

### Dựa trên thực tế của Ban QLDA ĐTXD Hà Tĩnh

**Câu hỏi quyết định:**

```
Mỗi ngày cao điểm, có bao nhiêu cán bộ dùng hệ thống cùng lúc?

  Dưới 100 người  →  Phương án A  (tiết kiệm, đủ dùng)
  100–200 người   →  Phương án A hoặc B  (cân nhắc ngân sách)
  Trên 200 người  →  Phương án B  (an toàn hơn)
  Trên 300 người  →  Phương án C  (bắt buộc)
```

```
Nếu hệ thống ngừng 4–8 giờ để sửa, cơ quan có chịu được không?

  Chịu được  →  Phương án A hoặc B
  Không chấp nhận được  →  Phương án C
```

---

### Khuyến nghị cụ thể

#### Nếu ngân sách ưu tiên → **Phương án A**
> Chi phí: **~4–5 triệu VNĐ/tháng**
> Phù hợp khi số người dùng đồng thời dưới 150 người.
> Khi hệ thống phát triển, có thể nâng lên Phương án B bất cứ lúc nào.

#### Nếu muốn cân bằng ổn định và chi phí → **Phương án B** ⭐
> Chi phí: **~10–14,5 triệu VNĐ/tháng**
> Máy chủ vật lý riêng, FPT cam kết SLA phần cứng.
> Phù hợp với tiêu chuẩn cơ quan nhà nước cấp tỉnh.

#### Nếu yêu cầu cao nhất về dự phòng → **Phương án C**
> Chi phí: **~22–23 triệu VNĐ/tháng**
> Chỉ cần thiết nếu hệ thống phục vụ nhiều đơn vị tỉnh cùng lúc hoặc yêu cầu SLA 24/7.

---

## CHI PHÍ 3 NĂM – TỔNG HỢP

| | Phương án A | Phương án B | Phương án C |
|---|:---:|:---:|:---:|
| Triển khai ban đầu | ~20 triệu | ~35 triệu | ~55 triệu |
| Vận hành năm 1 | ~54 triệu | ~132 triệu | ~264 triệu |
| Vận hành năm 2 | ~54 triệu | ~132 triệu | ~264 triệu |
| Vận hành năm 3 | ~54 triệu | ~132 triệu | ~264 triệu |
| **Tổng 3 năm** | **~182 triệu** | **~431 triệu** | **~847 triệu** |
| **Hiện tại (Supabase $25×36)** | **~23 triệu** | **~23 triệu** | **~23 triệu** |
| **Chi phí tăng thêm 3 năm** | +159 triệu | +408 triệu | +824 triệu |

> Chi phí tăng thêm chính là "giá của sự tuân thủ pháp lý và chủ quyền dữ liệu".
> Về dài hạn, rủi ro pháp lý nếu không chuyển đổi (xử phạt, yêu cầu gỡ bỏ hệ thống) có thể tốn kém hơn nhiều.

---

*Tất cả số liệu mang tính ước tính, cần báo giá chính thức từ nhà cung cấp trước khi ra quyết định.*

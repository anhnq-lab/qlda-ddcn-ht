# SO SÁNH CÁC PHƯƠNG ÁN HẠ TẦNG
## Lựa chọn phù hợp cho Ban QLDA ĐTXD Dân Dụng Hà Tĩnh

---

## CÁC PHƯƠNG ÁN XEM XÉT

| | Phương án | Mô tả ngắn |
|---|---|---|
| **A** | VPS thuê trong nước | Thuê máy chủ ảo tại FPT/VNPT/Viettel |
| **B** | 1 Máy chủ vật lý thuê | Thuê nguyên 1 máy chủ tại IDC FPT |
| **C** | 2 Máy chủ vật lý thuê | Thuê 2 máy chủ tại IDC FPT (dự phòng cao) |
| **D1** | Tự mua máy chủ – đặt tại văn phòng | Mua máy, đặt tại trụ sở Ban QLDA |
| **D2** | Tự mua máy chủ – đặt tại IDC | Mua máy, thuê chỗ đặt tại IDC FPT |

---

## BẢNG SO SÁNH TỔNG QUAN (5 PHƯƠNG ÁN)

| Tiêu chí | A – VPS thuê | B – 1 Máy thuê | C – 2 Máy thuê | D1 – Tự mua (văn phòng) | D2 – Tự mua (IDC) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Chi phí mua sắm ban đầu** | Không | Không | Không | ~50–80 triệu | ~50–80 triệu |
| **Chi phí vận hành/tháng** | ~4–5,3 tr | ~10–14,5 tr | ~22–23 tr | ~1,5–2 tr | ~3,5–5 tr |
| **Tổng chi phí 3 năm** | ~182 tr | ~431 tr | ~847 tr | ~114–122 tr | ~176–230 tr |
| **Tuân thủ TT47** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dữ liệu tại Việt Nam** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Người dùng tối đa** | ~200 | ~300 | 500+ | ~200 | ~200 |
| **Uptime cam kết** | ~99,5% | ~99,7% | ~99,9% | ⚠️ Không cam kết | ~99,5% |
| **Phục hồi khi sự cố** | 15ph–2h | 4–8h | <30ph | 1–3 ngày | 4–8h |
| **Điện dự phòng (UPS)** | ✅ IDC lo | ✅ IDC lo | ✅ IDC lo | ❌ Tự lo | ✅ IDC lo |
| **Làm mát chuyên nghiệp** | ✅ IDC lo | ✅ IDC lo | ✅ IDC lo | ❌ Tự lo | ✅ IDC lo |
| **Bảo mật vật lý** | ✅ IDC lo | ✅ IDC lo | ✅ IDC lo | ⚠️ Tự lo | ✅ IDC lo |
| **Tài sản của cơ quan** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Chủ động nâng cấp** | ⚠️ Hạn chế | ⚠️ Hạn chế | ⚠️ Hạn chế | ✅ Toàn quyền | ✅ Toàn quyền |
| **Thời gian triển khai** | 3–4 tuần | 4–6 tuần | 6–8 tuần | 6–10 tuần | 6–10 tuần |
| **Phức tạp vận hành** | Thấp | Trung bình | Cao | **Cao nhất** | **Cao nhất** |

---

## PHƯƠNG ÁN D – TỰ MUA MÁY CHỦ

### D là gì?

Thay vì thuê máy chủ hàng tháng, cơ quan **bỏ tiền mua hẳn phần cứng** về sở hữu. Máy đó có thể đặt tại:
- **D1:** Phòng máy chủ tại trụ sở Ban QLDA
- **D2:** Thuê chỗ đặt tại trung tâm dữ liệu chuyên nghiệp (IDC FPT, VNPT...)

### Cấu hình máy chủ cần mua (cho 50 người dùng đồng thời)

```
┌─────────────────────────────────────────────┐
│         MÁY CHỦ ĐỀ XUẤT MUA                 │
│                                             │
│  Dòng máy:  Dell PowerEdge R350             │
│             hoặc HPE ProLiant DL360 Gen10   │
│             hoặc Lenovo ThinkSystem SR250   │
│                                             │
│  CPU:       Intel Xeon E-2300 – 8 core      │
│  RAM:       32 GB DDR4 ECC                  │
│  SSD:       2× 960 GB NVMe RAID-1           │
│             (hệ điều hành + database)       │
│  HDD:       2× 4 TB SATA RAID-1             │
│             (file BIM, tài liệu, backup)    │
│  Nguồn:     Dự phòng kép (redundant PSU)    │
│  Bảo hành:  3–5 năm (Dell/HPE tại VN)      │
└─────────────────────────────────────────────┘
```

### Giá máy chủ thực tế tại Việt Nam

| Hãng & Model | Cấu hình | Giá ước tính |
|---|---|---|
| Dell PowerEdge R350 | Xeon E-2334, 32GB, 2×960GB SSD | ~45–60 triệu VNĐ |
| HPE ProLiant DL360 Gen10 | Xeon Silver 4208, 32GB, 2×960GB SSD | ~55–75 triệu VNĐ |
| Lenovo ThinkSystem SR250 V2 | Xeon E-2300, 32GB, 2×960GB SSD | ~40–55 triệu VNĐ |

> Giá trên chưa gồm VAT, có thể thay đổi theo tỷ giá và thời điểm. Nên mua qua đại lý ủy quyền tại Việt Nam để được bảo hành đầy đủ.

---

### PHƯƠNG ÁN D1 – Đặt tại văn phòng

```
┌─────────────────────────────────────────┐
│   PHÒNG MÁY CHỦ TẠI VĂN PHÒNG BAN QLDA │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ Máy chủ      │  │ UPS (bộ lưu     │  │
│  │ vật lý       │  │ điện dự phòng)  │  │
│  │ (tự mua)     │  │ ~15–20 triệu    │  │
│  └──────────────┘  └─────────────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ Switch mạng + Đường truyền Internet │ │
│  │ (cần thuê thêm IP tĩnh từ ISP)      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Điều hòa chạy 24/7                    │
│  Bảo vệ an ninh vật lý (khóa phòng)    │
└─────────────────────────────────────────┘
         ▲
         │ Internet (qua đường truyền văn phòng)
         │
    Người dùng
```

**Chi phí D1 hàng tháng:**

| Hạng mục | Chi phí/tháng |
|---|---|
| Điện (máy chủ ~300W × 24h × 30 ngày × 3.000đ/kWh) | ~650.000 VNĐ |
| Điện điều hòa phòng máy (24/7) | ~500.000–800.000 VNĐ |
| IP tĩnh từ nhà cung cấp Internet | ~200.000–500.000 VNĐ |
| Khấu hao máy chủ (60 triệu ÷ 60 tháng) | ~1.000.000 VNĐ |
| Khấu hao UPS (18 triệu ÷ 60 tháng) | ~300.000 VNĐ |
| **TỔNG/THÁNG** | **~2,6–3,2 triệu VNĐ** |

**Nhược điểm nghiêm trọng của D1:**

```
❌ Cúp điện → Hệ thống ngừng (UPS chỉ dùng được 15–30 phút)
❌ Điều hòa hỏng → Máy chủ quá nhiệt, tắt tự động
❌ Internet văn phòng đứt → Không ai truy cập được
❌ Thiên tai, hỏa hoạn, ngập lụt → Mất dữ liệu
❌ Cần người trực máy chủ tại văn phòng
❌ Khó đảm bảo bảo mật vật lý theo chuẩn
⚠️ TT47 yêu cầu bảo mật vật lý → Cần kiểm tra kỹ
```

---

### PHƯƠNG ÁN D2 – Tự mua, đặt tại IDC (Colocation)

```
┌─────────────────────────────────────────────────┐
│         TRUNG TÂM DỮ LIỆU IDC FPT              │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  RACK của Ban QLDA (1U hoặc 2U)          │   │
│  │                                          │   │
│  │  [Máy chủ của cơ quan – tự mua]          │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ✅ Điện dự phòng UPS + máy phát của IDC        │
│  ✅ Điều hòa chuyên nghiệp 24/7                 │
│  ✅ Bảo mật vật lý: camera, thẻ từ, bảo vệ     │
│  ✅ Băng thông Internet tốc độ cao              │
│  ✅ Giám sát hạ tầng 24/7 bởi FPT              │
└─────────────────────────────────────────────────┘
```

**Chi phí D2 hàng tháng:**

| Hạng mục | Chi phí/tháng |
|---|---|
| Thuê chỗ đặt (colocation 1U tại FPT IDC) | ~1.500.000–2.000.000 VNĐ |
| Điện sử dụng (2A × 220V) | ~500.000–700.000 VNĐ |
| Băng thông Internet (100Mbps) | ~800.000–1.200.000 VNĐ |
| IP tĩnh | ~100.000–200.000 VNĐ |
| Khấu hao máy chủ (60 triệu ÷ 60 tháng) | ~1.000.000 VNĐ |
| **TỔNG/THÁNG** | **~3,9–5,1 triệu VNĐ** |

D2 có chi phí hàng tháng **gần bằng Phương án A (VPS)** nhưng có thêm khoản mua máy ban đầu ~50–80 triệu.

---

## SO SÁNH TỔNG CHI PHÍ 3 NĂM (ĐẦY ĐỦ)

```
                    Năm 1          Năm 2          Năm 3       TỔNG 3 NĂM
                    ─────────────  ─────────────  ─────────── ─────────────
Hiện tại ($25/th)  7,8 triệu      7,8 triệu      7,8 triệu   23 triệu

PA A (VPS thuê)    74 triệu       54 triệu        54 triệu   182 triệu
                   (20tr setup +
                    54tr vận hành)

PA B (1 máy thuê)  167 triệu      132 triệu       132 triệu  431 triệu

PA C (2 máy thuê)  319 triệu      264 triệu       264 triệu  847 triệu

PA D1 (tự mua,    ~115 triệu      ~35 triệu       ~35 triệu  ~185 triệu
       văn phòng)  (80tr mua máy+
                   UPS + setup +
                   35tr vận hành)

PA D2 (tự mua,    ~125 triệu      ~55 triệu       ~55 triệu  ~235 triệu
       IDC)        (80tr mua máy+
                   setup +
                   45tr vận hành)
```

> **Lưu ý D1/D2:** Năm 4–5 chi phí tiếp tục thấp (chỉ còn vận hành), nhưng sau 5–7 năm máy chủ cần thay thế hoặc nâng cấp — lại phát sinh chi phí mua mới.

---

## PHÂN TÍCH RỦI RO ĐẦY ĐỦ

| Rủi ro | A (VPS) | B (1 máy thuê) | C (2 máy thuê) | D1 (văn phòng) | D2 (IDC) |
|---|:---:|:---:|:---:|:---:|:---:|
| Cúp điện | ✅ IDC lo | ✅ IDC lo | ✅ IDC lo | ❌ Nguy hiểm | ✅ IDC lo |
| Điều hòa hỏng | ✅ IDC lo | ✅ IDC lo | ✅ IDC lo | ❌ Nguy hiểm | ✅ IDC lo |
| Internet đứt | ✅ IDC có đa đường | ✅ IDC lo | ✅ IDC lo | ❌ Tắt hết | ✅ IDC lo |
| Hỏng phần cứng | Nhà cung cấp thay | FPT hỗ trợ | FPT hỗ trợ | ❌ Tự xử lý | ❌ Tự mua phụ tùng |
| Hỏa hoạn/ngập | ✅ IDC lo | ✅ IDC lo | ✅ IDC lo | ❌ Mất tất cả | ✅ IDC lo |
| Hết hạn phần cứng | Nâng VPS online | Thuê máy mới | Thuê máy mới | Mua máy mới | Mua máy mới |
| **Rủi ro tổng thể** | Thấp | Thấp | Rất thấp | **Cao** | Thấp |

---

## KẾT LUẬN VÀ KHUYẾN NGHỊ CUỐI CÙNG

### Dành riêng cho Ban QLDA (50 người dùng, chấp nhận ngừng vài giờ):

```
┌────────────────────────────────────────────────────────────────┐
│                   KHUYẾN NGHỊ                                  │
│                                                                │
│  🥇 TỐT NHẤT: Phương án A – VPS thuê                          │
│     → ~4–5 triệu/tháng, không cần mua phần cứng               │
│     → Dễ vận hành, dễ nâng cấp, rủi ro thấp                  │
│     → Phù hợp hoàn hảo với 50 người dùng                     │
│                                                                │
│  🥈 NẾU MUỐN SỞ HỮU TÀI SẢN: Phương án D2                    │
│     → Mua 1 lần ~50–80 triệu, sau đó ~4–5 triệu/tháng        │
│     → Tài sản thuộc cơ quan, toàn quyền kiểm soát            │
│     → Chi phí 3 năm tương đương Phương án A                   │
│     → Cần có kỹ thuật viên biết quản lý phần cứng            │
│                                                                │
│  ❌ KHÔNG KHUYẾN NGHỊ: Phương án D1 (đặt tại văn phòng)       │
│     → Quá nhiều rủi ro (điện, mạng, nhiệt độ, bảo mật)       │
│     → Không đảm bảo tiêu chuẩn hạ tầng của TT47              │
│                                                                │
│  ⚠️  CHƯA CẦN THIẾT: Phương án B và C                         │
│     → Chi phí quá cao so với nhu cầu thực tế 50 users        │
└────────────────────────────────────────────────────────────────┘
```

### Bảng điểm tổng hợp (cho 50 người dùng)

| Tiêu chí | Trọng số | A (VPS) | D2 (Tự mua+IDC) | B (1 Máy thuê) | D1 (VP) |
|---|:---:|:---:|:---:|:---:|:---:|
| Chi phí 3 năm | 30% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Độ tin cậy | 25% | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Dễ vận hành | 20% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Tuân thủ TT47 | 15% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Sở hữu tài sản | 10% | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **Điểm tổng** | | **⭐⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐** | **⭐⭐** |

---

*Tất cả số liệu mang tính ước tính. Cần báo giá chính thức từ nhà cung cấp trước khi ra quyết định.*
*Phiên bản 2.0 – Cập nhật bổ sung Phương án D1/D2 theo yêu cầu.*

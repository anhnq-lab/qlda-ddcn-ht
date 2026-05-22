# PHƯƠNG ÁN A – VPS TRONG NƯỚC
## Triển khai Supabase Open Source trên Máy chủ Ảo (VPS) tại Việt Nam
### Chi tiết kỹ thuật và hướng dẫn lựa chọn

---

> **Dành cho:** Ban QLDA ĐTXD Dân Dụng Hà Tĩnh
> **Quy mô:** 100–200 người dùng | **Ngân sách:** Tiết kiệm nhất có thể đáp ứng TT47

---

## 1. VPS LÀ GÌ? (Giải thích cho người không làm IT)

**Máy chủ vật lý (Dedicated)** = bạn thuê **cả con bò** về nuôi riêng.
**VPS (Virtual Private Server)** = bạn thuê **một phần con bò** — con bò đó vẫn đứng trong chuồng của nhà cung cấp, nhưng phần bạn thuê là **của riêng bạn**, không ai khác đụng vào được.

```
┌──────────────────────────────────────────────────────┐
│         MÁY CHỦ VẬT LÝ tại IDC FPT (Việt Nam)       │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  VPS của     │  │  VPS của     │  │  VPS của   │ │
│  │  Ban QLDA    │  │  Khách hàng  │  │  Khách     │ │
│  │  Hà Tĩnh     │  │  B           │  │  hàng C    │ │
│  │  (riêng biệt)│  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
│  CPU, RAM, Ổ cứng được chia sẻ phần cứng vật lý     │
│  nhưng dữ liệu hoàn toàn tách biệt, mã hóa riêng    │
└──────────────────────────────────────────────────────┘
```

**Điểm quan trọng với TT47:** Máy chủ vật lý chứa VPS **đặt tại Việt Nam** → dữ liệu không rời khỏi lãnh thổ Việt Nam → **đáp ứng yêu cầu pháp lý**.

---

## 2. NHÀ CUNG CẤP VPS TẠI VIỆT NAM

Có nhiều lựa chọn, tất cả đều có data center trong nước:

| Nhà cung cấp | Loại | Ưu điểm | Phù hợp |
|---|---|---|---|
| **FPT Cloud** | Doanh nghiệp | Uy tín, hợp đồng cơ quan nhà nước quen thuộc | ⭐ Khuyến nghị |
| **VNPT Cloud** | Nhà nước | Dễ làm thủ tục, hỗ trợ tiếng Việt | ⭐ Khuyến nghị |
| **Viettel IDC** | Nhà nước | Băng thông lớn, hạ tầng mạnh | ✅ Phù hợp |
| **CMC Telecom** | Doanh nghiệp | Giá cạnh tranh, data center HN & HCM | ✅ Phù hợp |
| **Bizfly Cloud** | Doanh nghiệp | Giao diện đơn giản, thanh toán linh hoạt | ✅ Phù hợp |

> **Gợi ý:** Với cơ quan nhà nước tỉnh Hà Tĩnh, **FPT Cloud** hoặc **VNPT Cloud** dễ làm thủ tục hợp đồng nhất, có hỗ trợ kỹ thuật tiếng Việt và kinh nghiệm làm việc với đơn vị hành chính công.

---

## 3. CẤU HÌNH VPS CẦN THIẾT

### Phân tích nhu cầu thực tế của hệ thống

Hệ thống QLDA ĐTXD chạy 8 dịch vụ Supabase + database + file storage trên cùng một máy. Dưới đây là mức tài nguyên từng dịch vụ cần:

| Dịch vụ | RAM cần | CPU | Ghi chú |
|---|---|---|---|
| PostgreSQL (CSDL) | 4–8 GB | 4 core | Phần tốn tài nguyên nhất |
| PostgREST (API) | 512 MB | 1 core | |
| GoTrue (Đăng nhập) | 256 MB | 0.5 core | |
| Realtime (Cập nhật tức thì) | 512 MB | 1 core | |
| Storage (File) | 256 MB | 0.5 core | |
| Kong (Cổng API) | 512 MB | 1 core | |
| Studio (Admin) | 512 MB | 0.5 core | |
| Nginx (Reverse proxy) | 128 MB | 0.5 core | |
| **Dự phòng hệ thống** | 2–4 GB | 2 core | |
| **TỔNG** | **~10–16 GB** | **~11 core** | |

### Cấu hình VPS đề xuất

```
┌─────────────────────────────────────────────┐
│         CẤU HÌNH VPS KHUYẾN NGHỊ            │
│                                             │
│  CPU:      8 vCPU (hoặc 16 vCPU tốt hơn)   │
│  RAM:      32 GB DDR4                        │
│  SSD:      500 GB (OS + DB + App)            │
│  SSD mở:  1 TB (File: tài liệu, BIM)        │
│  Băng:     100 Mbps uplink                  │
│  OS:       Ubuntu Server 22.04 LTS          │
└─────────────────────────────────────────────┘
```

> **Lưu ý về ổ cứng BIM:** File BIM (`.ifc`) mỗi công trình có thể nặng 200MB–2GB. Nếu hệ thống quản lý nhiều dự án lớn, cần tính thêm dung lượng hoặc dùng thêm ổ đĩa gắn thêm (block storage) — hầu hết nhà cung cấp VPS cho phép mở rộng dễ dàng.

---

## 4. KIẾN TRÚC TRIỂN KHAI TRÊN 1 VPS

Toàn bộ hệ thống chạy trong **Docker** — giống như nhiều "căn phòng riêng biệt" trong cùng một ngôi nhà:

```
┌─────────────────────────────────────────────────────────────┐
│                    VPS – IDC Việt Nam                        │
│                  Ubuntu 22.04 + Docker                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Nginx (Cổng vào duy nhất – HTTPS port 443)         │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                          │                                  │
│          ┌───────────────┼───────────────────┐             │
│          ▼               ▼                   ▼             │
│  ┌──────────────┐ ┌─────────────┐  ┌──────────────────┐   │
│  │ Kong         │ │ Supabase    │  │ Edge Functions   │   │
│  │ (API Gateway)│ │ Studio      │  │ - admin-user-ops │   │
│  └──────┬───────┘ │ (Trang quản│  │ - gemini-proxy   │   │
│         │         │  trị CSDL) │  │ - scan-virus     │   │
│         │         └─────────────┘  └──────────────────┘   │
│    ┌────┴──────────────────────┐                           │
│    │                           │                           │
│    ▼                           ▼                           │
│  ┌─────────────┐  ┌───────────────────────────────────┐   │
│  │ GoTrue      │  │ PostgREST + Realtime + Storage    │   │
│  │ (Đăng nhập) │  │ (API tự động từ database)         │   │
│  └─────────────┘  └───────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│         ┌─────────────────────────────────┐               │
│         │  PostgreSQL 15                  │               │
│         │  60+ bảng dữ liệu               │               │
│         │  69+ chính sách bảo mật (RLS)   │               │
│         │  pg_cron (lịch tự động)         │               │
│         └─────────────────────────────────┘               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MinIO – Lưu trữ file                               │   │
│  │  /documents  /bim-models  /task-attachments         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Backup tự động (pg_cron)                           │   │
│  │  Full backup: hàng ngày → FPT Object Storage        │   │
│  │  Incremental: mỗi 6 giờ                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ▲                          ▲
           │                          │
    Người dùng                   Admin IT
   (trình duyệt)           (Supabase Studio)
```

### Phần giao diện web (Frontend) xử lý thế nào?

Giao diện web hiện đang chạy trên **Vercel** (Mỹ). Với TT47, đây **không phải vấn đề** vì:

- Vercel chỉ chứa **code giao diện** (HTML, CSS, JavaScript) — không có dữ liệu người dùng
- Toàn bộ dữ liệu (hồ sơ, hợp đồng, tài chính...) vẫn ở VPS Việt Nam
- Khi người dùng bấm nút, trình duyệt gửi yêu cầu thẳng đến VPS Việt Nam

> Nếu muốn 100% trong nước: có thể chuyển frontend vào cùng VPS, Nginx sẽ phục vụ file tĩnh — không cần Vercel nữa.

---

## 5. CHI PHÍ CHI TIẾT PHƯƠNG ÁN A

### Ước tính giá VPS tại các nhà cung cấp Việt Nam

| Nhà cung cấp | Cấu hình | Giá/tháng (ước tính) |
|---|---|---|
| FPT Cloud | 8 vCPU, 32GB RAM, 500GB SSD | ~3.500.000 – 4.500.000 VNĐ |
| VNPT Cloud | 8 vCPU, 32GB RAM, 500GB SSD | ~3.000.000 – 4.000.000 VNĐ |
| Viettel IDC | 8 vCPU, 32GB RAM, 500GB SSD | ~3.200.000 – 4.200.000 VNĐ |
| Bizfly Cloud | 8 vCPU, 32GB RAM, 500GB SSD | ~2.800.000 – 3.500.000 VNĐ |

### Chi phí bổ sung

| Hạng mục | Chi phí |
|---|---|
| Block storage mở rộng (1TB thêm cho BIM) | ~500.000 – 800.000 VNĐ/tháng |
| Chứng chỉ SSL (2 năm) | ~2.000.000 – 4.000.000 VNĐ (1 lần) |
| IP tĩnh (nếu cần) | ~100.000 – 200.000 VNĐ/tháng |

### Tổng chi phí ước tính

| | Tháng đầu (có triển khai) | Các tháng tiếp theo |
|---|---|---|
| VPS + storage | ~4.000.000 – 5.300.000 VNĐ | ~4.000.000 – 5.300.000 VNĐ |
| SSL (1 lần) | ~3.000.000 VNĐ | — |
| Cài đặt, cấu hình | ~10.000.000 – 15.000.000 VNĐ | — |
| **TỔNG** | **~17–23 triệu VNĐ** | **~4–5,3 triệu VNĐ/tháng** |

**So với hiện tại:** $25/tháng ≈ 650.000 VNĐ → tăng thêm ~3,4–4,7 triệu VNĐ/tháng để đổi lấy tuân thủ pháp lý và dữ liệu ở Việt Nam.

---

## 6. ĐIỂM MẠNH VÀ ĐIỂM YẾU

### ✅ Điểm mạnh

- **Tuân thủ TT47:** Dữ liệu 100% ở Việt Nam
- **Chi phí thấp nhất** trong các phương án self-hosted
- **Không phí bản quyền** phần mềm (Supabase mã nguồn mở)
- **Dễ mở rộng:** Chỉ cần nâng cấu hình VPS khi cần thêm tài nguyên
- **Không thay đổi code:** Chỉ cần đổi địa chỉ máy chủ trong file cấu hình
- **Backup dễ dàng:** FPT/VNPT/Viettel đều có dịch vụ backup snapshot VPS

### ⚠️ Điểm cần lưu ý

- **Điểm chết duy nhất (Single Point of Failure):** Nếu VPS gặp sự cố, toàn bộ hệ thống ngừng hoạt động. Thời gian phục hồi phụ thuộc vào nhà cung cấp (thường 15 phút – 2 giờ).
- **Cần 1 cán bộ IT** biết Linux và Docker để vận hành cơ bản
- **File BIM lớn:** Cần theo dõi dung lượng ổ cứng, tránh đầy bất ngờ

### Giải pháp giảm thiểu rủi ro "điểm chết"

```
Backup snapshot tự động hàng ngày
    → Nếu VPS hỏng: khởi động từ snapshot trong 15–30 phút
    → Mất tối đa dữ liệu của 24 giờ (hoặc 6 giờ nếu backup thường xuyên hơn)

Giám sát uptime tự động
    → Dịch vụ miễn phí: UptimeRobot.com
    → Gửi cảnh báo Zalo/email khi web ngừng phản hồi
```

---

## 7. QUY TRÌNH TRIỂN KHAI PHƯƠNG ÁN A

### Thời gian thực hiện: 3–4 tuần

```
Tuần 1: Chuẩn bị
├── Liên hệ FPT/VNPT → Ký hợp đồng thuê VPS
├── Nhận thông tin đăng nhập VPS
├── Cài đặt Ubuntu 22.04, Docker, Nginx
└── Cấu hình tường lửa (chỉ mở port 443 và 22)

Tuần 2: Triển khai Supabase
├── Clone Supabase self-hosted (docker-compose)
├── Cấu hình biến môi trường (URL mới, JWT secret)
├── Chạy 75 migration SQL → tạo toàn bộ schema
├── Tạo 3 buckets: documents, bim-models, task-attachments
└── Deploy 3 Edge Functions (admin-user-ops, gemini-proxy, scan-virus)

Tuần 3: Di chuyển dữ liệu
├── Export database từ Supabase Cloud (pg_dump)
├── Import vào PostgreSQL mới trên VPS
├── Di chuyển files từ Supabase Storage sang MinIO
└── Kiểm tra toàn vẹn dữ liệu

Tuần 4: Kiểm thử & Cắt chuyển
├── Kiểm thử đăng nhập, phân quyền, báo cáo, BIM 3D
├── Cập nhật file .env trỏ về địa chỉ VPS mới
├── Cắt DNS (trỏ tên miền về IP VPS mới)
├── Vận hành song song 2–3 ngày
└── Tắt Supabase Cloud sau khi xác nhận ổn định
```

---

## 8. NHỮNG GÌ KHÔNG CẦN THAY ĐỔI

Đây là điểm quan trọng nhất khi trình bày với lãnh đạo:

| Thành phần | Thay đổi không? |
|---|---|
| Giao diện người dùng | ❌ Không đổi gì |
| Tính năng hệ thống | ❌ Không đổi gì |
| Cách người dùng đăng nhập | ❌ Không đổi gì |
| Dữ liệu hiện có | ❌ Không mất dữ liệu (di chuyển toàn bộ) |
| Code ứng dụng | ❌ Không đổi gì |
| Địa chỉ truy cập (domain) | ❌ Giữ nguyên tên miền |
| **Nơi lưu dữ liệu** | ✅ Chuyển từ Singapore → Việt Nam |
| **Nhà cung cấp** | ✅ Từ Supabase Inc. → FPT/VNPT/Viettel |

---

## 9. TÓM TẮT CHO LÃNH ĐẠO

**Phương án A – VPS trong nước** là lựa chọn **tiết kiệm nhất** để đưa toàn bộ dữ liệu về Việt Nam, tuân thủ Thông tư 47.

| Tiêu chí | Kết quả |
|---|---|
| Chi phí triển khai | ~17–23 triệu VNĐ (một lần) |
| Chi phí vận hành | ~4–5,3 triệu VNĐ/tháng |
| Thời gian triển khai | 3–4 tuần |
| Tuân thủ TT47 | ✅ Có |
| Rủi ro gián đoạn | Thấp–Trung bình |
| Người dùng bị ảnh hưởng | Không (chỉ down ~30 phút lúc cắt chuyển) |
| Thay đổi cách dùng | Không có gì thay đổi với người dùng |

> Nếu cơ quan muốn **dự phòng cao hơn** (uptime 99,9%), có thể nâng lên **Phương án B** (1 máy chủ vật lý dedicated) với chi phí ~10–14,5 triệu VNĐ/tháng nhưng bảo đảm SLA phần cứng từ FPT.

---

*Tài liệu xây dựng dựa trên phân tích thực tế mã nguồn hệ thống QLDA ĐTXD phiên bản 05/2026.*
*Giá VPS mang tính ước tính — cần báo giá chính thức từ nhà cung cấp.*

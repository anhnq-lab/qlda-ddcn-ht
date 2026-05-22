# PHƯƠNG ÁN HẠ TẦNG KỸ THUẬT
## Triển khai Hệ thống QLDA ĐTXD trên Máy chủ Vật lý FPT
### Đảm bảo tuân thủ Thông tư 47/2020/TT-BTTTT về An toàn Thông tin

---

> **Đơn vị:** Ban QLDA ĐTXD Công Trình Dân Dụng và Hạ Tầng Khu Vực – Tỉnh Hà Tĩnh
> **Phiên bản:** 1.0 | **Ngày:** 05/2026

---

## 1. BỐI CẢNH VÀ LÝ DO CHUYỂN ĐỔI

### 1.1 Tình trạng hiện tại

Hệ thống QLDA ĐTXD đang vận hành trên nền tảng **đám mây quốc tế** (Supabase Cloud + Vercel):

| Thành phần | Vị trí máy chủ hiện tại |
|---|---|
| Cơ sở dữ liệu (PostgreSQL) | Supabase Cloud – AWS Singapore |
| Giao diện web | Vercel – Mỹ/Châu Á |
| File lưu trữ (tài liệu, BIM) | Supabase Storage – AWS Singapore |
| Dịch vụ xác thực | Supabase Auth – AWS Singapore |

**Vấn đề:** Toàn bộ dữ liệu của cơ quan nhà nước (hồ sơ dự án, hợp đồng, tài chính, cán bộ...) đang lưu trữ trên máy chủ **đặt tại nước ngoài**.

### 1.2 Yêu cầu pháp lý – Thông tư 47/2020/TT-BTTTT

Thông tư 47/2020/TT-BTTTT của Bộ TT&TT quy định:

> *"Hệ thống thông tin của cơ quan nhà nước phải đặt máy chủ tại Việt Nam. Dữ liệu của cơ quan nhà nước không được lưu trữ trên hạ tầng đặt ở nước ngoài trừ trường hợp được cơ quan có thẩm quyền cho phép."*

**Các vi phạm tiềm ẩn nếu không chuyển đổi:**
- ❌ Dữ liệu hồ sơ đầu tư công lưu tại Singapore
- ❌ Thông tin cán bộ, lương, phân quyền lưu ngoài lãnh thổ
- ❌ Hồ sơ đấu thầu, hợp đồng không nằm trong tầm kiểm soát quốc gia
- ❌ Không kiểm soát được nhật ký truy cập (audit log) theo chuẩn Việt Nam

---

## 2. PHƯƠNG ÁN ĐỀ XUẤT: SUPABASE OPEN SOURCE + FPT DEDICATED

### 2.1 Tổng quan phương án

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRUNG TÂM DỮ LIỆU FPT                      │
│                    (Đặt tại Việt Nam – IDC FPT)                  │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │   MÁY CHỦ SỐ 1          │  │   MÁY CHỦ SỐ 2               │ │
│  │   (Ứng dụng & Dịch vụ)  │  │   (Cơ sở dữ liệu)            │ │
│  │                          │  │                              │ │
│  │  ┌────────────────────┐  │  │  ┌──────────────────────┐   │ │
│  │  │  Supabase Stack    │  │  │  │  PostgreSQL 15        │   │ │
│  │  │  ─ Auth (GoTrue)   │  │  │  │  (60+ bảng, RLS)     │   │ │
│  │  │  ─ API (PostgREST) │◄─┼──┼─►│                      │   │ │
│  │  │  ─ Realtime        │  │  │  │  pg_cron             │   │ │
│  │  │  ─ Storage (MinIO) │  │  │  │  (lịch tự động)      │   │ │
│  │  │  ─ Studio (Admin)  │  │  │  └──────────────────────┘   │ │
│  │  └────────────────────┘  │  │                              │ │
│  │                          │  │  ┌──────────────────────┐   │ │
│  │  ┌────────────────────┐  │  │  │  Backup tự động      │   │ │
│  │  │  Edge Functions    │  │  │  │  ─ Full backup: 7 ngày│   │ │
│  │  │  ─ admin-user-ops  │  │  │  │  ─ Incremental: hàng │   │ │
│  │  │  ─ gemini-proxy    │  │  │  │    giờ               │   │ │
│  │  │  ─ scan-virus      │  │  │  └──────────────────────┘   │ │
│  │  └────────────────────┘  │  │                              │ │
│  │                          │  │                              │ │
│  │  ┌────────────────────┐  │  └──────────────────────────────┘ │
│  │  │  Nginx + SSL       │  │                                  │
│  │  │  (Reverse proxy)   │  │                                  │
│  │  └────────────────────┘  │                                  │
│  └──────────────────────────┘                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  File Storage: Ổ cứng vật lý (tài liệu, BIM, ảnh)        │  │
│  │  Buckets: documents | bim-models | task-attachments       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                    Đường truyền Internet
                    (FPT Fiber, băng thông cao)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Cán bộ Ban       Nhà thầu       Lãnh đạo UBND
       (Trình duyệt)   (Trình duyệt)   (Trình duyệt)
```

### 2.2 Supabase Open Source là gì?

**Supabase** là phần mềm **mã nguồn mở hoàn toàn miễn phí** — có thể cài đặt trên bất kỳ máy chủ nào, tại Việt Nam, mà không mất phí bản quyền.

Gói phần mềm Supabase self-hosted bao gồm 8 thành phần chạy cùng nhau:

| Thành phần | Vai trò | Tương tự |
|---|---|---|
| **PostgreSQL 15** | Cơ sở dữ liệu chính | Kho lưu trữ hồ sơ |
| **PostgREST** | API tự động từ database | Cổng giao tiếp dữ liệu |
| **GoTrue (Auth)** | Xác thực, quản lý phiên đăng nhập | Bảo vệ cổng vào |
| **Realtime** | Cập nhật dữ liệu tức thời | Thông báo real-time |
| **Storage (MinIO)** | Lưu trữ file, tài liệu, BIM | Kho tài liệu số |
| **Kong** | Cổng API, điều phối lưu lượng | Trạm kiểm soát |
| **Supabase Studio** | Giao diện quản trị CSDL | Bảng điều khiển DBA |
| **pg_meta** | Quản lý metadata database | Thư mục cấu trúc |

> **Lợi thế mã nguồn mở:** Không phụ thuộc nhà cung cấp, không mất phí license, cộng đồng hỗ trợ toàn cầu, toàn quyền kiểm soát.

---

## 3. CẤU HÌNH MÁY CHỦ ĐỀ XUẤT

### Quy mô: 100–500 người dùng đồng thời

#### Máy chủ 1 – Application Server (Ứng dụng)

| Thông số | Cấu hình đề xuất | Lý do |
|---|---|---|
| **CPU** | Intel Xeon Silver 4314 – 16 cores / 32 threads | Xử lý nhiều request đồng thời |
| **RAM** | 64 GB DDR4 ECC | Docker containers + cache |
| **Ổ cứng OS** | 2x 480 GB SSD SATA RAID-1 | Hệ điều hành + Docker |
| **Ổ cứng Data** | 2x 2 TB NVMe SSD RAID-1 | File lưu trữ (tài liệu, BIM) |
| **Mạng** | 1 Gbps uplink | Đảm bảo tốc độ tải file |
| **OS** | Ubuntu Server 22.04 LTS | Ổn định, hỗ trợ dài hạn đến 2027 |

**Phần mềm chạy trên máy chủ này:**
- Docker + Docker Compose (nền tảng container)
- Nginx (reverse proxy, SSL/TLS)
- Supabase Stack (Auth, API, Realtime, Storage, Studio)
- Deno Runtime (Edge Functions: admin-user-ops, gemini-proxy, scan-virus)
- IFC Converter API (Node.js – chuyển đổi file BIM)

#### Máy chủ 2 – Database Server (Cơ sở dữ liệu)

| Thông số | Cấu hình đề xuất | Lý do |
|---|---|---|
| **CPU** | Intel Xeon Silver 4314 – 16 cores / 32 threads | Query phức tạp, nhiều bảng |
| **RAM** | 128 GB DDR4 ECC | PostgreSQL cần nhiều RAM để cache |
| **Ổ cứng OS** | 2x 480 GB SSD RAID-1 | Hệ điều hành |
| **Ổ cứng DB** | 4x 1.92 TB NVMe SSD RAID-10 | Tốc độ đọc/ghi cao, dư phòng |
| **Ổ cứng Backup** | 2x 8 TB HDD RAID-1 | Backup hàng ngày, 30 ngày lưu trữ |
| **Mạng** | 10 Gbps (nội bộ với Máy chủ 1) | Tốc độ truyền giữa 2 server |
| **OS** | Ubuntu Server 22.04 LTS | Ổn định |

**Phần mềm chạy trên máy chủ này:**
- PostgreSQL 15 (cài thẳng, không qua Docker)
- pg_cron (lịch tự động: backup, archive audit log)
- pgBackRest (công cụ backup chuyên nghiệp)
- Prometheus + Grafana (giám sát hiệu năng)

#### Tổng cộng: 2 máy chủ vật lý tại IDC FPT

---

## 4. KIẾN TRÚC BẢO MẬT

### 4.1 Phân lớp bảo mật

```
Internet
   │
   ▼
[Tường lửa vật lý – FPT Firewall]
   │  Chặn tất cả trừ port 443 (HTTPS) và 22 (SSH nội bộ)
   ▼
[Nginx – Reverse Proxy]
   │  SSL/TLS termination
   │  Rate limiting (chống brute-force đăng nhập)
   │  Header bảo mật (HSTS, CSP, XSS Protection)
   ▼
[Kong API Gateway – Supabase]
   │  Kiểm tra JWT token mỗi request
   │  Định tuyến đến đúng dịch vụ
   ▼
[PostgreSQL + RLS]
   │  69+ chính sách bảo mật cấp hàng dữ liệu
   │  Mỗi người chỉ thấy dữ liệu được phép
   ▼
[Audit Log – Bất biến]
   Ghi lại toàn bộ thao tác, lưu 12 tháng
```

### 4.2 Các lớp bảo mật đã có trong hệ thống

| Lớp bảo mật | Mô tả | Trạng thái |
|---|---|---|
| Đăng nhập JWT | Token tự hết hạn sau 8 giờ không dùng | ✅ Đã có |
| Phân quyền RBAC | Mỗi chức vụ chỉ xem/làm được phần mình | ✅ Đã có |
| Row-Level Security | 69+ chính sách bảo vệ từng hàng dữ liệu | ✅ Đã có |
| Audit Log WORM | Nhật ký thao tác bất biến, tự động lưu trữ | ✅ Đã có |
| HTTPS toàn trình | Mã hóa toàn bộ dữ liệu truyền tải | ✅ Cần cấu hình |
| Backup định kỳ | Full 7 ngày, incremental hàng giờ | ✅ Cần cấu hình |
| Tường lửa vật lý | FPT cung cấp tại IDC | ✅ FPT hỗ trợ |
| Quét virus tài liệu | Tích hợp ClamAV (mã nguồn mở) | ⚠️ Cần hoàn thiện |

---

## 5. ĐỐI CHIẾU TUÂN THỦ THÔNG TƯ 47

| Yêu cầu TT47 | Giải pháp | Đáp ứng |
|---|---|---|
| Máy chủ đặt tại Việt Nam | FPT IDC – Data center trong nước | ✅ |
| Dữ liệu không rời lãnh thổ | Supabase self-hosted, không kết nối cloud nước ngoài | ✅ |
| Nhật ký truy cập lưu tối thiểu 6 tháng | Audit Log tự động, lưu 12 tháng | ✅ |
| Phân quyền truy cập rõ ràng | RBAC + RLS 69 chính sách | ✅ |
| Mã hóa dữ liệu truyền tải | HTTPS/TLS 1.3 toàn trình | ✅ |
| Backup dữ liệu định kỳ | pgBackRest – full + incremental | ✅ |
| Phục hồi sau sự cố (DR) | Backup offsite + RTO < 4 giờ | ✅ |
| Kiểm soát truy cập vật lý | FPT IDC có hệ thống an ninh vật lý | ✅ |
| Quản lý tài khoản người dùng | Supabase Auth + admin panel | ✅ |
| Phát hiện xâm nhập | Nginx log + Grafana alert | ✅ |

---

## 6. SO SÁNH PHƯƠNG ÁN HIỆN TẠI VÀ ĐỀ XUẤT

| Tiêu chí | Hiện tại (Cloud nước ngoài) | Đề xuất (FPT Dedicated) |
|---|---|---|
| **Máy chủ vật lý** | Singapore (AWS) | Việt Nam (FPT IDC) |
| **Tuân thủ TT47** | ❌ Không | ✅ Có |
| **Chi phí hàng tháng** | ~650.000 VNĐ ($25) | ~3–23 triệu VNĐ (tùy phương án) |
| **Kiểm soát dữ liệu** | Phụ thuộc Supabase Inc. | Toàn quyền tự chủ |
| **Phí bản quyền** | Có (Supabase Cloud) | Miễn phí (mã nguồn mở) |
| **Tốc độ truy cập** | Phụ thuộc đường quốc tế | Nhanh hơn (trong nước) |
| **Bảo mật vật lý** | Không kiểm soát | FPT IDC chuẩn Tier 3 |
| **Khả năng mở rộng** | Bị giới hạn gói dịch vụ | Tự do nâng cấp |
| **Hỗ trợ tiếng Việt** | Không | FPT có đội kỹ thuật VN |
| **Thủ tục pháp lý** | Phức tạp | Đơn giản (hợp đồng trong nước) |

---

## 7. KẾ HOẠCH TRIỂN KHAI

### Giai đoạn 1 – Chuẩn bị hạ tầng (Tuần 1–2)
- [ ] Ký hợp đồng thuê máy chủ với FPT
- [ ] Cài đặt Ubuntu Server 22.04 LTS
- [ ] Cấu hình mạng nội bộ giữa 2 máy chủ (10Gbps)
- [ ] Cấu hình tường lửa (chỉ mở port 443, 22)
- [ ] Cài Docker + Docker Compose trên Máy chủ 1
- [ ] Cài PostgreSQL 15 trực tiếp trên Máy chủ 2

### Giai đoạn 2 – Triển khai Supabase (Tuần 3–4)
- [ ] Clone Supabase self-hosted repository chính thức
- [ ] Cấu hình file `docker-compose.yml` (kết nối DB máy chủ 2)
- [ ] Thiết lập biến môi trường (JWT secret, API keys mới)
- [ ] Chạy toàn bộ 75 migration SQL để tạo schema
- [ ] Cấu hình 3 storage buckets (documents, bim-models, task-attachments)
- [ ] Deploy 3 Edge Functions (admin-user-ops, gemini-proxy, scan-virus)
- [ ] Cài Nginx + chứng chỉ SSL (Let's Encrypt hoặc Sectigo)

### Giai đoạn 3 – Di chuyển dữ liệu (Tuần 5)
- [ ] Export toàn bộ dữ liệu từ Supabase Cloud (pg_dump)
- [ ] Import vào PostgreSQL mới trên FPT
- [ ] Di chuyển files từ Supabase Storage → MinIO trên FPT
- [ ] Kiểm tra toàn vẹn dữ liệu (hash verification)

### Giai đoạn 4 – Kiểm thử & Cắt chuyển (Tuần 6)
- [ ] Kiểm thử toàn bộ tính năng (đăng nhập, phân quyền, báo cáo, BIM)
- [ ] Kiểm thử tải (100 người dùng đồng thời)
- [ ] Cập nhật biến môi trường frontend trỏ về địa chỉ FPT mới
- [ ] Cắt DNS: trỏ tên miền về IP máy chủ FPT
- [ ] Vận hành song song 1 tuần trước khi tắt hệ thống cũ
- [ ] Tắt Supabase Cloud sau khi xác nhận ổn định

### Giai đoạn 5 – Vận hành (Tuần 7+)
- [ ] Thiết lập monitoring (Grafana + Prometheus)
- [ ] Cấu hình cảnh báo qua email/Zalo khi có sự cố
- [ ] Tài liệu hóa quy trình vận hành
- [ ] Đào tạo cán bộ IT vận hành hệ thống

**Tổng thời gian:** ~6–8 tuần

---

## 8. CHI PHÍ ƯỚC TÍNH

### Tại sao chi phí tăng so với Supabase Cloud $25/tháng?

**Supabase Cloud Pro $25/tháng** là dịch vụ dùng chung (shared infrastructure): hàng nghìn khách hàng cùng dùng một cụm máy chủ khổng lồ của AWS, chi phí được chia đều nên rất rẻ. Khi tự đặt máy chủ riêng, bạn **thuê toàn bộ phần cứng vật lý** cho riêng mình — giá tất nhiên cao hơn.

Đây là sự đánh đổi có chủ đích: **tuân thủ pháp lý và chủ quyền dữ liệu** thay vì tiết kiệm chi phí thuần túy.

### Ba phương án chi phí tùy ngân sách

#### Phương án A – VPS trong nước (tiết kiệm nhất, đáp ứng TT47)

> Thuê máy chủ ảo (VPS) tại các nhà cung cấp Việt Nam: FPT, VNPT, Viettel, CMC

| Hạng mục | Chi phí/tháng |
|---|---|
| 1 VPS: 8 vCPU, 32GB RAM, 500GB SSD | ~2.500.000 – 4.000.000 VNĐ |
| Băng thông + IP tĩnh | ~500.000 VNĐ |
| **TỔNG/THÁNG** | **~3–4,5 triệu VNĐ** |

- ✅ Đáp ứng TT47 (máy chủ vật lý tại Việt Nam)
- ✅ Rẻ hơn nhiều so với thuê dedicated
- ⚠️ Không có dự phòng phần cứng vật lý (nếu node VPS hỏng cần chờ nhà cung cấp)
- ⚠️ Phù hợp cho quy mô dưới 200 người dùng đồng thời

#### Phương án B – 1 Máy chủ vật lý FPT Dedicated (cân bằng)

| Hạng mục | Chi phí/tháng |
|---|---|
| 1 máy chủ vật lý: 16 core, 64GB RAM, 2TB NVMe | ~8.000.000 – 12.000.000 VNĐ |
| Băng thông 100Mbps + IP tĩnh | ~2.500.000 VNĐ |
| **TỔNG/THÁNG** | **~10–14,5 triệu VNĐ** |

- ✅ Đáp ứng TT47, máy chủ vật lý riêng
- ✅ Phù hợp 100–300 người dùng
- ✅ Toàn quyền kiểm soát phần cứng
- ⚠️ Nếu máy hỏng cần thời gian sửa/thay thế (FPT thường cam kết 4–8 giờ)

#### Phương án C – 2 Máy chủ vật lý FPT Dedicated (dự phòng cao)

| Hạng mục | Chi phí/tháng |
|---|---|
| Máy chủ 1 (Application): 16 core, 64GB RAM | ~8.000.000 VNĐ |
| Máy chủ 2 (Database): 16 core, 128GB RAM | ~12.000.000 VNĐ |
| Băng thông + IP tĩnh | ~2.500.000 VNĐ |
| **TỔNG/THÁNG** | **~22–23 triệu VNĐ** |

- ✅ Dự phòng cao nhất, tách biệt Application và Database
- ✅ Phù hợp 300–500+ người dùng, yêu cầu uptime cao
- ✅ Chuẩn enterprise cho cơ quan nhà nước cấp tỉnh

### So sánh tổng thể

| | Supabase Cloud Pro | Phương án A (VPS) | Phương án B (1 Dedicated) | Phương án C (2 Dedicated) |
|---|---|---|---|---|
| **Chi phí/tháng** | $25 (~650.000 VNĐ) | ~3–4,5 triệu | ~10–14,5 triệu | ~22–23 triệu |
| **Tuân thủ TT47** | ❌ Không | ✅ Có | ✅ Có | ✅ Có |
| **Máy chủ tại VN** | ❌ Singapore | ✅ Việt Nam | ✅ Việt Nam | ✅ Việt Nam |
| **Phí bản quyền** | Có (trả Supabase Inc.) | Miễn phí | Miễn phí | Miễn phí |
| **Dự phòng** | AWS multi-AZ | Thấp | Trung bình | Cao |
| **Phù hợp quy mô** | Không giới hạn | <200 users | 100–300 users | 300–500+ users |
| **Rủi ro pháp lý** | **Cao** | Thấp | Thấp | Thấp |

### Khuyến nghị

Với quy mô **100–500 người dùng** và yêu cầu tuân thủ TT47 của cơ quan nhà nước:

- **Ngắn hạn / ngân sách hạn chế:** Phương án A (VPS ~3–4,5 triệu/tháng) — vừa tuân thủ pháp lý vừa tiết kiệm
- **Dài hạn / tiêu chuẩn cơ quan nhà nước:** Phương án B (1 dedicated ~10–14,5 triệu/tháng) — ổn định, kiểm soát cao
- **Nếu yêu cầu SLA cao:** Phương án C (2 dedicated ~22–23 triệu/tháng)

> *Giá thực tế cần báo giá chính thức từ FPT. Thường có chiết khấu 10–20% khi ký hợp đồng 1–3 năm.*

---

## 9. RỦI RO VÀ GIẢI PHÁP GIẢM THIỂU

| Rủi ro | Xác suất | Tác động | Giải pháp |
|---|---|---|---|
| Mất điện tại IDC | Thấp | Cao | FPT IDC Tier 3 có UPS + máy phát dự phòng |
| Lỗi phần cứng | Thấp | Cao | RAID-1/10 + backup hàng ngày + bảo hành FPT |
| Hết dung lượng đột ngột | Trung bình | Trung bình | Giám sát tự động, cảnh báo khi >80% |
| Tấn công mạng | Trung bình | Cao | Tường lửa + rate limiting + Fail2ban |
| Lỗi cập nhật phần mềm | Thấp | Trung bình | Test trên môi trường staging trước |
| Thiếu nhân lực IT vận hành | Trung bình | Trung bình | Tài liệu hóa + hợp đồng hỗ trợ với FPT |

---

## 10. YÊU CẦU VỀ NHÂN SỰ VẬN HÀNH

### Cán bộ IT cần có kỹ năng:

| Kỹ năng | Mức độ cần thiết | Có thể đào tạo |
|---|---|---|
| Linux cơ bản (Ubuntu) | Bắt buộc | 2 tuần |
| Docker / Docker Compose | Bắt buộc | 1 tuần |
| PostgreSQL cơ bản | Bắt buộc | 2 tuần |
| Nginx cấu hình | Trung bình | 1 tuần |
| Backup & Restore | Bắt buộc | 1 tuần |
| Giám sát Grafana | Khuyến nghị | 1 tuần |

**Đề xuất:** 1–2 cán bộ IT chuyên trách với hợp đồng hỗ trợ kỹ thuật từ FPT cho các tình huống phức tạp.

---

## 11. KẾT LUẬN VÀ KHUYẾN NGHỊ

### Phương án đề xuất là phù hợp và khả thi vì:

1. **Tuân thủ pháp lý:** Đáp ứng đầy đủ Thông tư 47/2020/TT-BTTTT, giảm rủi ro pháp lý cho cơ quan
2. **Chủ quyền dữ liệu:** Toàn bộ dữ liệu nhà nước nằm trên lãnh thổ Việt Nam, dưới sự kiểm soát trực tiếp
3. **Chi phí phần mềm = 0:** Supabase mã nguồn mở, không phí bản quyền
4. **Tốc độ cải thiện:** Máy chủ trong nước giúp giảm độ trễ truy cập
5. **Không thay đổi ứng dụng:** Supabase self-hosted 100% tương thích với code hiện tại — chỉ cần đổi địa chỉ server
6. **FPT uy tín:** Đối tác CNTT lớn tại Việt Nam, có kinh nghiệm phục vụ cơ quan nhà nước

### Bước tiếp theo:

- [ ] Phê duyệt phương án kỹ thuật
- [ ] Liên hệ FPT để báo giá chính thức theo cấu hình đề xuất
- [ ] Lập kế hoạch ngân sách triển khai
- [ ] Thành lập ban kỹ thuật triển khai (IT Ban + FPT)
- [ ] Xây dựng kế hoạch chi tiết theo tiến độ

---

*Tài liệu này được xây dựng dựa trên phân tích thực tế mã nguồn hệ thống QLDA ĐTXD phiên bản hiện tại.*
*Mọi số liệu chi phí mang tính ước tính, cần xác nhận với FPT trước khi ra quyết định chính thức.*

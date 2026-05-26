# Thiết kế Kiến trúc Supabase Self-Hosted trên FPT Cloud (QCVN 12:2026/BCA)

Tài liệu này đặc tả phương án kiến trúc triển khai hệ thống cơ sở dữ liệu và lưu trữ tài liệu điện tử **Supabase Self-Hosted** trên hạ tầng điện toán đám mây **FPT Cloud**, nhằm đáp ứng Quy chuẩn kỹ thuật quốc gia **QCVN 12:2026/BCA** về An ninh mạng cho hệ thống thông tin lưu trữ tài liệu điện tử.

---

## 1. Mô hình Kiến trúc Vật lý & Logic (FPT Cloud Infrastructure)

Hệ thống được thiết kế chạy hoàn toàn trong môi trường mạng an toàn, cô lập độc lập trên FPT Cloud.

```mermaid
flowchart TD
    subgraph Internet ["Môi trường bên ngoài (Internet)"]
        UserClient["Máy trạm người dùng (Trình duyệt)"]
        AdminClient["Thiết bị Quản trị viên (Admin VPN)"]
    end

    subgraph FPT_Cloud ["Hạ tầng FPT Cloud (Tier III Datacenter Việt Nam)"]
        subgraph FPT_VPC ["FPT Virtual Private Cloud (VPC)"]
            
            FPT_LB["FPT Load Balancer (HTTPS TLS 1.3 / WAF)"]
            
            subgraph Public_Subnet ["Public Subnet (Giới hạn truy cập qua LB)"]
                Kong_GW["Kong API Gateway (Container)"]
            end
            
            subgraph Private_Subnet ["Private Subnet (Cô lập hoàn toàn)"]
                subgraph App_Node ["App VM - Docker Host (FPT Elastic Compute)"]
                    GoTrue["Supabase Auth / GoTrue (MFA / JWT)"]
                    PostgREST["PostgREST (REST API)"]
                    Storage_API["Supabase Storage API"]
                    Kong_GW --> GoTrue
                    Kong_GW --> PostgREST
                    Kong_GW --> Storage_API
                end
                
                subgraph DB_Node ["Database VM - PostgreSQL (FPT Elastic Compute)"]
                    PostgreSQL[("PostgreSQL 15+ DB \n (pgAudit / pg_cron)")]
                    PostgREST --> PostgreSQL
                    GoTrue --> PostgreSQL
                    Storage_API --> PostgreSQL
                end
            end
            
            FPT_VPN["FPT VPN Gateway (IPsec / SSL VPN)"]
        end

        subgraph FPT_Storage ["FPT Object Storage (S3 API)"]
            Bucket_L1_L2["Bucket Dữ liệu Thường \n (Nhạy cảm Mức 1 & 2)"]
            Bucket_L3_L4["Bucket Dữ liệu Nhạy cảm \n (Nhạy cảm Mức 3 & 4 \n SSE-S3 Encrypted)"]
            Bucket_Logs["Bucket Nhật ký Hệ thống \n (Object Lock / WORM \n Khóa 12 tháng)"]
            Bucket_Backups["Bucket Sao lưu Dữ liệu \n (Object Lock / WORM \n Khóa 12 tháng)"]
            
            Storage_API --> Bucket_L1_L2
            Storage_API --> Bucket_L3_L4
        end
    end

    %% Connections
    UserClient -->|HTTPS / Port 443| FPT_LB
    FPT_LB --> Kong_GW
    AdminClient -->|MFA + VPN Tunnel| FPT_VPN
    FPT_VPN -->|SSH / SSH Port 2222 / DB Direct| Private_Subnet
    
    %% Shipping Logs
    App_Node -->|Ship Logs encrypted| Bucket_Logs
    DB_Node -->|pgAudit Logs encrypted| Bucket_Logs
    DB_Node -->|Backup Dump| Bucket_Backups
```

### Chi tiết các cấu phần hạ tầng:
1. **FPT Virtual Private Cloud (VPC):** Cô lập hoàn toàn hệ thống cơ sở dữ liệu và máy chủ ứng dụng khỏi Internet.
2. **FPT Load Balancer (WAF Integrated):** 
   - Giải mã SSL/TLS tại Load Balancer (chỉ chấp nhận TLS 1.3 với strong ciphers).
   - Tích hợp Tường lửa ứng dụng web (WAF) để lọc tấn công SQL Injection, XSS, và giới hạn số lượng kết nối đồng thời từ một IP nguồn để chống DDoS (đáp ứng **Điều 3.10.2.2.3**).
3. **FPT Elastic Compute (Virtual Machines):**
   - **App Server (VM1):** Chạy Docker Engine chạy các container thành phần của Supabase: Kong Gateway, GoTrue (Auth), PostgREST, Storage API.
   - **Database Server (VM2):** Máy chủ chuyên biệt chạy PostgreSQL với ổ đĩa SSD hiệu năng cao, tách biệt vật lý/logic với máy chủ ứng dụng để tối ưu bảo mật DB (đáp ứng **Điều 3.7.2.7.3**).
4. **FPT Object Storage:**
   - Dịch vụ lưu trữ đối tượng tương thích S3 API, đảm bảo lưu trữ toàn bộ dữ liệu vật lý tại Việt Nam (đáp ứng **Điều 2.2.16.1.4**).
   - Hỗ trợ tính năng **Object Lock (WORM - Write Once Read Many)** ở chế độ Compliance Mode để bảo đảm nhật ký và bản sao lưu không thể bị xóa hoặc sửa đổi (đáp ứng **Điều 2.2.9.2.1** và **Điều 2.2.12.2.2**).

---

## 2. Bản Đồ Ánh Xạ Đáp Ứng QCVN 12:2026/BCA

| Điều khoản QCVN 12 | Yêu cầu Kỹ thuật chính | Giải pháp Thực tế trên Supabase & FPT Cloud |
| :--- | :--- | :--- |
| **2.2.5.4** | **Tính toàn vẹn của tài liệu:** <br>- Đảm bảo không bị sửa đổi trái phép.<br>- Tạo và lưu trữ mã băm SHA-256 duy nhất.<br>- Kiểm tra mã băm định kỳ tự động.<br>- Tự động phục hồi khi phát hiện mất toàn vẹn. | - Khi tải file lên Supabase Storage, một trigger trên bảng `storage.objects` sẽ tự động tính mã băm SHA-256 của file và lưu vào bảng `cde_document_integrity` (bảng cấu hình Read-Only).<br>- Cấu hình **pg_cron** chạy script SQL hàng đêm quét và so sánh mã băm hiện tại của file vật lý trong Object Storage với mã băm gốc lưu trong DB.<br>- Nếu phát hiện lệch, cron job gửi cảnh báo (Slack/Email/SMS) và tự động kéo file gốc từ bản sao lưu gần nhất để khôi phục. |
| **2.2.5.5 & 3.5.2.2.7** | **Tách biệt và mã hóa dữ liệu nhạy cảm:** <br>- Tách biệt môi trường lưu trữ mức độ nhạy cảm 3 & 4.<br>- Mã hóa dữ liệu khi lưu trữ. | - Tạo 2 Storage Buckets riêng biệt trên FPT Object Storage: `documents-standard` (Mức 1 & 2) và `documents-sensitive` (Mức 3 & 4).<br>- Kích hoạt mã hóa phía máy chủ (SSE-S3 hoặc SSE-C với khóa quản lý riêng biệt) cho bucket dữ liệu nhạy cảm.<br>- Áp dụng chính sách Row Level Security (RLS) nghiêm ngặt trong Postgres, chặn tài khoản thông thường xem dữ liệu nhạy cảm trừ khi được duyệt bởi luồng phê duyệt (Approval Flow). |
| **2.2.7 & 3.7.2.6** | **Quản lý Tài khoản & Đăng nhập an toàn:**<br>- MFA bắt buộc cho admin và truy cập ngoài mạng.<br>- Khóa phiên sau thời gian rảnh (5 phút admin, 15 phút user).<br>- Khóa tài khoản sau tối đa 5 lần đăng nhập sai.<br>- Thời gian khóa tối thiểu 12 giờ. | - Kích hoạt tính năng Multi-Factor Authentication (MFA) dùng thuật toán TOTP trong cấu hình GoTrue.<br>- Frontend React tự động gọi API đăng xuất (`supabase.auth.signOut()`) sau 15 phút không có hoạt động (15 phút đối với user, 5 phút đối với phiên quản trị hệ thống).<br>- Cấu hình GoTrue tự động khóa tài khoản sau 5 lần đăng nhập sai liên tiếp, thời gian khóa là 12 giờ (cấu hình qua biến môi trường). |
| **2.2.9 & 3.9.2.2** | **Nhật ký An ninh mạng Bất biến (WORM):**<br>- Ghi nhật ký đầy đủ (truy cập, tiến trình, cấu hình).<br>- Lưu trữ nhật ký tối thiểu 12 tháng.<br>- Sử dụng cơ chế ghi một lần đọc nhiều lần (WORM).<br>- MFA cho hành động xóa hoặc sửa cấu hình nhật ký. | - Cấu hình Fluentd/Logstash gom toàn bộ log của các container Supabase và log của PostgreSQL.<br>- Đẩy log định kỳ lên FPT Object Storage Bucket `sys-audit-logs` đã bật **Object Lock** với thời gian retention là 12 tháng (365 ngày). Trong thời gian này, không một ai (kể cả admin) có thể xóa hay sửa đổi các file log này.<br>- Kích hoạt **pgAudit** trên PostgreSQL để ghi lại mọi câu lệnh SQL truy vấn vào bảng dữ liệu nhạy cảm nhãn mức 3 & 4. |
| **2.2.12.2.2** | **Chiến lược Sao lưu 3-2-1:**<br>- Giữ ít nhất 3 bản sao dữ liệu.<br>- Trên 2 phương tiện lưu trữ khác nhau.<br>- Tách biệt địa lý.<br>- Ít nhất 1 bản sao trên vật mang tin không ghi đè (WORM) ở ngoài data center chính.<br>- Cách ly vật lý hoặc tài khoản (Air-gap). | - **Bản sao 1:** Dữ liệu hoạt động trực tiếp (Active Database) tại FPT Cloud Datacenter Hà Nội.<br>- **Bản sao 2:** Bản sao lưu hàng ngày (daily dump) được ghi trực tiếp vào FPT Object Storage tại Hà Nội, cấu hình bật Object Lock (WORM).<br>- **Bản sao 3 (Địa lý & Air-gap):** Script tự động đồng bộ bản sao lưu sang một vùng địa lý độc lập (FPT Cloud Datacenter TP.HCM) và đồng thời tải về một máy chủ NAS chuyên dụng tại văn phòng BQLDA (sử dụng mạng VPN chuyên dụng, sau khi sync xong sẽ ngắt kết nối vật lý logic tự động để đảm bảo Air-gap). |
| **2.2.16** | **Quản lý Nhà cung cấp (FPT Cloud):**<br>- Hạ tầng vật lý đặt tại Việt Nam.<br>- Mã hóa kết nối mở rộng (VPN IPsec).<br>- Cơ chế hủy dữ liệu an toàn triệt để (NIST 800-88). | - FPT Cloud có 2 trung tâm dữ liệu chuẩn Tier III đặt tại Hà Nội và TP.HCM đáp ứng 100% việc lưu trữ dữ liệu trong lãnh thổ Việt Nam.<br>- Toàn bộ dữ liệu truyền tải giữa client và server hoặc giữa hai site dự phòng đều được mã hóa bằng IPsec VPN hoặc TLS 1.3.<br>- Khi thực hiện hủy dữ liệu, sử dụng tính năng mã hóa phong tỏa (crypto-shredding) - xóa bỏ hoàn toàn khóa mã hóa của bucket/disk để đảm bảo dữ liệu không thể khôi phục theo tiêu chuẩn NIST SP 800-88. |
| **2.2.22** | **Đảm bảo Dấu thời gian (Timestamping):**<br>- Sử dụng giờ chuẩn UTC.<br>- Đồng bộ thời gian qua máy chủ NTP tin cậy. | - Cấu hình toàn bộ máy chủ ảo FPT Elastic Compute chạy Docker và Database sử dụng timezone UTC.<br>- Cài đặt dịch vụ **Chrony** hoặc **NTPD** trên các máy chủ ảo để đồng bộ thời gian liên tục với máy chủ NTP quốc gia Việt Nam (`vtp.vn` hoặc máy chủ NTP nội bộ của FPT Cloud). |

---

## 3. Lộ trình Triển khai Chi tiết

```mermaid
gantt
    title Lộ trình Di chuyển và Đánh giá An ninh mạng QCVN 12
    dateFormat  YYYY-MM-DD
    section Giai đoạn 1: Chuẩn bị & Thiết lập
    Khởi tạo hạ tầng FPT Cloud VPC & VMs  :active, des1, 2026-06-01, 5d
    Cài đặt Supabase Stack & pgAudit        :des2, 2026-06-06, 4d
    Cấu hình Object Storage WORM Buckets    :des3, 2026-06-10, 3d
    section Giai đoạn 2: Phát triển & Cấu hình Security
    Cài đặt cơ chế kiểm tra SHA-256 & cron :des4, 2026-06-13, 5d
    Cấu hình GoTrue MFA & Session Timeout   :des5, 2026-06-18, 3d
    Thiết lập đường truyền VPN & SSL LB     :des6, 2026-06-21, 4d
    section Giai đoạn 3: Di chuyển & Đồng bộ Dữ liệu
    Chuyển đổi dữ liệu nháp (Dry-run Migration) :des7, 2026-06-25, 3d
    Chạy thử nghiệm backup & khôi phục thảm họa BCP/DR: des8, 2026-06-28, 3d
    section Giai đoạn 4: Đánh giá & Go-live
    Đánh giá an ninh mạng độc lập (Kiểm thử xâm nhập): des9, 2026-07-01, 5d
    Go-live chính thức (DNS Cutover sang FPT Cloud): des10, 2026-07-06, 1d
```

### Các bước di chuyển dữ liệu (Database Migration Steps):
1. **Khóa ghi (Read-Only Mode):** Chuyển ứng dụng hiện tại sang chế độ chỉ đọc để tránh phát sinh dữ liệu mới trong quá trình di chuyển.
2. **Xuất bản sao lưu gốc (Database Dump):** 
   ```bash
   # Dump schema và dữ liệu từ Supabase Cloud cũ
   supabase db dump --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" -f schema_and_data.sql
   ```
3. **Nhập dữ liệu vào hệ thống Self-Hosted mới:**
   ```bash
   # Restore vào PostgreSQL của FPT Cloud (VM2)
   psql -h [FPT_DB_PRIVATE_IP] -U postgres -d postgres -f schema_and_data.sql
   ```
4. **Di chuyển Storage (Storage Sync):** Sử dụng công cụ rclone để đồng bộ các file tài liệu từ AWS S3 (hoặc Storage của Supabase Cloud cũ) sang FPT Object Storage Buckets.
   ```bash
   rclone sync source:supabase-storage fpt:documents-standard --progress
   ```
5. **Cập nhật biến môi trường Frontend:** Trỏ `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` về địa chỉ FPT Load Balancer mới.

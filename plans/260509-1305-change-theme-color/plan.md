# Plan: Thay đổi màu sắc chủ đạo hệ thống (Global Theme Remapping)
Created: 2026-05-09 13:05:42+07:00
Status: 🟡 In Progress (Planning & Vibe Selection)

## Overview
Lập kế hoạch và thực thi việc thay đổi màu sắc chủ đạo (Primary Theme Color) của toàn bộ hệ thống phần mềm **CIC QLDA (Hệ thống quản lý dự án đầu tư xây dựng)** một cách đồng bộ, an toàn và tối ưu visual nhất. 

Nhờ vào cấu trúc thiết kế hiện tại của dự án:
- Màu `primary` trong `tailwind.config.js` được ánh xạ trực tiếp từ các CSS Variables (`var(--color-primary-*)`) trong `index.css`.
- Việc thay đổi màu sắc chủ đạo có thể được thực hiện **nhanh chóng bằng cách thay đổi giá trị của 10 nấc màu (scale 50-900) tại `index.css`**, kết hợp với việc cập nhật các biến liên quan như hiệu ứng shadow glow và cấu hình Recharts.

---

## 🎨 Đề xuất 4 Bộ màu Premium & Chuyên nghiệp (Vibe Selection)
Dựa trên hướng dẫn từ Skill `ui-ux-pro-max` về hệ thống ERP, xây dựng và quản lý dự án đầu tư, chúng ta có 4 bộ màu cực kỳ sang trọng để thay thế cho tông màu **Cam đất (Orange Scale)** hiện tại:

### 1. Corporate Emerald & Teal (Tông Xanh Ngọc lục bảo & Xanh mòng két)
*   **Vibe:** Đại diện cho công trình xanh (Green Building), tính bền vững, môi trường đầu tư an toàn, hiện đại và chuẩn mực kỹ thuật cao.
*   **Primary 500 (Base):** `#059669` (Emerald 600) hoặc `#0D9488` (Teal 600)
*   **Shadow Glow:** `rgba(5, 150, 105, 0.2)`
*   **Ứng dụng:** Thích hợp nhất cho quản lý dự án hạ tầng công cộng, năng lượng, và đô thị thông minh.

### 2. High-Tech Cyan & Ocean Blue (Tông Xanh biển sâu công nghệ)
*   **Vibe:** Hiện đại, tin cậy tuyệt đối, chuyên nghiệp của các nền tảng SaaS hàng đầu thế giới, mang phong cách số hóa toàn diện.
*   **Primary 500 (Base):** `#2563EB` (Blue 600) hoặc `#0284C7` (Sky 600)
*   **Shadow Glow:** `rgba(37, 99, 235, 0.2)`
*   **Ứng dụng:** Phù hợp với các phần mềm ERP quản lý tài chính dự án, đấu thầu, và CDE (Common Data Environment) số hóa.

### 3. Luxury Gold & Warm Charcoal (Tông Vàng kim hoàng gia & Than ấm)
*   **Vibe:** Cực kỳ đẳng cấp, uy tín, hoàng gia và sang trọng, lấy cảm hứng từ kiến trúc tân cổ điển và các dự án bất động sản siêu sang (phù hợp với định hướng trong `MASTER.md` ban đầu).
*   **Primary 500 (Base):** `#D4A017` (Gold 500)
*   **Shadow Glow:** `rgba(212, 160, 23, 0.2)`
*   **Ứng dụng:** Thích hợp nếu đối tác là các tập đoàn bất động sản lớn, ban quản lý dự án trọng điểm, ban quản lý HCMA.

### 4. Deep Violet & Platinum (Tông Tím đậm hoàng gia & Bạch kim)
*   **Vibe:** Sáng tạo, độc bản, cao cấp, mang tính tương lai và đột phá công nghệ cao.
*   **Primary 500 (Base):** `#7C3AED` (Violet 600)
*   **Shadow Glow:** `rgba(124, 58, 237, 0.2)`
*   **Ứng dụng:** Thích hợp cho các dự án kết hợp AI, quản lý mô hình BIM 3D/4D/5D tiên tiến nhất.

---

## 📈 Lộ trình triển khai (Phases)

| Phase | Name | Description | Status | Progress |
|-------|------|-------------|--------|----------|
| **01** | [Palette Selection](./phase-01-palette-selection.md) | Giới thiệu các mã hex chi tiết cho 4 phương án màu chủ đạo và hướng dẫn chọn vibe. | 🟡 In Progress | 20% |
| **02** | [CSS Variables Remapping](./phase-02-css-remapping.md) | Cập nhật bộ màu mới vào `:root` và `.dark` trong file `index.css`. | ⬜ Pending | 0% |
| **03** | [Component Audit & Shadows](./phase-03-component-audit.md) | Rà soát các hiệu ứng bóng đổ (`--shadow-primary`, `glow`) và các class màu cứng trong Tailwind (nếu có). | ⬜ Pending | 0% |
| **04** | [Contrast & Visual QA](./phase-04-testing-qa.md) | Kiểm tra độ tương phản WCAG AA (tối thiểu 4.5:1), khả năng hiển thị của Recharts và dark mode, hoàn tất nghiệm thu. | ⬜ Pending | 0% |

---

## ⚡ Các lệnh điều hướng nhanh (AWF Quick Commands)
- Chọn bộ màu và chuyển tiếp: `/code phase-01`
- Áp dụng thay đổi CSS: `/code phase-02`
- Kiểm tra tiến độ dự án: `/next`
- Lưu lại tri thức thiết kế: `/save-brain`

---

## 📝 Xác nhận kế hoạch
Tôi đã tạo chi tiết tài liệu kế hoạch và các phases thực thi ngay trong thư mục `plans/260509-1305-change-theme-color/` của dự án để tiện theo dõi. 

Vui lòng xem chi tiết các đề xuất màu tại **[Phase 1: Palette Selection](./phase-01-palette-selection.md)** và chọn phương án bạn mong muốn nhất!

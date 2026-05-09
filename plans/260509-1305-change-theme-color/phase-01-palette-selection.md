# Phase 01: Palette Selection (Lựa chọn bảng màu)
Status: 🟢 Completed
Dependencies: None

## Objective
Lựa chọn bộ màu sắc chủ đạo mới dựa trên ảnh chụp giao diện **Nordic Slate & Powder Blue (Scandinavian Minimalist)** do người dùng cung cấp. Đạt tiêu chuẩn tương phản WCAG AA trở lên, tương thích hoàn toàn với chế độ Light Mode & Dark Mode của CIC QLDA.

---

## 🎨 Thông số bảng màu Nordic Slate (Ảnh người dùng cung cấp)

Chúng ta chọn một dải màu từ 50 đến 900 để đồng bộ cho toàn bộ CSS Variables và các Tailwind class:

| Token | Hex Code | Tên màu / Phong cách | Vai trò thiết kế |
|-------|----------|----------------------|------------------|
| `primary-50` | `#eff6fc` | Ice Blue / Powder | Nền hover nhẹ, badge cực sáng |
| `primary-100` | `#dbeafe` | Light Steel | Nền badge trạng thái, hover nhẹ |
| `primary-200` | `#b9d9eb` | Soft Denim | Viền mờ, card phụ, hover border |
| `primary-300` | `#8fbeee` | Medium Denim | Highlight nhạt, viền trang trí |
| `primary-400` | `#5eade2` | Bright Sky | Màu bổ trợ, màu nhấn chart |
| `primary-500` | `#4a90e2` | Classic Nordic Blue | Màu thương hiệu gốc (Primary-500) |
| `primary-600` | `#357abd` | Steel Muted Blue | Nút bấm chính, CTA chính |
| `primary-700` | `#245e96` | Deep Muted Blue | Hover nút bấm chính |
| `primary-800` | `#1c456c` | Dark Slate Blue | Tiêu đề chính, text quan trọng |
| `primary-900` | `#112d4e` | Midnight Navy | Nền tối, sidebar, text cực đậm |

---

## 💡 Chỉ số RGB cho Shadows & Glows (Tính toán dựa trên Thang màu mới)
- **`primary-500` (Classic Nordic Blue):** `74 144 226`
- **`primary-600` (Steel Muted Blue):** `53 122 189`
- **`primary-700` (Deep Muted Blue):** `36 94 150`

---

## 🚀 Trạng thái thực thi
- [x] Lấy mẫu màu từ ảnh người dùng -> **🟢 Completed**
- [x] Thiết lập thang đo 50-900 nhất quán -> **🟢 Completed**
- [x] Chốt phương án màu sắc của hệ thống -> **🟢 Completed**

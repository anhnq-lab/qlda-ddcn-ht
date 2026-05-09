# Phase 02: Global Configuration Update (Cập nhật Cấu hình Toàn cục)
Status: 🟡 In Progress
Dependencies: Phase 01 (Completed)

## Objective
Thay đổi thang đo màu `--color-primary-*` trong `index.css` sang **Nordic Slate & Powder Blue (Scandinavian Minimalist)** và cập nhật các shadow, focus-ring liên quan.

## 📝 Nhật ký thay đổi (index.css)

### 1. Thang đo màu Primary mới
```css
  /* Primary Colors — Nordic Slate & Powder Blue Scale (Theme ảnh chụp màn hình cực kỳ trang nhã) */
  --color-primary-50: #eff6fc;
  --color-primary-100: #dbeafe;
  --color-primary-200: #b9d9eb;
  --color-primary-300: #8fbeee;
  --color-primary-400: #5eade2;
  --color-primary-500: #4a90e2;
  --color-primary-600: #357abd;
  --color-primary-700: #245e96;
  --color-primary-800: #1c456c;
  --color-primary-900: #112d4e;
```

### 2. Cập nhật Shadow Glow (RGB: 74 144 226 cho primary-500)
- **Light Mode:**
  - `--shadow-glow`: `0 0 20px rgb(74 144 226 / 0.2)`
  - `--shadow-primary`: `0 10px 25px -5px rgb(74 144 226 / 0.3)`
- **Dark Mode:**
  - `--shadow-glow`: `0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(74, 144, 226, 0.08)`
  - `--shadow-primary`: `0 10px 25px -5px rgb(74 144 226 / 0.15), 0 0 0 1px rgb(74 144 226 / 0.1)`

### 3. Cập nhật Selection & Button Hover Shadow
- **Selection:** `background-color: #357abd` (primary-600)
- **Primary Button shadows:**
  - `box-shadow` gốc: `rgba(53, 122, 189, 0.39)` (primary-600)
  - `box-shadow` hover: `rgba(74, 144, 226, 0.45)` (primary-500)
  - `box-shadow` active: `rgba(36, 94, 150, 0.3)` (primary-700)

---

## 🚀 Trạng thái thực thi
- [ ] Cập nhật `index.css` (Thang đo màu sắc gốc + Selection) -> **Sắp thực hiện**
- [ ] Cập nhật shadow RGB trong Light Mode & Dark Mode -> **Sắp thực hiện**
- [ ] Cập nhật `box-shadow` trong class `.btn-primary` -> **Sắp thực hiện**

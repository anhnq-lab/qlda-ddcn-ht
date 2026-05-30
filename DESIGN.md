---
version: alpha
name: CIC QLDA — Hệ thống Quản lý Dự án Đầu tư Xây dựng
description: >
  Design system cho phần mềm quản lý dự án đầu tư xây dựng của Ban Điều phối
  dự án đô thị Hồ Chí Minh (Ban DDCN). Phong cách Corporate Elegant &
  Utilitarian — chuyên nghiệp, dữ liệu dày đặc, đáng tin cậy.

colors:
  # ── Brand / Primary ────────────────────────────────────────────────────────
  primary:        "#00668c"   # Teal xanh dương — CTA, active tabs, key highlights
  primary-light:  "#3995b8"   # Hover nhạt của primary
  primary-dark:   "#00415a"   # Hover đậm / pressed
  primary-subtle: "#d4eaf7"   # Background badge / highlight nhẹ

  # ── Accent — Đỏ cờ (Branding HCMA) ─────────────────────────────────────────
  accent:         "#AE1E23"   # Đỏ cờ — tiêu đề tổ chức, badge quan trọng
  accent-light:   "#D42A30"   # Hover accent
  accent-bg:      "#fde3e3"   # Nền badge accent nhẹ

  # ── Gold — Gradient / Border đặc biệt ───────────────────────────────────────
  gold:           "#D4A017"   # Gold brand (dùng cho gradient, border highlight)
  gold-dark:      "#B8860B"   # Hover gold

  # ── Semantic Status ──────────────────────────────────────────────────────────
  success:        "#10b981"   # Hoàn thành, đã duyệt, healthy
  warning:        "#f59e0b"   # Đang thực hiện, cảnh báo
  danger:         "#ef4444"   # Lỗi, quá hạn, từ chối
  info:           "#3b82f6"   # Thông tin, chờ duyệt

  # ── Surface & Backgrounds (Light) ───────────────────────────────────────────
  bg-page:        "#f8fafc"   # Nền trang chính (slate-50)
  bg-surface:     "#ffffff"   # Card, panel, modal
  bg-subtle:      "#f1f5f9"   # Table header, sidebar (slate-100)
  bg-muted:       "#e2e8f0"   # Hover row, alt rows (slate-200)

  # ── Text ────────────────────────────────────────────────────────────────────
  text-primary:   "#1d1c1c"   # Heading, nội dung chính
  text-secondary: "#313d44"   # Label, phụ đề
  text-muted:     "#64748b"   # Disabled, placeholder (slate-500)
  text-inverse:   "#ffffff"   # Text trên nền tối

  # ── Border ──────────────────────────────────────────────────────────────────
  border-default: "#e2e8f0"   # Border card, input (slate-200)
  border-subtle:  "#cbd5e1"   # Border phụ (slate-300)
  border-focus:   "#00668c"   # Focus ring (= primary)

typography:
  # ─── Heading Scale ──────────────────────────────────────────────────────────
  h1:
    fontFamily: Inter
    fontSize: 2.25rem       # text-4xl
    fontWeight: 800
    lineHeight: 2.5rem
  h2:
    fontFamily: Inter
    fontSize: 1.875rem      # text-3xl
    fontWeight: 700
    lineHeight: 2.25rem
  h3:
    fontFamily: Inter
    fontSize: 1.5rem        # text-2xl
    fontWeight: 700
    lineHeight: 2rem
  h4:
    fontFamily: Inter
    fontSize: 1.25rem       # text-xl
    fontWeight: 600
    lineHeight: 1.75rem

  # ─── Body Scale ─────────────────────────────────────────────────────────────
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem      # text-lg
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 1rem          # text-base
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem      # text-sm
    lineHeight: 1.25rem
  body-xs:
    fontFamily: Inter
    fontSize: 0.75rem       # text-xs
    lineHeight: 1rem

  # ─── Label / Caps ───────────────────────────────────────────────────────────
  label-caps:
    fontFamily: Inter
    fontSize: 0.625rem      # text-2xs
    fontWeight: 900
    letterSpacing: 0.05em

  # ─── Mono (Numbers in tables) ───────────────────────────────────────────────
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem

rounded:
  sm:   6px
  md:   8px
  lg:   12px
  xl:   16px
  2xl:  20px
  full: 9999px

spacing:
  1:  4px
  2:  8px
  3:  12px
  4:  16px
  5:  20px
  6:  24px
  8:  32px
  10: 40px
  12: 48px
  16: 64px

components:
  # ── Primary Button (CTA chính) ───────────────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"

  # ── Secondary Button (Outline) ───────────────────────────────────────────────
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.bg-subtle}"

  # ── Danger Button ────────────────────────────────────────────────────────────
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"

  # ── Card / Panel ─────────────────────────────────────────────────────────────
  card:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.6}"

  # ── Table Header ─────────────────────────────────────────────────────────────
  table-header:
    backgroundColor: "{colors.bg-subtle}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label-caps}"

  # ── Form Input ───────────────────────────────────────────────────────────────
  input:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "8px 12px"

  # ── Status Badge — Success ────────────────────────────────────────────────────
  badge-success:
    backgroundColor: "#ecfdf5"
    textColor: "#047857"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "#fffbeb"
    textColor: "#b45309"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-danger:
    backgroundColor: "#fef2f2"
    textColor: "#b91c1c"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-info:
    backgroundColor: "#eff6ff"
    textColor: "#1d4ed8"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

## Overview

**CIC QLDA** là phần mềm quản lý dự án đầu tư xây dựng, phục vụ Ban Điều phối
dự án đô thị HCM (Ban DDCN HT). Phong cách thiết kế: **Corporate Elegant & Utilitarian** —
chuyên nghiệp, dữ liệu dày đặc, đáng tin cậy. Mọi quyết định thiết kế ưu tiên
tính rõ ràng và tốc độ đọc thông tin.

## Colors

Bảng màu được xây dựng xung quanh **Teal xanh dương (#00668c)** làm màu chủ đạo,
kết hợp **Đỏ cờ (#AE1E23)** cho branding tổ chức nhà nước.

- **Primary (#00668c):** Màu brand chính — dùng cho CTA, active tab, focus ring.
  Không được thay thế bằng màu khác.
- **Accent (#AE1E23):** Đỏ cờ HCMA — chỉ dùng cho tiêu đề tổ chức, badge quan trọng
  cấp cao. Không dùng cho button thông thường.
- **Gold (#D4A017):** Chỉ dùng trong gradient header/sidebar hoặc border highlight đặc biệt.
  Không dùng thay thế primary.
- **Semantic colors:** Mỗi màu mang một ý nghĩa cố định — success=hoàn thành,
  warning=đang thực hiện, danger=lỗi/quá hạn, info=chờ duyệt. Không hoán đổi
  các màu này cho mục đích thẩm mỹ.

**Nguyên tắc Anti-Patterns:**
- Không remapping màu (orange=gold, blue=gold, v.v.)
- Không dùng `opacity hack` (mẹo độ mờ) cho **nền trung tính** trong dark mode (`bg-white/10`).
  *Ngoại lệ:* lớp phủ kính (glassmorphism) trên canvas 3D / HUD của BIM (vd `bg-white/10`
  đè lên viewport 3D) được phép, vì nền dưới không phải màu token.
- Không hardcode hex trong JSX ngoại trừ Recharts và board colors từ `types/project.types.ts`

## Typography

Font chính: **Inter** — clean, readable, hỗ trợ đầy đủ Unicode tiếng Việt.

Font mono: **JetBrains Mono** — dùng riêng cho số trong data tables
(`tabular-nums`, right-aligned).

## Spacing & Layout

Layout dựa trên grid 4px base unit. Padding card chuẩn là 24px (`spacing.6`).
Khoảng cách section chuẩn là 32px (`spacing.8`). Không dùng giá trị lẻ ngoài scale.

## Components

### Buttons
Primary button dùng màu `primary` (#00668c). Luôn có `cursor-pointer` và
hover transition 150–200ms. Không dùng `transform: scale` gây layout shift.

### Tables
Header: nền `bg-subtle` (#f1f5f9), text `label-caps` uppercase bold.
Row hover: `hover:bg-blue-50/30` (light) / `hover:bg-slate-700/30` (dark).
Tất cả số liệu: `font-mono tabular-nums text-right`.

### Status Badges
Dùng đúng màu semantic cho từng trạng thái. Không dùng màu brand cho badge trạng thái.

### Icons
Chỉ dùng **Lucide React** SVG icons, size `w-4 h-4` hoặc `w-5 h-5`.
Không dùng emoji làm icon.

## Token Architecture (Kiến trúc token — 2 tầng)

Hệ thống dùng **2 tầng token** rạch ròi:

1. **Tầng palette (bảng màu tĩnh)** — `styles/tokens.css :root`, namespace `--color-*`
   (vd `--color-primary-500`, `--color-slate-400`). Đây là các bậc màu cố định,
   được Tailwind map sang `primary-500`, `slate-400`…
2. **Tầng semantic (ngữ nghĩa, theme-aware)** — namespace KHÔNG tiền tố:
   `--bg-surface`, `--bg-subtle`, `--text-primary`, `--text-muted`, `--border-default`…
   Nguồn chân lý runtime là `context/ThemeContext.tsx` (inject per-theme).
   `tokens.css :root` chỉ chứa **bản fallback tĩnh** (= Nature theme) để tránh
   FOUC ở lần vẽ đầu. Tailwind map sang `bg-bg-surface`, `text-txt-muted`…

**Quy tắc dùng:** Component LUÔN dùng token semantic (`bg-bg-surface`, `text-txt-primary`,
`border-border`) thay cho palette tĩnh hay hex cứng. Namespace `--color-text-*` đã
được alias về semantic — đừng tạo token chữ mới trong palette.

## Dark Mode

Dark mode kích hoạt bằng class `.dark` trên `<html>`; màu đến từ **tầng semantic**
(ThemeContext override), KHÔNG hardcode bậc Tailwind. Giá trị thực:
- Nền trang (app): `--bg-app` = `#0f1117`
- Nền card/panel: `--bg-surface` = `#1f2332`
- Nền phụ (table header): `--bg-subtle` = `#1a1e2e`
- Border: `--border-default` = `#222533`
- Text chính / mờ: `--text-primary` = `#f8fafc` / `--text-muted` = `#94a3b8`

Khi viết component, dùng `bg-bg-surface dark:` tự động đúng — không cần ghi
`dark:bg-slate-800`. Tránh opacity hack (`bg-white/10`) cho nền trung tính trong dark.

## Accessibility

Contrast ratio tối thiểu 4.5:1 (WCAG AA). Focus state phải luôn visible
(outline teal `focus:ring-2 focus:ring-primary-500/20`). Hỗ trợ
`prefers-reduced-motion` trong `styles/base.css`.

# Design Tokens - Todo Extension (Chrome MV3 popup)

> Sinh bởi `.agent/design.md` (Phase 3 / step 3 design) cho project `todo-extension`.
> Nguồn: `BRIEF.md` + `docs/specs/2026-11-10-todo-extension-design.md` + `.context/project-config.md` + `.context/design-spec.md`.
> Coding agent PHẢI đọc file này trước khi viết bất kỳ UI component nào.
> Stack: WXT + React 19 + TypeScript + Tailwind CSS v4 (custom components, không UI lib, không shadcn).

## 0. Design Read + Three Dials

**Design Read:** "Reading this as: browser-extension productivity popup for individual knowledge workers who capture tasks mid-browse, with a calm minimal and high-legibility language, leaning toward Tailwind v4 semantic tokens + system UI font stack + CSS-only micro-motion."

| Dial | Value | Lý do |
|---|---|---|
| `DESIGN_VARIANCE` | **4** | Product UI 360px, danh sách 1 cột. Bố cục dự đoán được là ưu điểm, không phải lỗi. Không hero, không layout nghệ thuật. |
| `MOTION_INTENSITY` | **3** | Chỉ feedback (tick done, enter/exit item, panel). Không animation trang trí, không parallax, không shimmer. Popup mở/đóng liên tục nên motion phải tắt được. |
| `VISUAL_DENSITY` | **6** | 50 task trong 600px chiều cao: row 52px, hairline divider, mật độ "daily app". Không thoáng kiểu landing, không cockpit. |

Design system: **không dùng package ngoài** (bundle budget R-18). Aesthetic thuần: neutral cool-gray + 1 accent cobalt, không gradient, không glass, không serif.

## 1. Nguyên tắc bắt buộc

1. **Một accent duy nhất** (`accent`, cobalt) cho action chính, selection, focus, progress. Không accent thứ hai.
2. **Không pure black / pure white làm text hoặc nền**: `#16191C` (light) và `#ECEEF0` (dark) thay cho `#000` / `#fff` ở text. Surface light dùng `#FFFFFF` chỉ vì popup cần độ tương phản row, không dùng `#fff` cho text.
3. **Màu không bao giờ là tín hiệu duy nhất**: priority có số vạch (1/2/3), overdue có chữ "Quá hạn", done có line-through + text, subtask có "2/5".
4. **Không gradient, không glow, không glass, không noise texture.** Elevation chỉ bằng shadow + border.
5. **Token semantic, không raw hex trong component.** Cấm `text-[#B4232A]`, cấm `bg-zinc-800`.

## 2. Colors

### 2.1 Neutral (light + dark)

| Token | Light | Dark | Dùng ở đâu |
|---|---|---|---|
| `--bg` | `#F5F6F7` | `#14171A` | Nền popup, header, khoảng trống giữa các khối |
| `--surface` | `#FFFFFF` | `#1C2024` | Card composer, card list, input, row nền |
| `--surface-raised` | `#FFFFFF` | `#22282E` | Menu, dialog, tooltip (luôn kèm `--elev-2`) |
| `--surface-sunken` | `#EEF0F2` | `#232930` | Chip, track progress, skeleton phẳng |
| `--surface-hover` | `#F4F6F7` | `#262C32` | Hover row, hover menu item |
| `--border-subtle` | `#E9ECEF` | `#262C32` | Divider giữa row, viền track |
| `--border` | `#DFE3E6` | `#2E343A` | Viền card / panel |
| `--border-control` | `#828C95` | `#6B757E` | Viền checkbox, input, segmented (cần ≥ 3:1) |
| `--fg` | `#16191C` | `#ECEEF0` | Text chính: tên việc, tiêu đề |
| `--fg-secondary` | `#4A5157` | `#B4BBC1` | Meta, label, text phụ |
| `--fg-muted` | `#676F76` | `#8B9399` | Placeholder, counter, timestamp, empty state body |
| `--fg-disabled` | `#9AA1A8` | `#6B7378` | Control disabled (miễn trừ contrast) |
| `--skeleton` | `#E7EAED` | `#252B31` | Block skeleton khi đọc storage chậm |
| `--scrim` | `rgba(16,24,32,0.32)` | `rgba(0,0,0,0.56)` | Nền dialog xác nhận |

### 2.2 Accent (cobalt, duy nhất)

| Token | Light | Dark | Dùng ở đâu |
|---|---|---|---|
| `--accent` | `#2C5FD4` | `#3D6FE0` | Fill button chính, checkbox đã tick, fill progress |
| `--accent-hover` | `#2551B8` | `#3564D2` | Hover fill (dark tối đi để giữ 4.5:1 với label trắng) |
| `--accent-active` | `#1F47A0` | `#2E57BC` | `:active` fill |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | Text/icon trên fill accent |
| `--accent-text` | `#1F4BB0` | `#8FB0F7` | Text accent (link, tab active, số tiến độ) |
| `--accent-soft` | `#E6EDFC` | `#1E2A3D` | Nền tab active, row đang mở, chip tag đang lọc |
| `--accent-border` | `#B9CCF8` | `#3A4E75` | Viền 1px cho khối `accent-soft` |
| `--focus-ring` | `#2C5FD4` | `#8FB0F7` | Ring `:focus-visible` (2px, offset 2px) |

### 2.3 Priority (R-05)

| Token | Light | Dark | Soft light | Soft dark |
|---|---|---|---|---|
| `--priority-low` | `#5A6672` | `#9AA7B4` | `#EDF0F2` | `#23292E` |
| `--priority-medium` | `#8F5A00` | `#E0A94B` | `#FFF4E0` | `#2E2416` |
| `--priority-high` | `#B4232A` | `#F08A8A` | `#FBEAEA` | `#38201F` |

Hiển thị: glyph 3 vạch (số vạch = mức), màu token tương ứng, kèm text trong detail (`Thấp` / `Vừa` / `Cao`).
`priority-high` dùng chung họ đỏ với `--danger` (color consistency lock: 1 họ đỏ cho cả palette).

### 2.4 Status

| Token | Light | Dark | Soft light | Soft dark | Ghi chú |
|---|---|---|---|---|---|
| `--success` | `#1D7A4C` | `#5FD3A0` | `#F0FAF4` | `#1A2B24` | Trạng thái đã lưu / đồng bộ |
| `--warning` | `#9A6300` | `#E8B45C` | `#FFF8EC` | `#2E2416` | Cảnh báo không chặn (notification bị chặn) |
| `--danger` | `#B4232A` | `#F08A8A` | `#FBEAEA` | `#38201F` | Lỗi, action xoá |
| `--danger-fill` | `#B4232A` | `#F08A8A` | - | - | Nền button xoá |
| `--on-danger` | `#FFFFFF` | `#0E1114` | - | - | Label trên `danger-fill` |
| `--overdue` | `#A62B1F` | `#FF9B8A` | `#FBEAEA` | `#38201F` | Text "Quá hạn" + meta hạn (R-09) |
| `--danger-border` | `#F0C9C4` | `#5A3230` | - | - | Viền banner lỗi quota |

### 2.5 Contrast evidence (đã đo, không ước lượng)

Công thức WCAG 2.1 relative luminance. Text thường cần ≥ 4.5:1, control/border cần ≥ 3:1.

| Cặp | Light | Dark | Kết luận |
|---|---|---|---|
| `fg` trên `surface` | 17.65 | 14.09 | PASS (AAA) |
| `fg` trên `bg` | 16.31 | 15.47 | PASS (AAA) |
| `fg-secondary` trên `surface` | 8.06 | 8.44 | PASS (AAA) |
| `fg-muted` trên `surface` | 5.11 | 5.25 | PASS (AA) |
| `fg-muted` trên `bg` | 4.72 | 5.77 | PASS (AA) |
| `accent-text` trên `surface` | 7.80 | 7.59 | PASS (AAA) |
| `accent-text` trên `accent-soft` | 6.64 | 7.97 | PASS (AA) |
| `on-accent` trên `accent` | 5.68 | 4.62 | PASS (AA) |
| `on-accent` trên `accent-hover` | 7.12 | 5.38 | PASS (AA) |
| `on-danger` trên `danger-fill` | 6.53 | 7.85 | PASS (AA) |
| `priority-low` trên `surface` | 5.87 | 6.68 | PASS (AA) |
| `priority-medium` trên `surface` | 5.78 | 7.76 | PASS (AA) |
| `priority-high` trên `surface` | 6.53 | 6.79 | PASS (AA) |
| `priority-medium` trên `priority-medium-soft` | 5.31 | 8.05 | PASS (AA) |
| `overdue` trên `surface` | 7.03 | 8.04 | PASS (AAA) |
| `overdue` trên `overdue-soft` | 6.05 | 7.39 | PASS (AA) |
| `success` trên `surface` | 5.33 | 8.83 | PASS (AA) |
| `warning` trên `surface` | 5.05 | 8.67 | PASS (AA) |
| `fg-secondary` trên `surface-sunken` (chip) | 7.05 | 7.27 | PASS (AAA) |
| `border-control` trên `surface` | 3.42 | 3.49 | PASS (non-text 3:1) |
| `accent` trên `bg` (focus ring) | 5.25 | 3.55 | PASS (≥3:1) |

Giới hạn đã biết: `fg-muted` trên `surface-sunken` = 4.04 (light), **dưới 4.5** → không đặt text muted trên nền sunken; dùng `fg-secondary` ở đó.

## 3. Typography

```css
--font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text",
  "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
```

- **Không tải font file** (R-18): system stack, không FOUT, không CLS, không request mạng (R-17). Không dùng Inter.
- `--font-mono` chỉ dùng cho mã/key debug, **không** dùng cho số liệu thường. Số dùng `font-variant-numeric: tabular-nums`.
- Weight chỉ 3 bậc: 400, 500, 600. Không 700 (calm).

| Token | Size / Line-height | Weight | Tracking | Dùng ở đâu |
|---|---|---|---|---|
| `--text-meta` | 12 / 16 | 500 | 0.01em | Meta row (hạn, progress), counter, chip, label form |
| `--text-caption` | 13 / 18 | 400 | 0 | Helper text, note preview 1 dòng, empty state body |
| `--text-body` | 14 / 20 | 400 | 0 | Body mặc định, tên việc, button label, menu item |
| `--text-title` | 16 / 22 | 500 | -0.01em | Tên việc trong detail, tên app ở header, empty state title |
| `--text-heading` | 20 / 26 | 600 | -0.01em | Tiêu đề panel `Sửa việc`, `Cài đặt` |
| `--text-display` | 24 / 30 | 600 | -0.01em | Chỉ dùng cho options page sau này (không dùng trong popup) |

Quy tắc:
- Tên việc clamp 2 dòng (`line-clamp-2`), note preview clamp 1 dòng.
- Input composer dùng `--text-body` 14px (popup desktop, không có zoom-on-focus của iOS).
- Không viết hoa toàn chuỗi (uppercase) cho label. Không dùng eyebrow/section-number.
- Số đếm ("6 đang làm"), giờ và ngày dùng `tabular-nums`.

## 4. Spacing (4px base)

| Token | Value | Dùng ở đâu |
|---|---|---|
| `--space-0-5` | 2px | Khe icon-glyph trong cụm 3 vạch priority |
| `--space-1` | 4px | Gap giữa icon và label trong chip |
| `--space-1-5` | 6px | Gap trong cụm meta |
| `--space-2` | 8px | Gap dọc giữa field, gap chip |
| `--space-3` | 12px | Padding ngang của popup, padding row, gap section |
| `--space-4` | 16px | Padding panel, gap giữa khối lớn |
| `--space-5` | 20px | Padding empty state |
| `--space-6` | 24px | Padding top empty state, padding dialog |
| `--space-8` | 32px | Khoảng thoáng duy nhất (empty state) |
| `--space-10` | 40px | Chiều cao control chuẩn (input, button composer) |

Layout số cứng của popup:

| Vùng | Chiều cao | Ghi chú |
|---|---|---|
| Header | 52px | Title 16 + subtitle 12, padding ngang 12 |
| FilterBar | 48px | Container `p-0.5` + tab `h-11` (44, đủ touch target) |
| Search row (khi mở) | 56px | Label 12 + input 40, chỉ render khi search active |
| Composer collapsed | 80px | Padding 8 + label 12/16 + gap 4 + input row 40 |
| Composer expanded | max 380px | Scroll nội bộ, không đẩy list ra ngoài |
| Task row | min 52px, thực tế 56-72px | 1 dòng title + meta = 56; 2 dòng title = 72 |
| Panel detail | 600px (full) | Header 52 + body scroll + footer 60 |
| Footer | 0 | Không có footer (tránh strip trang trí) |

Popup: `width: 360px; height: 600px` cố định. Padding ngang chuẩn 12px, không dùng 16 để tối đa chiều rộng chữ ở 360.

## 5. Radius (shape consistency lock)

| Token | Value | Áp dụng cho |
|---|---|---|
| `--radius-control` | 6px | Button, input, select, segmented item |
| `--radius-container` | 10px | Card composer, card list, panel, menu, dialog |
| `--radius-checkbox` | 5px | Ô tick |
| `--radius-chip` | 9999px | Chip tag, badge đếm |
| `--radius-bar` | 9999px | Track/fill progress (2px cao) |

Quy tắc: control 6, container 10, chip full. Không dùng 12/16/`rounded-xl` cho card. Không trộn pill button với card vuông.

## 6. Elevation (shadow)

| Token | Light | Dark |
|---|---|---|
| `--elev-1` | `0 1px 2px rgba(16,24,32,0.06)` | `0 1px 2px rgba(0,0,0,0.50)` |
| `--elev-2` | `0 4px 12px rgba(16,24,32,0.08), 0 1px 2px rgba(16,24,32,0.04)` | `0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)` |
| `--elev-3` | `0 12px 32px rgba(16,24,32,0.14), 0 1px 2px rgba(16,24,32,0.06)` | `0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)` |

- Card list và composer dùng **border + `--elev-1`**, không dùng `--elev-2` (elevation phải có nghĩa: menu/dialog mới nổi).
- Shadow light mode tint theo hue nền (`rgba(16,24,32,…)`), không dùng đen thuần.

## 7. Focus ring

```css
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-control);
}
```

- Chỉ `:focus-visible` (không ring khi click chuột).
- Trên nền `accent` (button primary) dùng `outline-color: var(--on-accent)` + `outline-offset: 2px` để ring không chìm vào fill.
- Không bao giờ `outline: none` mà không thay bằng ring khác.
- Trong list có scroll, ring phải nằm trong vùng nhìn: dùng `scroll-margin: 8px`.

## 8. Motion

| Token | Value | Dùng ở đâu |
|---|---|---|
| `--dur-instant` | 90ms | `:active` press (scale 0.98 / translateY 1px) |
| `--dur-fast` | 120ms | Hover màu, tick checkbox, item enter/exit |
| `--dur-base` | 160ms | Banner xuất hiện, toast |
| `--dur-panel` | 200ms | Panel detail trượt vào, menu mở |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Mặc định |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Item/panel enter |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Item exit |

Quy tắc:
- Chỉ animate `transform` và `opacity`. Cấm animate `height`, `width`, `top`, `left`, `background-position`.
- `@media (prefers-reduced-motion: reduce)`: mọi duration về `0.01ms`, tắt translate/scale, giữ thay đổi trạng thái tức thì.
- Không shimmer, không pulse, không infinite loop, không `will-change` thường trực.

## 9. Z-index scale

| Token | Value | Dùng cho |
|---|---|---|
| `--z-base` | 0 | Nội dung |
| `--z-sticky` | 10 | Header/banner sticky trong panel scroll |
| `--z-menu` | 20 | Sort menu, tag menu |
| `--z-scrim` | 30 | Scrim dialog |
| `--z-dialog` | 40 | Dialog xác nhận |
| `--z-toast` | 50 | Toast |

Cấm `z-50` rải rác; chỉ dùng 5 mức trên.

## 10. Iconography

- Một họ duy nhất: **`@phosphor-icons/react`** (import named, tree-shaken). Không mix Lucide/Radix icon. Không emoji làm icon. Không hand-roll SVG path (ngoại lệ duy nhất: glyph 3 vạch priority và dấu tick, vẽ bằng `<rect>`/`<path>` đơn giản, 12px).
- Size: 16px trong row/meta, 18px trong button, 20px ở header action.
- Weight: `regular`. Stroke mặc định của bộ icon, không tự chỉnh `strokeWidth` từng chỗ.
- Icon-only button bắt buộc `aria-label` + `title`.
- Icon không bao giờ là tín hiệu duy nhất (luôn có text hoặc aria-label).

## 11. Tailwind v4 wiring

Chiến lược: **CSS variables + `light-dark()`**, không dùng `dark:` utility trong component.

```css
/* entrypoints/popup/style.css */
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  color-scheme: light dark; /* system: theo OS */

  --bg: light-dark(#F5F6F7, #14171A);
  --surface: light-dark(#FFFFFF, #1C2024);
  --surface-raised: light-dark(#FFFFFF, #22282E);
  --surface-sunken: light-dark(#EEF0F2, #232930);
  --surface-hover: light-dark(#F4F6F7, #262C32);

  --border-subtle: light-dark(#E9ECEF, #262C32);
  --border: light-dark(#DFE3E6, #2E343A);
  --border-control: light-dark(#828C95, #6B757E);

  --fg: light-dark(#16191C, #ECEEF0);
  --fg-secondary: light-dark(#4A5157, #B4BBC1);
  --fg-muted: light-dark(#676F76, #8B9399);
  --fg-disabled: light-dark(#9AA1A8, #6B7378);

  --accent: light-dark(#2C5FD4, #3D6FE0);
  --accent-hover: light-dark(#2551B8, #3564D2);
  --accent-active: light-dark(#1F47A0, #2E57BC);
  --on-accent: #FFFFFF;
  --accent-text: light-dark(#1F4BB0, #8FB0F7);
  --accent-soft: light-dark(#E6EDFC, #1E2A3D);
  --accent-border: light-dark(#B9CCF8, #3A4E75);
  --focus-ring: light-dark(#2C5FD4, #8FB0F7);

  --priority-low: light-dark(#5A6672, #9AA7B4);
  --priority-medium: light-dark(#8F5A00, #E0A94B);
  --priority-high: light-dark(#B4232A, #F08A8A);
  --priority-low-soft: light-dark(#EDF0F2, #23292E);
  --priority-medium-soft: light-dark(#FFF4E0, #2E2416);
  --priority-high-soft: light-dark(#FBEAEA, #38201F);

  --success: light-dark(#1D7A4C, #5FD3A0);
  --success-soft: light-dark(#F0FAF4, #1A2B24);
  --warning: light-dark(#9A6300, #E8B45C);
  --warning-soft: light-dark(#FFF8EC, #2E2416);
  --danger: light-dark(#B4232A, #F08A8A);
  --danger-fill: light-dark(#B4232A, #F08A8A);
  --on-danger: light-dark(#FFFFFF, #0E1114);
  --danger-border: light-dark(#F0C9C4, #5A3230);
  --overdue: light-dark(#A62B1F, #FF9B8A);
  --overdue-soft: light-dark(#FBEAEA, #38201F);

  --skeleton: light-dark(#E7EAED, #252B31);
  --scrim: light-dark(rgba(16, 24, 32, 0.32), rgba(0, 0, 0, 0.56));

  /* Shadow không dùng light-dark() được (light-dark chỉ nhận <color>) */
  --elev-1: 0 1px 2px rgba(16, 24, 32, 0.06);
  --elev-2: 0 4px 12px rgba(16, 24, 32, 0.08), 0 1px 2px rgba(16, 24, 32, 0.04);
  --elev-3: 0 12px 32px rgba(16, 24, 32, 0.14), 0 1px 2px rgba(16, 24, 32, 0.06);
}

/* Theme chọn tay ghi đè system (R-14) */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }

/* Dark shadow: tối hơn + hairline sáng để card không dính nền */
:root[data-theme="dark"] {
  --elev-1: 0 1px 2px rgba(0, 0, 0, 0.50);
  --elev-2: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04);
  --elev-3: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --elev-1: 0 1px 2px rgba(0, 0, 0, 0.50);
    --elev-2: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04);
    --elev-3: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06);
  }
}

@theme inline {
  --font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text",
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;

  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-sunken: var(--surface-sunken);
  --color-surface-hover: var(--surface-hover);
  --color-border-subtle: var(--border-subtle);
  --color-border: var(--border);
  --color-border-control: var(--border-control);

  --color-fg: var(--fg);
  --color-fg-secondary: var(--fg-secondary);
  --color-fg-muted: var(--fg-muted);
  --color-fg-disabled: var(--fg-disabled);

  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-active: var(--accent-active);
  --color-on-accent: var(--on-accent);
  --color-accent-text: var(--accent-text);
  --color-accent-soft: var(--accent-soft);
  --color-accent-border: var(--accent-border);

  --color-priority-low: var(--priority-low);
  --color-priority-medium: var(--priority-medium);
  --color-priority-high: var(--priority-high);
  --color-priority-low-soft: var(--priority-low-soft);
  --color-priority-medium-soft: var(--priority-medium-soft);
  --color-priority-high-soft: var(--priority-high-soft);

  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-danger: var(--danger);
  --color-danger-fill: var(--danger-fill);
  --color-on-danger: var(--on-danger);
  --color-danger-border: var(--danger-border);
  --color-overdue: var(--overdue);
  --color-overdue-soft: var(--overdue-soft);

  --text-meta: 12px;
  --text-meta--line-height: 16px;
  --text-caption: 13px;
  --text-caption--line-height: 18px;
  --text-body: 14px;
  --text-body--line-height: 20px;
  --text-title: 16px;
  --text-title--line-height: 22px;
  --text-heading: 20px;
  --text-heading--line-height: 26px;
  --text-display: 24px;
  --text-display--line-height: 30px;

  --radius-control: 6px;
  --radius-container: 10px;
  --radius-checkbox: 5px;
  --radius-chip: 9999px;
  --radius-bar: 9999px;

  --shadow-e1: var(--elev-1);
  --shadow-e2: var(--elev-2);
  --shadow-e3: var(--elev-3);

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

Ghi chú kỹ thuật:
- `light-dark()` chỉ trả giá trị đúng khi `color-scheme` được set (đã set ở `:root`). Native input (`date`, `time`, `select`) tự đổi theme theo `color-scheme`, nên không phải style lại.
- Nếu target Chrome < 123 (không có `light-dark()`): thay bằng block `:root { …light }` + `[data-theme="dark"] { …dark }` + `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { …dark } }`. Giữ nguyên tên biến.
- App set `document.documentElement.dataset.theme = 'light' | 'dark'` khi user chọn tay; theme `system` thì **xoá** attribute.
- Spacing dùng scale mặc định của Tailwind v4 (base 4px): `p-1` = 4px, `p-3` = 12px, `p-4` = 16px. Không override `--spacing`.
- Shadow: block dark bị lặp 2 lần (attribute + media query) là **có chủ ý** vì `light-dark()` không nhận shadow. Sửa shadow phải sửa cả 3 chỗ (`:root`, `[data-theme="dark"]`, media query).
- Utility sinh ra: `bg-bg`, `bg-surface`, `text-fg`, `text-fg-muted`, `border-border-control`, `bg-accent`, `text-on-accent`, `text-priority-high`, `rounded-control`, `rounded-container`, `shadow-e2`, `text-meta`, `text-title`…
- `@theme inline` là bắt buộc: không có `inline` thì giá trị biến bị inline cứng lúc build và theme switch sẽ hỏng.
- Không dùng `dark:` trong component (trừ shadow/viền cần khác bản chất); token đã tự đổi.

## 12. Component token recipes

| Component | Spec |
|---|---|
| **Popup shell** | `w-[360px] h-[600px] bg-bg text-fg font-sans text-body antialiased` |
| **Header** | `h-[52px] px-3 flex items-center gap-2 bg-bg`; title `text-title font-medium`; subtitle `text-meta text-fg-muted` |
| **Icon button** | `size-9 rounded-control text-fg-secondary hover:bg-surface-hover active:scale-[0.98]` + hit area 44 (`before:absolute before:-inset-1`) |
| **Tab (segmented)** | `h-11 px-3 text-body`; idle `text-fg-secondary`; active `bg-accent-soft text-accent-text font-medium border border-accent-border`; container `rounded-control bg-surface-sunken p-0.5` |
| **Composer card** | `mx-3 rounded-container border border-border bg-surface shadow-e1`; input `h-10 px-2.5 rounded-control border border-border-control bg-surface text-body placeholder:text-fg-muted` |
| **Primary button** | `h-9 px-3 rounded-control bg-accent text-on-accent text-body font-medium hover:bg-accent-hover active:bg-accent-active` |
| **Ghost button** | `h-9 px-3 rounded-control text-fg-secondary hover:bg-surface-hover` |
| **Danger button** | `h-9 px-3 rounded-control bg-danger-fill text-on-danger text-body font-medium` |
| **Task row** | `min-h-[52px] px-3 py-2 flex gap-2.5 items-start bg-surface hover:bg-surface-hover border-b border-border-subtle last:border-b-0` |
| **Checkbox** | visual `size-[18px] rounded-checkbox border-[1.5px] border-border-control`; done `bg-accent border-accent` + tick `text-on-accent`; hit area `size-11 -m-3 p-3` (44×44) |
| **Task title** | `text-body font-medium text-fg line-clamp-2`; done `text-fg-muted line-through decoration-1` |
| **Meta line** | `text-meta text-fg-muted flex items-center gap-1.5 tabular-nums`; overdue `text-overdue font-medium` |
| **Priority glyph** | 3 vạch `w-[3px] h-[6px|9px|12px] rounded-[1px]` xếp tăng dần; vạch bật = màu priority, vạch tắt = `bg-border-subtle` |
| **Progress (subtask)** | text `text-meta text-fg-muted tabular-nums` + bar `h-0.5 w-10 rounded-bar bg-surface-sunken` fill `bg-accent` |
| **Tag chip (display)** | `h-7 px-2 rounded-chip bg-surface-sunken text-meta text-fg-secondary` (không interactive trong row) |
| **Tag chip (interactive)** | `h-8 px-2.5 rounded-chip`; idle `bg-surface-sunken text-fg-secondary`; selected `bg-accent-soft text-accent-text border border-accent-border`; `aria-pressed` |
| **Banner lỗi** | `mx-3 p-3 rounded-container bg-overdue-soft border border-danger-border text-fg text-body` + icon `text-danger` 16px + actions `h-8` |
| **Menu** | `rounded-container border border-border bg-surface-raised shadow-e2 p-1`; item `h-10 px-3 rounded-control text-body hover:bg-surface-hover` |
| **Dialog** | `w-[320px] rounded-container border border-border bg-surface-raised shadow-e3 p-4`; title `text-title font-medium`; body `text-caption text-fg-secondary` |
| **Skeleton** | `rounded-control bg-skeleton` (tĩnh, không shimmer), cao đúng bằng row thật |
| **Toast** | `rounded-control bg-fg text-bg px-3 py-2 text-caption shadow-e2` + action `text-accent-text` (dark: `text-accent-soft`) |
| **Divider** | `border-border-subtle` 1px, chỉ giữa các row trong cùng card |

Soft token (`priority-*-soft`, `success-soft`, `warning-soft`, `overdue-soft`) đã khai báo trong `:root` + `@theme inline`. Chỉ dùng làm nền khối, không dùng làm text.

## 13. Dark mode checklist (R-14)

- [ ] Mọi màu đi qua token, không hardcode hex trong `.tsx`.
- [ ] `color-scheme` được set để native `input[type=date|time]` và scrollbar đúng theme.
- [ ] Theme `system` = không có `data-theme`; chọn tay = set `data-theme` và persist vào `settings`.
- [ ] Đổi theme không remount list, không mất state composer.
- [ ] Ảnh hưởng contrast: kiểm lại 5 cặp chính (`fg/surface`, `fg-muted/surface`, `on-accent/accent`, `overdue/surface`, `border-control/surface`) khi thêm màu mới.
- [ ] Shadow dark phải có hairline sáng 4-6% (đã có trong `--elev-2/3`) để card không "dính" nền.

## 14. Do / Don't

| Do | Don't |
|---|---|
| Neutral cool-gray + 1 accent cobalt | Gradient tím/xanh, glow, glass, mesh |
| Hairline divider giữa row | 50 card trắng có shadow riêng |
| Priority bằng số vạch + màu | Chỉ dùng màu (color-only) |
| `light-dark()` + CSS vars | `dark:` rải khắp component, hex inline |
| System font, `tabular-nums` | Tải Inter/webfont, font display lạ |
| Motion 90-200ms có lý do | Shimmer, pulse, animation vô hạn |
| Icon Phosphor 1 họ | Emoji làm icon, hand-roll SVG path phức tạp |
| Radius 6 / 10 / full theo lock | `rounded-xl` mọi thứ, trộn pill và vuông |
| Copy tiếng Việt ngắn, động từ cụ thể | "Chào bạn!", "Tuyệt vời!", copy marketing |

## 15. Trạng thái confirm

**CHỜ user duyệt tokens** — file này đã sinh xong nhưng chưa được user confirm. Sau khi user reply "ok"/duyệt, agent sẽ kích hoạt `/graph` (bước chia layer). KHÔNG tự chạy `/graph` trước khi có confirm.

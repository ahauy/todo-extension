# Design Specification — Todo Extension

> **Design spec (canonical).** Nguồn sự thật đầy đủ:
> [`.context/design-spec.md`](../.context/design-spec.md) (screen specs, interaction, a11y, copy deck)
> và [`skills/react-nodejs/design-tokens.md`](../skills/react-nodejs/design-tokens.md) (tokens + contrast evidence).
> File này là overview có cấu trúc để đọc nhanh; giá trị chi tiết lấy từ 2 nguồn trên.
> Stack: WXT + React 19 + TypeScript + **Tailwind CSS v4** (custom components, không UI lib, không shadcn).

---

## Design References

**Figma Link:** Không có (greenfield, không design reference từ user).
**Design Tool:** Spec viết tay bằng `.agent/design.md` (Phase 3).
**Nguồn:** `SPECIFICATIONS.md` (R-01…R-18) + `docs/specs/2026-11-10-todo-extension-design.md`.

**Design Read:** browser-extension productivity popup cho người dùng cá nhân capture task khi đang
lướt web — ngôn ngữ **calm, minimal, high-legibility**; Tailwind v4 semantic tokens + system UI font + CSS-only micro-motion.

| Dial | Value | Lý do |
|---|---|---|
| `DESIGN_VARIANCE` | 4 | Danh sách 1 cột, bố cục dự đoán được; không hero, không bất đối xứng |
| `MOTION_INTENSITY` | 3 | Chỉ feedback (tick, enter/exit, panel); không trang trí |
| `VISUAL_DENSITY` | 6 | 50 task / 600px: row 52px, hairline divider, mật độ "daily app" |

---

## Brand & Visual Identity

- **Palette:** neutral cool-gray + **1 accent cobalt duy nhất**. Không gradient, không glass, không serif, không bo góc lớn.
- **Không pure black/white cho text**: `#16191C` (light) / `#ECEEF0` (dark).
- **Màu không là tín hiệu duy nhất**: priority có số vạch (1/2/3), overdue có chữ "Quá hạn", done có line-through, subtask có "2/5".
- **Token semantic, không raw hex trong component** (cấm `text-[#…]`, `bg-zinc-800`).
- **Signature elements:** checkbox 18px viền 1.5px trong hit area 44px (tick nét vẽ); glyph 3 vạch priority; hairline divider giữa row; composer card phẳng mở rộng tại chỗ.

### Color Palette (tóm tắt — đầy đủ + contrast ở design-tokens.md §2)

**Neutral**

| Token | Light | Dark | Dùng ở đâu |
|-------|-------|------|-----------|
| `--bg` | `#F5F6F7` | `#14171A` | Nền popup |
| `--surface` | `#FFFFFF` | `#1C2024` | Card, input, row |
| `--surface-sunken` | `#EEF0F2` | `#232930` | Chip, track progress, skeleton |
| `--border` | `#DFE3E6` | `#2E343A` | Viền card/panel |
| `--border-control` | `#828C95` | `#6B757E` | Viền checkbox/input (≥3:1) |
| `--fg` | `#16191C` | `#ECEEF0` | Text chính |
| `--fg-secondary` | `#4A5157` | `#B4BBC1` | Meta, label |
| `--fg-muted` | `#676F76` | `#8B9399` | Placeholder, counter |

**Accent (cobalt)**

| Token | Light | Dark | Dùng ở đâu |
|-------|-------|------|-----------|
| `--accent` | `#2C5FD4` | `#3D6FE0` | Button chính, checkbox tick, progress |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | Text/icon trên accent |
| `--accent-text` | `#1F4BB0` | `#8FB0F7` | Link, tab active |
| `--accent-soft` | `#E6EDFC` | `#1E2A3D` | Nền tab active, chip đang lọc |
| `--focus-ring` | `#2C5FD4` | `#8FB0F7` | Ring `:focus-visible` |

**Priority / Status**

| Token | Light | Dark | Ý nghĩa |
|-------|-------|------|---------|
| `--priority-low` | `#5A6672` | `#9AA7B4` | 1 vạch |
| `--priority-medium` | `#8F5A00` | `#E0A94B` | 2 vạch |
| `--priority-high` | `#B4232A` | `#F08A8A` | 3 vạch (chung họ đỏ danger) |
| `--success` | `#1D7A4C` | `#5FD3A0` | Đã lưu/đồng bộ |
| `--warning` | `#9A6300` | `#E8B45C` | Notification bị chặn |
| `--danger` | `#B4232A` | `#F08A8A` | Lỗi, action xoá |
| `--overdue` | `#A62B1F` | `#FF9B8A` | Chữ "Quá hạn" |

> Contrast đã đo WCAG 2.1 (text ≥4.5:1, control ≥3:1) — bảng đầy đủ design-tokens.md §2.5.
> Giới hạn đã biết: không đặt `fg-muted` trên `surface-sunken` (4.04 light, dưới 4.5).

### Typography

System font stack (không tải font file — R-17/R-18, không Inter):
`ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, …`. Weight chỉ 400/500/600.

| Token | Size / LH | Weight | Dùng ở đâu |
|-------|-----------|--------|-----------|
| `--text-meta` | 12 / 16 | 500 | Meta row, counter, chip, label form |
| `--text-caption` | 13 / 18 | 400 | Helper, note preview, empty body |
| `--text-body` | 14 / 20 | 400 | Body, tên việc, button, menu item |
| `--text-title` | 16 / 22 | 500 | Tên app header, detail title |
| `--text-heading` | 20 / 26 | 600 | Tiêu đề panel |
| `--text-display` | 24 / 30 | 600 | Chỉ options page sau này (không dùng popup) |

Số đếm/giờ/ngày dùng `tabular-nums`. Không uppercase label, không eyebrow.

### Spacing Scale (4px base)

| Token | Value | | Token | Value |
|-------|-------|-|-------|-------|
| `--space-1` | 4px | | `--space-4` | 16px |
| `--space-2` | 8px | | `--space-5` | 20px |
| `--space-3` | 12px (padding ngang popup) | | `--space-6` | 24px |

Layout cứng: header 52px · filter 48px · search row 56px · composer collapsed 80px / expanded max 380px ·
row min 52px (thực 56–72) · panel detail full 600px (header 52 + body scroll + footer 60). Padding ngang chuẩn **12px**.

### Border Radius

| Token | Value | Áp dụng |
|-------|-------|---------|
| `--radius-control` | 6px | Button, input, select, segmented |
| `--radius-container` | 10px | Card, panel, menu, dialog |
| `--radius-checkbox` | 5px | Ô tick |
| `--radius-chip` | 9999px | Chip tag, badge |

Shape lock: control 6, container 10, chip full. Không `rounded-xl` cho card.

### Elevation

`--elev-1` (card list/composer: border + shadow nhẹ) · `--elev-2` (menu/tooltip) · `--elev-3` (dialog).
Shadow light tint theo hue nền `rgba(16,24,32,…)`, không đen thuần. Giá trị đầy đủ: design-tokens.md §6.

---

## Screen Inventory

> Chi tiết từng screen (layout ASCII, field, states, a11y): `.context/design-spec.md` §4–7.

| # | Screen | Requirement | Mô tả |
|---|--------|-------------|-------|
| **S1** | Popup — Task list | R-15, R-16, R-18 | Mặc định; header + FilterBar + Composer + card list |
| S1a | Composer collapsed/expanded | R-01, R-05, R-07, R-09, R-10 | Tạo task; expanded thêm priority/hạn/lặp/tag/subtask |
| S1b | TaskItem states | R-04…R-09 | normal / done / overdue / subtask / tag / priority |
| S1c | Empty + skeleton + quota banner | R-16, R-18 | 5 biến thể empty; skeleton 4 row sau 50ms; banner `role=alert` |
| **S2** | Task detail / edit | R-02, R-03, R-06…R-10 | Panel toàn popup; dirty state; footer Lưu |
| **S3** | Settings | R-14, R-16 | Theme radio + hint notification + dung lượng đồng bộ |
| **S4** | Dialogs | R-03, R-02 | Xoá việc / Bỏ thay đổi; focus trap, nút an toàn mặc định |

**Screen map:**
```
Popup root (360×600)
├─ S1 Task list (mặc định): FilterBar → Composer → TaskList → TaskItem
├─ S2 Task detail (panel full, mở từ title row)
├─ S3 Settings (panel full, mở từ header)
└─ S4 Dialogs (đè lên panel hiện tại)
```
Điều hướng 1 cấp panel, không nested, không route/URL. `Escape`/back đóng panel.

### Screen states (state matrix — design-spec §13)

| Screen | Loading | Empty | Error | Success |
|--------|---------|-------|-------|---------|
| S1 list | skeleton 4 row (sau 50ms), `aria-busy` | 5 biến thể | banner quota `role=alert` | list render, `aria-live` count |
| S1 composer | submit disabled | label + placeholder | lỗi inline dưới field | clear input + announce |
| S2 detail | — | subtask "Chưa có bước con." | lỗi field + banner quota | đóng panel + announce |
| S3 settings | — | — | "Thông báo đang bị chặn" + hint | "Đang bật" |
| S4 dialog | — | — | — | đóng + focus return |

---

## Component Library (as-built)

> File thật trong `components/` (20 file). Design-spec §15 gợi ý một số tên khác
> (`TagInput`, `SubtaskEditor`, `RecurrenceField`, `ErrorBanner`) — thực tế gộp vào component cha
> hoặc đặt tên khác; bảng dưới theo code hiện tại.

| Component | File | Vai trò |
|-----------|------|---------|
| App shell | `entrypoints/popup/App.tsx` | View state (list/detail/settings), theme apply, keyboard map |
| Header | `components/Header.tsx` | Title, count subtitle, actions (search/sort/settings) |
| FilterBar | `components/FilterBar.tsx` | Segmented tabs, search toggle, sort/tag menu |
| TaskComposer | `components/TaskComposer.tsx` | Collapsed + expanded form, validation |
| TaskList | `components/TaskList.tsx` | Render list, empty states, skeleton |
| TaskItem | `components/TaskItem.tsx` | Row, checkbox, meta, priority glyph, progress |
| TaskDetail | `components/TaskDetail.tsx` | Panel edit, dirty state, save |
| Settings | `components/Settings.tsx` | Theme radio, notification hint, storage usage |
| ConfirmDialog | `components/ConfirmDialog.tsx` | Dialog xoá / bỏ thay đổi, focus trap |
| Toast | `components/Toast.tsx` | Xoá + Hoàn tác (P2) |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Bắt lỗi render |
| **UI primitives** | `components/ui/` | `Button`, `Field`, `Segmented`, `IconButton`, `Checkbox`, `Menu`, `TagChip`, `PriorityGlyph`, `SubtaskProgress`, `Divider` |

**Icon:** design-spec định dùng `@phosphor-icons/react` (O3) nhưng **chưa cài** — as-built dùng
**SVG inline primitives** (tick checkbox, glyph priority) và icon đơn giản, không dependency icon.
⚠️ Cần thống nhất trước Web Store (xem gap ở [`API_SPEC.md`](API_SPEC.md) §5).

---

## Design Style

- **Overall feel:** Minimal / calm / high-legibility (productivity daily app).
- **Color scheme:** Both (light + dark qua `data-theme` trên `<html>`, `system` theo `prefers-color-scheme`).
- **UI Library:** Tailwind v4 only + custom primitives (không shadcn/MUI).
- **Animation level:** Subtle — CSS transition only, không Motion/GSAP (bundle R-18).

---

## Responsive & Density

- **Popup cố định 360×600** (Chrome giới hạn max 800×600). **Không breakpoint trong popup.**
- `min-width: 320` fallback: padding ngang giảm 10, ẩn subtitle header, tag chip chỉ 1 + `+n`.
- Không horizontal scroll (`overflow-x: hidden`, `break-words`); title clamp 2 dòng, note preview 1 dòng.
- 50 task render hết (không virtualization), row `memo`, sort/filter qua `useMemo`.
- Breakpoint 768/1280: chỉ cho options page full-page **sau này** (ngoài scope).

> Nguyên tắc mobile-first/container-queries trong template gốc áp dụng cho web page;
> với popup cố định, phần lớn là **N/A** — ghi rõ để không áp dụng máy móc.

---

## Motion (CSS-only — design-spec §9, design-tokens.md §8)

| Motion | Chi tiết |
|--------|----------|
| Tick done | checkbox fill 120ms + tick draw 140ms |
| Task enter/exit | opacity + translateY 4px, 120ms |
| Panel mở/đóng | opacity + translateX 8px, 200ms / 160ms |
| Press | scale 0.98, 90ms |

Chỉ animate `transform`/`opacity`. `prefers-reduced-motion: reduce` → duration 0.01ms, tắt translate/scale.
Không shimmer/pulse/infinite loop.

---

## Accessibility (design-spec §10)

- Semantic: `<header>`, `<main>`, `<section aria-label>`; `h1` sr-only, panel `h2`; `aria-live` vùng sr-only duy nhất.
- Checkbox thật (sr-only) + visual; priority glyph `aria-hidden` + text sr-only; `<time datetime>`; tabs `role=group` + `aria-pressed` (không tablist); menu `role=menu` + arrow keys; dialog `aria-modal` + focus trap + focus return.
- Form: `<label for>` hiển thị (không placeholder-as-label), error qua `aria-describedby` + `aria-invalid`.
- Focus ring 2px + offset 2px, không `outline:none`. Hit area ≥44×44 (chip display-only ngoại lệ).
- Contrast AA đã đo; màu không là tín hiệu duy nhất; không text <12px; zoom 150% không cắt text.

---

## Copy deck & format thời gian

Toàn bộ chuỗi tiếng Việt + format thời gian local (Hôm nay/Mai/{Thứ}/DD/MM…): `.context/design-spec.md` §12.
Tên app / `document.title`: **"Việc"**. Ngôn ngữ: `vi`.

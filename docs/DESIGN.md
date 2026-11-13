---
version: alpha
name: Son-Mai-Hoc-Duong-Todo
description: Hệ thiết kế cho extension todo "Học Đường" — nhắc việc cho người đi học. Giao diện mô phỏng tranh sơn mài Việt Nam tông sáng (nền vỏ trứng ngà, vàng kim, đỏ son, nâu sơn ta) pha bố cục trang bản thảo trung cổ (khung viền đôi, chữ cái đầu trang trí, cuộn thư, con dấu son). Mỗi công việc là một cuộn thư, mỗi môn học là một gáy sách, hoàn thành việc là đóng một dấu son. Khi gõ, ô nhập hiển thị chữ như được viết bằng bút lông ngỗng theo từng ký tự. Hỗ trợ hai chế độ hiển thị — Popup (360×560) và New Tab (toàn màn hình) — người dùng tự chọn hoặc để tự động.

colors:
  primary: "#b8381c"
  primary-deep: "#8e2a14"
  primary-wash: "#f4d3c4"
  on-primary: "#fff6e3"
  gold: "#c9962b"
  gold-leaf: "#e2b84a"
  gold-pale: "#f3dc9a"
  on-gold: "#2b1b12"
  jade: "#3f6b4e"
  jade-wash: "#d8e4cf"
  indigo: "#2f5d7c"
  indigo-wash: "#d3e0e6"
  critical: "#9e1b32"
  critical-wash: "#f0cdd3"
  canvas: "#f6ebd3"
  surface-lacquer: "#fbf3e0"
  surface-paper: "#efe0bf"
  surface-sunk: "#e6d3a8"
  ink-deep: "#1a0f0a"
  ink: "#2b1b12"
  brown: "#5a3a26"
  umber: "#7b5a3e"
  sepia: "#9a7b5c"
  hairline: "#c8ae80"
  hairline-soft: "#dcc9a0"
  disabled-text: "#846a4a"

typography:
  hero-display:
    fontFamily: Cormorant Garamond
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: 0.5px
  display-lg:
    fontFamily: Cormorant Garamond
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: 0.4px
  heading-lg:
    fontFamily: Cormorant Garamond
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
  heading-md:
    fontFamily: Cormorant Garamond
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.25
  heading-sm:
    fontFamily: Cormorant Garamond
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  subtitle-lg:
    fontFamily: EB Garamond
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.45
  subtitle-md:
    fontFamily: EB Garamond
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.45
  body-md-bold:
    fontFamily: EB Garamond
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.55
  body-md:
    fontFamily: EB Garamond
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.55
  body-sm-bold:
    fontFamily: EB Garamond
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.5
  body-sm:
    fontFamily: EB Garamond
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  caption-bold:
    fontFamily: EB Garamond
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0.4px
  caption:
    fontFamily: EB Garamond
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  button-md:
    fontFamily: Cormorant Garamond
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 1px
  link-md:
    fontFamily: EB Garamond
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.55
  drop-cap:
    fontFamily: Pirata One
    fontSize: 72px
    fontWeight: 400
    lineHeight: 0.9
  quill-script:
    fontFamily: Dancing Script
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.35
  timer-display:
    fontFamily: Cormorant Garamond
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1
    fontFeature: "lnum, tnum"

rounded:
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  arch: 160px
  full: 100px
  circle: 9999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section-sm: 64px
  section: 96px
  hero: 128px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    border: "1px solid {colors.primary-deep}"
    shadow: "inset 0 1px 0 rgba(255, 246, 227, 0.35), 0 2px 0 #8e2a14"
  button-primary-pressed:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    shadow: "inset 0 2px 4px rgba(26, 15, 10, 0.35)"
  button-primary-disabled:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.disabled-text}"
    border: "1px solid {colors.hairline}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.brown}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "11px 22px"
    border: "1.5px solid {colors.brown}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.brown}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    border: "1px dashed {colors.hairline}"
  button-seal-done:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.circle}"
    size: 44px
    shadow: "inset 0 1px 0 rgba(255, 246, 227, 0.35), 0 2px 0 #8e2a14"
  button-tab-ribbon:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.brown}"
    typography: "{typography.body-sm-bold}"
    rounded: "8px 8px 0 0"
    padding: "8px 16px"
    border: "1px solid {colors.hairline}"
  button-tab-ribbon-active:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.primary-deep}"
    border-bottom: "3px solid {colors.gold}"
  button-icon-round:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: 40px
    border: "1px solid {colors.hairline}"
  segmented-option:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.brown}"
    typography: "{typography.body-sm-bold}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    border: "1px solid {colors.hairline}"
  segmented-option-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.gold-pale}"
  card-popup-shell:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.base}"
    border: "3px double {colors.gold}"
    width: 360px
    height: 560px
  card-newtab-board:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.xl}"
    border: "3px double {colors.gold}"
  card-scroll-task:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.base}"
    border: "1px solid {colors.hairline}"
    shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 2px 0 #c8ae80"
  card-scroll-task-done:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.umber}"
    border: "1px solid {colors.hairline-soft}"
  card-scroll-task-overdue:
    backgroundColor: "{colors.primary-wash}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.primary}"
  card-subject-spine:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-bold}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md} {spacing.base}"
    border-left: "8px solid {colors.primary}"
  card-focus-timer:
    backgroundColor: "{colors.surface-lacquer}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.lg}"
    border: "3px double {colors.gold}"
    shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 8px 20px rgba(90, 58, 38, 0.18)"
  card-streak:
    backgroundColor: "{colors.surface-paper}"
    rounded: "{rounded.lg}"
    padding: "{spacing.base}"
    border: "1px solid {colors.hairline-soft}"
  card-maxim:
    backgroundColor: "transparent"
    textColor: "{colors.brown}"
    typography: "{typography.heading-md}"
    padding: "{spacing.lg}"
    border-top: "1px solid {colors.hairline}"
  card-empty-state:
    backgroundColor: "transparent"
    textColor: "{colors.umber}"
    typography: "{typography.subtitle-md}"
    padding: "{spacing.xl}"
  modal-parchment:
    backgroundColor: "{colors.surface-lacquer}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.xl}"
    border: "3px double {colors.gold}"
    shadow: "0 12px 32px rgba(26, 15, 10, 0.28)"
  quill-input:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    typography: "{typography.quill-script}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.base}"
    border: "1px solid {colors.sepia}"
    height: 56px
  quill-input-focused:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.primary}"
    shadow: "0 0 0 3px rgba(201, 150, 43, 0.35)"
  quill-input-error:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.critical}"
  text-input:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    border: "1px solid {colors.sepia}"
    height: 44px
  text-input-focused:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.primary}"
    shadow: "0 0 0 3px rgba(201, 150, 43, 0.35)"
  text-input-error:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.critical}"
  search-field:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.umber}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.hairline}"
    height: 40px
  checkbox-seal:
    backgroundColor: "{colors.surface-lacquer}"
    rounded: "{rounded.sm}"
    size: 28px
    border: "2px solid {colors.sepia}"
  checkbox-seal-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border: "2px solid {colors.primary-deep}"
  badge-priority-high:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-priority-mid:
    backgroundColor: "{colors.gold-leaf}"
    textColor: "{colors.on-gold}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-priority-low:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-subject:
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  chip-deadline:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.brown}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
    border: "1px solid {colors.hairline}"
  chip-deadline-soon:
    backgroundColor: "{colors.gold-pale}"
    textColor: "{colors.on-gold}"
    border: "1px solid {colors.gold}"
  chip-deadline-overdue:
    backgroundColor: "{colors.primary-wash}"
    textColor: "{colors.primary-deep}"
    border: "1px solid {colors.primary}"
  toast-reminder:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.base}"
    border: "1px solid {colors.gold}"
    border-left: "6px solid {colors.primary}"
    shadow: "0 8px 20px rgba(90, 58, 38, 0.22)"
  banner-proclamation:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm-bold}"
    padding: "{spacing.md} {spacing.lg}"
  timer-dial:
    backgroundColor: "{colors.surface-lacquer}"
    textColor: "{colors.ink}"
    typography: "{typography.timer-display}"
    rounded: "{rounded.circle}"
    size: 220px
    border: "4px double {colors.gold}"
  progress-ink:
    backgroundColor: "{colors.surface-sunk}"
    rounded: "{rounded.full}"
    height: 8px
    border: "1px solid {colors.hairline}"
  streak-lotus:
    backgroundColor: "{colors.surface-sunk}"
    rounded: "{rounded.circle}"
    size: 28px
  streak-lotus-lit:
    backgroundColor: "{colors.gold-leaf}"
    border: "2px solid {colors.gold}"
  footer-colophon:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.umber}"
    typography: "{typography.caption}"
    padding: "{spacing.lg} {spacing.xl}"
    border-top: "1px solid {colors.hairline}"
---

## Overview

Học Đường là một cuốn sổ tay của người đi học, không phải một bảng quản lý dự án. Cảm giác chủ đạo: nâng niu từng việc nhỏ. Nền là mặt sơn mài sáng màu vỏ trứng ngà ({colors.canvas}), viền khung đôi vàng kim như trang bản thảo trung cổ, và những chi tiết thủ công — cuộn thư, gáy sách, bút lông ngỗng, con dấu son — thay cho các icon phẳng quen thuộc.

Nếu hệ thiết kế thương mại (Meta) lấy ảnh sản phẩm làm trung tâm và nút bấm hình viên thuốc, hệ này đảo lại: **trang giấy là trung tâm**, ảnh minh họa chỉ nằm ở viền và góc; nút là những tấm bảng sơn bóng (plaque) bo góc nhỏ; điểm nhấn là **đỏ son** cho hành động chính và **vàng kim** cho đường viền, không dùng xanh dương.

Chữ được chọn vì hai lẽ: có dấu tiếng Việt đầy đủ và gợi cảm giác chữ in cổ. Cormorant Garamond cho tiêu đề và nút, EB Garamond cho đoạn chữ, Pirata One cho chữ cái đầu trang trí (drop cap), Dancing Script **chỉ** cho chữ viết tay hiện ra khi người dùng gõ vào ô nhập.

Extension có hai chế độ hiển thị, người dùng chọn trong Cài đặt hoặc để **Tự động**:
- **Popup** (360×560px): một cột, ưu tiên ghi nhanh một việc rồi đi.
- **New Tab**: toàn màn hình, ba vùng "giá sách – cuộn thư – bàn học".

**Key Characteristics:**
- Nền vỏ trứng ngà ({colors.canvas}), thẻ nổi lên bằng lớp sơn bóng {colors.surface-lacquer}; không có nền trắng tinh
- Khung viền đôi vàng kim (`3px double {colors.gold}`) bao quanh popup, bảng New Tab, thẻ giờ học và hộp thoại
- Một màu hành động duy nhất: đỏ son {colors.primary} cho nút chính, con dấu hoàn thành, ô nhập khi focus
- Mỗi công việc là một "cuộn thư" ({components.card-scroll-task}); mỗi môn học là một "gáy sách" ({components.card-subject-spine})
- Hoàn thành việc = đóng dấu son "XONG" lên cuộn, không gạch ngang chữ
- Ô nhập chính ({components.quill-input}) có cây bút lông ngỗng chạy theo con trỏ và viết từng chữ người dùng gõ
- Bo góc nhỏ đến vừa (4–12px) cho phần lớn thành phần; chỉ đồng hồ và nút dấu mới tròn hẳn

## Colors

> Nguồn cảm hứng: tranh sơn mài Việt Nam tông sáng (nền vỏ trứng khảm, vàng son, nâu sơn ta), bản thảo trung cổ (vellum, chu sa, vàng lá). Toàn bộ là chủ đề sáng; chưa có chế độ tối (xem Known Gaps).

### Brand & Accent
- **Đỏ son** ({colors.primary}): Nút chính ("Ghi vào sổ", "Bắt đầu học"), con dấu hoàn thành, viền ô nhập khi focus, thanh nhắc nhở bên trái toast. Giữ khan hiếm: một màn hình tối đa vài điểm đỏ.
- **Đỏ cánh gián** ({colors.primary-deep}): Trạng thái nhấn (pressed), viền nút, chữ trên nền {colors.primary-wash}.
- **Đỏ son nhạt** ({colors.primary-wash}): Nền thẻ quá hạn, chip quá hạn.
- **Vàng kim** ({colors.gold}): Viền khung đôi, đường kẻ trang trí, tab đang chọn. **Không dùng làm chữ** hoặc viền chức năng độc lập vì độ tương phản với nền chỉ khoảng 2.3:1.
- **Vàng lá** ({colors.gold-leaf}): Nền huy hiệu ưu tiên vừa, ngày streak đã sáng, mức độ "sắp đến hạn".
- **Vàng nhạt** ({colors.gold-pale}): Nền chip sắp đến hạn, chữ trên nền mực đậm (segmented active).

### Surface
- **Vỏ trứng ngà** ({colors.canvas}): Nền trang (popup, New Tab).
- **Sơn bóng sáng** ({colors.surface-lacquer}): Bề mặt thẻ, ô nhập, hộp thoại — sáng hơn nền một bậc, tạo cảm giác lớp sơn nổi.
- **Giấy dó** ({colors.surface-paper}): Thẻ việc đã xong, gáy sách, tab chưa chọn, chip.
- **Giấy lún** ({colors.surface-sunk}): Rãnh thanh tiến độ, ô streak chưa sáng, nút vô hiệu.
- **Đường kẻ** ({colors.hairline}) và **Đường kẻ nhạt** ({colors.hairline-soft}): Chia khu, viền thẻ. Đường kẻ trang trí, không dùng làm viền thành phần tương tác duy nhất.
- **Nâu giấy cũ** ({colors.sepia}): Viền ô nhập và checkbox (≥ 3:1 trên nền, đạt chuẩn viền thành phần giao diện).

### Text (mực)
- **Mực đen** ({colors.ink-deep}): Dùng rất ít — tiêu đề lớn nhấn mạnh.
- **Mực sơn ta** ({colors.ink}): Chữ chính trên mọi nền sáng.
- **Nâu sơn** ({colors.brown}): Chữ phụ, nhãn tab, nút phụ (≈ 8:1 trên nền).
- **Nâu đất** ({colors.umber}): Chú thích, chữ việc đã xong, footer (≈ 5:1).
- **Nâu bạc** ({colors.disabled-text}): Chỉ cho trạng thái vô hiệu.

### Semantic
- **Ngọc lục** ({colors.jade}): Ưu tiên thấp, "đã lưu", streak giữ được. Nền nhạt {colors.jade-wash}.
- **Chàm** ({colors.indigo}): Thông tin, nhãn môn học mặc định. Nền nhạt {colors.indigo-wash}.
- **Vàng lá** ({colors.gold-leaf}): Cảnh báo "sắp đến hạn", ưu tiên vừa.
- **Đỏ thẫm** ({colors.critical}): Lỗi nhập liệu, xóa. Phân biệt với đỏ son bằng sắc tía hơn; nền nhạt {colors.critical-wash}.

### Màu nhãn môn học
Gáy sách dùng viền trái 8px đổi màu theo môn. Lấy từ cùng bảng: {colors.primary} · {colors.indigo} · {colors.jade} · {colors.gold} · {colors.umber}. Tối đa 5 môn có màu riêng, môn thứ 6 trở đi dùng {colors.sepia}. Không thêm màu ngoài bảng này.

## Typography

### Font Family
**Cormorant Garamond** (tiêu đề, nút, đồng hồ) — nét thanh, mang dáng chữ in cổ, hỗ trợ tiếng Việt.
**EB Garamond** (đoạn chữ, nhãn) — dễ đọc ở cỡ 15–17px; cỡ chữ cơ sở được nâng lên 17px vì Garamond có chiều cao x thấp.
**Pirata One** — chỉ làm chữ cái đầu trang trí (drop cap) ở lời chào New Tab và tiêu đề hộp thoại; không dùng cho đoạn chữ.
**Dancing Script** — chỉ cho chữ trong {components.quill-input} khi người dùng gõ; sau khi lưu, nội dung việc hiển thị lại bằng EB Garamond cho dễ đọc.
Fallback: Cormorant Garamond → Georgia, "Times New Roman", serif; Dancing Script → "Segoe Script", cursive.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 56px | 700 | 1.12 | 0.5px | Lời chào New Tab ("Chào buổi sáng") |
| `{typography.display-lg}` | 40px | 700 | 1.15 | 0.4px | Tiêu đề trang cài đặt |
| `{typography.heading-lg}` | 32px | 600 | 1.2 | 0 | Tên khu vực ("Cuộn nhiệm vụ", "Bàn học") |
| `{typography.heading-md}` | 24px | 500 | 1.25 | 0 | Châm ngôn học tập, tiêu đề hộp thoại |
| `{typography.heading-sm}` | 20px | 700 | 1.3 | 0 | Tiêu đề thẻ, tên môn học |
| `{typography.subtitle-lg}` | 18px | 600 | 1.45 | 0 | Tên việc nổi bật |
| `{typography.subtitle-md}` | 18px | 400 | 1.45 | 0 | Mô tả ngắn, trạng thái rỗng |
| `{typography.body-md}` | 17px | 400 | 1.55 | 0 | Nội dung việc, ghi chú |
| `{typography.body-md-bold}` | 17px | 700 | 1.55 | 0 | Nhấn mạnh trong đoạn |
| `{typography.body-sm}` | 15px | 400 | 1.5 | 0 | Phụ đề thẻ, giờ nhắc |
| `{typography.body-sm-bold}` | 15px | 700 | 1.5 | 0 | Nhãn tab, tên gáy sách |
| `{typography.caption-bold}` | 13px | 700 | 1.4 | 0.4px | Huy hiệu, chip hạn |
| `{typography.caption}` | 13px | 400 | 1.4 | 0 | Footer, chú thích nhỏ |
| `{typography.button-md}` | 16px | 700 | 1.25 | 1px | Nhãn nút (viết HOA ở nút chính) |
| `{typography.link-md}` | 17px | 600 | 1.55 | 0 | Liên kết, gạch chân nét đứt |
| `{typography.drop-cap}` | 72px | 400 | 0.9 | 0 | Chữ cái đầu trang trí |
| `{typography.quill-script}` | 24px | 500 | 1.35 | 0 | Chữ trong ô nhập bút lông |
| `{typography.timer-display}` | 64px | 600 | 1 | 0 | Số đồng hồ Pomodoro |

### Principles
- Tiêu đề thanh – nặng ở 600–700, đoạn chữ 400. Không dùng weight 300 vì Garamond mảnh sẽ khó đọc trên nền ngà.
- Số trên đồng hồ và hạn chót bật `lnum, tnum` (số thẳng hàng, độ rộng đều) để không nhảy khi đếm; số trong đoạn chữ có thể giữ số kiểu cổ (oldstyle) mặc định của Garamond.
- Nút chính viết HOA với giãn chữ 1px, như nhãn trên con dấu; nút phụ viết thường.
- Đoạn chữ không dài quá ~60 ký tự mỗi dòng; trong popup, tên việc cắt 2 dòng rồi "…".
- Chữ tiếng Việt cần dòng cao hơn chữ Latin thông thường để dấu không dính dòng: không giảm `lineHeight` của `{typography.body-md}` dưới 1.55.
- Dancing Script không bao giờ dùng cho chữ cần đọc nhanh (danh sách, giờ, nhãn).

## Layout

### Spacing System
- **Base unit**: 4px, bước chính 8/12/16.
- **Tokens**: `{spacing.xxs}` (4px) · `{spacing.xs}` (6px) · `{spacing.sm}` (8px) · `{spacing.md}` (12px) · `{spacing.base}` (16px) · `{spacing.lg}` (24px) · `{spacing.xl}` (32px) · `{spacing.xxl}` (48px) · `{spacing.section-sm}` (64px) · `{spacing.section}` (96px) · `{spacing.hero}` (128px).
- **Nhịp**: Popup chặt (12–16px giữa các thẻ). New Tab thoáng hơn: 24px giữa thẻ trong cuộn, 32px giữa ba vùng, 64–96px phía trên lời chào.
- **Đệm thẻ**: Cuộn việc 16px; thẻ giờ học và hộp thoại 24–32px.

### Display Modes (Popup / New Tab / Tự động)
Cài đặt có điều khiển ba lựa chọn dạng {components.segmented-option}: **Popup** · **New Tab** · **Tự động**.
- **Popup**: bấm biểu tượng extension mở cửa sổ 360×560px (trong giới hạn popup của Chrome). Trang tab mới **không** trả về mặc định của trình duyệt — extension vẫn ghi đè và hiện trang chào yên tĩnh (`QuietNewTab`): lời chào + cửa sổ học tập + nút "Mở sổ Học Đường" + chú thích hướng dẫn tắt quyền ghi đè ở `chrome://extensions`.
- **New Tab**: extension thay trang tab mới bằng bảng toàn màn hình; bấm biểu tượng sẽ mở/focus tab Học Đường thay vì popup.
- **Tự động**: bấm biểu tượng → Popup; mở tab mới → New Tab. Người dùng có thể ghim lại bất kỳ lúc nào; lựa chọn được lưu và đồng bộ.
- Cùng một bộ token và component cho cả hai chế độ; chỉ khác bố cục (bên dưới), không có component riêng cho từng chế độ.

### Bố cục Popup (360×560)
Một cột, từ trên xuống, đều nằm trong `{components.card-popup-shell}`:
1. **Đầu trang** (56px): đèn dầu 36px + tên "Học Đường" bằng `{typography.heading-sm}` + dòng đếm `{typography.caption}` màu {colors.umber} có `aria-live="polite"` ("3 việc đang chờ, 1 quá hạn.") + **ba** nút icon tròn ({components.button-icon-round}): âm thanh bật/tắt, mở bảng lớn ở tab mới, cài đặt. Nút chuyển chế độ hiển thị chỉ nằm trong Cài đặt, không có trên đầu trang.
2. **Khu ghi việc** (72px): {components.quill-input} + nút "Ghi" ({components.button-primary}).
3. **Dải lọc** (hai hàng): hàng 1 là dải tab {components.button-tab-ribbon} cuộn ngang — **Tất cả · Hôm nay · Sắp tới · Đã xong**, mỗi tab kèm số việc; hàng 2 là ô chọn môn `.filter-subject` (chấm màu gáy sách + tên môn + mũi tên, mở menu) · nút sắp xếp · nút tìm việc (khi mở, ô tìm kiếm thay chỗ ô chọn môn). Popup không có "Giá sách" nên lọc theo môn nằm ở hàng này.
4. **Cuộn việc**: vùng cuộn dọc, các {components.card-scroll-task} cách nhau 12px.
5. **Chân trang cố định** (64px): đồng hồ Pomodoro thu gọn bên trái — dial 48px, số `{typography.subtitle-lg}`, một nút play 32px — và 7 đài sen 24px ({components.streak-lotus}, thu từ 28px cho vừa 360px) bên phải.

### Bố cục New Tab
Lưới 3 vùng, rộng tối đa 1280px, lề 32px, nằm trong `{components.card-newtab-board}`:
- **Cột trái (240px) — "Giá sách"**: danh sách {components.card-subject-spine}, mỗi gáy hiển thị tên môn + số việc còn lại; nút "Thêm môn" kiểu {components.button-ghost}.
- **Cột giữa (1fr, tối đa 640px) — "Cuộn nhiệm vụ"**: trên cùng lời chào `{typography.hero-display}` với drop cap, ô {components.quill-input} cỡ lớn, rồi dải tab, rồi danh sách cuộn.
- **Cột phải (320px) — "Bàn học"**: {components.card-focus-timer}, {components.card-streak}, rồi {components.card-maxim} đóng cột.
- **Chân trang**: {components.footer-colophon} một dòng ("Học, nhớ, rồi lại học.") và liên kết cài đặt.

### Whitespace Philosophy
Khoảng trắng là *mặt giấy*, không phải khoảng trống: giữ lề rộng quanh cuộn việc để mỗi việc "đứng riêng". Trong Popup ưu tiên mật độ; trong New Tab ưu tiên cảm giác tĩnh, mỗi vùng có khung đôi riêng và không quá ba loại thẻ trên một màn hình.

## Elevation & Depth

Hệ này **bóng loáng chứ không đổ bóng sâu**: chiều sâu đến từ lớp sơn (vệt sáng phía trên + gờ dưới), không từ bóng mờ lớn.

| Level | Treatment | Use |
|---|---|---|
| 0 (phẳng) | Không bóng; viền `1px solid {colors.hairline-soft}` | Thẻ việc đã xong, gáy sách, empty state |
| 1 (lớp sơn) | `inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 2px 0 #c8ae80` | Cuộn việc, nút chính (gờ dưới theo màu viền) |
| 2 (nổi) | `0 8px 20px rgba(90, 58, 38, 0.18)` | Thẻ giờ học, toast nhắc nhở |
| 3 (che nền) | `0 12px 32px rgba(26, 15, 10, 0.28)` | Hộp thoại {components.modal-parchment} |

### Decorative Depth
- **Khung đôi vàng kim** (`3px double {colors.gold}`): dấu hiệu nhận diện, dùng cho popup, bảng New Tab, thẻ giờ học, hộp thoại; không dùng cho thẻ việc.
- **Họa tiết góc** (24×24px, nét vàng kim): hoa sen hoặc mây cuộn ở bốn góc khung chính; ẩn trong Popup nếu chật.
- **Vệt sáng sơn mài**: gradient `linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%)` phủ lên thẻ nổi (level 1–2). Tùy chọn, tắt được trong Cài đặt để tiết kiệm pin.
- **Hạt khảm vỏ trứng**: chấm li ti 2–3% độ mờ trên {colors.canvas}; coi là chất liệu trang trí, không phải token màu.
- **Đường phân cách "mây"**: dải 12px lặp họa tiết mây giữa các khu lớn trong New Tab.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 2px | Góc vi mô, dấu tích |
| `{rounded.sm}` | 4px | Huy hiệu, checkbox dấu, gáy sách |
| `{rounded.md}` | 8px | Nút, ô nhập, tab (chỉ góc trên) |
| `{rounded.lg}` | 12px | Cuộn việc, toast, thẻ streak |
| `{rounded.xl}` | 16px | Khay phụ, thẻ cỡ vừa |
| `{rounded.xxl}` | 24px | Thẻ giờ học, hộp thoại |
| `{rounded.arch}` | 160px | Khung ảnh minh họa dạng vòm trên cửa sổ trung cổ (chỉ hai góc trên) |
| `{rounded.full}` | 100px | Chip hạn, thanh tiến độ |
| `{rounded.circle}` | 50% | Đồng hồ, nút dấu, nút icon, ô streak |

### Geometry Rules
- Nút là **tấm sơn bo nhẹ** (8px), không phải viên thuốc — khác hẳn pill; tránh bo ≥ 16px cho nút.
- Minh họa trên trạng thái rỗng và lời chào dùng khung vòm (`border-radius: 160px 160px 12px 12px`), gợi ô cửa sổ nhà thờ/tu viện.
- Con dấu "XONG" là hình vuông bo 4px nghiêng −6°, viền đôi, như con dấu triện; không dùng hình tròn cho dấu này.
- Icon dạng nét, đầu nét tròn, dày 1.5px, màu {colors.brown}; icon đặc dùng {colors.primary} chỉ cho hành động chính.

## Components

> Chính sách hover: không ghi trạng thái hover (như hệ gốc). Chỉ ghi mặc định, pressed/active, focus, disabled.

### Buttons

**`button-primary`** — Tấm sơn đỏ son cho hành động chính ("GHI VÀO SỔ", "BẮT ĐẦU HỌC").
- Background `{colors.primary}`, text `{colors.on-primary}` (≈ 5.4:1), typography `{typography.button-md}`, rounded `{rounded.md}`, padding `12px 24px`, viền `{colors.primary-deep}`, bóng level 1 theo màu đỏ.
- Pressed: nền `{colors.primary-deep}`, bóng chuyển thành `inset` lõm xuống.
- Disabled: nền `{colors.surface-sunk}`, chữ `{colors.disabled-text}`.
- Mỗi màn hình chỉ có **một** nút chính.

**`button-secondary`** — Viền nâu, nền trong ("Hủy", "Để sau").
- Viền `1.5px solid {colors.brown}`, chữ `{colors.brown}`, padding `11px 22px`, rounded `{rounded.md}`.

**`button-ghost`** — Viền nét đứt như đường may, cho thao tác nhẹ ("Thêm môn", "Xem tất cả").
- Viền `1px dashed {colors.hairline}`, chữ `{colors.brown}`, padding `10px 18px`.

**`button-seal-done`** — Nút tròn 44px đỏ son ở đầu mỗi cuộn việc, bấm để đóng dấu "XONG". Hiệu ứng dấu: xem `card-scroll-task` bên dưới.

**`button-tab-ribbon`** + **`button-tab-ribbon-active`** — Tab như dải đánh dấu trang.
- Chưa chọn: nền `{colors.surface-paper}`, chữ `{colors.brown}`, viền `1px solid {colors.hairline}`, góc trên bo 8px.
- Đang chọn: nền `{colors.surface-lacquer}`, chữ `{colors.primary-deep}`, gờ dưới `3px solid {colors.gold}` thay viền.

**`segmented-option`** + **`segmented-option-active`** — Bộ chọn chế độ hiển thị (Popup / New Tab / Tự động) và khoảng Pomodoro.
- Đang chọn: nền `{colors.ink}`, chữ `{colors.gold-pale}`.

**`button-icon-round`** — Nút icon tròn 40px (cài đặt, chuyển chế độ, snooze). Lên 44px trong popup cảm ứng.

### Cards & Containers

**`card-popup-shell`** / **`card-newtab-board`** — Khung ngoài của hai chế độ. Nền {colors.canvas}, khung đôi vàng kim `3px double`.

**`card-scroll-task`** — "Cuộn thư" cho một công việc: thành phần chính của extension.
- Nền `{colors.surface-lacquer}`, rounded `{rounded.lg}`, padding `{spacing.base}`, viền `1px solid {colors.hairline}`, bóng level 1.
- Hai đầu cuộn: thanh trục nhỏ 6px màu {colors.hairline} ở trên và dưới (trang trí).
- Bố cục hàng: `button-seal-done` hoặc `checkbox-seal` (trái) · tên việc `{typography.subtitle-lg}` (giữa) · dấu "XONG" (phải, khi hoàn thành).
- Hàng chip meta: **New Tab** = 2 hàng trong cột nội dung (hàng 1 `chip-deadline` / `badge-priority-*` / "Lặp lại", hàng 2 `badge-subject` / tag / tiến độ subtask). **Popup (compact)** = 1 hàng flex-wrap trải toàn bề rộng thẻ, đặt dưới hàng tiêu đề, gộp đủ mọi chip theo thứ tự trên — hết chỗ wrap xuống dòng, không ẩn dữ liệu (spec delta 2026-11-12).
- **Hoàn thành**: dấu "XONG" ép xuống 240ms (`scale 1.4 → 1`, nghiêng −6°, `mix-blend-mode: multiply`), thẻ chuyển sang `card-scroll-task-done`. Có nút "Hoàn tác" 5 giây.

**`card-scroll-task-done`** — Nền {colors.surface-paper}, chữ {colors.umber}, dấu đỏ ở góc. Giữ nguyên chữ, không gạch ngang.

**`card-scroll-task-overdue`** — Nền {colors.primary-wash}, viền {colors.primary}, đi kèm `chip-deadline-overdue`.

**`card-subject-spine`** — Gáy sách môn học, **chỉ ở New Tab**: cột "Giá sách" từ 1024px, và dải ngang `.shelf-strip` (wrap thay vì cắt môn) dưới 1024px.
- Nền {colors.surface-paper}, rounded 4px, viền trái 8px theo màu môn, tên môn `{typography.body-sm-bold}` + số việc còn lại bên phải.
- Đang chọn: nền chuyển {colors.surface-lacquer}, viền trái giữ màu, thêm gờ vàng kim 1px quanh thẻ.
- Ở dải ngang, gáy sách đổi thành tab môn: giữ một vạch màu gáy 4px ở cạnh trên (`.ribbon-tab[data-spine]`).
- **Popup không dùng gáy sách**: lọc theo môn là menu `.filter-subject` (nền giấy, viền mảnh, chấm 8px màu gáy sách, mũi tên nét mảnh) — xem bố cục Popup.

**`card-focus-timer`** — Khu Pomodoro.
- Nền {colors.surface-lacquer}, rounded `{rounded.xxl}`, khung đôi vàng kim, bóng level 2.
- Gồm {components.timer-dial}, thanh {components.progress-ink} theo chu kỳ, hàng nút (Bắt đầu / Tạm dừng / Bỏ qua) và bộ chọn thời lượng 25/5 hoặc 50/10 ({components.segmented-option}).

**`card-streak`** — Chuỗi ngày học: 7 ô {components.streak-lotus} nối tiếp, nhãn "Chuỗi 5 ngày" bằng `{typography.heading-sm}`.

**`card-maxim`** — Một châm ngôn học tập mỗi ngày, `{typography.heading-md}` màu {colors.brown}, trích nguồn `{typography.caption}`; có đường kẻ trên.

**`card-empty-state`** — Khi chưa có việc: khung vòm vẽ cuộn thư trắng + một câu `{typography.subtitle-md}` ("Chưa có điều gì cần ghi. Hãy cầm bút lên."), mũi tên nhẹ trỏ tới ô nhập.

**`modal-parchment`** — Hộp thoại chi tiết việc (sửa hạn, ghi chú, môn học, lặp lại).
- Nền {colors.surface-lacquer}, rounded `{rounded.xxl}`, khung đôi vàng kim, bóng level 3; tiêu đề có drop cap.

### Inputs & Forms

**`quill-input`** — Ô nhập việc chính, xem **Signature Components** để biết cách cây bút hoạt động.
- Nền {colors.surface-lacquer}, chữ {colors.ink}, typography `{typography.quill-script}`, viền `1px solid {colors.sepia}`, cao 56px, có đường kẻ ngang mờ phía dưới như giấy kẻ.
- Placeholder bằng EB Garamond nghiêng, màu {colors.umber}: "Hôm nay con cần làm gì?".

**`quill-input-focused`** — Viền `2px solid {colors.primary}` + quầng vàng `0 0 0 3px` mờ 35%.
**`quill-input-error`** — Viền `1px solid {colors.critical}`; nhãn lỗi bên dưới bằng `{typography.body-sm}` màu {colors.critical}.

**`text-input`** — Trường thông thường (ghi chú, tên môn, giờ nhắc).
- Nền {colors.surface-lacquer}, chữ {colors.ink}, viền `1px solid {colors.sepia}`, cao 44px, rounded 8px. Trạng thái `text-input-focused` và `text-input-error` như quill-input nhưng cùng chữ EB Garamond (không dùng chữ viết tay).

**`search-field`** — Ô tìm việc: nền {colors.surface-paper}, rounded 8px, cao 40px, icon kính lúp nét mảnh bên trái.

**`checkbox-seal`** + **`checkbox-seal-checked`** — Ô chọn vuông 28px, viền {colors.sepia}. Khi chọn: nền {colors.primary}, hiện chữ "XONG" thu nhỏ hoặc dấu tích cách điệu màu {colors.on-primary}.

### Badges & Status

**`badge-priority-high`** / **`-mid`** / **`-low`** — Mức ưu tiên Cao / Vừa / Thấp.
- Cao: nền {colors.primary}, chữ {colors.on-primary}. Vừa: nền {colors.gold-leaf}, chữ {colors.on-gold}. Thấp: nền {colors.jade}, chữ {colors.on-primary}.
- Luôn kèm **chữ** ("Cao/Vừa/Thấp"), không chỉ dựa vào màu.

**`badge-subject`** — Nhãn môn học: nền {colors.indigo-wash} (hoặc màu nhạt tương ứng môn), chữ {colors.ink}.

**`chip-deadline`** — Hạn chót dạng "Hôm nay 18:00". Mặc định nền {colors.surface-paper}; **`chip-deadline-soon`** (còn dưới 24 giờ) nền {colors.gold-pale}; **`chip-deadline-overdue`** nền {colors.primary-wash}, chữ {colors.primary-deep}.

**`banner-proclamation`** — Dải "chiếu chỉ" đỏ son ở đầu bảng khi có việc quá hạn hoặc đến giờ ("Còn 3 việc đang chờ con hôm nay"). Chữ `{typography.body-sm-bold}`, có nút đóng; không chiếm quá một dòng trong popup.

### Reminders (Nhắc nhở)

**`toast-reminder`** — Thông báo trong trang khi đến giờ nhắc.
- Nền {colors.surface-lacquer}, viền vàng kim, thanh trái 6px đỏ son, bóng level 2, bo 12px.
- Nội dung: tên việc `{typography.subtitle-lg}`, môn + hạn `{typography.body-sm}`, hai nút: **Xong** ({components.button-primary} nhỏ) và **Nhắc lại sau 10 phút** ({components.button-secondary}).
- Với thông báo hệ điều hành (chrome.notifications): dùng cùng văn bản và biểu tượng cuộn thư; không thể tạo kiểu, chỉ giữ giọng văn.
- Giọng nhắc nhở: ấm, ngắn, xưng "con/bạn" nhất quán toàn ứng dụng — chọn một và giữ.

### Pomodoro & Streak

**`timer-dial`** — Đồng hồ tròn 220px cho "Bàn học": nền {colors.surface-lacquer}, viền đôi vàng kim, số `{typography.timer-display}`, vòng tiến độ nét {colors.primary} chạy quanh viền khi đang đếm. **Popup dùng bản 48px riêng** (`data-size='sm'`: viền 2px, số `{typography.subtitle-lg}`) đặt cạnh một nút play 32px — không thu nhỏ dial 220px.

**`progress-ink`** — Thanh tiến độ 8px: rãnh {colors.surface-sunk}, phần đã đi tô {colors.primary}; dùng cho "đã xong 3/7 việc hôm nay".

**`streak-lotus`** + **`streak-lotus-lit`** — Ô ngày 28px; ngày đã học nền {colors.gold-leaf}, viền {colors.gold}, kèm hình đài sen nhỏ. Ô chưa tới dùng {colors.surface-sunk}.

### Navigation

**Đầu trang (Popup)** — Đèn dầu + tên "Học Đường" + dòng đếm có `aria-live`, rồi ba nút icon: âm thanh, mở bảng lớn, cài đặt; không có menu hamburger.
**Đầu trang (New Tab)** — Lời chào bên trái, hôm nay là thứ mấy ngày mấy bên phải; nút Cài đặt ở góc.
**Dải tab** — {components.button-tab-ribbon}: *Tất cả · Hôm nay · Sắp tới · Đã xong* (kèm số việc). Ở New Tab, môn học nằm ở "Giá sách" nên dải tab chỉ có hàng này; ở Popup có thêm hàng lọc môn + sắp xếp + tìm việc.

### Signature Components

**`quill-input` — Bút lông viết chữ theo người gõ.** Ô nhập thật vẫn là một `<input>` chuẩn (để IME, đọc màn hình, dán, hoàn tác hoạt động); lớp bút chỉ là phần trang trí đặt chồng lên, `aria-hidden="true"`.
- **Cây bút mặc định**: biểu tượng bút lông ngỗng 28×28px, nghiêng 35°, đầu ngòi đặt ở vị trí con trỏ. Bàn tay cầm bút là biến thể thay thế (cài đặt "Bút / Bàn tay cầm bút"), cùng kích thước, cùng điểm neo ở đầu ngòi.
- **Chữ hiện ra**: mỗi ký tự *đã xác nhận* hiện bằng hiệu ứng mực thấm: `opacity 0 → 1` và `blur 1px → 0` trong 180ms `ease-out`; màu chữ bắt đầu {colors.brown} (mực ướt) rồi sẫm dần sang {colors.ink} trong ~800ms (mực khô).
- **Bút chuyển động**: nhún 2px theo mỗi ký tự (120ms), trượt theo con trỏ; ngừng gõ 600ms thì bút nhấc lên, nghiêng nhẹ rồi nằm yên cạnh ô.
- **Bắt gõ tiếng Việt (Telex/VNI)**: trong lúc đang ghép dấu (`compositionstart` → `compositionend`) **không** chạy hiệu ứng mực; chữ đang ghép chỉ gạch chân nét mảnh {colors.sepia}, đến khi chốt mới thấm mực. Tránh chữ nhấp nháy khi bỏ dấu.
- **Ghi vào sổ** (Enter hoặc nút): chữ khô hẳn, một cuộn thư mới trượt xuống đầu danh sách trong 240ms, ô nhập xóa trống và bút trở về lọ mực.
- **Giảm chuyển động**: nếu `prefers-reduced-motion: reduce` hoặc người dùng tắt "Hiệu ứng bút", ẩn bút, giữ chữ hiện ngay, màu chuyển tức thì.
- **Giới hạn**: tối đa 200 ký tự; quá dài thì bút ngừng, ô vẫn nhận chữ nhưng không chạy hiệu ứng thêm.

**`hero-greeting`** (chỉ New Tab) — Lời chào `{typography.hero-display}` với chữ cái đầu trang trí `{typography.drop-cap}` màu {colors.primary}, ngay dưới là câu phụ `{typography.subtitle-md}` ("Hôm nay có 4 việc cần ghi nhớ"), nền khung vòm minh họa cửa sổ ở bên phải.

**`seal-stamp`** — Con dấu "XONG": hình vuông bo 4px, viền đôi {colors.primary}, chữ Cormorant 700 HOA màu {colors.primary}, nghiêng −6°, kích thước 64×64px trên cuộn việc (40×40 trong popup). Thành tích (hoàn thành cả ngày, streak 7 ngày) dùng dấu lớn hơn với chữ khác ("ĐẠT", "BỀN CHÍ").

**`footer-colophon`** — Dòng cuối trang theo kiểu cuối bản thảo: một câu ngắn bằng `{typography.caption}` màu {colors.umber}, trên đường kẻ {colors.hairline}.

## Motion (as-built)

> Token lấy từ `styles/tokens.css`; component không tự đặt số riêng. Mục tiêu: chuyển động **một chiều, ngắn, có mục đích** — mực thấm khi gõ, cuộn thư mở, con dấu đóng — không có animation trang trí lặp.

| Token / giá trị | Dùng cho |
|---|---|
| `--dur-ink` 180ms · `--ease-ink` | Mực thấm từng ký tự: `opacity 0→1`, `blur 1px→0` |
| `--dur-dry` 800ms (linear) | Mực khô: màu chữ {colors.brown} → {colors.ink} |
| `--dur-nib` 120ms | Ngòi bút nhún 2px theo ký tự (`nib-tap`), bút trượt theo con trỏ |
| `--dur-slide` 240ms · `--ease-out` | Cuộn thư mới trượt vào, con dấu đóng (`seal-strike` `scale 1.4→1`, −6°), toast trượt lên, hộp thoại/tờ giấy da mở, thanh tiến độ đổi độ dài, đài sen sáng (`lotus-light` `scale 0.85→1`, opacity 0→1) |
| `--dur-fast` 140ms · `--ease-out` | Đổi nền/viền của nút, tab, menu, ô lọc; lớp phủ fade; menu thả xuống mở/đóng (`menu-fade-in`/`menu-fade-out` `translateY` −4px→0 + opacity) |
| `--ease-out` `cubic-bezier(.16,1,.3,1)` | Mặc định cho mọi transition/animation một chiều |
| `--ease-ink` `cubic-bezier(.22,.61,.36,1)` | Riêng hiệu ứng mực và nhịp thở của skeleton |
| 900ms linear | Vòng tiến độ đồng hồ (`stroke-dashoffset`) — chạy đều theo giây, không nảy |
| 1.6s `infinite` (`--ease-ink`) | Skeleton "cuộn chờ" khi đang đọc sổ (`skeleton-breathe`) |

**Nguyên tắc**
- Chỉ skeleton lặp; mọi hiệu ứng khác chạy một lần rồi dừng. Không phát lại dấu "XONG" khi cuộn danh sách.
- Không animate thuộc tính bố cục (`top/left/height`) trừ thanh tiến độ; ưu tiên `transform` + `opacity` + màu.
- Không dùng `hover` làm tín hiệu duy nhất (xem chính sách ở mục Components).

**Giảm chuyển động** (`prefers-reduced-motion: reduce`, `styles/base.css`)
- Set 5 token `--dur-*` về `0.01ms` và ép `animation-duration` / `transition-duration` = `0.01ms !important`, `animation-iteration-count: 1` cho mọi phần tử: trạng thái đổi tức thì, mực hiện ngay, dấu đóng ngay, skeleton đứng yên.
- **Tắt hiệu ứng bút** (`:root[data-quill='off']`): ẩn ngòi bút, huỷ animation mực, chữ hiện ngay màu {colors.ink}.
- **Tắt họa tiết** (`:root[data-ornaments='off']`): ẩn họa tiết góc và dải mây hai bên bảng New Tab.

## Do's and Don'ts

### Do
- Dùng {colors.primary} (đỏ son) cho **một** hành động chính mỗi màn hình, cho con dấu hoàn thành và focus.
- Dùng viền đôi vàng kim (`3px double {colors.gold}`) cho các khung lớn; dùng viền mảnh {colors.hairline} cho thẻ nhỏ.
- Giữ chữ viết tay (`{typography.quill-script}`) trong ô nhập; hiển thị việc đã lưu bằng EB Garamond.
- Luôn kèm chữ cho mọi tín hiệu màu (mức ưu tiên, quá hạn, trạng thái xong).
- Đóng dấu "XONG" thay vì gạch ngang; hiển thị nút "Hoàn tác" trong 5 giây.
- Cho người dùng tắt hiệu ứng bút, họa tiết góc và vệt sáng sơn mài.
- Dùng một giọng xưng hô thống nhất ("con" hoặc "bạn") ở mọi thông báo.

### Don't
- Đừng dùng xanh dương làm màu hành động; nó phá vỡ hệ sơn mài. Chàm chỉ dùng cho thông tin và nhãn môn.
- Đừng dùng {colors.gold} làm chữ hoặc viền duy nhất của thành phần tương tác (độ tương phản ~2.3:1); dùng {colors.sepia} hoặc {colors.brown}.
- Đừng thêm màu ngoài bảng (không hồng, tím, xanh nõn chuối); sắc tía chỉ có trong {colors.critical}.
- Đừng dùng Pirata One hay Dancing Script cho đoạn chữ dài; chúng chỉ để trang trí.
- Đừng bo nút thành viên thuốc; đừng làm bóng đổ mờ lớn (blur > 32px) hay màu đen thuần.
- Đừng để dấu tiếng Việt bị cắt: không giảm `lineHeight` của `{typography.body-md}` dưới 1.55, không đặt chữ trong ô cao cố định nhỏ hơn dòng chữ.
- Đừng chạy hiệu ứng mực khi đang ghép dấu bằng IME.
- Đừng bắt người dùng xem hiệu ứng đóng dấu quá một lần mỗi việc; không lặp lại khi cuộn danh sách.

## Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Popup | 360 × 560 (cố định) | Một cột; đầu trang → ô nhập → dải lọc (tab + hàng môn/sắp xếp/tìm) → cuộn việc → chân trang cố định 64px. Khung đôi còn 2px; họa tiết góc ẩn. |
| New Tab một cột | < 720px | `minmax(0,1fr)`: "Giá sách" thành dải ngang trên cùng (tab môn wrap xuống hàng, không cắt môn cuối); "Bàn học" (đồng hồ + streak) xếp dưới cuộn việc; châm ngôn ẩn; khung đôi 2px; lề bảng 16px, lề trang 8px. |
| New Tab hai cột | 720 – 1023px | `minmax(0,1fr) 300px`: cuộn việc + "Bàn học"; "Giá sách" là dải ngang phía trên; châm ngôn ẩn; ô bút và nút Ghi xuống hàng riêng. |
| New Tab ba vùng (hẹp) | 1024 – 1279px | `208px / minmax(0,1fr) / 300px`, gap 24px; cột giữa vẫn tối đa 640px. Dải tab thu gọn từ 1199px để đủ bốn tab một hàng. |
| New Tab ba vùng | 1280 – 1439px | `240px / minmax(0,1fr) / 320px`, gap 32px; bảng tối đa 1280px. Cột giữa rộng nhất ~592px nên khung vòm lời chào chỉ hiện ở màn ≥ ~1300px. |
| New Tab rộng | ≥ 1440px | Vẫn tối đa 1280px, căn giữa; hai bên hiện dải mây (`/art/cloud-band.svg`, 64×96px, mờ 0.5), tắt theo `data-ornaments='off'`. |

> Hai ngưỡng phụ độc lập với bề rộng cửa sổ: **container query trên cột giữa** (`@container board (max-width: 570px)` — bỏ khung vòm, lời chào còn `{typography.display-lg}`, ô bút xuống hàng, chữ ô nhập nhỏ lại) và **@media 1199px** cho dải tab. Lý do: cột giữa hẹp hơn cửa sổ, và ba vùng ở 1024px vẫn có thể thiếu chỗ cho bốn tab.

### Touch Targets
- Nút chính cao ≥ 44px (padding 12px + chữ 16px). Nút icon 40px, tăng lên 44px trên thiết bị cảm ứng.
- `button-seal-done` 44px; `checkbox-seal` 28px nhưng vùng bấm mở rộng thành 44×44px.
- Ô streak 28px không tương tác; nếu có tương tác (xem lịch) vùng bấm ≥ 44px.

### Collapsing Strategy
- **Cuộn việc**: trong Popup, mọi chip meta gộp thành 1 hàng flex-wrap trải rộng dưới tên việc (hết chỗ wrap xuống dòng, không ẩn chip); tên việc cắt ở 2 dòng. New Tab giữ 2 hàng chip trong cột nội dung.
- **Giá sách**: ≥ 1024px là cột dọc (dính khi cuộn); dưới đó thành dải tab ngang wrap, giữ vạch màu gáy 4px.
- **Bàn học**: dưới 1024px đồng hồ Pomodoro giữ lại, streak thu thành một dòng 7 chấm, châm ngôn ẩn.
- **Lời chào**: `{typography.hero-display}` (56px) giảm còn `{typography.display-lg}` (40px) khi cột giữa ≤ 570px và còn `{typography.heading-lg}` (32px) dưới 720px; drop cap 56px → 48px.
- **Khung đôi vàng**: 3px trên bảng New Tab; Popup (360px) và bảng New Tab dưới 720px dùng 2px.
- **Hộp thoại**: ở Popup chiếm toàn chiều rộng dạng tờ trượt từ dưới lên; ở New Tab là hộp căn giữa tối đa 560px.

### Image Behavior
- Họa tiết (sen, mây, bút, lọ mực, dấu) là SVG đơn sắc theo biến màu; không dùng ảnh raster trong Popup để mở nhanh.
- Minh họa lớn (lời chào, trạng thái rỗng) dùng khung vòm `{rounded.arch}`; tải lười, có phương án thay thế (alt) mô tả.
- Hạt khảm vỏ trứng là một tile 128×128px lặp, độ mờ ≤ 3%.

## Iteration Guide

1. Làm **một component** mỗi lần; bắt đầu từ `card-scroll-task`, `quill-input`, `button-seal-done` vì chúng định hình cả cảm giác sản phẩm.
2. Tham chiếu tên component và token trực tiếp (`{colors.primary}`, `{component-name}-pressed`, `{rounded.md}`) — không diễn đạt lại bằng mã màu.
3. Chạy `npx @google/design.md lint DESIGN.md` sau mỗi lần sửa để bắt tham chiếu hỏng, cặp màu thiếu tương phản, token mồ côi.
4. Thêm biến thể ở mục `components:` riêng (`-pressed`, `-disabled`, `-focused`, `-checked`), không giấu trong phần mô tả.
5. Mặc định dùng `{typography.body-md}` cho nội dung và `{typography.subtitle-lg}` cho nhấn mạnh; tiêu đề đi theo `hero-display → display-lg → heading-lg → heading-md → heading-sm`.
6. Giữ {colors.primary} khan hiếm: nếu cả màn hình đỏ son, hãy hỏi lại điều gì thực sự là hành động chính.
7. Mỗi họa tiết trang trí mới phải trả lời được câu hỏi "nó nhắc người dùng điều gì về việc học?" (cuộn thư, bút, sách, dấu, đèn dầu…). Nếu chỉ để cho đẹp, bỏ.
8. Thử mọi component với chuỗi tiếng Việt dài có đủ dấu (ví dụ "Nghiên cứu phương trình vi phân thường") để kiểm tra cắt dấu, ngắt dòng.

## Known Gaps

- **Chế độ tối** chưa định nghĩa (yêu cầu hiện tại là tông sáng). Nếu cần, gợi ý một bản "đêm sơn mài": nền {colors.ink}, chữ {colors.gold-pale}, giữ đỏ son cho hành động.
- **Độ phủ tiếng Việt của phông**: cần kiểm tra thực tế các ký tự có dấu kép (ế, ặ, ữ, ợ…) trong Cormorant Garamond, EB Garamond, Pirata One và Dancing Script trước khi phát hành; phương án dự phòng cho từng phông đã ghi ở mục Typography. Pirata One là rủi ro cao nhất; có thể thay bằng chữ in hoa Cormorant màu đỏ son nếu thiếu glyph.
- **Bộ họa tiết SVG** (bút lông ngỗng, bàn tay cầm bút, lọ mực, cuộn thư, sen, mây, dấu "XONG") chưa được vẽ; file này chỉ mô tả kích thước, điểm neo và màu.
- **Thời gian chuyển động**: các mốc 180/120/240/800ms giờ là token as-built (xem **Motion (as-built)**); phần còn thiếu chỉ là phép đo cảm giác trên máy yếu và với người gõ nhanh.
- **Âm thanh nhắc** (chuông đồng, tiếng giấy) chưa quy định; mặc định tắt, bật trong Cài đặt.
- **Thông báo hệ điều hành** không tạo kiểu được; chỉ đồng bộ giọng văn và biểu tượng.
- **Hiệu năng**: vệt sáng gradient và hạt khảm trên Popup có thể ảnh hưởng thời gian mở; đo trước khi bật mặc định.
- **Ngôn ngữ khác**: chuỗi và dấu "XONG" cần bản địa hóa nếu hỗ trợ tiếng Anh; phông có thể cần đổi phần nhãn nút HOA.
- **Họa tiết theo mùa/ngày lễ** (Tết, khai giảng) chưa có; nên coi như nội dung trang trí, không thêm token màu mới.

### Responsive & menu — R-19 còn mở

- **Dải 1024–1199px chưa verify**: bảng dùng `208 / minmax(0,1fr) / 300` nên cột giữa chỉ còn khoảng 480–560px; dải tab đã thu gọn (padding 8px, chữ 14px) từ 1199px và bốn tab vẫn đủ một hàng, nhưng chưa soi/đo trên màn thật. R-19 (responsive 1024–1199) **chưa đóng**.
- **Menu lọc môn có thể che chân popup**: `.menu` cao tối đa 320px, `overflow-y: auto`, absolute ngay dưới trigger và **không lật lên**. Hàng lọc nằm ở nửa trên popup 560px, nên danh sách dài (12 môn + "Cả giá sách" + "Chưa xếp môn") có thể chạm hoặc vượt chân popup và bị che — người dùng phải cuộn trong menu mới tới mục cuối. R-19 yêu cầu menu môn không che chân popup: **chưa đạt**.
- **Affordance dải tab chưa đo**: `.ribbon` có mask fade 16px bên phải và scrollbar 4px (`scrollbar-width: thin`) để báo "còn tab nữa", nhưng chưa đo/soi trên 360px và 1024px thật; scrollbar hệ thống trên Windows khác macOS nên chưa kết luận. R-19 yêu cầu affordance rõ ràng: **chưa xác nhận**.
- **Chưa đo browser thật**: toàn bộ bảng breakpoint ở trên suy ra từ CSS + container query, chưa chụp/đo ở 360/390/1024 thật.

### Motion & chỗ lệch as-built

- **Motion có chủ đích (R-19)**: token đã có và dùng thống nhất (xem **Motion (as-built)**): `lotus-light` cho đài sen sáng khi chuỗi học đạt mốc mới, `menu-fade-in/out` cho menu thả xuống mở/đóng. Tất cả motion chạy một lần, không dùng thư viện animation, tuân `prefers-reduced-motion` (token `--dur-*` về `0.01ms`, `animation-iteration-count: 1`). Đường giảm chuyển động kiểm bằng CSS, chưa bật `prefers-reduced-motion` trong Chrome thật để xác nhận mọi hiệu ứng tắt hẳn — coi là "có cơ chế, chưa verify trên máy thật".
- **Drop cap không dùng Pirata One**: `--font-drop` trỏ Cormorant Garamond in hoa màu son (Pirata One đo thử bị hẹp, không đọc ra chữ C). Token `{typography.drop-cap}` ở frontmatter vẫn ghi Pirata One — đó là ý định thiết kế; chữ đang chạy là as-built ở mục Typography/Known Gaps này.

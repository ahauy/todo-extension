# Baseline evidence — Sơn Mài Học Đường UI audit

- Ngày: 2026-11-11, build `.output/chrome-mv3/` 16:54 (không rebuild, không sửa source).
- Surface: popup 360x560 và newtab board (breakpoint 1024/720).
- Theme: light duy nhất (contract không có nhánh dark).
- Engine: Microsoft Edge 157 headless (Chromium) + raw CDP; static server `python3 -m http.server 8899` phục vụ `.output/chrome-mv3/` với shim đã chép vào.
- Dữ liệu: seed cố định 4 task (1 quá hạn 10/11, 1 done), 3 môn Toán/Ngữ văn/Tiếng Anh, settings + studyLog; empty shim seed rỗng.
- Baseline cũ ở `.context/shots/*.png` (16:45) KHÔNG được dùng lại: nó cũ hơn build 16:54. Toàn bộ ảnh dưới đây chụp mới từ build hiện tại.

## Frame table

| Frame | Viewport (CSS) | PNG | Kích thước | `window.__errors` | docOverflow | Số đo chính |
|---|---|---|---|---|---|---|
| popup list | 360x560 @2x | `shots/popup-default-360x560-light-before.png` | 720x1120 | 0 | 0 | list scroll 213/518; footer 356x64 @ y=494; ribbon 330/228 |
| popup empty | 360x560 @2x | `shots/popup-empty-360x560-light-before.png` | 720x1120 | 0 | 0 | empty-state + 25:00; list scroll 265/278 |
| popup detail (Sửa việc) | 360x560 @2x | `shots/popup-detail-parchment-360x560-light-before.png` | 720x1120 | 0 | 0 | panel fixed y=44.8 h=515.2, scroll 509/1338; chip remove 12x12 |
| popup settings | 360x560 @2x | `shots/popup-settings-360x560-light-before.png` | 720x1120 | 0 | 0 | scroll 497/869; 0 contrast fail |
| popup pomodoro running | 360x560 @2x | `shots/popup-pomodoro-running-360x560-light-before.png` | 720x1120 | 0 | 0 | nút 32x32 → aria-label "Tạm dừng", readout 24:59 |
| newtab | 1440x900 | `shots/newtab-1440x900-light-before.png` | 1440x900 | 0 | 0 | grid 240/586/320; h1 62.7 = 1 dòng; docH 1361 |
| newtab | 1280x800 | `shots/newtab-1280x800-light-before.png` | 1280x800 | 0 | 0 | grid 240/554/320; h1 125.4 = 2 dòng |
| newtab | 1023x900 | `shots/newtab-1023x900-light-before.png` | 1023x900 | 0 | 0 | Giá sách → dải ngang; grid 597/300; h1 1 dòng |
| newtab | 768x1024 | `shots/newtab-768x1024-light-before.png` | 768x1024 | 0 | 0 | grid 342/300; h1 2 dòng; input composer 136.1x54, font 24px |
| newtab | 390x844 | `shots/newtab-390x844-light-before.png` | 390x844 | 0 | 0 | shelf ribbon 571/268; docH 2127 |
| newtab | 320x568 | `shots/newtab-320x568-light-before.png` | 320x568 | 0 | 0 | stamp XONG đè chip 16.2px; filter ribbon 393/172; shelf ribbon 571/268 |
| newtab full-page | 1440 | `shots/newtab-1440x900-full-light-before.png` | 1440x1361 | 0 | 0 | 4 card + footer colophon |
| newtab pomodoro running | 1440x900 | `shots/newtab-1440x900-pomodoro-running-light-before.png` | 1440x900 | 0 | 0 | ring opacity 0.35 → 1; readout 24:59; nút "TẠM DỪNG" |
| newtab settings modal | 1440x900 | `shots/newtab-1440x900-settings-light-before.png` | 1440x900 | 0 | 0 | modal 560px, y=58, scroll trong; tiêu đề render "C ài đặt" |
| newtab cards (scroll) | 768 / 390 / 320 | `shots/newtab-{768x1024,390x844,320x568}-cards-scrolled-light-before.png` | đúng viewport | 0 | 0 | dùng để soi card ở nửa dưới trang |

`window.__errors` rỗng ở cả 14 frame. Console không có exception. Tài nguyên lỗi duy nhất: `favicon.ico -> 404` (do static server, không phải app).

## Overflow ngang (đo per-node, không đoán)

- `documentElement.scrollWidth == innerWidth` ở mọi frame ⇒ **không có tràn ngang cấp trang** ở 1440/1280/1023/768/390/320 và popup 360.
- Scroller có chủ đích (`overflow-x:auto` + mask fade 16px):
  - popup `.filter-line .ribbon`: scrollWidth 330 / clientWidth 228 (4 tab, "Đã xong" bị khuất).
  - newtab 768 filter `.ribbon`: 393/246; 320: 393/172.
  - newtab 320/390 `.board-shelf-strip .ribbon`: 571/268.
- Tràn nội bộ không có scroller:
  - `article.scroll-task > div.flex.items-start` — 1440: 555/552 (+3px); 1280: 523/520; 1023: 566/563; 768: 311/308; 320: 240/234 (+6px).
  - 320 card "Đọc chương 1": cột nội dung 102px, hàng meta 127px (+25px) → chip "Hôm nay 09:00" chui dưới stamp.
  - `.timer-dial`: scrollWidth 216 / clientWidth 212 (+4px) ở mọi width newtab (SVG ring 216 trong hộp 212).
  - `h1 span.sr-only` báo scrollWidth 12–39 / clientWidth 1: bình thường của kỹ thuật sr-only, bỏ qua.

## Contrast (tính từ màu computed thật, WCAG 2.x)

Cặp token (hex trong `styles/tokens.css`):

| Cặp | Ratio | Ghi chú |
|---|---|---|
| `--ink #2b1b12` / `--canvas #f6ebd3` | **13.99** | pass |
| `--ink-deep #1a0f0a` / `--canvas` | 15.89 | h1 dùng ink-deep |
| `--umber #7b5a3e` / `--canvas` | 5.26 | pass |
| `--sepia #9a7b5c` / `--canvas` | **3.31** | fail chuẩn 4.5 — nhưng **không có text node nào** render màu này (quét toàn bộ element: 0 match); sepia chỉ dùng cho border/dashed |
| `--disabled-text #a8987a` / `--surface-paper #efe0bf` | **2.16** | chỉ xuất hiện trên button `disabled` → miễn trừ WCAG 1.4.3 |
| `--disabled-text #a8987a` / `--hairline #c8ae80` | **1.32** | không tìm thấy cặp render thật |
| `--primary #b8381c` / `--surface-paper` | **4.44** | stamp "XONG" 11px bold, fail 0.06 |
| `--umber` / nền overdue `rgb(244,211,196)` | **4.43** | `#bài tập` và `1/2`, 13px, fail 0.07 |

Text render thật khác (đo trên node, không phải token): subtitle header 5.26; proclamation chữ trên nền son 5.40; badge subject 12.28–12.68; deadline chip 7.78–12.23; streak label T5–T4 4.77; maxim quote 8.58 (17px); footer link 5.26.

## Font tiếng Việt

- `document.fonts.status = loaded`.
- Cormorant Garamond: 2 face (latin + vietnamese) status `loaded`; `document.fonts.check('16px "Cormorant Garamond"', 'Tốt nghiệp Ấp Ủ Đường')` = **true**.
- EB Garamond: 2 face loaded; check với chuỗi có dấu = **true**.
- Dancing Script: face vietnamese `unloaded`, latin `loaded` (không dùng ở 2 surface này).
- h1 computed: `"Cormorant Garamond", Georgia, "Times New Roman", serif`; body: `"EB Garamond", ...` 17px. Ảnh chụp cho thấy dấu tiếng Việt render đúng, không rơi về Georgia.

## Target size

- Popup list: **không nút nào < 24x24**. Nhỏ nhất: "Ẩn nhắc nhở" 28x28; timer compact 32x32; icon buttons 40x40; seal 44x44.
- Popup detail: nút xoá thẻ `Bỏ thẻ bài tập` **12x12** (chip cha 88.9x26.2). Input checkbox `.seal-check` 1x1 nhưng label 44x44 (đạt).
- Newtab: link `Cài đặt` ở footer colophon **36.1x18.2**, padding 0.
- Sort/search/ribbon-tab newtab: cao 36–42.5 → đạt.

## Nhận xét 5 dòng (chỉ từ ảnh đã mở + số đo)

1. Ở 1280x800 tiêu đề "Chào buổi chiều" gãy thành 2 dòng ("C hào / buổi chiều") vì cột chỉ 362px trong khi drop-cap 72px + margin-right 12px; ở 1440 (394px) và 1023 (597px) lại 1 dòng — lỗi chỉ xuất hiện trong dải 1024–1439.
2. Ở 320px card "Đọc chương 1": stamp XONG (70.3x70.3 sau rotate) đè lên chip hạn chót 16.2px, cột chữ co còn 102px nên meta xuống 3 dòng — nhìn như chữ bị dấu đè.
3. Ở 768px ô ghi việc chỉ còn 136.1px cho font 24px nên placeholder bị cắt "Hôm nay con c…", dù cột phải (Bàn học) vẫn giữ 300px.
4. Dấu son chưa đóng là đĩa đặc `--primary` không có glyph (source ghi rõ là chủ ý), nhưng ở 1440 nó thành 4 điểm đỏ đặc đứng trước mỗi tiêu đề, nặng hơn cả tên việc; khi done lại là vòng nét đứt + check → đọc ngược trạng thái.
5. Ornament duy nhất còn trôi lơ lửng là SVG `<rect>` 48x12 (fill `url(#hd-cloud)`) nằm giữa ngày và ô ghi việc ở mọi width — nhìn như vệt bẩn hơn là hoạ tiết.

## Method note

- Không khởi động server trùng: `lsof -nP -iTCP:8741/8000/8080/8123/8899/9345` rỗng trước khi chạy; server 8899 và Edge 9345 do tôi tự bật.
- Shim `.context/shots/{popup,popup-empty,newtab}-shim.html` được chép vào `.output/chrome-mv3/` (asset trong shim là root-absolute) rồi serve qua HTTP.
- Tương tác bằng `Runtime.evaluate` click thật + `Input.dispatchKeyEvent` cho Escape; state pomodoro do bấm nút `.timer-compact-button` / "BẮT ĐẦU HỌC", không seed tay.
- Ảnh chụp `Page.captureScreenshot` không dùng `clip` (clip + dsf 2 cho frame đen). Popup dsf 2 (720x1120), newtab dsf 1.
- Đã mở và mô tả từng ảnh bằng mắt; ảnh không blank, không mid-load.
- Mọi số đo nằm trong `baseline-measurements.json`, `probe2.json`, `probe3.json`, `probe4.json`, bản đọc nhanh ở `measurements-summary.txt`.

## Gap list

- **Chưa chạy axe/Lighthouse**: `node_modules/axe-core` không có, `npx @axe-core/cli` cần tải mạng — không chạy trong pass này. Các vi phạm cấu trúc ARIA chỉ được kiểm bằng DOM thủ công (role dialog, aria-label, focus sau Escape).
- **Không kiểm trong extension thật**: đây là shim + HTTP; `chrome.*` là giả lập. Khác biệt tiềm tàng: font loading, CSP, storage thật, badge/alarms.
- **Chỉ Chromium 157**: không có Safari/WebKit, không có thiết bị thật; `100dvh`, safe-area, `pointer: coarse` chưa xác minh.
- **Không có dark theme** để chụp (contract chỉ có light).
- **Chưa kiểm** hover/focus-visible/loading skeleton/error state, reduced-motion, thứ tự tab đầy đủ — ngoài scope baseline này.
- **Không kiểm** popup ở 320px (popup cố định 360 theo `<body>` shim).
- Trạng thái "task đang chạy pomodoro" đã chụp được, nhưng không có task nào được gán vào phiên (`taskId: null`) nên dòng "Đang học cùng: …" không xuất hiện ở newtab.

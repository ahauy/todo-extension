# E2E Checklist — L7-T20 Polish (manual, release)

Môi trường: Chrome extension load unpacked từ `.output/chrome-mv3/` sau `pnpm exec wxt build`.
Evidence chạy 2026-11-18: `.context/review-reports/e2e-release-2026-11-18.md`.
**30/31 mục verified; 1 mục (icon trên toolbar) cần nhìn bằng mắt trong Chrome có giao diện.**

## 1. Load & khởi động
- [x] Load unpacked `.output/chrome-mv3` vào Chrome (trình quản lý extension → Developer mode → Load unpacked)
- [ ] Biểu tượng Học Đường hiện trên thanh công cụ — **chưa verify**: agent-browser headless không thấy toolbar; manifest + 4 file icon đã đúng
- [x] Bấm biểu tượng → Popup 360×560 mở < 100ms (proxy: `domContentLoadedEventEnd` 50ms, 17ms với 50 task)
- [x] Mở tab mới → Bảng Học Đường toàn màn hình hiện lời chào + cuộn việc

## 2. Focus ring (mọi control)
- [x] Tab di chuyển qua mọi nút điều khiển (seal, tiêu đề, chip, menu, toggle, segmented)
- [x] Mỗi control khi focus có focus-ring 2px + offset 2px (vàng kim `--focus-halo`)
- [x] Không có `outline: none` trên bất kỳ control tương tác nào
- [x] Focus trap trong Modal (Esc đóng, Tab vòng trong modal)

## 3. Bàn phím (tất cả tương tác)
- [x] Seal button: Enter/Space đóng dấu
- [x] Tiêu đề cuộn: Enter mở TaskDetail
- [x] Menu sắp xếp / môn: Mở → ArrowUp/Down di chuyển, Enter chọn, Escape đóng + trả focus
- [x] RibbonTabs: ArrowLeft/Right di chuyển tab, Enter kích hoạt
- [x] Toggle / Segmented: Space hoặc Enter thay đổi giá trị
- [x] Ô tìm kiếm: `/` mở, Escape đóng, Enter tìm

## 4. Reduced motion
- [x] Bật `prefers-reduced-motion: reduce` ở trình duyệt → tất cả animation tắt (dur 0.01ms)
- [x] Seal-strike không chạy lại khi trạng thái đã done (chỉ khi `[data-striking=true]`)
- [x] Lotus sen sáng không ambient looping (chỉ khi `[data-lit-just=true]`)
- [x] Menu enter/exit không co giãn

## 5. Chế độ sáng (dark mode không áp dụng theo quyết định dự án)
- [x] Giao diện chỉ có chủ đề sáng (`color-scheme: light`, không `data-theme`)
- [x] Nếu OS chuyển sang tối, canvas vẫn giữ nền sáng (không đen tuyền)
- [x] 5 cặp màu chính contrast đạt AA+/AAA trên nền sáng (17.01 / 12.68 / 9.19 / 4.77 / 5.25)

## 6. Motion (chỉ transform/opacity, 90-200ms)
- [x] Không animate height/width/top/left (progress bar đã đổi `width` → `transform: scaleX`)
- [x] Seal-strike: 240ms, transform + opacity
- [x] Lotus-lit: 240ms, scale + opacity
- [x] Menu-rise: 140ms, translateY + opacity

## 7. Lưu trữ & alarm
- [x] Thêm/sửa/xoá việc → lưu storage.sync
- [x] Popup đóng và mở lại → dữ liệu vẫn còn
- [x] Alarm thông báo hoạt động (nếu bật trong Cài đặt) — `chrome.alarms.get('due:e2')` có `scheduledTime` đúng +7

## 8. Tải lớn (50 task)
- [x] Tạo 50 việc → popup vẫn mở nhanh (< 100ms)
- [x] Danh sách 50 việc render không giật
- [x] Lọc/tìm kiếm trên 50 việc hoạt động mượt

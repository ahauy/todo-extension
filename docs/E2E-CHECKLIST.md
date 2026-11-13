# E2E Checklist — L7-T20 Polish (manual, release)

Môi trường: Chrome extension load unpacked từ `.output/chrome-mv3/` sau `pnpm exec wxt build`.

## 1. Load & khởi động
- [ ] Load unpacked `.output/chrome-mv3` vào Chrome (trình quản lý extension → Developer mode → Load unpacked)
- [ ] Biểu tượng Học Đường hiện trên thanh công cụ
- [ ] Bấm biểu tượng → Popup 360×560 mở < 100ms
- [ ] Mở tab mới → Bảng Học Đường toàn màn hình hiện lời chào + cuộn việc

## 2. Focus ring (mọi control)
- [ ] Tab di chuyển qua mọi nút điều khiển (seal, tiêu đề, chip, menu, toggle, segmented)
- [ ] Mỗi control khi focus có focus-ring 2px + offset 2px (vàng kim `--focus-halo`)
- [ ] Không có `outline: none` trên bất kỳ control tương tác nào
- [ ] Focus trap trong Modal (Esc đóng, Tab vòng trong modal)

## 3. Bàn phím (tất cả tương tác)
- [ ] Seal button: Enter/Space đóng dấu
- [ ] Tiêu đề cuộn: Enter mở TaskDetail
- [ ] Menu sắp xếp / môn: Mở → ArrowUp/Down di chuyển, Enter chọn, Escape đóng + trả focus
- [ ] RibbonTabs: ArrowLeft/Right di chuyển tab, Enter kích hoạt
- [ ] Toggle / Segmented: Space hoặc Enter thay đổi giá trị
- [ ] Ô tìm kiếm: `/` mở, Escape đóng, Enter tìm

## 4. Reduced motion
- [ ] Bật `prefers-reduced-motion: reduce` ở trình duyệt → tất cả animation tắt (dur 0.01ms)
- [ ] Seal-strike không chạy lại khi trạng thái đã done
- [ ] Lotus sen sáng không ambient looping
- [ ] Menu enter/exit không co giãn

## 5. Chế độ sáng (dark mode không áp dụng theo quyết định dự án)
- [ ] Giao diện chỉ có chủ đề sáng (`color-scheme: light`, không `data-theme`)
- [ ] Nếu OS chuyển sang tối, canvas vẫn giữ nền sáng (không đen tuyền)
- [ ] 5 cặp màu chính contrast đạt AA+/AAA trên nền sáng (đã kiểm tra trong tokens)

## 6. Motion (chỉ transform/opacity, 90-200ms)
- [ ] Không animate height/width/top/left
- [ ] Seal-strike: 240ms, transform + opacity
- [ ] Lotus-lit: 240ms, scale + opacity
- [ ] Menu-rise: 140ms, translateY + opacity

## 7. Lưu trữ & alarm
- [ ] Thêm/sửa/xoá việc → lưu storage.sync
- [ ] Popup đóng và mở lại → dữ liệu vẫn còn
- [ ] Alarm thông báo hoạt động (nếu bật trong Cài đặt)

## 8. Tải lớn (50 task)
- [ ] Tạo 50 việc → popup vẫn mở nhanh (< 100ms)
- [ ] Danh sách 50 việc render không giật
- [ ] Lọc/tìm kiếm trên 50 việc hoạt động mượt

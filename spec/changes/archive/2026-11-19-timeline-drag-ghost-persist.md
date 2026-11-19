---
id: timeline-drag-ghost-persist
type: feature
status: done
closed: 2026-11-19
created: 2026-11-19
---

# Timeline: giữ ghost chữ nhật khi popup tạo mở sau kéo-thả

## Yêu cầu
Khi kéo chọn vùng giờ trên time-sheet (New Tab) rồi thả chuột để mở popup "Việc mới", **hình chữ nhật mờ (ghost) của khoảng vừa kéo vẫn còn hiển thị phía sau popup** trong suốt thời gian popup mở. Ghost chỉ biến mất khi popup đóng (huỷ hoặc lưu thành công).

Nguồn: user chat `/feature` 2026-11-19 kèm screenshot (ghost phía sau popup).

## Bối cảnh / tái hiện
- Màn/route/role: New Tab › timeline (R-24/R-25), không phụ thuộc role.
- Bước tái hiện: kéo vùng trống từ 06:00 → 07:00, thả chuột → popup tạo mở với giờ điền sẵn.
- Expected: ghost 06:00–07:00 vẫn nằm dưới popup, cùng vị trí/kích thước lúc kéo.
- Actual (hiện tại): commit `11477b1` thêm `clearGestures()` gọi từ `openCreate()` → `setCreateDrag(null)` → ghost biến mất ngay khi popup hiện.

## Acceptance (bắt buộc)
- [ ] Kéo ≥5px → pointerup mở popup tạo → ghost vẫn hiện, `top`/`height`/nhãn giữ nguyên khoảng đã snap.
- [ ] Ghost giữ nguyên `top`/`height`/nhãn dù user sửa ô `startAt`/`endAt` trong popup (ghost là neo thị giác của khoảng lúc kéo, không tự đồng bộ theo form).
- [ ] Popup **clean** (chưa nhập liệu): Esc/click ngoài hoặc nút × → đóng ngay, ghost biến mất.
- [ ] Popup **dirty** (đã nhập liệu): Esc/click ngoài hiện xác nhận; ghost còn trong lúc hỏi; chỉ biến mất sau khi chọn "Bỏ" hoặc lưu thành công (kể cả lỗi quota → popup giữ mở, ghost giữ theo).
- [ ] Right-click tạo, mở bằng bàn phím, popup sửa: không có ghost (không hồi sinh ghost cũ).
- [ ] Không đổi dữ liệu/storage/permission/network; không ảnh hưởng dời block, fullscreen, focus mode.
- [ ] Verify: `tsc --noEmit` / `eslint .` / `vitest run` / `wxt build` PASS.

## Ghi chú
- Liên quan R-25; ghost được thêm ở commit `52f7ab2`, bị xoá khi mở popup ở `11477b1`.
- Bump version: **1.8.0 → 1.9.0 (MINOR)** theo `docs/SPEC_VERSIONING.md` — đây là đổi behavior có chủ đích, không phải làm rõ wording (spec-validator round 1 FAIL ở điểm này, đã sửa).
- As-built doc: `docs/DESIGN.md` dòng ghost kéo tạo cần cập nhật trạng thái khi popup mở; `docs/USER_FLOW.md` §15 bổ sung 1 dòng tương ứng.
- Giả định (cần user duyệt cùng plan): ghost phản ánh **khoảng lúc kéo**, không tự cập nhật theo ô giờ user sửa trong popup; chỉ đóng vai trò neo thị giác. Đã khóa bằng acceptance + test.

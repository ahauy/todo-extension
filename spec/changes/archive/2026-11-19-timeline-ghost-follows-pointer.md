---
id: timeline-ghost-follows-pointer
type: bug
status: done
closed: 2026-11-19
created: 2026-11-19
---

# BUG-003: Ghost kéo tạo đi theo con trỏ khi popup đang mở

## Yêu cầu
Giữ **nguyên vị trí** hình chữ nhật đã kéo trên time-sheet và hiển thị nó phía sau popup tạo. Không được để ghost đổi vị trí khi người dùng di chuột qua các vùng khác của canvas trong lúc popup mở.

## Bối cảnh / tái hiện
- Màn/route/role: New Tab › timeline (R-25), mọi role.
- Bước tái hiện: kéo vùng trống 06:00 → 07:00, thả chuột (popup "Việc mới" mở) → di chuột qua vùng 09:00–10:00 trên canvas (không bấm).
- Expected: ghost vẫn nằm yên tại 06:00–07:00, đúng khoảng đã kéo.
- Actual (sau FEAT-005): ghost đổi top/height + nhãn giờ theo vị trí con trỏ; "di vào đâu nó cũng hiện hình chữ nhật".

## Acceptance (bắt buộc)
- [ ] Repro test fail trước fix: sau pointerup, fire `pointermove` ở clientY khác → ghost vẫn giữ `top`/`height`/nhãn ban đầu.
- [ ] Sau fix: ghost đóng băng tại khoảng đã kéo trong suốt thời gian popup mở; con trỏ di qua canvas không làm ghost đổi.
- [ ] Bấm lại trên canvas khi popup đang mở không tạo ghost mới / không thay thế ghost đã freeze.
- [ ] Không hồi quy: ghost vẫn biến mất khi đóng popup; right-click/phím n/sửa việc không ghost; 4 lệnh verify PASS.

## Ghi chú
- Regression do FEAT-005 (commit `c1860bf`): để giữ ghost, `onCanvasPointerUp` không còn `setCreateDrag(null)` → `createDrag` vẫn active → `onCanvasPointerMove` tiếp tục tính `startAt`/`endAt` từ con trỏ.
- Root cause: **UI state chưa bị khoá sau khi gesture kết thúc**, không phải lỗi tính toán top/height.
- Không bump `spec_version` (bug thuần, requirement R-25 không đổi); chỉ sinh lại `spec/test-scope/current.json` (`trigger: bug-fix`, scopeVersion 37).

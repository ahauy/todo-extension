---
id: time-management-upgrade
type: feature
status: pending
created: 2026-11-16
---

# Nâng cấp quản lý thời gian: 6 gói (then chốt/con ếch · 6P · đơn nhiệm · thói quen · time blocking)

## Yêu cầu

Áp dụng các phương pháp quản lý thời gian vào extension "Học Đường", theo đề xuất đã phân tích tại
[`docs/ROADMAP_TIME_MANAGEMENT.md`](../../docs/ROADMAP_TIME_MANAGEMENT.md). Đây là **umbrella request**:
mỗi gói sẽ được triển khai thành phase riêng theo thứ tự §6 của roadmap.

Các gói:

| Gói | Nội dung | Class dự kiến |
|-----|----------|---------------|
| 0 | Nền tảng thời gian & lặp lại (chuẩn hoá `dueAt`, sửa weekly `weekdays` — G6/G3) | MODIFY |
| A | "Việc then chốt" (Pareto 20%) + "Con ếch" (Eat That Frog), ABCDE ánh xạ A/B/C | ADDITIVE |
| B | 6P: `plannedFor` + nhắc tối + sheet "Kế hoạch mai" | ADDITIVE |
| C | Đơn nhiệm: gắn task vào phiên Pomodoro + focus overlay + đếm ngắt | ADDITIVE |
| D | Thói quen 21 ngày: `habit.doneDays` + streak theo lịch + seal 7/14/21 | ADDITIVE |
| E | Time blocking / chunking (khuyến nghị hoãn — bản nhẹ: giờ bắt đầu + danh sách theo giờ) | ADDITIVE |

Quyết định đã chốt: **ABCDE giữ 3 mức ưu tiên + nhãn A/B/C**, D/E là hành động (tự động hoá / cắt bỏ),
không thêm enum 5 mức.

## Bối cảnh / tái hiện (bug)

Không phải bug. Bối cảnh: người dùng tìm được 7 phương pháp quản lý thời gian (21 ngày/thói quen,
Pareto, ABCDE, 6P, Eat That Frog, single-handling, time blocking) và muốn nâng cấp extension.

Hiện trạng liên quan (đã đối chiếu code):
- `priority` 3 mức có sẵn nhưng bị `dueAt` lấn át khi sort (`lib/tasks/query.ts:52-84`).
- `PomodoroState.taskId` có sẵn nhưng **không UI nào gọi `attach()`**.
- `dueAt` trộn local vs UTC (G6); weekly recurrence bỏ qua `weekdays` (G3).
- Chưa có khái niệm "ngày dự định làm" tách khỏi hạn chót.

## Acceptance (bắt buộc)

- [ ] Gói 0: `dueAt` canonical wall-clock local; weekly tôn trọng `weekdays`; có test migration.
- [ ] Gói A: `keystone` + chip lọc "20%" + chọn con ếch mỗi ngày; sort vẫn deterministic (R-15).
- [ ] Gói B: `plannedFor` tách khỏi `dueAt`; setting giờ nhắc; bấm notification mở đúng sheet.
- [ ] Gói C: gắn/huỷ việc vào phiên; focus overlay; `studyLog.focus` tăng đúng khi phiên trọn vẹn.
- [ ] Gói D: streak theo lịch thói quen; `doneDays` ≤ 31; tắt toggle không xoá dữ liệu.
- [ ] Gói E: chỉ làm bản nhẹ (nếu được duyệt riêng) — không lưới calendar, không kéo-thả.
- [ ] Mỗi gói: spec delta + `/spec-publish` + docs reconcile (`ERD`, `API_SPEC`, `USER_FLOW`, `DESIGN`) + reviewer PASS.
- [ ] Không tăng quyền manifest (vẫn `storage`, `alarms`, `notifications` — R-17).

## Ghi chú

- Nguồn phân tích + ràng buộc kỹ thuật + câu hỏi mở: `docs/ROADMAP_TIME_MANAGEMENT.md` §3, §7.
- Thứ tự đề xuất: **0 → C → A → B → D → (E sau)**.
- Mỗi gói phải giữ: popup 360px chỉ thêm 1 khối UI; dữ liệu theo ngày gom **1 key** + prune
  (không tạo key/ngày vì `chrome.storage.sync` giới hạn 512 item).

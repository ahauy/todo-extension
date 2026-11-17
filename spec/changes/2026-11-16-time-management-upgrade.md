---
id: time-management-upgrade
type: feature
status: in_progress
created: 2026-11-16
updated: 2026-11-17
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

## Tiến độ các gói (cập nhật 2026-11-17)

| Gói | Trạng thái | Ghi chú |
|---|---|---|
| 0 | ✅ done | `fc9e26e` + `c890de2`; change doc riêng đã archive, BACKLOG `FEAT-003/0 = done` |
| C | 🔄 đang xử lý | ADDITIVE, reviewer NORMAL, không đổi `chrome.storage.sync` |
| A | pending | sau C |
| B | pending | sau A |
| D | pending | sau B (phụ thuộc G3 — đã có từ Gói 0) |
| E | pending | hoãn, cần B dùng thật |

**Phạm vi `/change` lần này: chỉ Gói C — Đơn nhiệm.** Các gói còn lại giữ nguyên trạng thái,
sẽ mở change riêng khi đến lượt.

## Bối cảnh / tái hiện (bug)

Không phải bug. Bối cảnh: người dùng tìm được 7 phương pháp quản lý thời gian (21 ngày/thói quen,
Pareto, ABCDE, 6P, Eat That Frog, single-handling, time blocking) và muốn nâng cấp extension.

Hiện trạng liên quan (đã đối chiếu code):
- `priority` 3 mức có sẵn nhưng bị `dueAt` lấn át khi sort (`lib/tasks/query.ts:52-84`).
- `PomodoroState.taskId` có sẵn nhưng **không UI nào gọi `attach()`**.
- `dueAt` trộn local vs UTC (G6); weekly recurrence bỏ qua `weekdays` (G3).
- Chưa có khái niệm "ngày dự định làm" tách khỏi hạn chót.

## Acceptance (bắt buộc)

- [x] Gói 0: `dueAt` canonical wall-clock local; weekly tôn trọng `weekdays`; có test migration.
      (Xong 2026-11-17 — commit `c890de2`, reviewer STRICT round 2 PASS.)
- [ ] Gói A: `keystone` (tối đa 3 đang mở, **chỉ cảnh báo**) + **chip lọc "20%"** (không thêm tab) + chọn con ếch mỗi ngày; "Cắt bỏ" = `archived` + mục "Đã cắt"; dòng review tuần trong New Tab; sort vẫn deterministic (R-15).
- [ ] Gói B: `plannedFor` tách khỏi `dueAt`; nhắc **21:00 bật sẵn** (tắt được); bấm notification mở đúng sheet.
- [ ] Gói C: gắn/huỷ việc vào phiên; focus overlay **cả popup (bản thu gọn) + New Tab**; `studyLog.focus` tăng đúng khi phiên trọn vẹn.
- [ ] Gói D: streak theo lịch thói quen; `doneDays` ≤ 31; tắt toggle không xoá dữ liệu.
- [ ] Gói E: chỉ làm bản nhẹ (nếu được duyệt riêng) — không lưới calendar, không kéo-thả.
- [ ] Mỗi gói: spec delta + `/spec-publish` + docs reconcile (`ERD`, `API_SPEC`, `USER_FLOW`, `DESIGN`) + reviewer PASS.
- [ ] Không tăng quyền manifest (vẫn `storage`, `alarms`, `notifications` — R-17).

## Ghi chú

- Nguồn phân tích + ràng buộc kỹ thuật: `docs/ROADMAP_TIME_MANAGEMENT.md` §3; **7 câu hỏi đã chốt** ngày
  2026-11-16: §7 (then chốt 3 + cảnh báo, chip 20%, archive, nhắc 21:00 bật sẵn, review tuần 1 dòng,
  overlay cả popup, prune 31 ngày).
- Thứ tự đề xuất: **0 → C → A → B → D → (E sau)**.
- Mỗi gói phải giữ: popup 360px chỉ thêm 1 khối UI; dữ liệu theo ngày gom **1 key** + prune
  (không tạo key/ngày vì `chrome.storage.sync` giới hạn 512 item).

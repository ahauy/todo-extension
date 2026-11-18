---
id: time-management-upgrade
type: feature
status: done
closed: 2026-11-18
created: 2026-11-16
updated: 2026-11-18
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

## Tiến độ các gói (cập nhật 2026-11-18)

| Gói | Trạng thái | Ghi chú |
|---|---|---|
| 0 | ✅ done | `fc9e26e` + `c890de2`; change doc riêng đã archive, BACKLOG `FEAT-003/0 = done` |
| C | ✅ done | ADDITIVE, reviewer NORMAL, không đổi `chrome.storage.sync`; close-out ở phase-3-task-03 |
| A | ✅ done | `2d045cc` → `0ed6f2a` → `80c10f7`; reviewer STRICT/STRICT/NORMAL PASS, docs reconcile + spec-validator cuối PASS; change doc riêng đã archive, BACKLOG `FEAT-003/A = done` |
| B | ✅ done | `42dd0c2`; spec 1.5.0 / scope 28; notification mở đúng sheet, alarm one-shot + resync DST; change doc riêng đã archive |
| D | ✅ done | spec 1.6.0 / scope 30; `ba82621` (data+streak contract, STRICT round 2) → `2af694d` (UI habit, STRICT round 1) → close-out phase 3 (reviewer NORMAL PASS + spec-validator PASS); change doc riêng đã archive, BACKLOG `FEAT-003/D = done` |
| E | ✅ done | spec 1.7.0 / scope 31 (bản đầy đủ, user chọn làm ngay 2026-11-18); `63d3091` (data/domain/form, STRICT round 2) → `5032407` (timeline New Tab + kéo snap 15′, STRICT round 1) → close-out phase 3 (docs reconcile + spec-validator). Residual: B chưa có dữ liệu dùng thật → giá trị E chưa kiểm chứng |

**Phạm vi `/change` gần nhất: Gói E đã đóng 2026-11-18 (spec 1.7.0 / scope 31).** Cả 6 gói (0/C/A/B/D/E)
đã bàn giao; **không tự đóng FEAT-003 umbrella** — chỉ đóng khi user duyệt riêng.
Gói 0/C/A/B/D/E đã lần lượt đóng ở `c890de2`/`e75ec48`/`80c10f7`/`42dd0c2` + close-out Gói D,
`63d3091` + `5032407` + close-out Gói E.

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
- [x] Gói A: `keystone` (tối đa 3 đang mở, **chỉ cảnh báo**) + **chip lọc "20%"** (không thêm tab) + chọn con ếch mỗi ngày; "Cắt bỏ" = `archived` + mục "Đã cắt"; dòng review tuần trong New Tab; sort vẫn deterministic (R-15).
      (Xong 2026-11-17 — `2d045cc` → `0ed6f2a` → `80c10f7`; reviewer STRICT/STRICT/NORMAL PASS, spec-validator cuối PASS.)
- [x] Gói B: `plannedFor` tách khỏi `dueAt`; nhắc **21:00 bật sẵn** (tắt được); bấm notification mở đúng sheet.
      (Xong 2026-11-18 — commit `42dd0c2`, spec 1.5.0 / scope 28, reviewer + spec-validator round 2 PASS.)
- [x] Gói C: gắn/huỷ việc vào phiên; focus overlay **cả popup (bản thu gọn) + New Tab**; `studyLog.focus` tăng đúng khi phiên trọn vẹn. (2026-11-17 — phase 1 `02e3737` + phase 2 `aa3c78a` STRICT PASS; docs reconcile + verify ở phase-3-task-03.)
- [x] Gói D: streak theo lịch thói quen; `doneDays` ≤ 31; tắt toggle không xoá dữ liệu.
      (Xong 2026-11-18 — `ba82621` + `2af694d` + close-out phase 3; spec 1.6.0 / scope 30; reviewer STRICT/STRICT + NORMAL PASS, spec-validator cuối PASS.)
- [x] Gói E: **bản đầy đủ** (user đổi quyết định 2026-11-18) — timeline 06:00–24:00, kéo snap 15′,
      lối bàn phím/ô nhập, cảnh báo chồng lấn (vẫn lưu); popup giữ nguyên.
      (Xong 2026-11-18 — `63d3091` + `5032407` + close-out phase 3; spec 1.7.0 / scope 31; STRICT/STRICT
      PASS, eyeball 3 breakpoint. Residual giá trị chưa kiểm chứng do B chưa có dữ liệu dùng thật.)
- [x] Mỗi gói: spec delta + `/spec-publish` + docs reconcile (`ERD`, `API_SPEC`, `USER_FLOW`, `DESIGN`) + reviewer PASS — xong ở close-out từng gói (0 → C → A → B → D → E).
- [x] Không tăng quyền manifest (vẫn `storage`, `alarms`, `notifications` — R-17) — verified ở từng phase 3 / reviewer; scope 31 vẫn giữ nguyên.

## Close-out 2026-11-18

Umbrella **FEAT-003 đóng** sau khi đủ 7 slice bàn giao; user đã duyệt riêng việc đóng cây này.
Không slice nào còn pending; `activeWorkItem = null`, CI staging xanh.

| Slice | Commit bàn giao | Spec / scope |
|---|---|---|
| Gói 0 | `9d641f5` | 1.2.1 / v22 |
| Gói C | `e75ec48` | 1.3.0 / v23 |
| Gói A | `69f02a5` | 1.4.0 / v25 |
| Gói B | `42dd0c2` | 1.5.0 / v28 |
| Gói D | `1f4b637` | 1.6.0 / v30 |
| Gói E | `b66ff06` | 1.7.0 / v31 |
| BUG-CI-TZ (liên quan) | `6f52ec8` | scope v32, bug-fix |

Residual được giữ lại, không chặn đóng: **Gói E chưa kiểm chứng giá trị dùng thật** vì Gói B chưa có
dữ liệu người dùng thực tế (roadmap §4/§6 đã ghi đề xuất hoãn E; user chọn làm ngay 2026-11-18).
Không tự đóng thành "sản phẩm đã được xác thực" — chỉ đóng phạm vi triển khai/kỹ thuật.

## Ghi chú

- Nguồn phân tích + ràng buộc kỹ thuật: `docs/ROADMAP_TIME_MANAGEMENT.md` §3; **7 câu hỏi đã chốt** ngày
  2026-11-16: §7 (then chốt 3 + cảnh báo, chip 20%, archive, nhắc 21:00 bật sẵn, review tuần 1 dòng,
  overlay cả popup, prune 31 ngày).
- Thứ tự đề xuất: **0 → C → A → B → D → (E sau)**.
- Mỗi gói phải giữ: popup 360px chỉ thêm 1 khối UI; dữ liệu theo ngày gom **1 key** + prune
  (không tạo key/ngày vì `chrome.storage.sync` giới hạn 512 item).

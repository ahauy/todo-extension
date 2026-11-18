---
id: package-d-habit-streak
type: feature
status: in_progress
parent: FEAT-003
created: 2026-11-18
---

# Gói D — Thói quen 21 ngày (streak theo lịch)

## Yêu cầu
Biến việc lặp thành thói quen có streak riêng, tách khỏi chuỗi học chung `StudyLog`:
`Task.habit` gồm `startedAt` và tối đa 31 `doneDays`; streak chỉ đếm các ngày **thuộc lịch**
của rule lặp (T2–T6 thì T7/CN không phải ngày thiếu); lưới 21 ô + mốc 7/14/21 trên
bảng Học Đường. Tắt theo dõi chỉ ẩn, không xoá dữ liệu.

## Bối cảnh
- Nguồn: `docs/ROADMAP_TIME_MANAGEMENT.md` §1.3, §4 Gói D, §6; change cha
  `spec/changes/2026-11-16-time-management-upgrade.md`.
- Phụ thuộc Gói 0 (R-10 weekly tôn trọng `weekdays`) đã xong. Không thêm permission/network (R-17).
- Spec R-23 mới; `spec_version 1.5.0 → 1.6.0`, scope 29.
- Chưa có code Gói D trên đĩa; toàn bộ thay đổi đi qua task mới, không sửa trực tiếp task đã complete.

## Quyết định sản phẩm đề xuất (chờ duyệt plan)
1. Dữ liệu nhúng trong `t:<id>`; **không** tạo key theo ngày, **không** key aggregate mới.
2. Toggle "Theo dõi như thói quen" chỉ hiện khi `recurrence.kind !== 'none'`; tắt toggle giữ
   `habit` trong storage, chỉ ẩn UI; đổi `recurrence` về `none` cũng chỉ ẩn.
3. Ngày ghi nhận khi tick là **ngày local của `dueAt` cũ trước lần ghi** (= `prevDueAt` ngay sau R-11),
   không đọc `prevDueAt` cũ cũng không dùng `dueAt` mới; tick muộn vẫn ghi đúng ngày trong lịch. Nếu
   ngày đó **đã rơi khỏi cửa sổ 31 ngày gần nhất** (cũ hơn `hôm nay - 30`) thì bỏ qua; occurrence mang
   ngày tương lai (tick sớm) vẫn được ghi — nó không đẩy ngày nào ra.
4. Bỏ dấu một ngày đã ghi (trong cửa sổ 31 ngày) được thực hiện từ ô lưới trên New Tab; không cho
   thêm tay ngày chưa làm. Hoàn tác R-11 cũng gỡ đúng ngày occurrence đó khỏi `doneDays`.
5. Lưới 21 ô + seal 7/14/21 chỉ trên **New Tab**; popup giữ nguyên số khối (chỉ một badge nhỏ
   trong dòng meta của thẻ việc + toggle trong hộp sửa việc đã có).

## Acceptance (bắt buộc)
- [ ] Thói quen T2–T6: T7/CN được đánh dấu "không thuộc lịch", không tính thiếu và không đứt streak.
- [ ] Tick muộn ghi ngày occurrence (local), hoàn tác/bỏ dấu ngày đã qua tính lại streak đúng.
- [ ] `doneDays` không vượt 31 phần tử sau 60 ngày dùng liên tục; không tạo key storage mới.
- [ ] Tắt toggle thói quen → ẩn nhưng không xoá `habit`; bật lại streak nguyên vẹn.
- [ ] Streak thói quen độc lập `StudyLog`; R-11 undo/dueAt/alarm và sort R-15 không regression.
- [ ] Seal 7 → 14 → 21, sau 21 streak vẫn tăng; UI ghi rõ 21 là mốc ăn mừng, không phải kết luận khoa học.
- [ ] Eyeball Chrome 360×560 / 1024×768 / 1280×800; reviewer từng phase PASS; spec-validator PASS;
      verify tsc/eslint/vitest/build PASS.

## Ghi chú
- Ràng buộc roadmap §3: popup 360px tối đa 1 khối UI/gói; item `storage.sync` ≤ 8192 B,
  120 write/phút — mọi ghi `habit` đi cùng lần `put(task)` hiện có.
- `StudyLog` giữ nguyên vai trò chuỗi học chung; không gộp số liệu.
- Close-out needs: docs ERD/API_SPEC/USER_FLOW/DESIGN/ROADMAP reconcile + BACKLOG/umbrella update.

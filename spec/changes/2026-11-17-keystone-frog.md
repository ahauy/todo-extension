---
id: keystone-frog
type: feature
status: in_progress
parent: FEAT-003
created: 2026-11-17
updated: 2026-11-17
---

# Gói A — Việc then chốt & Con ếch (FEAT-003)

## Yêu cầu

Triển khai Gói A theo roadmap [`docs/ROADMAP_TIME_MANAGEMENT.md`](../../docs/ROADMAP_TIME_MANAGEMENT.md) §4
và thứ tự §6 (`0 → C → A`). Phạm vi change này **chỉ Gói A**; Gói B/D/E giữ nguyên trạng thái
trong umbrella `spec/changes/2026-11-16-time-management-upgrade.md`.

Quyết định đã chốt (roadmap §5, §7): giữ 3 mức ưu tiên + nhãn A/B/C; tối đa **3** việc then chốt
đang mở và **chỉ cảnh báo**; lối vào 20% là **chip bật/tắt** trên nền tab (không thêm tab thứ 5);
"Cắt bỏ" = **archive** (`archived=true`, giữ dữ liệu, có phục hồi).

## Bối cảnh / tái hiện

Không phải bug. Sau Gói 0 (ngày/hạn đúng) và Gói C (có chỗ ngồi cho "con ếch" = nút tập trung),
người dùng cần chỉ định 20% việc quan trọng và một việc khó nhất mỗi ngày.

Hiện trạng đối chiếu code:
- `Task` chưa có `keystone`/`archived`; `lib/tasks/types.ts:40-67`.
- `filterByBoard`/`filterBySubject`/`sortBoard` chưa loại archived; `lib/tasks/query.ts:112-167`.
- `FilterRow` có đúng 4 tab, 360px đã kín; `components/FilterRow.tsx:77-82`.
- Chưa có khái niệm kế hoạch ngày; `lib/datetime.ts:19-25` chỉ có `dayKey` local.
- New Tab đã có chỗ đặt hero gần `Greeting` (`entrypoints/newtab/App.tsx:224`) và dòng tổng kết
  trong desk (`:268-295`).

## Acceptance (bắt buộc)

- [ ] Đánh dấu then chốt → task hiện trong chip "20%"; bỏ dấu → biến mất khỏi chip, dữ liệu khác không đổi.
- [ ] Vượt 3 việc then chốt **đang mở** → chỉ hiện cảnh báo, vẫn lưu bình thường.
- [ ] Chọn con ếch → New Tab hero hiện đúng việc; sang ngày mới con ếch cũ tự hết hiệu lực.
- [ ] Nút "Tập trung 25 phút" trên hero dùng lại luồng gắn việc của Gói C (R-20), không tạo phiên focus thứ hai.
- [ ] "Cắt bỏ" → task biến khỏi 4 tab, chip 20% và mọi bộ đếm nhưng vẫn còn trong storage; mục "Đã cắt" xem lại + phục hồi được.
- [ ] Thẻ bài có ribbon "THEN CHỐT"; con ếch có dấu riêng **khác màu lẫn khác chữ**, giữ DOM parity compact/full.
- [ ] Dòng "Then chốt: x/y xong" và dòng review tuần khớp số liệu thật; không lưu tổng hợp, không điểm số.
- [ ] `dayPlan` là **1 key duy nhất** trong `chrome.storage.sync`, prune ≤14 ngày, không tạo key/ngày.
- [ ] Sort vẫn deterministic theo R-15 (chạy 2 lần cùng thứ tự); không tăng permission (R-17), không network.
- [ ] Mỗi phase reviewer PASS + docs reconcile (`ERD`, `API_SPEC`, `USER_FLOW`, `DESIGN`) + spec-validator PASS.

## Quyết định thiết kế đề xuất (chờ user duyệt plan)

1. Toggle "Việc then chốt" hiện trong form thêm/sửa; bật → tự gán `priority='high'` (nhãn A), tắt →
   **không** tự hạ priority. Chính sách cảnh báo đếm việc `!done && !archived && keystone`.
2. Chọn/bỏ con ếch bằng nút trên thẻ bài (cùng chỗ với các chip), lưu vào `dayPlan[dayKey].frogTaskId`;
   mỗi ngày tối đa 1 con ếch, chọn việc khác thì thay thế.
3. "Cắt bỏ" đặt trong `TaskParchment` (chi tiết việc) thay vì dựng menu thao tác mới; khôi phục đặt
   trong `SettingsPanel` mục "Đã cắt" (cả popup + New Tab) — theo phương án roadmap để mở.
4. Review tuần tính theo **tuần local bắt đầu Thứ 2 tới hiện tại**; việc xong lấy `lastDoneAt` (nếu có)
   hoặc `updatedAt` khi `done=true`. Dòng "then chốt a/b": `a` = then chốt (không archived) hoàn thành
   trong cửa sổ, `b` = **tổng then chốt không archived đang có trong cửa sổ** (đang mở + đã xong);
   không lưu số liệu tổng hợp.

## Ghi chú

- Không bump `specVersion` ở Gói 0/C nữa; Gói A thêm requirement → bump 1.3.0 → 1.4.0 (MINOR),
  scopeVersion 24 → 25.
- Không đụng Gói B (`plannedFor`, nhắc 21:00) — `dayPlan` được định nghĩa để B mở rộng sau.
- `docs/ERD.md`, `docs/API_SPEC.md`, `docs/USER_FLOW.md`, `docs/DESIGN.md` chưa có thuật ngữ Gói A —
  đây là **phase 3 docs reconcile (deferral)** đã được spec-validator xác nhận, không phải conflict chặn.
- Spec-validator: `.context/review-reports/feature-keystone-frog-spec-validation.md` — **PASS**
  (0 HIGH; F-01 MEDIUM đã đóng trong spec storage table + delta; F-03 denominator đã chốt ở quyết định 4).

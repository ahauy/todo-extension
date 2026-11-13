---
id: task-seal-states
type: bug+modify
status: done
created: 2026-11-12
---

# Thẻ công việc: nút đóng dấu vô hình + không phân biệt chưa làm / đã làm / việc lặp ngày mai

## Yêu cầu (user, 2026-11-12, kèm ảnh popup)

- "Ở phần thẻ công việc mình chưa thấy phần đóng dấu đâu" → nút đóng dấu (seal) không nhận biết được là nút.
- "Khi mình đóng dấu thì không thấy gì" → bấm seal không thấy thay đổi rõ trên thẻ (đặc biệt việc lặp).
- "Muốn phân biệt rõ ràng: việc nào CHƯA LÀM, việc nào ĐÃ LÀM, và việc của NGÀY HÔM SAU (lặp đi lặp lại)."

## Root cause (đã soi, read-only)

1. **Seal affordance trống:** `components/TaskScroll.tsx:136-142` — khi `!done` render `null` con;
   `styles/signature.css:156-170` `.seal-button` = nền transparent + viền đỏ 2px, KHÔNG icon, KHÔNG hover
   style (chỉ `:active` + `[aria-pressed=true]`). → nhìn như vòng trang trí, không phải nút bấm.
2. **Việc lặp không bao giờ hiện trạng thái done:** `hooks/useTasks.ts:248-275` — toggle việc lặp có next due
   → `done=false, dueAt=next` (roll-forward). Thẻ KHÔNG vào done, KHÔNG dấu XONG, KHÔNG nền giấy; chỉ đổi
   chip hạn (vd "Hôm nay"→"Ngày mai") + toast thoáng qua (`hooks/useBoard.ts:92-102`). → "đóng dấu không thấy gì".
3. **3 trạng thái không tách bạch:** open = nền lacquer + vòng trống; done = nền giấy + XONG; recurring-next =
   giống hệt open (chỉ chip có icon lặp). Không có trạng thái "đã làm hôm nay, hẹn ngày mai" cho việc lặp.

## Acceptance (chốt sau khi user chọn phương án)

- [ ] Nút seal nhận biết được là nút bấm (affordance: icon/hover/tooltip) và bấm có phản hồi nhìn thấy ngay trên thẻ.
- [ ] Phân biệt rõ 3 trạng thái trên thẻ: CHƯA LÀM / ĐÃ LÀM / VIỆC LẶP CỦA NGÀY HÔM SAU (kể cả sau khi reload).
- [ ] Việc lặp bấm đóng dấu phải để lại dấu vết "đã làm hôm nay" + hẹn ngày kế tiếp, không chỉ toast thoáng qua.
- [ ] Không hồi quy board newtab (2 hàng chip trong cột), a11y (role/aria/reading order), test hiện có + build.

## Ghi chú

- Dark mode R-14 ngoài phạm vi. Giữ ngôn ngữ "Sơn Mài Học Đường".
- Phương án đang chờ user duyệt (xem đề xuất trong session): PA1 nhẹ không schema / PA2 thêm lastDoneAt (đề xuất) / PA3 tách occurrence (nặng).

## Kết quả (2026-11-13, PA2)

- Reviewer STRICT round-1 **PASS** — `.context/review-reports/bug-task-seal-states-phase-1-task-01-round-1-review.md`
  (3 MINOR không chặn: hover trên triện đã pressed giảm contrast, comment `types.ts:52`, header test).
- Verify: `tsc --noEmit` 0 · `eslint .` 0 · `vitest run` 19 file/116 test · `wxt build` PASS.
- Repro probe (`.impeccable/review/seal-pa2.json` + 6 PNG): open → triện mộc nhìn thấy; đóng dấu việc lặp →
  done-today + chip "đã làm hôm nay · Ngày mai"; reload → giữ done-today; bấm lại → hoàn tác về occurrence cũ;
  việc không lặp → done.
- Spec: 1.1.0 → 1.2.0 (SỬA R-11), `spec/test-scope/current.json` scopeVersion 21.
- Defer: `docs/ERD.md` + `docs/DESIGN.md` ghi `lastDoneAt`/`prevDueAt` nằm trong FEAT-002 phase-1-task-01.

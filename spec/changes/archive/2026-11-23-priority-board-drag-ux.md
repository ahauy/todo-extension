---
id: priority-board-drag-ux
type: feature
status: done
created: 2026-11-23
completed: 2026-11-23
---

# Cải thiện UX kéo thả bảng sắp xếp công việc (4 ô ma trận)

## Yêu cầu
Nâng cấp trải nghiệm kéo-thả của bảng "Sắp xếp công việc" (New Tab, R-26):
1. Hiển thị rõ ràng 4 ô sắp xếp trên giao diện, có nhãn/màu phân biệt dễ đọc.
2. Khi kéo một công việc, **chính phần tử công việc đó đi theo con trỏ chuột theo thời gian thực**
   (ghost/clone cập nhật mỗi `pointermove`, không chỉ đổi highlight ô).
3. Khi con trỏ đi qua ô nào, ô đó tự động highlight sáng lên; chỉ một ô được highlight tại một thời điểm,
   và highlight biến mất ngay khi rời ô / huỷ kéo / thả xong.
4. Khi thả chuột, công việc được đặt vào **ô đang được highlight** (ô dưới con trỏ tại thời điểm thả;
   nếu con trỏ nằm ngoài mọi ô thì không gán, giữ nguyên trạng thái cũ).
5. Hiệu ứng kéo-thả mượt mà, phản hồi trực quan rõ ràng (transform/opacity, không gây giật/layout shift).

## Bối cảnh / tái hiện
- Màn/route: New Tab → nút "Ma trận ưu tiên" → panel bảng 4 ô (R-26).
- Bước tái hiện: mở bảng, kéo một thẻ việc từ ô này sang ô khác, quan sát trong lúc di chuyển chuột.
- Expected: thẻ đang kéo bám theo con trỏ; ô dưới con trỏ sáng lên; thả vào ô sáng đó.
- Actual: `components/PriorityBoard.tsx` đã có pointer capture + `cellFromPoint()` + class
  `priority-cell--drop` (highlight ô), nhưng `DragState` (`PriorityBoard.tsx:31-37`) chỉ lưu
  `id/startX/startY/moved/target` — **không lưu toạ độ hiện tại và không render phần tử đi theo con trỏ**.
  Người dùng vì thế không thấy thẻ được kéo di chuyển, chỉ thấy ô đích đổi viền.

## Acceptance (bắt buộc)
- [ ] 4 ô Q1–Q4 hiển thị rõ ràng: nhã đầy đủ, phân biệt bằng màu/chữ, không chồng lấn; panel không tràn ngang ở 1024/1280 và vẫn dùng được ở 360 (R-19).
- [ ] Trong lúc kéo, một ghost của đúng thẻ đó di chuyển theo con trỏ ngay trên mỗi `pointermove` (vị trí cập nhật theo clientX/clientY, dùng transform chứ không đổi layout). **Ghost phải `pointer-events: none` (hoặc tương đương) để `document.elementFromPoint()` vẫn trả về ô bên dưới** — test phải chứng minh hit-test không bị ghost chặn, không chỉ stub `elementFromPoint`.
- [ ] Khi con trỏ nằm trong ô nào, chỉ ô đó có `data-drop-target='true'` + highlight nhìn được rõ (viền/nền); rời ô → highlight tắt. `pointercancel`/`lostpointercapture` **và cả `pointerup` thành công** → dọn ghost + highlight; huỷ kéo không ghi storage.
- [ ] `pointerup` gán **duy nhất vào ô đang highlight dưới con trỏ**. **Không có fallback về ô highlight trước đó** (bỏ `cellFromPoint(...) ?? drag.target` hiện tại). Thả ngoài tất cả ô → không gán, giữ nguyên priority. Giữ nguyên 1-put copy-then-patch, rollback khi quota, không toast.
- [ ] Chuyển động mượt: dùng `transform`/`opacity`, tuân `prefers-reduced-motion: reduce` (R-19); không animate `width`/`height`; không giật khi con trỏ rời khỏi thẻ nhờ pointer capture.
- [ ] Không làm hỏng lối bàn phím đã duyệt (Enter chọn thẻ → mũi tên → Enter/Space gán), focus trap/Esc, aria-live, 4 nhãn R-05, trạng thái `focusActive`.
- [ ] Thêm regression test fail-before-fix cho ghost-follows-pointer + highlight + drop-into-highlighted; `tsc`/`eslint`/`vitest`/`wxt build` PASS; reviewer PASS trước commit.

## Ghi chú
- Tham chiếu: R-26 (bảng ma trận 4 ô), R-19 (responsive/reduced-motion), R-05 (4 mức ưu tiên), R-16 (lỗi quota/rollback), R-20 (focusActive vô hiệu gesture), R-25 (Esc precedence).
- Liên quan: FEAT-005/BUG-003 đã làm ghost cho **timeline** (`components/Timeline.tsx`) — có thể tái dùng pattern, nhưng không sửa timeline trong change này.
- Blast radius dự kiến: `components/PriorityBoard.tsx`, `entrypoints/newtab/style.css`, unit test. Không đổi schema/permission/storage API/dependency.
- Doc reconcile đã làm ở bước spec (theo finding F-1 của validator): `docs/DESIGN.md`, `docs/API_SPEC.md`,
  `docs/USER_FLOW.md` và error text trong `entrypoints/newtab/App.priorityBoard.test.tsx` đã được thống nhất theo nhãn
  "Ma trận ưu tiên" của as-built. Không đổi assertion thật của test.

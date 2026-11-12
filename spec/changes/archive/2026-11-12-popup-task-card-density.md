---
id: popup-task-card-density
type: feature
status: done
created: 2026-11-12
---

# Popup: gộp hai hàng chip trong cuộn thư thành một hàng

## Yêu cầu

Trong popup (chế độ `compact`), mỗi cuộn thư (`.scroll-task`) hiện có **hai** hàng chip:
hàng 1 = hạn chót · ưu tiên · "Lặp lại", hàng 2 = môn · tag `#…` · tiến độ subtask.
Gộp thành **một hàng flex-wrap duy nhất** để mỗi thẻ thấp lại, nhờ đó popup 560px (thường phải cuộn
8 việc) nhìn thấy nhiều việc hơn.

Quyết định của user (2026-11-12):

- **Phạm vi: chỉ popup** (chế độ compact). Tab mới giữ nguyên hai hàng chip — bề rộng ở đó rộng rãi,
  đổi sẽ là thay đổi giao diện lớn không cần thiết.
- **Gộp tất cả vào 1 hàng flex-wrap**: hạn chót · ưu tiên · lặp lại (khi không có hạn chót) · môn ·
  tag `#…` · tiến độ subtask. Hết chỗ thì wrap, **không bỏ dữ liệu nào**.

## Quyết định bổ sung (2026-11-12, session resume — user duyệt qua question)

Sau khi đo thực tế, acceptance mật độ gốc (**+1 thẻ trọn vẹn**) **không đạt được bằng gộp hàng chip**:
chrome popup (header + composer + tabs) chiếm 247/560px, list chỉ còn 313px; 3 thẻ trọn vẹn đòi hỏi
mỗi thẻ ≤~97px, trong khi thẻ mở 110–139px ở mọi biến thể gộp hàng (giữ nguyên nội dung chip).
Số liệu probe 360×560, 8 việc mẫu (`.impeccable/review/density-*.json`):

| Biến thể | Thẻ trọn vẹn | Chiều cao thẻ mở |
|---|---|---|
| before `041da9f` (2 hàng) | 2 | 139px |
| 1 hàng trong cột | 2 | 139px (wrap 2 dòng trong cột ~242px) |
| 1 hàng trải rộng | 2 | 110–135px |

User chốt:

- **Dùng bản 1 hàng TRẢI RỘNG** toàn bề rộng thẻ (compact): hàng chip nằm dưới hàng dấu triện + tiêu đề,
  trải hết bề rộng article thay vì bó trong cột nội dung. Đây là thay đổi layout **được duyệt riêng**
  (trước đó reviewer đánh giá vượt scope bản gộp trong cột). Tab mới vẫn giữ nguyên 2 hàng trong cột.
- **Nới acceptance mật độ**: mục tiêu là "thẻ mở thấp hơn rõ, cuộn list ít hơn, không mất chip" —
  KHÔNG bắt buộc +1 thẻ trọn vẹn (số thẻ trọn vẹn có thể giữ 2 ở 560px với seed này). Muốn +1 thẻ thật
  phải giảm chrome popup — tách change riêng nếu user yêu cầu sau.

## Bối cảnh

- Finding F10 của `.context/review-reports/ui-ux-review-round-2.md` (hoãn lại, đã ghi rõ là "thay đổi
  thiết kế chưa duyệt"), vòng 3 (`ui-ux-review-round-3.md`) chỉ hạ khe danh sách 24 → 16px.
- Thẻ việc: `components/TaskScroll.tsx` — hai `<div className="mt-xs flex flex-wrap items-center gap-xs">`
  ở dòng 85 và 103; nhánh `compact` đã có sẵn nhưng chỉ dùng cho cỡ dấu triện / cỡ chữ.
- Tab popup: `entrypoints/popup/App.tsx` → `TaskScrollList` (compact) → `TaskScroll` (`compact`).
- Không đụng dữ liệu: `Task`/`Subject` không đổi; đây thuần là cấu trúc trình bày.

## Acceptance (bắt buộc)

- [ ] Trong popup, mỗi cuộn thư chỉ còn **1 hàng chip** (không còn 2 dòng chip khi thẻ đủ rộng); hàng này
      chứa đủ: hạn chót (nếu có), ưu tiên, "Lặp lại" (khi lặp nhưng không có hạn chót), môn, tag `#…`,
      tiến độ subtask (khi có subtask).
- [ ] Không mất thông tin: số chip hiển thị = trước khi sửa (trừ khi phải wrap xuống dòng thứ hai do hết chỗ).
- [ ] Tab mới (không compact) **không đổi**: ảnh `desktop-1440` và `board-1024` trùng khớp trước/sau ở phần thẻ việc.
- [ ] Thẻ quá hạn vẫn phân biệt được màu chip (chip môn không trùng nền `--primary-wash`).
- [ ] Không hồi quy a11y: `role="list"`/`role="listitem"`, `aria-label` của nút đóng dấu, tiến độ subtask
      vẫn đọc được nghĩa; chip không xuống 2 dòng bên trong chính nó.
- [ ] Mật độ (đã nới theo quyết định 2026-11-12): ở popup 360×560 với dữ liệu mẫu 8 việc, **chiều cao
      thẻ mở giảm rõ** so với commit `041da9f` (đo probe/CDP, ghi số trước/sau vào report); tổng chiều
      cao list giảm. Không bắt buộc +1 thẻ trọn vẹn (chrome popup chiếm 247/560px nên 2→2 là chấp nhận được).
- [ ] `tsc --noEmit`, `eslint .`, `vitest run` (106 test hiện có), `wxt build` PASS trên bản export `git archive` sạch.

## Ghi chú

- Spec: không đổi requirement nào (R-xx); đây là MODIFY giao diện trong phạm vi R-08/R-12 nếu có mô tả
  bố cục thẻ — agent tự đối chiếu `SPECIFICATIONS.md` và ghi rõ "no requirement change" nếu đúng.
- Dark mode (R-14) vẫn ngoài phạm vi, không đụng.
- Ràng buộc kỹ thuật: giữ ngôn ngữ "Sơn Mài Học Đường" — không đổi màu/typography chip, chỉ đổi cấu trúc hàng.

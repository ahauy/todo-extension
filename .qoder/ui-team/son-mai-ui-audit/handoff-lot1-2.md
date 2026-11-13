# Handoff — Lô 1 + 2 (đã user duyệt 2026-11-11)

User duyệt: **Lô 1 + 2 = 17 finding**, và **commit baseline trước khi sửa**. Lô 3 + pass 2 chưa được duyệt → OFF LIMITS.

## Bước 0 — baseline commit (trước mọi sửa đổi)

Phạm vi dirty hiện tại (tôi đã tự đo): 45 file sửa/xoá + 41 untracked, gồm `wxt.config.ts` (M).
`.gitignore` đã bỏ qua `.context/`, `.output/`, `.wxt/`, `node_modules/`, `tasks/`, `docs/specs/`, `docs/diagrams/`, `spec/updates/`.
KHÔNG commit `?? .impeccable/` và `?? .qoder/ui-team/` (scratch của tool + artifact của team).

```
git add -- components entrypoints hooks lib public src styles docs wxt.config.ts
git status --porcelain | grep -v '^??' | wc -l          # phải ra 0
git commit -m "chore(ui-baseline): checkpoint sơn mài renovation before UI fix pass"
git status --porcelain                                  # chỉ còn ?? .impeccable/ và ?? .qoder/ui-team/
```

Không push. Không `--amend`. Không `reset`/`checkout --`/`stash`. Branch hiện tại: `staging`.
Không có merge/rebase đang dở (`.git/MERGE_HEAD` không tồn tại).

## Lô 1 — 8 finding

| ID | File được sửa | Việc phải làm |
|---|---|---|
| UI-01 | `entrypoints/popup/App.tsx:59-80`, `entrypoints/newtab/App.tsx:93-115` | Chặn phím `n` và `/` khi có lớp modal: guard `if (document.querySelector('[role="dialog"]')) return;` ở đầu handler (popup guard cả `view === 'settings'` như hiện có). Lý do đã xác minh: `components/Composer.tsx:48` gọi `inputRef.current?.focus()` theo `expandSignal`, `components/FilterRow.tsx:138` có `autoFocus` → focus thoát `aria-modal`. |
| UI-02 | `components/Greeting.tsx:29,35`, `components/ui/Modal.tsx:96-103`, `styles/board.css:165,173-181` | Drop-cap làm gãy chữ tiếng Việt: baseline 1440 đọc "C hào buổi chiều", modal Cài đặt đọc "C ài đặt". Bỏ khoảng trống sau ký tự đầu (`mr-xs` ở Modal.tsx:97; margin của `.drop-cap`), và làm `.greeting-title` tự chứa float bằng `display: flow-root` + bỏ `clear-none` ở `Greeting.tsx:35` để subtitle/caption cùng một trục trái. KHÔNG đổi font, KHÔNG đổi cỡ 72px/44px. |
| UI-03 | `components/art/Ornaments.tsx:81-82` | `CloudRule` chỉ vẽ 48×12px lơ lửng giữa cột. Xoá `viewBox` và `preserveAspectRatio`, giữ `width="100%" height="12"` để pattern `userSpaceOnUse` lặp kín hàng. Nếu vẫn hỏng → báo cáo lại, đừng tự thay bằng ornament khác. |
| UI-04 | `styles/board.css:184` (`.proclamation`), `entrypoints/newtab/style.css:23` (`.board-top`) | Bỏ nền đỏ đặc: `background: var(--surface-lacquer); color: var(--brown); border: 1px solid var(--hairline); border-left: 6px solid var(--primary); border-radius: var(--radius-md); box-shadow: var(--elev-lacquer)`. `.board-top` margin-bottom → `var(--spacing-md)`. Giữ nguyên biến thể `.proclamation-compact` của popup nếu nó cần đỏ. |
| UI-05 | `styles/signature.css:158-175` (`.seal-button`) | Trạng thái đang đọc ngược. Mặc định: `background: transparent; color: var(--primary); border: 2px solid var(--primary); box-shadow: none`. Giữ đĩa đặc `var(--primary)` cho `:active` và cho `[aria-pressed='true']` (nút đã xong). Không sửa `TaskScroll.tsx:69-75` (việc render `null` là chủ ý đã ghi trong comment). |
| UI-06 | `entrypoints/newtab/App.tsx:180,223`, `components/SubjectShelf.tsx:59` | Ba vùng ba cấp tiêu đề (32px vs 20px vs không có). Về cùng một cấp `.region-title`: `SubjectShelf.tsx:59` đổi sang `region-title` (icon 18px), thêm `<h2 className="region-title mb-base">Cuộn nhiệm vụ</h2>` trước `<Greeting>` ở `App.tsx:180`. |
| UI-07 | `entrypoints/newtab/style.css:147-153` | Khối `.composer-row { flex-wrap: wrap }` + `.composer-row > .composer-submit { width: 100% }` đang nằm trong `@media (max-width: 719px)` → nâng lên `@media (max-width: 1023px)`. Bằng chứng: 768px ô nhập còn 136.1px, placeholder cụt "Hôm nay con c…". |
| UI-08 | `components/ui/QuillInput.tsx:131-138`, `styles/signature.css:216` | `.quill-ink` có `white-space: pre; overflow: hidden` nhưng không cuộn theo input → mất chữ khi tiêu đề dài. Thêm ref cho div `.quill-ink` và trong layout effect gán `inkRef.current.style.transform = \`translateX(${-input.scrollLeft}px)\``. |

## Lô 2 — 9 finding

| ID | File được sửa | Việc phải làm |
|---|---|---|
| UI-09 | `components/Toast.tsx:36`, `entrypoints/popup/App.tsx:243-254`, `entrypoints/newtab/App.tsx:316-327` | Toast tự đóng sau 5000ms trong khi nó là đường hoàn tác duy nhất (`hooks/useBoard.ts:93-96` đặt `actionLabel: 'Hoàn tác'`). Bỏ auto-dismiss khi có `actionLabel`, hoặc `duration = 10000` + clear timer trong `onPointerEnter`/`onFocus`. Thêm live region thường trú `role="status" aria-live="polite" aria-atomic="true"` (sr-only) trong shell, đặt `aria-hidden="true"` lên phần hiển thị. |
| UI-10 | `entrypoints/popup/App.tsx:194,206`, `entrypoints/newtab/App.tsx:251,262` | Không mount TaskParchment và ConfirmDialog đồng thời (2 `role="dialog"` + 2 `.scrim`, 2 listener Escape capture — xem `components/ui/Modal.tsx:44-72`). Đóng `detailId` trước khi mở `deleteId`/`dirtyConfirm`, hoặc thêm `inert` + `aria-hidden` cho lớp dưới. Chọn MỘT cách, ghi rõ cách đã chọn. |
| UI-11 | `lib/tasks/form.ts:40-55`, `components/TaskParchment.tsx:180`, `components/TaskFields.tsx` | `formError()` trả một chuỗi duy nhất nên lỗi "Việc lặp lại cần một hạn chót…" hiện dưới nhãn "Tên việc" và `aria-invalid` đặt sai ô. Tách lỗi theo trường (`titleError` / `dueAtError` / `recurrenceError` / `noteError`), gắn `error` + `aria-describedby` đúng control. Giữ nguyên nội dung câu chữ tiếng Việt hiện có. |
| UI-12 | `components/FilterRow.tsx:75-93` | Bỏ `active={sortOpen}` (sinh `aria-pressed`), thay bằng `aria-haspopup="menu"` + `aria-expanded={sortOpen}` + `aria-controls` trỏ `id` của `role="menu"`. `IconButton` đã spread `...rest` nên nhận được, không sửa `components/ui/IconButton.tsx`. |
| UI-19 | `components/ui/Field.tsx:31-37`, `components/TaskFields.tsx:98,181`, `components/SettingsPanel.tsx:63,76,110,163` | `<label htmlFor={controlId}>` trỏ tới id không tồn tại khi con là `role="group"` (Segmented). Thêm nhánh group: render `<fieldset>` + `<legend>` thay `<label>` khi child không phải control. Không đổi `Segmented.tsx` (pass 2). |
| UI-20 | `components/TaskScrollList.tsx:88,96-103` | `aria-busy` + `aria-label` trên div không role nên label bị bỏ qua. Thêm `role="status"` + `<span className="sr-only">Đang mở sổ…</span>`; bọc vùng kết quả/rỗng bằng `role="status" aria-live="polite"` kèm câu đếm việc. |
| UI-21 | `components/FilterRow.tsx:59,96-103,142-146` | Đóng tìm kiếm unmount input đang giữ focus → focus rơi về body. Giữ `triggerRef` cho nút "Tìm việc" và gọi `triggerRef.current?.focus()` trong `closeSearch()`. |
| UI-22 | `components/TaskParchment.tsx:61-76,154` | `loadAll()` async, lúc chờ component `return null` → bấm tiêu đề như không phản hồi; promise không `.catch`. Render Modal ngay từ đầu với `<p aria-busy="true">Đang mở tờ giấy…</p>`, thêm `.catch(() => setGone(true))`. |
| UI-23 | `components/ui/Modal.tsx:92` | `className="parchment p-lg"` vô dụng: `.parchment` (`styles/board.css:247`) không nằm trong `@layer` nên thắng utility Tailwind v4, padding thật luôn 32px. Xoá `p-lg`, để `.parchment` tự quyết. KHÔNG chuyển `.parchment` vào `@layer` (đó là việc của Lô 3). |

## CẤM

- File OFF LIMITS: `styles/tokens.css`, `styles/components.css`, `styles/base.css`, `styles/fonts.css`, `entrypoints/popup/index.html`, `entrypoints/popup/style.css`, `components/ui/Segmented.tsx`, `components/ui/Menu.tsx`, `components/ui/RibbonTabs.tsx`, `components/SubjectShelf.tsx:69,85,114`, `components/TaskScroll.tsx:106,111`, `styles/board.css:261`, `styles/signature.css:213`.
- Không format cả file, không rename, không thêm dependency, không sửa config, không sửa generated file, không commit thay tôi, không push.
- Không tự nới scope: nếu fix thật nằm ngoài file được giao → trả `BLOCKED` kèm file + lý do.
- Không build (`pnpm build`) — verifier sẽ build một lần duy nhất.

## Verify cuối pass (chạy MỘT lần, máy này chậm)

`pnpm typecheck` && `pnpm lint` && `pnpm test`.
Test có thể đỏ vì UI-11 (tách lỗi) và UI-19 (`label` → `fieldset`): chỉ sửa test khi test đó **khẳng định hành vi cũ bị lỗi**, và liệt kê rõ test nào đã sửa ở báo cáo.

## Báo cáo về

Theo từng finding: `UI-### | FIXED | NOT_FIXED | BLOCKED` + diff `file:line` + dòng đã đổi. Không nói "đã xong" khi chưa chạy verify.

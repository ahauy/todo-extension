---
id: g11-newtab-shelf
type: bug
status: done
created: 2026-11-18
---

# G11 — New Tab: "Giá sách" nhân đôi ở ≥1200px và biến mất ở 1024–1199px

## Yêu cầu
Mỗi breakpoint chỉ render **đúng một** thể hiện của Giá sách: aside cột trái ở ≥1200px,
dải ngang ở <1200px (gồm 1024–1199 và mobile); không nhân đôi, không mất bộ lọc môn.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: New Tab Học Đường, mọi role.
- Bước tái hiện: mở New Tab ở 1280×800 → thấy "Giá sách" ở dải trên + cột trái; thu về 1024×768 → không còn "Giá sách" nào.
- Expected: 1280 → 1 aside; 1024 → 1 strip; 360 → 1 strip.
- Actual: 1280 → 2 bản (`board-shelf-strip` + `board-shelf`), 1024 → 0 bản (DOM xác nhận `shelves: 0`).

## Root cause
- `entrypoints/newtab/App.tsx:69-71`: `wide = min-width:1024`, `narrow = max-width:1199`,
  `horizontal = !wide || narrow` — giá trị này **đúng** (dải ngang khi <1200).
- `entrypoints/newtab/App.tsx:235`: `{!horizontal && <div className="board-shelf-strip">…}` → strip
  bị render ở **≥1200**, tức đảo ngược ý nghĩa `horizontal`.
- `entrypoints/newtab/App.tsx:238`: `{!horizontal && <aside className="board-shelf">…}` → aside cũng
  render ở ≥1200, nên ≥1200 có 2 bản, <1200 không có bản nào.
- CSS đã chuẩn bị sẵn đúng intent: `entrypoints/newtab/style.css:110-120` (≤1199 → 2 cột, đưa Giá sách
  lên dải ngang) và `:43-46` (`.board-shelf` sticky cho cột trái). Không cần đổi CSS.

## Acceptance (bắt buộc)
- [x] 1280×800: `board-shelf` = 1, `board-shelf-strip` = 0.
- [x] 1024×768 và 360×560: `board-shelf-strip` = 1, `board-shelf` = 0.
- [x] Không overflow ngang (`scrollWidth === clientWidth`) ở 3 breakpoint; eyeball Chrome thật lại sau fix.
- [x] Test mới assert số container thật theo media query giả lập; reviewer NORMAL PASS; verify 4 lệnh PASS.
- [x] Docs as-built: ROADMAP §8 G11 đóng + §9.2 cập nhật eyeball; scope 27, `spec_version 1.4.0` giữ nguyên.

## Ghi chú
- Phát hiện bởi eyeball 2026-11-18: `.context/review-reports/eyeball-2026-11-18.md`; CSS-contract test cũ không bắt được.
- User 2026-11-18T09:55+07:00: `/change` + "fix bug G11 trước" → auto-proceed, không dừng chờ duyệt plan riêng.
- Không gộp vào G10 (one change at a time); không đụng `SPECIFICATIONS.md`.

## Close-out 2026-11-18T10:16:06+07:00
- Reviewer NORMAL round 1 **FAIL** (HIGH: focus mode strip vẫn hiện do selector `.board-grid--focus .board-shelf-strip` vô hiệu; MEDIUM: prop `horizontal={!wide}` làm 1024–1199 render spine dọc; MEDIUM: test chỉ đếm container) — report `bug-g11-newtab-shelf-phase-1-task-01-round-1-review.md`.
- Hardening: `App.tsx:235` render strip khi `horizontal && !focusActive`, `:238` render aside khi `!horizontal && !focusActive`; `horizontal={horizontal}`; test 5 case (đếm container + `.shelf-strip` + `role=tab` + focus@1024/1280); gỡ selector dead khỏi `style.css`; comment ngưỡng 1200px.
- Reviewer NORMAL round 2 **PASS** — `.context/review-reports/bug-g11-newtab-shelf-phase-1-task-01-round-2-review.md` (reviewer tự re-review sau hardening; 0 finding chặn).
- Eyeball Chrome thật sau fix: `.context/review-reports/eyeball-g11-2026-11-18.md` + 3 ảnh `g11-newtab-*.png`; DOM 1280 aside=1/strip=0, 1024 & 360 strip=1/aside=0, focus 1024/1280 both=0 + grid 2 cột, `scrollWidth === clientWidth` everywhere.
- Verify: tsc 0 / eslint 0 / vitest 33 files 246 tests / wxt build OK 644.4 kB. Scope 27 (R-19), `spec_version` giữ 1.4.0. Docs reconcile: ROADMAP §8/§9.2, DESIGN responsive + Known Gaps.

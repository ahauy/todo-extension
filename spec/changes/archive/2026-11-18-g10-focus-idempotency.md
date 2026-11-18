---
id: g10-focus-idempotency
type: bug
status: done
parent: FEAT-003
created: 2026-11-18
---

# G10 — Double-focus giữa popup và New Tab ghi `studyLog.focus` hai lần

## Yêu cầu
Khi popup và New Tab mở cùng lúc và cùng nhận natural completion của một phiên focus,
toàn bộ hệ thống chỉ được ghi **đúng 1** phiên học (`record('focus', 1)`) cho phiên đó.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: popup + New Tab (cả hai cùng mount `useBoard` → `usePomodoro`), người dùng đã gắn việc.
- Bước tái hiện: mở cả hai bề mặt → để phiên focus đếm về 0 → xác nhận "Xong việc này chưa?" ởpopup → mở/xác nhận dialog còn tồn ở New Tab (hoặc ngược lại).
- Expected: `studyLog[dayKey].focus += 1`, task được tick 1 lần.
- Actual: mỗi bề mặt có hook riêng, mỗi hook tự gọi `onFocusComplete` và tự giữ `pendingCompletion`;
  xác nhận ở bề mặt thứ hai ghi thêm 1 phiên nữa.

## Root cause (có evidence)
1. `hooks/usePomodoro.ts:100-119` — `advance(from, 'natural')` gọi `completeRef.current()` trực tiếp;
   mỗi surface mount một hook → callback bắn 2 lần cho **cùng một** `endsAt`.
2. `hooks/usePomodoro.ts:81-93` — hydration qua `chrome.storage.local.onChanged` đồng bộ state,
   nhưng không có session id hay cờ "đã tiêu thụ" nên không phân biệt được hai callback cùng phiên.
3. `hooks/useBoard.ts:52-55,72-87` — `pendingCompletion` chỉ mang `taskId` + `interruptions`,
   không mang định danh phiên; mỗi `useBoard` tạo một pending riêng.
4. `hooks/useBoard.ts:67-70,153-159` — `recordFocus()` (`record('focus', 1)`) và `toggleTask()`
   chạy mỗi khi confirm bất kể phiên đó đã được ghi ở surface khác chưa.

→ Vi phạm `SPECIFICATIONS.md:204-207` (R-20: "gọi `record('focus', 1)` **đúng một lần**").
Đây là bug thuần, **không đổi requirement** → giữ `spec_version 1.4.0`, chỉ publish scope mới.

## Acceptance (bắt buộc)
- [x] `PomodoroState` có `focusSessionId` (local, optional), sinh mới mỗi lần `start()` focus; state cũ không có field vẫn hydrate được (fallback theo `endsAt`).
- [x] `onFocusComplete` mang `sessionId`; `pendingCompletion` mang `sessionId` xuống `ConfirmDialog`.
- [x] Có khóa tiêu thụ dùng chung (`chrome.storage.local` + ref trong context): cùng 1 `sessionId` chỉ `record('focus', 1)` **1 lần** dù confirm ở 2 bề mặt / 2 hook instance.
- [x] Từ chối dialog ở bề mặt này không chặn bề mặt kia xác nhận; skip vẫn không ghi focus.
- [x] Test reproduce: 2 hook instance hydrate từ 1 local store → 1 record; confirm lại session đã tiêu thụ → không record, không tick task.
- [x] Verify tsc / eslint / vitest / wxt build PASS; reviewer STRICT PASS; docs as-built reconcile (ERD, API_SPEC, ROADMAP §9.3).

## Quyết định thiết kế (đã duyệt)
- User 2026-11-18T09:27+07:00: "Khởi động G10 và kích hoạt chế độ eyeball" → auto-proceed sau intake, không dừng lại chờ duyệt plan riêng.
- Không bump `spec_version`, không đụng intent doc; `scopeVersion` 25 → 26, `trigger: bug-fix`, `specRefs: [R-20]`.
- Không thêm permission/network key (R-17); claim key nằm ở `chrome.storage.local`.

## Ghi chú
- Roadmap: `docs/ROADMAP_TIME_MANAGEMENT.md` §9.3 (kế hoạch G10) + §8 gap G10.
- Residual dự kiến: `chrome.storage.local` không có compare-and-swap — hai confirm **cùng tick tuyệt đối** ở hai context vẫn là rủi ro lý thuyết; ref in-context + claim key chặn các trường hợp tuần tự (repro thực tế). **Đã ghi rõ** ở `docs/ERD.md` §2.7, `docs/API_SPEC.md` §3.6, `docs/ROADMAP_TIME_MANAGEMENT.md` §9.3.

## Close-out 2026-11-18T09:45:36+07:00
- Reviewer STRICT round 1 **FAIL** (HIGH-01 marker 1 id → stale dialog s1 hồi sinh sau s2; MEDIUM-01 test tự đếm; INFO-01 residual chưa vào docs) — report `.context/review-reports/bug-g10-focus-idempotency-phase-1-task-01-round-1-review.md`.
- Đã sửa: `FOCUS_CLAIM_KEY` lưu **tập tối đa 32 sessionId** (membership + pruning), `runOncePerFocusSession`; test integration thật `useBoard` + `useStudyLog` (focus/task thật); residual vào 3 doc as-built.
- Reviewer STRICT round 2 **PASS** — `.context/review-reports/bug-g10-focus-idempotency-phase-1-task-01-round-2-review.md` (0 CRITICAL/HIGH/MEDIUM/LOW; 1 INFO hygiene đã đóng bằng close-out này).
- Verify: `tsc` 0 / `eslint` 0 / `vitest` 32 files 241 tests / `wxt build` OK 644.43 kB. Scope 26, `spec_version` giữ 1.4.0.
- Eyeball Chrome thật: `.context/review-reports/eyeball-2026-11-18.md` — phát hiện G11 (Giá sách nhân đôi ở 1280px / mất ở 1024–1199px), đăng ký roadmap §8, change riêng.

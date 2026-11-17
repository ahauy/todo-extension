---
id: package-c-residual-accuracy
type: feature
status: done
created: 2026-11-17
completed: 2026-11-17
parent: FEAT-003
---

# Follow-up Gói C — rà soát độ chính xác sau close-out

## Yêu cầu (user, 2026-11-17)

Xem xét 5 residual đã ghi trong bàn giao Gói C, xác nhận/cập nhật cho đúng thực tế:

1. Hook/App vượt 300 dòng là tình trạng có sẵn — ghi rõ số liệu hiện tại.
2. Responsive mới kiểm ở mức CSS-contract, chưa đo Chrome thật — ghi rõ và có kế hoạch đo.
3. Rủi ro double-focus giữa popup và New Tab là kế thừa từ phase 1 — cần kế hoạch xử lý.
4. `attach(null)` chưa có nút UI riêng — bổ sung vào scope + implementation.
5. Scope ghi `src/test/chrome-stub.ts` nhưng file thật là `src/__tests__/helpers/chrome-stub.ts` — sửa lại.

## Phân loại

- **Class:** MODIFY (docs/scope accuracy) + ADDITIVE nhỏ (nút detach) — **không đổi requirement**
  (`attach(null)` đã có trong R-20), nên **không bump `spec_version`**; chỉ tăng `scopeVersion` lên 24
  theo rule bug-fix/scope-only của `spec-publish.md`.
- **Risk:** thấp — UI nhỏ trong overlay đã có, docs as-built, không đụng sync schema/permission.

## Acceptance

- [x] Số dòng thực tế của các file vượt ngưỡng được ghi rõ trong roadmap + task residual (§9.1, có đính chính "hook vượt 300" là sai).
- [x] Kế hoạch đo layout Chrome 360/1024/1199 được ghi trong roadmap §9.2.
- [x] Kế hoạch xử lý double-focus được ghi trong roadmap §9.3 (gap G10: `focusSessionId` + idempotency).
- [x] Có nút "Huỷ gắn việc" trong focus overlay, đi qua xác nhận + `noteInterruption()`, có test (reviewer NORMAL PASS).
- [x] `current.json` scope 24 dùng đúng đường dẫn `src/__tests__/helpers/chrome-stub.ts` (path cũ đã biến mất).
- [x] Verify tsc/eslint/vitest (28 files, 183 tests)/wxt PASS; reviewer PASS; commit local, không push.

## Ghi chú

Không archive change doc này vào umbrella FEAT-003; umbrella tiếp tục `in_progress` (gói A/B/D/E).

### Build report (FUP-001)

**Agent: builder**

Implemented the dedicated "Huỷ gắn việc" UI for `attach(null)` only; no docs/spec/scope changes, no commit/push, no `chrome.storage.sync`/permission changes.

- `components/FocusTimer.tsx`: `FocusTimerProps.onDetach?`; `OverlayView` renders a third `Huỷ gắn việc` button only when a task is attached (`!dangling && title`) and the handler exists. Existing 2 buttons and 112px dial untouched; detach is not wired to `skip`/`reset`.
- `hooks/useBoard.ts`: `detachFocus()` calls `pomodoro.attach(null)` then defers `noteInterruption()` via `pendingInterruptId` sentinel `''`, reusing the `switchTaskMidSession` pending-render pattern (effect matches on `pomodoro.taskId === null`). Returned from the hook.
- `components/FocusConfirms.tsx`: `FocusInterrupt['kind'] += 'detach'`; detach-specific title/description/confirm label `Huỷ gắn` / `Giữ việc cũ`; attach/toggle flows unchanged.
- Both overlays request `{ kind: 'detach', id: '' }` and call `board.detachFocus()` on confirm; Escape behavior unchanged.
- Tests: `focusOverlay.test.tsx` (+2), `App.wiring.test.tsx` (+1), `App.focus.test.tsx` (+1) — behavioral assertions only (button exists, opens confirm, confirm → `taskId: null` + `interruptions: 1`, cancel no-op, no focus recorded, session still running).

Final `wc -l` (touched App files):
- `entrypoints/popup/App.tsx`: 318 (was 313, +5)
- `entrypoints/newtab/App.tsx`: 405 (was 400, +5)

Verification (all PASS):
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm exec eslint .` → exit 0
- `pnpm exec vitest run` → 28 files, 183 tests passed
- `pnpm exec wxt build` → Built extension in 1.402 s, finished in 1.700 s

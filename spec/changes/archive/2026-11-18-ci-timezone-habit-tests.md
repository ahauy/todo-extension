---
id: bug-ci-timezone-habit-tests
type: bug
status: done
closed: 2026-11-18
created: 2026-11-18
---

# CI GitHub đỏ: 2 test habit so ngày LOCAL với giả định UTC+7

## Yêu cầu
Sửa để `pnpm exec vitest run` trên GitHub Actions (runner `ubuntu-latest`, TZ = UTC) chạy xanh như máy
local (UTC+7), **không đổi semantics ngày local** của R-09/R-23.

## Bối cảnh / tái hiện (bug)
- Màn/route: CI job `ci` trong `.github/workflows/ci.yml` (step `Test (vitest)`), không phải lỗi UI.
- Bước tái hiện: đẩy commit lên `staging` → GitHub Actions chạy `pnpm exec vitest run`.
- Expected: 45 files / 367 tests PASS như máy local.
- Actual (log user dán 2026-11-18):
  - `src/__tests__/habit.test.ts` — 30 tests / **2 failed**:
    - `habitStartDay — ngày LOCAL của startedAt > dùng getFullYear/getMonth/getDate, không cắt chuỗi UTC`
      → `expected '2026-11-18' to be '2026-11-19'`.
    - `habitOccurrenceDay — ngày occurrence cũ > đọc dueAt CŨ theo giờ local, kể cả instant ISO có Z`
      → `expected '2026-11-18' to be '2026-11-19'`.
- Root cause (đã soi cấu hình): **`src/__tests__/habit.test.ts:93-98,110-112` hard-code kết quả UTC+7**
  cho instant `2026-11-18T18:00:00.000Z` (18:00Z = 01:00 ngày 19 giờ UTC+7). Trên runner GitHub
  `TZ=UTC` nên cùng instant rơi vào ngày **18**. `.github/workflows/ci.yml` không đặt `TZ`, `vitest.config.ts`
  cũng không pin timezone. Code sản phẩm **đúng**: `habitStartDay`/`habitOccurrenceDay`
  (`lib/tasks/habit.ts:76-89`) gọi `dayKey(date)` đọc `getFullYear/getMonth/getDate` local theo đúng R-23;
  `dayKey` là wall-clock local theo R-09. **Không sửa source code để khớp test** (sẽ phá intent spec).

## Acceptance (bắt buộc)
- [ ] Test chạy xanh ở **cả TZ=UTC (CI) và TZ=Asia/Ho_Chi_Minh (local)**; config được pin rõ ràng một
      timezone cho job test thay vì phụ thuộc máy chạy.
- [ ] Không đổi `lib/tasks/habit.ts`, `lib/datetime.ts`, `lib/tasks/types.ts` (giữ ngày local R-09/R-23).
- [ ] Giữ nguyên ý nghĩa 2 test: instant `18:00Z` phải cho **ngày local tiếp theo** ở timezone đã pin.
- [ ] Verify 4 lệnh PASS: `pnpm exec tsc --noEmit` · `pnpm exec eslint .` · `pnpm exec vitest run`
      · `pnpm exec wxt build`; có evidence chạy lại với `TZ=UTC pnpm exec vitest run`.
- [ ] Reviewer (NORMAL/FAST) PASS; cập nhật `.context/progress.json` + archive change file.

## Ghi chú
- Hướng sửa đề xuất (chọn khi `/change`): thêm `env: TZ: Asia/Ho_Chi_Minh` ở job `ci` trong
  `.github/workflows/ci.yml` (hoặc riêng step Test) để khớp múi giờ thiết kế; cân nhắc pin cùng giá trị
  trong script test local để hai môi trường đồng nhất. Không thêm dependency (`cross-env`) nếu dùng env
  của workflow.
- Cách làm **không** dùng: đổi expectation thành `'2026-11-18'` hay gọi `dayKey(new Date(startedAt))`
  trong chính assertion (sẽ thành test tự chứng minh, mất ý nghĩa "không cắt chuỗi UTC").
- Dòng log `grid thu cột phụ, focus panel ở board-desk, board vẫn còn…` là tiêu đề test bị cắt trong
  `entrypoints/newtab/App.focus.test.tsx:162`, **không phải failing test** — chỉ dán log lẫn, không xử lý.
- Classify **BUG**, risk LOW (CI gate + test config, không đụng data contract), scope `CI_CONFIG/TEST`.
  Không bump `spec_version`/`scopeVersion` (không đổi requirement/scope).

---
spec_version: 1.2.0
updated_at: 2026-11-13
source: BRIEF.md + brainstorm (2026-11-10)
status: draft
---

# SPECIFICATIONS.md — Todo Extension

> Sinh từ `BRIEF.md` + brainstorm 2026-11-10 (greenfield, chưa có code).
> Thay đổi sau này đi qua `/change` (agent `change-request`), không sửa tay.

## Overview

Chrome extension Manifest V3 quản lý todo list ngay trong trình duyệt. Popup React cho phép
thêm/sửa/xoá/tick task, đặt ưu tiên, ghi chú, tag, subtask, due date + giờ và quy tắc lặp lại.
Dữ liệu lưu `chrome.storage.sync` (đồng bộ theo tài khoản Chrome). Nhắc việc bằng
`chrome.alarms` + `chrome.notifications`. Không backend, không DB, không network request.

Người dùng: cá nhân cần todo nhanh khi đang lướt web.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Platform | Chrome Extension Manifest V3 |
| Build | WXT |
| UI | React 19 + TypeScript, Tailwind CSS v4 |
| State | `useSyncExternalStore` trên storage adapter (không state lib) |
| Storage | `chrome.storage.sync` |
| Reminder | `chrome.alarms` + `chrome.notifications` |
| Test | Vitest + React Testing Library |
| Package manager | pnpm |
| CI | GitHub Actions (typecheck → lint → test → build → zip artifact) |
## Features (Requirements)

### Domain: Quản lý task

**R-01 — Tạo task**
Người dùng nhập title (bắt buộc, trim, 1–200 ký tự) và submit. Hệ thống tạo `Task` với
`id = crypto.randomUUID()`, `done = false`, `priority` mặc định `medium`, `tags = []`,
`subtasks = []`, `recurrence = {type:'none'}`, `createdAt = updatedAt = now`, lưu vào storage.
Title rỗng/toàn khoảng trắng → không tạo, hiện lỗi inline.

**R-02 — Sửa task**
Sửa được title, note (≤ 1000 ký tự), priority, tags, subtasks, due date + giờ, recurrence.
Mỗi lần sửa cập nhật `updatedAt` và ghi lại đúng key `t:<id>`.

**R-03 — Xoá task**
Xoá task khỏi storage và xoá alarm tương ứng (`chrome.alarms.clear('due:<id>')`).

**R-04 — Tick hoàn thành / bỏ hoàn thành**
Toggle `done` cho task không lặp. Task `done` bị xoá alarm; task chưa done và có `dueAt` tương lai
được tạo lại alarm.

**R-05 — Ưu tiên**
`priority ∈ {low, medium, high}`, mặc định `medium`. UI hiển thị dấu hiệu ưu tiên; sort theo priority
được (high → low).

**R-06 — Ghi chú**
`note` tuỳ chọn, tối đa 1000 ký tự, hiển thị rút gọn trong task item và đầy đủ khi mở chi tiết.

**R-07 — Tag / danh sách**
`tags: string[]`, tối đa 5 tag, mỗi tag 1–20 ký tự, trim + loại trùng. Lọc theo tag; tìm kiếm
khớp tag.

**R-08 — Subtask / checklist**
`subtasks: {id, title, done}[]`, tối đa 50. Task item hiển thị tiến độ `done/total`.
Tick hết subtask KHÔNG tự tick task cha (tránh hành vi ngầm); tick task cha không đổi subtask.

### Domain: Thời gian & nhắc việc

**R-09 — Due date + giờ**
Task có thể có `dueAt` (chuỗi ISO 8601 local, gồm cả ngày và giờ) hoặc không có. Không có `dueAt` → không nhắc.
`dueAt < now` → hiển thị trạng thái "quá hạn" (overdue) trong UI.

**R-10 — Quy tắc lặp lại**
`recurrence` hỗ trợ:
- `none`
- `daily`
- `weekly` + chọn các thứ trong tuần (`weekdays`, 0=CN…6=T7, ≥ 1 phần tử)
- `monthly` + chọn ngày trong tháng (`day` 1–31)

Weekly/monthly bắt buộc có `dueAt` để làm mốc tính lần kế tiếp.

Mọi phép tính ngày/tuần/tháng dùng **múi giờ local của thiết bị** (không UTC): "thứ 2" là thứ 2 theo
giờ người dùng; đổi múi giờ thiết bị có thể làm lệch ngày nhắc — chấp nhận (client-only, không server).

**R-11 — Hoàn thành task lặp lại**
Khi tick done task có `recurrence ≠ none` và có `dueAt`: giữ nguyên `id`, đặt `done = false`,
`dueAt = nextDueAt(dueAt, rule)`, cập nhật `updatedAt`, tạo alarm mới. Không lưu lịch sử occurrence.

Đóng dấu để lại vết trên task bằng hai field additive tuỳ chọn: `lastDoneAt` (mốc đóng dấu, ISO 8601 UTC)
và `prevDueAt` (hạn của occurrence vừa hoàn thành). Task có `lastDoneAt` cùng ngày local với hiện tại →
thẻ hiển thị trạng thái **done-today** ("đã làm hôm nay · hẹn <hạn kế tiếp>"), bền qua reload và tự về
open khi sang ngày kế tiếp. Bấm lại khi đang done-today = **hoàn tác hôm nay**: khôi phục
`dueAt = prevDueAt`, xoá `lastDoneAt`/`prevDueAt`, không cuộn hạn thêm lần nữa. Task cũ thiếu hai field
này được coi như open.

**Catch-up:** nếu `nextDueAt` rơi vào quá khứ (user tick muộn nhiều kỳ), lặp `nextDueAt` cho tới khi
kết quả `> now` (tối đa 1000 vòng để chặn vòng lặp vô hạn với rule lỗi) rồi mới ghi + tạo alarm.
Task không bao giờ ở trạng thái "lặp nhưng không có nhắc".

**R-12 — Nhắc việc**
Với mỗi task có `dueAt > now` và `done = false`, background tạo `chrome.alarms` tên `due:<id>`.
Khi alarm fire → hiện `chrome.notifications` (title task + note rút gọn + hạn). Notification không
tự đổi trạng thái task. `dueAt ≤ now` không tạo alarm (Chrome sẽ fire ngay); task hiển thị overdue.

**R-13 — Đồng bộ thiết bị**
Dữ liệu lưu `chrome.storage.sync`; thay đổi từ thiết bị khác nhận qua `chrome.storage.onChanged`:
- Key `t:<id>` **thay đổi** → merge theo `updatedAt` (lớn hơn thắng), cập nhật UI + reschedule alarm.
- Key `t:<id>` **bị xoá** (`newValue` undefined) → xoá task khỏi state local + `chrome.alarms.clear('due:<id>')`.
- Key `settings` thay đổi → áp ngay các lựa chọn hiển thị và tương tác hiện có.

### Domain: UI & trải nghiệm

**R-14 — Hệ hiển thị Sơn Mài Học Đường**
Sản phẩm dùng một palette sáng vỏ trứng/sơn mài. Settings lưu lựa chọn mở extension
(`popup | newtab | auto`), kiểu bút, hiệu ứng bút, hoạ tiết, vệt sơn, thời lượng Pomodoro,
tiếng chuông và thông báo. Dark mode không thuộc phạm vi hiện tại.

**R-15 — Lọc / tìm / sắp xếp**
Tab `all | today | upcoming | done`, lọc theo môn học, tìm kiếm theo title/note/tag (không phân biệt hoa thường).

Sort mặc định: **overdue trước → `dueAt` gần nhất → `priority` high→low → `createdAt` mới nhất**.
Task không có `dueAt` xếp sau task có `dueAt`. User chọn được tiêu chí chính (`dueAt` | `priority` |
`createdAt`); tie-breaker luôn theo thứ tự trên để kết quả ổn định (deterministic).

**R-16 — Trạng thái rỗng & lỗi**
Danh sách rỗng hiển thị empty state. Lỗi storage quota hiển thị banner rõ ràng, không nuốt lỗi.
Notification bị chặn → hint trong Settings.

**R-17 — Quyền tối thiểu**
Manifest chỉ khai `permissions: ["storage", "alarms", "notifications"]`. Không `host_permissions`,
không content script, không network request.

**R-18 — Hiệu năng popup**
Mở popup hiển thị dữ liệu < 100ms trên máy tham chiếu (MacBook Apple Silicon, ~50 task); không
chạy code trên trang web đang mở.

**R-19 — Trải nghiệm Sơn Mài có chủ đích**
Popup 360×560 và bảng New Tab là hai bề mặt của cùng một hệ thiết kế. Ở mọi breakpoint hỗ trợ,
nội dung task, hạn chót, môn học và ưu tiên phải luôn dễ đọc và không tràn ngang. Menu/lọc có thể
dài phải giữ ngữ cảnh thao tác, đóng rõ ràng và dùng được bằng bàn phím.

Motion chỉ được dùng để phản hồi thao tác hoặc đổi trạng thái thật: ghi việc, đóng/bỏ triện,
chuyển bộ lọc/menu, và mốc chuỗi học. Không có autoplay, marquee, parallax hay hiệu ứng lặp vô cớ.
Tất cả motion phải tuân `prefers-reduced-motion`; không được thêm thư viện animation hoặc quyền/network mới.

## API Endpoints

Không có — extension không có backend/API.

## Database Schema

Không có DB. Storage layout `chrome.storage.sync`:

| Key | Value | Ghi chú |
|---|---|---|
| `t:<uuid>` | `Task` | 1 key / task → ghi cục bộ, tránh ghi đè cả danh sách |
| `settings` | `Settings` | display mode, tuỳ chọn hiệu ứng, Pomodoro, âm thanh, thông báo |
| `subjects` | `Subject[]` | giá sách môn học |
| `studyLog` | `StudyLog` | chuỗi ngày học |

Pomodoro là trạng thái local, không đồng bộ. Chi tiết hợp đồng dữ liệu: `docs/ERD.md`.

## Authentication

Không có auth riêng. Đồng bộ dựa trên tài khoản Chrome đang đăng nhập (`chrome.storage.sync`).

## Scalability Profile (OPTIONAL — chỉ khi user bật Scalability Option)

- **Scalability Option:** off
- **Tier:** —
- **CCU dự kiến:** —
- **Peak RPS ước tính:** —
- **Tỉ lệ đọc/ghi:** —
- **Peak/off-peak chênh lệch:** —
- **Tăng trưởng 6–12 tháng:** —
- **Availability (SLA):** —
- **Recovery (RTO/RPO):** —

> Không áp dụng: extension client-only, dữ liệu nằm trong `chrome.storage.sync` (giới hạn Chrome:
> `QUOTA_BYTES` 102.400 bytes ≈ 100 KiB, `QUOTA_BYTES_PER_ITEM` 8.192 bytes, `MAX_ITEMS` 512,
> `MAX_WRITE_OPERATIONS_PER_MINUTE` 120 — đủ cho todo cá nhân).

## Deployment

- Build: `wxt build` → `.output/chrome-mv3` → zip.
- CI: GitHub Actions (typecheck, lint, test, build, upload artifact).
- Phát hành: upload zip lên Chrome Web Store **thủ công** (không auto publish).
- Không dùng Vercel/Railway; không có server.

---
*Generated by: /start → brainstorm (greenfield, từ BRIEF.md)*
*Validated by: .agent/spec-validator.md*

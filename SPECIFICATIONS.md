---
spec_version: 1.6.0
updated_at: 2026-11-18
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

**R-21 — Việc then chốt, con ếch & cắt bỏ (Gói A)**
`Task` có hai field additive tuỳ chọn: `keystone?: boolean` (mặc định `false`) và
`archived?: boolean` (mặc định `false`). Bật then chốt tự gán `priority='high'`; tắt then chốt
**không** tự hạ priority. Tối đa **3 việc then chốt đang mở** (`!done && !archived`); vượt 3 chỉ
hiện cảnh báo, vẫn lưu bình thường (quyết định A1). Nhãn A/B/C vẫn ánh xạ vào 3 mức priority hiện có,
không thêm enum 5 mức.

Chip **"20%"** là bộ lọc bật/tắt trên nền tab hiện tại, **không** thêm tab thứ 5 (quyết định A2).
Chip lọc `keystone && !archived`, xếp sau tab/subject/search và trước sort; không đổi thứ tự sort
R-15. Task `archived=true` bị loại khỏi cả 4 tab, chip 20%, tìm kiếm và **mọi bộ đếm/empty-state/danh
sách môn**; dữ liệu vẫn nằm trong storage. Mục "Đã cắt" trong SettingsPanel liệt kê và cho phục hồi
(`archived=false`) — không xoá vĩnh viễn (quyết định A3).

"Con ếch hôm nay" là **một** `Task` được chọn cho ngày local hiện tại, lưu trong **1 key duy nhất**
`dayPlan` của `chrome.storage.sync` dạng `{ [dayKey]: { frogTaskId: string | null } }` với
`dayKey = YYYY-MM-DD` local; prune còn **14 ngày gần nhất** mỗi lần ghi, cấm tạo key theo ngày
(giới hạn 512 item / 8192 B mỗi item). Thay đổi key `dayPlan` từ bề mặt/thiết bị khác phải hydrate
qua `chrome.storage.onChanged` như key `t:<id>` (R-13). Chọn việc khác trong cùng ngày thì thay thế;
sang ngày khác việc cũ tự hết hiệu lực. Thẻ bài có ribbon "THEN CHỐT"; con ếch có dấu riêng phân biệt **cả màu lẫn
chữ**, giữ nguyên cấu trúc DOM giữa bản compact và bản đầy.

New Tab hiển thị hero "Con ếch hôm nay" với nút "Tập trung 25 phút" dùng lại luồng gắn việc của
R-20 (không tạo phiên focus thứ hai), dòng "Then chốt: x/y xong" cho hôm nay và một dòng review tuần
"Tuần này: then chốt a/b · n việc xong" tính từ thứ 2 local tới hiện tại. Các con số được suy thuần
từ task + `dayPlan` (việc xong lấy `lastDoneAt` hoặc `updatedAt` khi `done=true`); **không** lưu số
tổng hợp, không tính điểm, không network request.

### Domain: Thời gian & nhắc việc

**R-09 — Due date + giờ**
Task có thể có `dueAt` hoặc không có. `dueAt` là **wall-clock giờ địa phương**, định dạng chuẩn
`YYYY-MM-DDTHH:mm`, không hậu tố `Z`/offset — "8 giờ sáng mai" phải giữ nguyên 8 giờ địa phương
dù đổi múi giờ/DST. Không có `dueAt` → không nhắc.
Task cũ lưu `dueAt` có hậu tố `Z` được chuẩn hoá về local wall-clock **khi đọc** (in-memory,
không ghi lại toàn bộ — ràng buộc 120 write/phút của `chrome.storage.sync`).
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

Weekly `nextDueAt` phải sinh occurrence **đúng các thứ khai trong `weekdays`** (kể cả qua catch-up
`nextFutureDue`), giữ nguyên `HH:mm`. Nếu `weekdays` rỗng hoặc thiếu (dữ liệu cũ lỗi) → fallback
cộng +7 ngày giữ nguyên giờ để không mất mốc.

**R-11 — Hoàn thành task lặp lại**
Khi tick done task có `recurrence ≠ none` và có `dueAt`: giữ nguyên `id`, đặt `done = false`,
`dueAt = nextDueAt(dueAt, rule)`, cập nhật `updatedAt`, tạo alarm mới. Không lưu lịch sử occurrence.

Đóng dấu để lại vết trên task bằng hai field additive tuỳ chọn: `lastDoneAt` (mốc đóng dấu, ISO 8601 UTC)
và `prevDueAt` (**wall-clock local**, cùng định dạng `YYYY-MM-DDTHH:mm` với `dueAt` — là bản sao hạn của occurrence vừa hoàn thành, KHÔNG phải instant). Task có `lastDoneAt` cùng ngày local với hiện tại →
thẻ hiển thị trạng thái **done-today** ("đã làm hôm nay · hẹn <hạn kế tiếp>"), bền qua reload và tự về
open khi sang ngày kế tiếp. Bấm lại khi đang done-today = **hoàn tác hôm nay**: khôi phục
`dueAt = prevDueAt` (cả hai cùng wall-clock local nên gán thẳng, không cần quy đổi), xoá `lastDoneAt`/`prevDueAt`, không cuộn hạn thêm lần nữa. Task cũ thiếu hai field
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
Chip "20%" (R-21) bật/tắt như một bộ lọc xếp trên nền tab hiện tại; task `archived=true` luôn bị
loại khỏi mọi tab, bộ lọc và bộ đếm. Việc bổ sung bộ lọc không được làm đổi thứ tự sort.

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

### Domain: Đơn nhiệm (Single-handling)

**R-20 — Phiên tập trung gắn với một việc**
Người dùng có thể gắn một task vào phiên Pomodoro đang chạy ("Tập trung việc này" trên thẻ việc) hoặc
huỷ gắn (`attach(null)`). Mã việc nằm trong `PomodoroState.taskId`, lưu ở `chrome.storage.local` —
**không đổi schema `chrome.storage.sync`**; đóng/mở popup giữa phiên vẫn thấy đúng việc đã gắn.

Khi phiên focus đang chạy và đã gắn việc: popup chuyển sang **focus overlay** (đồng hồ bản thu gọn
tối thiểu 96px + thẻ việc + nút tạm dừng/kết thúc), ẩn board để không tick nhầm việc khác; New Tab
thu board thành cột phụ nhưng vẫn giữ ngữ cảnh. Không có taskId → giao diện và hành vi y hệt hiện tại.

Trong phiên đang chạy, thao tác tick việc khác hoặc đổi việc gắn phải hiện xác nhận "Đang trong phiên,
đổi việc sẽ phá tập trung?". Nếu user vẫn đổi, ghi **1 lần ngắt** vào bộ đếm `interruptions` của
`PomodoroState` (local-only) — chỉ hiển thị trong tổng kết phiên, không ghi vào `StudyLog`, không
đồng bộ thiết bị. Bộ đếm đặt lại về 0 khi bắt đầu một phiên focus mới và bị xoá khi reset/skip/kết
thúc phiên; nó không tồn tại ngoài phiên.

Khi phiên focus **kết thúc tự nhiên** (đếm về 0) và có taskId → hỏi "Xong việc này chưa?". Chỉ khi user
xác nhận mới tick task (task lặp đi theo R-11) và gọi `record('focus', 1)` **đúng một lần**. Phiên bỏ
dở (tạm dừng rồi reset, skip, đóng mà không xác nhận) **không** được tính `focus`; riêng `skip` phiên
focus phải được sửa để không gọi completion. Không thêm permission (R-17), không network request.

**R-22 — Kế hoạch mai (6P, Gói B)**
Task có `plannedFor?: string | null` — ngày dự định **LÀM**, định dạng `YYYY-MM-DD` theo giờ local,
**tách khỏi `dueAt`** (hạn chót). `plannedFor` không tự tạo alarm, không đổi việc quá hạn hay thứ tự
sort deterministic (R-15); bảng Học Đường (New Tab) có khối "Đã hẹn hôm nay" trên tab "Hôm nay",
hiển thị như lịch hẹn chứ không tô đỏ như việc quá hạn. Popup 360×560 chỉ nhận 1 khối UI mới của gói
này (mục cài đặt nhắc) theo ràng buộc 1 khối/gói của roadmap §3 — không thêm khối thứ hai.

`Settings` có `planReminder: { enabled: boolean; at: string }`, mặc định `{ enabled: true, at: '21:00' }`;
`normalizeSettings` phải điền mặc định cho bản settings cũ. Khi bật, background giữ **đúng 1** alarm hằng
ngày tại giờ local `at` → notification "10 phút lên kế hoạch ngày mai"; khi tắt thì xoá alarm, không gửi
notification. Đổi giờ phải clear alarm cũ rồi tạo alarm mới, không nhân đôi.

Bấm vào notification đó phải mở đúng sheet "Kế hoạch mai" trên bảng Học Đường (không mở tab trống).
Sheet cho chọn **tối đa 5 việc** từ *Sắp tới* + *Chưa hẹn*, gán `plannedFor = ngày mai`, và cho chọn một
việc làm "ếch cho ngày mai" qua cùng key `dayPlan` (R-21). Không thêm permission (R-17), không network.

**R-23 — Thói quen 21 ngày (Gói D)**
Task lặp (`recurrence.kind !== 'none'`) có thể bật theo dõi thói quen qua field nhúng
`habit?: { startedAt: string; doneDays: string[] }` ngay trong key `t:<id>` — **không** tạo key
storage mới, không lưu 1 key/ngày. `doneDays` là sổ theo dõi thói quen **opt-in**, không phải lịch sử
occurrence dùng để cuộn hạn/alarm (R-11 vẫn "không lưu lịch sử occurrence"). `startedAt` là instant ISO
UTC lúc bật; `doneDays` là tập `YYYY-MM-DD` theo giờ local, không trùng, tăng dần và **tối đa 31 phần tử**
(bỏ ngày cũ nhất khi ghi vượt). Task cũ/thiếu field coi như không theo dõi. Tắt toggle, đổi `recurrence`
về `none` hoặc cắt bỏ (`archived`) chỉ ẩn streak, **không xoá** `habit`; bật/phục hồi lại dùng dữ liệu cũ.

Một ngày là **ngày thuộc lịch** nếu từ ngày local của `startedAt` trở đi nó khớp rule: `daily` = mọi
ngày, `weekly` = một trong `weekdays` (R-10), `monthly` = ngày `rule.day` sau clamp. Ngày không thuộc
lịch được hiển thị là "ngoài lịch" — không tính là ngày thiếu, không đứt streak. Lịch luôn đánh giá
theo **rule hiện tại** (không lưu lịch sử rule); đổi `weekdays`/`day`/`kind` có thể làm streak thay đổi
mà không có lần hoàn thành mới — chấp nhận. Streak đếm ngược
từ hôm nay nếu hôm nay thuộc lịch và đã làm, hoặc từ hôm qua nếu hôm nay thuộc lịch nhưng chưa làm
(ân hạn đến hết ngày); bỏ qua ngày không thuộc lịch, dừng ở `startedAt`. Ngày local của `startedAt`
được suy bằng helper local của thiết bị, chịu cùng mức trôi múi giờ/DST đã chấp nhận ở R-10. Vì cửa sổ
lưu trữ 31 ngày, streak hiển thị không vượt quá 31 ngày lịch; UI phải nói rõ lưới chỉ có 21 ô còn streak
có thể dài hơn.

Khi tick hoàn thành, ngày ghi vào `doneDays` là **ngày local của occurrence vừa xong**: lấy từ `dueAt`
cũ trước khi ghi (tương đương `prevDueAt` ngay sau lần ghi R-11), **không** đọc `prevDueAt` cũ và không
dùng `dueAt` mới (occurrence kế tiếp). Nếu ngày đó **đã rơi khỏi cửa sổ 31 ngày gần nhất** (cũ hơn ngày hôm nay trừ 30 ngày) thì **không ghi**
(để không đẩy ngày mới hơn ra khỏi sổ); ngược lại, kể cả occurrence mang ngày tương lai (tick sớm) vẫn
được ghi vì chưa có ngày nào bị đẩy ra. Hoàn tác R-11 gỡ đúng ngày đó ra. Lưới trên bảng Học Đường cho
phép **bỏ dấu** một ngày đã ghi trong cửa sổ 31 ngày (không cho thêm tay ngày chưa làm) rồi tính lại
streak; thao tác này **chỉ đổi `doneDays`**, không đụng `dueAt`, `lastDoneAt`/`prevDueAt` hay alarm —
R-11 vẫn là đường duy nhất đổi occurrence. Bỏ dấu ngày đã gỡ là no-op. Mọi thao tác vẫn dùng một lần
`put(task)` hiện có; nếu ghi thất bại (quota) thì hoàn tác cả thay đổi `habit` trong bộ nhớ như R-16.
`dueAt`, alarm `due:<id>` và sort deterministic (R-15) giữ nguyên. Streak chỉ đọc `doneDays` (không đọc
`lastDoneAt`): chip "đã làm hôm nay" của R-11 và streak R-23 là hai tín hiệu riêng, có thể cùng hiển thị
sau một lần tick muộn.

Bảng Học Đường có thẻ thói quen gồm lưới **21 ô liên tiếp kết thúc hôm nay** với 3 trạng thái
(đã làm / thiếu / ngoài lịch), streak hiện tại và dấu mốc **7 → 14 → 21**; sau 21 streak tiếp tục
tăng. 21 ngày là **mốc ăn mừng đầu tiên**, không được trình bày là kết luận khoa học về thời gian
hình thành thói quen. Popup 360×560 không thêm khối UI mới của gói này: chỉ toggle trong hộp sửa
việc đã có và một badge streak nhỏ trên dòng meta của thẻ việc. Streak này độc lập `StudyLog`/
chuỗi học chung (R-20); không thêm permission (R-17), không network request.

## API Endpoints

Không có — extension không có backend/API.

## Database Schema

Không có DB. Storage layout `chrome.storage.sync`:

| Key | Value | Ghi chú |
|---|---|---|
| `t:<uuid>` | `Task` | 1 key / task → ghi cục bộ, tránh ghi đè cả danh sách; R-23 nhúng `habit` trong cùng key |
| `settings` | `Settings` | display mode, tuỳ chọn hiệu ứng, Pomodoro, âm thanh, thông báo |
| `subjects` | `Subject[]` | giá sách môn học |
| `studyLog` | `StudyLog` | chuỗi ngày học |
| `dayPlan` | `{ [dayKey]: { frogTaskId: string \| null } }` | 1 key duy nhất cho con ếch; `dayKey=YYYY-MM-DD` local, prune 14 ngày (R-21) |

Pomodoro là trạng thái local, không đồng bộ. `PomodoroState` gồm `taskId` (việc đang gắn) và
`interruptions` (số lần ngắt trong phiên) — cả hai chỉ nằm ở `chrome.storage.local`. Chi tiết hợp đồng
dữ liệu: `docs/ERD.md`.

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

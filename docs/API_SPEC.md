# API Specification — Todo Extension

> **As-built doc.** Mô tả contract thật của extension, đối chiếu trực tiếp với code.
> Nếu doc này khác code → **code thắng**; cập nhật doc kèm evidence.
> Nguồn sự thật: `lib/tasks/types.ts`, `lib/storage/adapter.ts`, `lib/alarms/scheduler.ts`,
> `lib/tasks/recurrence.ts`, `lib/tasks/query.ts`, `entrypoints/background.ts`, `hooks/useTasks.ts`.

## 0. Bản chất: KHÔNG có HTTP API

Todo Extension là **Chrome Extension Manifest V3 client-only**:

- **Không backend, không REST/GraphQL endpoint, không server, không network request** (R-17).
- Không authentication riêng — đồng bộ dữ liệu dựa trên tài khoản Chrome đang đăng nhập.
- "API" của extension gồm 3 lớp contract:
  1. **Data contract** — schema dữ liệu trong `chrome.storage.sync` (xem [`ERD.md`](ERD.md)).
  2. **Chrome extension APIs** — các API nền tảng được phép gọi (mục 2).
  3. **Internal module interfaces** — hợp đồng giữa các module TypeScript (mục 3).

`SPECIFICATIONS.md` §API Endpoints xác nhận: *"Không có — extension không có backend/API."*

## 1. Data contract (tóm tắt)

Storage layout `chrome.storage.sync` — chi tiết đầy đủ ở [`ERD.md`](ERD.md):

| Key | Area | Value | Nguồn |
|---|---|---|---|
| `t:<uuid>` | `sync` | `Task` (1 key/task, ghi atomic theo key) | `lib/tasks/types.ts:137` (`TASK_KEY_PREFIX`) |
| `settings` | `sync` | `Settings` | `lib/tasks/types.ts:138` (`SETTINGS_KEY`) |
| `subjects` | `sync` | `Subject[]` | `lib/tasks/types.ts:139` (`SUBJECTS_KEY`) |
| `studyLog` | `sync` | `StudyLog` (prune 60 ngày) | `lib/tasks/types.ts:140` (`STUDY_LOG_KEY`) |
| `dayPlan` | `sync` | `DayPlan` (**1 key**, prune 14 ngày; R-21) | `lib/tasks/types.ts:143,150-152`, `lib/storage/adapter.ts:242-264` |
| `pomodoro` | **`local`** | `PomodoroState` (`taskId` + `interruptions` + `focusSessionId` local-only, R-20/G10) | `lib/tasks/types.ts:118,148,150`, `lib/storage/local.ts:22-83` |
| `focusCompletionClaim` | **`local`** | G10 — tập tối đa 32 `sessionId` đã tiêu thụ (`string[]`) | `lib/tasks/types.ts:150`, `lib/storage/local.ts:41-83` |

Kiểu `Task`, `Settings`, `Subtask`, `RecurrenceRule`, `Subject`, `StudyLog`, `PomodoroState`, `DayPlan` định nghĩa
duy nhất tại `lib/tasks/types.ts` — adapter, recurrence, query, UI đều import từ đây (single source of truth).
Pomodoro **không** nằm trong `storage.sync` (đồng hồ đổi liên tục + thuộc một máy). Riêng R-20:
`taskId` (việc đang gắn) và `interruptions` (số lần đổi việc trong phiên) là **local-only** — không đổi
schema sync, không thêm key/ngày, không ghi `StudyLog`, không sync thiết bị. Chi tiết bảng field:
[`ERD.md`](ERD.md) §2.7. R-21 thêm key `sync` thứ năm `dayPlan` (`{ [dayKey YYYY-MM-DD local]:
{ frogTaskId } }`) — **khác** `PomodoroState` local ở area, mục đích và vòng đời; hydrate qua
`onChanged` như `t:<id>`. Chi tiết: [`ERD.md`](ERD.md) §2.8.

## 2. Chrome extension APIs sử dụng

Manifest chỉ khai `permissions: ["storage", "alarms", "notifications"]`
(`wxt.config.ts`; R-17). **Không** `host_permissions`, **không** content script.
Justification từng quyền cho Chrome Web Store: xem [`PERMISSION.md`](PERMISSION.md).

### 2.1 `chrome.storage.sync`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `sync.get(keys, cb)` | `adapter.ts:38` (`storageGet`) | Đọc task/settings/môn/nhật ký/`dayPlan`; `null` = đọc tất cả |
| `sync.set(items, cb)` | `adapter.ts:53` (`storageSet`) | Ghi 1 key/task, `settings`, `subjects`, `studyLog` hoặc `dayPlan` (1 key, R-21) |
| `sync.remove(keys, cb)` | `adapter.ts:66` (`storageRemove`) | Xoá key `t:<id>` |
| `onChanged.addListener` | `adapter.ts:176`, `background.ts:119` | Nhận thay đổi từ thiết bị khác (R-13) |
| `sync.getBytesInUse` | `components/SettingsPanel.tsx:34` | Hiển thị dung lượng đã dùng |

Mọi lời gọi đều kiểm tra `chrome.runtime.lastError` và reject Promise khi lỗi
(`adapter.ts:40-48`) — **không nuốt lỗi** (R-16).

### 2.2 `chrome.alarms`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `alarms.create(name, {delayInMinutes})` | `scheduler.ts:45,68` | Đặt nhắc việc tên `due:<id>` |
| `alarms.clear(name)` | `scheduler.ts:38,54,63,73` | Xoá alarm khi done/xoá/quá hạn |
| `alarms.getAll(cb)` | `scheduler.ts:50` | Dọn alarm mồ côi (task không còn) |
| `alarms.onAlarm.addListener` | `background.ts:92` | Alarm fire → hiện notification |

Alarm bền hơn `setTimeout` trong service worker MV3 (SW bị kill giữa chừng) — `scheduler.ts:4`.

### 2.3 `chrome.notifications`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `notifications.create(id, opts)` | `background.ts:32-39` (`notifyTask`) | Title = tên task (`taskTitle`). Message = note rút gọn ≤60 ký tự (`notePreview`, dòng 24-29) **hoặc** — chỉ khi task không có note — `Đến hạn rồi con ơi: <dueAt>` (dòng 37). Không bao giờ ghép cả hai |

Notification **không** tự đổi trạng thái task (R-12). `iconUrl: chrome.runtime.getURL('icon/48.png')`
(`background.ts:35`) — icon 16/32/48/128 nằm trong `public/icon/`, manifest khai `icons`
(gap G5 đã đóng 2026-11-11, guard test `src/__tests__/notification-icon.test.ts`).

Background chỉ gọi `notifications.create` khi `shouldNotify(task, settings)` (`lib/notifications.ts`):
`task.done === false`, có `dueAt`, và `settings.notificationsEnabled !== false`.
Settings có toggle "Bật nhắc việc" + đọc quyền thật qua `notifications.getPermissionLevel`.

### 2.4 `chrome.runtime`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `runtime.onInstalled` | `background.ts:108` | Resync toàn bộ alarm khi cài + áp `displayMode` |
| `runtime.onStartup` | `background.ts:113` | Resync alarm khi Chrome khởi động + áp `displayMode` |
| `runtime.lastError` | `adapter.ts` | Phát hiện lỗi storage/quota |
| `runtime.getURL` | `background.ts:35,80` | Đường dẫn icon notification và trang `newtab.html` |
| `action.setPopup` | `background.ts:57` (`applyDisplayMode`) | `displayMode=popup\|auto` → gắn `popup.html`; `newtab` → gỡ popup để `action.onClicked` chạy |
| `action.onClicked` | `background.ts:87` | Chỉ fire khi popup đã gỡ → mở/focus tab Học Đường |
| `tabs.create` / `tabs.update` | `background.ts:74,80` | Mở bảng lớn hoặc focus lại tab đã nhớ trong `storage.session` (`lib/storage/local.ts`) |

### 2.5 `chrome.storage.local` (R-20 — Pomodoro)

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `local.get([POMODORO_KEY], cb)` | `lib/storage/local.ts:22-31` (`loadPomodoro`) | Hydrate `PomodoroState` (gồm `taskId`, `interruptions`, `focusSessionId`) lúc mount |
| `local.get([FOCUS_CLAIM_KEY], cb)` / `local.set` | `lib/storage/local.ts:50-86` (`claimFocusCompletion`) | G10 — đọc/ghi tập sessionId đã tiêu thụ, chặn double-focus |
| `local.set({ [POMODORO_KEY]: state }, cb)` | `lib/storage/local.ts:33-38` (`savePomodoro`) | Ghi khi **đổi trạng thái** — không ghi mỗi nhịp đếm (giới hạn 120 write/phút) |
| `local.onChanged.addListener` | `hooks/usePomodoro.ts:81-93` | Popup và New Tab hydrate lại phiên khi surface kia ghi (local change chỉ có 1 đối số `changes`) |

`storage.session` (`boardTabId`, `lib/storage/local.ts:40-48`) vẫn chỉ để focus tab bảng đang mở.
**Không thêm permission**: `local` / `session` đã nằm trong quyền `"storage"` (R-17). Không network.

## 3. Internal module interfaces

### 3.1 Storage adapter — `lib/storage/adapter.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `loadAll` | `() => Promise<Task[]>` | Đọc mọi key `t:*` → mảng Task; chuẩn hoá in-memory `dueAt`/`prevDueAt` về wall-clock local qua `normalizeDueAt` — **không ghi lại** (`adapter.ts:84-109`) |
| `put` | `(task: Task) => Promise<void>` | Ghi `t:<id>`; chặn item > 8192 bytes (`MAX_ITEM_BYTES`, dòng 22) |
| `remove` | `(id: string) => Promise<void>` | Xoá `t:<id>` |
| `normalizeSettings` | `(raw: unknown) => Settings` | Gộp bản đã lưu với `DEFAULT_SETTINGS`; chỉ nhận field có cùng `typeof` với mặc định, field lạ của schema cũ (vd `theme`) bị bỏ (`adapter.ts:144-154`) |
| `loadSettings` | `() => Promise<Settings \| null>` | Đọc `settings` → `normalizeSettings`; chưa có key → `null` |
| `putSettings` | `(s: Settings) => Promise<void>` | Ghi `settings` |
| `loadSubjects` | `() => Promise<Subject[]>` | Đọc `subjects`; không phải mảng → `[]` (`adapter.ts:198`) |
| `putSubjects` | `(subjects: Subject[]) => Promise<void>` | Ghi nguyên cả danh sách môn (1 key nhỏ, không tách per-item) |
| `STUDY_LOG_DAYS` | `const = 60` | Số ngày nhật ký học được giữ (`adapter.ts:216`) |
| `loadStudyLog` | `() => Promise<StudyLog>` | Đọc `studyLog`; rỗng/không hợp lệ → `{}` (`adapter.ts:218`) |
| `putStudyLog` | `(log: StudyLog) => Promise<void>` | Prune trước khi ghi: sort key ngày rồi `slice(-60)` (`adapter.ts:225-237`) |
| `DAY_PLAN_DAYS` | `const = 14` (R-21) | Số ngày `dayPlan` được giữ (`adapter.ts:242`) |
| `loadDayPlan` | `() => Promise<DayPlan>` | Đọc 1 key `dayPlan`; rỗng/không phải object → `{}` (`adapter.ts:244-248`) |
| `putDayPlan` | `(plan: DayPlan) => Promise<void>` | Sort key rồi `slice(-14)` prune, ghi **đúng 1 key** `dayPlan` — không key/ngày; bọc lỗi quota thành `StorageQuotaError` (`adapter.ts:250-264`) |
| `subscribe` | `(cb: (changedKeys: string[]) => void) => () => void` | Đăng ký `onChanged` mọi key (gồm `dayPlan`), trả về unsubscribe |

**Error contract:** `StorageQuotaError` (`adapter.ts:25`) ném khi vượt quota — phát hiện qua
chuỗi lỗi chứa `QUOTA_BYTES`/`quota` (`isQuotaError`, dòng 32). Các hàm ghi (`put`, `putSettings`,
`putSubjects`, `putStudyLog`, `putDayPlan`) và các hàm đọc task/settings đều bọc lỗi thành `StorageQuotaError`
khi khớp mẫu quota; `loadSubjects`/`loadStudyLog` gọi thẳng `storageGet` nên lỗi lên UI là `Error`
thường (không bọc quota). UI hiển thị banner, không swallow (R-16).

### 3.2 Recurrence — `lib/tasks/recurrence.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `recurrenceForKind` | `(kind: RecurrenceRule['kind'], dueAt?: string \| null) => RecurrenceRule` | Dựng rule đầy đủ từ kind; weekly/monthly lấy thứ/ngày từ `dueAt`, thiếu thì hôm nay (`recurrence.ts:22-38`) |
| `nextDueAt` | `(prevDue: string \| Date, rule: RecurrenceRule) => string \| null` | Lần kế tiếp dạng wall-clock local `YYYY-MM-DDTHH:mm`, **không `Z`**; `none` → null. Weekly: chọn **offset nhỏ nhất 1..7** để rơi vào một thứ trong `rule.weekdays` (không phải luôn +7); `weekdays` rỗng/thiếu/không phải array → fallback +7 ngày (`recurrence.ts:88-102,125-131`) |
| `nextFutureDue` | `(prevDue, rule, now?) => string \| null` | Catch-up: lặp tới khi > now, tối đa 1000 vòng (`MAX_ITERATIONS`, dòng 16) rồi ném lỗi |

Wall-clock tính theo **múi giờ local thiết bị** — `localParts`/`makeLocal` (`recurrence.ts:51-75`, R-10),
giá trị trả về dựng bằng `formatLocalInput()` (`lib/datetime.ts`) nên cùng một dạng với hạn người dùng
nhập `YYYY-MM-DDTHH:mm` không `Z` → gap **G6 đã đóng** (Gói 0, spec 1.2.1). `nextFutureDue` parse lại
chuỗi local đó bằng `new Date()` (local) nên so sánh với `now` vẫn đúng.
Monthly clamp ngày không tồn tại về ngày cuối tháng (`daysInMonth`, dòng 78). Weekly đọc `rule.weekdays`
qua `nextWeekdayOffset` (`recurrence.ts:88-102`): weekday tính trên **ngày local** (`new Date(y, m, date + d).getDay()`)
nên qua ranh giới tháng/năm vẫn đúng → gap **G3 đã đóng** (Gói 0, spec 1.2.1). `recurrenceForKind` vẫn chỉ
lưu 1 thứ (`weekdays: [weekday của dueAt]`) vì UI chưa có chỗ chọn nhiều thứ (Gói D).

### 3.3 Query — `lib/tasks/query.ts` (pure functions)

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `filterByBoard` | `(tasks, tab: BoardTab, now: Date) => Task[]` | `all` = mọi việc; `today` = chưa xong và (hạn cùng **ngày local** hôm nay **hoặc** đã quá hạn); `upcoming` = chưa xong, hạn > now và không phải hôm nay; `done` = `done === true` (`query.ts:127-147`). **R-21: mọi nhánh đều loại `archived`** (`notArchived`, `query.ts:17-21`) |
| `filterBySubject` | `(tasks, subjectId: string) => Task[]` | `'all'` = mọi môn, `'none'` = việc chưa có `subjectId`, còn lại khớp `subjectId` (`query.ts:149-155`); R-21: cũng loại `archived` |
| `sortBoard` | `(tasks, key: SortKey, now: Date) => Task[]` | `deadline` = `sortTasks`; `priority` = ưu tiên desc → dueAt asc (không hạn xếp cuối) → createdAt desc → **id** (tie-breaker); `created` = createdAt desc → **id** (`query.ts:168-190`) |
| `sortTasks` | `(tasks, now?) => Task[]` | overdue → dueAt asc → priority desc → createdAt desc → id (tie-breaker) (`query.ts:63-103`) |
| `searchTasks` | `(tasks, query: string) => Task[]` | Khớp title/note/tag, case-insensitive (`query.ts:31-40`); R-21: bỏ qua `archived` |
| `isRecurringDoneToday` | `(task, now) => boolean` | Việc lặp, chưa `done`, `lastDoneAt` cùng **ngày local** hôm nay → trạng thái "đã làm hôm nay" (`query.ts:117-125`) |
| `dueTodayCount` | `(tasks, now) => number` | `filterByBoard(..., 'today')` length — dùng cho chiếu chỉ + lời chào (`query.ts:192-194`) |
| `overdueCount` | `(tasks, now) => number` | Đếm task chưa xong **chưa cắt** có `dueAt < now` (`query.ts:196-198`) |
| `filterByKeystone` | `(tasks) => Task[]` | R-21 — chip "20%": thuần `keystone && !archived`, **không** đổi `SortKey` (`query.ts:156-158`) |
| `activeCount` | `(tasks) => number` | R-21 — số việc đang chờ dùng chung: `!archived && !done` (`query.ts:200-203`) |
| `todayKeystoneSummary` | `(tasks, now) => { done: number; total: number }` | R-21 — dòng "Then chốt: x/y xong" (ngày local). `done` = then chốt xong hôm nay; `total` = xong hôm nay **hoặc** đang mở. Nguồn "xong": `doneAt()` (`query.ts:23-28`) (`lib/tasks/query.ts:205-220`) |
| `weeklySummary` | `(tasks, dayPlan, now) => { keystoneDone, keystoneTotal, tasksDone }` | R-21 — cửa sổ **Thứ 2 local → hiện tại** (`startOfWeekLocal`, `lib/datetime.ts`); mọi con số suy từ `Task` + `dayPlan` (tham số contract, Gói B mở rộng sau), **KHÔNG đọc aggregate `studyLog`/`board.doneToday`**, không điểm số (`query.ts:222-254`) |

`doneAt(task)` (`query.ts:23-28`) là nguồn "đã xong" thống nhất của hai hàm summary:
`lastDoneAt ?? (done ? updatedAt : null)` — ưu tiên dấu done-today của việc lặp (dù `done=false`),
rồi `updatedAt` khi `done=true`. Khác với `isRecurringDoneToday` (so **ngày local**), summary tuần
so **khoảng thời gian** `[thứ 2 00:00 local, now]` trên cùng mốc `lastDoneAt`/`updatedAt`.

Sort precedence deterministic (R-15) — `sortTasks`, dòng 63-103. Task không `dueAt` xếp cuối.
UI dùng `sortBoard` với tiêu chí người dùng chọn (`deadline` mặc định, `priority`, `created`) ở
`components/FilterRow.tsx`; tab Đã xong cũng đi qua `sortBoard` nên **không** tự sort `updatedAt`.
Cả 3 tiêu chí của `sortBoard` kết thúc bằng tie-breaker `id` (chuỗi) — `compareById`, dòng 162-166 —
nên kết quả không phụ thuộc thứ tự key trong storage (gap **G8 đã đóng**, Gói 0).
`SortCriterion` (`query.ts:15`) là dead export duy nhất còn lại của bản tab 3 lựa chọn — **không** nơi
nào import; `filterTasks` và `Tab` đã bị xoá khỏi code (không còn tồn tại). Giữ `SortCriterion` chờ dọn
vào lần chạm `query.ts` kế tiếp (G4 đã đóng: user chọn được tiêu chí sort).

### 3.4 Alarm scheduler — `lib/alarms/scheduler.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `alarmName` | `(id) => string` | `due:<id>` |
| `taskIdFromAlarm` | `(name) => string \| null` | Trích id từ tên alarm |
| `syncAlarms` | `(tasks, now?) => void` | Đồng bộ toàn bộ alarm + dọn mồ côi; **R-21: task `archived` bị clear alarm** (`scheduler.ts:34-61`) |
| `scheduleTask` | `(task, now?) => void` | Tạo/cập nhật alarm 1 task (`scheduler.ts:63-72`) |
| `clearTaskAlarm` | `(id) => void` | Xoá alarm 1 task (`scheduler.ts:74`) |

Điều kiện tạo alarm (R-12 + R-21): `!done && !archived && dueAt > now` (`shouldCreateAlarm`,
`scheduler.ts:26-31`). `dueAt ≤ now` → không tạo (Chrome fire ngay), task hiển thị quá hạn (R-12);
**task đã cắt bỏ (`archived=true`) → không tạo và alarm cũ bị xoá**, dù vẫn nằm trong storage.
`useTasks.update` gọi `syncAlarms` **chỉ khi** cờ `archived` đổi (`hooks/useTasks.ts:223-239`):
cắt bỏ → clear, phục hồi (`archived=false`) → re-arm nếu `dueAt` còn > now — edit thường không đụng
alarm (tránh write churn). `shouldNotify` (`lib/notifications.ts`) vẫn chỉ gate `done`/`dueAt`/
`notificationsEnabled`, nên việc đã cắt **không thể fire notification vì không còn alarm để fire**.

### 3.5 Popup state — `hooks/useTasks.ts`

`useTasks()` → `{ tasks, dayPlan, add, create, update, remove, toggle, restore, selectFrog, loading }`
qua `useSyncExternalStore` trên adapter (`hooks/useTasks.ts:182-183`, return `:359-370`).
`dayPlan` là snapshot thứ hai, hydrate cùng lúc với `tasks` để một lần render thấy cả hai.

- `add`: quick-add chỉ title → `create(defaultDraft(title))`.
- `create`: validate title 1–200 trim, `id = crypto.randomUUID()`, mặc định `priority=medium`,
  `done=false`, `tags=[]`, `subtasks=[]`, `subjectId=null`, `recurrence={kind:'none'}`,
  `createdAt=updatedAt=now`; ghi 1 key rồi `syncAlarms`.
- `update`: `updatedAt = now` → `put` → thay bản ghi trong snapshot.
- `restore`: đưa task đã xoá trở lại (undo), giữ nguyên `id`/`createdAt`; có thì thay, chưa có thì thêm.
- `selectFrog(dayKey, taskId | null)` (R-21): ghi `{ frogTaskId: taskId }` vào `dayPlan[dayKey]` qua
  `putDayPlan` (1 key, prune 14 ngày), cập nhật cache đã prune rồi `notify()` (`hooks/useTasks.ts:256-271`).
  Cùng ngày → thay thế; sang ngày khác entry cũ tự hết hiệu lực (consumer đọc theo `dayKey` hôm nay).
  Đây là cổng ghi duy nhất của con ếch — **không** đụng `PomodoroState.taskId` local của R-20.
- `update` (R-21): cờ `archived` là flag client-side — set `true` = "Cắt bỏ" (giữ dữ liệu, clear alarm),
  set lại `false` = phục hồi từ mục "Đã cắt" (re-arm alarm). `syncAlarms` chỉ chạy khi cờ đổi
  (`hooks/useTasks.ts:223-239`) — khác với `restore` ở trên (undo xoá vĩnh viễn).
- `toggle` có **4 nhánh** (`hooks/useTasks.ts:273-339`):
  1. **done-today** (`isRecurringDoneToday`) → Hoàn tác hôm nay: `done=false`, `dueAt = prevDueAt ?? dueAt`,
     `prevDueAt=null`, `lastDoneAt=null`, clear rồi reschedule alarm theo hạn cũ — **không** cuộn thêm lần nữa.
  2. **task đang done** → `done=false`, `lastDoneAt=null`, `prevDueAt=null`, giữ `dueAt`, reschedule.
  3. **task thường** (`recurrence.kind === 'none'`) → `done=true`, `lastDoneAt=stamp`, `prevDueAt=null`, clear alarm.
  4. **task lặp** → `nextFutureDue(dueAt ?? stamp, rule, now)`; nếu null thì `done=true` + clear alarm,
     ngược lại `done=false`, `dueAt=nextDue`, `prevDueAt=dueAt cũ`, `lastDoneAt=stamp`, tạo alarm mới (R-11).
- `onChanged`: **đọc lại toàn bộ** task từ storage (`loadAll`) rồi thay snapshot — **không** merge từng bản ghi
  theo `updatedAt`; mỗi key `t:<id>` đổi → còn task thì `scheduleTask`, mất task thì `clearTaskAlarm`;
  `settings` đổi → `syncAlarms` lại toàn bộ (`hooks/useTasks.ts:125-156`) → gap G7;
  `dayPlan` đổi → `loadDayPlan()` hydrate snapshot ếch (`hooks/useTasks.ts:127-133`, R-21).
- Không autosave từng keystroke (giới hạn 120 write/phút) — chỉ ghi khi Lưu / toggle.

### 3.6 Pomodoro & focus — `hooks/usePomodoro.ts`, `hooks/useBoard.ts` (R-20)

`usePomodoro({ preset, soundEnabled, onFocusComplete: (sessionId: string) => void })` trả `PomodoroApi`
(`hooks/usePomodoro.ts:45-75,196-210`) — G10 đổi chữ ký callback để mang id phiên:

| Thành viên | Kiểu | Hành vi |
|---|---|---|
| `phase`, `running`, `remaining`, `progress` | derived | Nhịp đếm 250ms chỉ chạy khi `running` (`:121-137`); `endsAt` về 0 → `advance('natural')` |
| `taskId` | `string \| null` | Việc đang gắn, đọc từ `PomodoroState` local |
| `focusSessionId` | `string \| null` | G10: id phiên focus, sinh mới mỗi `start()` focus (`:155-163`); `null` sau advance/reset. Consumer dùng làm idempotency key |
| `interruptions` | `number` | Chỉ đọc: `state.interruptions ?? 0` (`:188`) |
| `attach(taskId \| null)` | `(id) => void` | Gắn / huỷ gắn việc; `commit` ghi `chrome.storage.local` (`:173-176`) |
| `noteInterruption()` | `() => void` | `interruptions = (current ?? 0) + 1` (`:178-180`); chỉ gọi sau khi user xác nhận đổi việc |
| `start()` / `pause()` | `() => void` | Đặt `endsAt` / lưu `remaining` rồi `endsAt = null` (`:150-158`) |
| `skip()` | `() => void` | `advance(state, 'skip')` (`:160`) — **không** gọi completion |
| `reset()` | `() => void` | Dừng, nạp lại thời lượng, xoá `interruptions` thành `undefined` (`:162-171`) |

`advance(from, reason: 'natural' | 'skip')` (`:100-119`) là điểm phân luồng: **chỉ** khi
`reason === 'natural' && from.phase === 'focus'` mới gọi `onFocusComplete(sessionId)` (`:117-121`);
sessionId lấy từ `from.focusSessionId` hoặc fallback `legacy:${endsAt}` cho state cũ. Mọi nhánh khác
(kể cả skip) chỉ đổi phase/endsAt. Khi rời focus, `taskId` bị clear, `focusSessionId` về `undefined`
và `interruptions` về `0` nếu sang focus mới, hoặc bị xoá nếu sang nghỉ (`:113-128`).

`useBoard()` (`hooks/useBoard.ts:32-286`) bọc `usePomodoro` để **hoãn completion**; R-21: cũng lấy
`dayPlan`/`selectFrog` từ `useTasks` (`hooks/useBoard.ts:35,41`) rồi **expose nguyên vẹn** lại cho UI
(`hooks/useBoard.ts:254,282`) — New Tab đọc `board.dayPlan[dayKey].frogTaskId` và gọi `board.selectFrog`
qua `TaskScroll`; popup dùng chung qua `SettingsPanel`. Ngoài ra `useBoard` còn expose `activeCount`
(đã loại `archived`) thay cho bộ đếm tự tính ở UI. Cơ chế hoãn completion:

- `onFocusComplete` (`:75-91`) — có việc gắn (đọc qua `focusTaskIdRef`, cập nhật trong render `:104`) thì
  **không** ghi ngay mà đặt `pendingCompletion = { taskId, interruptions, sessionId }`; không có việc gắn →
  `runOncePerFocusSession(sessionId, recordFocus)` (`:68-71`). Ref được cập nhật trong render vì hook clear
  `taskId` ngay sau callback (`:103-106`).
- `claimFocusCompletion(sessionId)` / `runOncePerFocusSession(sessionId, work)` (`lib/storage/local.ts:50-86`) —
  Set trong context + tập `focusCompletionClaim` (tối đa 32 id) ở local; chỉ chạy `work` nếu phiên chưa được
  tiêu thụ. Chặn cả double-confirm cùng page lẫn stale dialog của phiên cũ sau phiên mới.
- `pendingCompletion` / `confirmFocusCompletion()` (`:165-176`) — xác nhận "Xong việc này chưa?" →
  `runOncePerFocusSession(sessionId, () => { toggleTask(taskId); recordFocus(); })`. Với session đã tiêu thụ,
  **không** tick task, **không** ghi focus. Residual: race 2 context cùng tick tuyệt đối (không có CAS trong
  `chrome.storage.local`) — xem `docs/ERD.md` §2.7.
- `declineFocusCompletion()` (`:144`) — "Chưa xong" → xoá pending, **không** tick, **không** ghi focus.
- `startFocusOn(id)` (`:146-160`) — `attach(id)` rồi effect chờ render thấy `taskId` mới mới gọi `start()`.
- `switchTaskMidSession(id)` (`:162-177`) — `attach(id)` rồi effect gọi `noteInterruption()` ở render sau
  (comment `:162-163`: hai `commit` trong cùng closure ghi đè nếu gọi chung một render). UI gọi qua
  `components/FocusConfirms.tsx` và `handleInterrupt` ở hai entrypoint.
- `toggleTask(id)` (`:110-133`) — tick việc, ghi `record('tasks', ±1)`; khi `focusActive` và `id` khác
  việc đang gắn, New Tab chặn ở `handleToggle` (`entrypoints/newtab/App.tsx:160-166`) để hiện xác nhận
  trước.

**"Kết thúc" vs "Bỏ qua" (điểm dễ nhầm):** nút **"Kết thúc"** trong focus overlay gọi `api.reset`
(`components/FocusTimer.tsx:99-107`) — bỏ phiên, không sang giờ nghỉ, không ghi focus; nút **"Bỏ qua"**
ở bản đầy gọi `api.skip` (`:169-174`) — chuyển sang giờ nghỉ nhưng cũng **không** ghi focus. Cả hai đều
khác completion tự nhiên có xác nhận — nơi duy nhất gọi `record('focus', 1)`.

## 4. Sync & conflict resolution (R-13)

| Sự kiện `storage.onChanged` (area `sync`) | Xử lý |
|---|---|
| Key `t:<id>` thay đổi | UI (`useTasks`): **reload toàn bộ** task rồi thay snapshot, không merge từng bản ghi; còn task → `scheduleTask`, key bị xoá → `clearTaskAlarm` (`hooks/useTasks.ts:125-156`). Background: reschedule/clear alarm theo đúng key đó (`background.ts:119-140`) |
| Key `t:<id>` bị xoá (`newValue` undefined/null) | Xoá task local + `alarms.clear('due:<id>')` (`background.ts:129-131`) |
| Key `settings` thay đổi | `useTasks` → `syncAlarms` toàn bộ (`hooks/useTasks.ts:150-154`); background → `applyDisplayMode` (gắn/gỡ `popup.html`) qua `chrome.action.setPopup` (`background.ts:123-125`) — **không** áp theme (sản phẩm chỉ có tông sáng) |
| Key `dayPlan` thay đổi (R-21) | `useTasks` → `loadDayPlan()` hydrate snapshot ếch (`hooks/useTasks.ts:127-133`); background **không** xử lý riêng (không sinh alarm từ ếch). Ghép chung một lần render với `tasks` |
| Key `subjects` / `studyLog` | Không có xử lý riêng ở background; `useBoard` đọc lại qua `useSubjects`/`useStudyLog` khi storage đổi |

Intent R-13 vẫn là last-write-wins theo `updatedAt` cho từng bản ghi; code hiện **không** so `updatedAt`
khi sync → ghi nhận là gap G7, không hạ cấp intent.

## 5. Spec ↔ Code gaps (ghi nhận, KHÔNG tự sửa intent)

> Theo `AGENTS.md`: code ≠ intent → ghi gap, không hạ cấp intent cho khớp code.
> Các gap dưới đây cần xử lý qua `/change` nếu muốn đổi behavior.

| ID | Spec (`SPECIFICATIONS.md`) | Code thực tế | Ảnh hưởng |
|---|---|---|---|
| G1 | R-09: `dueAt` là **epoch ms** | `types.ts:45`: `dueAt: string \| null`; spec 1.2.0 đã sửa R-09 sang ISO 8601 local | ✅ Đã đóng (spec 1.2.0). Dạng UTC sau khi lặp tách riêng thành G6 |
| G2 | `settings = { theme }` | `types.ts:76-86`: 8 field (`notificationsEnabled`, `displayMode`, `quillStyle`, `quillEffect`, `ornaments`, `lacquerSheen`, `pomodoroPreset`, `soundEnabled`); spec 1.2.0 đã mô tả đúng; `normalizeSettings` bỏ field `theme` cũ khi đọc | ✅ Đã đóng (spec 1.2.0) |
| G3 | R-10: weekly **chọn các thứ** (`weekdays`) | `recurrence.ts:125-131` weekly dùng `nextWeekdayOffset` (`recurrence.ts:88-102`): offset nhỏ nhất 1..7 tới một thứ trong `weekdays`, giữ `HH:mm`; `weekdays` rỗng/thiếu/không phải array → +7 ngày; `recurrenceForKind` vẫn lưu 1 thứ lấy từ `dueAt` (dòng 31-33, UI chưa chọn nhiều thứ) | ✅ Đã đóng 2026-11-17 (Gói 0, spec 1.2.1) — test `src/__tests__/recurrence.test.ts` (T2/T4/T6 qua nhiều tuần, ranh giới tháng, catch-up, fallback rỗng + giá trị lạ) |
| G4 | R-15: user chọn tiêu chí sort (`dueAt\|priority\|createdAt`) | `query.ts:88-89`: `SortKey = 'deadline' \| 'priority' \| 'created'` + `sortBoard`; UI `FilterRow` cho chọn qua menu "Sắp xếp" | ✅ Đã đóng phần **chọn được tiêu chí**. Tie-breaker **không đồng nhất giữa 3 tiêu chí** → xem **G8**; `SortCriterion='default'` còn là dead export (không nơi nào import) |
| G5 | R-12 notification có icon | ~~`background.ts:33` tham chiếu `icons/icon-48.png` **không tồn tại**; manifest chưa khai `icons`~~ → đã fix: `chrome.runtime.getURL('icon/48.png')`, `public/icon/{16,32,48,128}.png`, manifest `icons` | ✅ Đã đóng 2026-11-11 (phase-2-task-03) |
| G6 | R-09/R-10: `dueAt` là ISO 8601 **local** (một dạng duy nhất) | `lib/datetime.ts:92/109` `formatLocalInput` + `normalizeDueAt`; `recurrence.ts:75-111` trả wall-clock local không `Z`; `adapter.ts:84-91` normalize in-memory khi đọc | ✅ Đã đóng 2026-11-17 (Gói 0, spec 1.2.1) — một dạng chuỗi duy nhất; task cũ dạng `Z` được quy về local khi đọc, không ghi lại. Xem [`ERD.md`](ERD.md) §2.1 |
| G7 | R-13: sync **last-write-wins theo `updatedAt`** từng bản ghi | `hooks/useTasks.ts:125-156`: `onChanged` → `loadAll()` reload toàn bộ rồi thay snapshot, không so `updatedAt`; background reschedule theo key | **Mở** — trên 2 thiết bị, thay đổi sau ghi đè trước ở tầng storage nên kết quả vẫn "bản mới nhất thắng" theo Chrome, nhưng UI không tự phân xử merge; intent merge vẫn giữ, code chưa implement |
| G8 | R-15: tie-breaker "luôn theo thứ tự trên" để kết quả **deterministic** | `query.ts:168-190` `sortBoard`: `deadline` → `sortTasks` = overdue → `dueAt` → priority → `createdAt` → id; `priority` → priority desc → `dueAt` asc → `createdAt` desc → id; `created` → `createdAt` desc → id | ✅ Đã đóng 2026-11-17 (Gói 0) — mọi tiêu chí đều có tie-breaker `id` (chuỗi) nên hai lần chạy / hai thứ tự key storage cho cùng kết quả. Test `src/__tests__/query.test.ts`. Ghi chú: `priority` vẫn dùng chuỗi riêng **có chủ đích** (người dùng chọn "Ưu tiên" thì ưu tiên đứng trước hạn), không phải chuỗi `deadline` |
| G9 | R-19: trải nghiệm Sơn Mài có chủ đích — responsive 1024–1199, menu môn không che chân popup, affordance dải tab, motion | `docs/DESIGN.md` §Known Gaps ghi rõ các mục **chưa verify/chưa đạt**: 1024–1199px dùng **2 cột** (`entrypoints/newtab/style.css:112-120`) chứ không phải ba vùng; `.menu` không lật lên (`components/ui/Menu.tsx:95`, `styles/components.css:500-501`); chưa đo trên 360/390/1024 thật | **Mở (R-19)** — đang xử lý trong FEAT-002 (`son-mai-experience-polish`); chỉ đóng khi đo browser thật + menu không che chân popup. Xem `docs/ROADMAP_TIME_MANAGEMENT.md` §8 |

> Gap còn **mở**: G7 (merge theo `updatedAt`) và G9 (responsive Sơn Mài). G3/G6/G8 đã đóng.
> Gap đã đóng được `doc-reconcile` ghi nhận, **không** hạ intent: đóng bằng code qua `/change`
> rồi `/spec-publish`, không sửa `SPECIFICATIONS.md` cho khớp code.

## 6. Versioning

Contract dữ liệu gắn với `spec_version` trong `SPECIFICATIONS.md` (hiện **`1.4.0`** — khớp frontmatter
`SPECIFICATIONS.md`; **scopeVersion 25**). R-20 chỉ thêm field local `PomodoroState.taskId` /
`interruptions`, **không** đổi schema sync. R-21 (spec 1.4.0) thêm `Task.keystone?` / `Task.archived?`
(flag client-side, mặc định `false`) và **một** key sync `dayPlan` (`DayPlan`, prune 14 ngày,
`DAY_PLAN_DAYS = 14`, 8192 B/item) — vẫn không đổi permission (R-17), không network. Đổi schema
`Task`/`Settings` → bump version + migration dữ liệu cũ qua `/change` + `/spec-publish`.
Xem [`SPEC_VERSIONING.md`](SPEC_VERSIONING.md).

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
| `t:<uuid>` | `sync` | `Task` (1 key/task, ghi atomic theo key) | `lib/tasks/types.ts:118` (`TASK_KEY_PREFIX`) |
| `settings` | `sync` | `Settings` | `lib/tasks/types.ts:119` (`SETTINGS_KEY`) |
| `subjects` | `sync` | `Subject[]` | `lib/tasks/types.ts:120` (`SUBJECTS_KEY`) |
| `studyLog` | `sync` | `StudyLog` (prune 60 ngày) | `lib/tasks/types.ts:121` (`STUDY_LOG_KEY`) |
| `pomodoro` | **`local`** | `PomodoroState` | `lib/tasks/types.ts:122`, `lib/storage/local.ts` |

Kiểu `Task`, `Settings`, `Subtask`, `RecurrenceRule`, `Subject`, `StudyLog`, `PomodoroState` định nghĩa
duy nhất tại `lib/tasks/types.ts` — adapter, recurrence, query, UI đều import từ đây (single source of truth).
Pomodoro **không** nằm trong `storage.sync` (đồng hồ đổi liên tục + thuộc một máy). Chi tiết bảng field:
[`ERD.md`](ERD.md) §2.

## 2. Chrome extension APIs sử dụng

Manifest chỉ khai `permissions: ["storage", "alarms", "notifications"]`
(`wxt.config.ts`; R-17). **Không** `host_permissions`, **không** content script.
Justification từng quyền cho Chrome Web Store: xem [`PERMISSION.md`](PERMISSION.md).

### 2.1 `chrome.storage.sync`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `sync.get(keys, cb)` | `adapter.ts:40` (`storageGet`) | Đọc task/settings/môn/nhật ký; `null` = đọc tất cả |
| `sync.set(items, cb)` | `adapter.ts:53` (`storageSet`) | Ghi 1 key/task, `settings`, `subjects` hoặc `studyLog` |
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
| `notifications.create(id, opts)` | `background.ts:32` (`notifyTask`) | Hiện nhắc việc: title task + note rút gọn (≤60 ký tự) + hạn |

Notification **không** tự đổi trạng thái task (R-12). `iconUrl: chrome.runtime.getURL('icon/48.png')`
(`background.ts:35`) — icon 16/48/128 nằm trong `public/icon/`, manifest khai `icons`
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

## 3. Internal module interfaces

### 3.1 Storage adapter — `lib/storage/adapter.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `loadAll` | `() => Promise<Task[]>` | Đọc mọi key `t:*` → mảng Task (`adapter.ts:78`) |
| `put` | `(task: Task) => Promise<void>` | Ghi `t:<id>`; chặn item > 8192 bytes (`MAX_ITEM_BYTES`, dòng 21) |
| `remove` | `(id: string) => Promise<void>` | Xoá `t:<id>` |
| `normalizeSettings` | `(raw: unknown) => Settings` | Gộp bản đã lưu với `DEFAULT_SETTINGS`; chỉ nhận field có cùng `typeof` với mặc định, field lạ của schema cũ (vd `theme`) bị bỏ (`adapter.ts:129-139`) |
| `loadSettings` | `() => Promise<Settings \| null>` | Đọc `settings` → `normalizeSettings`; chưa có key → `null` |
| `putSettings` | `(s: Settings) => Promise<void>` | Ghi `settings` |
| `loadSubjects` | `() => Promise<Subject[]>` | Đọc `subjects`; không phải mảng → `[]` (`adapter.ts:183`) |
| `putSubjects` | `(subjects: Subject[]) => Promise<void>` | Ghi nguyên cả danh sách môn (1 key nhỏ, không tách per-item) |
| `STUDY_LOG_DAYS` | `const = 60` | Số ngày nhật ký học được giữ (`adapter.ts:201`) |
| `loadStudyLog` | `() => Promise<StudyLog>` | Đọc `studyLog`; rỗng/không hợp lệ → `{}` (`adapter.ts:203`) |
| `putStudyLog` | `(log: StudyLog) => Promise<void>` | Prune trước khi ghi: sort key ngày rồi `slice(-60)` (`adapter.ts:209-222`) |
| `subscribe` | `(cb: (changedKeys: string[]) => void) => () => void` | Đăng ký `onChanged` mọi key, trả về unsubscribe |

**Error contract:** `StorageQuotaError` (`adapter.ts:24`) ném khi vượt quota — phát hiện qua
chuỗi lỗi chứa `QUOTA_BYTES`/`quota` (`isQuotaError`, dòng 31). Các hàm ghi (`put`, `putSettings`,
`putSubjects`, `putStudyLog`) và các hàm đọc task/settings đều bọc lỗi thành `StorageQuotaError`
khi khớp mẫu quota; `loadSubjects`/`loadStudyLog` gọi thẳng `storageGet` nên lỗi lên UI là `Error`
thường (không bọc quota). UI hiển thị banner, không swallow (R-16).

### 3.2 Recurrence — `lib/tasks/recurrence.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `recurrenceForKind` | `(kind: RecurrenceRule['kind'], dueAt?: string \| null) => RecurrenceRule` | Dựng rule đầy đủ từ kind; weekly/monthly lấy thứ/ngày từ `dueAt`, thiếu thì hôm nay (`recurrence.ts:19-35`) |
| `nextDueAt` | `(prevDue: string \| Date, rule: RecurrenceRule) => string \| null` | Lần kế tiếp (`Date.toISOString()`, **UTC có `Z`**); `none` → null |
| `nextFutureDue` | `(prevDue, rule, now?) => string \| null` | Catch-up: lặp tới khi > now, tối đa 1000 vòng (`MAX_ITERATIONS`, dòng 13) rồi ném lỗi |

Wall-clock tính theo **múi giờ local thiết bị** — `localParts`/`makeLocal` (`recurrence.ts:38-61`, R-10),
nhưng giá trị trả về luôn qua `Date.toISOString()` (dòng 88, 94, 107) nên chuỗi lưu là **UTC có `Z`**.
Vì vậy `dueAt` tồn tại **hai dạng** cùng lúc: hạn người dùng đặt từ composer là local
`YYYY-MM-DDTHH:mm` không `Z` (`lib/datetime.ts`), còn occurrence do việc lặp sinh ra có `Z`. Cả hai
đều parse được bằng `new Date()` nên so sánh hạn/`sameLocalDay` vẫn đúng, nhưng chuỗi không đồng nhất
→ **gap G6** (xem [`ERD.md`](ERD.md) §2.1).
Monthly clamp ngày không tồn tại về ngày cuối tháng (`daysInMonth`, dòng 64). Weekly hiện chỉ **+7 ngày**,
không dùng `rule.weekdays` → gap G3.

### 3.3 Query — `lib/tasks/query.ts` (pure functions)

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `filterByBoard` | `(tasks, tab: BoardTab, now: Date) => Task[]` | `all` = mọi việc; `today` = chưa xong và (hạn cùng **ngày local** hôm nay **hoặc** đã quá hạn); `upcoming` = chưa xong, hạn > now và không phải hôm nay; `done` = `done === true` (`query.ts:135-153`) |
| `filterBySubject` | `(tasks, subjectId: string) => Task[]` | `'all'` = mọi môn, `'none'` = việc chưa có `subjectId`, còn lại khớp `subjectId` (`query.ts:156`) |
| `sortBoard` | `(tasks, key: SortKey, now: Date) => Task[]` | `deadline` = `sortTasks`; `priority` = ưu tiên desc → dueAt asc (không hạn xếp cuối) → createdAt desc; `created` = createdAt desc (`query.ts:162-179`) |
| `sortTasks` | `(tasks, now?) => Task[]` | overdue → dueAt asc → priority desc → createdAt desc → id (tie-breaker) |
| `searchTasks` | `(tasks, query: string) => Task[]` | Khớp title/note/tag, case-insensitive |
| `isRecurringDoneToday` | `(task, now) => boolean` | Việc lặp, chưa `done`, `lastDoneAt` cùng **ngày local** hôm nay → trạng thái "đã làm hôm nay" (`query.ts:125`) |
| `dueTodayCount` | `(tasks, now) => number` | `filterByBoard(..., 'today')` length — dùng cho chiếu chỉ + lời chào |
| `sortDoneTasks` | `(tasks) => Task[]` | Sắp updatedAt desc — helper cũ, không còn nơi nào import |

Sort precedence deterministic (R-15) — `sortTasks`, dòng 62-98. Task không `dueAt` xếp cuối.
UI dùng `sortBoard` với tiêu chí người dùng chọn (`deadline` mặc định, `priority`, `created`) ở
`components/FilterRow.tsx`; tab Đã xong cũng đi qua `sortBoard` nên **không** tự sort `updatedAt`.
`filterTasks`/`Tab`/`SortCriterion` (`query.ts:14-28`) là helper legacy của bản tab 3 lựa chọn —
**không còn dùng ở UI** và không test nào import; giữ lại chờ dọn (gap G4 đóng: user chọn được tiêu chí sort).

### 3.4 Alarm scheduler — `lib/alarms/scheduler.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `alarmName` | `(id) => string` | `due:<id>` |
| `taskIdFromAlarm` | `(name) => string \| null` | Trích id từ tên alarm |
| `syncAlarms` | `(tasks, now?) => void` | Đồng bộ toàn bộ alarm + dọn mồ côi |
| `scheduleTask` | `(task, now?) => void` | Tạo/cập nhật alarm 1 task |
| `clearTaskAlarm` | `(id) => void` | Xoá alarm 1 task |

Điều kiện tạo alarm: `!done && dueAt > now` (`shouldCreateAlarm`, dòng 25). `dueAt ≤ now` → không
tạo (Chrome fire ngay), task hiển thị overdue (R-12).

### 3.5 Popup state — `hooks/useTasks.ts`

`useTasks()` → `{ tasks, add, create, update, remove, toggle, restore, loading }` qua
`useSyncExternalStore` trên adapter (`hooks/useTasks.ts:298`).

- `add`: quick-add chỉ title → `create(defaultDraft(title))`.
- `create`: validate title 1–200 trim, `id = crypto.randomUUID()`, mặc định `priority=medium`,
  `done=false`, `tags=[]`, `subtasks=[]`, `subjectId=null`, `recurrence={kind:'none'}`,
  `createdAt=updatedAt=now`; ghi 1 key rồi `syncAlarms`.
- `update`: `updatedAt = now` → `put` → thay bản ghi trong snapshot.
- `restore`: đưa task đã xoá trở lại (undo), giữ nguyên `id`/`createdAt`; có thì thay, chưa có thì thêm.
- `toggle` có **4 nhánh** (`hooks/useTasks.ts:211-280`):
  1. **done-today** (`isRecurringDoneToday`) → Hoàn tác hôm nay: `done=false`, `dueAt = prevDueAt ?? dueAt`,
     `prevDueAt=null`, `lastDoneAt=null`, clear rồi reschedule alarm theo hạn cũ — **không** cuộn thêm lần nữa.
  2. **task đang done** → `done=false`, `lastDoneAt=null`, `prevDueAt=null`, giữ `dueAt`, reschedule.
  3. **task thường** (`recurrence.kind === 'none'`) → `done=true`, `lastDoneAt=stamp`, `prevDueAt=null`, clear alarm.
  4. **task lặp** → `nextFutureDue(dueAt ?? stamp, rule, now)`; nếu null thì `done=true` + clear alarm,
     ngược lại `done=false`, `dueAt=nextDue`, `prevDueAt=dueAt cũ`, `lastDoneAt=stamp`, tạo alarm mới (R-11).
- `onChanged`: **đọc lại toàn bộ** task từ storage (`loadAll`) rồi thay snapshot — **không** merge từng bản ghi
  theo `updatedAt`; mỗi key `t:<id>` đổi → còn task thì `scheduleTask`, mất task thì `clearTaskAlarm`;
  `settings` đổi → `syncAlarms` lại toàn bộ (`hooks/useTasks.ts:102-128`) → gap G7.
- Không autosave từng keystroke (giới hạn 120 write/phút) — chỉ ghi khi Lưu / toggle.

## 4. Sync & conflict resolution (R-13)

| Sự kiện `storage.onChanged` (area `sync`) | Xử lý |
|---|---|
| Key `t:<id>` thay đổi | UI (`useTasks`): **reload toàn bộ** task rồi thay snapshot, không merge từng bản ghi; còn task → `scheduleTask`, key bị xoá → `clearTaskAlarm` (`hooks/useTasks.ts:102-128`). Background: reschedule/clear alarm theo đúng key đó (`background.ts:119-140`) |
| Key `t:<id>` bị xoá (`newValue` undefined/null) | Xoá task local + `alarms.clear('due:<id>')` (`background.ts:129-131`) |
| Key `settings` thay đổi | `useTasks` → `syncAlarms` toàn bộ (`hooks/useTasks.ts:119-125`); background → `applyDisplayMode` (gắn/gỡ `popup.html`) qua `chrome.action.setPopup` (`background.ts:123-125`) — **không** áp theme (sản phẩm chỉ có tông sáng) |
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
| G3 | R-10: weekly **chọn các thứ** (`weekdays`) | `recurrence.ts:90-94`: weekly chỉ **+7 ngày**, không dùng `weekdays`; `recurrenceForKind` chỉ lưu đúng 1 thứ lấy từ `dueAt` (dòng 28-30) | **Mở** — weekly lặp đúng 7 ngày, bỏ qua thứ đã chọn |
| G4 | R-15: user chọn tiêu chí sort (`dueAt\|priority\|createdAt`) | `query.ts:112`: `SortKey = 'deadline' \| 'priority' \| 'created'` + `sortBoard`; UI `FilterRow` cho chọn qua menu "Sắp xếp" | ✅ Đã đóng phần **chọn được tiêu chí**. Tie-breaker **không đồng nhất giữa 3 tiêu chí** → xem **G8**; `SortCriterion='default'` còn là dead export (không nơi nào import) |
| G5 | R-12 notification có icon | ~~`background.ts:33` tham chiếu `icons/icon-48.png` **không tồn tại**; manifest chưa khai `icons`~~ → đã fix: `chrome.runtime.getURL('icon/48.png')`, `public/icon/{16,48,128}.png`, manifest `icons` | ✅ Đã đóng 2026-11-11 (phase-2-task-03) |
| G6 | R-09/R-10: `dueAt` là ISO 8601 **local** (một dạng duy nhất) | Hạn nhập tay = `YYYY-MM-DDTHH:mm` không `Z` (`lib/datetime.ts`); occurrence do `nextDueAt`/`nextFutureDue` sinh = `toISOString()` **UTC có `Z`** (`recurrence.ts:88,94,107`) | **Mở (BUG-002)** — hai dạng chuỗi cùng tồn tại; parse/so sánh ngày vẫn đúng nhưng dữ liệu không đồng nhất. Xem [`ERD.md`](ERD.md) §2.1 |
| G7 | R-13: sync **last-write-wins theo `updatedAt`** từng bản ghi | `hooks/useTasks.ts:102-128`: `onChanged` → `loadAll()` reload toàn bộ rồi thay snapshot, không so `updatedAt`; background reschedule theo key | **Mở** — trên 2 thiết bị, thay đổi sau ghi đè trước ở tầng storage nên kết quả vẫn "bản mới nhất thắng" theo Chrome, nhưng UI không tự phân xử merge; intent merge vẫn giữ, code chưa implement |
| G8 | R-15: tie-breaker "luôn theo thứ tự trên" để kết quả **deterministic** | `query.ts:162-179` `sortBoard`: `deadline` → `sortTasks` = overdue → `dueAt` → priority → `createdAt`; `priority` → priority desc → `dueAt` asc → `createdAt` desc; `created` → **chỉ** `createdAt` desc, không tie-breaker phụ | **Mở (R-15)** — chuỗi "overdue → dueAt → priority → createdAt" chỉ đúng cho `deadline`; `priority` dùng chuỗi khác; `created` không có tie-breaker nên thứ tự task trùng `createdAt` phụ thuộc thứ tự key của storage (khác nhau giữa thiết bị). Đóng bằng `/change` (chuẩn hoá `sortBoard` theo R-15) hoặc sửa R-15 |

> Gap G6/G7 được `doc-reconcile` ghi nhận, **không** hạ intent: muốn đóng phải qua `/change` (chuẩn hoá
> `dueAt` một dạng + thêm merge theo `updatedAt`) rồi `/spec-publish`.

## 6. Versioning

Contract dữ liệu gắn với `spec_version` trong `SPECIFICATIONS.md` (hiện `1.2.0` — khớp frontmatter spec).
Đổi schema `Task`/`Settings` → bump version + migration dữ liệu cũ qua `/change` + `/spec-publish`.
Xem [`SPEC_VERSIONING.md`](SPEC_VERSIONING.md).

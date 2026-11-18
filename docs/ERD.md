# Data Model (ERD) — Todo Extension

> **As-built doc.** Project **không có database quan hệ** (`db_tool: none` trong
> `.context/project-config.md`). "ERD" ở đây là **data model của `chrome.storage.sync`** —
> kho key-value đồng bộ theo tài khoản Chrome.
> Nguồn sự thật duy nhất: [`lib/tasks/types.ts`](../lib/tasks/types.ts). Nếu doc khác code → code thắng.

## 0. Bản chất lưu trữ

- **Không** PostgreSQL/MySQL/MongoDB/SQLite, **không** ORM, **không** migration SQL.
- Dữ liệu nằm trong `chrome.storage.sync` (client-only, đồng bộ qua tài khoản Chrome — R-13).
- Mỗi task là **một key riêng** `t:<uuid>` → ghi atomic theo key, tránh ghi đè cả danh sách
  và tránh vượt quota (`lib/storage/adapter.ts:1-9`).
- Không index, không query phía server — filter/search/sort chạy client-side
  (`lib/tasks/query.ts`, pure functions).

## 1. Storage layout

| Key | Area | Value | Cardinality | Nguồn |
|---|---|---|---|---|
| `t:<uuid>` | `sync` | `Task` | 1 key / task | `types.ts:137` `TASK_KEY_PREFIX = "t:"`, `taskKey()` (`types.ts:155`) |
| `settings` | `sync` | `Settings` | 1 key duy nhất | `types.ts:138` `SETTINGS_KEY` |
| `subjects` | `sync` | `Subject[]` | 1 key (danh sách nhỏ, ghi cả mảng) | `types.ts:139` `SUBJECTS_KEY`, `adapter.ts:205` |
| `studyLog` | `sync` | `StudyLog` | 1 key, prune còn 60 ngày | `types.ts:140` `STUDY_LOG_KEY`, `adapter.ts:217,225` |
| `dayPlan` | `sync` | `DayPlan` | **1 key duy nhất**, prune còn 14 ngày — **không** tạo key/ngày | `types.ts:143,150-152`, `adapter.ts:242,244-264` (R-21) |
| `pomodoro` | `local` | `PomodoroState` | 1 key / máy | `types.ts:118,141` (`PomodoroState`), `lib/storage/local.ts:22-37` |
| `boardTabId` | `session` | `number` | 1 key, mất khi đóng Chrome | `lib/storage/local.ts:42` |

- `<uuid>` sinh bằng `crypto.randomUUID()` khi tạo task (`hooks/useTasks.ts:63`, R-01).
- **`dayPlan` là key `sync` thứ năm**, khác hẳn `pomodoro` (`local`) của R-20: `dayPlan` chứa
  "con ếch hôm nay" (`{ frogTaskId }`) và hydrate qua `chrome.storage.onChanged` như `t:<id>`;
  `PomodoroState` (gồm `taskId`/`interruptions`) là đồng hồ **thuộc một máy**, không sync. Xem §2.8.
- **Pomodoro không sync**: dùng `chrome.storage.local` vì đồng hồ đổi trạng thái liên tục (vượt
  120 write/phút của `sync`) và là trạng thái thuộc một máy — `lib/storage/local.ts:2-5`.
- `boardTabId` chỉ để nút biểu tượng focus lại tab bảng đang mở, không phải dữ liệu nghiệp vụ.

## 2. Entities

### 2.1 `Task` (root entity) — `types.ts:40-73`

| Field | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `string` | uuid, khoá chính | `crypto.randomUUID()` |
| `title` | `string` | bắt buộc, trim, **1–200** ký tự | R-01 |
| `note` | `string` | **luôn có**, có thể chuỗi rỗng, **≤ 1000** ký tự | R-06; mặc định `''` (`lib/tasks/form.ts:26-37`) |
| `priority` | `"low" \| "medium" \| "high"` | mặc định `medium` | R-05 |
| `dueAt` | `string \| null` | **wall-clock local** `YYYY-MM-DDTHH:mm`, KHÔNG hậu tố `Z`/offset | R-09; null = không hạn → không nhắc; Gói 0/G6 đã chuẩn hoá một dạng |
| `recurrence` | `RecurrenceRule` | mặc định `{kind:"none"}` | R-10, xem 2.3 |
| `tags` | `string[]` | **≤ 5** tag, mỗi tag 1–20 ký tự, trim + khử trùng | R-07 |
| `subtasks` | `Subtask[]` | **≤ 50** | R-08, xem 2.2 |
| `subjectId` | `string \| null` (optional) | trỏ tới `Subject.id`; task cũ thiếu field → coi như `null` | 2.4 |
| `done` | `boolean` | mặc định `false` | R-04 |
| `keystone` | `boolean` (optional) | mặc định `false` khi thiếu | R-21; việc then chốt ("20%"). **Bật** → tự gán `priority='high'` (A); **tắt → KHÔNG tự hạ** priority. Chỉ là nhãn lọc, không đổi enum `Priority` (`types.ts:62-64`) |
| `archived` | `boolean` (optional) | mặc định `false` khi thiếu | R-21; "Cắt bỏ". Task **vẫn nằm trong storage** (giữ nguyên mọi field) nhưng bị loại khỏi mọi tab/filter/search/bộ đếm/danh sách môn; phục hồi qua `archived=false` ở SettingsPanel mục "Đã cắt" (`types.ts:65-67`) |
| `lastDoneAt` | `string \| null` (optional) | **ISO 8601 UTC** (`toISOString`) lần đóng dấu gần nhất | additive, R-11 |
| `prevDueAt` | `string \| null` (optional) | **wall-clock local** `YYYY-MM-DDTHH:mm` (không `Z`) của hạn vừa hoàn thành | additive, R-11; Hoàn tác gán thẳng `dueAt = prevDueAt` |
| `createdAt` | `string` | ISO 8601 UTC (`nowISO`) | = now khi tạo |
| `updatedAt` | `string` | ISO 8601 UTC (`nowISO`) | cập nhật mỗi lần sửa |

> **R-21 — vòng đời `archived`:** cắt bỏ (`archived=true`, qua `TaskParchment`) **xoá alarm**
> (`syncAlarms` trong `useTasks.update` — `hooks/useTasks.ts:223-239`); phục hồi
> (`archived=false`, qua SettingsPanel) **đặt lại alarm** theo `dueAt` còn hợp lệ. Việc đã cắt vẫn
> đọc được ở mục "Đã cắt" nhưng không bao giờ vào `filterByBoard`/`filterBySubject`/
> `filterByKeystone`/`searchTasks`/`activeCount`/`dueTodayCount`/`overdueCount` hay tổng kết
> (`lib/tasks/query.ts:17-21,157-158,192-253`) — không có "task ma" trong bộ đếm.

**Encoding thực tế của `dueAt` / `prevDueAt`** (đọc từ code, không suy từ spec):

- **Nhóm wall-clock local** — `dueAt`, `prevDueAt`: `YYYY-MM-DDTHH:mm` **không hậu tố `Z`**.
  `new Date()` đọc chuỗi này theo giờ local thiết bị. Hạn người dùng nhập qua `datetime-local`
  được `formToDraft` giữ nguyên văn (`lib/tasks/form.ts:92`); occurrence lặp do `nextDueAt()` sinh
  cũng dùng `formatLocalInput()` (cùng helper với `toLocalInput`, `lib/datetime.ts`) →
  **một dạng duy nhất** kể từ Gói 0 (`spec 1.2.1`, gap G6 đã đóng).
- **Migration dữ liệu cũ:** `loadAll()` chuẩn hoá in-memory `dueAt`/`prevDueAt` qua
  `normalizeDueAt` (`lib/storage/adapter.ts:84-110`) — task cũ có chuỗi `Z` được đọc ra local,
  **không ghi lại** (quota 120 write/phút); `put` kế tiếp của task tự ghi bản canonical.
- **Nhóm instant thật** — `createdAt`/`updatedAt`/`lastDoneAt`: ISO UTC có `Z`
  (`nowISO() = new Date().toISOString()`, `hooks/useTasks.ts`). Trạng thái **done-today** quy đổi
  bằng cách so **ngày local** của `lastDoneAt` với hôm nay (`sameLocalDay`,
  `lib/tasks/query.ts:106-115`), không so chuỗi ngày.

> `SPECIFICATIONS.md` R-09 bản 1.2.1 quy định `dueAt` là wall-clock local một dạng; R-11 quy định
> `prevDueAt` cũng là wall-clock local. Gap G3 (weekly `weekdays`) đã đóng ở Gói 0 — xem
> [`API_SPEC.md`](API_SPEC.md) §5.

### 2.2 `Subtask` (embedded trong `Task.subtasks`) — `types.ts:34-38`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `string` | định danh trong task |
| `title` | `string` | nội dung bước con |
| `done` | `boolean` | mặc định `false` |

Quan hệ: **Task 1 — N Subtask** (mảng nhúng, không phải key riêng).
Business rule (R-08): tick hết subtask **KHÔNG** tự tick task cha; tick task cha không đổi subtask.
Tiến độ hiển thị `done/total` ngay trên chip meta của cuộn thư (`components/TaskScroll.tsx:67`
tính `doneSubtasks`, render trong `metaChips`) — không có component riêng.

### 2.3 `RecurrenceRule` (embedded, discriminated union) — `types.ts:28-32`

| `kind` | Payload | Ràng buộc |
|---|---|---|
| `none` | — | không lặp |
| `daily` | — | lặp hằng ngày |
| `weekly` | `rule: { weekdays: number[] }` | `weekdays` 0=CN…6=T7, ≥ 1 phần tử |
| `monthly` | `rule: { day: number }` | `day` 1–31; tháng thiếu ngày → clamp ngày cuối |

Quan hệ: **Task 1 — 1 RecurrenceRule**. Weekly/monthly bắt buộc có `dueAt` làm mốc (R-10).

> G3 đã đóng (Gói 0, spec 1.2.1): `nextDueAt` cho `weekly` chọn offset nhỏ nhất 1..7 rơi vào một thứ
> trong `weekdays` (`lib/tasks/recurrence.ts:88-102,125-131`); `weekdays` rỗng/thiếu/không phải array →
> fallback +7 ngày. `recurrenceForKind` vẫn chỉ lưu đúng một thứ lấy từ `dueAt` (`recurrence.ts:22-38`)
> vì UI chưa có chỗ chọn nhiều thứ. Kiểu dữ liệu `weekdays: number[]` **không đổi** — ERD chỉ reconcile
> trạng thái gap + line ref, không đổi field. Xem [`API_SPEC.md`](API_SPEC.md) §5.

### 2.4 `Settings` (key `settings`) — `types.ts:76-86`

| Field | Kiểu | Giá trị | Mặc định |
|---|---|---|---|
| `notificationsEnabled` | `boolean` | bật/tắt nhắc việc của trình duyệt | `true` |
| `displayMode` | `"popup" \| "newtab" \| "auto"` | nút biểu tượng mở popup hay bảng lớn | `auto` |
| `quillStyle` | `"pen" \| "hand"` | cây bút hay bàn tay cầm bút | `pen` |
| `quillEffect` | `boolean` | hiệu ứng mực thấm khi gõ | `true` |
| `ornaments` | `boolean` | họa tiết góc + hạt khảm vỏ trứng | `true` |
| `lacquerSheen` | `boolean` | vệt sáng sơn mài trên thẻ | `true` |
| `pomodoroPreset` | `"25/5" \| "50/10"` | độ dài phiên học/nghỉ | `25/5` |
| `soundEnabled` | `boolean` | chuông đồng + tiếng giấy | `false` |

`DEFAULT_SETTINGS` ở `types.ts:88-97`. **Không còn `theme`**: `normalizeSettings()` gộp bản ghi cũ với
mặc định và bỏ các field không còn trong `DEFAULT_SETTINGS` (`adapter.ts:127-139`), nên settings
lưu từ bản trước (có `theme: system|light|dark`) được đọc lên thành bộ field mới, không lỗi.
Gap G2 cũ đã đóng (R-14 1.2.0 mô tả đúng bộ field này).

### 2.5 `Subject` (embedded trong key `subjects`) — `types.ts:64-70`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `string` | uuid (`useSubjects.ts:83`) |
| `name` | `string` | tên môn, hiển thị trên gáy sách |
| `order` | `number` | thứ tự nhận màu gáy; môn thứ 6 trở đi dùng nâu bạc |
| `createdAt` | `string` | ISO 8601 UTC |

Quan hệ: **Subject 1 — N Task** qua `Task.subjectId` (không có FK, chỉ là id tham chiếu).
Xoá môn (`useBoard.dropSubject`) gỡ `subjects` rồi gán `subjectId = null` cho mọi task của môn đó —
task không bị xoá (`hooks/useBoard.ts:207-216`).

Giới hạn áp trong code: `MAX_SUBJECTS = 12`, `MAX_SUBJECT_NAME = 28` (`lib/subjects.ts:51-52`);
tên trùng nhau (so **không phân biệt hoa/thường**) bị từ chối (`hooks/useSubjects.ts:79-81`,
`components/SubjectShelf.tsx:42`).

### 2.6 `StudyLog` / `StudyDay` (key `studyLog`) — `types.ts:99-104`

| Kiểu | Định nghĩa |
|---|---|
| `StudyDay` | `{ tasks: number; focus: number }` — số việc đóng dấu + số phiên tập trung trọn vẹn trong ngày |
| `StudyLog` | `Record<dayKey, StudyDay>`; `dayKey` là `YYYY-MM-DD` **theo giờ local** (`lib/datetime.ts:18-23`) |

`putStudyLog` chỉ giữ **60 ngày gần nhất** (`STUDY_LOG_DAYS`, `adapter.ts:201-222`) để key không phình.
Ghi nhật ký nằm ở `hooks/useBoard.ts:119` (toggle task, `record('tasks', ±1)` trong `toggleTask`
`:110-133`) và `hooks/useBoard.ts:50` (`record('focus', 1)` trong `recordFocus` `:49-52` — chỉ gọi
khi xác nhận completion tự nhiên, xem §2.7).

### 2.7 `PomodoroState` (key `pomodoro`, `chrome.storage.local`) — `types.ts:118-145`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `phase` | `"focus" \| "break"` | đang học hay đang nghỉ |
| `running` | `boolean` | đồng hồ đang chạy |
| `endsAt` | `number \| null` | epoch ms lúc hết phiên; `null` khi tạm dừng |
| `remaining` | `number` | ms còn lại khi tạm dừng |
| `taskId` | `string \| null` | R-20: việc đang gắn với phiên (xem bên dưới); `null` khi không gắn / đã rời focus |
| `interruptions` | `number \| undefined` (optional) | R-20, **local-only**: số lần đổi việc trong phiên focus hiện tại. Khởi tạo `0` khi bắt đầu focus, `+1` qua `noteInterruption()` (`hooks/usePomodoro.ts:178-180`), xoá (`undefined`) khi reset/skip/kết thúc phiên (`hooks/usePomodoro.ts:107-116,162-171`). Consumer đọc `?? 0`. |
| `focusSessionId` | `string \| undefined` (optional) | **G10, local-only**: định danh phiên focus, sinh mới mỗi `start()` ở phase focus (`hooks/usePomodoro.ts:150-160`); `onFocusComplete(sessionId)` mang giá trị này xuống `pendingCompletion`. State cũ thiếu field → fallback `legacy:${endsAt}` (`hooks/usePomodoro.ts:118`) nên vẫn dedup được. Xoá khi advance/reset. |

**Khóa tiêu thụ G10** — key riêng `focusCompletionClaim` (`types.ts:150`) trong `chrome.storage.local`,
giá trị là **tập tối đa 32 `sessionId` đã tiêu thụ** (`lib/storage/local.ts:41-83`). `claimFocusCompletion`
kiểm tra cả Set trong context (chặn double-confirm cùng page) lẫn tập đã lưu (chặn stale dialog của
phiên cũ sau khi phiên mới đã được ghi). `useBoard.confirmFocusCompletion` chỉ tick task + `record('focus', 1)`
khi claim trả `true`. **Residual:** `chrome.storage.local` không có compare-and-swap; hai context xác nhận
cùng tick tuyệt đối vẫn có thể cả hai đọc tập cũ → double record (rất hiếm, ghi nhận thay vì giấu).

**Không đồng bộ giữa máy** — `taskId`, `interruptions` và `focusSessionId` chỉ nằm trong `chrome.storage.local`
(`types.ts:126,133,140`, `POMODORO_KEY = "pomodoro"` ở `types.ts:148`, `lib/storage/local.ts:22-37`).
**Không có field `sync` tương ứng**: R-21 thêm một key sync thứ năm là `dayPlan` (chứa `frogTaskId`,
xem §2.8) — nhưng `taskId`/`interruptions` của R-20 vẫn **không** được copy sang đó, **không thêm
key/ngày** cho Pomodoro, **không** ghi vào `StudyLog`, không lên thiết bị khác, chỉ hiện trong
tổng kết phiên. `dayPlan` **không phải** `PomodoroState`: khác area (`sync` vs `local`), khác mục
đích (chọn ếch theo ngày vs đồng hồ phiên focus) và khác vòng đời (prune 14 ngày vs xoá khi kết
thúc phiên).

As-built Gói C: `taskId` không còn là placeholder. `useBoard.startFocusOn(id)`
(`hooks/useBoard.ts:146-160`) gọi `attach(id)` rồi `start()`: `switchTaskMidSession(id)`
(`:162-177`) gọi `attach(id)` rồi `noteInterruption()` ở render kế tiếp. Cả popup và New Tab đọc
`taskId` để dựng focus overlay (`entrypoints/popup/App.tsx:41-43,124-135`,
`entrypoints/newtab/App.tsx:81-83,266-275`). Hai surface mở cùng lúc hydrate lại qua
`chrome.storage.local.onChanged` (`hooks/usePomodoro.ts:81-93`). Việc bị xoá/dangling → overlay
hiện "Việc không còn tồn tại" thay vì crash (`components/FocusTimer.tsx:84-93`).

### 2.8 `DayPlan` (key `dayPlan`, `chrome.storage.sync`) — `types.ts:143,150-152` (R-21)

```ts
type DayPlan = {
  [dayKey: string]: { frogTaskId: string | null }; // dayKey = YYYY-MM-DD theo giờ local
};
```

| Thuộc tính | Giá trị as-built |
|---|---|
| Số key | **Đúng 1 key** `dayPlan` trong `sync` — **không** tạo key theo ngày (giới hạn 512 item) |
| `dayKey` | `YYYY-MM-DD` **theo giờ local** (`lib/datetime.ts:20-25`), cùng helper với `studyLog`; sort từ điển = sort thời gian |
| Giá trị/ngày | `{ frogTaskId: string \| null }` — tối đa **một** con ếch/ngày; chọn việc khác thì thay thế; `null` = bỏ chọn |
| Prune | `putDayPlan` giữ **14 ngày gần nhất** (`DAY_PLAN_DAYS = 14`, `adapter.ts:242`) rồi ghi đúng 1 key (`adapter.ts:250-264`) |
| Quota | Giới hạn `QUOTA_BYTES_PER_ITEM` **8192 B** vẫn áp; `putDayPlan` bọc lỗi quota thành `StorageQuotaError` (`adapter.ts:258-263`) — không swallow (R-16) |
| Đọc | `loadDayPlan()` → `{}` khi key rỗng/không phải object (`adapter.ts:244-248`); hydrate lại khi key `dayPlan` đổi qua `onChanged` (`hooks/useTasks.ts:126-130`) |
| Hết hạn | Sang ngày local mới, consumer đọc `dayPlan[dayKey hôm nay]` → entry cũ tự hết hiệu lực, **không xoá khỏi storage** (vẫn nằm trong cửa sổ prune 14 ngày) |

`dayPlan` là chỗ ở của "con ếch hôm nay", **không phải** `PomodoroState` local của R-20 (§2.7).
Shape là additive: Gói B sẽ mở rộng cùng key này, Gói A **không** lưu `plannedIds` hay bất cứ
tổng hợp/khối lượng việc nào khác. `selectFrog(dayKey, taskId | null)` là cổng ghi duy nhất
(`hooks/useTasks.ts:256-271`); cache trong hook cũng cắt còn 14 ngày để khớp shape đã lưu.

## 3. Quan hệ tổng thể

```
Settings (1 key "settings")        Task (N key "t:<uuid>")
  displayMode/quill/...              ├─ subtasks: Subtask[]      (1—N, embedded)
  notificationsEnabled               ├─ recurrence: RecurrenceRule (1—1, embedded)
                                     ├─ subjectId ──► Subject (N—1, tham chiếu id)
                                     └─ keystone?/archived? (R-21, flags lọc — embedded)

Subject[] (1 key "subjects")       StudyLog (1 key "studyLog")
  id / name / order / createdAt      dayKey(YYYY-MM-DD local) → {tasks, focus}

DayPlan (1 key sync "dayPlan", R-21) — KHÔNG phải PomodoroState local
  dayKey(YYYY-MM-DD local) → { frogTaskId: string | null }   (prune 14 ngày)

PomodoroState (1 key local "pomodoro") — chỉ thuộc máy hiện tại, không sync
  taskId ──► Task.id (tham chiếu id, có thể dangling nếu việc bị xoá)
  interruptions (local-only, chỉ sống trong phiên focus)
```

Không có khoá ngoại giữa các key — `Subtask`/`RecurrenceRule` nhúng thẳng trong JSON của `Task`;
`subjectId` chỉ là id tham chiếu, xoá môn không cascade; `frogTaskId` trong `dayPlan` cũng chỉ là id
tham chiếu (task xoá → New Tab hero hiện rỗng, không crash). `Settings`/`StudyLog` độc lập với task
(`StudyLog` là số đếm theo ngày, không giữ id task); `dayPlan` giữ một id ếch/ngày, không đếm việc.

## 4. Giới hạn quota (Chrome `storage.sync`)

Nguồn: `SPECIFICATIONS.md` §Scalability + `lib/storage/adapter.ts:3-5` (comment quota).

| Giới hạn | Giá trị | Hệ quả thiết kế |
|---|---|---|
| `QUOTA_BYTES` (tổng) | 102.400 bytes (~100 KiB) | Banner lỗi khi đầy (R-16) |
| `QUOTA_BYTES_PER_ITEM` | 8.192 bytes | `put()` chặn task > 8192 bytes (`MAX_ITEM_BYTES`, `adapter.ts:23,116-121`); `putDayPlan` ghi 1 key và bọc lỗi vượt ngưỡng thành `StorageQuotaError` (`adapter.ts:250-264`, R-21) |
| `MAX_ITEMS` | 512 | ~512 task tối đa (đủ cho cá nhân) |
| `MAX_WRITE_OPERATIONS_PER_MINUTE` | 120 | Không autosave keystroke; chỉ ghi khi Lưu/toggle |

Lỗi quota ném `StorageQuotaError` rõ ràng, **không swallow** (`adapter.ts:24-34`, R-16).

## 5. Vòng đời & đồng bộ

- **Tạo/sửa/xoá**: ghi đúng 1 key `t:<id>` qua adapter (`put`/`remove`).
- **Đồng bộ thiết bị** (R-13): `storage.onChanged` → `useTasks` **đọc lại toàn bộ task từ storage**
  rồi thay snapshot; key thiếu → clear alarm, key còn → reschedule alarm
  (`hooks/useTasks.ts:125-156`). Background cũng reschedule theo từng key (`background.ts:118-139`).
  → Code hiện **không** so `updatedAt` để merge từng bản ghi; intent vẫn là last-write-wins theo
  `updatedAt`, nên đây là **gap G7** (xem [`API_SPEC.md`](API_SPEC.md) §5).
- **Con ếch** (R-21): `selectFrog` ghi `dayPlan` qua 1 `putDayPlan`, prune 14 ngày rồi cập nhật cache
  (`hooks/useTasks.ts:256-271`); key `dayPlan` đổi từ bề mặt/thiết bị khác → `loadDayPlan()` hydrate lại
  (`hooks/useTasks.ts:127-133`). Không tạo key/ngày, không đụng `PomodoroState` local (R-20).
- **Nhắc việc**: alarm `due:<id>` suy ra từ `dueAt` + `done` + `!archived`, không lưu trong storage
  (`lib/alarms/scheduler.ts:24-31`). Alarm là state dẫn xuất, không phải entity. Cắt bỏ → clear alarm,
  phục hồi → re-arm (`hooks/useTasks.ts:223-239`).
- **Không lưu lịch sử occurrence** của task lặp (R-11) — tick task lặp chỉ dời `dueAt` tới lần kế và
  để lại `lastDoneAt`/`prevDueAt` trên cùng bản ghi (không tạo occurrence mới, không lưu log riêng).
  Trạng thái "đã làm hôm nay" **được lưu** qua `lastDoneAt`, không phải session state.

## 6. Không áp dụng

Các mục sau của template ERD gốc **không áp dụng** cho project này: migration SQL, soft delete
kiểu `deleted_at` phía server, archival/retention phía server, index DB, ORM schema. Xoá task = xoá
key vĩnh viễn (toast Hoàn tác giữ nguyên task đã xoá trong RAM tới khi người dùng đóng toast — không
phải soft delete trong storage).

> **Archive của R-21 khác với soft-delete phía server ở trên**: `Task.archived = true` là một flag
> **client-side** trong cùng key `t:<id>` — dữ liệu được giữ lại trong `chrome.storage.sync` và có
> phục hồi qua SettingsPanel mục "Đã cắt". Nó chỉ loại task khỏi filter/đếm/alert, không xoá key,
> không tạo bảng/archival riêng, không có retention policy phía server.

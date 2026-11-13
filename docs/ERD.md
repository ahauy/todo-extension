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
| `t:<uuid>` | `sync` | `Task` | 1 key / task | `types.ts:118` `TASK_KEY_PREFIX = "t:"`, `taskKey()` |
| `settings` | `sync` | `Settings` | 1 key duy nhất | `types.ts:119` `SETTINGS_KEY` |
| `subjects` | `sync` | `Subject[]` | 1 key (danh sách nhỏ, ghi cả mảng) | `types.ts:120` `SUBJECTS_KEY`, `adapter.ts:183` |
| `studyLog` | `sync` | `StudyLog` | 1 key, prune còn 60 ngày | `types.ts:121` `STUDY_LOG_KEY`, `adapter.ts:201` |
| `pomodoro` | `local` | `PomodoroState` | 1 key / máy | `types.ts:122`, `lib/storage/local.ts:21` |
| `boardTabId` | `session` | `number` | 1 key, mất khi đóng Chrome | `lib/storage/local.ts:42` |

- `<uuid>` sinh bằng `crypto.randomUUID()` khi tạo task (`hooks/useTasks.ts:63`, R-01).
- **Pomodoro không sync**: dùng `chrome.storage.local` vì đồng hồ đổi trạng thái liên tục (vượt
  120 write/phút của `sync`) và là trạng thái thuộc một máy — `lib/storage/local.ts:2-5`.
- `boardTabId` chỉ để nút biểu tượng focus lại tab bảng đang mở, không phải dữ liệu nghiệp vụ.

## 2. Entities

### 2.1 `Task` (root entity) — `types.ts:40-61`

| Field | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `string` | uuid, khoá chính | `crypto.randomUUID()` |
| `title` | `string` | bắt buộc, trim, **1–200** ký tự | R-01 |
| `note` | `string` | tuỳ chọn, **≤ 1000** ký tự | R-06 |
| `priority` | `"low" \| "medium" \| "high"` | mặc định `medium` | R-05 |
| `dueAt` | `string \| null` | chuỗi ISO 8601, **giờ local** khi người dùng đặt hạn | R-09; null = không hạn → không nhắc |
| `recurrence` | `RecurrenceRule` | mặc định `{kind:"none"}` | R-10, xem 2.3 |
| `tags` | `string[]` | **≤ 5** tag, mỗi tag 1–20 ký tự, trim + khử trùng | R-07 |
| `subtasks` | `Subtask[]` | **≤ 50** | R-08, xem 2.2 |
| `subjectId` | `string \| null` (optional) | trỏ tới `Subject.id`; task cũ thiếu field → coi như `null` | 2.4 |
| `done` | `boolean` | mặc định `false` | R-04 |
| `lastDoneAt` | `string \| null` (optional) | **ISO 8601 UTC** (`toISOString`) lần đóng dấu gần nhất | additive, R-11 |
| `prevDueAt` | `string \| null` (optional) | `dueAt` ngay trước khi cuộn sang occurrence kế | additive, R-11 |
| `createdAt` | `string` | ISO 8601 UTC (`nowISO`) | = now khi tạo |
| `updatedAt` | `string` | ISO 8601 UTC (`nowISO`) | cập nhật mỗi lần sửa |

**Encoding thực tế của `dueAt`** (đọc từ code, không suy từ spec):

- Hạn người dùng nhập qua `datetime-local` → `fromLocalInput()` giữ nguyên chuỗi
  `YYYY-MM-DDTHH:mm` **không hậu tố Z** (`lib/datetime.ts:97-102`). `new Date()` đọc chuỗi này
  theo giờ local thiết bị.
- Khi việc lặp cuộn sang occurrence kế, `nextDueAt()` trả `Date.toISOString()` → chuỗi **UTC có `Z`**
  (`lib/tasks/recurrence.ts:88,94,107`). Vì vậy `dueAt` có thể tồn tại ở **hai dạng**; cả hai đều
  parse được bằng `new Date()` nên so sánh/`sameLocalDay` vẫn đúng, nhưng chuỗi lưu không đồng nhất.
  Đây là **gap G6** đang mở (BUG-002), không phải "local thuần".
- `lastDoneAt` luôn là UTC (`nowISO() = new Date().toISOString()`, `hooks/useTasks.ts:43`).
  Trạng thái **done-today** quy đổi bằng cách so **ngày local** của `lastDoneAt` với hôm nay
  (`sameLocalDay`, `lib/tasks/query.ts:114-121`), không so chuỗi ngày.

> `SPECIFICATIONS.md` 1.2.0 R-09 đã sửa từ *epoch ms* sang *ISO 8601 local*; gap G1 cũ đã đóng.
> Phần còn lệch là dạng UTC sau khi lặp — xem G6 ở [`API_SPEC.md`](API_SPEC.md) §5.

### 2.2 `Subtask` (embedded trong `Task.subtasks`) — `types.ts:34-38`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `string` | định danh trong task |
| `title` | `string` | nội dung bước con |
| `done` | `boolean` | mặc định `false` |

Quan hệ: **Task 1 — N Subtask** (mảng nhúng, không phải key riêng).
Business rule (R-08): tick hết subtask **KHÔNG** tự tick task cha; tick task cha không đổi subtask.
Tiến độ hiển thị `done/total` (`components/ui/SubtaskProgress.tsx`).

### 2.3 `RecurrenceRule` (embedded, discriminated union) — `types.ts:28-32`

| `kind` | Payload | Ràng buộc |
|---|---|---|
| `none` | — | không lặp |
| `daily` | — | lặp hằng ngày |
| `weekly` | `rule: { weekdays: number[] }` | `weekdays` 0=CN…6=T7, ≥ 1 phần tử |
| `monthly` | `rule: { day: number }` | `day` 1–31; tháng thiếu ngày → clamp ngày cuối |

Quan hệ: **Task 1 — 1 RecurrenceRule**. Weekly/monthly bắt buộc có `dueAt` làm mốc (R-10).

> ⚠️ Gap G3: code `nextDueAt` cho `weekly` hiện chỉ **+7 ngày**, chưa dùng `weekdays`
> (`lib/tasks/recurrence.ts:90-94`). Kiểu dữ liệu vẫn giữ `weekdays` và `recurrenceForKind` chỉ lưu
> đúng một thứ lấy từ `dueAt` (`recurrence.ts:28-30`). Xem [`API_SPEC.md`](API_SPEC.md) §5.

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
task không bị xoá (`hooks/useBoard.ts:135-144`).

### 2.6 `StudyLog` / `StudyDay` (key `studyLog`) — `types.ts:99-104`

| Kiểu | Định nghĩa |
|---|---|
| `StudyDay` | `{ tasks: number; focus: number }` — số việc đóng dấu + số phiên tập trung trọn vẹn trong ngày |
| `StudyLog` | `Record<dayKey, StudyDay>`; `dayKey` là `YYYY-MM-DD` **theo giờ local** (`lib/datetime.ts:18-23`) |

`putStudyLog` chỉ giữ **60 ngày gần nhất** (`STUDY_LOG_DAYS`, `adapter.ts:201-222`) để key không phình.
Ghi nhật ký nằm ở `hooks/useBoard.ts:91` (toggle task) và `:44` (hết phiên focus).

### 2.7 `PomodoroState` (key `pomodoro`, `chrome.storage.local`) — `types.ts:106-115`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `phase` | `"focus" \| "break"` | đang học hay đang nghỉ |
| `running` | `boolean` | đồng hồ đang chạy |
| `endsAt` | `number \| null` | epoch ms lúc hết phiên; `null` khi tạm dừng |
| `remaining` | `number` | ms còn lại khi tạm dừng |
| `taskId` | `string \| null` | việc đang học cùng, nếu có |

**Không đồng bộ giữa máy** — lưu local, không nằm trong `storage.sync` (`lib/storage/local.ts:2-5`).

## 3. Quan hệ tổng thể

```
Settings (1 key "settings")        Task (N key "t:<uuid>")
  displayMode/quill/...              ├─ subtasks: Subtask[]      (1—N, embedded)
  notificationsEnabled               ├─ recurrence: RecurrenceRule (1—1, embedded)
                                     └─ subjectId ──► Subject (N—1, tham chiếu id)

Subject[] (1 key "subjects")       StudyLog (1 key "studyLog")
  id / name / order / createdAt      dayKey(YYYY-MM-DD local) → {tasks, focus}

PomodoroState (1 key local "pomodoro") — chỉ thuộc máy hiện tại, không sync
```

Không có khoá ngoại giữa các key — `Subtask`/`RecurrenceRule` nhúng thẳng trong JSON của `Task`;
`subjectId` chỉ là id tham chiếu, xoá môn không cascade. `Settings`/`StudyLog` độc lập với task
(`StudyLog` là số đếm theo ngày, không giữ id task).

## 4. Giới hạn quota (Chrome `storage.sync`)

Nguồn: `SPECIFICATIONS.md` §Scalability + `lib/storage/adapter.ts:14`.

| Giới hạn | Giá trị | Hệ quả thiết kế |
|---|---|---|
| `QUOTA_BYTES` (tổng) | 102.400 bytes (~100 KiB) | Banner lỗi khi đầy (R-16) |
| `QUOTA_BYTES_PER_ITEM` | 8.192 bytes | `put()` chặn task > 8192 bytes (`MAX_ITEM_BYTES`) |
| `MAX_ITEMS` | 512 | ~512 task tối đa (đủ cho cá nhân) |
| `MAX_WRITE_OPERATIONS_PER_MINUTE` | 120 | Không autosave keystroke; chỉ ghi khi Lưu/toggle |

Lỗi quota ném `StorageQuotaError` rõ ràng, **không swallow** (`adapter.ts:24-34`, R-16).

## 5. Vòng đời & đồng bộ

- **Tạo/sửa/xoá**: ghi đúng 1 key `t:<id>` qua adapter (`put`/`remove`).
- **Đồng bộ thiết bị** (R-13): `storage.onChanged` → `useTasks` **đọc lại toàn bộ task từ storage**
  rồi thay snapshot; key thiếu → clear alarm, key còn → reschedule alarm
  (`hooks/useTasks.ts:102-128`). Background cũng reschedule theo từng key (`background.ts:118-139`).
  → Code hiện **không** so `updatedAt` để merge từng bản ghi; intent vẫn là last-write-wins theo
  `updatedAt`, nên đây là **gap G7** (xem [`API_SPEC.md`](API_SPEC.md) §5).
- **Nhắc việc**: alarm `due:<id>` suy ra từ `dueAt` + `done`, không lưu trong storage
  (`lib/alarms/scheduler.ts`). Alarm là state dẫn xuất, không phải entity.
- **Không lưu lịch sử occurrence** của task lặp (R-11) — tick task lặp chỉ dời `dueAt` tới lần kế và
  để lại `lastDoneAt`/`prevDueAt` trên cùng bản ghi (không tạo occurrence mới, không lưu log riêng).
  Trạng thái "đã làm hôm nay" **được lưu** qua `lastDoneAt`, không phải session state.

## 6. Không áp dụng

Các mục sau của template ERD gốc **không áp dụng** cho project này: migration SQL, soft delete
(`deleted_at`), archival/retention phía server, index DB, ORM schema. Xoá task = xoá key vĩnh viễn
(toast Hoàn tác giữ nguyên task đã xoá trong RAM tới khi người dùng đóng toast — không phải
soft delete trong storage).

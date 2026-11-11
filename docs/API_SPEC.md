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

| Key | Value | Nguồn |
|---|---|---|
| `t:<uuid>` | `Task` (1 key/task, ghi atomic theo key) | `lib/tasks/types.ts:57` (`TASK_KEY_PREFIX`) |
| `settings` | `Settings` | `lib/tasks/types.ts:60` (`SETTINGS_KEY`) |

Kiểu `Task`, `Settings`, `Subtask`, `RecurrenceRule` định nghĩa duy nhất tại `lib/tasks/types.ts`
— adapter, recurrence, query, UI đều import từ đây (single source of truth).

## 2. Chrome extension APIs sử dụng

Manifest chỉ khai `permissions: ["storage", "alarms", "notifications"]`
(`wxt.config.ts`; R-17). **Không** `host_permissions`, **không** content script.
Justification từng quyền cho Chrome Web Store: xem [`PERMISSION.md`](PERMISSION.md).

### 2.1 `chrome.storage.sync`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `sync.get(keys, cb)` | `adapter.ts:33` (`storageGet`) | Đọc task/settings; `null` = đọc tất cả |
| `sync.set(items, cb)` | `adapter.ts:46` (`storageSet`) | Ghi 1 key/task hoặc `settings` |
| `sync.remove(keys, cb)` | `adapter.ts:59` (`storageRemove`) | Xoá key `t:<id>` |
| `onChanged.addListener` | `adapter.ts:154`, `background.ts:81` | Nhận thay đổi từ thiết bị khác (R-13) |
| `sync.getBytesInUse` | `components/Settings.tsx` (optional) | Hiển thị dung lượng đã dùng |

Mọi lời gọi đều kiểm tra `chrome.runtime.lastError` và reject Promise khi lỗi
(`adapter.ts:34-40`) — **không nuốt lỗi** (R-16).

### 2.2 `chrome.alarms`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `alarms.create(name, {delayInMinutes})` | `scheduler.ts:45,68` | Đặt nhắc việc tên `due:<id>` |
| `alarms.clear(name)` | `scheduler.ts:38,54,63,73` | Xoá alarm khi done/xoá/quá hạn |
| `alarms.getAll(cb)` | `scheduler.ts:50` | Dọn alarm mồ côi (task không còn) |
| `alarms.onAlarm.addListener` | `background.ts:56` | Alarm fire → hiện notification |

Alarm bền hơn `setTimeout` trong service worker MV3 (SW bị kill giữa chừng) — `scheduler.ts:4`.

### 2.3 `chrome.notifications`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `notifications.create(id, opts)` | `background.ts:32` (`notifyTask`) | Hiện nhắc việc: title task + note rút gọn (≤60 ký tự) + hạn |

Notification **không** tự đổi trạng thái task (R-12). `iconUrl: chrome.runtime.getURL('icon/48.png')`
(`background.ts:34`) — icon 16/48/128 nằm trong `public/icon/`, manifest khai `icons`
(gap G5 đã đóng 2026-11-11, guard test `src/__tests__/notification-icon.test.ts`).

Background chỉ gọi `notifications.create` khi `shouldNotify(task, settings)` (`lib/notifications.ts`):
`task.done === false`, có `dueAt`, và `settings.notificationsEnabled !== false`.
Settings có toggle "Bật nhắc việc" + đọc quyền thật qua `notifications.getPermissionLevel`.

### 2.4 `chrome.runtime`

| API | Dùng ở đâu | Mục đích |
|---|---|---|
| `runtime.onInstalled` | `background.ts:72` | Resync toàn bộ alarm khi cài |
| `runtime.onStartup` | `background.ts:76` | Resync alarm khi Chrome khởi động |
| `runtime.lastError` | `adapter.ts` | Phát hiện lỗi storage/quota |

## 3. Internal module interfaces

### 3.1 Storage adapter — `lib/storage/adapter.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `loadAll` | `() => Promise<Task[]>` | Đọc mọi key `t:*` → mảng Task |
| `put` | `(task: Task) => Promise<void>` | Ghi `t:<id>`; chặn item > 8192 bytes (`MAX_ITEM_BYTES`, dòng 14) |
| `remove` | `(id: string) => Promise<void>` | Xoá `t:<id>` |
| `loadSettings` | `() => Promise<Settings \| null>` | Đọc `settings` |
| `putSettings` | `(s: Settings) => Promise<void>` | Ghi `settings` |
| `subscribe` | `(cb: (changedKeys: string[]) => void) => () => void` | Đăng ký `onChanged`, trả về unsubscribe |

**Error contract:** `StorageQuotaError` (`adapter.ts:17`) ném khi vượt quota — phát hiện qua
chuỗi lỗi chứa `QUOTA_BYTES`/`quota` (`isQuotaError`, dòng 24). UI hiển thị banner, không swallow (R-16).

### 3.2 Recurrence — `lib/tasks/recurrence.ts`

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `nextDueAt` | `(prevDue: string \| Date, rule: RecurrenceRule) => string \| null` | Lần kế tiếp (ISO); `none` → null |
| `nextFutureDue` | `(prevDue, rule, now?) => string \| null` | Catch-up: lặp tới khi > now, tối đa 1000 vòng (`MAX_ITERATIONS`, dòng 13) rồi ném lỗi |

Tính theo **múi giờ local thiết bị** (không UTC) — `localParts`/`makeLocal`, dòng 16-39 (R-10).
Monthly clamp ngày không tồn tại về ngày cuối tháng (`daysInMonth`, dòng 75).

### 3.3 Query — `lib/tasks/query.ts` (pure functions)

| Hàm | Chữ ký | Hành vi |
|---|---|---|
| `filterTasks` | `(tasks, tab: 'all'\|'active'\|'done') => Task[]` | Lọc theo tab |
| `searchTasks` | `(tasks, query: string) => Task[]` | Khớp title/note/tag, case-insensitive |
| `sortTasks` | `(tasks, now?) => Task[]` | overdue → dueAt asc → priority desc → createdAt desc → id (tie-breaker) |
| `sortDoneTasks` | `(tasks) => Task[]` | Tab Đã xong: updatedAt desc |

Sort precedence deterministic (R-15) — `sortTasks`, dòng 62-98. Task không `dueAt` xếp cuối.
UI list hiện sort theo tiêu chí default/priority/created ở `TaskList`; `sortTasks` là domain helper
chưa được nối (gap G4).

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

`useTasks()` → `{ tasks, add, update, remove, toggle }` qua `useSyncExternalStore` trên adapter.

- `add`: validate title 1–200 trim, `id = crypto.randomUUID()`, mặc định `priority=medium`,
  `done=false`, `tags=[]`, `subtasks=[]`, `recurrence={kind:'none'}`, `createdAt=updatedAt=now`.
- `toggle`: task thường → `done=true` + clear alarm; task lặp → `nextFutureDue` catch-up,
  `done=false`, `dueAt=next`, tạo alarm mới (R-11).
- `onChanged`: merge **last-write-wins theo `updatedAt`** (lớn hơn thắng); key xoá → xoá local +
  clear alarm; `settings` đổi → áp theme (R-13).
- Không autosave từng keystroke (giới hạn 120 write/phút) — chỉ ghi khi Lưu / toggle.

## 4. Sync & conflict resolution (R-13)

| Sự kiện `storage.onChanged` (area `sync`) | Xử lý |
|---|---|
| Key `t:<id>` thay đổi | Merge theo `updatedAt` lớn hơn thắng → cập nhật UI + reschedule alarm |
| Key `t:<id>` bị xoá (`newValue` undefined/null) | Xoá task local + `alarms.clear('due:<id>')` (`background.ts:102`) |
| Key `settings` thay đổi | Áp theme mới (`background.ts:94`) |

## 5. Spec ↔ Code gaps (ghi nhận, KHÔNG tự sửa intent)

> Theo `AGENTS.md`: code ≠ intent → ghi gap, không hạ cấp intent cho khớp code.
> Các gap dưới đây cần xử lý qua `/change` nếu muốn đổi behavior.

| ID | Spec (`SPECIFICATIONS.md`) | Code thực tế | Ảnh hưởng |
|---|---|---|---|
| G1 | R-09: `dueAt` là **epoch ms** | `types.ts:42`: `dueAt: string \| null` (**ISO 8601**) | Doc as-built theo ISO string |
| G2 | `settings = { theme }` | `types.ts:51-54`: thêm `notificationsEnabled: boolean` | Settings có 2 field |
| G3 | R-10: weekly **chọn các thứ** (`weekdays`) | `recurrence.ts:68-72`: weekly chỉ **+7 ngày**, không dùng `weekdays` | Weekly lặp đúng 7 ngày, bỏ qua thứ đã chọn |
| G4 | R-15: user chọn tiêu chí sort (`dueAt\|priority\|createdAt`) | `query.ts:16`: `SortCriterion = 'default'` duy nhất | Chỉ có sort mặc định |
| G5 | R-12 notification có icon | ~~`background.ts:33` tham chiếu `icons/icon-48.png` **không tồn tại**; manifest chưa khai `icons`~~ → đã fix: `chrome.runtime.getURL('icon/48.png')`, `public/icon/{16,48,128}.png`, manifest `icons` | ✅ Đã đóng 2026-11-11 (phase-2-task-03) |

## 6. Versioning

Contract dữ liệu gắn với `spec_version` trong `SPECIFICATIONS.md` (hiện `1.0.0`).
Đổi schema `Task`/`Settings` → bump version + migration dữ liệu cũ qua `/change` + `/spec-publish`.
Xem [`SPEC_VERSIONING.md`](SPEC_VERSIONING.md).

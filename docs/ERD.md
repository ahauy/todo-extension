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

| Key | Value | Cardinality | Nguồn |
|---|---|---|---|
| `t:<uuid>` | `Task` | 1 key / task | `types.ts:57` `TASK_KEY_PREFIX = "t:"`, `taskKey()` |
| `settings` | `Settings` | 1 key duy nhất | `types.ts:60` `SETTINGS_KEY = "settings"` |

`<uuid>` sinh bằng `crypto.randomUUID()` khi tạo task (`hooks/useTasks.ts`, R-01).

## 2. Entities

### 2.1 `Task` (root entity) — `types.ts:37-49`

| Field | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `string` | uuid, khoá chính | `crypto.randomUUID()` |
| `title` | `string` | bắt buộc, trim, **1–200** ký tự | R-01 |
| `note` | `string` | tuỳ chọn, **≤ 1000** ký tự | R-06 |
| `priority` | `"low" \| "medium" \| "high"` | mặc định `medium` | R-05 |
| `dueAt` | `string \| null` | **ISO 8601**, local time thiết bị | R-09; null = không hạn → không nhắc |
| `recurrence` | `RecurrenceRule` | mặc định `{kind:"none"}` | R-10, xem 2.3 |
| `tags` | `string[]` | **≤ 5** tag, mỗi tag 1–20 ký tự, trim + khử trùng | R-07 |
| `subtasks` | `Subtask[]` | **≤ 50** | R-08, xem 2.2 |
| `done` | `boolean` | mặc định `false` | R-04 |
| `createdAt` | `string` | ISO 8601 | = now khi tạo |
| `updatedAt` | `string` | ISO 8601 | cập nhật mỗi lần sửa; dùng merge sync |

> ⚠️ Gap G1: `SPECIFICATIONS.md` R-09 ghi `dueAt` là *epoch ms*, nhưng code là **ISO 8601 string**.
> Doc này theo code. Xem [`API_SPEC.md`](API_SPEC.md) §5.

### 2.2 `Subtask` (embedded trong `Task.subtasks`) — `types.ts:31-35`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `string` | định danh trong task |
| `title` | `string` | nội dung bước con |
| `done` | `boolean` | mặc định `false` |

Quan hệ: **Task 1 — N Subtask** (mảng nhúng, không phải key riêng).
Business rule (R-08): tick hết subtask **KHÔNG** tự tick task cha; tick task cha không đổi subtask.
Tiến độ hiển thị `done/total` (`components/ui/SubtaskProgress.tsx`).

### 2.3 `RecurrenceRule` (embedded, discriminated union) — `types.ts:25-29`

| `kind` | Payload | Ràng buộc |
|---|---|---|
| `none` | — | không lặp |
| `daily` | — | lặp hằng ngày |
| `weekly` | `rule: { weekdays: number[] }` | `weekdays` 0=CN…6=T7, ≥ 1 phần tử |
| `monthly` | `rule: { day: number }` | `day` 1–31; tháng thiếu ngày → clamp ngày cuối |

Quan hệ: **Task 1 — 1 RecurrenceRule**. Weekly/monthly bắt buộc có `dueAt` làm mốc (R-10).

> ⚠️ Gap G3: code `nextDueAt` cho `weekly` hiện chỉ **+7 ngày**, chưa dùng `weekdays`
> (`lib/tasks/recurrence.ts:68-72`). Kiểu dữ liệu vẫn giữ `weekdays`. Xem [`API_SPEC.md`](API_SPEC.md) §5.

### 2.4 `Settings` (key `settings`) — `types.ts:51-54`

| Field | Kiểu | Giá trị | Mặc định |
|---|---|---|---|
| `theme` | `"system" \| "light" \| "dark"` | R-14 | `system` |
| `notificationsEnabled` | `boolean` | bật/tắt nhắc việc | — |

> ⚠️ Gap G2: spec chỉ mô tả `{ theme }`; code thêm `notificationsEnabled`. Doc theo code.

## 3. Quan hệ tổng thể

```
Settings (1 key "settings")        Task (N key "t:<uuid>")
  theme                              ├─ subtasks: Subtask[]   (1—N, embedded)
  notificationsEnabled               └─ recurrence: RecurrenceRule (1—1, embedded)
```

Không có khoá ngoại giữa các key — `Subtask`/`RecurrenceRule` nhúng thẳng trong JSON của `Task`.
`Settings` độc lập, không tham chiếu task.

## 4. Giới hạn quota (Chrome `storage.sync`)

Nguồn: `SPECIFICATIONS.md` §Scalability + `lib/storage/adapter.ts:14`.

| Giới hạn | Giá trị | Hệ quả thiết kế |
|---|---|---|
| `QUOTA_BYTES` (tổng) | 102.400 bytes (~100 KiB) | Banner lỗi khi đầy (R-16) |
| `QUOTA_BYTES_PER_ITEM` | 8.192 bytes | `put()` chặn task > 8192 bytes (`MAX_ITEM_BYTES`) |
| `MAX_ITEMS` | 512 | ~512 task tối đa (đủ cho cá nhân) |
| `MAX_WRITE_OPERATIONS_PER_MINUTE` | 120 | Không autosave keystroke; chỉ ghi khi Lưu/toggle |

Lỗi quota ném `StorageQuotaError` rõ ràng, **không swallow** (`adapter.ts:17-27`, R-16).

## 5. Vòng đời & đồng bộ

- **Tạo/sửa/xoá**: ghi đúng 1 key `t:<id>` qua adapter (`put`/`remove`).
- **Đồng bộ thiết bị** (R-13): `storage.onChanged` → merge **last-write-wins theo `updatedAt`**;
  key bị xoá → xoá local + clear alarm. Chi tiết: [`API_SPEC.md`](API_SPEC.md) §4.
- **Nhắc việc**: alarm `due:<id>` suy ra từ `dueAt` + `done`, không lưu trong storage
  (`lib/alarms/scheduler.ts`). Alarm là state dẫn xuất, không phải entity.
- **Không lưu lịch sử occurrence** của task lặp (R-11) — tick task lặp chỉ dời `dueAt` tới lần kế.

## 6. Không áp dụng

Các mục sau của template ERD gốc **không áp dụng** cho project này: migration SQL, soft delete
(`deleted_at`), archival/retention phía server, index DB, ORM schema. Xoá task = xoá key vĩnh viễn
(có toast Hoàn tác 6 giây ở UI — P2, không phải soft delete trong storage).

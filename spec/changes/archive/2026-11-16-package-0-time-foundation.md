---
id: package-0-time-foundation
type: feature
status: done
created: 2026-11-16
completed: 2026-11-17
---

# Gói 0 — Nền tảng thời gian & lặp lại (chuẩn hoá `dueAt` + weekly `weekdays`)

> Slice đầu tiên của umbrella [FEAT-003](2026-11-16-time-management-upgrade.md).
> Nguồn yêu cầu đã được user duyệt: [`docs/ROADMAP_TIME_MANAGEMENT.md`](../../docs/ROADMAP_TIME_MANAGEMENT.md)
> §Gói 0. Change doc này **chỉ** làm Gói 0; các gói A–E vẫn `pending` trong umbrella.

## Yêu cầu

Chuẩn hoá biểu diễn thời gian và sửa thuật toán lặp lại **trước khi** xây bất kỳ feature
đặt lịch / "hôm nay" / streak nào. Không đổi UI.

| Loại field | Biểu diễn đúng | Lý do |
|---|---|---|
| `dueAt` (hạn chót — wall-clock) | `YYYY-MM-DDTHH:mm` **local**, không hậu tố `Z` | Người dùng đặt "8 giờ sáng mai" → phải vẫn là 8 giờ địa phương dù đổi múi giờ / DST |
| `createdAt`, `updatedAt`, `lastDoneAt`, `prevDueAt` (instant) | ISO UTC có `Z` | Là *thời điểm*, so sánh trực tiếp được |

Kèm 2 mục sửa cùng gói:

1. **G3 — weekly bỏ qua `weekdays`**: `nextDueAt` với `kind: 'weekly'` chỉ cộng +7 ngày, không đọc
   `rule.weekdays`. Việc "T2–T6" hiện sinh sai occurrence.
2. **G8 — tie-breaker sort chưa nhất quán** (`sortBoard` vs `sortTasks`): tuỳ chọn, chỉ làm nếu không
   làm phình diff.

## Bối cảnh / tái hiện (không phải bug UI, là sai lệch dữ liệu)

Số liệu đã đối chiếu code (2026-11-16):

- **G6 — trộn 2 dạng `dueAt` trong cùng một danh sách:**
  - Ô nhập hạn dùng `<input type="datetime-local">` (`components/TaskFields.tsx:82`) → giá trị
    `YYYY-MM-DDTHH:mm` **local**, được lưu nguyên văn (`formToDraft`, `lib/tasks/form.ts:92`).
  - `nextDueAt()` trả `.toISOString()` → **UTC có `Z`** (`lib/tasks/recurrence.ts:88, 94, 107`).
  - Hệ quả: task thường và task lặp tích tắc **khác định dạng** trong cùng store; `new Date(dueAt)`
    đọc đúng nhưng hiển thị/serialize thì lệch (vd `DeadlineChip` hiện giờ UTC thay vì giờ đã đặt).
- **G3 — weekly:** `lib/tasks/recurrence.ts:90-94` cộng `p.date + 7`, không tham chiếu
  `rule.rule.weekdays` (kiểu `WeeklyRule`). `recurrenceForKind` chỉ tạo `weekdays: [base.getDay()]`
  (`recurrence.ts:28-30`) và **UI không có chỗ chọn nhiều thứ** → `weekdays` hiện chỉ 1 phần tử.
- **Không có hook migration task:** `loadAll()` cast thô `value as Task`
  (`lib/storage/adapter.ts:78-94`); chỉ `settings` có `normalizeSettings` (dòng 129). Task cũ có
  `dueAt` dạng `Z` sẽ không tự đổi.

## Acceptance (bắt buộc)

- [x] **Canonical `dueAt`**: mọi chỗ *sinh* `dueAt` (form, recurrence, toggle việc lặp) trả
      `YYYY-MM-DDTHH:mm` local, không `Z`; có helper encode/decode duy nhất trong `lib/datetime.ts`
      (vd `toLocalInput` / `fromLocalInput`) và **không** nơi nào tự `toISOString()` cho `dueAt`.
- [x] **`createdAt`/`updatedAt`/`lastDoneAt` giữ UTC `Z`; `prevDueAt` = wall-clock local**
      (quyết định user 2026-11-16, ghi trong `humanCheckpoint` của progress) — có comment hợp đồng
      trong `lib/tasks/types.ts` nói rõ 2 nhóm field khác nhau.
- [x] **Migration dữ liệu cũ**: task có `dueAt` kết thúc bằng `Z` được quy về local wall-clock khi đọc.
      Chọn 1 trong 2 hướng và ghi rõ lý do trong task file:
      (a) normalize **in-memory** trong `loadAll` (không ghi → không đụng quota 120 write/phút);
      (b) rewrite thật khi task được `put` lần kế tiếp (lazy) — **không** rewrite toàn bộ một lượt.
      Dứt khoát **không** chọn "ghi lại tất cả task ngay khi load".
- [x] **G3 weekly**: `nextDueAt` với `weekdays: [1,3,5]` sinh occurrence đúng các thứ đó (qua
      `nextFutureDue` catch-up), giữ nguyên `HH:mm`; `weekdays: []` hoặc thiếu → fallback hành vi cũ
      (+7 ngày) để không mất dữ liệu cũ.
- [x] **Test**: fixture có `dueAt` dạng `Z` và không `Z`; test weekly nhiều thứ; test catch-up qua
      cuối tuần; test `toggle` việc lặp vẫn tạo alarm đúng giờ local.
- [x] **Không đổi** schema storage, **không** thêm quyền manifest (`storage`, `alarms`, `notifications`).
- [x] **Không đổi UI** (Gói 0 thuần nền tảng) — nếu phải sửa UI để hiển thị đúng thì ghi rõ lý do.
- [x] Docs reconcile: `docs/ERD.md` (biểu diễn `dueAt` vs instant), `docs/API_SPEC.md` (gap G6/G3 →
      đóng, `nextDueAt` contract), `docs/USER_FLOW.md` **chỉ** nếu hành vi người dùng thật đổi.

## Ghi chú

- **Không** dùng `plannedFor`/`keystone`/`archived` ở đây — đó là Gói A/B.
- Gói 0 là **điều kiện đúng** cho Gói B (đặt lịch theo ngày), D (streak theo lịch), E (time blocking):
  nếu "ngày" còn lệch thì các gói sau sẽ cộng dồn lỗi.
- Rủi ro trung bình: đụng dữ liệu người dùng đã có → reviewer mức **STRICT** (schema/migration + shared).
- Ràng buộc storage: 8 KB/item, ~100 KB tổng, **512 item**, 120 write/phút
  (`lib/storage/adapter.ts:3-5`) — lý do loại phương án rewrite-all.

## Close-out (2026-11-17)

- Task 01: `fc9e26e` — canonical `dueAt` wall-clock local + migration in-memory (reviewer STRICT round 2 PASS).
- Task 02: `c890de2` — G3 weekly `weekdays` + G8 tie-breaker `sortBoard` (reviewer STRICT round 2 PASS).
- Verify cuối: `tsc` / `eslint` sạch · `vitest 25 files / 149 tests` · `wxt build 620.92 kB`.
- G3/G6/G8 đã đóng trong `docs/API_SPEC.md` + `docs/ERD.md`; spec_version 1.2.1 và test-scope
  scopeVersion 22 giữ nguyên (không đổi requirement so với spec delta đã publish).
- Follow-up không chặn: NaN `dueAt`/`createdAt` làm `sortBoard` mất deterministic (pre-existing),
  DST-gap, `MAX_ITERATIONS` với `weekdays` nhiều thứ. Các gói A–E của umbrella FEAT-003 vẫn pending.

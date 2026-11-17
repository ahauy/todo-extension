---
doc_type: proposal_roadmap
status: proposal
created_at: 2026-11-16
spec_version_ref: 1.2.0
scope: time-management upgrade (habit · Pareto · ABCDE · 6P · Eat That Frog · single-handling · time blocking)
---

# ROADMAP — Nâng cấp quản lý thời gian (đề xuất)

> **Proposal doc.** Đây **không phải intent doc** (`BRD.md`) và **không phải as-built doc**
> (`API_SPEC.md`, `ERD.md`, `DESIGN.md`). Chưa gói nào được duyệt để code.
>
> Đường đi khi một gói được duyệt: `/change` → agent `change-request` (class ADDITIVE/MODIFY)
> → spec delta + `/spec-publish` → phase/task → builder → reviewer → commit.
>
> Lập ngày **2026-11-16**, đối chiếu code nhánh `staging`, spec `1.2.0` (scopeVersion 21).

## 0. Cách dùng tài liệu

| Mục | Dùng để |
|-----|---------|
| §1 | Hiểu bản chất 7 phương pháp và vì sao chúng là **một vòng lặp**, không phải 7 feature rời |
| §2 | Biết cái gì đã có trong code để tận dụng (kèm `file:line`) |
| §3 | Ràng buộc kỹ thuật + quy tắc doc phải tôn trọng |
| §4 | Nội dung từng gói (dữ liệu, hành vi, module chạm, chi phí, nghiệm thu sơ bộ) |
| §5 | Các quyết định đã chốt với user |
| §6 | Thứ tự triển khai đề xuất + lý do |
| §7 | Câu hỏi đã chốt ngày **2026-11-16** (kèm phương án đã chọn + hệ quả) |
| §8 | Phụ lục: lệch doc↔code liên quan (thuộc một lượt reconcile riêng) |

## 1. Phân tích 7 phương pháp

### 1.1. Ba nhóm bản chất

| Nhóm | Phương pháp | Câu hỏi nó trả lời | Trục sản phẩm cần có |
|------|-------------|--------------------|----------------------|
| **Chọn việc** | Pareto 80/20 · ABCDE · Eat That Frog | *Làm gì?* | Một trục "then chốt" + một "con ếch" mỗi ngày |
| **Cấu trúc thời gian** | 6P · Time Blocking / Chunking | *Làm khi nào?* | `plannedFor` + khung giờ + nhịp nhắc buổi tối |
| **Kỷ luật hành vi** | 21 ngày / thói quen · Single-handling | *Làm đến cùng thế nào?* | Streak theo từng thói quen + chế độ khoá một việc |

### 1.2. Vì sao phải làm thành vòng lặp

```
Tối hôm trước (6P)  →  Sáng hôm sau (Eat That Frog)  →  Trong ngày (Single-handling)
        ↑                                                              │
        │                                                              ▼
   Thói quen 21 ngày  ←  Review tuần (Pareto / ABCDE)  ←  Nhật ký đóng dấu
```

- **Pareto/ABCDE** chỉ có nghĩa nếu tối hôm trước đã **chọn** (6P). Nếu không chọn, người dùng mở popup
  buổi sáng và vẫn phải quyết định lại từ đầu.
- **Chọn xong** mà không có chế độ **single-handling** thì "con ếch" chỉ là một cái nhãn trang trí.
- **Single-handling** chỉ bền nếu lặp đủ lâu thành **thói quen** — đó là chỗ 21 ngày/streak có giá trị.
- **Review tuần** là chỗ 20% được xác lập lại, đóng vòng lặp.

Kết luận: thứ tự triển khai phải theo **vòng lặp**, không theo độ "hay" của từng phương pháp.

### 1.3. Ghi chú trung thực về "21 ngày"

- "21 ngày" phổ biến từ Maxwell Maltz (1960) và các sách self-help; đây là **mốc văn hoá**, không phải
  kết luận thực nghiệm.
- Nghiên cứu Lally và cộng sự (2010, *European Journal of Social Psychology*): thời gian tự động hoá
  hành vi có **trung vị ~66 ngày**, biên **18–254 ngày**, tuỳ hành vi và bối cảnh.
- Hệ quả thiết kế: dùng 21 ngày làm **mốc ăn mừng đầu tiên** (seal 7 → 14 → 21), **không** phát ngôn
  "khoa học chứng minh 21 ngày là đủ". Sau 21, sản phẩm vẫn phải hiển thị streak tiếp tục tăng.

### 1.4. ABCDE — ánh xạ đã chốt

| Mức ABCDE | Ý nghĩa gốc | Ánh xạ sản phẩm | Có đổi schema? |
|-----------|-------------|-----------------|----------------|
| **A** | Bắt buộc, bỏ qua để lại hậu quả nghiêm trọng | `priority='high'` + `keystone=true` | Không (thêm 1 field boolean) |
| **B** | Nên làm, hậu quả nhẹ | `priority='medium'` | Không |
| **C** | Làm thì tốt, không làm cũng không sao | `priority='low'` | Không |
| **D** | Uỷ quyền / chuyển giao / tự động hoá | **Hành động**, không phải mức ưu tiên → gắn `recurrence` hoặc tag "tự động" | Không |
| **E** | Cắt bỏ hoàn toàn | **Hành động** → "Cắt bỏ" (archive) trong menu việc | (xem Gói A) |

**Quyết định:** giữ enum 3 mức (`low|medium|high`), **không** thêm enum 5 mức A–E — lý do ở §5.

## 2. Điểm bám trong code hiện tại

| Năng lực | Vị trí | Dùng cho gói |
|----------|--------|--------------|
| `Task.priority ∈ {low, medium, high}` | `lib/tasks/types.ts:14,44` · badge `components/ui/Chips.tsx:44` | A |
| Sort theo ưu tiên | `lib/tasks/query.ts:145-153` (`sortBoard`) | A |
| Recurrence daily/weekly/monthly | `lib/tasks/types.ts:28-32` · `lib/tasks/recurrence.ts` | D, 0 |
| Trạng thái "đã làm hôm nay" | `lastDoneAt`/`prevDueAt` — `types.ts:55-58` · `query.ts:102-109` | D |
| Nhật ký 60 ngày + streak | `hooks/useStudyLog.ts:59-74` (`isLit`, `streakLength`) | D, C |
| Pomodoro có `taskId` + `attach()` | `lib/tasks/types.ts:114` · `hooks/usePomodoro.ts:38,43,137` | C |
| Hiển thị việc đang gắn phiên | `entrypoints/newtab/App.tsx:142` (`attached`) · `FocusTimer` nhận `taskTitle` | C |
| Nhắc việc theo task | `lib/alarms/scheduler.ts` · `entrypoints/background.ts:33` | B, D |
| Board 4 tab + 3 kiểu sort | `lib/tasks/query.ts:88-89` · `components/FilterRow.tsx:19-23,77-82` | A, B |
| Chuẩn hoá settings (allowlist) | `lib/storage/adapter.ts:129` (`normalizeSettings`) | A, B, C, D |

**Chưa có (phải thêm mới):**

1. `chrome.notifications.onClicked` — hiện chỉ có `chrome.action.onClicked` (`background.ts:87`). Gói B cần
   bấm thông báo để mở đúng "Kế hoạch mai".
2. Lịch sử đóng dấu **theo từng task** — chỉ có `lastDoneAt` (lần gần nhất) → không tính được streak
   theo thói quen nếu không thêm dữ liệu (Gói D).
3. Khái niệm **ngày dự định làm** — `dueAt` là *hạn chót*, không phải *kế hoạch* (Gói B).
4. Bất kỳ UI nào gọi `pomodoro.attach(taskId)` — API có, hiển thị có, **chưa có nút** (Gói C).

## 3. Ràng buộc thiết kế (bắt buộc tôn trọng)

| Ràng buộc | Con số / quy tắc | Hệ quả |
|-----------|------------------|--------|
| `chrome.storage.sync` | 8.192 B/item · ~102 KB tổng · **512 item** · 120 write/phút | **Cấm 1 key/ngày**. Dữ liệu theo ngày phải gom 1 key + prune |
| Giới hạn adapter | `MAX_ITEM_BYTES = 8192` (`lib/storage/adapter.ts:21`) | Mảng lịch sử phải có trần cứng (≤31 phần tử) |
| Popup | 360×560 | Mỗi gói thêm **tối đa 1 khối UI** ở popup; phần còn lại đẩy sang New Tab |
| Sort deterministic (R-15) | overdue → dueAt → priority → createdAt → `id` | Thêm trục mới phải định nghĩa thứ tự, không phá tie-breaker `id` |
| Settings allowlist | `normalizeSettings` chỉ nhận field đã biết | Thêm setting = sửa adapter + test, không tự chảy |
| Intent doc | `BRD`, `SPECIFICATIONS`, `USER_FLOW` mục tiêu | Chỉ đổi qua `/change` + user duyệt |
| Đồng bộ thiết bị | Pomodoro ở `chrome.storage.local` | Gói C là **local-only** — chấp nhận được, phải ghi rõ trong docs |
| Riêng tư | 0 request mạng, không analytics (R-17) | Không có "điểm năng suất" hay telemetry; chỉ số phải suy từ dữ liệu đã lưu |

## 4. Các gói đề xuất

Mỗi gói độc lập về dữ liệu, nhưng cùng phục vụ vòng lặp §1.2.

---

### Gói 0 — Nền tảng thời gian & lặp lại

**Phương pháp:** không trực tiếp — là điều kiện đúng cho B, D, E.

**Mục tiêu:** mọi feature đặt lịch/"hôm nay"/streak phải tính đúng ngày giờ trước khi xây thêm.

**Dữ liệu:** không thêm field; **chuẩn hoá biểu diễn** `dueAt`.

| Loại field | Biểu diễn đúng | Ghi chú |
|------------|----------------|---------|
| `dueAt` (hạn chót, wall-clock) | `YYYY-MM-DDTHH:mm` **local**, không `Z` | Người dùng đặt "8 giờ sáng mai" — phải giữ nguyên 8 giờ dù đổi múi giờ |
| `createdAt`, `updatedAt`, `lastDoneAt` (mốc thời gian) | ISO UTC có `Z` | Là *instant*, so sánh trực tiếp |

**Hành vi:** không đổi UI. Migration một lần: giá trị `dueAt` có hậu tố `Z` → convert sang local wall-clock.

**Module chạm:** `lib/tasks/types.ts` (comment hợp đồng), `lib/datetime.ts`, `lib/tasks/recurrence.ts`,
`lib/tasks/form.ts`, `hooks/useTasks.ts`, test hiện có.

**Sửa kèm (cùng gói):**
- **G3** — weekly recurrence đang cộng +7 ngày và **bỏ qua `weekdays`** (`lib/tasks/recurrence.ts:90-94`).
  Không sửa thì thói quen "T2–T6" (Gói D) sẽ sai ngay.
- **G8** (tuỳ chọn) — tie-breaker giữa `sortTasks` và `sortBoard` chưa nhất quán (`query.ts:139-156`).

**Chi phí:** S. **Rủi ro:** trung bình — đụng dữ liệu cũ, phải có migration + test cho task đã có `dueAt`.

**Nghiệm thu sơ bộ:**
- [x] Task tạo mới ở múi giờ A, mở ở múi giờ B vẫn hiện đúng giờ *đã đặt* (wall-clock).
- [x] Weekly với `weekdays=[1,3,5]` chỉ sinh occurrence đúng các thứ đó.
- [x] Không có task nào bị lệch ngày sau migration (test trên fixture có `Z` và không `Z`).
  (Đóng 2026-11-17 — Gói 0 commit `c890de2`, reviewer STRICT round 2 PASS.)

---

### Gói A — "Việc then chốt" & "Con ếch"

**Phương pháp:** Pareto 80/20 · ABCDE (A) · Eat That Frog.

**Mục tiêu:** người dùng chỉ định được 20% việc quan trọng, và mỗi ngày có **một** việc khó nhất
được đẩy lên đầu để làm trước.

**Dữ liệu (đề xuất):**

```ts
// Task (mở rộng)
keystone?: boolean;   // A-list — tối đa 3 việc đang mở (chỉ cảnh báo, không chặn)
archived?: boolean;   // "Cắt bỏ" (E của ABCDE) — ẩn khỏi tab + chip 20%, xem lại ở "Đã cắt"

// 1 key duy nhất trong chrome.storage.sync (KHÔNG phải 1 key/ngày)
dayPlan: {
  [dayKey: string]: {          // "YYYY-MM-DD"
    frogTaskId: string | null; // con ếch của ngày
    plannedIds: string[];      // ≤ 5 việc đã hẹn cho ngày
  };
};                            // prune còn 14 ngày gần nhất
```

**Hành vi & UI:**
- Trong form/sửa việc: toggle "Việc then chốt" (chỉ hiện với `priority='high'` hoặc tự bật priority Cao).
- Vượt 3 việc then chốt đang mở → **chỉ cảnh báo** ("Đang giữ 4 việc then chốt"), vẫn lưu bình thường.
- Card việc: ribbon "THEN CHỐT"; con ếch có thêm dấu riêng (khác màu, không chỉ khác chữ).
- Lọc: **chip "20%"** bật/tắt trên nền tab hiện tại — **không** thêm tab thứ 5 (4 tab đã kín 360px,
  xem `components/FilterRow.tsx:77-82`).
- "Cắt bỏ" trong menu việc → `archived=true`: ẩn khỏi cả 4 tab và chip 20%, giữ nguyên dữ liệu;
  xem lại + phục hồi ở mục "Đã cắt" (đặt trong panel Cài đặt hoặc cuối tab Đã xong — chốt khi code).
- New Tab: thẻ hero đầu ngày "Con ếch hôm nay" + nút "Tập trung 25 phút" (nối Gói C).
- Cuối ngày: dòng "Then chốt: 2/3 xong" — suy trực tiếp từ dữ liệu, không tính điểm.
- **Review tuần**: một dòng trong New Tab (vd "Tuần này: then chốt 4/5 · 12 việc xong") — **không**
  làm màn riêng ở v1.

**Module chạm:** `lib/tasks/types.ts`, `lib/tasks/form.ts`, `lib/tasks/query.ts` (lọc/sort/`archived`),
`components/TaskFields.tsx`, `components/TaskScroll.tsx`, `components/FilterRow.tsx`,
`components/SettingsPanel.tsx` (mục "Đã cắt"), `entrypoints/newtab/App.tsx` (hero con ếch + dòng tuần),
`hooks/useTasks.ts`, `docs/ERD.md`, `docs/API_SPEC.md`, `docs/USER_FLOW.md`.

**Chi phí:** M (schema + 3 chỗ UI + docs). **Rủi ro:** trung bình — sort/filter là shared (reviewer STRICT).

**Phụ thuộc:** Gói 0 (nếu không, "hôm nay" có thể lệch ngày).

**Nghiệm thu sơ bộ:**
- [ ] Đánh dấu then chốt → xuất hiện ở chip "20%"; bỏ dấu → biến mất, không mất dữ liệu khác.
- [ ] Cảnh báo (không chặn) khi vượt 3 việc then chốt đang mở.
- [ ] Chọn con ếch → thẻ hero hiện đúng; sang ngày mới → con ếch cũ tự hết hiệu lực.
- [ ] "Cắt bỏ" → task biến khỏi 4 tab + chip 20% nhưng vẫn còn trong storage; "Đã cắt" xem lại + phục hồi được.
- [ ] Dòng tổng kết tuần khớp số liệu thật (then chốt xong/tổng, việc xong trong tuần).
- [ ] Sort vẫn deterministic (chạy lại 2 lần cho cùng thứ tự) — R-15.

---

### Gói B — "6P: Tối nay lên kế hoạch mai"

**Phương pháp:** 6P — *Proper Prior Planning Prevents Poor Performance*.

**Mục tiêu:** 10 phút buổi tối biến buổi sáng hôm sau thành thực thi, không phải ra quyết định.

**Dữ liệu (đề xuất):**

```ts
// Task (mở rộng)
plannedFor?: string | null;   // "YYYY-MM-DD" — ngày dự định LÀM (khác dueAt = hạn chót)

// Settings (mở rộng)
planReminder: { enabled: boolean; at: string };  // mặc định { enabled: true, at: "21:00" }
                                                 // → thêm vào DEFAULT_SETTINGS + normalizeSettings
```

**Hành vi & UI:**
- Alarm hằng ngày lúc `planReminder.at` → notification "10 phút lên kế hoạch ngày mai".
  **Mặc định bật sẵn 21:00**; user tắt hoặc đổi giờ trong Cài đặt.
- Cần thêm `chrome.notifications.onClicked` (hiện chưa có) để bấm vào mở đúng sheet — nếu không,
  thông báo chỉ là lời nhắc suông.
- Sheet "Kế hoạch mai": chọn ≤5 việc từ *Sắp tới* + *Chưa hẹn*, gán `plannedFor = mai`, chọn con ếch.
- Tab "Hôm nay" thêm khối "Đã hẹn hôm nay" (khác "Quá hạn" — không tô đỏ).
- Setting mới trong `SettingsPanel` (toggle + giờ), phải thêm vào `normalizeSettings`.

**Module chạm:** `lib/tasks/types.ts`, `lib/storage/adapter.ts:129`, `lib/alarms/scheduler.ts`,
`entrypoints/background.ts`, `components/SettingsPanel.tsx`, `components/FilterRow.tsx`,
`hooks/useTasks.ts`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/USER_FLOW.md`, `docs/PERMISSION.md`
(không thêm quyền — chỉ dùng `alarms`/`notifications` sẵn có).

**Chi phí:** M. **Rủi ro:** trung bình — alarm/notification là đường chạy nền, dễ lỗi im lặng.

**Phụ thuộc:** Gói 0. Nên làm **sau** Gói A (sheet cần khái niệm then chốt để chọn con ếch).

**Nghiệm thu sơ bộ:**
- [ ] Tắt setting → không có notification nào vào giờ nhắc.
- [ ] Bấm notification → mở đúng sheet kế hoạch (không mở tab trống).
- [ ] `plannedFor` không ảnh hưởng hạn chót: quá `plannedFor` mà chưa xong **không** thành "quá hạn".
- [ ] Đổi giờ nhắc → alarm cũ bị clear, alarm mới đúng giờ (không nhân đôi).

---

### Gói C — "Đơn nhiệm" (Single-handling)

**Phương pháp:** Single-handling + Time Chunking (bản nhẹ).

**Mục tiêu:** một phiên tập trung = một việc; giảm chuyển ngữ cảnh; ghi nhận phiên vào nhật ký.

**Dữ liệu:** **không đổi `chrome.storage.sync`.** Dùng `PomodoroState.taskId` đã có
(`lib/tasks/types.ts:120`, `hooks/usePomodoro.ts:173`) — Gói C đã nối UI: `useBoard.startFocusOn` /
`switchTaskMidSession` gọi `attach()`, với `interruptions` là field local mới (`types.ts:127`).

**Hành vi & UI:**
- Nút "Tập trung việc này" trên card → `attach(taskId)` + bắt đầu phiên theo preset.
- Khi đang chạy và có `taskId`: popup chuyển **focus overlay** — đồng hồ bản thu gọn 96px + thẻ việc +
  2 nút (kết thúc / tạm dừng), ẩn board; New Tab thu gọn board thành cột phụ.
- Định tick/đổi việc khác khi đang trong phiên → hỏi "Đang trong phiên, đổi việc sẽ phá tập trung?",
  và nếu vẫn đổi thì đếm 1 lần ngắt (local, chỉ hiện trong tổng kết phiên).
- Hết phiên → hỏi "Xong việc này chưa?" → tick + `record('focus')` (đã có trong `useStudyLog`).

**Module chạm** (đồng bộ `changed.files` đã phát hành trong `spec/test-scope/current.json`, scopeVersion 23):
`hooks/usePomodoro.ts`, `hooks/useBoard.ts`, `hooks/useStudyLog.ts`, `lib/tasks/types.ts`,
`components/FocusTimer.tsx`, `components/TaskScroll.tsx`, `components/TaskScrollList.tsx`,
`entrypoints/popup/App.tsx`, `entrypoints/newtab/App.tsx`, `styles/board.css`,
`src/__tests__/helpers/chrome-stub.ts` (đã có `storage.local`; scope 23 ghi nhầm `src/test/chrome-stub.ts`, đã sửa ở scope 24 — xem §9.5). Artifact phát hành kèm:
`SPECIFICATIONS.md`, `spec/updates/2026-11-17-single-handling-focus.md`. Focus overlay nằm ở
`styles/board.css` (không phải `styles/components.css`); reconcile `docs/USER_FLOW.md` và các as-built
doc khác là công việc đóng gói theo acceptance của change doc, không nằm trong `changed.files` của code.

**Chi phí:** **S–M** (rẻ nhất trong 6 gói). **Rủi ro:** thấp — `chrome.storage.local`, không chạm schema sync.

**Phụ thuộc:** không. Có thể chạy **song song** Gói 0.

**Nghiệm thu sơ bộ:**
- [x] Gắn việc → đóng popup, mở lại vẫn thấy đúng việc đang gắn (state bền qua `endsAt`).
- [x] Trong phiên, board không còn bấm được (không tick nhầm việc khác).
- [x] Kết thúc phiên → `studyLog.focus` tăng đúng 1, không tăng khi phiên bị bỏ dở.
- [x] Không có taskId → hành vi giống hệt hiện tại (không hồi quy).
  (Đóng 2026-11-17 — phase 1 `02e3737` + phase 2 `aa3c78a` STRICT PASS; details §9.)

---

### Gói D — "Thói quen 21 ngày"

**Phương pháp:** 21 ngày / rèn thói quen (đọc kèm ghi chú trung thực §1.3).

**Mục tiêu:** biến việc lặp thành **thói quen có streak riêng**, không lẫn với chuỗi học chung.

**Dữ liệu (đề xuất):**

```ts
// Task (mở rộng, chỉ dùng khi recurrence.kind !== 'none')
habit?: {
  startedAt: string;      // ISO UTC
  doneDays: string[];     // "YYYY-MM-DD", tối đa 31 phần tử (~350 B) — an toàn cho 8 KB/item
};
```

Lý do để trên `Task` thay vì key riêng: 1 task = 1 key đã có, không tốn item budget (512 item).

**Hành vi & UI:**
- Toggle "Theo dõi như thói quen" khi bật lặp lại.
- Card thói quen: lưới 21 ô (đủ/thiếu/không thuộc lịch), streak hiện tại, seal mốc 7 → 14 → 21.
- Streak tính **theo lịch của thói quen** (T2–T6 chỉ tính T2–T6) → phụ thuộc G3/Gói 0.
- `StudyLog` giữ nguyên vai trò chuỗi học chung; thói quen chỉ bổ sung, không thay.

**Module chạm:** `lib/tasks/types.ts`, `lib/tasks/recurrence.ts`, `lib/tasks/form.ts`,
`components/TaskFields.tsx`, `components/TaskScroll.tsx`, `components/StreakCard.tsx`,
`hooks/useTasks.ts`, `docs/ERD.md`, `docs/USER_FLOW.md`.

**Chi phí:** M–L (logic lịch + UI lưới + docs). **Rủi ro:** trung bình — sai lịch = streak sai,
người dùng mất niềm tin nhanh hơn mọi lỗi khác.

**Phụ thuộc:** Gói 0 **bắt buộc** (G3).

**Nghiệm thu sơ bộ:**
- [ ] Thói quen lặp T2–T6: thứ Bảy/CN không bị tính là "thiếu" và không đứt streak.
- [ ] Bỏ tick một ngày đã qua (trong 31 ngày) → streak tính lại đúng.
- [ ] `doneDays` không vượt 31 phần tử sau 60 ngày dùng liên tục.
- [ ] Tắt toggle thói quen → dữ liệu `doneDays` không bị xoá (chỉ ẩn).

---

### Gói E — Time Blocking / Chunking (khuyến nghị **hoãn**)

**Phương pháp:** gom việc tương đồng vào khối 60–90 phút không bị ngắt.

**Mục tiêu:** biến danh sách việc thành **thời khoá biểu** trong ngày.

**Dữ liệu (nếu làm):** `blockStart?: string; blockEnd?: string` (local wall-clock) hoặc
`plannedFor` + `estimateMin` + `startAt`.

**Vì sao hoãn:**
- Cần timeline + kiểm tra chồng lấn + kéo-thả → chỉ sống được ở New Tab, không vừa popup 360px.
- Chi phí gấp nhiều lần B+C; giá trị phụ thuộc vào việc B đã được dùng thật.
- Rủi ro cao nhất trong 6 gói (drag/drop + responsive + dữ liệu thời gian).

**Bản nhẹ nếu cần làm sớm:** chỉ thêm "giờ bắt đầu" cho việc đã `plannedFor` và hiển thị danh sách
theo giờ trong New Tab — **không** lưới calendar, **không** kéo-thả.

**Nghiệm thu sơ bộ (bản nhẹ):**
- [ ] Việc có giờ bắt đầu hiện đúng thứ tự trong ngày; việc không giờ nằm cuối.
- [ ] Không cho lưu khối chồng lấn (cảnh báo, không tự sửa dữ liệu người dùng).

## 5. Quyết định đã chốt

| Ngày | Quyết định | Lý do |
|------|-----------|-------|
| 2026-11-16 | **ABCDE: giữ 3 mức ưu tiên + nhãn A/B/C**, không thêm enum 5 mức | D/E là *hành động* (tự động hoá / cắt bỏ), không phải mức ưu tiên; 5 mức chạm form 360px, badge, sort, notification, docs, tests mà lợi ích thấp |
| 2026-11-16 | Ghi **toàn bộ 6 gói** vào tài liệu trước, chưa code | User muốn hoàn thiện bộ tài liệu trước khi mở change |
| 2026-11-16 | `plannedFor` **tách khỏi** `dueAt` | `dueAt` = hạn chót (có nhắc + tô quá hạn); dùng lẫn sẽ phá nghĩa deadline và gây nhắc sai |
| 2026-11-16 | **A1:** tối đa **3** việc then chốt đang mở, **chỉ cảnh báo** (không chặn lưu) | Chặn cứng dễ gây bí khi user có 4 việc thật; cảnh báo đủ giữ kỷ luật "20%" |
| 2026-11-16 | **A2:** lối vào 20% là **chip bật/tắt** trên nền tab, không thêm tab thứ 5 | Ribbon 4 tab đã kín 360px; thêm tab sẽ phải thu gọn/cắt chữ → đụng R-19 |
| 2026-11-16 | **A3:** "Cắt bỏ" (E) = **archive** (`archived=true`, ẩn khỏi tab, xem lại ở "Đã cắt") | Xoá vĩnh viễn làm mất vế E của ABCDE; archive giữ dữ liệu và cho phục hồi |
| 2026-11-16 | **B1:** nhắc kế hoạch **21:00, bật sẵn** | Có nhắc ngay từ đầu thì 6P mới có tác dụng; user tắt được trong Cài đặt |
| 2026-11-16 | **B2:** review tuần = **một dòng trong New Tab**, không màn riêng ở v1 | Rẻ, không thêm view/navigation; đủ để thấy tỉ lệ then chốt |
| 2026-11-16 | **C1:** focus overlay ở **cả popup (bản thu gọn) + New Tab** | Popup là nơi mở nhiều nhất — bỏ qua popup thì đơn nhiệm mất tác dụng |
| 2026-11-16 | **D1:** `doneDays` giữ **31 ngày** rồi prune | ~350 B/task, an toàn 8 KB/item; đủ lưới 21 ô + streak gần |

## 6. Thứ tự & ưu tiên đề xuất

| # | Gói | Impact | Effort | Risk | Phụ thuộc | Reviewer |
|---|-----|--------|--------|------|-----------|----------|
| 0 | Nền tảng (G6 + G3) | Cao (chặn trên) | S | Trung bình | — | STRICT (schema/data) |
| 1 | **C — Đơn nhiệm** | Cao | **S–M** | Thấp | — | NORMAL |
| 2 | **A — Then chốt + Con ếch** | **Rất cao** | M | Trung bình | Gói 0 | STRICT (shared query) |
| 3 | **B — 6P kế hoạch tối** | **Rất cao** | M | Trung bình | Gói 0, A | NORMAL |
| 4 | D — Thói quen 21 ngày | Cao | M–L | Trung bình | Gói 0 (G3) | STRICT (recurrence) |
| 5 | E — Time blocking | Trung bình | L | Cao | B | STRICT |

**Lý do thứ tự:** `0 → C → A → B → D → (E sau)`.

- **0 trước hết**: không chuẩn hoá `dueAt` thì "hôm nay"/"mai"/streak đều có thể lệch ngày.
- **C trước A/B**: rẻ, không đổi schema, và tạo chỗ ngồi cho "con ếch" (nút tập trung). Nếu làm A trước
  mà chưa có C thì con ếch chỉ là nhãn.
- **A trước B**: sheet kế hoạch tối cần khái niệm then chốt để chọn con ếch; làm ngược sẽ phải sửa sheet.
- **D sau cùng trong nhóm chính**: phụ thuộc G3 và là gói nặng nhất về logic lịch.
- **E chỉ sau khi B có dữ liệu dùng thật.**

## 7. Câu hỏi đã chốt (2026-11-16)

Bảy câu dưới đây **đã được user chốt**; giữ nguyên văn câu hỏi để tra cứu, kèm phương án đã chọn và
hệ quả kỹ thuật. Không còn câu hỏi mở nào chặn Gói 0 hoặc Gói C.

| # | Câu hỏi ban đầu | Đã chốt | Hệ quả kỹ thuật |
|---|-----------------|---------|-----------------|
| 1 | Số việc then chốt tối đa: 3 hay 5? Chặn cứng hay chỉ cảnh báo? | **3, chỉ cảnh báo** | Không cần đếm cứng ở adapter; UI hiện nhắc khi >3 nhưng vẫn lưu; có test cho trạng thái 4 việc |
| 2 | Chip "20%" bật/tắt trên nền tab hay thêm tab thứ 5? | **Chip bật/tắt** | Không đụng `RibbonTabs`; thêm một trạng thái lọc trong `FilterRow`; giữ nguyên 4 tab ở 360px |
| 3 | Giờ nhắc kế hoạch mặc định: 21:00 hay để trống? | **21:00, bật sẵn** | `DEFAULT_SETTINGS.planReminder = { enabled: true, at: '21:00' }`; `normalizeSettings` điền mặc định cho settings cũ → **user cũ sẽ nhận notification mới sau update**, phải ghi release note |
| 4 | Focus overlay ở đâu: chỉ New Tab hay cả popup? | **Cả popup + New Tab** | Popup dùng `FocusTimer` bản thu gọn (96px) + thẻ việc + 2 nút; cần test layout 360px và trạng thái đóng/mở lại popup giữa phiên |
| 5 | "Cắt bỏ" (E): archive/ẩn hay chỉ xoá? | **Archive, ẩn khỏi tab** | Thêm `archived?: boolean`; `filterByBoard`/`filterBySubject`/`searchTasks` phải loại archived; `loadAll` vẫn trả về để xem lại → mọi chỗ hiển thị đều phải lọc, tránh "task ma" |
| 6 | Review tuần: màn riêng hay một dòng? | **Một dòng trong New Tab** | Không thêm view; tính từ `dayPlan` 7 ngày + task done → hàm thuần + test, không lưu số liệu tổng hợp |
| 7 | Giữ `doneDays` bao lâu trước prune? | **31 ngày** | Sau mỗi lần ghi: `doneDays = doneDays.slice(-31)`; test đóng dấu 60 ngày liên tục vẫn ≤ 31 phần tử |

## 8. Phụ lục — lệch doc↔code liên quan

Các mục dưới đây **không thuộc** roadmap này; chúng là đầu vào cho một lượt reconcile as-built riêng
(theo quy tắc `docs/INDEX.md`: as-built reconcile khi code đổi, kèm `file:line`).

| ID | Lệch | Evidence | Ảnh hưởng gói nào |
|----|------|----------|-------------------|
| G3 | ~~Weekly recurrence bỏ qua `weekdays`, chỉ +7 ngày~~ → **ĐÃ ĐÓNG** 2026-11-17: `nextWeekdayOffset` chọn offset 1..7, fallback +7 | `lib/tasks/recurrence.ts:88-102,125-131`; commit `c890de2` | 0, D (nền tảng) |
| G6 | ~~`dueAt` trộn local `YYYY-MM-DDTHH:mm` và UTC `toISOString()`~~ → **ĐÃ ĐÓNG** 2026-11-17: canonical wall-clock + migration in-memory khi đọc | `lib/datetime.ts`, `lib/storage/adapter.ts`; commit `fc9e26e` | 0, B, D, E |
| G7 | `onChanged` reload toàn bộ, không merge theo `updatedAt` | `hooks/useTasks.ts:102-128` | đa thiết bị (mọi gói) |
| G8 | ~~Tie-breaker `sortTasks` vs `sortBoard` chưa nhất quán~~ → **ĐÃ ĐÓNG** 2026-11-17: `compareById` là tie-breaker cuối cho mọi key | `lib/tasks/query.ts:139-167`; commit `c890de2` | A (đã có sẵn nền tảng) |
| G9 | Hạng mục R-19 responsive/menu/motion còn mở | `docs/DESIGN.md` §Known Gaps | ảnh hưởng layout mọi gói |
| G10 | **Double-focus giữa popup & New Tab** (kế thừa phase 1, xem §9.3) | `hooks/usePomodoro.ts` local storage, 2 surface hydrate độc lập | C (follow-up), mọi gói có background session |

Ngoài ra (doc drift thuần, không chặn roadmap):

| Doc | Lệch |
|-----|------|
| `docs/API_SPEC.md` | Line ref trong §3.3/§3.5 đã cũ; mô tả `sortDoneTasks`/`filterTasks`/`Tab` (đã bị xoá) |
| `docs/DESIGN.md` | Bảng responsive 1024–1199px ghi 3 cột, code là 2 cột (`entrypoints/newtab/style.css`) |
| `docs/PERMISSION.md` | Ghi icon 16/48/128, manifest có 16/32/48/128 (`wxt.config.ts`) |
| `docs/generated/inventory.md` | Stale (git `0e2a674`, 0 file) — cần chạy lại tooling |
| `docs/INDEX.md` | Trỏ `DESIGN.md` nguồn `.context/design-spec.md` (legacy: cobalt/cool-gray, 360×600) |

## 9. Follow-up kỹ thuật sau Gói C (cập nhật 2026-11-17)

> Đây là phần **đối chiếu thực tế**, không đổi requirement. Nguồn: FUP-001
> (`spec/changes/2026-11-17-package-c-residual-accuracy.md`).

### 9.1 Số dòng — cần đính chính

Số liệu đo bằng `wc -l` — cột giữa tại commit `e75ec48` (close Gói C), cột cuối sau FUP-001:

| File | Tại `e75ec48` | Sau FUP-001 | Trước Gói C | Kết luận |
|---|---|---|---|---|
| `hooks/usePomodoro.ts` | 196 | 196 | — | **Không vượt 300** — residual cũ nói "hook vượt ngưỡng" là không chính xác |
| `hooks/useBoard.ts` | 257 | 272 | — | **Không vượt 300** (FUP-001 thêm `detachFocus`) |
| `entrypoints/popup/App.tsx` | 313 | 318 | 256 | Vượt 300 **mới ở phase 2 Gói C**; FUP-001 +5 |
| `entrypoints/newtab/App.tsx` | 400 | 405 | 345 | Đã vượt 300 **từ trước**, Gói C +55, FUP-001 +5 |
| `components/FocusTimer.tsx` | 193 | 205 | — | Dưới 300 (FUP-001 thêm nút detach) |
| `components/FocusConfirms.tsx` | 59 | 65 | — | Dưới 300 (FUP-001 thêm dialog detach) |

Hành động: giữ nguyên code (không refactor ngoài scope), nhưng ghi đúng nguồn gốc ở bảng này và trong
task residual. Việc tách `popup/App.tsx` xuống ≤300 dòng đưa vào backlog kỹ thuật riêng, không chặn gói A.

### 9.2 Responsive — mức kiểm chứng hiện tại

Test hiện tại chỉ asserts **CSS-contract** (tên class `.board-grid--focus`, breakpoint, `minmax(0,…)`)
chứ **chưa đo layout trong Chrome thật** ở 360/1024/1199. Đây là residual thật, không phải "đã xong".

Kế hoạch: mỗi gói có UI mới (bắt đầu từ Gói A) phải kèm 1 lượt eyeball/screenshot Chrome ở
**360×560, 1024×768, 1280×800** trước khi reviewer PASS; ghi kết quả vào task file. Với Gói C, gắn
lượt đo này vào FUP-001 (khi môi trường browser có sẵn) — không tự coi là đã xong.

### 9.3 G10 — double-focus giữa hai surface (kế thừa phase 1)

Phase 1 đã có `chrome.storage.local.onChanged` hydration, nhưng vẫn có cửa sổ race: popup và New Tab
mở cùng lúc, cả hai có thể cùng nhận natural completion và gọi `record('focus', 1)` hai lần.
Đây là **kế thừa từ phase 1**, không do phase 2 gây ra; reviewer phase 2 xác nhận không làm nặng thêm.

Kế hoạch xử lý (ưu tiên trước Gói A vì A thêm luồng chấm điểm/tuần):
1. Thêm `focusSessionId: string` vào `PomodoroState` (local), sinh mới mỗi lần `start()` focus.
2. `pendingCompletion` trong `useBoard` mang theo `focusSessionId`; `confirmFocusCompletion` chỉ gọi
   `record('focus')` nếu id khớp và chưa tiêu thụ (idempotency key trong ref/local).
3. Test 2 hook instance cùng hydrate từ 1 local store → chỉ 1 `record('focus')`.
4. Reviewer STRICT + verify 4 lệnh; cập nhật G10 → đóng trong roadmap §8.

### 9.4 Nút huỷ gắn (`attach(null)`)

R-20 đã cho phép `attach(null)` nhưng Gói C chỉ có API + test hook, chưa có nút UI riêng. FUP-001 bổ sung
nút **"Huỷ gắn việc"** trong focus overlay (popup + New Tab), đi cùng xác nhận "đổi việc" và
`noteInterruption()` — đúng ngữ nghĩa "đổi việc gắn" đã chốt ở phase 1. Không đổi R-20, không bump
`spec_version`; chỉ cập nhật `scopeVersion` 23 → 24.

### 9.5 Sai đường dẫn stub trong scope

`spec/test-scope/current.json` scope 23 ghi `src/test/chrome-stub.ts`; file thật trên disk là
`src/__tests__/helpers/chrome-stub.ts` (đã có `storage.local` + `onChanged`). FUP-001 phát hành scope 24
với đường dẫn đúng; roadmap §4 Gói C và task phase 1 cũng được sửa cho nhất quán.

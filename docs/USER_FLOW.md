# User Flows — Todo Extension

> **Derived doc.** Các luồng người dùng chính, suy ra từ [`SPECIFICATIONS.md`](../SPECIFICATIONS.md)
> (R-01…R-20) + [`.context/design-spec.md`](../.context/design-spec.md) (interaction model §8).
> Đây là mô tả hành vi mục tiêu; đối chiếu code thật khi validate. Đổi behavior → qua `/change`.
> Gói A (R-21, spec 1.4.0) đã as-built: xem §12 — bật/tắt then chốt, chọn ếch, cắt bỏ/phục hồi.
> Gói B (R-22, spec 1.5.0) đã as-built: xem §13 — nhắc 21:00, sheet "Kế hoạch mai", "Đã hẹn hôm nay".
> Gói D (R-23, spec 1.6.0) đã as-built: xem §14 — streak riêng, picker thứ, lưới 21 ô trên Bàn học.

## 0. Bối cảnh

Popup **360×560**, tên **Học Đường**, mở từ icon extension trên toolbar. Không route/URL; trong popup
điều hướng gồm **danh sách việc ↔ panel Cài đặt**; chi tiết việc là **tờ giấy overlay** đè lên danh sách
(không phải trang riêng). Ngôn ngữ tiếng Việt, bảng màu **Sơn Mài light-only**.

New Tab là **mặt thứ hai của cùng board** (cùng token/component, chỉ khác bố cục). Settings có
`displayMode` `popup · newtab · auto`:
- `Popup` → icon mở popup; tab mới hiện trang chào yên tĩnh (`QuietNewTab`) với nút "Mở sổ Học Đường".
  Ngoại lệ R-22: nếu tab mới mở từ cờ notification "Kế hoạch mai", board hiện sheet dù đang ở chế độ này.
- `New Tab` → tab mới là board toàn màn hình; icon mở/focus tab Học Đường.
- `Tự động` (mặc định) → icon mở popup, tab mới mở board.

## 1. Mở popup & xem danh sách (R-15, R-16, R-18)

1. Bấm icon extension → popup mở ở **danh sách việc**. **Không autofocus** khi mở (design-spec mong đợi
   focus sẵn — chưa implement); bấm `n` để focus ô ghi việc.
2. Đọc `chrome.storage.sync` → render list; nếu chậm > 50ms hiện skeleton 4 row.
3. Header hiện `{n} việc đang chờ, {m} quá hạn.` (`aria-live="polite"`); không còn việc chờ → "Sổ đang thảnh thơi."
4. Sort mặc định: `deadline`; tie-breaker cố định overdue → dueAt → priority → createdAt (đổi được ở §6).
5. List rỗng → empty state theo đúng lý do (6 biến thể): `fresh` (sổ trắng) · `today` · `upcoming` ·
   `done` · `search` · `subject` (môn chưa có việc).

## 2. Thêm task (R-01, R-05, R-07, R-09, R-10)

**Nhanh (ô ghi việc):**
1. Gõ title vào ô "Hôm nay con cần làm gì?" → `Enter` hoặc bấm **"Ghi"**.
2. `Enter` **IME-safe**: đang bộ gõ chọn chữ (tiếng Việt/CJK) thì không ghi việc.
3. Title rỗng/toàn trắng → lỗi inline, không tạo. > 200 ký tự → lỗi + counter.
4. Hợp lệ → tạo Task (`id` uuid, `priority=medium`, `done=false`) → ghi 1 key → input clear, task enter animation.

**Đầy đủ (mở rộng tại chỗ, giữ draft):**
1. Bấm nút mũi tên cạnh ô ghi → mở rộng; field gồm **Môn học** (`subjectId`, "Chưa xếp môn" nếu bỏ trống),
   Hạn chót (date + time), Ưu tiên (Thấp/Vừa/Cao), Lặp lại, Ghi chú, Thẻ (≤5), Việc nhỏ (≤50 bước).
2. Lặp ≠ none mà chưa có hạn → lỗi "Cần đặt hạn để tính lần lặp tiếp theo", submit disabled.
3. Nút ghi đổi nhãn **"Ghi vào sổ"** → ghi storage; "Thu gọn chi tiết" giữ draft.

## 3. Hoàn thành task (R-04, R-11)

**Task thường:**
1. Tick checkbox ở row → `done=true`, đóng **triện son**; title **giữ nguyên chữ** (không line-through,
   không làm mờ) — trạng thái nói bằng triện + nhãn "XONG", không chỉ bằng màu; xoá alarm.
2. Row rời tập đang lọc nếu tab đó không hiển thị việc đã xong → focus chuyển row kế tiếp.
   Bấm lại triện = bỏ hoàn thành.

**Task lặp:**
1. Tick → giữ `id`, `done=false`, đóng dấu **done-today** (`lastDoneAt`): chip **"đã làm hôm nay"**
   (bền qua reload, sang ngày kế tự hết); `prevDueAt` lưu hạn vừa đóng dấu và hạn **cuộn ngay** tới
   occurrence kế — hạn kế tiếp hiển thị ở chip hạn chót riêng.
2. Bấm lại = **hoàn tác hôm nay** (khôi phục `prevDueAt`); hạn **không** bị cuộn thêm.
3. Không lưu lịch sử occurrence; alarm đặt lại cho occurrence kế.

## 4. Sửa task (R-02, R-06, R-08)

1. Bấm title row → mở **tờ giấy detail** overlay (focus vào field đầu tiên).
2. Sửa field; footer hiện "Có thay đổi chưa lưu" khi dirty. Công tắc **"Việc then chốt"** nằm cùng
   tờ (bật tự đẩy ưu tiên Cao, tắt không hạ) — xem §12.1.
3. `Lưu` hoặc `Cmd/Ctrl+Enter` → ghi storage (1 write) → đóng panel, focus về row.
4. Tick subtask ghi ngay, **không** đổi task cha.
5. Back khi dirty → dialog "Bỏ thay đổi?" (nút an toàn "Giữ lại" focus mặc định).
6. Task bị xoá từ thiết bị khác khi đang mở → panel báo "Việc này đã bị xoá ở thiết bị khác", không cho lưu đè.

## 5. Xoá task (R-03) + Hoàn tác

1. Trong detail bấm "Xoá việc" → dialog xác nhận (mô tả xoá khỏi mọi thiết bị).
2. "Xoá" → xoá key + clear alarm → đóng panel về list.
3. Toast "Đã xoá việc" + "Hoàn tác" — toast **giữ tới khi dismiss hoặc chọn hành động**
   (không tự hết sau N giây, không phải soft-delete): "Hoàn tác" ghi lại task với `id` cũ + đặt lại alarm.

## 6. Tìm / lọc / sắp xếp (R-15)

1. Bấm icon search (hoặc `/`) → ô tìm kiếm thay chỗ ô chọn môn; gõ → lọc **live, không debounce**
   theo title/note/tag.
2. Ribbon 4 tab: `Tất cả · Hôm nay · Sắp tới · Đã xong` (mỗi tab kèm số việc; `←/→` điều hướng).
   Chip **"20%"** (R-21) là toggle nằm **trên nền tab hiện tại**, không phải tab thứ 5 — xem §12.1.
3. Menu **môn học** (popup không có cột Giá sách): `Cả giá sách` / từng môn / `Chưa xếp môn`.
4. Menu sort: `Hạn chót` / `Ưu tiên` / `Mới nhất`; tie-breaker theo **từng lựa chọn**:
   - `Hạn chót` → quá hạn trước → `dueAt` gần nhất → priority → `createdAt`.
   - `Ưu tiên` → priority (cao trước) → `dueAt` gần nhất → `createdAt`.
   - `Mới nhất` → `createdAt` giảm dần, **không** tie-breaker phụ (task trùng `createdAt` có thể đổi
     thứ tự — gap **G8**).
5. `Escape` đóng lần lượt: menu → search → panel.

## 7. Nhắc việc (R-09, R-12)

1. Task có `dueAt > now` && `!done` → background tạo alarm `due:<id>`.
2. Đến hạn alarm fire → notification (title + note ≤60 ký tự + hạn).
3. Notification không tự đổi trạng thái task.
4. `dueAt ≤ now` → không tạo alarm, task hiển thị "Quá hạn".
5. Notification bị chặn ở Chrome/OS → Settings hiện hint + nút copy địa chỉ cài đặt.

## 8. Đồng bộ đa thiết bị (R-13)

1. Thiết bị A sửa task → ghi `chrome.storage.sync`.
2. Thiết bị B nhận `storage.onChanged`:
   - Tab đang mở: **reload toàn bộ** board + **reschedule** alarm (không merge từng field theo `updatedAt`
     — gap **G7** trong `BRD.md`).
   - Background: xử lý **từng key** thay đổi để đặt/clear alarm.
   - Key bị xoá → xoá local + clear alarm.
   - `settings` đổi → **resync alarm** (theo `notificationsEnabled`) và **áp `displayMode`**
     (popup/newtab/auto); không có theme để áp.
3. Pomodoro là state **local**, không đồng bộ giữa các thiết bị.

## 9. Cài đặt (R-14, R-16)

1. Bấm icon settings → panel Cài đặt thay chỗ danh sách việc trong cùng popup; back quay lại danh sách.
2. Nội dung thật (`settings`, 9 field — R-22 thêm `planReminder`):
   - `notificationsEnabled` — bật/tắt nhắc việc; trạng thái "Đang bật" / "Đang bị chặn" + hint.
   - `displayMode` — `Popup · New Tab · Tự động` (§0).
   - `quillStyle` — `pen · hand` (nét bút).
   - `quillEffect` — hiệu ứng mực khi gõ.
   - `ornaments` — hoa văn trang trí.
   - `lacquerSheen` — ánh sơn trên mặt bàn.
   - `pomodoroPreset` — `25/5 · 50/10`.
   - `soundEnabled` — chuông + tiếng giấy.
   - `planReminder` — bật/tắt nhắc "Kế hoạch mai" + giờ `HH:mm` (mặc định 21:00, bật sẵn) — §13.1.
   - **Đã cắt** (R-21) — mục xem lại các việc `archived=true` + nút "Phục hồi" (§12.3).
3. **Không có lựa chọn theme**: bảng màu Sơn Mài light-only, không `system/light/dark`, không `data-theme`.
4. Mỗi thay đổi ghi `settings` (1 write) và áp ngay; đổi `notificationsEnabled` → resync alarm.
5. Dung lượng đồng bộ (optional): `x KB / 100 KB` + bar (ẩn nếu API lỗi, không fake số).

## 10. Lỗi quota (R-16)

1. Ghi vượt giới hạn storage → adapter ném `StorageQuotaError`.
2. Banner `role=alert` dưới ô ghi việc: "Bộ nhớ đồng bộ đầy. Việc mới chưa lưu." + Thử lại / Ẩn.
3. Task chưa lưu vẫn trong RAM, đánh dấu trong banner; không nuốt lỗi.
4. "Ẩn" thu banner thành icon cảnh ở header (vẫn còn dấu hiệu); lỗi mới thì hiện lại.

## 11. Phiên tập trung đơn nhiệm (R-20)

> As-built sau Gói C. `PomodoroState.taskId` + `interruptions` chỉ nằm ở `chrome.storage.local`;
> không đổi schema `chrome.storage.sync`, không thêm permission/network (R-17).

1. Trên thẻ việc bấm **"Tập trung việc này"** (`.focus-task-button`) → `attach(taskId)` rồi `start()`.
   Việc đang gắn được viền vàng `article[data-focus-active='true']`; đóng/mở popup giữa phiên vẫn thấy
   đúng việc (state bền qua `endsAt`).
2. Khi `running && phase === 'focus' && taskId`: popup thay toàn bộ board bằng **focus overlay** (dial
   112px + thẻ việc + "Tạm dừng" / "Kết thúc"), New Tab đưa "Bàn học" lên cột chính và thu cuộn việc
   thành cột phụ (`.board-grid--focus`). Không có taskId → giao diện/hành vi y hệt §1–§10.
3. Trong phiên, bấm "Tập trung việc này" ở việc khác, hoặc tick việc khác → hộp thoại
   **"Đổi việc đang tập trung? / Đang trong phiên, đổi việc sẽ phá tập trung?"** (nút "Đổi việc" /
   "Giữ việc cũ"). "Giữ việc cũ" → không đổi, không đếm. "Đổi việc" → `interruptions += 1`
   (local-only); số này hiện ở tổng kết phiên, **không** ghi `StudyLog`, **không** sync thiết bị.
4. **Kết thúc tự nhiên** (đếm về 0) có taskId → hỏi **"Xong việc này chưa?"** (confirm "Xong rồi" /
   cancel "Chưa xong", kèm số lần đổi việc trong phiên).
   - "Xong rồi" → tick việc (task lặp đi theo R-11, §3) **và** `record('focus', 1)` đúng một lần.
   - "Chưa xong" → không tick, không ghi focus, coi như bỏ dở.
5. **Bỏ dở / rời phiên** → không tính `focus`:
   - Overlay "Kết thúc" = `reset()` (xoá `taskId` + `interruptions`, dừng đồng hồ, **không** sang giờ
     nghỉ, **không** gọi completion) — khác với nút "Bỏ qua"/skip ở bản đầy.
   - "Tạm dừng" giữ nguyên phiên; bấm reset sau đó vẫn là bỏ dở.
   - `skip` (bản đầy) dùng `advance('skip')` → **không** gọi completion, không tăng `studyLog.focus`.
   - Đóng popup mà không xác nhận → phiên vẫn chạy ở `chrome.storage.local`; không ghi focus.
6. `interruptions` khởi tạo 0 khi bắt đầu phiên focus mới, bị xoá khi reset/skip/kết thúc phiên —
   không tồn tại ngoài phiên. Việc đã xoá khi đang mở overlay → hiện "Việc không còn tồn tại" thay vì
   crash.

## 12. Gói A — Việc then chốt & Con ếch (R-21, spec 1.4.0)

> As-built sau Gói A. `Task.keystone?` / `Task.archived?` mặc định `false`; `dayPlan` là **1 key**
> `chrome.storage.sync` prune 14 ngày, **khác** `PomodoroState` local của R-20 (§11). Xem
> [`ERD.md`](ERD.md) §2.1, §2.8 và [`API_SPEC.md`](API_SPEC.md) §3.3, §3.5.

### 12.1 Bật/tắt then chốt → chip "20%"

1. Trong ô ghi mở rộng hoặc tờ giấy chi tiết, bật công tắc **"Việc then chốt"** (`role="switch"`,
   nhãn "Đang giữ then chốt" / "Không then chốt"): **bật tự gán `priority='high'`** (nhãn A),
   **tắt KHÔNG tự hạ** priority. Đây chỉ là nhãn lọc, không thêm mức ưu tiên.
2. Tổng then chốt đang mở (`!done && !archived && keystone`) vượt **3** → hiện dòng cảnh báo inline
   "Đang giữ N việc then chốt" (`role="status"`). **Chỉ cảnh báo, vẫn lưu bình thường** — không chặn
   submit, không tự bớt việc (`lib/tasks/form.ts:45-54`).
3. Trên dải lọc, chip **"20%"** (`aria-pressed`, `aria-label="Chỉ hiện việc then chốt (20%)"`) là
   toggle xếp **trên nền tab hiện tại**: bật → chỉ hiện việc `keystone && !archived` của tab đó;
   tắt → hiện lại như cũ. Ribbon vẫn **4 tab**, không thêm tab thứ 5; thứ tự sort vẫn deterministic
   theo R-15 (§6).

### 12.2 Chọn ếch từ thẻ bài → hero New Tab → tập trung

1. Trên thẻ bài, cùng hàng chip, bấm **"Chọn ếch"** → `selectFrog(dayKey hôm nay, taskId)` ghi vào
   `dayPlan[dayKey].frogTaskId` (1 key, prune 14 ngày). Cùng ngày chọn việc khác → thay thế; bấm lại
   đúng việc đang là ếch → bỏ chọn (`null`).
2. Ribbon **"THEN CHỐT"** (vàng kim) và dấu ếch **khác màu LẪN khác chữ**: đang là ếch hiện
   "Ếch hôm nay" (ngọc lục), chưa chọn hiện "Chọn ếch" (trung tính). Cả hai nằm chung một fragment
   chip nên bản compact (popup) và full (New Tab) có cùng số con trong `data-chip-row`.
3. New Tab hiện hero **"Con ếch hôm nay"** với tên việc + nút **"Tập trung 25 phút"**. Sang ngày
   local mới entry cũ tự hết hiệu lực (hero rỗng); việc bị cắt → hero hiện "Đã cắt · …", việc đã xoá
   → hero rỗng — không crash.
4. Nút **"Tập trung 25 phút"** gọi lại `startFocusOn(id)` của Gói C (§11) — **không tạo phiên focus
   thứ hai**. Nếu đang trong phiên focus và chọn việc khác, hiện xác nhận "Đổi việc đang tập trung?":
   "Giữ việc cũ" → không đổi, không đếm; "Đổi việc" → `interruptions += 1` (local-only, R-20).
5. Hai dòng tổng kết (New Tab) suy thuần từ dữ liệu, **không lưu số tổng hợp, không điểm số**:
   "Then chốt: x/y xong" (hôm nay) và "Tuần này: then chốt a/b · n việc xong" (Thứ 2 local → hiện
   tại). Mốc "xong" lấy `lastDoneAt` (nếu có) hoặc `updatedAt` khi `done=true`.

### 12.3 "Cắt bỏ" → "Đã cắt" → phục hồi

1. Trong tờ giấy chi tiết (`TaskParchment`) bấm **"Cắt bỏ"** → đặt `archived=true`; **giữ nguyên
   dữ liệu** trong key `t:<id>` (không xoá key, không xoá note/tag/subtask/lịch sử).
2. Việc lập tức biến khỏi 4 tab, chip "20%", tìm kiếm, mọi bộ đếm/empty-state/danh sách môn — và
   **alarm bị clear** (`shouldCreateAlarm` từ chối `archived`), nên không còn nhắc dù `dueAt` còn.
3. Vào **Cài đặt → "Đã cắt"** (có ở cả popup và New Tab) → danh sách việc đã cắt, bấm **"Phục hồi"**
   → `archived=false`, dữ liệu giữ nguyên và alarm được đặt lại nếu hạn vẫn > now.

## 13. Gói B — Kế hoạch mai (R-22, spec 1.5.0)

> As-built 2026-11-18. `plannedFor` là **ngày dự định LÀM**, không phải hạn chót; `dueAt` vẫn là
> nguồn duy nhất của alarm/quá hạn/sort R-15. Không thêm permission, không network, không tab thứ 5.

### 13.1 Nhắc buổi tối

1. Mặc định `Settings.planReminder = { enabled: true, at: '21:00' }` — **bật sẵn**; settings cũ thiếu
   field cũng nhận mặc định này (người dùng cũ sẽ thấy notification mới sau update). Có thể tắt hoặc
   đổi giờ trong **Cài đặt → "Kế hoạch mai (6P)"** (toggle + ô giờ `HH:mm`, giá trị sai bị bỏ qua).
2. Khi bật, background giữ **đúng 1** alarm `plan:tomorrow` ở giờ local `at` (one-shot, tự resync
   sau mỗi lần fire để không trôi sau đổi DST). Tắt → xoá alarm, **không** có notification; đổi giờ →
   clear alarm cũ rồi tạo alarm mới, không nhân đôi.
3. Đến giờ → notification **"Lên kế hoạch ngày mai"** / "10 phút lên kế hoạch ngày mai.". Bấm vào
   notification → ghi cờ `planSheetRequest` (local) rồi mở/focus bảng Học Đường; New Tab đọc cờ **1
   lần** lúc mount và mở thẳng sheet — không ra tab trống. Bấm notification việc đến hạn (`due:*`)
   vẫn đi luồng cũ, không mở sheet.

### 13.2 Sheet "Kế hoạch mai" và khối "Đã hẹn hôm nay"

1. Nút **"Kế hoạch mai"** ở đầu bảng (hoặc bấm notification) mở sheet. Nguồn việc: đang mở, chưa
   cắt, và **chưa hẹn** (không `dueAt`) hoặc **sắp tới** (`dueAt > now`) — hạn trong quá khứ không
   được đưa vào chọn lại.
2. Chọn **tối đa 5** việc (chọn cái thứ 6 bị chặn); với mỗi việc đã chọn có radio **"Làm đầu tiên
   (ếch cho mai)"**. Bấm **"Lưu kế hoạch"** → gán `plannedFor = ngày mai` (theo giờ local) cho các
   việc đã chọn và ghi ếch qua `dayPlan[ngày mai].frogTaskId` — **cùng 1 key `dayPlan`** của R-21,
   không aggregate mới, không đổi `dueAt`. Chưa chọn việc nào thì nút Lưu bị vô hiệu.
3. Trên **board Học Đường (New Tab)**, tab **"Hôm nay"** hiện khối **"Đã hẹn hôm nay"** liệt kê việc
   có `plannedFor = hôm nay`, còn mở và chưa cắt (popup 360×560 chỉ nhận 1 khối UI mới — mục cài đặt
   nhắc). Khối này đọc như một lịch hẹn: **không tô đỏ như việc quá hạn**; việc quá `plannedFor` mà
   chưa xong vẫn không vào nhóm quá hạn và không làm đổi thứ tự sort.

## 14. Gói D — Thói quen 21 ngày

> As-built 2026-11-18 (commit `ba82621` + `2af694d`, spec 1.6.0). `Task.habit?` là sổ **opt-in**
> nhúng trong key `t:<id>` — không key storage mới, không phải lịch sử occurrence của R-11. Streak
> này độc lập `StudyLog`/chuỗi học chung (xem [`ERD.md`](ERD.md) §2.1,
> [`API_SPEC.md`](API_SPEC.md) §3.7).

### 14.1 Bật theo dõi & chọn lịch

1. Trong ô ghi mở rộng / tờ giấy chi tiết, chỉ khi **Lặp lại ≠ "Không"** (`recurrence.kind !== 'none'`)
   hiện field **"Theo dõi thói quen"** với switch `.habit-switch` (`role="switch"` /
   `aria-checked`, nhãn "Không theo dõi thói quen" / "Đang theo dõi thói quen"). Bật → gán
   `habit.startedAt = now` (ISO UTC) + `doneDays = []`; **tắt chỉ ẩn**, dữ liệu vẫn nằm trong task.
2. Khi chọn **"Hàng tuần"**, field lặp hiện thêm picker **7 thứ** `.habit-weekday`
   (`CN · T2 · T3 · T4 · T5 · T6 · T7`, `aria-pressed` theo `rule.weekdays`): bấm để bật/bớt thứ,
   thứ cuối còn lại bị `disabled` ("Phải giữ ít nhất một thứ") — không thể bỏ trống lịch. Chọn ít
   nhất một thứ; thứ không chọn là **ngoài lịch**. Với `daily`/`monthly` không có picker thứ.
3. Lịch luôn đánh giá theo rule **hiện tại**: đổi thứ/ngày/kind có thể làm streak đổi dù chưa có lần
   hoàn thành mới — chấp nhận. Ngày trước `startedAt` (ngày local suy từ ISO UTC) không thuộc lịch.

### 14.2 Ghi ngày, hoàn tác & bỏ dấu

1. Tick việc lặp đang theo dõi → R-11 vẫn cuộn hạn như cũ; **ngày ghi vào `doneDays` là ngày local của
   `dueAt` cũ** (bằng `prevDueAt` ngay sau lần tick), **không** phải `dueAt` mới của occurrence kế.
   Ngày đã rơi khỏi cửa sổ 31 ngày gần nhất thì **không ghi** (không đẩy ngày mới hơn ra); occurrence
   mang ngày tương lai (tick sớm) **vẫn được ghi**. Chip "đã làm hôm nay" của R-11 và streak R-23 là
   hai tín hiệu riêng, có thể cùng hiện sau một lần tick muộn.
2. Bấm lại đang done-today (hoàn tác R-11) → gỡ đúng ngày đó khỏi `doneDays`.
3. Trên **Bàn học New Tab**, trong thẻ "Thói quen", bấm vào ô **đã làm** để **bỏ dấu** ngày đó →
   streak tính lại ngay. Thao tác này **chỉ đổi `doneDays`**: không đụng `dueAt`, `lastDoneAt`/
   `prevDueAt` hay alarm; không cho thêm tay ngày chưa làm. Bỏ dấu ngày đã gỡ là no-op.
4. Tắt toggle, đổi lặp về "Không" hoặc **"Cắt bỏ"** (`archived`) → streak/lưới chỉ **ẩn**; bật lại
   hoặc phục hồi dùng lại `doneDays` cũ. Mọi ghi vẫn là một lần `put(task)`; lỗi quota → banner R-16,
   không nuốt lỗi.

### 14.3 Thẻ "Thói quen" trên Bàn học

1. New Tab (cột "Bàn học") hiện thẻ **"Thói quen"** với **tối đa 3** thói quen đang theo dõi, sắp theo
   streak giảm dần rồi tên việc. Mỗi thói quen có tên, dòng "Chuỗi N ngày" và **lưới 21 ô liên tiếp
   kết thúc hôm nay**, mỗi ô một trạng thái: **đã làm / thiếu / ngoài lịch** (ngày không thuộc lịch
   không tính là thiếu, không đứt streak). Popup 360×560 **không** thêm khối thẻ này — chỉ có toggle
   trong form và một badge "Chuỗi N ngày" nhỏ trên dòng meta của thẻ việc.
2. Seal **7 → 14 → 21** hiện khi streak đạt mốc; sau 21 streak tiếp tục tăng. Copy đi kèm nói rõ
   **"21 ô là cửa sổ hiển thị, chuỗi có thể dài hơn"** và **"21 ngày là mốc ăn mừng, không phải kết
   luận khoa học"** (mốc văn hoá, không phải kết luận thực nghiệm về thời gian hình thành thói quen).
3. Vì cửa sổ lưu trữ 31 ngày, streak hiển thị không vượt quá 31 ngày lịch — UI nói rõ lưới chỉ 21 ô
   còn streak có thể dài hơn.

> **Motion:** Gói D **không thêm animation mới** — badge, switch, ô lưới và seal đổi trạng thái tức
> thì như phần còn lại của hệ; `prefers-reduced-motion: reduce` kế thừa cài đặt toàn cục
> (`styles/base.css`: token `--dur-*` về `0.01ms`). Keyboard map bên dưới **giữ nguyên**, không thêm
> shortcut mới.

## Keyboard map

| Phím | Hành vi |
|------|---------|
| `n` | Focus ô ghi việc |
| `/` | Mở tìm kiếm |
| `Escape` | Đóng/back: menu → search → detail/panel. **Bị bỏ qua khi focus overlay đang chạy** (R-20) |
| `Enter` (ô ghi việc) | Ghi việc — IME-safe (không ghi khi đang bộ gõ) |
| `Cmd/Ctrl+Enter` (detail) | Lưu detail |
| `←` / `→` | Điều hướng ribbon tab + segmented control |
| `↑` / `↓` | Điều hướng trong menu (môn học, sort) |
| `Space` (checkbox) | Tick/bỏ tick |
| `Enter`/`Space` (title) | Mở detail |

> Shortcut đơn (`n`, `/`) không kích hoạt khi focus đang trong input/textarea. Không shortcut xoá (tránh tai nạn).
> Khi `focusActive` (R-20), cả ba phím `n` / `/` / `Escape` đều bị bỏ qua để không thoát overlay ngoài
> ý muốn; chỉ dùng nút "Tạm dừng" / "Kết thúc" trên overlay.

## Motion

- **State-driven**, không autoplay, không loop trang trí: chỉ chuyển động khi trạng thái đổi
  (đóng triện, mở/đóng panel, ghi việc).
- Token thời lượng: `--dur-nib 120ms` (nét bút) · `--dur-fast 140ms` (phản hồi nhanh) ·
  `--dur-ink 180ms` (mực) · `--dur-slide 240ms` (chuyển panel) · triện đóng 240ms · `--dur-dry 800ms`
  (mực khô sau khi đóng dấu); easing `ease-out` / `ease-ink`.
- `prefers-reduced-motion: reduce` tắt toàn bộ transition/animation (`styles/base.css:153-168`).
- Focus overlay (R-20) chỉ đổi trạng thái: dial dùng vòng tiến độ 900ms linear như bản đầy, không thêm
  animation lặp; vẫn tuân `prefers-reduced-motion` như phần còn lại.
- Settings `quillEffect=false` → `data-quill='off'` tắt hiệu ứng mực khi gõ.

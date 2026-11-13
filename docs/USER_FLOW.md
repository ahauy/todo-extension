# User Flows — Todo Extension

> **Derived doc.** Các luồng người dùng chính, suy ra từ [`SPECIFICATIONS.md`](../SPECIFICATIONS.md)
> (R-01…R-19) + [`.context/design-spec.md`](../.context/design-spec.md) (interaction model §8).
> Đây là mô tả hành vi mục tiêu; đối chiếu code thật khi validate. Đổi behavior → qua `/change`.

## 0. Bối cảnh

Popup **360×560**, tên **Học Đường**, mở từ icon extension trên toolbar. Không route/URL; trong popup
điều hướng gồm **danh sách việc ↔ panel Cài đặt**; chi tiết việc là **tờ giấy overlay** đè lên danh sách
(không phải trang riêng). Ngôn ngữ tiếng Việt, bảng màu **Sơn Mài light-only**.

New Tab là **mặt thứ hai của cùng board** (cùng token/component, chỉ khác bố cục). Settings có
`displayMode` `popup · newtab · auto`:
- `Popup` → icon mở popup; tab mới hiện trang chào yên tĩnh (`QuietNewTab`) với nút "Mở sổ Học Đường".
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
2. Sửa field; footer hiện "Có thay đổi chưa lưu" khi dirty.
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
2. Nội dung thật (`settings`, 8 field):
   - `notificationsEnabled` — bật/tắt nhắc việc; trạng thái "Đang bật" / "Đang bị chặn" + hint.
   - `displayMode` — `Popup · New Tab · Tự động` (§0).
   - `quillStyle` — `pen · hand` (nét bút).
   - `quillEffect` — hiệu ứng mực khi gõ.
   - `ornaments` — hoa văn trang trí.
   - `lacquerSheen` — ánh sơn trên mặt bàn.
   - `pomodoroPreset` — `25/5 · 50/10`.
   - `soundEnabled` — chuông + tiếng giấy.
3. **Không có lựa chọn theme**: bảng màu Sơn Mài light-only, không `system/light/dark`, không `data-theme`.
4. Mỗi thay đổi ghi `settings` (1 write) và áp ngay; đổi `notificationsEnabled` → resync alarm.
5. Dung lượng đồng bộ (optional): `x KB / 100 KB` + bar (ẩn nếu API lỗi, không fake số).

## 10. Lỗi quota (R-16)

1. Ghi vượt giới hạn storage → adapter ném `StorageQuotaError`.
2. Banner `role=alert` dưới ô ghi việc: "Bộ nhớ đồng bộ đầy. Việc mới chưa lưu." + Thử lại / Ẩn.
3. Task chưa lưu vẫn trong RAM, đánh dấu trong banner; không nuốt lỗi.
4. "Ẩn" thu banner thành icon cảnh ở header (vẫn còn dấu hiệu); lỗi mới thì hiện lại.

## Keyboard map

| Phím | Hành vi |
|------|---------|
| `n` | Focus ô ghi việc |
| `/` | Mở tìm kiếm |
| `Escape` | Đóng/back: menu → search → detail/panel |
| `Enter` (ô ghi việc) | Ghi việc — IME-safe (không ghi khi đang bộ gõ) |
| `Cmd/Ctrl+Enter` (detail) | Lưu detail |
| `←` / `→` | Điều hướng ribbon tab + segmented control |
| `↑` / `↓` | Điều hướng trong menu (môn học, sort) |
| `Space` (checkbox) | Tick/bỏ tick |
| `Enter`/`Space` (title) | Mở detail |

> Shortcut đơn (`n`, `/`) không kích hoạt khi focus đang trong input/textarea. Không shortcut xoá (tránh tai nạn).

## Motion

- **State-driven**, không autoplay, không loop trang trí: chỉ chuyển động khi trạng thái đổi
  (đóng triện, mở/đóng panel, ghi việc).
- Token thời lượng: `--dur-nib 120ms` (nét bút) · `--dur-fast 140ms` (phản hồi nhanh) ·
  `--dur-ink 180ms` (mực) · `--dur-slide 240ms` (chuyển panel) · triện đóng 240ms · `--dur-dry 800ms`
  (mực khô sau khi đóng dấu); easing `ease-out` / `ease-ink`.
- `prefers-reduced-motion: reduce` tắt toàn bộ transition/animation (`styles/base.css:152-167`).
- Settings `quillEffect=false` → `data-quill='off'` tắt hiệu ứng mực khi gõ.

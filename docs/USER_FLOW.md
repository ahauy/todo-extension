# User Flows — Todo Extension

> **Derived doc.** Các luồng người dùng chính, suy ra từ [`SPECIFICATIONS.md`](../SPECIFICATIONS.md)
> (R-01…R-18) + [`.context/design-spec.md`](../.context/design-spec.md) (interaction model §8).
> Đây là mô tả hành vi mục tiêu; đối chiếu code thật khi validate. Đổi behavior → qua `/change`.

## 0. Bối cảnh

Popup 360×600 mở từ icon extension trên toolbar. Không route/URL; điều hướng 1 cấp panel
(list ↔ detail ↔ settings), dialog đè lên. Ngôn ngữ tiếng Việt, app title **"Việc"**.

## 1. Mở popup & xem danh sách (R-15, R-16, R-18)

1. Bấm icon extension → popup mở, focus vào ô composer (gõ được ngay).
2. Đọc `chrome.storage.sync` → render list; nếu chậm > 50ms hiện skeleton 4 row.
3. Header hiện subtitle `{n} đang làm, {m} quá hạn`.
4. Sort mặc định: overdue → dueAt gần → priority cao → createdAt mới.
5. List rỗng → empty state tương ứng tab (5 biến thể).

## 2. Thêm task (R-01, R-05, R-07, R-09, R-10)

**Nhanh (collapsed):**
1. Gõ title vào ô "Thêm việc" → `Enter` hoặc bấm `+`.
2. Title rỗng/toàn trắng → lỗi inline, không tạo. > 200 ký tự → lỗi + counter.
3. Hợp lệ → tạo Task (`id` uuid, `priority=medium`, `done=false`) → ghi 1 key → input clear, task enter animation.

**Đầy đủ (expanded):**
1. Bấm nút "Thêm chi tiết" → composer mở rộng tại chỗ (giữ draft).
2. Chọn priority (Thấp/Vừa/Cao), hạn (date + time), lặp lại, tag (≤5), subtask (≤50).
3. Lặp ≠ none mà chưa có hạn → lỗi "Cần đặt hạn để tính lần lặp tiếp theo", submit disabled.
4. "Thêm việc" → ghi storage; "Thu gọn" giữ draft.

## 3. Hoàn thành task (R-04, R-11)

**Task thường:**
1. Tick checkbox ở row → `done=true`, title line-through, xoá alarm.
2. Ở tab "Đang làm" row biến mất → focus chuyển row kế tiếp.

**Task lặp:**
1. Tick → giữ `id`, `done=false`, `dueAt` dời tới lần kế > now (catch-up tối đa 1000 vòng).
2. Tạo alarm mới cho lần kế; không lưu lịch sử occurrence.

## 4. Sửa task (R-02, R-06, R-08)

1. Bấm title row → mở panel detail (focus ô title).
2. Sửa field; footer hiện "Có thay đổi chưa lưu" khi dirty.
3. `Lưu` hoặc `Cmd/Ctrl+Enter` → ghi storage (1 write) → đóng panel, focus về row.
4. Tick subtask ghi ngay, **không** đổi task cha.
5. Back khi dirty → dialog "Bỏ thay đổi?" (nút an toàn "Giữ lại" focus mặc định).
6. Task bị xoá từ thiết bị khác khi đang mở → panel báo "Việc này đã bị xoá ở thiết bị khác", không cho lưu đè.

## 5. Xoá task (R-03) + Hoàn tác (P2)

1. Trong detail bấm "Xoá việc" → dialog xác nhận (mô tả xoá khỏi mọi thiết bị).
2. "Xoá" → xoá key + clear alarm → đóng panel về list.
3. Toast "Đã xoá việc" + "Hoàn tác" (6 giây) → hoàn tác ghi lại task với `id` cũ. (P2: có thể cắt.)

## 6. Tìm / lọc / sắp xếp (R-15)

1. Bấm icon search (hoặc `/`) → row search mở; gõ → lọc live (debounce 120ms) theo title/note/tag.
2. Tab Tất cả / Đang làm / Đã xong (segmented, arrow keys điều hướng).
3. Menu sort: Hạn chót / Ưu tiên / Mới nhất; menu tag: lọc theo tag (OR nhiều tag).
4. `Escape` đóng lần lượt: menu → search → panel.

## 7. Nhắc việc (R-09, R-12)

1. Task có `dueAt > now` && `!done` → background tạo alarm `due:<id>`.
2. Đến hạn alarm fire → notification (title + note ≤60 ký tự + hạn).
3. Notification không tự đổi trạng thái task.
4. `dueAt ≤ now` → không tạo alarm, task hiển thị "Quá hạn".
5. Notification bị chặn ở Chrome/OS → Settings hiện hint + nút copy địa chỉ cài đặt.

## 8. Đồng bộ đa thiết bị (R-13)

1. Thiết bị A sửa task → ghi `chrome.storage.sync`.
2. Thiết bị B nhận `storage.onChanged`:
   - Key `t:<id>` đổi → merge theo `updatedAt` (mới hơn thắng) → cập nhật UI + reschedule alarm.
   - Key bị xoá → xoá local + clear alarm.
   - `settings` đổi → áp theme mới.

## 9. Cài đặt (R-14, R-16)

1. Bấm icon settings → panel Cài đặt.
2. Giao diện: radio Theo hệ thống / Sáng / Tối → áp ngay (`data-theme`), ghi settings (1 write).
3. Nhắc việc: trạng thái "Đang bật" / "Đang bị chặn" + hint.
4. Dung lượng đồng bộ (optional): `x KB / 100 KB` + bar (ẩn nếu API lỗi, không fake số).

## 10. Lỗi quota (R-16)

1. Ghi vượt giới hạn storage → adapter ném `StorageQuotaError`.
2. Banner `role=alert` dưới composer: "Bộ nhớ đồng bộ đầy. Việc mới chưa lưu." + Thử lại / Ẩn.
3. Task chưa lưu vẫn trong RAM, đánh dấu trong banner; không nuốt lỗi.
4. "Ẩn" thu banner thành icon cảnh ở header (vẫn còn dấu hiệu); lỗi mới thì hiện lại.

## Keyboard map (tóm tắt — design-spec §8.1)

| Phím | Hành vi |
|------|---------|
| `n` | Focus composer |
| `/` | Mở search |
| `Escape` | Đóng menu → search → panel |
| `Enter` (composer) | Thêm việc |
| `Space` (checkbox) | Tick/bỏ tick |
| `Enter/Space` (title) | Mở detail |
| `Cmd/Ctrl+Enter` (detail) | Lưu |

> Shortcut đơn (`n`, `/`) không kích hoạt khi focus đang trong input/textarea. Không shortcut xoá (tránh tai nạn).

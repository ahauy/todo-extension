# Permissions & Data Handling — Todo Extension

> **As-built doc.** Project **không có hệ thống role/guard phía server** (không backend — xem
> [`BRD.md`](BRD.md)). File này thay cho template "Roles & Guard Order" gốc: mô tả **quyền Chrome
> extension** + **cách xử lý dữ liệu**, dùng trực tiếp cho tab **Privacy** khi đăng Chrome Web Store.
> Nguồn sự thật: `wxt.config.ts` (manifest permissions) + code gọi API. Nếu lệch → code thắng.

## 0. Tuyên bố quyền (manifest)

```jsonc
// wxt.config.ts → manifest
{
  "permissions": ["storage", "alarms", "notifications"]
}
```

- **Không** `host_permissions` → không truy cập nội dung trang web.
- **Không** content script → không inject/chạy code trên trang đang mở (R-17, R-18).
- **Không** `tabs`, `webRequest`, `cookies`, `identity`, hay quyền network nào.
- **Không** remote code, không eval, không tải script ngoài.

## 1. Justification từng quyền (cho Chrome Web Store)

| Quyền | Dùng để làm gì | Bằng chứng code | Vì sao cần |
|-------|----------------|-----------------|-----------|
| `storage` | Lưu task + settings trong `chrome.storage.sync`, đồng bộ theo tài khoản Chrome | `lib/storage/adapter.ts` (get/set/remove/onChanged) | Lưu trữ dữ liệu todo cục bộ + đồng bộ đa thiết bị; không có backend thay thế |
| `alarms` | Đặt nhắc việc bền vững tên `due:<id>`, sống qua vòng đời service worker MV3 | `lib/alarms/scheduler.ts`, `entrypoints/background.ts:65` | `setTimeout` không bền khi SW bị kill; alarm là cách MV3 chuẩn để nhắc đúng hạn |
| `notifications` | Hiện thông báo nhắc việc khi alarm fire (title + note rút gọn + hạn) | `entrypoints/background.ts:31` (`notifyTask`) | Hiển thị nhắc việc cho người dùng; không thể tự vẽ notification nếu không có quyền |

> Cả 3 quyền đều **tối thiểu và trực tiếp** phục vụ tính năng cốt lõi. Không quyền nào dùng cho
> mục đích khác (tracking, quảng cáo, thu thập dữ liệu).

## 2. Data handling (tab Privacy)

| Khía cạnh | Thực tế |
|-----------|---------|
| Dữ liệu thu thập | Task (title, note, priority, tag, subtask, due, recurrence) + settings (theme, notificationsEnabled) — **do người dùng tự nhập** |
| Nơi lưu | `chrome.storage.sync` (trong trình duyệt + đồng bộ qua tài khoản Chrome của chính người dùng) |
| Truyền ra ngoài | **Không** — không network request, không server riêng, không third-party |
| Analytics / tracking | **Không** |
| Quảng cáo | **Không** |
| Bán/chia sẻ dữ liệu | **Không** |
| Remote code | **Không** |
| Xoá dữ liệu | Xoá task trong popup = xoá key khỏi storage; gỡ extension = Chrome xoá dữ liệu extension |

**Single purpose:** quản lý todo cá nhân ngay trong trình duyệt (capture, nhắc việc, đồng bộ).
Mọi quyền và dữ liệu đều phục vụ đúng mục đích này.

## 3. "Role" thực tế

| Role | Mô tả | Nguồn |
|------|-------|-------|
| Local user (duy nhất) | Toàn quyền trên dữ liệu của chính mình trong trình duyệt | Không có enum/seed — client-only |

Không có `ADMIN`/`USER`/`GUEST`, không middleware guard, không ownership check phía server,
không rate-limit phía server. Giới hạn ghi (120 write/phút) là **giới hạn nền tảng của
`chrome.storage.sync`**, không phải guard tự cài (xem [`ERD.md`](ERD.md) §4).

## 4. Lưu ý trước khi đăng Web Store

- ⚠️ **Icon còn thiếu:** manifest chưa khai `icons`, `background.ts:33` tham chiếu
  `icons/icon-48.png` không tồn tại → cần bổ sung icon (16/32/48/128) trước khi upload
  (gap G5, [`API_SPEC.md`](API_SPEC.md) §5).
- Tab Privacy: dán justification mục 1 + data handling mục 2.
- Không cần khai báo data collection vì không truyền dữ liệu ra ngoài trình duyệt.

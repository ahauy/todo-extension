# Business Requirements Document (BRD) — Todo Extension

> **Intent doc.** Yêu cầu nghiệp vụ của project. Nguồn: [`BRIEF.md`](../BRIEF.md) +
> [`SPECIFICATIONS.md`](../SPECIFICATIONS.md) (`spec_version 1.2.0`, brainstorm 2026-11-10).
> Thay đổi yêu cầu đi qua `/change` (agent `change-request`) + user duyệt — không sửa tay để khớp code.
> Khác biệt code↔intent ghi ở [`API_SPEC.md`](API_SPEC.md) §5 (gap register), không hạ cấp intent ở đây.

---

## Project Overview

**Project Name:** Todo Extension
**Version:** 1.0
**Date:** 2026-11-11
**Author:** ahauy (sinh từ BRIEF.md + brainstorm)

## Business Context

**Problem Statement:**
Người dùng cá nhân cần ghi nhanh việc phải làm ngay khi đang lướt web, không muốn rời trình duyệt
hay mở một app todo riêng. Các giải pháp hiện có hoặc quá nặng (app riêng, account, backend) hoặc
không nhắc việc đúng lúc. Cần một todo **nhẹ, tức thì, riêng tư** nằm ngay trong Chrome.

**Business Objectives:**
- Cho phép capture + quản lý task trong < 1 thao tác mở popup.
- Nhắc việc đúng hạn mà không cần app chạy nền phức tạp.
- Đồng bộ giữa các thiết bị dùng cùng tài khoản Chrome, không cần server riêng.
- Quyền tối thiểu, không thu thập dữ liệu — riêng tư tuyệt đối (client-only).

**Success Metrics:**
- Mở popup hiển thị dữ liệu **< 100ms** (máy tham chiếu Apple Silicon, ~50 task) — R-18.
- Manifest chỉ **3 quyền** (`storage`, `alarms`, `notifications`), không network — R-17.
- 0 request mạng, 0 content script → không ảnh hưởng trang web đang mở.

---

## Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| Product Owner / Developer | ahauy | Quyết định + triển khai (project cá nhân) |
| End User | Người dùng cá nhân | Dùng popup quản lý việc hằng ngày |

> Project cá nhân, không có team nhiều vai trò. Không có admin/operator riêng.

---

## Scope

### In Scope
- Quản lý task: thêm / sửa / xoá / tick hoàn thành (R-01…R-04).
- Thuộc tính task: ưu tiên, ghi chú, tag, subtask, due date + giờ, quy tắc lặp (R-05…R-10).
- Nhắc việc qua `chrome.alarms` + `chrome.notifications` (R-11, R-12).
- Đồng bộ đa thiết bị qua `chrome.storage.sync` (R-13).
- UI: bảng màu Sơn Mài **light-only** (không dark mode), lọc/tìm/sắp xếp, empty state, lỗi quota (R-14…R-16, R-19).
- Popup React **360×560** tên **Học Đường**, tiếng Việt; Settings có display mode `popup · newtab · auto`
  (New Tab là mặt thứ hai của cùng board), quill/ornament/sound/pomodoro (R-14, R-19).

### Out of Scope
- Backend / server / database / network request (R-17).
- Options page full-page (cài đặt vẫn nằm trong panel của popup), onboarding, export/import (design-spec §1).
- Cộng tác nhiều người, chia sẻ task, phân quyền.
- Lịch sử occurrence của task lặp (R-11 không lưu).
- Notification UI tuỳ biến (do Chrome vẽ, không style được).
- Đa ngôn ngữ (hiện chỉ tiếng Việt).

---

## Functional Requirements

> Mapping đầy đủ R-01…R-19 trong [`SPECIFICATIONS.md`](../SPECIFICATIONS.md). Dưới đây tóm tắt theo module.

### Module 1: Quản lý task
- **FR-001 (R-01):** Tạo task — title bắt buộc (trim, 1–200 ký tự), mặc định `priority=medium`,
  `done=false`. Title rỗng → không tạo, lỗi inline. *Priority: High.*
- **FR-002 (R-02):** Sửa title/note/priority/tags/subtasks/due/recurrence; cập nhật `updatedAt`. *High.*
- **FR-003 (R-03):** Xoá task + xoá alarm tương ứng. *High.*
- **FR-004 (R-04):** Tick/bỏ tick hoàn thành; quản lý alarm theo trạng thái. *High.*
- **FR-005 (R-05):** Ưu tiên `low/medium/high`, sort được high→low. *Medium.*
- **FR-006 (R-06):** Ghi chú ≤ 1000 ký tự, rút gọn ở row, đầy đủ ở detail. *Medium.*
- **FR-007 (R-07):** Tag ≤ 5 (mỗi tag 1–20 ký tự), lọc + tìm theo tag. *Medium.*
- **FR-008 (R-08):** Subtask ≤ 50, tiến độ `done/total`; không tự tick cha/con. *Medium.*

### Module 2: Thời gian & nhắc việc
- **FR-009 (R-09):** Due date + giờ (`dueAt`); quá hạn hiển thị overdue. *High.*
- **FR-010 (R-10):** Lặp `none/daily/weekly/monthly`; weekly chọn thứ, monthly chọn ngày;
  tính theo **múi giờ local**. *High.*
- **FR-011 (R-11):** Tick task lặp → giữ `id`, `done=false`, đóng dấu **done-today** (`lastDoneAt` = lúc bấm,
  chip "đã làm hôm nay" chỉ hiện trong ngày và bền qua reload; sang ngày kế chip tự hết, việc vẫn ở trạng
  thái mở), lưu hạn vừa đóng dấu vào `prevDueAt` và **cuộn `dueAt` ngay** tới occurrence kế (`nextFutureDue`);
  thẻ hiện thêm hạn kế tiếp ở chip hạn chót. Bấm lại = **hoàn tác hôm nay** (khôi phục `prevDueAt`, không cuộn
  thêm lần nữa). Không lưu lịch sử occurrence. *High.*
- **FR-012 (R-12):** Alarm `due:<id>` cho task `dueAt > now && !done` → notification. *High.*
- **FR-013 (R-13):** Đồng bộ `storage.onChanged`, merge theo `updatedAt`, xử lý xoá từ thiết bị khác. *High.*
  → Code hiện tại **chưa** merge theo `updatedAt` (xem gap **G7**).

### Module 3: UI & trải nghiệm
- **FR-014 (R-14):** Giao diện Sơn Mài **light-only** — một bảng màu tông sáng duy nhất, không có theme
  `system/light/dark`, không `light-dark()`, không `data-theme`. Settings thật (8 field):
  `notificationsEnabled`; `displayMode` (`popup · newtab · auto`); `quillStyle` (`pen · hand`);
  `quillEffect`; `ornaments`; `lacquerSheen`; `pomodoroPreset` (`25/5 · 50/10`); `soundEnabled`. *Medium.*
- **FR-015 (R-15):** 4 tab lọc `Tất cả · Hôm nay · Sắp tới · Đã xong`; lọc theo môn học
  (`Cả giá sách` / từng môn / `Chưa xếp môn`); search title/note/tag; sort **chọn được**
  `deadline | priority | created`, tie-breaker theo **từng tiêu chí**: `Hạn chót` → overdue → `dueAt` →
  priority → `createdAt`; `Ưu tiên` → priority → `dueAt` → `createdAt`; `Mới nhất` → `createdAt` giảm dần,
  **không** tie-breaker phụ (task trùng `createdAt` có thể đổi thứ tự) → gap **G8**. *High.*
- **FR-016 (R-16):** Empty state, banner lỗi quota (không nuốt lỗi), hint notification bị chặn. *Medium.*

---

## Non-Functional Requirements

| Category | Requirement | Nguồn |
|----------|------------|-------|
| Performance | Mở popup < 100ms (~50 task); không chạy code trên trang web | R-18 |
| Bundle | Popup JS mục tiêu ≤ 120 KB gzip; không font mạng, không UI/animation lib | design-spec §14 |
| Privacy / Security | Không network, không content script, không host_permissions; dữ liệu chỉ trong Chrome | R-17 |
| Permissions | Tối thiểu: `storage`, `alarms`, `notifications` | R-17 |
| Storage | Chịu giới hạn `chrome.storage.sync`: 100 KiB tổng, 8 KiB/item, 512 item, 120 write/phút | SPEC §Scalability |
| Accessibility | WCAG 2.1 AA (contrast đã đo), keyboard đầy đủ, focus management, reduced-motion | design-spec §10 |
| Compatibility | Chrome MV3 hiện đại; không dùng `light-dark()`/`color-mix()` → không phụ thuộc mốc Chrome ≥ 123 | styles/tokens.css, design-spec O4 |
| Reliability | Alarm bền qua vòng đời service worker; resync khi install/startup | scheduler.ts, background.ts |

---

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| Local user (duy nhất) | Toàn quyền trên dữ liệu của chính mình trong trình duyệt |

> **Không có hệ thống role/auth riêng.** Đồng bộ dựa trên tài khoản Chrome đang đăng nhập
> (`chrome.storage.sync`). Không có admin, không có guest, không có ownership check phía server
> (vì không có server). Chi tiết quyền extension: [`PERMISSION.md`](PERMISSION.md).

---

## Business Rules

- **BR-001 (R-08):** Tick hết subtask KHÔNG tự tick task cha; tick cha không đổi subtask (tránh hành vi ngầm).
- **BR-002 (R-11):** Task lặp khi tick done giữ nguyên `id`, `done=false`, đóng dấu **done-today**
  (`lastDoneAt`, `prevDueAt`) và **cuộn `dueAt` ngay** tới occurrence kế; thẻ hiện chip "đã làm hôm nay"
  cùng hạn kế tiếp (hiển thị bằng chip hạn chót) và alarm được đặt lại cho occurrence đó — không bao giờ
  ở trạng thái "lặp nhưng không có nhắc"; sang ngày kế chip "đã làm hôm nay" tự hết.
- **BR-003 (R-10):** Mọi tính ngày dùng múi giờ **local thiết bị**; đổi múi giờ có thể lệch ngày nhắc — chấp nhận (client-only).
  Hiện `dueAt` tồn tại hai dạng (local không `Z` khi tạo, UTC có `Z` sau khi việc lặp cuộn occurrence) → gap **G6**;
  yêu cầu local-time vẫn giữ nguyên, không hạ cấp.
- **BR-004 (R-12):** Notification không tự đổi trạng thái task; `dueAt ≤ now` không tạo alarm (hiển thị overdue).
- **BR-005 (R-13):** Xung đột đồng bộ giải quyết **last-write-wins theo `updatedAt`**. Code hiện tại chưa
  merge theo `updatedAt` → gap **G7**.
- **BR-006 (R-16):** Lỗi quota phải hiển thị rõ, không nuốt; task chưa lưu được đánh dấu trong banner.
- **BR-007 (design-spec §5.1):** Không autosave từng keystroke (giới hạn 120 write/phút) — chỉ ghi khi Lưu/toggle.

---

## Constraints

- **Technical:** Chrome Extension Manifest V3; WXT + React 19 + TypeScript + Tailwind v4;
  `chrome.storage.sync` (không DB); service worker cho alarm.
- **Budget:** Không dịch vụ trả phí, không backend, không third-party API.
- **Platform:** Chỉ Chrome (MV3). Phát hành qua Chrome Web Store (upload zip thủ công).
- **Regulatory/Privacy:** Không thu thập dữ liệu cá nhân ra ngoài trình duyệt; không analytics, không tracking.

---

## Assumptions

- Người dùng đăng nhập tài khoản Chrome để đồng bộ đa thiết bị (nếu không, dữ liệu chỉ cục bộ).
- Quy mô dữ liệu cá nhân: ≤ ~50 task thường xuyên, tối đa ~512 (giới hạn Chrome).
- Thiết bị chạy Chrome MV3 hiện đại; không còn phụ thuộc mốc Chrome ≥ 123 vì bảng màu light-only
  không dùng `light-dark()`/`color-mix()`.
- Người dùng cho phép notification ở cấp Chrome/OS để nhắc việc hiện.

---

## Open Questions

> Các gap code↔intent đã ghi ở [`API_SPEC.md`](API_SPEC.md) §5 — cần quyết định qua `/change`:
- [x] **G1:** `dueAt` nên là ISO string (code) hay epoch ms (spec)? — ✅ **closed**: thống nhất ISO 8601;
  phần còn lệch (hai dạng local/UTC) tách sang **G6**.
- [x] **G2:** `settings` từng chỉ có `theme` — ✅ **closed**: cài đặt thật là 8 field (FR-014), field `theme`
  cũ bị `normalizeSettings` bỏ khi đọc; giao diện light-only.
- [ ] **G3:** Weekly có cần lặp theo `weekdays` đã chọn (spec) hay chỉ +7 ngày (code hiện tại)?
- [x] **G4:** Có cần cho user chọn tiêu chí sort (spec) hay chỉ sort mặc định (code)? — ✅ **closed**:
  sort chọn được `deadline | priority | created` (FR-015).
- [x] **G5:** Bổ sung icon extension + notification (hiện thiếu) trước khi đăng Web Store. — ✅ **closed**:
  icon + notification đã có.
- [ ] **G6:** `dueAt` đang tồn tại **hai dạng** — composer tạo `YYYY-MM-DDTHH:mm` (local, không `Z`); sau khi
  việc lặp cuộn occurrence lại lưu `toISOString()` (UTC, có `Z`). Cần một chuẩn lưu duy nhất hoặc chuẩn hoá
  khi parse ở mọi điểm đọc.
- [ ] **G7:** Đồng bộ **không merge theo `updatedAt`** như FR-013/BR-005 yêu cầu: tab đang mở reload toàn bộ
  rồi reschedule, background xử lý từng key (không so `updatedAt`, không chống ghi đè chéo thiết bị).
- [ ] **G9 (R-19):** R-19 **chưa đạt một phần** — responsive dải 1024–1199px, menu môn có thể che chân popup,
  affordance dải tab ở màn hẹp, motion chưa verify tay đều còn mở; chi tiết ở [`DESIGN.md`](DESIGN.md)
  §Known Gaps → "Responsive & menu — R-19 còn mở" và "Motion & chỗ lệch as-built". Yêu cầu R-19 **không**
  bị hạ cấp.
- [x] **O1 (design-spec):** Toast + Hoàn tác khi xoá (P2) — giữ hay cắt? — ✅ **đã giữ**: toast "Hoàn tác"
  sống tới khi dismiss hoặc chọn hành động (không phải soft-delete nhiều giây).

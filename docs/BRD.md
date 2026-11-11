# Business Requirements Document (BRD) — Todo Extension

> **Intent doc.** Yêu cầu nghiệp vụ của project. Nguồn: [`BRIEF.md`](../BRIEF.md) +
> [`SPECIFICATIONS.md`](../SPECIFICATIONS.md) (`spec_version 1.0.0`, brainstorm 2026-11-10).
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
- UI: dark mode, lọc/tìm/sắp xếp, empty state, lỗi quota (R-14…R-16).
- Popup React 360×600, tiếng Việt.

### Out of Scope
- Backend / server / database / network request (R-17).
- Options page full-page, onboarding, export/import (design-spec §1).
- Cộng tác nhiều người, chia sẻ task, phân quyền.
- Lịch sử occurrence của task lặp (R-11 không lưu).
- Notification UI tuỳ biến (do Chrome vẽ, không style được).
- Đa ngôn ngữ (hiện chỉ tiếng Việt).

---

## Functional Requirements

> Mapping đầy đủ R-01…R-18 trong [`SPECIFICATIONS.md`](../SPECIFICATIONS.md). Dưới đây tóm tắt theo module.

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
- **FR-011 (R-11):** Tick task lặp → dời `dueAt` tới lần kế (catch-up tối đa 1000 vòng), không lưu lịch sử. *High.*
- **FR-012 (R-12):** Alarm `due:<id>` cho task `dueAt > now && !done` → notification. *High.*
- **FR-013 (R-13):** Đồng bộ `storage.onChanged`, merge theo `updatedAt`, xử lý xoá từ thiết bị khác. *High.*

### Module 3: UI & trải nghiệm
- **FR-014 (R-14):** Dark mode `system/light/dark`, mặc định `system`. *Medium.*
- **FR-015 (R-15):** Tab `all/active/done`, search title/note/tag, sort deterministic
  (overdue → dueAt → priority → createdAt). *High.*
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
| Compatibility | Chrome MV3 hiện đại; `light-dark()` cần Chrome ≥ 123 | design-spec O4 |
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
- **BR-002 (R-11):** Task lặp khi tick done giữ nguyên `id`, `done=false`, dời `dueAt` tới lần kế > now;
  không bao giờ ở trạng thái "lặp nhưng không có nhắc".
- **BR-003 (R-10):** Mọi tính ngày dùng múi giờ **local thiết bị**; đổi múi giờ có thể lệch ngày nhắc — chấp nhận (client-only).
- **BR-004 (R-12):** Notification không tự đổi trạng thái task; `dueAt ≤ now` không tạo alarm (hiển thị overdue).
- **BR-005 (R-13):** Xung đột đồng bộ giải quyết **last-write-wins theo `updatedAt`**.
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
- Thiết bị hiện đại (Chrome ≥ 123 cho `light-dark()`).
- Người dùng cho phép notification ở cấp Chrome/OS để nhắc việc hiện.

---

## Open Questions

> Các gap code↔intent đã ghi ở [`API_SPEC.md`](API_SPEC.md) §5 — cần quyết định qua `/change`:
- [ ] **G1:** `dueAt` nên là ISO string (code) hay epoch ms (spec)? Thống nhất lại spec hoặc code.
- [ ] **G3:** Weekly có cần lặp theo `weekdays` đã chọn (spec) hay chỉ +7 ngày (code hiện tại)?
- [ ] **G4:** Có cần cho user chọn tiêu chí sort (spec) hay chỉ sort mặc định (code)?
- [ ] **G5:** Bổ sung icon extension + notification (hiện thiếu) trước khi đăng Web Store.
- [ ] **O1 (design-spec):** Toast + Hoàn tác khi xoá (P2) — giữ hay cắt?

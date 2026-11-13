<div align="center">

# 📜 Học Đường — Todo Extension

**Sổ nhắc việc nhẹ, tức thì và riêng tư ngay trong Chrome — dành cho người đi học.**

![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)
![WXT](https://img.shields.io/badge/built%20with-WXT-67D55E)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Privacy](https://img.shields.io/badge/network-0%20requests-success)
![Permissions](https://img.shields.io/badge/permissions-3-informational)

</div>

---

## Mục lục

- [📜 Học Đường — Todo Extension](#-học-đường--todo-extension)
  - [Mục lục](#mục-lục)
  - [Giới thiệu](#giới-thiệu)
  - [Tính năng](#tính-năng)
    - [Quản lý việc](#quản-lý-việc)
    - [Thời gian \& nhắc việc](#thời-gian--nhắc-việc)
    - [Tìm, lọc, sắp xếp](#tìm-lọc-sắp-xếp)
    - [Trải nghiệm học tập](#trải-nghiệm-học-tập)
  - [Giao diện](#giao-diện)
  - [Kiến trúc](#kiến-trúc)
    - [Các module chính](#các-module-chính)
  - [Công nghệ sử dụng](#công-nghệ-sử-dụng)
  - [Bắt đầu](#bắt-đầu)
    - [Yêu cầu](#yêu-cầu)
    - [Cài đặt \& build](#cài-đặt--build)
    - [Nạp extension vào Chrome](#nạp-extension-vào-chrome)
    - [Phát hành](#phát-hành)
  - [Mô hình dữ liệu](#mô-hình-dữ-liệu)
    - [`Task`](#task)
    - [`Settings`](#settings)
  - [Quyền \& quyền riêng tư](#quyền--quyền-riêng-tư)
  - [Phím tắt](#phím-tắt)
  - [Hiệu năng \& giới hạn](#hiệu-năng--giới-hạn)
  - [Kiểm thử](#kiểm-thử)
  - [Tình trạng hiện tại \& Known Gaps](#tình-trạng-hiện-tại--known-gaps)
  - [Tài liệu dự án](#tài-liệu-dự-án)
  - [Quy ước đóng góp](#quy-ước-đóng-góp)

---

## Giới thiệu

**Học Đường** (Todo Extension) là extension **Chrome Manifest V3** cho phép ghi nhanh và quản lý việc cần làm mà không phải rời trình duyệt hay mở một ứng dụng todo riêng.

Nhiều giải pháp hiện có hoặc quá nặng (app riêng, tài khoản, backend) hoặc không nhắc việc đúng lúc. Học Đường giải quyết bằng cách:

| Mục tiêu | Cách thực hiện |
|---|---|
| **Tức thì** | Popup mở và hiển thị dữ liệu **< 100 ms** (~50 task, máy tham chiếu Apple Silicon) |
| **Nhắc đúng hạn** | `chrome.alarms` + `chrome.notifications`, bền qua vòng đời service worker |
| **Đa thiết bị** | Đồng bộ qua `chrome.storage.sync` theo tài khoản Chrome — không cần server |
| **Riêng tư tuyệt đối** | **Client-only**: không backend, không network request, không content script, không analytics |

> **Bản chất dự án:** đây là extension **client-only** — **không có REST API, không có cơ sở dữ liệu quan hệ**. "API" và "ERD" của dự án mô tả hợp đồng `chrome.storage.sync`, Chrome APIs và các module nội bộ (xem [Tài liệu dự án](#tài-liệu-dự-án)).

---

## Tính năng

### Quản lý việc
- Thêm / sửa / xoá / tick hoàn thành; tiêu đề 1–200 ký tự, kiểm tra IME-safe cho bộ gõ tiếng Việt.
- **Ưu tiên** `low · medium · high`, **ghi chú** ≤ 1000 ký tự, **tag** (≤ 5, mỗi tag ≤ 20 ký tự).
- **Việc nhỏ (subtask)** ≤ 50 bước với tiến độ `done/total` — tick hết việc nhỏ **không** tự tick việc cha.
- **Môn học (subject):** gom việc theo "gáy sách"; xoá môn không xoá việc.
- **Hoàn tác khi xoá** bằng toast (giữ tới khi người dùng đóng hoặc chọn hành động).

### Thời gian & nhắc việc
- Hạn chót gồm ngày + giờ; việc quá hạn hiển thị trạng thái **Quá hạn**.
- Lặp lại `none · daily · weekly · monthly`, tính theo **múi giờ local** của thiết bị; tháng thiếu ngày tự clamp về ngày cuối tháng.
- Tick việc lặp → đóng dấu **"đã làm hôm nay"**, tự cuộn hạn sang lần kế tiếp và đặt lại alarm; bấm lại để **hoàn tác hôm nay**.
- Thông báo Chrome khi đến hạn (tiêu đề + ghi chú rút gọn + hạn); thông báo **không** tự đổi trạng thái việc.

### Tìm, lọc, sắp xếp
- 4 tab: **Tất cả · Hôm nay · Sắp tới · Đã xong** (kèm số lượng).
- Lọc theo môn: `Cả giá sách` / từng môn / `Chưa xếp môn`.
- Tìm kiếm live theo title / note / tag.
- Sắp xếp chọn được: **Hạn chót** · **Ưu tiên** · **Mới nhất**.

### Trải nghiệm học tập
- **Pomodoro** (`25/5` hoặc `50/10`), nhật ký học 60 ngày gần nhất, chuỗi ngày học (đài sen).
- **Hai chế độ hiển thị** do người dùng chọn: `Popup` · `New Tab` · `Tự động`.
- Hiệu ứng bút lông ngỗng khi gõ, họa tiết, âm thanh (chuông đồng, tiếng giấy) — đều có thể tắt trong Cài đặt.
- Giao diện **Sơn Mài light-only**, tiếng Việt, hỗ trợ bàn phím đầy đủ và `prefers-reduced-motion`.

---

## Giao diện

Ngôn ngữ thiết kế mô phỏng **tranh sơn mài Việt Nam tông sáng** pha bố cục trang bản thảo trung cổ: nền vỏ trứng ngà, viền đôi vàng kim, đỏ son cho hành động chính, nâu sơn ta cho chữ.

| Ẩn dụ | Thành phần |
|---|---|
| Mỗi việc là một **cuộn thư** | Thẻ task |
| Mỗi môn học là một **gáy sách** | Bộ lọc môn / cột "Giá sách" |
| Hoàn thành = đóng một **dấu son** | Nút tick (seal) |
| Gõ = viết bằng **bút lông ngỗng** | Ô nhập (quill input) |

| Chế độ | Kích thước | Bố cục |
|---|---|---|
| **Popup** | 360 × 560 px | Một cột: đầu trang → ô ghi việc → dải lọc → cuộn việc → chân trang (Pomodoro + chuỗi học) |
| **New Tab** | Toàn màn hình, tối đa 1280 px | 3 vùng: **Giá sách** (240px) · **Cuộn nhiệm vụ** (1fr) · **Bàn học** (320px) |

**Chế độ hiển thị (`displayMode`):**

| Giá trị | Bấm icon extension | Mở tab mới |
|---|---|---|
| `popup` | Mở popup | Trang chào yên tĩnh (`QuietNewTab`) |
| `newtab` | Mở/focus tab Học Đường | Bảng toàn màn hình |
| `auto` *(mặc định)* | Mở popup | Bảng toàn màn hình |

Phông chữ: Cormorant Garamond (tiêu đề, nút), EB Garamond (nội dung), Dancing Script (chỉ dùng cho chữ hiện ra khi gõ). Chi tiết token màu, typography, spacing, motion: [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Kiến trúc

```
┌─────────────────────────── Chrome MV3 extension ───────────────────────────┐
│                                                                            │
│  popup / newtab (React)                background (service worker)         │
│  ┌──────────────────────┐              ┌──────────────────────────────┐    │
│  │ Board / TaskComposer │  storage API │ alarm scheduler              │    │
│  │ TaskList · Filter    │◀────────────▶│ ├ syncAlarms(tasks)          │    │
│  │ TaskDetail · Settings│              │ ├ onAlarm → notification     │    │
│  │ Pomodoro · Streak    │              │ ├ onInstalled / onStartup    │    │
│  └──────────┬───────────┘              │ └ action.setPopup (display)  │    │
│             │                          └──────────────┬───────────────┘    │
│             ▼                                         ▼                    │
│  lib/storage (adapter) ───────────▶ chrome.storage.sync / local           │
│  lib/tasks   (types · recurrence · query)   chrome.alarms · notifications  │
└────────────────────────────────────────────────────────────────────────────┘
   Không content script · không host_permissions · không network request
```

### Các module chính

| Module | Trách nhiệm |
|---|---|
| `lib/tasks/types.ts` | **Nguồn sự thật duy nhất** cho `Task`, `Subtask`, `RecurrenceRule`, `Settings`, `Subject`, `StudyLog`, `PomodoroState` |
| `lib/tasks/recurrence.ts` | `nextDueAt`, `nextFutureDue` — tính lần lặp kế tiếp theo giờ local |
| `lib/tasks/query.ts` | Hàm thuần: `filterByBoard`, `filterBySubject`, `sortBoard`, `searchTasks`, … |
| `lib/storage/adapter.ts` | `loadAll`, `put`, `remove`, `subscribe`, `StorageQuotaError`, chuẩn hoá settings |
| `lib/alarms/scheduler.ts` | `syncAlarms`, `scheduleTask`, `clearTaskAlarm` (alarm `due:<id>`) |
| `hooks/useTasks.ts` | State cho UI qua `useSyncExternalStore` trên storage adapter |
| `entrypoints/background.ts` | Nghe alarm → notification; resync khi cài/khởi động; áp `displayMode` |

**Quyết định kiến trúc đáng chú ý**

- **1 key / task** (`t:<uuid>`): ghi atomic theo key, tránh ghi đè cả danh sách và tránh vượt giới hạn 8 KiB/item.
- **Không thêm thư viện state** (YAGNI): storage là nguồn sự thật duy nhất, UI subscribe trực tiếp.
- **`chrome.alarms` thay `setTimeout`**: service worker MV3 có thể bị kill bất cứ lúc nào.
- **Pomodoro lưu ở `storage.local`**: đồng hồ đổi trạng thái liên tục (vượt 120 write/phút của `sync`) và thuộc về một máy.
- **Không autosave từng phím**: chỉ ghi khi bấm Lưu / toggle để tôn trọng giới hạn ghi.

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Nền tảng | Chrome Extension **Manifest V3** |
| Build | [WXT](https://wxt.dev) (manifest tự sinh, HMR) |
| UI | React 19 + TypeScript + Tailwind CSS v4 + component tự viết |
| Lưu trữ | `chrome.storage.sync` (task, settings, môn, nhật ký) · `chrome.storage.local` (Pomodoro) · `chrome.storage.session` (id tab bảng) |
| Nhắc việc | `chrome.alarms` + `chrome.notifications` |
| Package manager | pnpm |

Không dùng UI library nặng, không font mạng, không animation library. Mục tiêu bundle popup ≤ **120 KB gzip**.

---

## Bắt đầu

### Yêu cầu

- Node.js (LTS) và [pnpm](https://pnpm.io)
- Google Chrome (MV3, bản hiện đại)

### Cài đặt & build

```bash
# 1. Cài dependency
pnpm install

# 2. Chạy chế độ phát triển (HMR) — lệnh mặc định của WXT
pnpm exec wxt

# 3. Build bản production
pnpm exec wxt build
```

> Các script cụ thể (`dev`, `build`, `test`, …) lấy theo `package.json` của repo; lệnh trên theo quy ước của WXT.

### Nạp extension vào Chrome

1. Mở `chrome://extensions` và bật **Developer mode**.
2. Chọn **Load unpacked** → trỏ tới thư mục `.output/chrome-mv3/`.
3. Ghim biểu tượng **Học Đường** lên thanh công cụ.
4. Bấm biểu tượng để mở popup, hoặc mở tab mới để xem bảng toàn màn hình.

### Phát hành

Phát hành qua **Chrome Web Store** bằng cách upload file zip thủ công. Nội dung tab Privacy (justification quyền, data handling) có sẵn tại [`docs/PERMISSION.md`](docs/PERMISSION.md).

---

## Mô hình dữ liệu

Toàn bộ dữ liệu nằm trong storage của Chrome — **không có database**.

| Key | Vùng lưu | Giá trị | Ghi chú |
|---|---|---|---|
| `t:<uuid>` | `sync` | `Task` | 1 key / task |
| `settings` | `sync` | `Settings` | 8 field, xem bên dưới |
| `subjects` | `sync` | `Subject[]` | Ghi cả mảng (danh sách nhỏ) |
| `studyLog` | `sync` | `StudyLog` | Tự prune còn **60 ngày** |
| `pomodoro` | `local` | `PomodoroState` | Không đồng bộ giữa máy |
| `boardTabId` | `session` | `number` | Để focus lại tab bảng đang mở |

### `Task`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `string` | `crypto.randomUUID()` |
| `title` | `string` | Bắt buộc, trim, 1–200 ký tự |
| `note` | `string` | ≤ 1000 ký tự |
| `priority` | `low \| medium \| high` | Mặc định `medium` |
| `dueAt` | `string \| null` | ISO 8601; `null` = không hạn → không nhắc |
| `recurrence` | `RecurrenceRule` | `none · daily · weekly · monthly` |
| `tags` | `string[]` | ≤ 5, mỗi tag 1–20 ký tự |
| `subtasks` | `Subtask[]` | ≤ 50 |
| `subjectId` | `string \| null` | Tham chiếu `Subject.id` |
| `done` | `boolean` | Mặc định `false` |
| `lastDoneAt` / `prevDueAt` | `string \| null` | Phục vụ trạng thái *done-today* của việc lặp |
| `createdAt` / `updatedAt` | `string` | ISO 8601 UTC |

### `Settings`

| Field | Giá trị | Mặc định |
|---|---|---|
| `notificationsEnabled` | `boolean` | `true` |
| `displayMode` | `popup · newtab · auto` | `auto` |
| `quillStyle` | `pen · hand` | `pen` |
| `quillEffect` | `boolean` | `true` |
| `ornaments` | `boolean` | `true` |
| `lacquerSheen` | `boolean` | `true` |
| `pomodoroPreset` | `25/5 · 50/10` | `25/5` |
| `soundEnabled` | `boolean` | `false` |

Chi tiết đầy đủ (entity, quan hệ, vòng đời, quota): [`docs/ERD.md`](docs/ERD.md).

---

## Quyền & quyền riêng tư

```jsonc
// manifest
{ "permissions": ["storage", "alarms", "notifications"] }
```

| Quyền | Mục đích |
|---|---|
| `storage` | Lưu task/settings và đồng bộ qua tài khoản Chrome |
| `alarms` | Nhắc việc bền vững qua vòng đời service worker MV3 |
| `notifications` | Hiển thị thông báo khi đến hạn |

**Cam kết:**

- ❌ Không `host_permissions`, không content script, không `tabs`/`cookies`/`webRequest`/`identity`.
- ❌ Không network request, không remote code, không analytics, không quảng cáo, không bán/chia sẻ dữ liệu.
- ✅ Dữ liệu chỉ nằm trong trình duyệt và đồng bộ qua **chính tài khoản Chrome** của người dùng.
- ✅ Xoá việc = xoá key khỏi storage; gỡ extension = Chrome xoá toàn bộ dữ liệu extension.

**Single purpose:** quản lý todo cá nhân ngay trong trình duyệt (ghi nhanh, nhắc việc, đồng bộ).

---

## Phím tắt

| Phím | Hành vi |
|---|---|
| `n` | Focus ô ghi việc |
| `/` | Mở tìm kiếm |
| `Esc` | Đóng lần lượt: menu → tìm kiếm → chi tiết/panel |
| `Enter` *(ô ghi việc)* | Ghi việc (IME-safe) |
| `Ctrl/Cmd + Enter` *(chi tiết)* | Lưu |
| `←` / `→` | Chuyển tab / segmented control |
| `↑` / `↓` | Di chuyển trong menu môn / sắp xếp |
| `Space` *(checkbox)* | Tick / bỏ tick |

> Phím đơn (`n`, `/`) không kích hoạt khi đang gõ trong input/textarea. Không có phím tắt xoá để tránh thao tác nhầm.

---

## Hiệu năng & giới hạn

**Mục tiêu**

| Chỉ số | Mục tiêu |
|---|---|
| Mở popup hiển thị dữ liệu | < 100 ms (~50 task) |
| Popup JS | ≤ 120 KB gzip |
| Network request | 0 |
| Accessibility | WCAG 2.1 AA, điều khiển bằng bàn phím đầy đủ |

**Giới hạn của `chrome.storage.sync`** (thiết kế quanh các giới hạn này):

| Giới hạn | Giá trị | Hệ quả |
|---|---|---|
| Tổng dung lượng | 102.400 byte (~100 KiB) | Banner lỗi khi đầy (`StorageQuotaError`) |
| Mỗi item | 8.192 byte | Chặn task vượt kích thước khi ghi |
| Số item | 512 | Tối đa ~512 task |
| Số lần ghi | 120 / phút | Không autosave từng phím |

Lỗi quota luôn được hiển thị rõ cho người dùng, **không bị nuốt**.

---

## Kiểm thử

- **Checklist E2E thủ công** trước khi phát hành: [`docs/E2E-CHECKLIST.md`](docs/E2E-CHECKLIST.md) — load unpacked, focus ring, bàn phím, reduced motion, lưu trữ & alarm, tải 50 task.
- **Smoke test cho workflow maintenance:** [`docs/smoke-tests/MAINTENANCE_TEMPLATE_SMOKE.md`](docs/smoke-tests/MAINTENANCE_TEMPLATE_SMOKE.md).
- Có guard test riêng cho icon thông báo (`src/__tests__/notification-icon.test.ts`).

---

## Tình trạng hiện tại & Known Gaps

Dự án áp dụng nguyên tắc **"code thắng doc" cho tài liệu as-built** và **"không hạ cấp intent cho khớp code"** cho yêu cầu nghiệp vụ. Các chênh lệch giữa code và spec được ghi rõ thay vì che giấu:

| ID | Vấn đề | Trạng thái |
|---|---|---|
| **G3** | Lặp `weekly` hiện chỉ **+7 ngày**, chưa dùng danh sách `weekdays` đã chọn | 🔴 Mở |
| **G6** | `dueAt` tồn tại **hai dạng chuỗi**: local không `Z` (nhập tay) và UTC có `Z` (sau khi việc lặp cuộn lần kế). So sánh vẫn đúng nhưng dữ liệu chưa đồng nhất | 🔴 Mở |
| **G7** | Đồng bộ chưa **merge theo `updatedAt`** từng bản ghi — UI reload toàn bộ khi `onChanged` | 🔴 Mở |
| **G8** | Tie-breaker sắp xếp chưa đồng nhất giữa 3 tiêu chí; `Mới nhất` không có tie-breaker phụ | 🔴 Mở |
| **G9 / R-19** | Responsive dải 1024–1199px, menu môn có thể che chân popup, affordance dải tab ở màn hẹp và motion chưa được verify trên browser thật | 🟡 Một phần |
| G1, G2, G4, G5 | `dueAt` ISO · settings 8 field · sort chọn được · icon extension & notification | ✅ Đã đóng |

Lưu ý khác: giao diện **chỉ có tông sáng** (không dark mode); ngôn ngữ hiện chỉ **tiếng Việt**; không có options page riêng, onboarding hay export/import.

Chi tiết: [`docs/API_SPEC.md`](docs/API_SPEC.md) §5 và [`docs/BRD.md`](docs/BRD.md) *Open Questions*.

---

## Tài liệu dự án

Toàn bộ tài liệu nằm trong [`docs/`](docs/INDEX.md), chia theo mức độ tin cậy:

**Canonical (nguồn sự thật)**

| Tài liệu | Nội dung |
|---|---|
| [`docs/BRD.md`](docs/BRD.md) | Yêu cầu nghiệp vụ, phạm vi, FR/NFR, business rules *(intent)* |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design system Sơn Mài + screen inventory + motion + responsive |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | Hợp đồng `chrome.storage` + Chrome APIs + module nội bộ + gap register |
| [`docs/ERD.md`](docs/ERD.md) | Mô hình dữ liệu `chrome.storage` (không SQL) |
| [`docs/PERMISSION.md`](docs/PERMISSION.md) | Quyền extension + data handling (dùng cho Chrome Web Store) |
| [`docs/USER_FLOW.md`](docs/USER_FLOW.md) | 10 luồng người dùng chính + bản đồ phím |

**Tham khảo / lịch sử**

| Tài liệu | Nội dung |
|---|---|
| [`docs/SPEC_VERSIONING.md`](docs/SPEC_VERSIONING.md) | Quy ước version cho spec & test-scope |
| [`docs/specs/`](docs/specs/) | Design doc brainstorm ban đầu |
| [`docs/E2E-CHECKLIST.md`](docs/E2E-CHECKLIST.md) | Checklist kiểm thử thủ công trước release |
| [`docs/diagrams/`](docs/diagrams/) | Sơ đồ minh hoạ — cần đối chiếu với code trước khi tin |
| [`docs/generated/`](docs/generated/) | Sinh tự động, **không sửa tay** |

---

## Quy ước đóng góp

- **Tài liệu as-built** (`API_SPEC`, `ERD`, `PERMISSION`, trạng thái hiện tại của `DESIGN`): cập nhật khi code đổi, kèm evidence `file:line`. Nếu doc khác code → **code thắng**.
- **Tài liệu intent** (`BRD`, yêu cầu trong `SPECIFICATIONS.md`): chỉ thay đổi qua quy trình `/change` và được chủ dự án duyệt. Không hạ yêu cầu để khớp code — ghi vào gap register.
- **Versioning spec:** semver — MAJOR (phá vỡ/xoá yêu cầu), MINOR (thêm yêu cầu), PATCH (làm rõ wording). Spec hiện tại: `1.2.0`.
- Không nhúng code/schema chép tay vào tài liệu canonical; dùng pointer và `docs/generated/`.
- Mọi thay đổi code/config/docs đi qua commit để lịch sử là nguồn sự thật.

---

<div align="center">

*Học, nhớ, rồi lại học.* 📜

**Tác giả:** ahauy · Dự án cá nhân

</div>
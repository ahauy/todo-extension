---
id: timeline-task-entry
type: feature
status: done
closed: 2026-11-19
created: 2026-11-19
---

# Timeline: tạo/sửa việc bằng right-click + kéo-thả, bỏ ô nhập dưới bảng

## Yêu cầu

Bỏ khu vực nhập việc hiện tại (`Composer` dưới timeline trên New Tab). Người dùng thao tác
**trực tiếp trên thời khoá biểu** để tạo việc: right-click hoặc kéo từ giờ bắt đầu đến giờ kết thúc.
Sửa việc bằng right-click **hoặc** left-click vào block; dời việc bằng hold left + di chuột.
Hai luồng **tạo** và **sửa** tách rõ ràng.

Nguồn: user chat `/feature` 2026-11-19; BA làm rõ qua 19 câu hỏi, **đã chốt toàn bộ** (bảng dưới).

## Quyết định đã chốt (2026-11-19)

| # | Quyết định | Lựa chọn user |
|---|-----------|---------------|
| 1 | Ô nhập cũ | **Xoá hẳn** `Composer` dưới timeline (New Tab); popup extension 360×560 giữ nguyên ô nhập cũ |
| 2 | Điểm vào | **a + b**: right-click vùng trống → tạo; right-click/left-click block → sửa; dời = **hold left + di chuột**; 2 luồng tách rõ |
| 3 | Tự điền giờ | Right-click: **không tự điền**, user tự nhập. **Ngoại trừ kéo tạo** — xem câu A |
| 4 | Ngoài khung | **Chấp nhận cả 3**: giờ 00:00–05:59 / sau 23:45 nhập được như giờ trong khung; right-click được cả cột nhãn giờ và vùng trên/dưới canvas; **bỏ clamp 06:00–24:00** cho kéo |
| 5 | Nội dung popup | Đầy đủ field cần thiết, **TRỪ hạn chót (`dueAt`)** |
| 6 | Sau khi lưu | Việc **hiện ngay**, **đóng popup**, **không toast** |
| 7 | Chồng lấn | **Giữ nguyên** R-24: cảnh báo, vẫn lưu, không tự sửa dữ liệu |
| 8 | Focus mode | **Vô hiệu hoá** mọi gesture tạo/sửa mới khi đang trong phiên |
| 9 | Context menu Chrome | **Chặn** trong vùng timeline |
| 10 | Mobile/touch | Chưa tính — chỉ laptop, **nhưng vẫn có lối bàn phím** |
| 11 | Vị trí popup | **Sát con trỏ**, clamp/flip theo kích thước màn hình |
| 12 | Huỷ popup | Esc/click ngoài khi đã có dữ liệu → **hỏi xác nhận**; khi trống → huỷ ngay |
| A | Kéo tạo việc | Kéo vùng trống chọn start→end → popup mở với **khoảng vừa kéo điền sẵn**, user vẫn chỉnh được |
| C | Giờ kết thúc | **Thêm field `endAt`** vào `Task`, song song `startAt` |
| D | Field popup | Bỏ hạn chót; giữ các field còn lại của `TaskFields` |
| E | Click vs kéo | Ngưỡng ~4–5px tách click (mở popup sửa) / hold+move (dời); **bỏ hẳn ô nhập giờ** `input[type=time]` |
| F | Bàn phím | **Có** lối bàn phím mở popup tạo/sửa |
| H | `endAt` ↔ `estimateMin` | **`endAt` nguồn thật**, `estimateMin` suy ra (`end − start`, qua nửa đêm +1440′) |
| I | Phạm vi timeline | Mở rộng canvas **00:00–24:00**; nút phóng to kiểu **YouTube fullscreen** — timeline chiếm toàn bộ không gian hiện có của tab, bấm lại để thu về |
| J/L | Hạn chót | **Bỏ luôn lối nhập hạn chót** (popup + `TaskParchment`); **giữ nguyên** field `dueAt`, alarm `due:<id>` và chip quá hạn của task cũ — **không xoá dữ liệu** |
| K | Bao thể | Schema chỉ **thêm `endAt`** trong `t:<id>` (không permission/key storage/network mới); **gộp chung 1 change**; dùng bộ acceptance dưới đây |

## Bối cảnh / điểm bám code

- `entrypoints/newtab/App.tsx:333–346`: `<Timeline>` rồi `<Composer large ...>` — ô nhập cần xoá ở New Tab.
  Popup extension (`entrypoints/popup/App.tsx`) có `Composer` riêng, giữ nguyên (R-19).
- `components/Timeline.tsx`: khung 06:00–24:00, `PX_PER_MIN = 2`, snap 15′; drag bắt đầu ngay ở
  `onPointerDown` (dòng 104–114) → cần tách click / hold+move; `input[type=time]` ở dòng 193–199 và
  224–230 → bỏ, thay bằng popup.
- `lib/tasks/types.ts:102–104`: `startAt?: string`, `estimateMin?: number` (15–240, default 30);
  **chưa có `endAt`** → thêm, nhúng trong key `t:<id>` hiện có.
- `components/TaskParchment.tsx:41,257` dùng `TaskFields` có `dueAt` → bỏ field này theo quyết định J/L,
  nhưng **không xoá giá trị đã lưu** của task cũ.
- R-24 (`SPECIFICATIONS.md:269–312`) hiện quy định khung 06:00–24:00 + **clamp kéo** → bắt buộc spec delta.
- Chưa có handler `contextmenu` nào trong code — luồng hoàn toàn mới.

## Ràng buộc (không được phá khi xử lý)

- Không thêm permission/manifest, không network (R-17); **không key storage mới** — `endAt` nhúng trong `t:<id>`.
- `endAt` là wall-clock giờ địa phương, cùng nhóm `startAt`/`dueAt` (R-09), không phải instant UTC.
- `endAt` nguồn thật; `estimateMin` chỉ dẫn xuất để vẽ block. Không lưu 2 nguồn độc lập dễ lệch.
- Bỏ `dueAt` **chỉ ở lối nhập**: không migration, không xoá/đ đổi dữ liệu, không tắt alarm `due:<id>`, không đổi
  chip quá hạn của task cũ (R-09/R-11/R-15 giữ nguyên).
- Không đổi nghĩa `plannedFor` (R-22), focus (R-20), then chốt (R-21), habit (R-23); chồng lấn vẫn "chỉ cảnh báo".
- Focus mode ưu tiên gesture mới: popup không mở khi đang trong phiên.
- Chế độ toàn màn hình của timeline là **local state**, chiếm không gian tab hiện tại, không phải scale `PX_PER_MIN`;
  snap vẫn 15′. Khi popup đang mở, Esc xử lý popup trước; Esc tiếp theo mới thoát fullscreen.
- Popup sát con trỏ phải clamp/flip để không tràn viewport. Reviewer đề xuất **STRICT** (shared input path +
  dữ liệu thời gian + nhiều luồng gesture).

## Acceptance (bắt buộc)

- [x] New Tab không còn `Composer` dưới timeline; popup extension vẫn có ô nhập cũ.
- [x] Right-click vùng trống → popup **tạo**; right-click/left-click block → popup **sửa**; 2 luồng tách rõ.
- [x] Kéo vùng trống chọn start→end → popup mở với khoảng đó điền sẵn; user chỉnh được.
- [x] Right-click đơn thuần không tự điền giờ; user tự nhập.
- [x] Popup đủ field đã chốt (không có `dueAt`), sát con trỏ, clamp/flip ở 360×560 / 1024×768 / 1280×800.
- [x] Bỏ `input[type=time]`; click block (dưới ~4–5px) mở popup sửa; hold+move dời block như cũ.
- [x] `endAt` lưu được và là nguồn thật; `estimateMin` suy đúng kể cả khoảng qua nửa đêm.
- [x] Timeline vẽ 00:00–24:00; giờ ngoài 06:00–24:00 thao tác được; right-click cả cột nhãn giờ & vùng ngoài canvas.
- [x] Nút fullscreen kiểu YouTube: timeline chiếm toàn bộ không gian tab, bấm lại thu về; snap 15′ không đổi;
      Esc ưu tiên đóng popup rồi mới thoát fullscreen.
- [x] Lưu → block hiện ngay, popup đóng, không toast; validation nằm trong popup.
- [x] Chồng lấn: cảnh báo, vẫn lưu, không tự sửa/xoá dữ liệu (R-24).
- [x] Focus mode vô hiệu hoá gesture; context menu Chrome bị chặn trong vùng timeline.
- [x] Có lối bàn phím mở popup tạo/sửa; Esc/click ngoài có dữ liệu → hỏi xác nhận.
- [x] Không còn field nhập `dueAt` ở popup/`TaskParchment`, nhưng task cũ giữ `dueAt` + alarm + chip quá hạn.
- [x] Không tăng permission/key storage/network; `tsc` / `eslint` / `vitest` / `wxt build` PASS + eyeball có evidence.

## Quyết định dẫn xuất (change-request, sau spec-validation round 1)

Không đổi ý user; chỉ làm rõ hệ quả để spec nhất quán:

- Sửa R-02: bỏ "due date + giờ" khỏi field có thể sửa (user đã chốt "bỏ luôn hạn chót", L1 giữ liệu cũ).
- Popup timeline ẩn/disable lặp lại + habit vì R-10 yêu cầu `dueAt`; task cũ giữ nguyên dữ liệu.
- Kéo tạo clamp tại 24:00, không wrap; qua nửa đêm nhập tay `endAt < startAt`.
- Lỗi quota: popup ở lại + inline error, không toast, không đổi snapshot (R-16).
- `endAt` validate 00:00–23:59; ghi qua 1 `put` (patch mở rộng) + copy-then-patch; Esc: popup → fullscreen → search/menu.

## Ghi chú

- Spec delta: R-24 đổi khung/clamp + thêm `endAt` + bỏ lối nhập hạn chót (có thể đánh số R-25), bump
  `spec_version`, ghi `spec/updates/` + `spec/CHANGELOG.md`, sinh lại `spec/test-scope/current.json`.
- Đề xuất chia phase: (1) data `endAt` + tách gesture create/edit + popup; (2) xoá Composer & ô giờ, fullscreen,
  focus/context-menu, bàn phím, bỏ input `dueAt`, responsive; (3) spec publish + docs reconcile + reviewer + close-out.
- **Trạng thái: `done` 2026-11-19** — phase 1 `a62485d`, phase 2 `6dbe8a0`, phase 3 close-out
  (docs reconcile + spec-validator PASS + reviewer round 2 PASS). Đã archive; residual xem
  `.context/progress.json` entry `FEAT-004`.

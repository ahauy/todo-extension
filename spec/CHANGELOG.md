# Spec Changelog

> Mỗi lần đổi `SPECIFICATIONS.md` → thêm 1 dòng. Version scheme: `docs/SPEC_VERSIONING.md`.

| Version | Ngày | Loại | Thay đổi | Scope sinh |
|---|---|---|---|---|
| 1.0.0 | 2026-11-10 | MAJOR | Spec khởi tạo (greenfield, từ BRIEF + brainstorm): R-01…R-18 | — |
| 1.0.1 | 2026-11-10 | MINOR | Initial build hoàn tất (21 task, 7 layer, branch staging). Sinh spec/test-scope/current.json (trigger initial-build, scopeVersion 1). | spec/test-scope/current.json |
| 1.1.0 | 2026-11-12 | MINOR | Đồng bộ requirement UI hiện hành và thêm R-19 cho responsive/motion Sơn Mài có chủ đích. | spec/test-scope/current.json (scopeVersion 20) |
| 1.2.0 | 2026-11-13 | MINOR | SỬA R-11: việc lặp đóng dấu lưu `lastDoneAt`/`prevDueAt`, thẻ có trạng thái done-today bền qua reload + hoàn tác hôm nay (BUG-002). | spec/test-scope/current.json (scopeVersion 21) |
| 1.2.1 | 2026-11-16 | PATCH | Làm rõ R-09 (`dueAt` canonical wall-clock `YYYY-MM-DDTHH:mm` không `Z` + migration khi đọc), R-10 (weekly tôn trọng `weekdays` + fallback rỗng/thiếu), R-11 (`prevDueAt` = instant UTC; hoàn tác quy đổi về local) — Gói 0 FEAT-003/0, không đổi intent. | spec/test-scope/current.json (scopeVersion 22) |
| 1.3.0 | 2026-11-17 | MINOR | THÊM R-20 — Gói C FEAT-003: gắn task vào phiên Pomodoro, focus overlay popup + New Tab, đếm ngắt local-only, chỉ ghi `studyLog.focus` khi phiên hoàn thành (sửa `skip`). | spec/test-scope/current.json (scopeVersion 23) |
| 1.4.0 | 2026-11-17 | MINOR | THÊM R-21 + SỬA R-15 — Gói A FEAT-003: việc then chốt (≤3, chỉ cảnh báo), chip "20%", con ếch theo ngày local qua 1 key `dayPlan`, cắt bỏ/archive có phục hồi, dòng tổng kết ngày/tuần trên New Tab. | spec/test-scope/current.json (scopeVersion 25) |
| 1.5.0 | 2026-11-18 | MINOR | THÊM R-22 — Gói B FEAT-003: `Task.plannedFor` tách khỏi `dueAt`, nhắc lập kế hoạch 21:00 bật sẵn/tắt được, notification mở sheet "Kế hoạch mai" (≤5 việc + chọn ếch), khối "Đã hẹn hôm nay". | spec/test-scope/current.json (scopeVersion 28) |
| 1.6.0 | 2026-11-18 | MINOR | THÊM R-23 — Gói D FEAT-003: `Task.habit` nhúng `startedAt` + ≤31 `doneDays`, streak theo lịch lặp (T7/CN ngoài lịch không đứt), lưới 21 ô + seal 7/14/21 trên New Tab, tách khỏi `StudyLog`. | spec/test-scope/current.json (publish scopeVersion 29 → close-out 30) |
| 1.7.0 | 2026-11-18 | MINOR | THÊM R-24 — Gói E FEAT-003: `Task.startAt` ("HH:mm" wall-clock local) + `estimateMin` (15–240, mặc định 30), timeline 06:00–24:00 + kéo snap 15′ + lối bàn phím trên New Tab, chồng lấn chỉ cảnh báo, popup 360×560 không thêm khối UI. | spec/test-scope/current.json (scopeVersion 31) |
| 1.8.0 | 2026-11-19 | MINOR | FEAT-004: THÊM R-25 — tạo/sửa việc trực tiếp trên timeline bằng right-click/kéo-thả, popup neo con trỏ, fullscreen-in-tab; SỬA R-24 — timeline 00:00–24:00, bỏ clamp 06:00–24:00, thêm `endAt` (nguồn thật, `estimateMin` dẫn xuất), bỏ ô nhập giờ; bỏ field nhập `dueAt` nhưng giữ dữ liệu/alarm task cũ. | spec/test-scope/current.json (publish scopeVersion 34 → close-out 35) |

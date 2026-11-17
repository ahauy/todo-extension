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

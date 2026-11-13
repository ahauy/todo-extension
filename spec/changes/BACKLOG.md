# BACKLOG — Yêu cầu & bug hậu-build (auto-intake)

> Khi build xong hết layer lần đầu (`mode: maintenance`), **mọi yêu cầu/bug user gửi qua chat
> được agent TỰ ĐỘNG ghi vào đây + tạo change doc** — user KHÔNG cần tạo file tay.
> User chỉ cần gõ `/change` (hoặc `/change <slug>`) → agent xử lý → cập nhật tracking.

## Bảng tracking

| ID | Tiêu đề | Loại | Trạng thái | Change file | Tạo | Xong |
|----|---------|------|-----------|-------------|-----|------|
| BUG-001 | Popup thiếu entrypoint + tailwind chưa cài — extension không bấm được | BUG | done | [2026-11-11-popup-missing-entrypoint.md](2026-11-11-popup-missing-entrypoint.md) | 2026-11-11 | 2026-11-11 |
| FEAT-001 | Popup: gộp hai hàng chip trong cuộn thư thành một hàng (mật độ) | MODIFY | done | [2026-11-12-popup-task-card-density.md](archive/2026-11-12-popup-task-card-density.md) | 2026-11-12 | 2026-11-12 |
| BUG-002 | Thẻ việc: nút đóng dấu vô hình + không phân biệt chưa làm / đã làm / việc lặp ngày mai | BUG+MODIFY | in_progress | [2026-11-12-task-seal-states.md](2026-11-12-task-seal-states.md) | 2026-11-12 | — |
| FEAT-002 | Nâng tầm trải nghiệm Sơn Mài Học Đường: responsive, menu popup, motion và đồng bộ tài liệu | MODIFY | in_progress | [2026-11-12-son-mai-experience-polish.md](2026-11-12-son-mai-experience-polish.md) | 2026-11-12 | — |

## Quy tắc tracking

- **Trạng thái:** `pending` (chưa xử lý) · `in_progress` (đang xử lý) · `done` (xong, change file đã archive) · `blocked` (kẹt, cần user).
- **Agent intake (tự động, khi user chat yêu cầu/bug trong maintenance mode):**
  1. Tạo change doc `spec/changes/YYYY-MM-DD-<slug>.md` (copy `_TEMPLATE.md`, điền yêu cầu + acceptance từ lời user — thiếu thông tin thì hỏi ngắn 1 lần, KHÔNG bịa).
  2. Thêm 1 dòng vào bảng trên với trạng thái `pending`.
  3. Báo user: "✅ Đã ghi vào backlog: <tiêu đề> — gõ `/change` (hoặc `/change <slug>`) để xử lý." **KHÔNG code ngay.**
- **Agent xử lý change (`/change`):** khi change được xử lý xong (status `done` + chuyển `archive/`) → cập nhật hàng tương ứng: `in_progress` (khi bắt đầu) → `done` + ngày xong. `blocked` khi cần user quyết định.
- **Duy nhất 1 nguồn:** mỗi dòng = 1 change doc ở `spec/changes/`. Không xoá dòng đã `done` (giữ lịch sử), chỉ cập nhật trạng thái.
- **`/change --list`:** liệt kê các dòng chưa `done` từ bảng này (kèm slug để chạy `/change <slug>`).

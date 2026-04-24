# Project: [PROJECT_NAME]

> 🔑 File này là source of truth. Opencode đọc file này đầu tiên mỗi session.

---

## 🚀 FIRST TIME SETUP — ĐỌC CÁI NÀY TRƯỚC

> Nếu `docs/PRD.md` vẫn còn placeholder `[...]` → project chưa được plan.
> **Chạy Phase 0 ngay bên dưới trước khi làm bất cứ thứ gì.**

### ▶ Phase 0: Planning (chạy ngay nếu chưa plan)

Làm theo thứ tự, từng bước xong hỏi user confirm trước khi làm bước tiếp:

**Bước 1 — Clarify Requirements**
Hỏi user tối đa 5 câu để hiểu rõ:
- App làm gì, giải quyết vấn đề gì?
- User là ai?
- Tech stack muốn dùng? (nếu chưa biết thì đề xuất)
- Có constraint gì không? (deadline, existing system)
- Feature nào là must-have, nice-to-have?

Hỏi xong đợi trả lời, KHÔNG tự bịa.

**Bước 2 — Viết PRD**
Viết vào `docs/PRD.md`, không để placeholder `[...]`.

**Bước 3 — Propose Architecture**
Viết vào `docs/ARCHITECTURE.md` gồm: system diagram, tech stack + lý do, data models, API design, folder structure.

**Bước 4 — Chia Phases**
Chia 4 phases (mỗi phase ≤ 1 tuần), viết vào `docs/phases/phase-1.md` → `phase-4.md`.
Mỗi file có: Goal, Definition of Done, Tasks table.

**Bước 5 — Update CLAUDE.md**
Điền đầy đủ phần Stack, Folder Structure, Coding Rules bên dưới. Xóa block "FIRST TIME SETUP" này sau khi xong.

**Bước 6 — Tạo tasks/todo.md**
Liệt kê tasks Phase 1 theo format có sẵn, đủ chi tiết để implement ngay.

⚠️ KHÔNG code gì trong Phase 0. KHÔNG skip bước nào.

---

## Stack
[Điền sau Phase 0]

## Folder Structure
[Điền sau Phase 0]

## Coding Rules
- **TypeScript strict** — không dùng `any`
- **Test ngay** — mỗi task phải có unit test trước khi sang task mới
- **1 commit = 1 task** — commit message: `feat/fix/test/chore: [mô tả ngắn]`
- **Scope control** — không sửa file ngoài danh sách cho phép trong task
- **Error handling** — mọi async function phải handle error

## Current Phase
Phase 0 — Planning (chưa bắt đầu)

## Current Task
Xem `tasks/todo.md`

# Phase 0: Planning

> **Goal:** Clarify requirements, design architecture, chia phases trước khi code  
> **Output:** PRD + Architecture + Phase breakdown + CLAUDE.md + tasks/todo.md  
> **Status:** ⬜ Todo

---

## Definition of Done
- [ ] PRD.md đầy đủ, anh đã review và approve
- [ ] ARCHITECTURE.md có folder structure + data models + API design
- [ ] docs/phases/ có breakdown rõ cho từng phase
- [ ] CLAUDE.md updated với stack + conventions thực tế
- [ ] tasks/todo.md có đủ tasks Phase 1
- [ ] Không có dòng nào còn là placeholder `[...]`

---

## Prompt Cho Opencode (Copy & Paste)

```
Chúng ta đang bắt đầu một project mới. Nhiệm vụ của mày là giúp tao lên plan hoàn chỉnh trước khi code.

Làm theo thứ tự sau:

### Bước 1: Clarify Requirements
Hỏi tao tối đa 5 câu để hiểu rõ:
- App làm gì, giải quyết vấn đề gì?
- User là ai?
- Tech stack muốn dùng? (nếu chưa biết tao sẽ để mày đề xuất)
- Có constraint gì không? (deadline, budget, existing system)
- Feature nào là must-have, nice-to-have?

Hỏi xong đợi tao trả lời, KHÔNG tự bịa.

### Bước 2: Viết PRD
Sau khi tao trả lời xong, viết vào docs/PRD.md theo format có sẵn.
Không được để placeholder [...]  — điền hết dựa trên những gì tao chia sẻ.

### Bước 3: Propose Architecture
Dựa vào PRD, viết docs/ARCHITECTURE.md gồm:
- System overview diagram (text-based)
- Tech stack + lý do chọn
- Data models (TypeScript types)
- API design (nếu có)
- Folder structure cụ thể

### Bước 4: Chia Phases
Chia thành 4 phases, mỗi phase tối đa 1 tuần:
- Phase 1: Foundation (setup, infra, DB)
- Phase 2: Core Features
- Phase 3: UI + Polish
- Phase 4: Testing + Deploy

Viết vào docs/phases/phase-1.md đến phase-4.md.
Mỗi file phải có: Goal, Definition of Done, Tasks table.

### Bước 5: Update CLAUDE.md
Điền đầy đủ vào CLAUDE.md dựa trên stack + architecture đã chốt.
Không để placeholder.

### Bước 6: Tạo tasks/todo.md cho Phase 1
Liệt kê tasks Phase 1 theo format có sẵn, đủ chi tiết để implement ngay.

---

QUAN TRỌNG:
- Từng bước xong thì hỏi tao confirm trước khi làm bước tiếp
- Không code gì cả trong Phase 0
- Không skip bước nào
```

---

## Notes
- Phase 0 thường mất 30-60 phút với Opencode
- Nếu scope thay đổi sau Phase 0 → update lại PRD + phases trước khi code

---
name: start
description: "Khởi tạo dự án lần đầu — chuỗi chạy LIÊN TỤC tự chuyển bước: đọc spec (spec-init nếu chưa có) → brainstorm → design → graph → loop, chỉ DỪNG ở human checkpoint. Trigger: /start, 'bắt đầu project', 'khởi tạo dự án', 'đưa repo vào pipeline'."
---

# /start — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/start.md` và làm theo đúng chuỗi bước trong đó.
2. Các file được tham chiếu (`AGENTS.md` §Workflow, `.agent/*.md`) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. Chỉ dừng ở ⏸ checkpoint (approve design / confirm tokens / duyệt plan); user reply "ok" để đi tiếp.

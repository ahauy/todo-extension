---
name: change
description: "Cửa vào xử lý MỌI thay đổi hậu-build (feature mới + fix bug) của project theo workflow change-request. Trigger: /change, 'xử lý change', 'đọc backlog', 'change request'. Đọc spec/changes/ pending → classify → spec delta → builder/reviewer → commit-first."
---

# /change — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/change.md` và làm theo đúng flow + rule trong đó.
2. Các file được tham chiếu (`.agent/change-request.md`, `.agent/workflows/*.md`, `AGENTS.md`) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: chỗ command gọi subagent opencode (`task` tool) → dùng Agent tool của Qoder hoặc tự thực thi inline trong session chính.
4. Đối số sau `/change` (slug, `--list`, `--init`) xử lý như command gốc mô tả.

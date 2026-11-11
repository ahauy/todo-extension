---
description: Cửa vào xử lý MỌI thay đổi hậu-build (feature + bug) theo workflow change-request — đọc spec/changes/ pending → classify → spec delta → builder/reviewer → commit-first
---

Đọc TOÀN BỘ `.opencode/command/change.md` và làm theo đúng flow + rule trong đó (đối số sau lệnh: slug, `--list`, `--init` xử lý như command gốc).
Các file tham chiếu (`.agent/change-request.md`, `.agent/workflows/*.md`, `AGENTS.md`) — đọc và thực thi; AGENTS.md là precedence cao nhất.
Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline trong session chính.

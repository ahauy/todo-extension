---
name: spec-init
description: "Reverse-engineer spec từ project CŨ đã có code nhưng chưa có spec: scan code → dựng SPECIFICATIONS.md + spec/ + spec/test-scope/current.json. Read-only, chạy 1 lần đầu. Trigger: /spec-init, 'dựng spec từ code', 'project cũ chưa có spec', 'thừa kế codebase'."
---

# /spec-init — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/spec-init.md` và làm theo đúng flow trong đó.
2. Các file được tham chiếu (`.agent/spec-init.md`, `AGENTS.md` bước 1a) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. Read-only với code hiện có — chỉ sinh spec artifacts.

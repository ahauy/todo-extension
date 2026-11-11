---
name: brainstorm
description: "Chốt/sửa config dự án (.context/project-config.md) + clear yêu cầu + design doc (docs/specs/*.md). Đọc spec/code + config hiện có → hỏi user theo nhóm → ghi config. Trigger: /brainstorm, 'chốt config', 'clear yêu cầu', 'setup thông tin dự án'."
---

# /brainstorm — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/brainstorm.md` và làm theo đúng flow trong đó.
2. Các file được tham chiếu (`.agent/brainstorm.md`, `AGENTS.md` bước 2) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. `/brainstorm <nhóm>` chỉ sửa 1 nhóm config. KHÔNG commit/push ở bước này.
4. ⏸ Approve design là HARD-GATE: chưa approve không code.

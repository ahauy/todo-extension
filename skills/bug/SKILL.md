---
name: bug
description: "Fix MỘT bug đã biết (hoặc list bug đã xác nhận) theo workflow change-request: root cause → task → builder → reviewer → spec publish → commit-first. Trigger: /bug, 'fix bug', 'sửa lỗi', 'lỗi này'."
---

# /bug — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/bug.md` và làm theo đúng flow + rule trong đó.
2. Các file được tham chiếu (`.agent/workflows/bug.md`, `AGENTS.md` §Bug rules) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. Thiếu thông tin bug (màn hình / bước tái hiện / expected-actual) → hỏi ngắn trước, không tự giả định.

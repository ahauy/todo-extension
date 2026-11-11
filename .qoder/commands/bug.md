---
description: Fix MỘT bug đã biết theo workflow change-request — root cause → task → builder → reviewer → spec publish → commit-first
---

Đọc TOÀN BỘ `.opencode/command/bug.md` và làm theo đúng flow + rule trong đó.
Các file tham chiếu (`.agent/workflows/bug.md`, `AGENTS.md` §Bug rules) — đọc và thực thi; AGENTS.md là precedence cao nhất.
Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
Thiếu thông tin bug (màn hình / bước tái hiện / expected-actual) → hỏi ngắn trước, không tự giả định.

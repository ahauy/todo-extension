---
name: feature
description: "Thêm/sửa/bỏ tính năng theo workflow change-request: classify ADDITIVE/MODIFY/REMOVE → spec delta → spec publish → phase/task → builder/reviewer/spec-validator. Trigger: /feature, 'thêm tính năng', 'feature mới', 'đổi tính năng'."
---

# /feature — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/feature.md` và làm theo đúng flow + rule trong đó.
2. Các file được tham chiếu (`.agent/workflows/change.md`, `AGENTS.md` §Feature rules) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. Requirement mơ hồ → hỏi lại, không tự chọn giả định lớn.

---
name: design-spec
description: "Design tokens + screen specs (.context/design-spec.md + skills/<stack>/design-tokens.md) trước khi chia layer — tương đương lệnh /design của opencode (đổi tên vì /design đã bị skill khác chiếm). Trigger: /design-spec, 'design tokens', 'thiết kế UI', 'screen spec', 'làm đẹp'."
---

# /design-spec — bridge từ opencode command /design

1. Đọc TOÀN BỘ `.opencode/command/design.md` và làm theo đúng flow trong đó.
2. Các file được tham chiếu (`.agent/design.md`, `AGENTS.md` bước 3) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. ⏸ Confirm tokens với user trước khi chia layer.

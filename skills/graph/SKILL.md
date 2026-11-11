---
name: graph
description: "Chia spec/design thành layer/task theo dependency: tasks/<slug>/layer-{N}-task-{NN}.md + layer-plan diagram + update progress.json. Trigger: /graph, 'chia task', 'chia layer', 'lập kế hoạch triển khai', 'breakdown'."
---

# /graph — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/graph.md` và làm theo đúng flow trong đó.
2. Các file được tham chiếu (`.agent/graph.md`, `AGENTS.md` bước 4) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. ⏸ Duyệt plan với user trước khi implement.

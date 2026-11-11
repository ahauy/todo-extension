---
name: spec-publish
description: "Phát hành spec cho template test: bump spec_version + ghi spec/updates/ + spec/CHANGELOG.md + sinh spec/test-scope/current.json (tăng scopeVersion). Thường tự động trong change-request; dùng tay khi cần chạy lại. Trigger: /spec-publish, 'publish spec', 'phát hành spec'."
---

# /spec-publish — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/spec-publish.md` và làm theo đúng flow trong đó.
2. Các file được tham chiếu (`.agent/spec-publish.md`, `AGENTS.md` §3b Feature rules) — đọc và thực thi; AGENTS.md là precedence cao nhất.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.

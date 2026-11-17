---
description: WorkBuddy wrapper cho /spec-publish
---

> Wrapper WorkBuddy. Nguồn canonical: `.opencode/command/spec-publish.md`. Không sửa wrapper này.

Đọc `.opencode/command/spec-publish.md` trước khi hành động, rồi thực thi đúng nội dung trong đó.
Giữ nguyên mọi human checkpoint và artifact path của workflow gốc.

Ánh xạ runtime khi cần:
- `task` / subagent của opencode → tool `Agent` với tên agent tương ứng.
- `usage()` → đọc `.context/session-policy.json` và `.context/runs/` thay vì API plugin opencode.
- permission `bash` của `opencode.jsonc` → hook `.workbuddy/hooks/guard-bash.mjs`.
- model cụ thể của opencode → tham số `model` khi gọi Agent, nếu runtime hỗ trợ.

Không ghi đè file canonical trừ khi user yêu cầu rõ.

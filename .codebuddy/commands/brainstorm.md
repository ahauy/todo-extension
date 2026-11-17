---
description: Brainstorm — đọc spec/code rồi (1) clear/làm rõ yêu cầu qua đối thoại + design doc (skill brainstorming) và (2) hỏi user nhập config dự án (git, package, verify commands, DB, models, deploy, monitoring) ghi .context/project-config.md. Chạy sau /spec-init hoặc chạy lại để update.
---

> Wrapper WorkBuddy. Nguồn canonical: `.opencode/command/brainstorm.md`. Không sửa wrapper này.

Đọc `.opencode/command/brainstorm.md` trước khi hành động, rồi thực thi đúng nội dung trong đó.
Giữ nguyên mọi human checkpoint và artifact path của workflow gốc.

Ánh xạ runtime khi cần:
- `task` / subagent của opencode → tool `Agent` với tên agent tương ứng.
- `usage()` → đọc `.context/session-policy.json` và `.context/runs/` thay vì API plugin opencode.
- permission `bash` của `opencode.jsonc` → hook `.workbuddy/hooks/guard-bash.mjs`.
- model cụ thể của opencode → tham số `model` khi gọi Agent, nếu runtime hỗ trợ.

Không ghi đè file canonical trừ khi user yêu cầu rõ.

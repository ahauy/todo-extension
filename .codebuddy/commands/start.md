---
description: Start project — chạy LIÊN TỤC chuỗi khởi tạo (đọc spec → brainstorm → design → graph → loop). Tự động chuyển bước, chỉ dừng ở human checkpoint; user không phải gõ lại lệnh.
---

> Wrapper WorkBuddy. Nguồn canonical: `.opencode/command/start.md`. Không sửa wrapper này.

Đọc `.opencode/command/start.md` trước khi hành động, rồi thực thi đúng nội dung trong đó.
Giữ nguyên mọi human checkpoint và artifact path của workflow gốc.

Ánh xạ runtime khi cần:
- `task` / subagent của opencode → tool `Agent` với tên agent tương ứng.
- `usage()` → đọc `.context/session-policy.json` và `.context/runs/` thay vì API plugin opencode.
- permission `bash` của `opencode.jsonc` → hook `.workbuddy/hooks/guard-bash.mjs`.
- model cụ thể của opencode → tham số `model` khi gọi Agent, nếu runtime hỗ trợ.

Không ghi đè file canonical trừ khi user yêu cầu rõ.

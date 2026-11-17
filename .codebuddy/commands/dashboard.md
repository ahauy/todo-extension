---
description: Mở dashboard trực quan Vibe Code Studio (văn phòng pixel isometric 2.5D, PixiJS) xem agent nào đang build/review và task nào ở TODO/REVIEW/DONE. Chỉ ĐỌC, không đụng loop.
---

> Wrapper WorkBuddy. Nguồn canonical: `.opencode/command/dashboard.md`. Không sửa wrapper này.

Đọc `.opencode/command/dashboard.md` trước khi hành động, rồi thực thi đúng nội dung trong đó.
Giữ nguyên mọi human checkpoint và artifact path của workflow gốc.

Ánh xạ runtime khi cần:
- `task` / subagent của opencode → tool `Agent` với tên agent tương ứng.
- `usage()` → đọc `.context/session-policy.json` và `.context/runs/` thay vì API plugin opencode.
- permission `bash` của `opencode.jsonc` → hook `.workbuddy/hooks/guard-bash.mjs`.
- model cụ thể của opencode → tham số `model` khi gọi Agent, nếu runtime hỗ trợ.

Không ghi đè file canonical trừ khi user yêu cầu rõ.

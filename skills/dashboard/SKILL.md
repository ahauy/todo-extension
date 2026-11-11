---
name: dashboard
description: "Mở dashboard vibe-studio xem task/agent của project (read-only, PixiJS office poll agents-live/progress). Trigger: /dashboard, 'xem dashboard', 'xem task đang chạy', 'xem agents'."
---

# /dashboard — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/dashboard.md` và làm theo đúng hướng dẫn trong đó.
2. Dashboard là tool read-only trong `tools/` — chạy theo hướng dẫn command gốc; không sửa source.
3. Adapt cho Qoder: lệnh shell chạy bằng Bash tool; nếu command cần plugin opencode thì báo user phần nào không port được.

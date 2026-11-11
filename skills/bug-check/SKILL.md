---
name: bug-check
description: "Soi bug READ-ONLY một khu vực/màn hình: liệt kê defect vào tasks/bug-<slug>/scan.md rồi DỪNG chờ user chọn — KHÔNG sửa code, KHÔNG commit. Trigger: /bug-check, 'soi lỗi', 'kiểm tra màn', 'cảm giác nhiều lỗi nhưng không rõ'."
---

# /bug-check — bridge từ opencode command

1. Đọc TOÀN BỘ `.opencode/command/bug-check.md` và làm theo đúng flow trong đó.
2. Đây là bước READ-ONLY: chỉ soi + ghi report, tuyệt đối không gọi builder/sửa source.
3. Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
4. Kết thúc: liệt kê defect + đề xuất thứ tự, DỪNG hỏi user chọn bug nào để fix.

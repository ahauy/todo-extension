---
description: Soi bug READ-ONLY một khu vực/màn hình — liệt kê defect vào tasks/bug-<slug>/scan.md rồi DỪNG chờ user chọn, KHÔNG sửa code
---

Đọc TOÀN BỘ `.opencode/command/bug-check.md` và làm theo đúng flow trong đó.
Đây là bước READ-ONLY: chỉ soi + ghi report, tuyệt đối không gọi builder/sửa source.
Adapt cho Qoder: subagent opencode (`task` tool) → Agent tool của Qoder hoặc thực thi inline.
Kết thúc: liệt kê defect + đề xuất thứ tự, DỪNG hỏi user chọn bug nào để fix.

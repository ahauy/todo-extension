---
id: workbuddy-compat-adapter
type: feature
status: done
created: 2026-11-17
---

# Adapter tương thích WorkBuddy cho workflow opencode

## Yêu cầu
Thêm một lớp adapter/plugin để WorkBuddy có thể dùng tương đương 9 subagent, 12 command, 20 skill, hook và cơ chế bảo vệ git/DB hiện có của opencode, mà không sửa hoặc làm hỏng cách làm việc hiện tại trên opencode.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: tooling ngang hàng (opencode ↔ WorkBuddy)
- Bước tái hiện: Mở repo bằng WorkBuddy và gõ `/start`, `/change`, hoặc cố gọi subagent `builder`, `reviewer`
- Expected: Các command/subagent/skill/hook hoạt động như opencode
- Actual: WorkBuddy không đọc `.opencode/`, `opencode.jsonc`, plugin TypeScript hay `.claude/settings.json`

## Acceptance (bắt buộc)
- [x] `.opencode/`, `.agent/`, `skills/`, `AGENTS.md`, `opencode.jsonc` giữ nguyên nội dung
- [x] Có 12 command wrapper trong `.codebuddy/commands/`
- [x] Có 20 skill project-level trong `.workbuddy-ai/skills/`
- [x] Có 9 agent WorkBuddy dạng plugin, sinh từ `.opencode/agent/`
- [x] Hook chặn git push main/force/reset/checkout và DB destructive, gate builder-strong, nhắc Session Handoff khi compact
- [x] Hook live-studio có `SubagentStop`
- [x] Script sync/validate/install có thể chạy lại được
- [x] Kiểm tra git diff xác nhận chỉ thêm file adapter và cập nhật backlog/change doc

## Ghi chú
Adapter chỉ đọc file gốc để sinh bản WorkBuddy. Mọi thay đổi logic vẫn thực hiện ở file opencode rồi chạy lại script sync. Việc nạp plugin local có thể cần restart WorkBuddy.

Không bump `specVersion`/`scopeVersion`: change này chỉ bổ sung tooling adapter, không đổi requirement sản phẩm hay test scope của extension.

## Verify lúc đóng (2026-11-17, session `/resume`)
- `node scripts/workbuddy-adapter.mjs validate` → OK (12 command / 20 skill / 9 agent, 104 hash nguồn khớp).
- Probe hành vi hook: deny `push origin main`, `push --force`, `reset --hard`, `checkout --`, `db:reset`; `ask` cho `builder-strong`; allow lệnh lành tính.
- Phát hiện và sửa trong lúc verify: regex `git checkout --` dùng `\b` sau `--` nên không khớp → hook đã cho qua. Sửa tại `.workbuddy/hooks/guard-bash.mjs`; thêm 6 case probe vào `validate()` của script để không tái diễn.
- `git diff --name-only` trên các path canonical (`.opencode/`, `.agent/`, `skills/`, `AGENTS.md`, `opencode.jsonc`, source code) = rỗng.

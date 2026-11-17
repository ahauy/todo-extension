---
name: design
description: |
  Sinh design tokens và screen spec sau brainstorm, hoặc khi chạy /design. Examples:
  <example>
  Context: Đã duyệt design doc và cần tokens
  user: "Tiếp tục design"
  assistant: "Dùng agent design, hỏi reference từng câu một rồi chờ confirm tokens."
  <commentary>
  Trigger đúng vai trò này; giữ nguyên gate và artifact của workflow gốc.
  </commentary>
  </example>
  <example>
  Context: User gõ /design
  user: "/design"
  assistant: "Dùng agent design để cập nhật design-spec.md và tokens."
  <commentary>
  Trigger đúng vai trò này; giữ nguyên gate và artifact của workflow gốc.
  </commentary>
  </example>
  Không dùng cho task ngoài phạm vi luật `AGENTS.md` và `.agent/`.
model: inherit
color: pink
tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "AskUserQuestion"]
---

# Design Agent (subagent)

Wrapper gọi `.agent/design.md`. Sinh design spec + design tokens **trước khi** Graph chia layer.

## Khi nào gọi
- **Tự động** ở project start: brainstorm (design doc + config) → **Design** → Graph.
- **Manual:** `/design` khi cần chạy lại/đổi design (spec + tokens đã có vẫn chạy lại được).

## Việc phải làm
Đọc + thực thi `.agent/design.md`:
1. Đọc `SPECIFICATIONS.md` + `.context/brainstorm-log.md` (+ ảnh/Figma nếu user đưa).
2. Đọc `skills/brainstorming/SKILL.md` tinh thần + `skills/<stack>/design-tokens.md` (đối chiếu).
3. Hỏi user design reference (ảnh / Figma / tự design) — **một câu một lúc**.
4. Sinh `skills/<stack>/design-tokens.md` (colors/typography/spacing/radius/shadows).
5. Sinh `.context/design-spec.md` (screen specs: layout/components/states/interactions).
6. Nếu có kiến trúc/flow đáng vẽ → `skills/archify` → `docs/diagrams/`.
7. **Confirm design tokens với user** trước khi sang Graph.

> Stack path: web `skills/react-nodejs/`, mobile `skills/react-native/`.

**Attribution:** completion report trả về mở đầu bằng `Agent: design`.

# Project: [PROJECT_NAME]

> 🔑 File này là source of truth. Opencode đọc file này đầu tiên mỗi session.
> 📊 Xem `graphify-out/graph.json` để hiểu structure + dependencies (auto-generated).

---

## 🚀 FIRST TIME SETUP — ĐỌC CÁI NÀY TRƯỚC

> Nếu `docs/specs/` chưa có design doc nào → project chưa được plan.
> **Chạy Phase 0: Brainstorming trước khi làm bất cứ thứ gì.**

### ▶ Phase 0: Brainstorming (bắt buộc trước khi code)

<HARD-GATE>
KHÔNG viết code, KHÔNG scaffold project, KHÔNG implement bất cứ thứ gì cho đến khi design được user approve và có file spec trong docs/specs/.
</HARD-GATE>

Làm theo thứ tự, từng bước xong confirm user trước khi tiếp:

**Bước 1 — Đọc Brief**
Đọc `docs/BRIEF.md` để nắm ý tưởng ban đầu.
Chỉ hỏi những gì còn thiếu hoặc mơ hồ, không hỏi lại những gì đã rõ.

**Bước 2 — Clarify (từng câu một)**
Hỏi từng câu một (KHÔNG hỏi nhiều cùng lúc).
Tập trung vào: purpose, constraints, success criteria, must-have vs nice-to-have.
Ưu tiên câu hỏi multiple choice khi có thể.

**Bước 3 — Propose 2-3 Approaches**
Đề xuất 2-3 hướng tiếp cận khác nhau với trade-offs rõ ràng.
Lead với recommendation của mày và giải thích lý do.

**Bước 4 — Present Design (từng section)**
Sau mỗi section, hỏi user confirm trước khi đi tiếp.
Các section: Architecture → Components → Data Flow → Error Handling → Testing Strategy

**Bước 5 — Viết Design Doc**
Lưu vào `docs/specs/YYYY-MM-DD-[topic]-design.md`.
Commit ngay sau khi viết xong.

**Bước 6 — Tự Review Spec**
Kiểm tra:
- Placeholder còn sót không? (TBD, TODO, [...])
- Có mâu thuẫn giữa các section không?
- Scope có quá lớn không? (nếu có → chia sub-projects)
- Có requirement nào mơ hồ không?
Fix inline, không cần hỏi lại.

**Bước 7 — User Review**
Hỏi user review file spec trước khi tiếp tục.
Chờ approve, nếu có changes thì update + re-review.

**Bước 8 — Lên Phases + Tasks**
Sau khi spec approved:
- Chia thành 4 phases, viết vào `docs/phases/`
- Update `CLAUDE.md` phần Stack, Folder Structure bên dưới
- Tạo `tasks/todo.md` cho Phase 1
- Xóa block "FIRST TIME SETUP" này

⚠️ KHÔNG code gì trong Phase 0. KHÔNG skip bước nào.

---

## Stack
[Điền sau Phase 0]

## Folder Structure
[Điền sau Phase 0]

## Coding Rules
- **TypeScript strict** — không dùng `any`
- **Test ngay** — mỗi task phải có unit test trước khi sang task mới
- **1 commit = 1 task** — commit message: `feat/fix/test/chore: [mô tả ngắn]`
- **Scope control** — không sửa file ngoài danh sách cho phép trong task
- **Error handling** — mọi async function phải handle error
- **Brainstorm trước khi thêm feature** — đọc `skills/brainstorming/SKILL.md`
- **Memory hooks** — auto-save/load context, xem `docs/MEMORY_HOOKS.md`
- **Continuous learning** — extract patterns, xem `docs/CONTINUOUS_LEARNING.md`

## Model Strategy

**Default Model:** Sonnet 4-6 (mọi task)  
**Brainstorming:** GPT-5.5 (Phase 0 planning)  
**Complex Tasks:** Opus 4-6 (refactor, architecture)  
**Fallback:** GPT-5.5 (nếu Sonnet fail)

### Khi Nào Dùng Từng Model?

**Sonnet 4-6** (default)
- Feature implementation
- Bug fix
- Test writing
- Documentation
- Regular development

**GPT-5.5** (brainstorming + fallback)
- Phase 0: Brainstorming + planning
- Clarify requirements
- Propose approaches
- Design review
- Fallback nếu Sonnet fail

**Opus 4-6** (complex tasks)
- Refactor lớn (> 5 files)
- Architecture changes
- Complex algorithm
- Performance optimization
- Deep reasoning needed

### Cách Chuyển Model

```bash
# Check model hiện tại
/status

# Chuyển sang GPT (brainstorming)
/model openai-codex/gpt-5.5

# Chuyển sang Opus (complex)
/model aihub-claude/claude-opus-4-6

# Quay lại Sonnet (default)
/model aihub-claude/claude-sonnet-4-6
```

### Tips
- Luôn check `/status` trước task
- Dùng Sonnet mặc định (rẻ + đủ tốt)
- Chuyển GPT cho brainstorming Phase 0
- Chuyển Opus khi cần reasoning sâu
- Quay lại Sonnet sau khi xong

## Current Phase
Phase 0 — Brainstorming (chưa bắt đầu)

## Current Task
Xem `tasks/todo.md`

## Skills Available

> **Scope rules để tránh conflict:**
> - `error-handling` → dùng cho **frontend** (React Error Boundaries, user-facing messages)
> - `nodejs-express-patterns` → có error handling riêng cho **backend** (Express middleware)
> - `security-best-practices` → deep dive auth/CORS/XSS; `api-design` chỉ mention auth ở mức HTTP status codes
> - `testing-vitest-jest` → **frontend** (Vitest + React Testing Library)
> - `testing-backend-jest` → **backend** (Jest + Supertest)
> - `frontend-agent` → overview/agent; các skill chuyên sâu (state, perf, a11y) là chi tiết hơn

### Phase 0 — Planning
- `skills/brainstorming/SKILL.md` — **Bắt buộc** trước mọi feature mới hoặc thay đổi lớn

### Frontend
- `skills/frontend-agent/SKILL.md` — Senior Frontend Developer agent, UI patterns, architecture
- `skills/typescript/SKILL.md` — TypeScript strict mode, type narrowing, inference
- `skills/tailwind-v4-shadcn/SKILL.md` — Tailwind CSS v4 + shadcn/ui, 8 common errors
- `skills/state-management-data-fetching/SKILL.md` — Zustand + TanStack Query, integration patterns
- `skills/testing-vitest-jest/SKILL.md` — Unit/component tests (Vitest + React Testing Library)
- `skills/performance-optimization/SKILL.md` — Core Web Vitals, code splitting, bundle analysis
- `skills/accessibility-a11y/SKILL.md` — WCAG 2.1, ARIA, keyboard navigation
- `skills/error-handling/SKILL.md` — React Error Boundaries, try/catch, user-facing messages
- `skills/git-workflow/SKILL.md` — Conventional commits, branch naming, PR process

### API & Integration
- `skills/api-design/SKILL.md` — REST principles, request/response format, versioning, pagination
- `skills/security-best-practices/SKILL.md` — OWASP Top 10, auth, CORS/CSRF, XSS prevention

### Backend (Node.js)
- `skills/nodejs-express-patterns/SKILL.md` — Express routing, middleware, controllers, services
- `skills/database-orm-patterns/SKILL.md` — Prisma/TypeORM, schema design, migrations, transactions
- `skills/testing-backend-jest/SKILL.md` — Unit/API tests (Jest + Supertest), mocking, fixtures

## Boilerplate (Stack-Conditional)

> Chỉ dùng khi stack là **React hoặc Next.js**. Bỏ qua nếu project là Node.js API thuần, Python, CLI, v.v.

Nếu Phase 0 xác định stack là React/Next.js:
1. Đọc `skills/boilerplate/react-nextjs/BOILERPLATE.md`
2. Follow setup commands và config files trong đó
3. Các skill `frontend-agent`, `typescript`, `tailwind-v4-shadcn` sẽ tự động áp dụng

Nếu stack khác → bỏ qua folder `skills/boilerplate/` hoàn toàn.

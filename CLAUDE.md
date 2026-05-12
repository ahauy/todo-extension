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

**Bước 1 — Đọc Brief & Specifications**
- Đọc `docs/BRIEF.md` để nắm ý tưởng ban đầu
- Nếu có `docs/SPECIFICATIONS.md` → đọc để hiểu chi tiết requirements, features, design
- Chỉ hỏi những gì còn thiếu hoặc mơ hồ, không hỏi lại những gì đã rõ

**Bước 2 — Clarify (từng câu một)**
- Hỏi từng câu một (KHÔNG hỏi nhiều cùng lúc)
- Tập trung vào: purpose, constraints, success criteria, must-have vs nice-to-have
- Ưu tiên câu hỏi multiple choice khi có thể

**Bước 3 — Propose 2-3 Approaches**
- Đề xuất 2-3 hướng tiếp cận khác nhau với trade-offs rõ ràng
- Lead với recommendation của mày và giải thích lý do

**Bước 4 — Present Design (từng section)**
- Sau mỗi section, hỏi user confirm trước khi đi tiếp
- Các section: Architecture → Components → Data Flow → Error Handling → Testing Strategy

**Bước 5 — Viết Design Doc**
- Lưu vào `docs/specs/YYYY-MM-DD-[topic]-design.md`
- Commit ngay sau khi viết xong

**Bước 6 — Tự Review Spec**
Kiểm tra:
- Placeholder còn sót không? (TBD, TODO, [...])
- Có mâu thuẫn giữa các section không?
- Scope có quá lớn không? (nếu có → chia sub-projects)
- Có requirement nào mơ hồ không?
Fix inline, không cần hỏi lại.

**Bước 7 — User Review**
- Hỏi user review file spec trước khi tiếp tục
- Chờ approve, nếu có changes thì update + re-review

**Bước 8 — Lên Layers + Tasks**
Sau khi spec approved:
- Phân tích dependency → chia thành layers (Layer 0, 1, 2, ...)
- Layer 0 (Foundation): không phụ thuộc vào layer khác
- Layer N: phụ thuộc vào Layer 0 → N-1
- Tạo `tasks/layer-0-todo.md` (Foundation tasks)
- Tạo `tasks/layer-1-todo.md`, `layer-2-todo.md`, ... khi cần
- Update `CLAUDE.md` phần Stack, Folder Structure bên dưới
- Xóa block "FIRST TIME SETUP" này

⚠️ KHÔNG code gì trong Phase 0. KHÔNG skip bước nào.

---

## 📋 Context

### 📋 Specifications
Xem `docs/SPECIFICATIONS.md` để chi tiết đầy đủ về chức năng, requirements, và design.

### 📋 Task Structure — Dependency-Driven
Dùng **Dependency-Driven approach**:
- `tasks/layer-0-todo.md` — Foundation (no dependency)
- `tasks/layer-1-todo.md` — Depends on Layer 0 (tạo khi cần)
- `tasks/layer-2-todo.md` — Depends on Layer 1 (tạo khi cần)
- ... (thêm layer tùy scope)
- `tasks/done.md` — Completed tasks

**Quy tắc:**
- Số layer phụ thuộc vào scope breakdown + dependency analysis
- Mỗi layer chứa nhiều task độc lập (không phải chỉ 1 task)
- Các task trong cùng layer có thể làm song parallel
- Chỉ khi layer N hoàn toàn xong → mới bắt đầu layer N+1
- Xem `docs/SCOPE_BREAKDOWN.md` để chi tiết



## Stack
[Điền sau Phase 0]

## Folder Structure

```
src/
├── components/
├── pages/
├── utils/
├── hooks/
├── types/
└── ...

docs/
├── BRIEF.md                    ← Tóm tắt project
├── SPECIFICATIONS.md           ← Chi tiết requirements
├── SCOPE_BREAKDOWN.md          ← Phân tích dependency + layers
├── specs/
│   └── YYYY-MM-DD-[topic]-design.md
└── ...

tasks/
├── layer-0-todo.md             ← Foundation tasks
├── layer-1-todo.md             ← Layer 1 tasks (tạo khi cần)
├── layer-2-todo.md             ← Layer 2 tasks (tạo khi cần)
└── done.md                     ← Completed tasks log

tests/
├── unit/
├── integration/
└── e2e/

.github/workflows/
├── ci.yml                      ← Quality gate
├── preview-build.yml           ← Preview artifact
└── production-build.yml        ← Production artifact
```

---

## 🔄 After Completion — Layer Refinement

Sau khi hoàn thành tất cả layer (Layer 0 → N), user sẽ check lại luồng/giao diện và báo bug hoặc feature mới.

### Workflow

1. **User báo** → Bug hoặc feature mới
2. **Em brainstorm** → Clarify + propose 2-3 approaches
3. **User approve** → Confirm phương án
4. **Tạo todo** → Add vào `tasks/layer-refinement-todo.md`
5. **Pick + implement** → Như layer khác

### Layer Refinement

- **File:** `tasks/layer-refinement-todo.md`
- **Mục đích:** Track bug fixes + feature requests sau khi hoàn thành
- **Workflow:** Brainstorm → Design → Implement (giống layer khác)

### Cách Thêm Task

Khi user báo bug/feature:

1. **Brainstorm** (Phase 0 style)
   - Clarify từng câu một
   - Propose 2-3 approaches
   - Present design từng section

2. **Tạo todo** vào `tasks/layer-refinement-todo.md`
   ```markdown
   ### [Task Number] — [Title]
   
   **Type:** Bug / Feature
   **Description:** ...
   **Acceptance Criteria:** ...
   **Status:** todo
   ```

3. **Pick + implement** như bình thường

---

## Coding Rules
- **TypeScript strict** — không dùng `any`
- **Test ngay** — mỗi task phải có unit test trước khi sang task mới
- **1 commit = 1 task** — commit message: `feat/fix/test/chore: [mô tả ngắn]`
- **Scope control** — không sửa file ngoài danh sách cho phép trong task
- **Error handling** — mọi async function phải handle error
- **Brainstorm trước khi thêm feature** — đọc `skills/brainstorming/SKILL.md`
- **Memory hooks** — auto-save/load context, xem `docs/MEMORY_HOOKS.md`
- **Continuous learning** — extract patterns, xem `docs/CONTINUOUS_LEARNING.md`
- **Resource file cho secrets** — KHÔNG hard-code key, url, password, username vào code. Lưu vào `.env` hoặc `config/resources.json` rồi gọi ra

---

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

---

## Current Layer
Layer 0 — Foundation (chưa bắt đầu)

## Current Task
Xem `tasks/layer-0-todo.md`

---

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
- `skills/llm-integration/SKILL.md` — OpenAI/Anthropic/Gemini APIs, token optimization, streaming

### Backend (Node.js)
- `skills/nodejs-express-patterns/SKILL.md` — Express routing, middleware, controllers, services
- `skills/database-orm-patterns/SKILL.md` — Prisma/TypeORM, schema design, migrations, transactions
- `skills/testing-backend-jest/SKILL.md` — Unit/API tests (Jest + Supertest), mocking, fixtures

### DevOps & Deployment
- `skills/boilerplate/SKILL.md` — Stack-conditional boilerplate (React, Next.js, Node.js, etc.)

---

## CI/CD Guidance

- PR/push phải qua quality gate: lint, typecheck, tests, build
- `develop` dùng cho preview build / review artifact
- production build nên manual hoặc approval-gated
- Chỉ thêm deploy provider-specific sau khi hosting được chốt rõ

---

## Boilerplate (Stack-Conditional)

> Chỉ dùng khi stack là **React hoặc Next.js**. Bỏ qua nếu project là Node.js API thuần, Python, CLI, v.v.

Nếu Phase 0 xác định stack là React/Next.js:
1. Đọc `skills/boilerplate/BOILERPLATE.md`
2. Follow setup commands và config files trong đó
3. Các skill `frontend-agent`, `typescript`, `tailwind-v4-shadcn` sẽ tự động áp dụng

Nếu stack khác → bỏ qua folder `skills/boilerplate/` hoàn toàn.

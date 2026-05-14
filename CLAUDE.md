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

**Bước 0 — Generate Knowledge Graph**
- Chạy: `graphify ./src`
- Output: `graphify-out/graph.json` (auto-generated)
- Dùng để: Opencode hiểu structure + dependencies của project
- Commit: Thêm `graphify-out/` vào `.gitignore` (không commit generated files)

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

## 🎨 Design System

**Template:** Claude Design (Anthropic)  
**Source:** `docs/DESIGN.md`

### CSS Variables
- **Colors:** `--color-primary`, `--color-text`, `--color-surface`, etc.
- **Spacing:** `--spacing-xs` (4px) → `--spacing-3xl` (64px)
- **Typography:** `--type-scale-xs` (12px) → `--type-scale-4xl` (36px)
- **Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

### Components
- **Button** (`src/components/Button.tsx`) - primary, secondary, outline, ghost
- **Card** (`src/components/Card.tsx`) - default, elevated, outlined
- More components coming...

### When Coding
1. Import CSS variables từ `src/styles/design-tokens.css`
2. Use components từ `src/components/`
3. Follow spacing scale (--spacing-*)
4. Follow color palette (--color-*)
5. Follow typography scale (--type-scale-*)
6. Maintain accessibility (WCAG AA)
7. Test responsive design (mobile, tablet, desktop)

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

## 🧠 Context Management

**Mục đích:** Tránh token tích dần khi chạy liên tục qua nhiều layer.

### Config
```yaml
contextManagement:
  mode: "checkpoint"           # Dùng checkpoint + semantic compression
  keepLayers: 1                # Chỉ giữ layer hiện tại + checkpoint
  checkpointFormat: "semantic" # Lưu architecture + decisions, không full code
  autoCompact: true            # Tự động compact context sau mỗi layer
  checkpointFile: "CHECKPOINT.md"
```

### Workflow

**Sau mỗi layer hoàn thành:**

1. **Tạo checkpoint** → Chạy script:
   ```bash
   npm run checkpoint
   ```
   Hoặc tạo `CHECKPOINT.md` theo template (xem bên dưới)

2. **Ghi lại:**
   - Architecture diagram (text)
   - Key decisions + rationale
   - API contracts (signatures, không full code)
   - Known issues + solutions
   - Completed tasks summary

3. **Compact context:**
   - Drop toàn bộ chat history từ layer trước
   - Giữ lại: current layer + checkpoint
   - Kết quả: context giảm 70-80%, vẫn đủ để chạy tiếp

4. **Layer tiếp theo:**
   - Load checkpoint thay vì full history
   - Nếu cần deep context → regenerate từ checkpoint

### Checkpoint Template

Xem `CHECKPOINT.md` (auto-generated sau mỗi layer).

### Tips

- **Semantic compression:** Thay vì lưu full code → lưu function signatures + comments
- **Decisions matter:** Ghi lại WHY, không chỉ WHAT
- **API contracts:** Lưu input/output types, không implementation
- **Known issues:** Ghi lại bugs/edge cases để layer tiếp theo tránh

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

### Browser & Testing Tools
- `docs/CHROME_DEVTOOLS_MCP.md` — Chrome DevTools MCP for browser automation, debugging, performance analysis, E2E testing

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

---

## 🎨 Agent Prompt Guide — Design System

**BẮTBUỘC đọc trước khi code UI/UX.**

### Lệnh cho Agents

Khi design/code bất kỳ UI/UX nào, agents phải:

```
Đọc docs/DESIGN.md trước khi bắt đầu.
Tuân theo design system Claude (Anthropic).
Sử dụng CSS variables từ src/styles/design-tokens.css.
Sử dụng components từ src/components/ (Button, Card, v.v.).
```

### CSS Variables (Bắt buộc)

**Luôn dùng CSS variables, KHÔNG bao giờ hardcode colors/spacing:**

```tsx
// ✅ GOOD
<div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text)' }}>
  Content
</div>

// ❌ BAD
<div style={{ padding: '16px', color: '#111827' }}>
  Content
</div>
```

### Components (Bắt buộc)

**Sử dụng components từ src/components/ cho UI consistency:**

```tsx
// ✅ GOOD
import { Button, Card } from '@/components';

export function MyPage() {
  return (
    <Card variant="default">
      <Button variant="primary" size="lg">
        Submit
      </Button>
    </Card>
  );
}

// ❌ BAD
export function MyPage() {
  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '16px' }}>
      <button style={{ backgroundColor: '#d97706', color: 'white' }}>
        Submit
      </button>
    </div>
  );
}
```

### Spacing Scale (Bắt buộc)

**Sử dụng spacing scale, KHÔNG bao giờ custom spacing:**

```css
--spacing-xs: 4px     /* Margin/padding rất nhỏ */
--spacing-sm: 8px     /* Margin/padding nhỏ */
--spacing-md: 16px    /* Default margin/padding */
--spacing-lg: 24px    /* Large margin/padding */
--spacing-xl: 32px    /* XL margin/padding */
--spacing-2xl: 48px   /* XXL margin/padding */
--spacing-3xl: 64px   /* Huge margin/padding */
```

### Color Palette (Bắt buộc)

**Sử dụng color palette, KHÔNG bao giờ custom colors:**

```css
--color-primary: #d97706           /* Main accent (Terracotta) */
--color-text: #111827              /* Dark text */
--color-text-secondary: #6b7280    /* Gray text */
--color-surface: #f9fafb           /* Light surface */
--color-border: #e5e7eb            /* Border color */
--color-success: #10b981           /* Success state */
--color-warning: #f59e0b           /* Warning state */
--color-error: #ef4444             /* Error state */
```

### Typography Scale (Bắt buộc)

**Sử dụng typography scale cho headings/text:**

```css
--type-scale-xs: 0.75rem   /* 12px - Small labels */
--type-scale-sm: 0.875rem  /* 14px - Captions */
--type-scale-base: 1rem    /* 16px - Body text */
--type-scale-lg: 1.125rem  /* 18px - Subheadings */
--type-scale-xl: 1.25rem   /* 20px - Section titles */
--type-scale-2xl: 1.5rem   /* 24px - Page titles */
--type-scale-3xl: 1.875rem /* 30px - Hero titles */
--type-scale-4xl: 2.25rem  /* 36px - Main headlines */
```

### Accessibility (Bắt buộc)

**Mỗi component phải:**

- ✅ Có keyboard navigation support (Tab, Enter, Escape)
- ✅ Có focus states rõ ràng (`outline: 2px solid var(--color-primary)`)
- ✅ Có proper ARIA labels (`aria-label`, `aria-describedby`)
- ✅ Có sufficient color contrast (≥ 4.5:1 for text)
- ✅ Được test với screen readers

### Responsive Design (Bắt buộc)

**Mobile-first approach:**

```css
/* Mobile first */
body { font-size: var(--type-scale-sm); }

/* Tablet + */
@media (min-width: 768px) {
  body { font-size: var(--type-scale-base); }
}

/* Desktop + */
@media (min-width: 1024px) {
  body { font-size: var(--type-scale-lg); }
}
```

### Testing (Bắt buộc)

**Trước khi push, phải test:**

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessibility (keyboard, screen reader, color contrast)
- ✅ Browser compatibility (Chrome, Firefox, Safari)
- ✅ Dark mode (nếu có)

### Checklist Trước Khi Commit

- [ ] Đã dùng CSS variables (KHÔNG hardcode colors/spacing)
- [ ] Đã dùng components từ src/components/
- [ ] Đã follow spacing scale
- [ ] Đã follow typography scale
- [ ] Đã maintain accessibility (WCAG AA)
- [ ] Đã test responsive design
- [ ] Đã update docs/DESIGN.md nếu thêm component mới
- [ ] Đã test trên mobile, tablet, desktop

---

**Nếu bất cứ câu hỏi nào về design system, hãy đọc `docs/DESIGN.md` trước tiên.**

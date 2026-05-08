# 🚀 Opencode Project Template

> Production-ready template để khởi động project mới với Opencode.  
> Tích hợp Brainstorming → Design → Scope Breakdown → Code → Test → Monitor workflow.

---

## ✨ Tại Sao Dùng Template Này?

- **Brainstorm trước, code sau** — design doc được approve trước khi viết dòng code đầu tiên
- **Scope breakdown tối ưu** — 3 cách chia scope (Feature-Based, Epic-Based, Dependency-Driven)
- **Không mất context** — auto-save/load context qua sessions
- **Không code lung tung** — plan rõ ràng, task nhỏ, test ngay
- **Auto-learn từ mistakes** — continuous learning system
- **Understand codebase** — Graphify knowledge graph
- **Production-ready** — monitoring, error tracking, metrics, CI/CD

---

## 📋 Yêu Cầu

- [Opencode](https://opencode.ai) đã cài
- `git` đã cài
- `bash` (macOS / Linux / WSL) HOẶC `cmd`/`PowerShell` (Windows)
- `npm` hoặc `pnpm`
- Chrome browser (cho E2E testing)

---

## 🏁 Bắt Đầu

### Bước 1: Clone template

```bash
git clone https://github.com/ocanhdt12-gif/opencode-project-template my-project
cd my-project
```

### Bước 2: Chạy script khởi tạo

**Linux / macOS:**
```bash
./scripts/start-project.sh
```

**Windows (CMD):**
```cmd
scripts\start-project.bat
```

**Windows (PowerShell):**
```powershell
.\scripts\start-project.ps1
```

Script hỏi 5 bước:

```
Step 1/4: Project name
  Tên project: my-awesome-app

Step 2/4: Brain dump ý tưởng
  Bạn muốn nhập từ file không? (y/n) [default: n]: 
```

**Option 1: Nhập từ file** (cho ý tưởng dài)
```
Bạn muốn nhập từ file không? (y/n) [default: n]: y
Đường dẫn file: /path/to/brain-dump.txt
```

**Option 2: Gõ trực tiếp** (cách cũ)
```
Bạn muốn nhập từ file không? (y/n) [default: n]: n
(Nhấn Enter 2 lần để xong)
```

Sau đó script tự:
- Replace tên vào toàn bộ files
- Ghi brain dump → `docs/BRIEF.md`
- Reset git history (fresh repo)

**Step 5: Tạo GitHub repo (tùy chọn)**
```
Step 5/5: GitHub repo
  Tạo repo trên GitHub không? (y/n) [default: n]: y
  Đang tạo repo...
  ✅ Repo created: https://github.com/ocanhdt12-gif/my-awesome-app
```

Nếu chọn **yes**:
- Script tự động tạo repo public trên GitHub
- Tên repo: `my-awesome-app` (lowercase, spaces → hyphens)
- Description: Lấy từ brain dump
- Tự động push code lên

Nếu chọn **no**:
- Bỏ qua tạo GitHub repo
- Bạn có thể push thủ công sau:
  ```bash
  git remote add origin git@github.com:ocanhdt12-gif/my-awesome-app.git
  git push -u origin main
  ```

### Bước 3: Mở Opencode

```bash
opencode .
```

Opencode tự đọc `CLAUDE.md` → kích hoạt **Brainstorming Phase**.

---

## 🗂️ Cấu Trúc Project

```
my-project/
│
├── CLAUDE.md                      ← 🔑 Source of truth cho Opencode
│
├── docs/
│   ├── BRIEF.md                   ← Brain dump ban đầu
│   ├── SCOPE_BREAKDOWN.md         ← 3 cách chia scope
│   ├── MONITORING.md              ← Sentry + Prometheus + Grafana
│   ├── MEMORY_HOOKS.md            ← Auto-save/load context
│   ├── CONTINUOUS_LEARNING.md     ← Auto-extract patterns
│   ├── GRAPHIFY.md                ← Knowledge graph builder
│   ├── CI_CD_WEB.md               ← Web CI/CD flow
│   ├── specs/                     ← Design docs (output của brainstorming)
│   │   └── YYYY-MM-DD-[topic]-design.md
│   └── phases/
│       └── phase-0.md             ← Brainstorming instructions
│
├── skills/
│   └── brainstorming/
│       └── SKILL.md               ← Reusable brainstorming workflow
│
├── memory/                        ← Auto-save context từ sessions
│   └── .gitkeep
│
├── .learnings/                    ← Auto-extract patterns + lessons
│   └── .gitkeep
│
├── tasks/
│   ├── todo.md                    ← Task hiện tại + up next
│   ├── done.md                    ← Log tasks đã xong
│   ├── layer-0-todo.md            ← Layer 0 tasks (nếu dùng Dependency-Driven)
│   ├── layer-1-todo.md            ← Layer 1 tasks
│   ├── layer-2-todo.md            ← Layer 2 tasks
│   └── layer-3-todo.md            ← Layer 3 tasks (hoặc thêm layer nếu cần)
│
├── src/                           ← Source code
│
├── tests/
│   ├── unit/                      ← Viết cùng lúc với code
│   ├── integration/               ← Viết cuối mỗi layer
│   └── e2e/                       ← Viết trước release
│
├── scripts/
│   ├── start-project.sh           ← Script khởi tạo project
│   ├── start-project.bat          ← Windows CMD version
│   └── start-project.ps1          ← Windows PowerShell version
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 ← Quality gate (lint, typecheck, test, build)
│       ├── preview-build.yml      ← Preview artifact
│       └── production-build.yml   ← Production artifact
│
├── docker-compose.monitoring.yml  ← Prometheus + Grafana
├── prometheus.yml                 ← Prometheus config
├── .env.example                   ← Env vars template
└── .gitignore
```

**Lưu ý:** Folder structure linh hoạt tùy cách chia scope:
- **Feature-Based:** dùng `tasks/todo.md` chung
- **Epic-Based:** dùng `tasks/epic-1-todo.md`, `tasks/epic-2-todo.md`, etc.
- **Dependency-Driven:** dùng `tasks/layer-0-todo.md`, `tasks/layer-1-todo.md`, etc.

---

## 🔄 Full Dev Process

```
./scripts/start-project.sh
  → Nhập tên + brain dump
  → docs/BRIEF.md tạo xong
        ↓
opencode .
        ↓
┌─── PHASE 0: BRAINSTORMING ────────────────────────┐
│  Đọc BRIEF → clarify từng câu một                 │
│  Propose 2-3 approaches + trade-offs              │
│  Present design → confirm từng section            │
│  Viết docs/specs/YYYY-MM-DD-design.md            │
│  Tự review → user approve                        │
│  Phân tích dependency + chia scope                │
└───────────────────────────────────────────────────┘
        ↓
┌─── SCOPE BREAKDOWN ───────────────────────────────┐
│  Chọn cách chia scope:                            │
│  - Feature-Based (scope nhỏ)                      │
│  - Epic-Based (scope lớn, cứng nhắc)             │
│  - Dependency-Driven ⭐ (scope lớn, flexible)    │
│                                                   │
│  Xem docs/SCOPE_BREAKDOWN.md để chọn             │
└───────────────────────────────────────────────────┘
        ↓
┌─── LAYER 0: FOUNDATION ───────────────────────────┐
│  (No dependency)                                  │
│  ┌── TASK LOOP ──────────────────────────────┐   │
│  │ Pick task từ layer-0-todo.md              │   │
│  │ → Code task (1 prompt = 1 task)           │   │
│  │ → Viết unit test ngay                    │   │
│  │ → Chạy test → fix nếu fail               │   │
│  │ → Commit + update todo.md                │   │
│  │ → Lặp lại                                │   │
│  └───────────────────────────────────────────┘   │
│  Cuối layer: Integration test                     │
└───────────────────────────────────────────────────┘
        ↓ (Layer 0 xong → Layer 1 start)
┌─── LAYER 1: CORE FEATURES ────────────────────────┐
│  (Depends on Layer 0)                             │
│  Tương tự Layer 0                                 │
└───────────────────────────────────────────────────┘
        ↓
┌─── LAYER 2: SECONDARY ────────────────────────────┐
│  (Depends on Layer 1)                             │
│  Tương tự Layer 0                                 │
└───────────────────────────────────────────────────┘
        ↓
┌─── LAYER 3: POLISH + RELEASE ─────────────────────┐
│  (Depends on Layer 2)                             │
│  E2E test → fix → deploy staging                 │
│  User review staging → deploy production 🚀      │
└───────────────────────────────────────────────────┘
```

**Lợi ích Dependency-Driven:**
- ✅ Agent không bị block (Layer 0 xong → Layer 1 start)
- ✅ Dễ parallelize (nhiều agent làm layer khác nhau)
- ✅ Flexible (có thể adjust layer nếu cần)
- ✅ Tối ưu timeline

---

## 📊 Scope Breakdown

Khi scope lớn, template hỗ trợ 3 cách chia scope:

### 1. Feature-Based
- Chia theo feature/user story
- Ưu: Dễ hiểu, dễ demo
- Nhược: Khó parallelize, có thể bị block
- Dùng khi: Scope nhỏ (< 10 features), features độc lập

### 2. Epic-Based
- Chia theo Epic → Stories, theo phase
- Ưu: Rõ ràng, dễ track progress
- Nhược: Cứng nhắc, khó adjust
- Dùng khi: Scope lớn (> 15 features), timeline cố định

### 3. Dependency-Driven ⭐ (Recommended)
- Chia theo dependency layer (Layer 0 → 1 → 2 → 3 → ...)
- Layer 0: Foundation (no dependency)
- Layer N: Depends on Layer 0 → N-1
- Ưu: Không block, dễ parallelize, flexible, tối ưu timeline
- Nhược: Cần phân tích dependency kỹ
- Dùng khi: Scope lớn, cần parallelize, nhiều agent/team

**QUAN TRỌNG:** Layer count flexible — có thể chia 4, 5, 6+ layers tùy scope, miễn là không vi phạm quy tắc dependency.

Xem `docs/SCOPE_BREAKDOWN.md` để chi tiết.

---

## 🚦 Web CI/CD Flow

Template này có 3 lớp verify:

### 1. Local Development
```bash
npm run dev
```
- Hot reload + debug UI trực tiếp
- Chạy browser automation / manual test
- Nơi để catch lỗi nhanh nhất

### 2. GitHub Actions Quality Gate
Trigger: PR hoặc push vào `main` / `develop`

Workflow: `.github/workflows/ci.yml`

Checks:
- ✅ Lint
- ✅ TypeScript typecheck
- ✅ Unit tests
- ✅ Integration tests
- ✅ Build sanity check

**Nếu fail:** PR không merge được, phải fix local rồi push lại.

### 3. Preview Build
Trigger: push vào `develop` hoặc manual `workflow_dispatch`

Workflow: `.github/workflows/preview-build.yml`

Output:
- Build artifact upload lên GitHub Actions
- Download để review/test
- Dùng trước khi merge vào `main`

### 4. Production Build
Trigger: manual `workflow_dispatch` (chỉ từ `main`)

Workflow: `.github/workflows/production-build.yml`

Output:
- Production artifact upload
- Có `environment: production` để gắn approval nếu cần
- Sẵn sàng cho deploy provider thật

**Provider-agnostic:** Template này chưa hard-code Vercel/Netlify/Cloudflare. Khi project chốt hosting, thêm bước deploy provider-specific vào workflow.

Xem `docs/CI_CD_WEB.md` để full guide.

---

## 🧠 Memory & Learning

### Memory Hooks
Auto-save/load context qua sessions:
- Session end: save → `memory/YYYY-MM-DD.md`
- Session start: load từ `memory/`
- Xem `docs/MEMORY_HOOKS.md` để setup

### Continuous Learning
Auto-extract patterns + lessons:
- Extract → `.learnings/YYYY-MM-DD-[topic].md`
- Promote → AGENTS.md / TOOLS.md khi validated
- Tránh lỗi cũ lần sau
- Xem `docs/CONTINUOUS_LEARNING.md` để setup

---

## 📊 Knowledge Graph (Graphify)

Auto-generate knowledge graph từ codebase:

```bash
# Install
pip install graphify

# Generate graph
graphify ./src

# Output
graphify-out/
  ├── graph.html              # Interactive visualization
  ├── GRAPH_REPORT.md         # Core nodes + surprises
  ├── graph.json              # Queryable graph (for Opencode)
  └── cache/
```

**Usage:**
- Review `GRAPH_REPORT.md` sau major changes
- Open `graph.html` để explore architecture
- Opencode reads `graph.json` để hiểu structure
- Run trước release để catch architecture drift

Xem `docs/GRAPHIFY.md` để full guide.

---

## 📊 Monitoring

Production-ready monitoring stack:

### Tools
- **Sentry** — Error tracking + source maps
- **Prometheus** — Metrics collection
- **Grafana** — Metrics visualization

### Quick Start

**1. Setup Sentry**
```bash
# Tạo account: https://sentry.io
# Lấy DSN → .env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**2. Start Prometheus + Grafana**
```bash
docker-compose -f docker-compose.monitoring.yml up -d

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

**3. Full Guide**
Xem `docs/MONITORING.md` để:
- Init Sentry trong Node.js + React
- Setup Prometheus metrics
- Create Grafana dashboards
- Deploy production

---

## 🧪 Testing Strategy

| Loại | Khi nào viết | Tool |
|------|-------------|------|
| **Unit** | Ngay sau mỗi task | Vitest |
| **Integration** | Cuối mỗi layer | Vitest + Supertest |
| **E2E** | Trước release | Playwright |

---

---

## 🛠️ Skills

Skills là các instruction set chuyên biệt giúp AI code đúng pattern, đúng convention, và tránh lỗi phổ biến. Mỗi skill nằm trong `skills/<tên>/SKILL.md`.

| Skill | Mô tả |
|-------|-------|
| `brainstorming` | Dùng TRƯỚC khi làm bất kỳ feature mới. Explore ý tưởng, clarify requirements, propose approaches, viết design doc trước khi code |
| `boilerplate` | Tạo boilerplate code cho các pattern phổ biến |
| `typescript` | Viết TypeScript type-safe với proper narrowing, inference patterns, và strict mode |
| `api-design` | REST API best practices: request/response structure, error handling, versioning, authentication |
| `nodejs-express-patterns` | Express.js best practices: routing, middleware, error handling, validation, production patterns |
| `database-orm-patterns` | Database design và ORM: schema, migrations, relationships, query optimization với Prisma/TypeORM/Sequelize |
| `frontend-agent` | Senior Frontend Developer agent — React/Vue/Angular, UI implementation, performance optimization |
| `state-management-data-fetching` | Quản lý state với Zustand và server state với TanStack Query: store design, selectors, mutations, caching |
| `tailwind-v4-shadcn` | Setup Tailwind CSS v4 + shadcn/ui, tránh 8 documented errors qua mandatory four-step architecture |
| `testing-vitest-jest` | Unit, integration, component tests với Vitest + React Testing Library, coverage 80%+ |
| `testing-backend-jest` | Unit, integration, API tests cho Node.js backend với Jest + Supertest, coverage 80%+ |
| `error-handling` | Error handling patterns: try/catch, error boundaries, logging, monitoring, user-facing messages |
| `security-best-practices` | Security: authentication, authorization, CORS/CSRF, secrets management, XSS prevention, OWASP Top 10 |
| `performance-optimization` | Core Web Vitals, code splitting, lazy loading, image optimization, bundle analysis |
| `llm-integration` | Tích hợp LLM APIs (OpenAI, Anthropic, Gemini): token optimization, streaming, caching, cost control |
| `prompt-engineering` | Viết prompts hiệu quả: structured prompting, few-shot examples, chain-of-thought, cost reduction |
| `git-workflow` | Git best practices: conventional commits, branch naming, PR process, merge strategies |
| `accessibility-a11y` | Accessibility: WCAG 2.1, semantic HTML, ARIA attributes, keyboard navigation, screen reader testing |

## 📌 Rules Vàng

| Rule | Lý do |
|------|-------|
| Brainstorm trước khi code | Tránh build sai thứ |
| Design doc phải được approve | Hard gate, không skip |
| `CLAUDE.md` là source of truth | Opencode đọc đầu tiên |
| 1 prompt = 1 task | Context nhỏ → output tốt |
| Test viết ngay, không để cuối | Tránh bug chồng bug |
| Commit sau mỗi task | Rollback dễ |
| Review memory/ + learnings/ | Tránh lỗi cũ |

---

## 📝 Prompt Templates

### Bắt đầu task mới
```
Đọc CLAUDE.md → docs/phases/phase-0.md → tasks/todo.md

Implement task "In Progress".
Chỉ sửa files được liệt kê trong task.

Sau khi xong:
1. Viết unit test
2. Chạy test, fix nếu fail
3. Commit: feat/fix/test: [mô tả ngắn]
4. Move task sang done.md
5. Báo kết quả ngắn gọn
```

### Thêm feature mới
```
Đọc skills/brainstorming/SKILL.md và brainstorm feature sau:
[Mô tả feature]
```

### Generate knowledge graph
```bash
graphify ./src
# Review graphify-out/GRAPH_REPORT.md
```

---

## 🔗 Resources

- **Scope Breakdown:** `docs/SCOPE_BREAKDOWN.md`
- **Brainstorming Skill:** `skills/brainstorming/SKILL.md`
- **Memory Hooks:** `docs/MEMORY_HOOKS.md`
- **Continuous Learning:** `docs/CONTINUOUS_LEARNING.md`
- **Graphify:** `docs/GRAPHIFY.md`
- **Monitoring:** `docs/MONITORING.md`
- **Web CI/CD:** `docs/CI_CD_WEB.md`

---

## 📜 License

MIT

# 🚀 Opencode Project Template

> Production-ready template để khởi động **Web project** mới với **[Opencode](https://opencode.ai)**.  
> Tích hợp Brainstorming → Design → Scope Breakdown → Code → Test → Monitor workflow.

![AI Tool](https://img.shields.io/badge/AI-Opencode-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNS0xMC01LTEwIDV6TTIgMTJsMTAgNSAxMC01LTEwLTUtMTAgNXoiLz48L3N2Zz4=) ![Platform](https://img.shields.io/badge/Platform-Web-green) ![Language](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20TypeScript-blue)

### 🤖 Dành cho Opencode
Template này được tối ưu cho **Opencode** — AI coding assistant chạy trong terminal.  
Cấu trúc `CLAUDE.md`, `skills/`, `docs/` được thiết kế để Opencode đọc và làm việc hiệu quả nhất.

---

## ✨ Tại Sao Dùng Template Này?

- **Brainstorm trước, code sau** — design doc được approve trước khi viết dòng code đầu tiên
- **Scope breakdown tối ưu** — Dependency-Driven approach (Layer 0 → 1 → 2 → ...)
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

### Luồng Script

```
User chạy script
  ↓
Step 1: Nhập tên project
  ↓
Step 2: Script hỏi "Bạn có file mô tả chức năng không? (y/n)"
  ↓
Nếu YES → nhập đường dẫn file
  → Copy vào docs/SPECIFICATIONS.md
  → Tạo docs/BRIEF.md (tóm tắt)
  ↓
Nếu NO → gõ brain dump text (cách cũ)
  → Tạo docs/BRIEF.md
  ↓
Update CLAUDE.md reference cả 2 file
  ↓
Tạo tasks/layer-0-todo.md (Foundation)
  ↓
Step 3: Reset git history (fresh repo)
  ↓
Step 4: Script hỏi "Tạo repo trên GitHub không? (y/n)"
  ↓
Nếu YES → tạo repo + push lên GitHub
  ↓
Nếu NO → hướng dẫn push thủ công
  ↓
OpenCode đọc CLAUDE.md → bắt đầu Phase 0
```

### Cách Dùng

```bash
./scripts/start-project.sh
# Step 1: Nhập tên project
# Step 2: Nhập đường dẫn file mô tả (hoặc Enter để skip)
# → Script tự tạo files + git init
# → Mở folder trong Opencode → Phase 0 tự bắt đầu
```

---

## 🗂️ Cấu Trúc Project

```
my-project/
│
├── CLAUDE.md                      ← 🔑 Source of truth cho Opencode
│
├── docs/
│   ├── BRIEF.md                   ← Brain dump ban đầu (tóm tắt)
│   ├── SPECIFICATIONS.md          ← Chi tiết requirements (nếu có file)
│   ├── SCOPE_BREAKDOWN.md         ← Phân tích dependency + layers
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
│   ├── layer-0-todo.md            ← Foundation tasks (no dependency)
│   ├── layer-1-todo.md            ← Layer 1 tasks (tạo khi cần)
│   ├── layer-2-todo.md            ← Layer 2 tasks (tạo khi cần)
│   ├── layer-N-todo.md            ← Tạo tùy scope breakdown
│   └── done.md                    ← Completed tasks log
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

---

## 📊 Scope Breakdown — Dependency-Driven

Template này dùng **Dependency-Driven approach** làm mặc định:

- **Layer 0 (Foundation):** Chứa nhiều task độc lập (database, API base, auth, UI components, etc.)
- **Layer 1, 2, 3+:** Chứa nhiều task phụ thuộc vào layer trước
- Các task trong cùng layer có thể làm **song parallel**
- Chỉ khi layer N xong → mới bắt đầu layer N+1

### Cấu Trúc Task

```
tasks/
├── layer-0-todo.md      ← Foundation tasks (tạo mặc định)
├── layer-1-todo.md      ← Tạo khi layer 0 xong
├── layer-2-todo.md      ← Tạo khi layer 1 xong
├── layer-N-todo.md      ← Tạo tùy scope breakdown
└── done.md              ← Completed tasks log
```

### Quy Tắc

- ✅ Số layer **phụ thuộc vào scope breakdown** — không cố định
- ✅ Mỗi layer chứa **nhiều task độc lập** (không phải chỉ 1 task)
- ✅ Các task trong cùng layer có thể làm **song parallel**
- ✅ Chỉ khi layer N hoàn toàn xong → mới bắt đầu layer N+1
- ✅ Không block — dễ parallelize, tối ưu timeline

### Cách Tạo Layer Tiếp Theo

Xem hướng dẫn trong `tasks/layer-0-todo.md` để tạo `layer-1-todo.md`, `layer-2-todo.md`, ...

Xem `docs/SCOPE_BREAKDOWN.md` để chi tiết.

---

## 🚦 Web CI/CD Flow

Template này có 4 lớp verify:

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
| `chrome-devtools-mcp` | Chrome DevTools MCP for browser automation & E2E testing: Playwright, Puppeteer, CDP protocol |

---

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
| Dùng resource file cho secrets | Không hard-code key, url, password vào code |

---

## 📝 Prompt Templates

### Bắt đầu task mới
```
Đọc CLAUDE.md → tasks/layer-0-todo.md

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


---

## 🎯 Team Workflow

### Pick Task

Khi team làm việc, mỗi người cần pick 1 task từ layer hiện tại:

```bash
npm run pick-task
```

**Script sẽ:**
1. Detect layer hiện tại (layer-0, layer-1, ...)
2. Hiển thị danh sách todo tasks
3. Hỏi bạn pick task nào
4. Hỏi tên người pick
5. Update task file (status = in-progress, assigned = tên)
6. **Commit + push tự động** lên main
7. Tạo feature branch sẵn

**Workflow cụ thể:**

```bash
# 1. Pull latest
git pull origin main

# 2. Pick task (tự động update + push)
npm run pick-task
# → Chọn task → Nhập tên → Xong!

# 3. Làm việc trong feature branch
# (branch đã được tạo sẵn)
git status  # Xem branch hiện tại

# 4. Commit + push khi xong
git add .
git commit -m "feat: Task description"
git push origin feature/task-X-...

# 5. Merge vào main (hoặc tạo PR)
```

**Lợi ích:**
- ✅ Mọi người pull về sẽ thấy task đã assign → không ai pick lại
- ✅ Task file luôn up-to-date trên main
- ✅ Tránh conflict khi 2 người cùng pick task
- ✅ Mỗi task = 1 branch riêng → dễ review + rollback

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

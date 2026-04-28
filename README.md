# 🚀 Opencode Project Template

> Production-ready template để khởi động project mới với Opencode.  
> Tích hợp Brainstorming → Design → Plan → Code → Test → Monitor workflow.

---

## ✨ Tại Sao Dùng Template Này?

- **Brainstorm trước, code sau** — design doc được approve trước khi viết dòng code đầu tiên
- **Không mất context** — auto-save/load context qua sessions
- **Không code lung tung** — plan rõ ràng, task nhỏ, test ngay
- **Auto-learn từ mistakes** — continuous learning system
- **Understand codebase** — Graphify knowledge graph
- **Production-ready** — monitoring, error tracking, metrics

---

## 📋 Yêu Cầu

- [Opencode](https://opencode.ai) đã cài
- `git` đã cài
- `bash` (macOS / Linux / WSL) HOẶC `cmd`/`PowerShell` (Windows)
- `python 3.10+` (cho Graphify)
- `npm` (cho Chrome DevTools MCP)
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

Script hỏi 2 thứ:

```
Step 1/4: Project name
  Tên project: my-awesome-app

Step 2/4: Brain dump ý tưởng
  App làm gì, user là ai, stack muốn dùng...
  (Enter 2 lần để xong)
```

Sau đó tự:
- Replace tên vào toàn bộ files
- Ghi brain dump → `docs/BRIEF.md`
- Reset git history (fresh repo)

### Bước 3: Mở Opencode

```bash
opencode .
```

Opencode tự đọc `CLAUDE.md` → kích hoạt **Phase 0: Brainstorming**:

```
Đọc docs/BRIEF.md
      ↓
Hỏi từng câu một để clarify
      ↓
Propose 2-3 approaches + trade-offs
      ↓
Present design từng section → confirm
      ↓
Viết docs/specs/YYYY-MM-DD-design.md → commit
      ↓
Tự review spec
      ↓
Anh review + approve
      ↓
Chia phases + tạo tasks → bắt đầu code 🚀
```

---

## 🎮 Browser Automation & E2E Testing

Template bao gồm Chrome DevTools MCP cho browser automation:

### What is Chrome DevTools MCP?
- MCP server điều khiển live Chrome browser
- Automate browser actions (click, type, navigate)
- Take screenshots & record videos
- Inspect network requests
- Analyze performance traces

### Quick Start
```bash
# Install MCP server
npm install -g chrome-devtools-mcp

# Configure Opencode
# Edit ~/.config/opencode/opencode.json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}

# Restart Opencode
opencode .
```

### Usage
- Phase 4: E2E testing trước release
- Test user flows (sign up, login, create, edit, delete)
- Check performance + network
- Screenshot results

Xem `docs/CHROME_DEVTOOLS_MCP.md` để full guide.

---

## 🗂️ Cấu Trúc Project

```
my-project/
│
├── CLAUDE.md                      ← 🔑 Source of truth cho Opencode
│
├── docs/
│   ├── BRIEF.md                   ← Brain dump ban đầu
│   ├── MONITORING.md              ← Sentry + Prometheus + Grafana setup
│   ├── MEMORY_HOOKS.md            ← Auto-save/load context
│   ├── CONTINUOUS_LEARNING.md     ← Auto-extract patterns
│   ├── GRAPHIFY.md                ← Knowledge graph builder
│   ├── specs/                     ← Design docs (output của brainstorming)
│   │   └── YYYY-MM-DD-[topic]-design.md
│   └── phases/
│       ├── phase-0.md             ← Brainstorming instructions
│       ├── phase-1.md             ← Foundation
│       ├── phase-2.md             ← Core Features
│       ├── phase-3.md             ← UI + Polish
│       └── phase-4.md             ← Testing + Deploy
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
│   └── done.md                    ← Log tasks đã xong
│
├── src/                           ← Source code
│
├── tests/
│   ├── unit/                      ← Viết cùng lúc với code
│   ├── integration/               ← Viết cuối mỗi phase
│   └── e2e/                       ← Viết trước release
│
├── scripts/
│   └── start-project.sh           ← Script khởi tạo project
│
├── .github/
│   └── workflows/ci.yml           ← CI pipeline
│
├── docker-compose.monitoring.yml  ← Prometheus + Grafana
├── prometheus.yml                 ← Prometheus config
├── .env.example                   ← Env vars template
└── .gitignore
```

---

## 🔄 Full Dev Process

```
./scripts/start-project.sh
  → Nhập tên + brain dump
  → docs/BRIEF.md tạo xong
        ↓
opencode .
        ↓
┌─── PHASE 0: BRAINSTORMING ─────────────────────────┐
│  Đọc BRIEF → clarify từng câu một                  │
│  Propose 2-3 approaches                            │
│  Present design → confirm từng section             │
│  Viết docs/specs/YYYY-MM-DD-design.md             │
│  Tự review → user approve                         │
│  Chia phases + tạo tasks/todo.md                  │
└─────────────────────────────────────────────────────┘
        ↓
┌─── PHASE 1-3: DEVELOPMENT ─────────────────────────┐
│                                                    │
│  ┌── TASK LOOP ──────────────────────────────┐    │
│  │ Pick task từ todo.md                      │    │
│  │ → Code task (1 prompt = 1 task)           │    │
│  │ → Viết unit test ngay                    │    │
│  │ → Chạy test → fix nếu fail               │    │
│  │ → Commit + update todo.md                │    │
│  │ → Lặp lại                                │    │
│  └───────────────────────────────────────────┘    │
│                                                    │
│  Cuối mỗi phase: Integration test                  │
│  Review memory/ + .learnings/ để tránh lỗi cũ     │
└─────────────────────────────────────────────────────┘
        ↓
┌─── PHASE 4: RELEASE ───────────────────────────────┐
│  E2E test → fix → deploy staging                  │
│  Anh review staging → deploy production 🚀        │
└─────────────────────────────────────────────────────┘
```

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
pip install graphifyy

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

## 🧠 Brainstorming Skill (Thêm Feature Mới)

Khi project đang chạy và muốn thêm feature mới:

```
"Đọc skills/brainstorming/SKILL.md và brainstorm feature sau:
[Mô tả feature muốn thêm]"
```

Skill sẽ tự động:
1. Explore context hiện tại
2. Hỏi từng câu để clarify
3. Propose 2-3 approaches
4. Viết design doc mới vào `docs/specs/`
5. Tạo tasks cho feature đó

---

## 🧪 Testing Strategy

| Loại | Khi nào viết | Tool |
|------|-------------|------|
| **Unit** | Ngay sau mỗi task | Vitest |
| **Integration** | Cuối mỗi phase | Vitest + Supertest |
| **E2E** | Trước release | Playwright |

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
| **Phase 0: Dùng GPT-5.5** | Brainstorming tốt hơn |
| **Dev: Dùng Sonnet (default)** | Rẻ + đủ tốt |
| **Complex: Dùng Opus** | Refactor lớn, architecture |

---

## 📝 Prompt Templates

### Bắt đầu task mới
```
Đọc CLAUDE.md → docs/phases/phase-N.md → tasks/todo.md

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

- **Brainstorming Skill:** `skills/brainstorming/SKILL.md`
- **Memory Hooks:** `docs/MEMORY_HOOKS.md`
- **Continuous Learning:** `docs/CONTINUOUS_LEARNING.md`
- **Graphify:** `docs/GRAPHIFY.md`
- **Monitoring:** `docs/MONITORING.md`

---

## 📜 License

MIT

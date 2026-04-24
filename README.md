# 🚀 Opencode Project Template

> Template chuẩn để khởi động project mới với Opencode.  
> Tích hợp Brainstorming → Design → Plan → Code → Test workflow.

---

## ✨ Tại Sao Dùng Template Này?

- **Brainstorm trước, code sau** — design doc được approve trước khi viết dòng code đầu tiên
- **Không mất context** — Opencode luôn biết đang làm gì, đang ở phase nào
- **Không code lung tung** — plan rõ ràng, task nhỏ, test ngay
- **Reusable brainstorming skill** — thêm feature mới cũng có workflow chuẩn

---

## 📋 Yêu Cầu

- [Opencode](https://opencode.ai) đã cài
- `git` đã cài
- `bash` (macOS / Linux / WSL)

---

## 🏁 Bắt Đầu

### Bước 1: Clone template

```bash
git clone https://github.com/ocanhdt12-gif/opencode-project-template my-project
cd my-project
```

### Bước 2: Chạy script khởi tạo

```bash
./scripts/start-project.sh
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

## 🗂️ Cấu Trúc Project

```
my-project/
│
├── CLAUDE.md                      ← 🔑 Source of truth cho Opencode
│
├── docs/
│   ├── BRIEF.md                   ← Brain dump ban đầu (do script tạo)
│   ├── specs/                     ← Design docs (do Opencode viết sau brainstorm)
│   │   └── YYYY-MM-DD-[topic]-design.md
│   ├── phases/
│   │   ├── phase-0.md             ← Brainstorming instructions
│   │   ├── phase-1.md             ← Foundation
│   │   ├── phase-2.md             ← Core Features
│   │   ├── phase-3.md             ← UI + Polish
│   │   └── phase-4.md             ← Testing + Deploy
│
├── skills/
│   └── brainstorming/
│       └── SKILL.md               ← Reusable brainstorming workflow
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
├── .env.example
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
└─────────────────────────────────────────────────────┘
        ↓
┌─── PHASE 4: RELEASE ───────────────────────────────┐
│  E2E test → fix → deploy staging                  │
│  Anh review staging → deploy production 🚀        │
└─────────────────────────────────────────────────────┘
```

---

## 🧠 Brainstorming Skill (Dùng Lại Khi Thêm Feature)

Khi project đang chạy và muốn thêm feature mới, paste vào Opencode:

```
Đọc skills/brainstorming/SKILL.md và bắt đầu brainstorm feature sau:
[Mô tả feature muốn thêm]
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

---

## 📊 Monitoring

Template bao gồm production-ready monitoring stack:

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

## 📜 License

MIT

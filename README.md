# 🚀 Opencode Project Template

> Template chuẩn để khởi động project mới với Opencode.  
> Có sẵn: planning workflow, project structure, context files, CI pipeline.

---

## ✨ Tại Sao Dùng Template Này?

- **Không mất thời gian setup** — structure đã chuẩn, chạy 1 lệnh là xong
- **Không mất context** — Opencode luôn biết đang làm gì, đang ở phase nào
- **Không code lung tung** — plan trước, code sau, test ngay
- **Không lo mất tiến độ** — todo.md track task rõ ràng từng bước

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

Script sẽ hỏi 2 thứ:

```
Step 1/4: Project name
  Tên project: my-awesome-app

Step 2/4: Brain dump ý tưởng
  Mô tả ngắn gọn về project:
  > App quản lý đơn hàng trứng, user là chủ trại,
  > cần theo dõi đơn hàng từ Zalo, stack dùng Next.js + Postgres
  > (Enter 2 lần để xong)
```

Sau đó script tự:
- Replace tên project vào toàn bộ files
- Ghi brain dump vào `docs/BRIEF.md`
- Reset git history (fresh repo cho project mới)

### Bước 3: Mở Opencode

```bash
opencode .
```

Opencode tự đọc `CLAUDE.md` → phát hiện project chưa plan → bắt đầu **Phase 0** tự động:
- Đọc `docs/BRIEF.md` làm context
- Hỏi những gì còn thiếu (tối đa 5 câu)
- Viết `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/phases/`
- Tạo `tasks/todo.md` cho Phase 1
- Xóa block setup khỏi `CLAUDE.md`

### Bước 4: Trả lời câu hỏi của Opencode

Opencode hỏi → anh trả lời → confirm từng bước → **bắt đầu code Phase 1** 🎯

---

## 🗂️ Cấu Trúc Project

```
my-project/
│
├── CLAUDE.md                  ← 🔑 Source of truth cho Opencode
│
├── docs/
│   ├── BRIEF.md               ← Brain dump ban đầu (do script tạo)
│   ├── PRD.md                 ← Product requirements (do Opencode viết)
│   ├── ARCHITECTURE.md        ← Technical design (do Opencode viết)
│   └── phases/
│       ├── phase-0.md         ← Planning instructions
│       ├── phase-1.md         ← Foundation
│       ├── phase-2.md         ← Core Features
│       ├── phase-3.md         ← UI + Polish
│       └── phase-4.md         ← Testing + Deploy
│
├── tasks/
│   ├── todo.md                ← Task hiện tại + up next
│   └── done.md                ← Log tasks đã xong
│
├── src/                       ← Source code
│
├── tests/
│   ├── unit/                  ← Viết cùng lúc với code
│   ├── integration/           ← Viết cuối mỗi phase
│   └── e2e/                   ← Viết trước release
│
├── scripts/
│   └── start-project.sh       ← Script khởi tạo project
│
├── .github/
│   └── workflows/ci.yml       ← CI pipeline
│
├── .env.example               ← Env vars template
└── .gitignore
```

---

## 🔄 Dev Process

```
Brain dump ý tưởng
      ↓
Opencode Phase 0: Planning
  → Clarify requirements
  → Viết PRD + Architecture
  → Chia phases + tasks
      ↓
Anh review + confirm
      ↓
┌─── Task Loop ───────────────┐
│ Pick task từ todo.md        │
│ → Code task                 │
│ → Viết unit test            │
│ → Chạy test (pass mới tiếp) │
│ → Commit + update todo.md   │
└─────────────────────────────┘
      ↓ (hết phase)
Integration test toàn phase
      ↓
Sang phase tiếp
      ↓ (hết phase 4)
E2E test → Deploy 🚀
```

---

## 🧪 Testing Strategy

| Loại | Khi nào viết | Tool |
|------|-------------|------|
| **Unit** | Ngay sau mỗi task | Vitest |
| **Integration** | Cuối mỗi phase | Vitest + Supertest |
| **E2E** | Trước release | Playwright |

---

## 📌 Rules Vàng Khi Làm Việc Với Opencode

| Rule | Lý do |
|------|-------|
| `CLAUDE.md` là source of truth | Opencode đọc file này mỗi session |
| 1 prompt = 1 task | Context nhỏ → output tốt hơn |
| Test viết ngay, không để cuối | Tránh bug chồng bug |
| Không sang task mới khi test chưa pass | Giữ codebase sạch |
| Commit sau mỗi task | Rollback dễ khi cần |

---

## 📝 Prompt Mỗi Task

```
Đọc CLAUDE.md → docs/phases/phase-N.md → tasks/todo.md

Implement task "In Progress".
Chỉ sửa files được liệt kê trong task.

Sau khi xong:
1. Viết unit test
2. Chạy test, fix nếu fail
3. Commit: feat/fix/test: [mô tả ngắn]
4. Move task sang done.md
5. Báo kết quả + tóm tắt ngắn
```

---

## 📜 License

MIT

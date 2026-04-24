# [PROJECT_NAME]

> [Mô tả ngắn gọn về project - 1-2 câu]

## 🚀 Quick Start

```bash
# Clone
git clone [repo-url]
cd [project-name]

# Install
npm install

# Setup env
cp .env.example .env
# Điền các env vars cần thiết

# Setup database
npm run db:migrate

# Run dev
npm run dev
```

## 📋 Project Structure

```
CLAUDE.md           ← Context cho Opencode (đọc file này trước)
docs/
  PRD.md            ← Product requirements
  ARCHITECTURE.md   ← Technical design
  phases/           ← Phase-by-phase breakdown
tasks/
  todo.md           ← Task hiện tại
  done.md           ← Task đã xong
src/                ← Source code
tests/              ← Tests
  unit/
  integration/
  e2e/
```

## 🔄 Dev Process

1. Đọc `CLAUDE.md` → hiểu project
2. Đọc `docs/phases/phase-N.md` → hiểu phase hiện tại
3. Đọc `tasks/todo.md` → biết task cần làm
4. Code task → viết test → commit
5. Update `tasks/todo.md`

## 🧪 Testing

```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests (Playwright)
npm run test             # All tests
```

## 📦 Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # Lint
npm run db:migrate   # Run migrations
npm run db:seed      # Seed data
```

## 📄 License
[MIT / Private]

# Project: [PROJECT_NAME]

> 🔑 File này là source of truth. Opencode đọc file này đầu tiên mỗi session.

## Overview
[Mô tả ngắn gọn về app/project - 2-3 câu]

## Stack
- **Frontend:** [e.g. Remix + Polaris]
- **Backend:** [e.g. Node.js + Express]
- **Database:** [e.g. PostgreSQL + Prisma]
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest + Playwright
- **Deployment:** [e.g. Vercel / Railway]

## Folder Structure
```
src/
  app/          ← Routes / pages
  components/   ← Reusable UI components
  lib/          ← Shared utilities, helpers
  db/           ← Schema, migrations
  types/        ← Shared TypeScript types
tests/
  unit/         ← Unit tests (viết cùng lúc với code)
  integration/  ← Integration tests (cuối mỗi phase)
  e2e/          ← E2E tests (trước release)
docs/
  PRD.md
  ARCHITECTURE.md
  phases/
tasks/
  todo.md
  done.md
```

## Coding Rules
- **TypeScript strict** — không dùng `any`
- **Test ngay** — mỗi task phải có unit test trước khi sang task mới
- **1 commit = 1 task** — commit message: `feat/fix/test/chore: [mô tả ngắn]`
- **Scope control** — không sửa file ngoài danh sách cho phép trong task
- **No magic numbers** — dùng constants có tên rõ ràng
- **Error handling** — mọi async function phải handle error

## Current Phase
> 📋 Cập nhật dòng này mỗi khi chuyển phase

Phase 1 - Foundation  
Chi tiết: `docs/phases/phase-1.md`

## Current Task
> ✅ Xem `tasks/todo.md`

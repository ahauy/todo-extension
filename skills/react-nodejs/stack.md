# React + Node.js — Tech Stack

> Example/default for React + Node projects only. Không phải rule global.
> Luôn đọc `.agent/PROJECT_PROFILE.md` trước: ORM lấy từ `db_tool`, package manager lấy từ
> `package_manager`. Nếu unset/`none`, không giả định Prisma/pnpm.

## Core

| Category | Technology | Version |
|----------|-----------|---------|
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20 LTS |
| Frontend | React | 19.x |
| Bundler | Vite | 8.x |
| React Compiler | oxc-transform-react (native Rust) | latest |
| Backend | Express | 4.x |
| ORM | From `PROJECT_PROFILE.db_tool` | `none` / `prisma` / `drizzle` / `other`; không giả định Prisma |
| Validation | Zod | 3.x |

## Frontend Stack

| Category | Library | Notes |
|----------|---------|-------|
| Routing | React Router | v6 |
| State | Zustand | Simple, no boilerplate |
| Server State | TanStack Query | Cache, refetch, mutations |
| Forms | React Hook Form + Zod | Validation |
| UI Framework | Tailwind CSS | Utility-first |
| UI Components | shadcn/ui | Copy-paste, customizable |
| Icons | Lucide React | Tree-shakeable |
| HTTP Client | ky / fetch | Lightweight |
| Date | date-fns | Immutable, tree-shakeable |
| React Compiler | oxc-transform-react | Native Rust compiler via `@vitejs/plugin-react` `compiler: true` |

## Backend Stack

| Category | Library | Notes |
|----------|---------|-------|
| Framework | Express | Mature, vast ecosystem |
| Validation | Zod | Shared with frontend |
| Auth | jose (JWT) | Standard JWT library |
| Password | bcryptjs | Hashing |
| File Upload | multer | Multipart |
| Email | nodemailer | SMTP |
| Logging | pino | Fast, structured |
| Env | dotenv | .env loading |
| CORS | cors | Middleware |
| Rate Limit | express-rate-limit | Protection |

## Database

| Option | Use When |
|--------|----------|
| PostgreSQL | Production, complex queries, relations |
| MySQL | Legacy systems, specific hosting |
| MongoDB | Flexible schema, rapid prototyping |
| SQLite | MVP, single-server, development |

## Testing

| Category | Tool |
|----------|------|
| Unit (FE) | Vitest + Testing Library |
| Unit (BE) | Vitest |
| Integration | Vitest + supertest |
| E2E | Playwright |
| Coverage | c8 / istanbul |

## DevOps

| Category | Tool |
|----------|------|
| Package Manager | From `PROJECT_PROFILE.package_manager`; không giả định pnpm |
| Linting | ESLint |
| Formatting | Prettier |
| Git Hooks | husky + lint-staged |
| CI | GitHub Actions / GitLab CI |

## Version Pinning

Always pin exact versions in `package.json`:
```json
"dependencies": {
  "react": "19.1.0",      // ✅ exact
  "express": "4.19.2"     // ✅ exact
}
"devDependencies": {
  "vite": "8.1.0",        // ✅ exact
  "@vitejs/plugin-react": "6.1.0",
  "oxc-transform-react": "1.0.0"
}
// NOT "^18.2.0" or "~18.2.0"
```

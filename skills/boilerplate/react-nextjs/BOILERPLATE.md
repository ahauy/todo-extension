# React / Next.js Boilerplate

> **Chỉ dùng file này khi project stack là React hoặc Next.js.**
> Nếu project là Node.js API thuần, Python, hoặc stack khác → bỏ qua folder này.

## Khi Nào Activate

AI sẽ tự động dùng boilerplate này khi:
- User nói "tạo project React", "setup Next.js", "dùng React"
- `docs/BRIEF.md` hoặc spec mention React / Next.js / frontend SPA / SSR
- Stack được chọn trong Phase 0 là React-based

## Stack Mặc Định (React/Next.js Projects)

```
React 19 + Next.js 15 (App Router)
TypeScript (strict mode)
Tailwind CSS v4 + shadcn/ui
Zustand (client state)
React Query / TanStack Query (server state)
Vitest + Testing Library (tests)
ESLint + Prettier
```

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   └── [feature]/          # Feature-specific components
├── lib/
│   ├── utils.ts            # cn() helper + shared utils
│   └── api.ts              # API client setup
├── hooks/                  # Custom React hooks
├── store/                  # Zustand stores
├── types/                  # TypeScript type definitions
└── __tests__/              # Test files
```

## Setup Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# 2. Upgrade to Tailwind v4
pnpm add tailwindcss@latest @tailwindcss/vite
pnpm add -D tw-animate-css
rm tailwind.config.ts  # v4 không dùng file này

# 3. Init shadcn/ui
pnpm dlx shadcn@latest init

# 4. Add state management
pnpm add zustand @tanstack/react-query

# 5. Add testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Key Config Files

### vite.config.ts (nếu dùng Vite thay Next.js)
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
})
```

### tsconfig.json (strict mode)
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### components.json (shadcn — CRITICAL)
```json
{
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

### src/app/globals.css (Tailwind v4 four-step)
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}
```

### src/lib/utils.ts
```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Skills Liên Quan

Khi dùng boilerplate này, các skill sau sẽ tự động áp dụng:
- `skills/frontend-agent/SKILL.md` — component patterns, architecture
- `skills/typescript/SKILL.md` — type safety rules
- `skills/tailwind-v4-shadcn/SKILL.md` — Tailwind v4 setup rules

## Checklist Trước Khi Code

- [ ] `pnpm install` chạy thành công
- [ ] `pnpm dev` khởi động được
- [ ] `pnpm build` không có lỗi
- [ ] TypeScript strict mode bật
- [ ] ESLint config đúng
- [ ] shadcn/ui init xong (có `components/ui/`)
- [ ] Dark mode toggle hoạt động

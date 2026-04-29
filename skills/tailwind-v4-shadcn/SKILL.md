---
name: Tailwind v4 Shadcn
slug: tailwind-v4-shadcn
version: 1.0.0
description: Production-tested setup for Tailwind CSS v4 with shadcn/ui. Prevents 8 documented errors through mandatory four-step architecture.
---

# Tailwind v4 + shadcn/ui Stack

## When to Use

Activate when setting up or debugging Tailwind CSS v4 with shadcn/ui in a React/Vite/Next.js project. Also use when migrating from Tailwind v3 to v4.

**Trigger keywords:** tailwind v4, shadcn, dark mode broken, colors not working, @theme inline, @apply error, build failure, tailwind config.

## Quick Start

```bash
# 1. Install dependencies
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @types/node tw-animate-css
pnpm dlx shadcn@latest init

# 2. Delete v3 config (v4 doesn't use tailwind.config.ts)
rm tailwind.config.ts
```

## vite.config.ts (required)

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

## components.json (CRITICAL — must match exactly)

```json
{
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

## The Four-Step Architecture (MANDATORY)

Skipping any step causes silent failures.

**Step 1 — @import tailwindcss**
```css
@import "tailwindcss";
@import "tw-animate-css";
```

**Step 2 — @custom-variant dark**
```css
@custom-variant dark (&:is(.dark *));
```

**Step 3 — @theme inline (CSS variables)**
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... all shadcn color vars */
}
```

**Step 4 — :root + .dark color definitions**
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
}
```

## 8 Common Errors to Avoid

1. **Don't use tailwind.config.ts** — v4 uses CSS-first config
2. **Don't use @layer base for CSS vars** — use :root directly
3. **Don't use @apply with shadcn vars** — use CSS vars directly
4. **config: "" in components.json** — must be empty string, not a file path
5. **@theme must be `inline`** — `@theme {}` without inline breaks CSS vars
6. **tw-animate-css must be imported** — shadcn animations depend on it
7. **@custom-variant dark must come before @theme** — order matters
8. **Don't mix v3 and v4 syntax** — pick one, migrate fully

## Dark Mode Toggle

```tsx
// Toggle dark class on <html>
document.documentElement.classList.toggle('dark')
```

## Verified Versions

- tailwindcss@4.1.18
- @tailwindcss/vite@4.1.18
- shadcn@latest

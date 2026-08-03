# Context Manager Agent

## Role
Quản lý context window khi conversation dài. Summarize completed work, giữ lại info quan trọng.

## Trigger
- Context gần đầy (agent nhận thấy response bị chậm hoặc bị truncate)
- Sau mỗi layer complete
- Manual trigger

---

## Strategy: Pin + Trim

### Always Pin (never summarize away)
1. Current task file content
2. SPECIFICATIONS.md summary (top-level features list)
3. `.context/error-memory.md` (last 5 entries)
4. `.context/progress.json` (full)
5. Current file being edited

### Trim (summarize and release)
1. Completed task details → 1-line summary each
2. Old brainstorm Q&A → only keep decisions, not discussion
3. Review reports for past layers → only keep FAIL reasons
4. Code that's already committed → trust git, don't keep in context

---

## Context Compression Format

When summarizing completed work:

```markdown
## Completed Work Summary

### Layer 0 (Infrastructure) ✅
- task-01: Project scaffolding — DONE
- task-02: Database setup (PostgreSQL) — DONE
- task-03: Auth middleware (JWT) — DONE

### Layer 1 (Core Backend) ✅
- task-01: User CRUD API — DONE
- task-02: Product CRUD API — DONE (had N+1 query issue, fixed)
- task-03: Order API — DONE

### Current: Layer 2 (Core Frontend)
- task-01: [IN PROGRESS] — React routing + layout
```

---

## When to Compress

| Signal | Action |
|--------|--------|
| Agent struggles to maintain context | Compress immediately |
| Layer complete + review PASS | Compress that layer |
| 10+ tasks completed | Compress older tasks |
| Error memory > 10 entries | Keep only last 5 + patterns |

---

## Rules

1. **Never lose decisions** — `.context/decisions.md` is sacred
2. **Never lose error patterns** — they prevent repeated mistakes
3. **Always keep current task fully loaded** — no compression on active work
4. **progress.json is tiny** — always keep full
5. **Trust git** — committed code doesn't need to stay in context

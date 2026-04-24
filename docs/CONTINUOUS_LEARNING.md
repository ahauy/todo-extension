# Continuous Learning — Auto-Extract Patterns

> Tự động trích xuất lessons + patterns từ sessions, tránh lỗi cũ.

---

## Cách Hoạt Động

```
Session xong
    ↓
Auto-extract patterns:
  - Lỗi gặp phải
  - Cách fix
  - Lessons learned
    ↓
Lưu vào .learnings/YYYY-MM-DD-[topic].md
    ↓
Khi thêm feature mới
    ↓
Opencode đọc .learnings/ → tránh lỗi cũ
```

---

## Setup

### Bước 1: Tạo Learning Template

Tạo `.learnings/TEMPLATE.md`:

```markdown
# Learning: [Topic]

**Date:** YYYY-MM-DD  
**Session:** [session context]  
**Status:** Draft → Promoted

## Problem
[Vấn đề gặp phải]

## Root Cause
[Nguyên nhân gốc]

## Solution
[Cách fix]

## Pattern
[Pattern tái sử dụng được]

## Prevention
[Cách tránh lỗi này lần sau]

## Confidence
[1-5 stars — bao chắc pattern này đúng]

---

## Promotion Status

- **Draft** — Ghi lại ngay sau khi fix
- **Validated** — Gặp lại lỗi, pattern vẫn work
- **Promoted** — Thêm vào AGENTS.md / TOOLS.md / SOUL.md
```

### Bước 2: Tạo Learning Log

Sau mỗi session, tạo file `.learnings/YYYY-MM-DD-[topic].md`:

**Ví dụ 1: TypeScript Strict Mode**
```markdown
# Learning: TypeScript Strict Mode

**Date:** 2026-04-24  
**Session:** Phase 2 development  
**Status:** Draft

## Problem
Gặp lỗi type mismatch khi compile, nhưng code chạy được

## Root Cause
TypeScript strict mode chưa enable, nên miss type errors

## Solution
Enable `strict: true` trong tsconfig.json

## Pattern
Luôn enable TypeScript strict mode từ đầu project

## Prevention
- Check tsconfig.json trước khi code
- Run `tsc --noEmit` trước commit
- Setup pre-commit hook để check type

## Confidence
⭐⭐⭐⭐⭐ (5/5 — best practice)
```

**Ví dụ 2: Test Coverage**
```markdown
# Learning: Test Coverage Threshold

**Date:** 2026-04-24  
**Session:** Phase 2 development  
**Status:** Draft

## Problem
Coverage dropped từ 85% → 75%, missed edge cases

## Root Cause
Viết code trước test, nên miss edge cases

## Solution
Viết test trước code (TDD), coverage tự động > 80%

## Pattern
Test-driven development: test → code → refactor

## Prevention
- Setup CI check: coverage < 80% → block merge
- Require test file cạnh source file
- Review test coverage trước commit

## Confidence
⭐⭐⭐⭐⭐ (5/5 — proven pattern)
```

### Bước 3: Promote Learning

Khi pattern được validate (gặp lại 2+ lần hoặc rất confident):

**Promote vào AGENTS.md:**
```markdown
## Learnings Promoted

### TypeScript Strict Mode (2026-04-24)
- Always enable `strict: true` in tsconfig.json
- Run type check before commit
- Setup pre-commit hook

### Test-Driven Development (2026-04-24)
- Write test before code
- Maintain > 80% coverage
- Block merge if coverage drops
```

---

## Usage

**Sau mỗi session:**
```bash
# Tạo learning file
touch .learnings/2026-04-24-[topic].md

# Ghi lại:
# - Problem
# - Root cause
# - Solution
# - Pattern
# - Prevention
# - Confidence
```

**Khi thêm feature mới:**
```bash
# Đọc .learnings/ trước
# Tránh lỗi cũ
# Áp dụng patterns đã proven
```

**Khi pattern được validate:**
```bash
# Promote vào AGENTS.md / TOOLS.md / SOUL.md
# Update status: Draft → Promoted
```

---

## Tips

- Ghi learning ngay sau khi fix (khi còn nhớ)
- Confidence score giúp prioritize patterns
- Promote learning khi gặp lại 2+ lần
- Archive old learnings khi project xong
- Share learnings với team nếu có

---

## Sync with Memory System

```
memory/YYYY-MM-DD.md (raw notes)
    ↓
.learnings/YYYY-MM-DD-[topic].md (extracted patterns)
    ↓
AGENTS.md / TOOLS.md / SOUL.md (promoted rules)
```

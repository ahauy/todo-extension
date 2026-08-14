# Graph Agent — Task Decomposition

## Role
Đọc SPECIFICATIONS.md và chia thành các layers theo dependency order. Mỗi layer chứa các tasks có thể chạy song song.

## Trigger
- `spec-validator.md` trả về PASS → `.agent/design.md` → PASS → Graph chạy
- Hoặc manual trigger khi SPECIFICATIONS.md + `.context/design-spec.md` đã sẵn sàng

## Output
- `tasks/layer-{N}/task-{NN}.md` — task files
- `.context/progress.json` — updated với totalLayers

---

## Layer Strategy

### Layer 0: Infrastructure
Luôn là layer đầu tiên. Bao gồm:
- Project scaffolding (package.json, tsconfig, folder structure)
- Database setup (schema, migrations, connection)
- Auth foundation (middleware, token utils)
- Config management (env vars, constants)
- Git init + remote setup (via devops.md)

> 📦 **Scalability (OPTIONAL):** Nếu `SPECIFICATIONS.md` có Scalability Profile (user bật option) → Layer 0 bổ sung task hạ tầng theo Tier. ĐỌC `skills/scalability-architecture/templates/` tương ứng Tier trước khi sinh task:
> - **Standard**: health check, connection pool, backup script, LB-able config
> - **High Traffic**: Redis (session/cache/rate limit), queue + worker, read replica routing, circuit breaker, observability, auto-scale guideline
> - **Enterprise**: chia thành các task/sub-layer theo ADR đã duyệt (multi-region → sharding → event-driven → DR) — ưu tiên từng bước, đo + verify trước khi sang bước sau

### Layer 1: Core Backend
- API routes cho core features
- Database models/queries
- Business logic services
- Validation schemas

### Layer 2: Core Frontend
- Page routing setup
- Core UI components
- API client / data fetching
- State management

### Layer 3: Feature Integration
- Connect frontend ↔ backend
- Auth flow end-to-end
- Error handling
- Loading states

### Layer 4+: Advanced Features
- Realtime (nếu có)
- File upload (nếu có)
- Payment (nếu có)
- Admin panel
- Notifications

### Final Layer: Polish
- Testing (unit + integration)
- Performance optimization
- Security hardening
- Documentation

---

## Task File Format

Mỗi task file (`tasks/layer-{N}/task-{NN}.md`):

```markdown
# Task {NN}: {Title}

## Layer
{N}

## Description
{What this task implements}

## Dependencies
- task-{XX} (reason)
- task-{YY} (reason)

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## DoD (Definition of Done)
- [ ] Code written
- [ ] Tests pass
- [ ] No lint errors
- [ ] Reviewed by reviewer agent
- [ ] Committed with proper message

## Files to Create/Modify
- `src/...`
- `tests/...`

## Notes
{Additional context, edge cases, gotchas}
```

---

## Rules

1. **Layer N+1 chỉ unlock khi TOÀN BỘ tasks trong Layer N đã PASS review VÀ human đã approve**
2. **HUMAN CHECKPOINT bắt buộc** sau mỗi layer — KHÔNG tự động chạy layer tiếp theo
3. Tasks trong cùng layer KHÔNG có dependency lẫn nhau
3. Mỗi task phải có acceptance criteria rõ ràng, testable
4. Prefer small tasks (1-3 files) over large tasks
5. Update `.context/progress.json` sau khi generate xong:
   ```json
   {
     "totalLayers": N,
     "currentLayer": 0,
     "completedTasks": [],
     "inProgressTask": null
   }
   ```

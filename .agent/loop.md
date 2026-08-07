# Loop Agent — Task Execution (ReAct Pattern)

## Role
Execute từng task theo ReAct cycle: Read → Plan → Act → Observe → Repeat.

## Trigger
- Graph agent tạo xong tasks
- Hoặc resume từ `.context/progress.json`

## Pattern

```
┌─────────────────────────────────────┐
│           READ                       │
│  • Task file                         │
│  • .context/error-memory.md          │
│  • Related existing code             │
│  • skills/react-nodejs/patterns.md   │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│           PLAN                       │
│  • List files to create/modify       │
│  • Identify potential issues         │
│  • Check error-memory for pitfalls   │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│           ACT                        │
│  • Write code                        │
│  • Write tests                       │
│  • Install dependencies if needed    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│          OBSERVE                     │
│  • Run tests                         │
│  • Run linter                        │
│  • Check build                       │
└──────────────┬──────────────────────┘
               ▼
          PASS?─────── NO ──┐
            │                │
           YES               ▼
            │         ┌──────────────┐
            ▼         │ Error        │
     ┌──────────┐    │ Analyzer     │
     │ Commit   │    │ → fix        │
     │ → Review │    │ → retry ACT  │
     └──────────┘    └──────────────┘
```

---

## Execution Steps

### 0. Check Dependencies
TRƯỚC KHI làm bất cứ gì:
```
1. Đọc task file → lấy danh sách Dependencies
2. Đọc .context/progress.json → kiểm tra completedTasks
3. Nếu dependency CHƯA có trong completedTasks:
   → STOP
   → Báo: "⚠️ Task {NN} blocked: waiting for {task-XX} to complete first"
   → Chờ hoặc chuyển sang task khác trong cùng layer không có dependency
4. Nếu ĐÃ DONE → proceed bình thường
```

### 1. Read Context
```
Read:
- tasks/layer-{N}/task-{NN}.md (current task)
- .context/error-memory.md (avoid past mistakes)
- skills/react-nodejs/conventions.md (style guide)
- skills/react-nodejs/patterns.md (implementation patterns)
- Related source files (if modifying existing code)
- .context/design-spec.md (nếu task liên quan UI/screen)
- skills/react-nodejs/design-tokens.md (nếu task liên quan UI/screen)

🔒 Nếu task liên quan đến input handling, auth, database, API endpoint, hoặc secret:
- skills/security/semgrep-scan.md (scan lỗi bảo mật)
- skills/security/api-owasp.md (OWASP Top 10 API)
- skills/security/jwt-security.md (nếu dùng JWT/auth)
- skills/security/bola-idor.md (nếu có object-by-id endpoint)
- skills/security/sharp-edges.md (config/secret/secure-defaults)
→ PHẢI đọc ít nhất 1 security skill trước khi code bất kỳ file xử lý input/auth/DB

🔒 Mọi task thêm/cập nhật dependency:
- skills/security/supply-chain-audit.md (npm audit + dependency risk)

Nếu task liên quan đến UI/component:
- .context/design-spec.md (layout spec cho screen này)
- skills/react-nodejs/design-tokens.md (colors, typography, spacing)
→ PHẢI đọc design tokens trước khi viết bất kỳ UI component nào
```

### 2. Plan
- Xác định files cần tạo/sửa
- Xác định dependencies cần install
- Check error-memory xem task tương tự đã gặp lỗi gì chưa
- Viết plan ngắn gọn (không cần lưu file, chỉ reasoning)

### 3. Act

**Critical paths (auth, payment, data mutations): viết test TRƯỚC khi viết code.**
Các task khác: viết code và test cùng lượt.

```
Task type checklist:
[ ] API endpoint     → integration test + contract test
[ ] Auth endpoint    → contract test (MANDATORY, test-first)
[ ] Business logic   → unit test: happy path + edge cases + errors
[ ] UI Component     → render test + user interaction
[ ] DB query         → unit test với mock/in-memory DB
```

- Viết code theo conventions
- Viết tests theo checklist trên
- `npm install` nếu cần package mới
- Follow patterns trong `skills/react-nodejs/patterns.md`

### 4. Observe
```bash
# Run tests
npm test -- --related {files}

# Lint
npm run lint

# Type check (if TypeScript)
npx tsc --noEmit

# Build check
npm run build
```

### 5. Evaluate
- **ALL PASS** → Commit → Trigger Reviewer
- **FAIL** → Trigger Error Analyzer → Get fix → Retry from ACT
- **3 retries fail** → Mark task as BLOCKED → Move to next task → Notify human

### 6. Context Compact Check
Sau mỗi task PASS, kiểm tra:
```
completedTasks = số task đã done (đọc từ .context/progress.json)

Nếu completedTasks % 3 == 0:
  → Invoke .agent/context-manager.md (compact)
  → Đọc .context/compressed-summary.md thay vì giữ full history
```

Sau khi mỗi **layer hoàn thành** (tất cả tasks trong layer PASS):
  → **MANDATORY** invoke .agent/context-manager.md
  → Compact toàn bộ layer vừa xong
  → Tiếp tục layer tiếp theo với context đã compressed

---

## Commit Convention

After task passes tests:
```bash
git add {relevant files only}
git commit -m "feat(layer-{N}): task-{NN} {short description}"
```

---

## Progress Update

After each task completes (PASS or BLOCKED):
```json
// .context/progress.json
{
  "inProgressTask": null,
  "completedTasks": [..., "layer-{N}/task-{NN}"],
  "lastUpdated": "ISO timestamp"
}
```

---

## Test Strategy

### Test Pyramid (per task)

| Layer | What | When |
|-------|------|------|
| Unit | Pure functions, helpers, validators, services | Mọi task có logic |
| Integration | API endpoints với real DB (in-memory/test DB) | Mọi endpoint |
| Contract | Response shape khớp với `src/shared/types/api.ts` | Mọi endpoint trả data |

### Mandatory Tests by Task Type

| Task Type | Required Tests |
|-----------|----------------|
| API endpoint | Integration: status code + response body shape via shared types |
| Auth (login/register/refresh) | Contract test (test-first): `body.data.token`, `body.data.user` shape |
| Business logic | Unit: happy path + at least 2 edge cases + error path |
| UI Component | Render test + at least 1 user interaction |
| DB query/service | Unit với mock hoặc in-memory DB |

### Test-First Rule
Với **auth endpoints** và **payment**: viết test TRƯỚC khi viết code.
Test phải assert theo shared TypeScript types trong `src/shared/types/api.ts`, không hardcode shape.

```typescript
// ✅ Correct — assert against shared contract
import type { ApiResponse, AuthData } from '@/shared/types/api';
expect(res.body).toMatchObject<ApiResponse<AuthData>>({
  success: true,
  data: { token: expect.any(String), user: { id: expect.any(String) } }
});

// ❌ Wrong — locked to current implementation detail
expect(res.body.token).toBeDefined();
```

### Done Checklist (API task)
Trước khi mark task DONE:
- [ ] Response đi qua `ok()`/`fail()` helper, không viết tay `res.json()`
- [ ] Test assert client-consumed shape (không phải raw backend format)
- [ ] Contract test tồn tại cho mọi data endpoint
- [ ] `src/shared/types/api.ts` được update nếu response shape thay đổi

---

## Rules

1. **Một task tại một thời điểm** — không chạy song song
2. **Không skip tests** — mỗi task phải có test theo đúng loại (xem Test Strategy)
3. **Đọc error-memory TRƯỚC khi code** — tránh lặp lỗi cũ
4. **Max 3 retries** — sau đó đánh BLOCKED
5. **Commit ngay khi PASS** — tạo rollback point
6. **Không sửa code ngoài scope** — chỉ touch files trong task definition
7. **Dùng response helper chung** — MỌI API response phải đi qua `ok()`/`fail()`. Không bao giờ viết tay `res.json({token, user})` hay format tùy ý.
8. **Test theo contract của client** — import types từ `src/shared/types/api.ts`, không hardcode shape.
9. **Auth endpoints: test-first** — viết contract test trước khi implement.

# Loop Agent — Task Execution (ReAct Pattern)

> Engine thực thi từng task theo ReAct: Read → Plan → Act → Observe → Repeat.
> Điều phối: `AGENTS.md` + `.agent/FEATURE_WORKFLOW.md`. State: `.context/progress.json` (`features[]`/`bugs[]`).

## Role
Execute từng task theo ReAct cycle: Read → Plan → Act → Observe → Repeat.

## Trigger
- **`/start`** (project start): sau khi `graph` sinh layer plan + user duyệt plan → loop chạy layer 0 → …. (Đây là đường vào chính của initial build.)
- `change-request` hoặc `/change` chia xong phase/task (feature/bug)
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
2. Đọc .context/progress.json → kiểm tra task/phase đã done chưa
3. Nếu dependency CHƯA done:
   → STOP
   → Báo: "⚠️ Task {NN} blocked: waiting for {task-XX} to complete first"
   → Chờ hoặc chuyển sang task khác không có dependency
4. Nếu ĐÃ DONE → proceed bình thường
```

### 1. Read Context
```
Read:
- Task file hiện tại — initial build: `tasks/<slug>/layer-{N}-task-{NN}.md`; change hậu-build: `tasks/<feature|bug>-<slug>/phase-<N>-task-<NN>.md`
- .context/error-memory.md (avoid past mistakes)
- skills/react-nodejs/conventions.md (style guide)
- skills/react-nodejs/patterns.md (implementation patterns)
- Related source files (if modifying existing code)
- .context/design-spec.md (nếu task liên quan UI/screen)
- skills/react-nodejs/design-tokens.md (nếu task liên quan UI/screen)

⚙️ Mọi task code (implement/bugfix/refactor):
- Đọc `skills/superpowers/SKILL.md` — Iron Law debug + TDD gate
- Trước khi fix bug → đọc `skills/superpowers/systematic-debugging.md` (4 phases)
- Trước khi thêm tính năng → đọc `skills/superpowers/test-driven-development.md` (test-first)
- Đọc `skills/ponytail/SKILL.md` — lazy senior dev ladder, chống over-engineering
- **Nếu task EDIT code có sẵn (nâng cấp/refactor/sửa) → Đọc `skills/karpathy-guidelines/references/surgical-changes.md`** — chỉ chạm đúng phần cần, không dọn dẹp code người khác, match style. (Think Before Coding: nêu giả định rõ, không tự chọn thầm cách hiểu mơ hồ — xem `skills/karpathy-guidelines/references/think-before-coding.md` nếu task mơ hồ)

🔒 Nếu task liên quan đến input handling, auth, database, API endpoint, hoặc secret:
- skills/security/semgrep-scan.md (scan lỗi bảo mật)
- skills/security/api-owasp.md (OWASP Top 10 API)
- skills/security/jwt-security.md (nếu dùng JWT/auth)
- skills/security/bola-idor.md (nếu có object-by-id endpoint)
- skills/security/sharp-edges.md (config/secret/secure-defaults)
→ PHẢI đọc ít nhất 1 security skill trước khi code bất kỳ file xử lý input/auth/DB

🔒 Mọi task thêm/cập nhật dependency:
- skills/security/supply-chain-audit.md (npm audit + dependency risk)

📊 Nếu task liên quan đến API endpoint, performance, logging, hoặc observability:
- skills/monitoring/otel-instrumentation.md (traces/metrics/logs backend)
- skills/monitoring/otel-browser.md (RUM Web Vitals, JS errors)
- skills/monitoring/otel-semantic-conventions.md (naming span/attribute)
→ PHẢI đọc ít nhất 1 monitoring skill trước khi code file API/performance/logging

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

**⚙️ MANDATORY TDD (theo `skills/superpowers/test-driven-development.md`):**
```
Write the test first. Watch it fail. Write minimal code to pass.
```
- **Critical paths (auth, payment, data mutations): viết test TRƯỚC khi viết code** (RED → GREEN)
- Các task khác: viết code và test cùng lượt
- Không viết code implement trước khi có failing test (trừ exception đã hỏi human)
- Nghĩ "skip test lần này" → DỪNG, đó là rationalization
- **Ponytail ladder (theo `skills/ponytail/SKILL.md`):** 1) cần tồn tại không (YAGNI) → 2) đã có trong codebase? → 3) stdlib? → 4) native? → 5) dependency đã cài? → 6) 1 dòng được? → 7) mới code tối thiểu

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
- Chạy `<install_command from project-config>` nếu cần package mới; nếu chưa cấu hình/chưa có app code → `skip, no app configured`
- Follow patterns theo stack trong `.context/project-config.md`; không áp dụng React/Node/Prisma nếu profile không khớp

### 4. Observe
```bash
# Run tests
<test_command from project-config>

# Lint
<lint_command from project-config>

# Type check (if TypeScript)
<typecheck_command from project-config>

# Build check
<build_command from project-config>
```

Nếu command chưa cấu hình hoặc repo chưa có app code/API/web/test, ghi `skip, no app configured` thay vì tự đoán `npm`/`pnpm`.

### 5. Evaluate
- **ALL PASS** → Commit → gọi subagent `reviewer` (`.opencode/agent/reviewer.md`) review độc lập
- **FAIL** → gọi `error-analyzer` (`.agent/error-analyzer.md`) → fix → Retry from ACT
- **3 retries fail** → Mark task as BLOCKED → Move to next task → Notify human

### 6. Context Hygiene
Sau mỗi task PASS:
```
- Giữ context gọn: chỉ pin task đang làm + .context/error-memory.md + file đang sửa
- Task đã commit → tin git, không giữ nguyên văn trong context
- Error patterns đã ghi vào .context/error-memory.md → không cần nhớ máy móc
```

### 7. Context Compact Check (`.agent/context-manager.md`)
Sau mỗi task PASS (đọc `completedTasks` từ `.context/progress.json`):
```
Nếu số task đã done % 3 == 0:
  → INVOKE .agent/context-manager.md (compact)
  → Đọc .context/compressed-summary.md thay cho full history
```
Sau khi **layer/phase hoàn thành** (mọi task PASS) → **MANDATORY** invoke `.agent/context-manager.md`, compact cả layer/phase vừa xong rồi mới sang layer/phase tiếp.

### 8. Spec Publish — hết layer cuối (initial build) (`.agent/spec-publish.md`)
Sau khi **layer CUỐI hoàn thành — initial build xong** (mọi task của mọi layer PASS):
```
- INVOKE `.agent/spec-publish.md` (spec-publisher):
  - Cập nhật `spec/test-scope/current.json` theo phạm vi THẬT đã build:
    `trigger: initial-build`, `scopeVersion` +1 (spec-init đã tạo bản nháp lúc khởi đầu),
    `risk` hạ theo kết quả verify thật, `specRefs` = req đã implement.
  - Thêm dòng `spec/CHANGELOG.md` nếu spec đổi trong lúc build.
- Bàn giao cho template TEST trước commit close-out (commit chung với code).
```

> 📋 **State (`.agent/blackboard.md`)**: `.context/progress.json` là source of truth — đọc trước khi làm (resume), atomic update sau mỗi bước đổi trạng thái (`inProgressTask`/`completedTasks`/`currentLayer`).

---

## Commit Convention

After task passes tests:
```bash
git add {relevant files only}
git commit -m "feat(<feature|bug>-<slug>): phase-<N>-task-<NN> {short description}"
```

---

## Progress Update

After each task completes (PASS or BLOCKED):
```json
// .context/progress.json — schema: features[] / bugs[], activeWorkItem
{
  "activeWorkItem": null,
  "features": [ ... ],
  "bugs": [ ... ],
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

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
- Viết code theo conventions
- Viết tests (unit test cho mỗi function/component)
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

## Rules

1. **Một task tại một thời điểm** — không chạy song song
2. **Không skip tests** — mỗi task phải có ít nhất 1 test
3. **Đọc error-memory TRƯỚC khi code** — tránh lặp lỗi cũ
4. **Max 3 retries** — sau đó đánh BLOCKED
5. **Commit ngay khi PASS** — tạo rollback point
6. **Không sửa code ngoài scope** — chỉ touch files trong task definition

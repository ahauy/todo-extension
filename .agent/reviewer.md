# Reviewer Agent — Independent Code Review

## Role
Review code từ góc nhìn độc lập, sử dụng model khác với coding agent để tránh bias.

## Model
Sử dụng `REVIEWER_MODEL` từ `.env.local` (recommended: khác hãng với CODING_MODEL).

## Trigger
- Loop agent hoàn thành 1 task (tests pass)
- Hoặc khi human request review

## Output
- `.context/review-reports/layer-{N}-task-{NN}-review.md`
- Verdict: PASS / FAIL + feedback

---

## Review Checklist

### 1. Requirements Coverage
- [ ] Task acceptance criteria đều được implement
- [ ] Edge cases được handle
- [ ] Error states có proper handling

### 2. Code Quality
- [ ] Clean code principles (readable, maintainable)
- [ ] No unnecessary complexity
- [ ] Proper naming conventions
- [ ] DRY — no duplicated logic
- [ ] Functions ≤ 50 lines, files ≤ 300 lines

### 3. Security
> 🔒 **BẮT BUỘC:** Chạy security scan + checklist này TRƯỚC khi duyệt PASS. Đọc `skills/security/*` nếu cần.

**Independent security scan (bắt buộc trước khi PASS):**
- [ ] Chạy `semgrep --metrics=off --config p/security-audit --config p/owasp-top-ten --severity ERROR --error --include 'src/**' .` — hướng dẫn tại `skills/security/semgrep-scan.md`
- [ ] Chạy `npm audit --audit-level=high` nếu task thêm/đổi dependency — hướng dẫn tại `skills/security/supply-chain-audit.md`
- [ ] **ERROR-severity security finding / high+cve → KHÔNG PASS**

**OWASP checklist (theo `skills/security/api-owasp.md`):**
- [ ] Input validation trên MỌI user input (schema) trước business logic
- [ ] Không SQL injection (parameterized queries)
- [ ] Không XSS (sanitized output, không `dangerouslySetInnerHTML` ẩu)
- [ ] Auth checks trên protected routes (middleware bắt buộc, không default public)
- [ ] Object-level auth (BOLA/IDOR): mọi `/:id` endpoint verify ownership — `skills/security/bola-idor.md`
- [ ] JWT: alg pinned, không `none`, secret ≥32 bytes từ env, exp enforced — `skills/security/jwt-security.md`
- [ ] Secrets KHÔNG hardcode (chỉ từ .env)
- [ ] CORS whitelist explicit (không `*` với credentials)
- [ ] Rate limiting trên login/resource-heavy endpoints
- [ ] Không mass assignment (`Object.assign(req.body)` / spread vào model)
- [ ] Không SSRF (user URL → fetch/axios unchecked)
- [ ] Không hardcoded fallback secret/default credential — `skills/security/sharp-edges.md`

**Monitoring/Observability checklist (`skills/monitoring/*`):**
- [ ] Health check endpoint (`/health`, `/ready`) verify deps reachable — `production-monitoring.md`
- [ ] Structured JSON logging, không log secret/PII/stack trace — `production-monitoring.md`
- [ ] Traces/metrics instrumented (OTel) — `otel-instrumentation.md`
- [ ] Span/attribute naming đúng chuẩn, không raw-ID/PII — `otel-semantic-conventions.md`
- [ ] Browser RUM (Web Vitals, JS errors) nếu có frontend — `otel-browser.md`
- [ ] Collector có batch + memory limiter, không hardcode key — `otel-collector.md`

### 4. Performance
- [ ] No N+1 queries
- [ ] Proper indexing hints (cho DB tasks)
- [ ] No unnecessary re-renders (React)
- [ ] Lazy loading cho heavy components

### 5. Testing
- [ ] Happy path tested
- [ ] Error path tested
- [ ] Edge cases tested
- [ ] Test names describe behavior

### 6. Integration
- [ ] Không break existing code
- [ ] API contracts consistent
- [ ] Types/interfaces match

---

## Review Report Format

```markdown
# Review: Layer {N} — Task {NN}

## Verdict: ✅ PASS / ❌ FAIL

## Summary
{1-2 sentences overall assessment}

## Details

### ✅ Good
- {What's well done}

### ❌ Issues (FAIL only)
- **[CRITICAL]** {Must fix — blocks pass}
- **[MAJOR]** {Should fix — quality concern}
- **[MINOR]** {Nice to fix — style/preference}

### 💡 Suggestions (optional)
- {Non-blocking improvements}

## Verdict Reasoning
{Why PASS or FAIL}
```

---

## Decision Flow

```
Review complete
    ├── ALL PASS (no CRITICAL/MAJOR) → ✅ PASS
    │     → Update progress.json
    │     → DoD checklist ✓
    │     → Human checkpoint (optional)
    │     → Unlock next task/layer
    │
    └── HAS CRITICAL or ≥3 MAJOR → ❌ FAIL
          → Return feedback to loop agent
          → Ghi vào error-memory.md
          → Loop agent fixes → re-review
```

---

## Layer Review (MANDATORY — sau khi tất cả tasks trong 1 layer PASS)

### Model
Dùng `SPEC_VALIDATOR_MODEL` từ `.env.local` — **khác với REVIEWER_MODEL** để tránh bias.

### Trigger
Loop agent báo "Layer {N} complete — all tasks PASS" → Layer Review chạy trước human checkpoint.

### Mục đích
Cross-check những gì đã build với `SPECIFICATIONS.md` ban đầu — đảm bảo layer không bỏ sót feature nào.

### Steps

1. **Đọc SPECIFICATIONS.md** — lấy danh sách features/requirements thuộc layer này
2. **Đọc tất cả task files** trong `tasks/layer-{N}/` — xem scope đã cover gì
3. **Đọc review reports** trong `.context/review-reports/layer-{N}-*` — xem kết quả từng task
4. **Cross-check** từng requirement trong SPEC với những gì đã implement

### Layer Review Report Format

```markdown
# Layer Review: Layer {N}

## Model Used: {SPEC_VALIDATOR_MODEL}

## Verdict: ✅ COMPLETE / ⚠️ GAPS FOUND

## Coverage Check

| Requirement (từ SPEC) | Task cover | Status |
|----------------------|------------|--------|
| Feature A — user login | layer-0/task-02 | ✅ Covered |
| Feature B — email verify | layer-0/task-03 | ✅ Covered |
| Feature C — rate limiting | — | ❌ Missing |

## Gaps Found
- **[MISSING]** {Requirement chưa được implement}
- **[PARTIAL]** {Requirement implement chưa đầy đủ — thiếu edge case X}

## Summary
{1-2 sentences: layer này cover được bao nhiêu % spec, có gap gì không}
```

### Decision Flow

```
Layer Review complete
    ├── COMPLETE (no gaps) → ✅ Layer PASS
    │     → Human checkpoint: "Layer {N} done — review report attached. Proceed?"
    │     → Human approves → Unlock layer {N+1}
    │
    └── GAPS FOUND
          ├── [MISSING] critical feature → ❌ Return to Loop
          │     → Tạo task bổ sung → implement → re-review layer
          │
          └── [PARTIAL] minor gap → ⚠️ Flag to human
                → Human decides: fix now or accept as tech debt
                → Ghi vào .context/decisions.md
```

### Rules
- Layer Review dùng **SPEC_VALIDATOR_MODEL**, không dùng REVIEWER_MODEL
- Lưu report vào `.context/review-reports/layer-{N}-layer-review.md`
- **KHÔNG unlock layer tiếp theo** nếu có gap MISSING chưa được resolve
- Human checkpoint **sau** Layer Review, không phải trước

---

## Rules

1. **Be specific** — "line 42 has XSS vulnerability" not "security issues exist"
2. **Provide fix suggestions** — don't just point problems, suggest solutions
3. **Don't nitpick style** — nếu code follow conventions.md thì OK
4. **CRITICAL = security or data loss risk** — không lạm dụng
5. **Max 2 review rounds** — nếu vẫn FAIL sau 2 rounds → escalate to human
6. **Review cả tests** — bad tests = false confidence
7. **Layer Review bắt buộc** — không skip, dùng SPEC_VALIDATOR_MODEL

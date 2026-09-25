# AGENT.md — AI-Powered Project Template

> 📌 **LEGACY / OPTIONAL — greenfield only.** Entry point thực tế là `AGENTS.md`
> (router, luôn được load). File này chỉ dùng khi build project **từ đầu**.
> Repo đã có code → dùng **maintenance workflow** `.agent/FEATURE_WORKFLOW.md`
> (`/bug-check`, `/bug`, `/feature`). Giá trị project: `.agent/PROJECT_PROFILE.md`.
>
> ⚠️ Mọi hướng dẫn **auto-push** trong file này + `.agent/devops.md` + `.agent/rollback.md`
> bị **override** bởi maintenance rules (`AGENTS.md` + `FEATURE_WORKFLOW.md`): cấm push
> `forbidden_branch`; push theo branch model trong `.agent/FEATURE_WORKFLOW.md` §6.

## What Is This?

This is a **model-agnostic**, multi-agent project template designed for building web applications (React + Node.js). Any AI coding assistant that can read markdown and execute commands can use this template.

## Architecture

The system uses 4 patterns working together:

- **Event-Driven**: Each phase triggers the next automatically
- **Graph**: Tasks are organized in dependency layers — Layer N+1 only unlocks when Layer N passes review
- **Loop (ReAct)**: Each task follows Read → Plan → Code → Test → Fix cycles
- **Blackboard**: Shared state in `.context/` allows any agent to resume from where things left off

## Agents

| Agent | File | Role |
|-------|------|------|
| Brainstorm | `.agent/brainstorm.md` | Gather requirements; Phase 0.5 sets up git/VPS/CI/CD/models/monitor keys upfront |
| Spec Validator | `.agent/spec-validator.md` | Validate SPECIFICATIONS.md against requirements |
| Design | `.agent/design.md` | Generate design tokens + screen specs (taste-skill v2 anti-slop + `ui-ux-pro-max` design intelligence) |
| Graph | `.agent/graph.md` | Decompose spec into layered tasks |
| Loop | `.agent/loop.md` | Execute tasks (ReAct pattern; TDD test-first + ponytail ladder) |
| Reviewer | `.agent/reviewer.md` + `.opencode/agent/reviewer.md` | Per-task code review (subagent `reviewer`) + per-layer spec cross-check (subagent `spec-validator`); UI craft-floor via `impeccable` |
| Error Analyzer | `.agent/error-analyzer.md` | Root cause analysis (Iron Law) + pattern learning |
| Context Manager | `.agent/context-manager.md` | Context compression when window fills |
| Rollback | `.agent/rollback.md` | Git checkpoint + revert strategy |
| DevOps | `.agent/devops.md` | Git init, CI/CD, push layer, deploy ⚠️ auto-push bị override ở maintenance mode |

## Workflow

```
BRIEF.md → Brainstorm Phase 0.5 (git/VPS/CI/CD/models/monitor keys setup)
    ↓
Brainstorm Phase 1-3 (requirements) → SPECIFICATIONS.md → Spec Validate
    ↓ (PASS)
Design Agent → design-tokens.md + design-spec.md
    ↓ (user confirms design tokens)
Graph → Layer Plan
    ↓
👀 HUMAN CHECKPOINT: Review layer plan → user approves
    ↓
┌──── For each Layer N ────────────────────────────────────────┐
│                                                               │
│  Loop (per task, respecting dependencies):                    │
│  Read → Plan → Code → Test → Error Analyzer (fail)           │
│      ↓ (PASS)                                                 │
│  Reviewer [subagent reviewer] → code quality/🔒security/tests │
│      ↓ (PASS) → git commit                                    │
│                                                               │
│  (after ALL tasks in layer PASS)                             │
│  Layer Review [subagent spec-validator] → cross-check vs SPEC│
│      ↓ (PASS) → DevOps push layer (override ở maintenance)   │
│                                                               │
│  👀 HUMAN CHECKPOINT: Layer N done → proceed?                │
│      ↓ (user approves)                                        │
└───────────────────────────────────────────────────────────────┘
    ↓ (all layers done)
DevOps → CI/CD → Deploy staging
    ↓
👀 HUMAN CHECKPOINT: CI/CD Secrets added? → user confirms 'done'
    ↓
DevOps verifies CI passes on remote
    ↓
... (layers execute) ...
    ↓
👀 HUMAN CHECKPOINT: Approve production deploy
    ↓
Deploy production → Health check → Done ✅
```

### Phase 0: Load Context
1. Read `BRIEF.md` — project overview
2. Read `SPECIFICATIONS.md` — detailed requirements (if exists)
3. Read `.context/progress.json` — resume point (if exists)
4. Read `.context/decisions.md` — past architectural decisions (if exists)

### Phase 0.5: Project Setup (`.agent/brainstorm.md` — Phase 0.5)
- Chạy ngay sau doc scan, **trước khi hỏi requirements**
- Git platform + token + repo → tạo repo tự động luôn sau khi có token
- Deploy platform → VPS info (IP/user/SSH port/dir/domain) hoặc Vercel/Railway config
- CI/CD platform → generate workflow files sau khi setup
- Models theo vai: khai ở `.agent/PROJECT_PROFILE.md` (`models:`) rồi điền vào frontmatter
  `.opencode/agent/*.md` — **KHÔNG** dùng biến model trong `.env.local`
- Lưu config vào `.env.local` + `.agent/PROJECT_PROFILE.md` ngay
- 🛑 **RESTART CHECKPOINT**: agent/config không hot-reload → sau khi set model phải thoát &
  mở lại opencode, rồi mới chạy tiếp (xem `0.5.C`)
- **User setup xong xuôi một lần → mới bắt đầu Phase 1**

### Phase 1: Brainstorm (`.agent/brainstorm.md`)
- Interactive Q&A with user about project requirements
- Stack, database, auth, UI library, etc. (deploy/CI/CD/models đã setup ở Phase 0.5)
- Output: populated `SPECIFICATIONS.md` + `.context/brainstorm-log.md`
- **After completing → MUST proceed to Phase 2 (Spec Validation)**

### Phase 2: Spec Validation (`.agent/spec-validator.md`) ← MANDATORY
- Validate `SPECIFICATIONS.md` for completeness and consistency
- Check for conflicts, missing configs, ambiguous requirements
- **PASS** → proceed to Phase 2.5 (Design)
- **FAIL** → return to Phase 1 (Brainstorm) with specific gaps listed, then re-validate

### Phase 2.5: Design (`.agent/design.md`) ← MANDATORY
- Ask for design reference (image / Figma link / none)
- If image/Figma → analyze and extract colors, layout, typography, components
- If none → generate design system based on style chosen in brainstorm
- **MANDATORY: ĐỌC `skills/responsive-web/SKILL.md` + `skills/responsive-web/responsive.md` trước khi viết screen specs**
- **MANDATORY: ĐỌC `skills/ui-ux-pro-max/SKILL.md`** — generate design system (pattern/style/colors/typography/effects) theo product type, đối chiếu `design-tokens.md`
- **MANDATORY (public page): ĐỌC `skills/frontend-checklist/SKILL.md`** — khai báo SEO metadata (title/description/canonical/OG/structured data) + image strategy (format/srcset/lazy) + performance budget ngay trong screen specs
- **MANDATORY: ĐỌC `.agent/references/taste-skill-v2.md`** — anti-slop rules. Ưu tiên taste-skill §4 Anti-Slop > ui-ux-pro-max khi conflict
- Mỗi screen phải khai báo **Responsive Behavior** (mobile/tablet/desktop layout) — không được bỏ trống
- Output: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`
- Confirm design tokens with user before proceeding
- **PASS** → proceed to Phase 3 (Task Graph)

### Phase 3: Task Graph (`.agent/graph.md`)
- Decompose specs into dependency-ordered layers
- Write task files to `tasks/` directory
- Each task: clear scope, inputs, outputs, acceptance criteria, **explicit dependency list**
- Show layer plan to user and **wait for approval before starting execution**

> 👀 **HUMAN CHECKPOINT — Layer Plan**
> "Em đã chia xong tasks. Anh review layer plan trước khi em bắt đầu code nhé?"
> Chờ user reply 'ok' / 'proceed' mới chạy Loop.

### Phase 4: Execution Loop (`.agent/loop.md`) — per layer
- Implement with TDD where appropriate (theo `skills/superpowers/test-driven-development.md`: test-first, xem fail, code tối thiểu pass)
- Áp dụng ponytail ladder (`skills/ponytail/SKILL.md`) — dừng ở giải pháp tối giản nhất work, chống over-engineering
- Check dependencies: chỉ chạy task khi tất cả deps đã PASS
- Update `.context/progress.json` after each task
- Handle errors via `.agent/error-analyzer.md` (theo Iron Law `skills/superpowers/systematic-debugging.md`: NO FIX WITHOUT ROOT CAUSE)
- **Max 3 retries per task** → BLOCKED → notify human

### Phase 5: Review (`.agent/reviewer.md`) — per layer

**5a. Per-task Review** (subagent `.opencode/agent/reviewer.md`)
- Code quality, security, performance, testing
- **MANDATORY: chạy Responsive Checklist Gate** từ `skills/responsive-web/SKILL.md` cho mọi task có UI (test 375/768/1280px)
- **MANDATORY (task UI): chạy UI Craft-Floor** từ `skills/impeccable/SKILL.md` — contrast ≥4.5:1, depth, type measure, states, browser surfaces, copy; refuse-list AI slop (identical card grids, hero-metric, eyebrow, gradient text, emoji icons…)
- **MANDATORY (task UI/public-facing): chạy Frontend Checklist Gate** từ `skills/frontend-checklist/SKILL.md` — HTML semantics, accessibility/WCAG, SEO (title/canonical/OG/structured data/sitemap), Core Web Vitals (LCP/CLS/INP), images, frontend security (CSP/SRI/cookies), privacy. CRITICAL items FAIL → task FAIL; HIGH items mặc định bắt buộc (ghi lý do nếu bỏ)
- Write reports to `.context/review-reports/`
- **PASS** → git commit → next task
- **FAIL** → return to Loop with feedback (max 2 rounds, then escalate)

**5b. Layer Review** (subagent `.opencode/agent/spec-validator.md`) — sau khi ALL tasks PASS
- Cross-check toàn bộ layer với `SPECIFICATIONS.md`
- Đảm bảo features đã build đúng và đủ theo spec ban đầu
- **PASS** → DevOps push layer → Human checkpoint
  ⚠️ Ở **maintenance mode**, push bị override theo branch model trong `.agent/FEATURE_WORKFLOW.md` §6.
- **FAIL** → trả về Loop với danh sách gaps → fix → Layer Review lại

> 👀 **HUMAN CHECKPOINT — End of Each Layer**
> "Layer N hoàn thành. Em tóm tắt:
> - Tasks done: [...]
> - Tests: X passed
> - Review: PASS
> Anh muốn em tiếp tục Layer N+1 không?"
> **KHÔNG tự động chạy layer tiếp theo.** Chờ user confirm.

### Phase 6: DevOps (`.agent/devops.md`)
- Git commit, CI/CD checks after each layer
- Push ⚠️ **override ở maintenance mode**: chỉ `target_branch`, chỉ khi PASS + `auto_push_after_pass: true`
- Final layer only: deploy to staging

> 👀 **HUMAN CHECKPOINT — Before Production Deploy**
> "Staging deploy xong. Health check: ✅
> Anh confirm để em deploy production không?"
> **KHÔNG tự động deploy production.** Chờ user approve.

## Post-Completion: Change Requests (`.agent/change-request.md`)

After the project is complete (or any time user requests modifications mid-project):

1. User yêu cầu thêm/sửa/bỏ feature
2. Change Request Agent classifies: **ADDITIVE** / **MODIFY** / **REMOVE**
3. Analyze impact on existing layers + tasks
4. Update `SPECIFICATIONS.md` + changelog
5. Re-trigger: Spec Validator → Graph → Loop → Review → DevOps

```
User: "Thêm dark mode" / "Đổi auth sang JWT" / "Bỏ feature chat"
    ↓
Change Request Agent → classify + impact analysis
    ↓
Update SPECIFICATIONS.md (changelog appended)
    ↓
Spec Validator → Graph → Loop → Review → DevOps
```

> 💡 **Trigger:** Bất cứ khi nào user yêu cầu thay đổi feature sau khi đã có SPECIFICATIONS.md
> Đọc full workflow tại `.agent/change-request.md`

---

## Resume Protocol (Greenfield — legacy/optional)

> **For maintenance projects, do not start here. Use `AGENTS.md` and `.agent/FEATURE_WORKFLOW.md`.**
> Maintenance dùng `.context/progress.json` schema mới (`mode`, `activeWorkItem`, `features`, `bugs`).

If `.context/progress.json` exists:
1. Nếu `mode === "maintenance"` (hoặc có `features`/`bugs`) → đi theo maintenance workflow
   (`AGENTS.md` + `.agent/FEATURE_WORKFLOW.md`); **KHÔNG** dùng logic layer/task của file này.
2. Legacy greenfield: đọc state cũ (`.context/progress.json` + `.context/blackboard.md`), resume tại phase/task.
3. Do NOT re-run completed phases.
   (Các field global `currentLayer`/`totalLayers`/`completedTasks` là **legacy greenfield**,
   không áp dụng ở maintenance mode.)

## Getting Started (Greenfield — legacy/optional)

> **For maintenance projects, do not start here. Use `AGENTS.md` and `.agent/FEATURE_WORKFLOW.md`.**

1. Fill in `BRIEF.md` with your project idea
2. Copy `.env.local.example` → `.env.local`
3. Tell your AI assistant: **"Read AGENT.md and start the project"**
4. The assistant will run `.agent/brainstorm.md` → spec-validator → graph automatically

## Resuming a Project

1. Tell your AI assistant: **"Read AGENT.md and resume the project"**
2. The assistant reads `.context/progress.json` and continues from the last checkpoint

## Model Configuration

Models theo vai nằm trong **frontmatter** `.opencode/agent/*.md` (`builder`, `builder-strong`,
`reviewer`, `spec-validator`) — khai ở `.agent/PROJECT_PROFILE.md` (`models:`) rồi **bỏ comment**
dòng `model:` và copy giá trị sang. Dùng **provider khác họ** giữa builder và reviewer để tránh bias.

> ⚠️ Biến model trong `.env.local` KHÔNG có tác dụng với opencode (không đọc). Đã bỏ.
> Sửa agent/config phải **restart opencode** (config không hot-reload). Chưa restart thì
> `model:` vẫn là comment → subagent kế thừa model chính (builder == reviewer).

## Directory Structure

```
├── AGENT.md              ← You are here
├── BRIEF.md              ← Your project idea
├── SPECIFICATIONS.md     ← Generated spec (after brainstorm)
├── .env.local            ← Git/model/deploy config (git-ignored)
├── .agent/               ← Agent workflows
├── skills/               ← Stack conventions & patterns
│   ├── react-nodejs/     ← React/Node stack skills
│   ├── security/         ← 🔒 Security skills (bắt buộc áp dụng)
│   ├── monitoring/       ← 📊 Monitoring skills (bắt buộc áp dụng)
│   ├── responsive-web/   ← 📱 Responsive design checklist (375/768/1280px)
│   ├── archify/          → 🗺️ Architecture/workflow/sequence/dataflow diagrams → self-contained HTML (tt-a1i/archify, curated)
│   ├── frontend-checklist/ ← ✅ Frontend quality gate: HTML/a11y/SEO/perf/images/security/privacy (curate from thedaviddias/Front-End-Checklist)
│   ├── superpowers/      ← 🧠 Debug Iron Law + TDD test-first (curate from obra/superpowers)
│   ├── ponytail/         → 🪶 Lazy senior dev ladder, chống over-engineering
│   ├── impeccable/       → 🎨 UI craft-floor + polish gate (curate from pbakaus/impeccable)
│   └── ui-ux-pro-max/    → 🧩 Design intelligence: 10 priority categories (curate from nextlevelbuilder)
│   └── scalability-architecture/ → 📦 OPTIONAL scalability tiers (Standard/High-Traffic/Enterprise) — chỉ khi user bật option
│   ├── karpathy-guidelines/ → ✂️ Behavioral rules: surgical changes (chỉ chạm đúng phần cần sửa) + think before coding (nêu giả định) (curate from andrej-karpathy-skills)
│   └── aislop/           → 🧹 AI-slop detection gate (scanaislop/aislop, curated) — reviewer chạy aislop scan, score ≥ 80
├── tasks/                ← Generated task files
├── .devops/              ← Deploy templates
└── .context/             ← Shared state (progress, decisions, errors)
```

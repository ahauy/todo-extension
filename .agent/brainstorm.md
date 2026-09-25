# Brainstorm Agent

> ⚠️ **Maintenance mode override:** state dùng `features[]`/`bugs[]`; **KHÔNG** ghi/đọc `currentLayer` khi ở maintenance mode; **cấm push thẳng `forbidden_branch`** (mặc định `main`); branch/push model theo `.agent/FEATURE_WORKFLOW.md` §6 (default staging-direct). Workflow hiện hành: `.agent/FEATURE_WORKFLOW.md` + `AGENTS.md` (ưu tiên). Phần greenfield dưới đây chỉ dùng khi build từ đầu.

## Role
Thu thập requirements từ user qua conversation. Hỏi từng câu một, không hỏi nhiều câu cùng lúc.

## Trigger
- Agent đọc AGENT.md và bắt đầu project mới
- Hoặc chưa có `.context/brainstorm-log.md`

## Output
- `.context/brainstorm-log.md` — full Q&A log
- `.context/doc-index.json` — doc inventory (cùng schema `.agent/spec-validator.md` đọc)
- `SPECIFICATIONS.md` — generated spec
- `.env.local` — configured (git/model)

---

## Phase 0: Document Scan (LUÔN CHẠY ĐẦU TIÊN)

### Bước 1: Scan docs/ folder

```bash
ls docs/ 2>/dev/null || echo "NO_DOCS_FOLDER"
```

Nếu `docs/` không tồn tại hoặc rỗng → skip sang Phase 1 ngay.

Nếu có files → đọc từng file và classify theo nội dung:

### Bước 2: Classify từng file theo content

Đọc nội dung file, detect loại dựa trên keywords:

| Loại | `type` (dùng trong doc-index.json) | Keywords gợi ý |
|------|-----------------------------------|---------------|
| **BRD/PRD** | `business_requirements` | "business requirement", "user story", "acceptance criteria", "business rule", "stakeholder", "objective", "scope" |
| **Design Spec** | `design_spec` | screen names, colors (#hex), font, spacing, layout, component names, wireframe, Figma |
| **API Spec** | `api_spec` | endpoint paths (/api/...), HTTP methods (GET/POST/PUT/DELETE), request/response schema, OpenAPI, Swagger |
| **ERD/Schema** | `database_schema` | table names, column definitions, foreign key, relationship, CREATE TABLE, model schema |
| **Architecture** | `architecture` | system diagram, infrastructure, service names, deployment topology, microservice |
| **Other** | `other` | không khớp rõ với loại nào |

### Bước 3: Check INDEX.md (optional)

Nếu `docs/INDEX.md` tồn tại → ưu tiên dùng classification từ đó thay vì tự detect.

### Bước 4: Confirm với user

Hiển thị kết quả detect và hỏi confirm **trước khi tiếp tục**:

```
📂 Em đã scan docs/ và detect được:

✅ PRD_v2.md → Business Requirements (BRD/PRD)
✅ figma-export.md → Design Spec
✅ swagger.yaml → API Spec
❓ db-notes.md → Không rõ loại (có thể là ERD?)

Phân loại đúng không anh? Có file nào em hiểu sai không?
Reply để confirm hoặc correct trước khi em tiếp tục.
```

Chờ user confirm → lưu kết quả vào `.context/doc-index.json` (dùng ĐÚNG `type` + `entry_mode` mà `.agent/spec-validator.md` parse):

```json
{
  "entry_mode": "full_docs",
  "documents": [
    { "file": "docs/PRD_v2.md", "type": "business_requirements" },
    { "file": "docs/figma-export.md", "type": "design_spec" },
    { "file": "docs/swagger.yaml", "type": "api_spec" },
    { "file": "docs/db-notes.md", "type": "database_schema" }
  ],
  "coverage": {
    "business_requirements": true,
    "design_spec": true,
    "api_spec": true,
    "database_schema": true,
    "architecture": false
  }
}
```

> `entry_mode`: `full_docs` (đủ BRD+Design+API+ERD) | `partial_docs` (thiếu vài loại) | `idea_only` (không có docs).
> `type` hợp lệ: `business_requirements` | `design_spec` | `api_spec` | `database_schema` | `architecture` | `other`.

### Bước 5: Xác định gap

So sánh những gì đã có với danh sách câu hỏi Phase 1 → đánh dấu câu nào đã có answer từ docs, câu nào còn thiếu.

Nếu gap là **architecture** (`architecture: ❌ not provided`) mà docs đã scan đủ thông tin hệ thống/service/flow → đề xuất user:

> 🗺️ Em có thể dựng **architecture diagram** từ docs đã scan bằng archify (xuất HTML tương tác, dark/light, export PNG) — giúp confirm topology trước khi vào requirements. Cho em vẽ nhé?

User OK → **ĐỌC `skills/archify/SKILL.md`**, dựng diagram (`architecture` từ descriptions; `workflow` từ process/flow), lưu vào `.context/arch/`, rồi thêm document `{ "file": ".context/arch/*.json", "type": "architecture" }` và set `coverage.architecture: true` trong `.context/doc-index.json`.

---

## Phase 0.5: Project Setup (CHẠY NGAY SAU PHASE 0 — TRƯỚC KHI HỎI REQUIREMENTS)

> Setup toàn bộ config một lần ngay đầu. User điền xong xuôi rồi mới bắt đầu requirements.

### 0.5.A — Git Setup

Hỏi **từng câu một**:

1. **Git platform?** GitHub / GitLab / Bitbucket / Skip

Nếu KHÔNG skip:

2. **Repo mới hay có sẵn?** (new / existing)

3. **Repo name?** (tên repository sẽ tạo hoặc tên repo hiện có)

4. **Visibility?** private / public

5. **Git username?** (tên tài khoản git)

Sau khi hỏi xong, hiển thị hướng dẫn lấy token **tương ứng platform đã chọn**:

```
📋 Hướng dẫn lấy Personal Access Token:

🔸 GitHub:
   1. Vào https://github.com/settings/tokens
   2. Click "Generate new token (classic)"
   3. Đặt tên token (vd: my-project-deploy)
   4. Expiration: 90 days hoặc No expiration
   5. Scope: ☑️ repo (full control of private repositories)
   6. Click "Generate token" → Copy token ngay (chỉ hiện 1 lần!)

🔸 GitLab:
   1. Vào https://gitlab.com/-/user_settings/personal_access_tokens
   2. Đặt tên token
   3. Scope: ☑️ api
   4. Click "Create personal access token" → Copy token

🔸 Bitbucket:
   1. Vào https://bitbucket.org/account/settings/app-passwords
   2. Click "Create app password"
   3. Permissions: ☑️ Repositories: Read + Write
   4. Copy token
```

6. **WAIT**: "Anh đã lấy được token chưa? Reply token để em điền vào `.env.local`, hoặc reply 'skip' để bỏ qua git setup."

Sau khi nhận token, ghi ngay vào `.env.local`:

```bash
cat >> .env.local << 'EOF'
GIT_PLATFORM=<platform>
GIT_TOKEN=<token>
GIT_USERNAME=<username>
REPO_NAME=<repo_name>
REPO_VISIBILITY=<private|public>
EOF
```

> ⚠️ Dùng `<< 'EOF'` (quote) — token có thể chứa `$`/backtick, không để shell expand. Không log token ra console.

---

### 0.5.B — Deploy & CI/CD Config

Hỏi:

1. **Deployment platform?**
   - `vercel` — Auto deploy từ git, zero config
   - `railway` — Auto deploy từ git, supports DB
   - `vps-docker` — VPS tự manage với Docker
   - `other` — Platform khác
   - `skip` — Chưa quyết định

2. **CI/CD?** (chỉ hỏi nếu câu 1 không phải skip)
   - `github-actions` — Auto lint + test + build khi push
   - `gitlab-ci` — GitLab CI/CD
   - `skip` — Deploy thủ công

Nếu `vps-docker`, hỏi tiếp:
3. **VPS IP hoặc domain?** (vd: 123.45.67.89 hoặc myapp.com)
4. **SSH user?** (vd: root, ubuntu, deploy)
5. **SSH port?** (default: 22)
6. **Đường dẫn SSH private key trên máy local?** (default: ~/.ssh/id_rsa)
7. **Deploy directory trên VPS?** (default: /opt/app)
8. **Domain cho app?** (vd: myapp.com — dùng cho SSL + Nginx)

Nếu `vercel`, hỏi tiếp:
3. **Vercel project name/ID?** (lấy từ `vercel link`)
4. **Vercel org/team ID?** (để trống nếu personal account — lấy từ `vercel link`)
5. **Vercel token?** (từ https://vercel.com/account/tokens — dùng cho CI)

Nếu `railway`, hỏi tiếp:
3. **Railway project ID?** (lấy từ `railway link`)
4. **Railway token?** (từ https://railway.app/account/tokens — dùng cho CI)

Ghi tất cả vào `.env.local` (dùng ĐÚNG tên key như `.env.local.example` — CI/CD đọc lại các key này):

```bash
cat >> .env.local << 'EOF'
DEPLOY_PLATFORM=<platform>
CI_CD=<github-actions|gitlab-ci|skip>
# VPS fields (nếu vps-docker):
VPS_HOST=<ip_or_domain>
VPS_USER=<ssh_user>
VPS_PORT=<ssh_port>
VPS_SSH_KEY_PATH=<~/.ssh/id_rsa>
VPS_DEPLOY_DIR=<deploy_dir>
DOMAIN=<domain>
# Vercel fields (nếu vercel):
VERCEL_TOKEN=<token>
VERCEL_ORG_ID=<org_id>
VERCEL_PROJECT_ID=<project_id>
# Railway fields (nếu railway):
RAILWAY_TOKEN=<token>
RAILWAY_PROJECT_ID=<project_id>
EOF
```

> ⚠️ Heredoc dùng `<< 'EOF'` (quote) để không expand `$`/backtick trong token/key.

Thông báo về CI/CD:
- `github-actions` → "DevOps agent sẽ tạo `.github/workflows/` tự động khi bắt đầu code."
- `gitlab-ci` → "DevOps agent sẽ tạo `.gitlab-ci.yml` tự động khi bắt đầu code."

---

### 0.5.C — Agent Models (cấu hình trong agent files) ← có 🛑 RESTART checkpoint

> ⚠️ Model **KHÔNG** đọc từ `.env.local` (biến đó vô tác dụng). Cấu hình ở frontmatter
> `.opencode/agent/*.md`, khai 1 lần ở `.agent/PROJECT_PROFILE.md` mục `models:`.
> ⚠️ Agent file/config **không hot-reload** → set xong PHẢI restart opencode. Vì vậy bước này
> phải xong + restart **trước khi** pipeline gọi subagent.

**1. Lấy danh sách model** (tùy bản opencode; nếu không có thì đọc config hoặc tự nhập):
```bash
opencode models 2>/dev/null || \
cat ~/.config/opencode/opencode.json 2>/dev/null || \
cat ~/.config/opencode/config.json 2>/dev/null
```

**2. Hỏi lần lượt** (skip được nếu chưa biết — để comment `# model:` = kế thừa model chính):
1. **builder** — model code chính.
2. **builder_strong** — model mạnh hơn (chỉ dùng khi user yêu cầu rõ).
3. **reviewer** — **KHÁC HỌ** với builder.
4. **spec_validator** — họ thứ 3 nếu có.

**3. Ghi cấu hình:**
- `.agent/PROJECT_PROFILE.md` → mục `models:`
- Bỏ comment + điền `model:` trong frontmatter:
  `.opencode/agent/builder.md`, `builder-strong.md`, `reviewer.md`, `spec-validator.md`

**4. 🛑 MANDATORY RESTART checkpoint:**
```
✅ Đã cấu hình model vào .opencode/agent/*.md.

⚠️ opencode cần RESTART để nạp agent/config mới (không hot-reload).
Anh thoát và mở lại opencode, rồi reply 'continue' để em chạy tiếp Phase 1.
```
- **KHÔNG** chạy requirements/graph/loop trong cùng session vừa sửa model.
- Nếu user **skip** model → ghi rõ vào brainstorm-log: *"chưa cấu hình model — subagent kế thừa
  model chính (builder == reviewer), mất tác dụng tránh bias"* và vẫn yêu cầu restart nếu đã sửa file.

---

### 0.5.D — Monitor Setup

> Setup keys/token cho monitoring (OpenTelemetry + uptime). Lưu tất cả vào `.env.local` giống git/deploy.

Hỏi **từng câu một**:

1. **Có setup monitoring không?** `otel` / `skip`

Nếu `otel`:

2. **OTLP endpoint?** (nơi nhận telemetry — tự host hoặc provider)
   - Vendor-neutral: nhập URL endpoint (vd: `https://otlp.example.com/v1/traces`)
   - Hoặc dùng provider (Grafana Cloud, SigNoz, etc.)

3. **OTLP token/headers?** (auth cho exporter, nếu có)

4. **Service name?** (tên service trong telemetry, vd: `my-app`)

5. **Environment?** (vd: `production`, `staging`)

6. **Uptime monitor?** (vd: UptimeRobot/StatusCake) — nếu có, hỏi:
   - **Uptime service?** (tên service)
   - **Uptime token?** (API token nếu dùng API tạo monitor)

Ghi tất cả vào `.env.local`:

```bash
cat >> .env.local << 'EOF'
# ─── Monitoring (OpenTelemetry) ───
MONITOR_ENABLED=<true|false>
OTEL_EXPORTER_OTLP_ENDPOINT=<otlp_endpoint>
OTEL_EXPORTER_OTLP_TOKEN=<otlp_token>
OTEL_SERVICE_NAME=<service_name>
OTEL_ENV=<environment>
UPTIME_SERVICE=<uptime_service>
UPTIME_TOKEN=<uptime_token>
EOF
```

> ⚠️ Không bắt buộc — nếu `skip` thì bỏ qua. Nếu chưa có endpoint, dùng placeholder và bổ sung sau.

---

### 0.5.E — Project Profile

> Điền `.agent/PROJECT_PROFILE.md` để workflow biết branch/package manager/verify commands/DB.
> Chạy `/setup-profile` sẽ làm các bước dưới tự động (detect + hỏi + ghi file + sync quyền verify command).
> Bước này cũng cần cho maintenance mode trên repo có sẵn.

**1. Auto-detect** (không hỏi): chạy `node scripts/detect-profile.mjs` → package manager, source roots,
scripts (`test/lint/typecheck/build`), `db_tool`, `migration_required`.

**2. Hỏi bắt buộc** (từng câu một):
1. `target_branch` — branch đích commit/push.
2. `forbidden_branch` — mặc định `main`, chỉ confirm.
3. `auto_push_after_pass` — `true|false`; tên cũ `auto_commit_after_pass`. Đây **KHÔNG phải auto-commit** — commit sau PASS luôn bắt buộc; flag chỉ = tự **push** `target_branch` sau PASS.

**3. Confirm detect**: stack, `package_manager`, `source_roots`, verify commands (sửa nếu sai).

**4. Nếu có DB** (`db_tool != none`): confirm `db_tool`/`migration_required`; hỏi `staging_db`/`prod_db`
là **tên env var** (không ghi secret), bắt buộc `staging_db != prod_db`; hỏi `migration_command` nếu có.

**5. Ghi** `.agent/PROJECT_PROFILE.md` (giữ cấu trúc + comment), rồi sync allow rule:
chạy `node scripts/apply-verify-permissions.mjs` (dry-run) → xem danh sách bỏ qua → `--write` để ghi
vào `reviewer.md`/`spec-validator.md`. Command không an toàn (shell meta, DB-destructive, wildcard,
deploy) không được auto-allow; exit code khác 0 (thiếu marker) → dừng, báo chưa hoàn tất.

> Nếu repo chưa có app code/command → giữ `null`; workflow ghi `skip, no app configured`, không bịa lệnh.

---

### 0.5.F — Confirm Setup

Sau khi điền xong, hiển thị tóm tắt:

```
✅ Project Setup Complete!

📁 Git:      <platform> — <username>/<repo_name> (<visibility>)
🚀 Deploy:   <platform> → <host_or_project>
⚙️  CI/CD:    <github-actions|gitlab-ci|skip>
📦 Profile:  target=<target_branch> · forbidden=<forbidden_branch> · auto-push=<true|false>
             pm=<package_manager> · test=<test_command> · db=<db_tool>
🤖 Models:   đã ghi vào .agent/PROJECT_PROFILE.md + .opencode/agent/*.md
   • builder:        <model>
   • builder-strong: <model>
   • reviewer:       <model>
   • spec-validator: <model>

Cấu hình trong .env.local (git-ignored).
Ready để bắt đầu requirements! 🚀
```

Chờ user confirm → mới chạy Phase 1.

---

## Phase 1: Project Requirements

**Chỉ hỏi những gì CHƯA có trong docs đã scan.**

Nếu câu hỏi đã được trả lời bởi doc → **skip câu đó**, không hỏi lại.

Hỏi **từng câu một**. Chờ user trả lời rồi mới hỏi tiếp.

### Questions (tuần tự — skip nếu đã có trong docs)

> ℹ️ Deploy platform, CI/CD, server/hosting, git và model keys đã hỏi & lưu ở **Phase 0.5** — KHÔNG hỏi lại ở đây.

1. **Stack**: Web (React + Node.js) hay Mobile (React Native)?
2. **Database**: PostgreSQL / MySQL / MongoDB / SQLite / None?
3. **Auth**: JWT / Session / OAuth / None?
4. **Realtime**: WebSocket / SSE / None?
5. **File Upload**: Local / S3 / Cloudinary / None?
6. **Payment**: Stripe / VNPay / None?
7. **Timeline**: MVP (core features only) / Full (all features)?
8. **UI Library?**
    Web: shadcn/ui (recommended) / MUI / Ant Design / Tailwind only
9. **Scalability Option?** (OPTIONAL — chỉ kích hoạt khi user chọn bật)
    - `off` (mặc định) — Không cần hạ tầng scale phức tạp. Đi theo mô hình modular monolith + stateless + PostgreSQL đơn giản.
    - `on` — Cần thiết kế hạ tầng/backend/database cho nhiều user/CCU cao. Chọn Tier + khai Scalability Profile.

> 📦 Nếu user chọn `on` → **ĐỌC `skills/scalability-architecture/SKILL.md`** + `references/capacity-planning.md` trước khi hỏi tiếp. Chỉ hỏi phần profile khi user bật option — KHÔNG tự áp dụng cho mọi dự án.

### Scalability Profile (chỉ khi user bật Scalability Option)

Hỏi **từng câu một** (số liệu giúp chọn Tier + ghi vào SPECIFICATIONS.md):

1. **CCU dự kiến?** — "Khoảng bao nhiêu user online đồng thời vào giờ cao điểm?"
2. **Peak RPS ước tính?** — "Ước tính đỉnh tải bao nhiêu request/giây? (nếu chưa biết, cho số user + tần suất thao tác)"
3. **Tỉ lệ đọc/ghi?** — "Chủ yếu đọc hay ghi? (vd xem tin nhiều vs chat/nhập liệu nhiều)"
4. **Peak chênh lệch?** — "Tải cao điểm gấp mấy lần tải bình thường? (vd 10x khi event/khuyến mãi)"
5. **Tăng trưởng 6–12 tháng?** — "Kỳ vọng user tăng gấp mấy lần trong năm tới?"
6. **Availability (SLA)?** — "Uptime yêu cầu? 99% / 99.9% / 99.99%?"
7. **Recovery (RTO/RPO)?** — "Nếu sập: chấp nhận downtime tối đa bao lâu? Mất dữ liệu tối đa bao lâu?"

Sau khi có số liệu → chọn Tier theo `references/capacity-planning.md`:

```text
RPS <100 / CCU <1k                  → Standard
RPS 100–1k / CCU 1k–10k             → Standard / High Traffic
RPS 1k–10k / CCU 10k–100k           → High Traffic
RPS >10k / CCU >100k                → Enterprise
```

Confirm Tier với user → ghi vào SPECIFICATIONS.md mục **Scalability Profile**. Nếu user không có số liệu → mặc định **Standard** và ghi rõ horizontal-scaling-ready (nâng cấp sau không phải viết lại).

> ℹ️ Design style, color scheme, và design reference sẽ được hỏi riêng bởi **Design Agent** sau khi Spec Validator PASS.

> 📦 **Scalability Option (OPTIONAL):** Câu hỏi #9 trong Phase 1. Chỉ kích hoạt khi user bật `on`. Không mặc định áp dụng. Chi tiết tại `SKILL.md` mục Scalability Profile.

### Rules
- Hỏi 1 câu → chờ answer → hỏi câu tiếp
- Nếu user không biết → suggest default rồi move on
- Ghi mỗi Q&A vào `.context/brainstorm-log.md` ngay khi nhận answer
- **KHÔNG hỏi lại những gì đã có trong docs** — tôn trọng thông tin anh đã chuẩn bị
- **Scalability là OPTIONAL**: nếu user không bật → bỏ qua hoàn toàn, không hỏi profile, không thêm hạ tầng. Đi theo mặc định đơn giản (chống over-engineering — ponytail).

---

## Phase 2: Clarification Round

Sau khi hỏi xong gap questions, đọc lại toàn bộ docs + answers và **flag những điểm cần làm rõ**:

### Conflict Detection
- Nếu BRD nói feature A nhưng Design không có screen cho A → flag
- Nếu API spec có endpoint X nhưng BRD không mention → flag
- Nếu ERD có table Y nhưng không feature nào dùng → flag

### Ambiguity Detection
- Requirements mơ hồ ("hệ thống phải nhanh") → hỏi threshold cụ thể
- Feature chưa rõ edge case → hỏi behavior khi fail/empty/concurrent

Hỏi từng conflict/ambiguity một, chờ user clarify.

---

## Phase 3: Summary Confirmation

Trước khi generate SPECIFICATIONS.md, **tóm tắt toàn bộ** và hỏi confirm:

```
📋 Tóm tắt requirements em hiểu được:

**Từ docs:**
- [list key points từ BRD/PRD]
- [list key design decisions]
- [list API endpoints chính]

**Từ brainstorm:**
- [list answers từ Phase 1]

**Clarifications:**
- [list resolved conflicts/ambiguities]

Anh confirm để em generate SPECIFICATIONS.md không?
```

Chờ user confirm → mới generate.

---

## After All Phases (Post Phase 3)

1. Generate `SPECIFICATIONS.md` từ docs + brainstorm-log + clarifications
2. Trigger `.agent/spec-validator.md`
3. Nếu PASS → trigger `.agent/graph.md`
4. Nếu FAIL → quay lại hỏi bổ sung → validate lại

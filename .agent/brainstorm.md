# Brainstorm Agent

## Role
Thu thập requirements từ user qua conversation. Hỏi từng câu một, không hỏi nhiều câu cùng lúc.

## Trigger
- Agent đọc AGENT.md và bắt đầu project mới
- Hoặc chưa có `.context/brainstorm-log.md`

## Output
- `.context/brainstorm-log.md` — full Q&A log
- `.context/doc-index.md` — danh sách docs đã detect + classification
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

| Loại | Keywords gợi ý |
|------|---------------|
| **BRD/PRD** | "business requirement", "user story", "acceptance criteria", "business rule", "stakeholder", "objective", "scope" |
| **Design Spec** | screen names, colors (#hex), font, spacing, layout, component names, wireframe, Figma |
| **API Spec** | endpoint paths (/api/...), HTTP methods (GET/POST/PUT/DELETE), request/response schema, OpenAPI, Swagger |
| **ERD/Schema** | table names, column definitions, foreign key, relationship, CREATE TABLE, model schema |
| **Architecture** | system diagram, infrastructure, service names, deployment topology, microservice |
| **Other** | không khớp rõ với loại nào |

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

Chờ user confirm → lưu kết quả vào `.context/doc-index.md`:

```markdown
# Doc Index

## Detected Documents
- docs/PRD_v2.md: BRD/PRD
- docs/figma-export.md: Design Spec
- docs/swagger.yaml: API Spec
- docs/db-notes.md: ERD (confirmed by user)

## Coverage
- business_requirements: ✅ covered
- design_spec: ✅ covered
- api_spec: ✅ covered
- erd: ✅ covered
- architecture: ❌ not provided
```

### Bước 5: Xác định gap

So sánh những gì đã có với danh sách câu hỏi Phase 1 → đánh dấu câu nào đã có answer từ docs, câu nào còn thiếu.

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
cat >> .env.local << EOF
GIT_PLATFORM=<platform>
GIT_TOKEN=<token>
GIT_USERNAME=<username>
REPO_NAME=<repo_name>
REPO_VISIBILITY=<private|public>
EOF
```

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
6. **Deploy directory trên VPS?** (default: /opt/app)
7. **Domain cho app?** (vd: myapp.com — dùng cho SSL + Nginx)

Nếu `vercel`, hỏi tiếp:
3. **Vercel project name?**
4. **Vercel team slug?** (để trống nếu personal account)

Nếu `railway`, hỏi tiếp:
3. **Railway project name?**

Ghi tất cả vào `.env.local`:

```bash
cat >> .env.local << EOF
DEPLOY_PLATFORM=<platform>
CI_CD=<github-actions|gitlab-ci|skip>
# VPS fields (nếu vps-docker):
VPS_HOST=<ip_or_domain>
VPS_USER=<ssh_user>
VPS_PORT=<ssh_port>
DEPLOY_DIR=<deploy_dir>
APP_DOMAIN=<domain>
# Vercel fields (nếu vercel):
VERCEL_PROJECT=<project_name>
VERCEL_TEAM=<team_slug>
# Railway fields (nếu railway):
RAILWAY_PROJECT=<project_name>
EOF
```

Thông báo về CI/CD:
- `github-actions` → "DevOps agent sẽ tạo `.github/workflows/` tự động khi bắt đầu code."
- `gitlab-ci` → "DevOps agent sẽ tạo `.gitlab-ci.yml` tự động khi bắt đầu code."

---

### 0.5.C — Agent Models

Trước khi hỏi, đọc models từ opencode config của user:

```bash
# Thử các path phổ biến của opencode config
cat ~/.opencode/config.json 2>/dev/null || \
cat ~/.config/opencode/config.json 2>/dev/null || \
cat ~/opencode.json 2>/dev/null
```

Parse danh sách models từ config → hiển thị cho user chọn:

```
╔═══════════════════════════════════════════╗
║           AVAILABLE MODELS                ║
║      (from your OpenCode config)          ║
╠═══════════════════════════════════════════╣
║                                           ║
║  [LIST ĐỘNG TỪ CONFIG CỦA USER]           ║
║  Ví dụ:                                   ║
║  • provider/model-name — description      ║
║                                           ║
╚═══════════════════════════════════════════╝
```

Nếu không đọc được config → fallback hỏi user tự nhập model ID:
"Không tìm thấy opencode config. Bạn nhập model ID trực tiếp nhé (ví dụ: claude-opus-4, gpt-4o)"

Hỏi lần lượt:

1. **CODING_MODEL** — Model viết code chính? (gợi ý: model mạnh nhất có sẵn)
2. **REVIEWER_MODEL** — Model review code? (nên chọn model KHÁC hãng với coding để tránh bias)
3. **SPEC_VALIDATOR_MODEL** — Model validate spec và layer review? (nên chọn model KHÁC 2 cái trên)

Lưu vào `.env.local`:
```bash
cat >> .env.local << EOF
CODING_MODEL=<user_choice>
REVIEWER_MODEL=<user_choice>
SPEC_VALIDATOR_MODEL=<user_choice>
EOF
```

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
cat >> .env.local << EOF
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

### 0.5.E — Confirm Setup

Sau khi điền xong, hiển thị tóm tắt:

```
✅ Project Setup Complete!

📁 Git:      <platform> — <username>/<repo_name> (<visibility>)
🚀 Deploy:   <platform> → <host_or_project>
⚙️  CI/CD:    <github-actions|gitlab-ci|skip>
🤖 Models:
   • Coding:         <CODING_MODEL>
   • Reviewer:       <REVIEWER_MODEL>
   • Spec Validator: <SPEC_VALIDATOR_MODEL>

Tất cả đã lưu vào .env.local (git-ignored).
Ready để bắt đầu requirements! 🚀
```

Chờ user confirm → mới chạy Phase 1.

---

## Phase 1: Project Requirements

**Chỉ hỏi những gì CHƯA có trong docs đã scan.**

Nếu câu hỏi đã được trả lời bởi doc → **skip câu đó**, không hỏi lại.

Hỏi **từng câu một**. Chờ user trả lời rồi mới hỏi tiếp.

### Questions (tuần tự — skip nếu đã có trong docs)

1. **Stack**: Web (React + Node.js) hay Mobile (React Native)?
2. **Database**: PostgreSQL / MySQL / MongoDB / SQLite / None?
3. **Auth**: JWT / Session / OAuth / None?
4. **Realtime**: WebSocket / SSE / None?
5. **File Upload**: Local / S3 / Cloudinary / None?
6. **Payment**: Stripe / VNPay / None?
7. **Deployment platform?**
   - `vercel` — Auto deploy từ git, zero config
   - `railway` — Auto deploy từ git, supports DB
   - `vps-docker` — VPS tự manage với Docker
   - `other` — Platform khác
   - `skip` — Chưa quyết định

8. **CI/CD?** (chỉ hỏi nếu câu 7 không phải skip)
   - `github-actions` — Auto lint + test + build khi push
   - `gitlab-ci` — GitLab CI/CD
   - `skip` — Deploy thủ công

9. **Server / Hosting cụ thể?** (chỉ hỏi nếu câu 7 không phải skip)
   - Nếu `vps-docker`: IP hoặc domain server? SSH user?
   - Nếu `vercel`/`railway`: Tên project trên platform?
   - Nếu `other`: URL/domain deploy?

10. **Timeline**: MVP (core features only) / Full (all features)?
11. **UI Library?**
    Web: shadcn/ui (recommended) / MUI / Ant Design / Tailwind only

> ℹ️ Design style, color scheme, và design reference sẽ được hỏi riêng bởi **Design Agent** sau khi Spec Validator PASS.

### Rules
- Hỏi 1 câu → chờ answer → hỏi câu tiếp
- Nếu user không biết → suggest default rồi move on
- Ghi mỗi Q&A vào `.context/brainstorm-log.md` ngay khi nhận answer
- **KHÔNG hỏi lại những gì đã có trong docs** — tôn trọng thông tin anh đã chuẩn bị

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

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
12. **Design style?** (skip nếu đã có Design Spec)
    Minimal / Modern / Corporate / Playful
13. **Color scheme?** (skip nếu đã có Design Spec)
    Light only / Dark only / Both (system)
14. **Design reference?** (skip nếu đã có Design Spec)
    - Upload ảnh (Figma screenshot, inspo, wireframe)
    - Paste Figma link
    - Không có (agent tự design theo style đã chọn)

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

## Phase 4: Git Setup

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

Sau đó ghi ngay vào `.env.local`:

```bash
# Ghi git config vào .env.local
cat >> .env.local << EOF
GIT_PLATFORM=<platform>
GIT_TOKEN=<token>
GIT_USERNAME=<username>
REPO_NAME=<repo_name>
REPO_VISIBILITY=<private|public>
EOF
```

6. **WAIT**: "Anh đã lấy được token chưa? Reply token để em điền vào `.env.local`, hoặc reply 'skip' để bỏ qua git setup."

---

## Phase 5: Deploy & CI/CD Config

Chỉ chạy phase này nếu Phase 1 câu 7 KHÔNG phải `skip`.

Đọc `DEPLOY_PLATFORM` từ `.context/brainstorm-log.md`.

### Nếu `vps-docker`:

Hỏi:
1. **VPS IP hoặc domain?** (vd: 123.45.67.89 hoặc myapp.com)
2. **SSH user?** (vd: root, ubuntu, deploy)
3. **SSH port?** (default: 22)
4. **Deploy directory trên VPS?** (default: /opt/app)
5. **Domain cho app?** (vd: myapp.com — dùng cho SSL + Nginx)

Ghi vào `.env.local`:
```bash
cat >> .env.local << EOF
VPS_HOST=<ip_or_domain>
VPS_USER=<ssh_user>
VPS_PORT=<ssh_port>
DEPLOY_DIR=<deploy_dir>
APP_DOMAIN=<domain>
EOF
```

### Nếu `vercel`:

Hỏi:
1. **Vercel project name?** (tên project trên Vercel)
2. **Vercel team slug?** (nếu dùng team account, để trống nếu personal)

Ghi vào `.env.local`:
```bash
cat >> .env.local << EOF
VERCEL_PROJECT=<project_name>
VERCEL_TEAM=<team_slug>
EOF
```

### Nếu `railway`:

Hỏi:
1. **Railway project name?** (tên project trên Railway)

Ghi vào `.env.local`:
```bash
cat >> .env.local << EOF
RAILWAY_PROJECT=<project_name>
EOF
```

### CI/CD Setup

Đọc `CI_CD` từ `.context/brainstorm-log.md`.

Nếu `github-actions`:
- Ghi vào `.env.local`:
```bash
cat >> .env.local << EOF
CI_CD=github-actions
EOF
```
- Thông báo: "Sau khi generate spec xong, DevOps agent sẽ tạo file `.github/workflows/` tự động."

Nếu `gitlab-ci`:
- Ghi vào `.env.local`:
```bash
cat >> .env.local << EOF
CI_CD=gitlab-ci
EOF
```
- Thông báo: "Sau khi generate spec xong, DevOps agent sẽ tạo file `.gitlab-ci.yml` tự động."

Nếu `skip`:
- Ghi vào `.env.local`:
```bash
cat >> .env.local << EOF
CI_CD=skip
EOF
```

---

## Phase 6: Agent Models

Trước khi hỏi, đọc models từ opencode config của user:

```bash
# Thử các path phổ biến của opencode config
cat ~/.opencode/config.json 2>/dev/null || \
cat ~/.config/opencode/config.json 2>/dev/null || \
cat ~/opencode.json 2>/dev/null
```

Parse danh sách models từ config → hiển thị cho user chọn theo format:

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
3. **SPEC_VALIDATOR_MODEL** — Model validate spec? (nên chọn model KHÁC 2 cái trên)

Lưu vào `.env.local`:
```
CODING_MODEL=<user_choice>
REVIEWER_MODEL=<user_choice>
SPEC_VALIDATOR_MODEL=<user_choice>
```

---

## After All Phases (Post Phase 6)

1. Generate `SPECIFICATIONS.md` từ docs + brainstorm-log + clarifications
2. Trigger `.agent/spec-validator.md`
3. Nếu PASS → trigger `.agent/graph.md`
4. Nếu FAIL → quay lại hỏi bổ sung → validate lại

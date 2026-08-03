# Brainstorm Agent

## Role
Thu thập requirements từ user qua conversation. Hỏi từng câu một, không hỏi nhiều câu cùng lúc.

## Trigger
- User vừa điền BRIEF.md và bắt đầu project mới
- Hoặc agent đọc AGENT.md và thấy chưa có `.context/brainstorm-log.md`

## Output
- `.context/brainstorm-log.md` — full Q&A log
- `SPECIFICATIONS.md` — generated spec
- `.env.local` — configured (git/model)

---

## Phase 1: Project Requirements

Hỏi **từng câu một**. Chờ user trả lời rồi mới hỏi tiếp.

### Questions (tuần tự)

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

### Rules
- Hỏi 1 câu → chờ answer → hỏi câu tiếp
- Nếu user không biết → suggest default rồi move on
- Ghi mỗi Q&A vào `.context/brainstorm-log.md` ngay khi nhận answer

---

## Phase 2: Git Setup

Hỏi:
1. **Git platform?** GitHub / GitLab / Bitbucket / Skip

Nếu KHÔNG skip:
2. **Repo mới hay có sẵn?**

Nếu tạo mới, hướng dẫn lấy token:

```
📋 Hướng dẫn lấy Personal Access Token:

🔸 GitHub:
   1. Vào https://github.com/settings/tokens
   2. "Generate new token (classic)"
   3. Scope: ☑️ repo (full control)
   4. Copy token

🔸 GitLab:
   1. Vào https://gitlab.com/-/user_settings/personal_access_tokens
   2. Scope: ☑️ api
   3. Copy token

🔸 Bitbucket:
   1. Vào https://bitbucket.org/account/settings/app-passwords
   2. Permissions: ☑️ Repositories Read + Write
   3. Copy token
```

3. Hướng dẫn user điền vào `.env.local`:
```
GIT_PLATFORM=github
GIT_TOKEN=ghp_xxxxxxxxxxxx
GIT_USERNAME=your-username
REPO_NAME=my-project
REPO_VISIBILITY=private
```

4. **WAIT**: "Điền xong chưa anh? Reply 'continue' để tiếp tục"

---

## Phase 3: Agent Models

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

## After All Phases

1. Generate `SPECIFICATIONS.md` từ BRIEF + brainstorm-log
2. Trigger `.agent/spec-validator.md`
3. Nếu PASS → trigger `.agent/graph.md`
4. Nếu FAIL → quay lại hỏi bổ sung → validate lại

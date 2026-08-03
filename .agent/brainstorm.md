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
7. **Deployment**: Vercel / Railway / VPS-Docker / Other?
8. **Timeline**: MVP (core features only) / Full (all features)?

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

Hiển thị danh sách models:

```
╔═══════════════════════════════════════════════════════════════╗
║                    AVAILABLE MODELS                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ANTHROPIC (via AIHub):                                       ║
║  • claude-sonnet-4-6    — Cân bằng speed/quality              ║
║  • claude-opus-4-6      — Mạnh, reasoning tốt                ║
║  • claude-opus-4-8      — Mạnh nhất Anthropic                 ║
║                                                               ║
║  OPENAI (via AIHub):                                          ║
║  • gpt-5.5              — Mạnh, general purpose               ║
║  • gpt-5.4              — Cân bằng cost/performance           ║
║  • gpt-5.3-codex        — Chuyên code, nhanh                  ║
║                                                               ║
║  DEEPSEEK (via Huawei MAAS):                                  ║
║  • deepseek-v4-pro      — Reasoning mạnh, giá rẻ             ║
║  • deepseek-v4-flash    — Nhanh nhất, rẻ nhất                 ║
║  • glm-5.2              — Nhẹ, tiết kiệm                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

Hỏi lần lượt:

1. **CODING_MODEL** — Model viết code chính?
   - Gợi ý: `claude-opus-4-6` (mạnh, reasoning tốt cho code phức tạp)

2. **REVIEWER_MODEL** — Model review code? (nên khác hãng với coding)
   - Gợi ý: `gpt-5.4` (perspective khác, tránh blind spots)

3. **SPEC_VALIDATOR_MODEL** — Model validate spec? (nên khác 2 cái trên)
   - Gợi ý: `deepseek-v4-pro` (reasoning mạnh, góc nhìn thứ 3)

Lưu vào `.env.local`:
```
CODING_MODEL=claude-opus-4-6
REVIEWER_MODEL=gpt-5.4
SPEC_VALIDATOR_MODEL=deepseek-v4-pro
```

---

## After All Phases

1. Generate `SPECIFICATIONS.md` từ BRIEF + brainstorm-log
2. Trigger `.agent/spec-validator.md`
3. Nếu PASS → trigger `.agent/graph.md`
4. Nếu FAIL → quay lại hỏi bổ sung → validate lại

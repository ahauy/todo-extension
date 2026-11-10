# GitHub Rulesets — Enterprise

## Mục đích

Quản lý quy tắc bảo vệ nhánh `staging` theo chuẩn doanh nghiệp (enterprise-grade) cho repository `todo-extension`.

## File

| File | Mô tả |
|------|-------|
| `rule.json` | Định nghĩa ruleset `staging` theo chuẩn GitHub Rulesets REST API (enterprise) |

## Quy tắc trong `rule.json` (enterprise)

| Quy tắc | Giá trị |
|---------|---------|
| Required approving reviews | 2 (bắt buộc review từ code owner) |
| Dismiss stale reviews on push | Có |
| Require last push approval | Có |
| Required status checks (strict) | `CI / ci`, `lint`, `test`, `build`, `security-scan`, `dependency-review` |
| Required linear history | Có |
| Required conversation resolution | Có |
| Required signed commits | Có |
| Block force pushes | Có |
| Restrict deletions | Có |
| Restrict required pushes | Không (trống) |
| Required first PR review | Có (code owner review) |
| Enforcement | `active` |

## Cách áp dụng (2 lựa chọn)

### Lựa chọn 1: Qua GitHub UI (khuyên dùng)

1. Vào **Settings → Rules → Rulesets** trên repository GitHub.
2. Nhấn **Create ruleset**.
3. Nhập tên: `Branch protection — staging (enterprise)`.
4. Mục **Branches**: chọn `staging`.
5. Enforcement status: **Active**.
6. Bật các quy tắc theo bảng trên.
7. Nhấn **Create**.

### Lựa chọn 2: Qua GitHub CLI (`gh`)

```bash
gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --input rule.json
```

Thay `{owner}/{repo}` bằng tên repo của bạn (ví dụ: `vutuanhau/todo-extension`).

## Lưu ý

- File `rule.json` là tài liệu mô tả quy tắc, GitHub **không tự động áp dụng** file JSON này vào repository. Bạn phải tạo ruleset qua UI hoặc API như trên.
- Các status check trong `rule.json` (`CI / ci`, `lint`, `test`, `build`, `security-scan`, `dependency-review`) phải khớp với tên job trong `.github/workflows/ci.yml`. Hiện `ci.yml` đã có `CI / ci` (bao gồm typecheck, lint, test, wxt build). Các check `security-scan` và `dependency-review` có thể bổ sung sau bằng GitHub Actions (Dependabot, CodeQL, v.v.).
- Nhánh `staging` là `target_branch` mặc định của repo (xem `.context/project-config.md`). Nhánh `main` là `forbidden_branch` — không push trực tiếp.
- Bypass actors để trống (không ai được bypass ruleset).

## Liên kết

- GitHub Rulesets API: https://docs.github.com/en/rest/repos/rules
- GitHub Rulesets UI: Settings → Rules → Rulesets (trên repository)
- GitHub Enterprise security: https://docs.github.com/en/enterprise-server@latest/code-security/

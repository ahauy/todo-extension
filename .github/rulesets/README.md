# GitHub Rulesets

## Mục đích

Quản lý quy tắc bảo vệ nhánh `staging` cho repository `todo-extension`.

## File

| File | Mô tả |
|------|-------|
| `rule.json` | Định nghĩa ruleset `staging` theo chuẩn GitHub Rulesets REST API |

## Cách áp dụng (2 lựa chọn)

### Lựa chọn 1: Qua GitHub UI (khuyên dùng)

1. Vào **Settings → Rules → Rulesets** trên repository GitHub.
2. Nhấn **Create ruleset**.
3. Nhập tên: `Branch protection — staging`.
4. Mục **Branches**: chọn `staging`.
5. Enforcement status: **Active**.
6. Các quy tắc cần bật (theo `rule.json`):
   - Require a pull request before merging → 1 approving review
   - Dismiss stale pull request approvals when new commits are pushed
   - Require status checks to pass before merging → `CI / ci` (strict)
   - Require linear history
   - Require conversation resolution before merging
   - Do not allow bypassing the above rules (block force pushes, restrict deletions)
7. Nhấn **Create**.

### Lựa chọn 2: Qua GitHub CLI (`gh`)

```bash
gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --field name="Branch protection — staging" \
  --field target="branch" \
  --field enforcement="active" \
  --field conditions='{"ref_name":{"include":["staging"],"exclude":[]}}' \
  --field rules='[...]'
```

Hoặc dùng `gh api` với body từ `rule.json` (cần flatten `conditions` thành query params hoặc dùng `--input` với file JSON tuỳ phiên bản `gh`).

## Lưu ý

- File `rule.json` là tài liệu mô tả quy tắc, GitHub **không tự động áp dụng** file JSON này vào repository. Bạn phải tạo ruleset qua UI hoặc API như trên.
- CI workflow chạy tại `.github/workflows/ci.yml` và trạng thái check tên là `CI / ci` — phải khớp với tên check trong `rule.json` (`required_status_checks.checks.context`).
- Nhánh `staging` là `target_branch` mặc định của repo (xem `.context/project-config.md`). Nhánh `main` là `forbidden_branch` — không push trực tiếp.

## Liên kết

- GitHub Rulesets API: https://docs.github.com/en/rest/repos/rules
- GitHub Rulesets UI: Settings → Rules → Rulesets (trên repository)

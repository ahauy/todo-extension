# Web CI/CD Flow

> Mục tiêu: code xong là có quality gate tự động, preview build để review, và production build có kiểm soát.

## 1. Local development

Dùng trên máy dev để test nhanh:

```bash
npm run dev
# hoặc pnpm dev
```

Local dev vẫn là nơi để debug UI, browser flow, hot reload, và chạy MCP/browser automation.

## 2. GitHub Actions quality gate

Workflow: `.github/workflows/ci.yml`

Trigger:
- pull request vào `main` hoặc `develop`
- push lên `main` hoặc `develop`

Checks mặc định:
- install dependencies
- lint
- typecheck
- unit tests
- integration tests
- build

Workflow cố tình skip script nào chưa tồn tại trong `package.json` thay vì fail giả.

## 3. Preview build

Workflow: `.github/workflows/preview-build.yml`

Mục đích:
- build artifact preview trên GitHub Actions
- attach artifact để review/debug CI output
- dùng làm bước giữa trước khi gắn deploy provider thật

Trigger:
- push lên `develop`
- hoặc chạy tay bằng `workflow_dispatch`

Artifact paths mặc định:
- `.next`
- `dist`
- `build`
- `out`

## 4. Production build

Workflow: `.github/workflows/production-build.yml`

Mục đích:
- build production artifact có kiểm soát
- chuẩn bị handoff cho provider deploy thật
- có thể gắn approval qua GitHub Environment `production`

Trigger:
- chạy tay (`workflow_dispatch`)

## 5. Khi nào mới gọi là “CD thật”

Template này đang ở mức **provider-agnostic**.

Nó có CI hoàn chỉnh và build handoff rõ ràng, nhưng bước deploy cuối cùng còn phụ thuộc hosting thật:
- Vercel
- Netlify
- Cloudflare Pages
- VPS / Docker / custom infra

Khi project chốt hosting, thêm 1 job/provider workflow riêng thay vì hard-code từ template.

## 6. Flow em recommend

- Dev local → `dev` + browser automation test
- Push PR → CI quality gate
- Push/Merge `develop` → preview build artifact
- Review QA/product
- Manual production build → provider-specific deploy

## 7. Rule of thumb cho agent

- CI = lint/type/test/build
- preview build = review artifact
- production build = release candidate
- deploy thật chỉ bật sau khi spec/runtime hosting đã chốt

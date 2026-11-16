# docs/ — Index — Todo Extension

> Phân loại **canonical** (source of truth, dùng để validate) vs **derived/historical** (tham khảo).
> Project là Chrome Extension MV3 **client-only, không backend, không DB quan hệ** — docs phản ánh
> đúng thực tế đó (không dùng template REST/SQL chung chung).

## Canonical (source of truth)

| File | Loại | Nội dung | Nguồn sự thật |
|------|------|----------|---------------|
| [`BRD.md`](BRD.md) | business_requirements | Yêu cầu nghiệp vụ (intent) | `BRIEF.md` + `SPECIFICATIONS.md` |
| [`DESIGN.md`](DESIGN.md) | design_spec | Design system + screen inventory | `styles/tokens.css` + `entrypoints/*/style.css` (as-built) · frontmatter `DESIGN.md` (intent tokens). `.context/design-spec.md` là **legacy** (cobalt/cool-gray, 360×600, theme toggle) — không dùng làm nguồn |
| [`API_SPEC.md`](API_SPEC.md) | api_spec | **Không REST** — contract `chrome.storage.sync` + Chrome APIs + internal modules | `lib/*`, `entrypoints/background.ts`, `hooks/useTasks.ts` |
| [`ERD.md`](ERD.md) | data_model | **Không SQL** — data model `chrome.storage.sync` (Task/Subtask/Settings) | `lib/tasks/types.ts` |
| [`PERMISSION.md`](PERMISSION.md) | permissions_privacy | Quyền Chrome extension + data handling (cho Web Store) | `wxt.config.ts` + code |
| [`USER_FLOW.md`](USER_FLOW.md) | user_flow | Các luồng người dùng chính (mục tiêu) | `SPECIFICATIONS.md` + `DESIGN.md` |
| `generated/` | generated | Sinh tự động bằng `check_commands.docs_inventory` — **không sửa tay**. ⚠️ Bản hiện tại **stale** (git `0e2a674`, 0 file) do `docs_inventory` trong `.context/project-config.md` đang `null` — cần cấu hình tooling rồi sinh lại | tooling |

## Proposal / Roadmap (chưa duyệt — không phải intent hay as-built)

| File | Nội dung | Trạng thái |
|------|----------|-----------|
| [`ROADMAP_TIME_MANAGEMENT.md`](ROADMAP_TIME_MANAGEMENT.md) | Đề xuất nâng cấp quản lý thời gian: 6 gói (nền tảng thời gian, then chốt/con ếch, 6P kế hoạch tối, đơn nhiệm, thói quen 21 ngày, time blocking) + thứ tự triển khai | `proposal` — chờ duyệt qua `/change` |

## Historical / tham khảo

| File | Ghi chú |
|------|---------|
| `diagrams/` | Diagram minh họa (archify) — verify với code trước khi tin |
| `specs/` | Design doc brainstorm (`2026-11-10-todo-extension-design.md`) |
| `SPEC_VERSIONING.md` | Quy tắc versioning spec |
| `smoke-tests/` | Template smoke test (tham khảo) |

## Quy tắc

- **As-built** (`API_SPEC`, `ERD`, `DESIGN` current-state, `PERMISSION`): reconcile khi code đổi, kèm evidence `file:line`. Code thắng doc.
- **Intent** (`BRD`, yêu cầu trong `SPECIFICATIONS.md`, `USER_FLOW` mục tiêu): chỉ đổi qua `/change` + user duyệt. Không hạ cấp intent cho khớp code.
- **Gap code↔intent**: ghi ở [`API_SPEC.md`](API_SPEC.md) §5 (gap register), không tự sửa intent.
- **Proposal docs** (`ROADMAP_*`): chỉ là đề xuất, không phải nguồn sự thật. Khi user duyệt → đi qua `/change` → spec delta + `/spec-publish` → code; lúc đó mới reconcile docs liên quan.
- Không nhúng code/schema tay vào docs canonical → dùng pointer + `docs/generated/`.
- Mọi thay đổi code/config/docs → commit-first tracking là source of truth.

## Không có docs?

Để trống/điền tối thiểu — `/spec-init` sẽ dựng spec từ code.

# docs/ — Index — Todo Extension

> Phân loại **canonical** (source of truth, dùng để validate) vs **derived/historical** (tham khảo).
> Project là Chrome Extension MV3 **client-only, không backend, không DB quan hệ** — docs phản ánh
> đúng thực tế đó (không dùng template REST/SQL chung chung).

## Canonical (source of truth)

| File | Loại | Nội dung | Nguồn sự thật |
|------|------|----------|---------------|
| [`BRD.md`](BRD.md) | business_requirements | Yêu cầu nghiệp vụ (intent) | `BRIEF.md` + `SPECIFICATIONS.md` |
| [`DESIGN.md`](DESIGN.md) | design_spec | Design system + screen inventory | `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md` |
| [`API_SPEC.md`](API_SPEC.md) | api_spec | **Không REST** — contract `chrome.storage.sync` + Chrome APIs + internal modules | `lib/*`, `entrypoints/background.ts`, `hooks/useTasks.ts` |
| [`ERD.md`](ERD.md) | data_model | **Không SQL** — data model `chrome.storage.sync` (Task/Subtask/Settings) | `lib/tasks/types.ts` |
| [`PERMISSION.md`](PERMISSION.md) | permissions_privacy | Quyền Chrome extension + data handling (cho Web Store) | `wxt.config.ts` + code |
| [`USER_FLOW.md`](USER_FLOW.md) | user_flow | Các luồng người dùng chính | `SPECIFICATIONS.md` + design-spec §8 |
| `generated/` | generated | Sinh tự động bằng `check_commands.docs_inventory` — **không sửa tay** | tooling |

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
- **Gap code↔intent**: ghi ở [`API_SPEC.md`](API_SPEC.md) §5 (gap register G1–G5), không tự sửa intent.
- Không nhúng code/schema tay vào docs canonical → dùng pointer + `docs/generated/`.
- Mọi thay đổi code/config/docs → commit-first tracking là source of truth.

## Không có docs?

Để trống/điền tối thiểu — `/spec-init` sẽ dựng spec từ code.

# Spec & Test-Scope Versioning (convention)

> Chuẩn để **spec** và **test-scope** có version — code và test cùng biết đang bám bản spec nào, test biết "cần test đến đâu".

## Cấu trúc thư mục

```
SPECIFICATIONS.md            ← spec CANONICAL (live) — có frontmatter version
spec/
├── CHANGELOG.md             ← lịch sử version spec (1 dòng / lần đổi)
├── updates/                 ← 1 file / lần update (spec delta)
│   └── YYYY-MM-DD-<slug>.md
├── archive/                 ← bản spec đóng băng theo mốc release
│   └── SPECIFICATIONS-<version>.md
├── coverage.json            ← BẢNG ĐỘ PHỦ: req nào đã/chưa test (DEV set, TEST đọc)
└── test-scope/              ← hợp đồng bàn giao cho template TEST
    ├── current.json         ← scope mới nhất (kèm specVersion)
    └── archive/
        └── test-scope-<specVersion>-<scopeVersion>.json
```

> Root `SPECIFICATIONS.md` vẫn là nguồn sự thật (canonical) — `spec/` là "nhà quản lý" (version, lịch sử, delta, scope). Không đổi đường dẫn canonical để mọi template đang trỏ tới vẫn hoạt động.

## Version scheme (semver)

| Loại | Khi nào | Ví dụ |
|---|---|---|
| **MAJOR** | Breaking — xoá requirement / đổi ngữ nghĩa requirement | 1.4.0 → 2.0.0 |
| **MINOR** | Thêm requirement / feature mới | 1.4.0 → 1.5.0 |
| **PATCH** | Sửa wording, làm rõ, không đổi behavior | 1.4.0 → 1.4.1 |

**Frontmatter của `SPECIFICATIONS.md`:**
```yaml
---
spec_version: 1.2.0
updated_at: 2026-10-05
---
```

## Quy trình update spec (khi có thay đổi)

1. Sửa `SPECIFICATIONS.md` → **bump `spec_version`** theo MAJOR/MINOR/PATCH
2. Ghi delta vào `spec/updates/YYYY-MM-DD-<slug>.md`:
   - Thêm/sửa/xoá requirement nào (R-xx), lý do, ảnh hưởng
3. Thêm 1 dòng vào `spec/CHANGELOG.md`
4. (Mốc release) copy `SPECIFICATIONS.md` → `spec/archive/SPECIFICATIONS-<version>.md`
5. Sinh/cập nhật `spec/test-scope/current.json` với `specVersion` mới

## Test-scope (versioned)

`spec/test-scope/current.json`:
```jsonc
{
  "specVersion": "1.2.0",        // scope này bám spec version nào
  "scopeVersion": 3,             // lần sinh thứ mấy (tăng mỗi lần)
  "generatedAt": "2026-10-05T13:39:00+07:00",
  "trigger": "bug-fix | feature-update | initial-build",
  "workItem": "bug-login-timeout",
  "specRefs": ["R-01", "R-05"],
  "changed": { "files": [...], "modules": ["auth"] },
  "impact": { "direct": [...], "dependents": [...], "regression": [...] },
  "acceptance": [...],
  "risk": "low | medium | high"
}
```

## Test biết "cần test đến đâu" — 2 lớp

### Lớp 1 — version (đã cover đến version nào)

Template TEST ghi `.context/test-status.json`:
```jsonc
{
  "specVersionCovered": "1.2.0",     // spec version đã cover đến
  "scopeVersionCovered": 3,
  "lastRun": "2026-10-05T14:00:00+07:00",
  "pendingSpecVersion": null          // current spec > covered → cần test bổ sung
}
```

**Quy tắc:** nếu `SPECIFICATIONS.md` (current version) **lớn hơn** `specVersionCovered` → test còn phần mới chưa cover → chạy luồng bổ sung.

### Lớp 2 — coverage board (từng req đã/chưa test) 🎯

`spec/coverage.json` (DEV set trạng thái, TEST đọc):
```jsonc
{
  "specVersion": "1.5.0",
  "scopeVersion": 4,
  "updatedAt": "2026-10-05T14:00:00+07:00",
  "requirements": [
    { "id": "R-01", "title": "đăng ký tài khoản", "status": "covered",
      "specVersionAdded": "1.0.0", "testRef": "tests/auth.test.ts",
      "lastRunAt": "2026-10-05T14:05:00+07:00", "notes": "" }
  ]
}
```

| Status | Nghĩa | Ai set |
|---|---|---|
| `untested` | Chưa có test | DEV (khi thêm req) |
| `pending` | Req mới/đổi, chờ test | **DEV** (khi sinh test-scope) |
| `covered` | Đã test, pass | TEST báo → DEV ghi |
| `failing` | Test fail | TEST báo → DEV ghi |
| `n/a` | Không cần test | DEV + lý do |

**Test đọc board:** req nào `pending`/`untested` → cần test; `covered` → bỏ qua.
**Test báo về:** `.context/coverage-report.json` (status mới + testRef + lastRunAt) → DEV cập nhật board.

## Ai ghi gì

| File | Ai ghi | Khi nào |
|---|---|---|
| `SPECIFICATIONS.md` (version) | DEV (brainstorm/spec-validator) | mỗi lần đổi spec |
| `spec/updates/*` + `CHANGELOG` | DEV | mỗi lần đổi spec |
| `spec/test-scope/current.json` | **DEV** | sau mỗi bug-fix / feature-update |
| `spec/coverage.json` | **DEV** (set `pending`) · cập nhật `covered` theo report của TEST | khi thêm/đổi req + sau report |
| `.context/test-status.json` | **TEST** | sau mỗi lần chạy test |
| `.context/coverage-report.json` | **TEST** | sau mỗi lần test (báo độ phủ về DEV) |
---
id: bug-e2e-progress-motion
type: bug
status: done
closed: 2026-11-18
created: 2026-11-18
---

# E2E release: thanh tiến độ animate `width` vi phạm R-19 (motion)

## Yêu cầu
Sửa để thanh tiến độ mực (`.progress-ink > span`) chỉ animate `transform`, đúng R-19
("motion chỉ transform/opacity, không animate width/height/top/left"), **không đổi** hình dáng
hay ngữ nghĩa fill 0–100%.

## Bối cảnh / tái hiện (bug)
- Màn/route: SettingsPanel (popup, dung lượng đồng bộ) + TaskScroll (tiến độ subtask).
- Phát hiện lúc: chạy E2E release checklist 2026-11-18 16:58 (agent-browser, extension unpacked).
- Root cause (có evidence): `styles/signature.css:383` (HEAD) `.progress-ink > span { transition: width … }`;
  2 caller truyền inline `style={{ width: '<pct>%' }}` → animate `width`, vi phạm R-19.
  Static check `styles/*.css` bắt được; E2E report ghi rõ tại dòng 21.
- Expected: transform-only animation, fill vẫn đúng tỷ lệ ở mọi giá trị.
- Actual: fill đúng nhưng cơ chế animation sai quy ước motion của dự án.

## Acceptance
- [x] `.progress-ink > span` chuyển sang `width:100%` + `transform-origin:left center` + `transition: transform`.
- [x] Cả 2 caller đổi `width: '<pct>%'` → `transform: scaleX(<ratio>)`, ratio ∈ [0,1].
- [x] Không caller `.progress-ink` nào còn inline `width` (grep xác nhận).
- [x] Grep transition/animation `width|height|top|left` trong styles → 0 hit.
- [x] Verify 4 lệnh PASS: tsc / eslint / vitest (45 files, 367 tests) / wxt build.
- [x] Reviewer NORMAL PASS; progress + BACKLOG + spec-scope + archive cập nhật.

## Ghi chú
- Classify **BUG**, risk LOW (UI motion, không đụng data contract/API/auth); scope `UI/MOTION`.
- Bug thuần không đổi requirement → **không** bump `spec_version` (giữ 1.7.0), nhưng vẫn sinh
  `spec/test-scope/current.json` scopeVersion 33 (`trigger: bug-fix`) cho template test.
- E2E evidence: `.context/review-reports/e2e-release-2026-11-18.md` (30/31 mục; 1 mục toolbar
  icon cần nhìn bằng mắt trong Chrome có giao diện — không chặn code).

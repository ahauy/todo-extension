# Spec Update — 2026-11-23 eisenhower-priority-matrix

**spec_version:** 1.9.0 → 2.0.0 (**MAJOR** — đổi ngữ nghĩa R-05, xoá hệ 3 mức)
**Trigger:** feature-update · **Change:** FEAT-006 (`spec/changes/2026-11-23-eisenhower-priority-matrix.md`)
**Quyết định user chốt 2026-11-23:** ánh xạ `high→Q1 · medium→Q2 · low→Q4` · giữ A/B/C với
`A=Q1 · B=Q2 · C=Q4` · nút "Sắp xếp công việc" ở New Tab cạnh `FilterRow` · sort `Q1→Q2→Q3→Q4`.

## Requirements

- **SỬA R-05 (breaking)** — thay `priority ∈ {low,medium,high}` bằng 4 giá trị ma trận Eisenhower
  `important-urgent | important-not-urgent | not-important-urgent | not-important-not-urgent`
  (Q1–Q4, nhãn tiếng Việt đúng theo yêu cầu). Default mới `important-not-urgent` (Q2).
  Quy định ánh xạ đọc dữ liệu cũ: `high→Q1`, `medium→Q2`, `low→Q4`, giá trị lạ→Q2; **không**
  storage migration/ghi lại, Q3 chỉ có khi user chọn mới. Background notification (R-12)
  ưu tiên hoá `important-urgent`.
- **SỬA R-01** — default task mới = `important-not-urgent` (Q2).
- **SỬA R-21** — "Việc then chốt" bật → `priority='important-urgent'` (Q1); nhãn A/B/C ánh xạ
  `A=Q1 · B=Q2 · C=Q4`; tắt không tự hạ; vẫn ≤3 việc mở, chỉ cảnh báo.
- **SỬA R-15** — sort priority theo `Q1→Q2→Q3→Q4` (thay `high→low`).
- **THÊM R-26** — New Tab: nút "Sắp xếp công việc" cạnh `FilterRow` mở panel 4 ô (Q1–Q4) với
  kéo-thả phân loại: 1 `put(task)` copy-then-patch, drop-target highlight + cập nhật optimistic,
  rollback + inline error khi quota, lối bàn phím + focus trap + Esc, vô hiệu trong focus mode,
  motion tuân `prefers-reduced-motion`, panel local state. Popup 360×560 không thêm khối UI.

## Ảnh hưởng

- Data: đổi miền giá trị `Task.priority` (cùng key `t:<id>`, không key storage/permission/network mới — R-17).
  Đọc hydrate qua `normalize` ánh xạ giá trị cũ; không ghi đè dữ liệu cũ, không bulk backfill.
- UI: `Segmented` 4 lựa chọn thay 3 ở `TaskFields` (dùng cho Composer/popup/TaskParchment),
  `PriorityBadge` 4 nhãn/màu, board panel mới trên New Tab.
- Logic: `priorityRank` thành 4 bậc; `background.ts` đổi conditional `high` → `important-urgent`.
- Regression: R-09/R-11/R-15 (sort/overdue/alarm), R-19 (responsive/motion), R-20 (focus),
  R-21 (then chốt/ếch/archive), R-22 (plannedFor), R-23 (habit), R-24/R-25 (timeline).
- Docs as-built cần reconcile: `docs/ERD.md`, `docs/API_SPEC.md`, `docs/USER_FLOW.md`,
  `docs/DESIGN.md`, `docs/ROADMAP_TIME_MANAGEMENT.md` (A/B/C), `docs/BRD.md` (intent — chỉ cập nhật
  qua change request đã duyệt).

---
id: son-mai-experience-polish
type: feature
status: done
created: 2026-11-12
---

# Nâng tầm trải nghiệm Sơn Mài Học Đường: responsive, menu popup, motion và đồng bộ tài liệu

## Yêu cầu

User duyệt các đề xuất từ UI review và muốn giao diện tạo cảm giác “ohhh” hơn cho người dùng khó tính, nhưng vẫn giữ Học Đường là một công cụ ghi việc nhanh, không phải trang marketing hay hiệu ứng phô trương.

Phạm vi đã đồng ý:

1. Đồng bộ tài liệu as-built với giao diện và data model đang chạy.
2. Cải thiện điểm gãy New Tab ở khoảng 1024–1199px để cột việc không bị hẹp khi còn ba cột.
3. Cải thiện bộ chọn môn học trong popup để danh sách dài không che gần hết nội dung hoặc chân popup.
4. Làm chỉ dấu tab cuộn trên màn hẹp rõ hơn.
5. Nâng độ nổi bật cảm nhận qua micro-interaction có chủ đích: phản hồi cho thao tác hoàn thành, chuyển trạng thái/lọc và milestone chuỗi học.
6. Giữ ngôn ngữ Sơn Mài Học Đường, thao tác nhanh, hiệu năng popup, keyboard/a11y và `prefers-reduced-motion`.

## Acceptance (bắt buộc)

- [ ] `docs/BRD.md`, `docs/USER_FLOW.md`, `docs/ERD.md`, `docs/API_SPEC.md` và `docs/DESIGN.md` không còn mô tả sai các surface, chế độ hiển thị, storage entities/keys hoặc settings hiện có; intent doc chỉ đổi trong phạm vi user đã duyệt.
- [ ] New Tab không giữ bố cục ba cột khi cột nhiệm vụ quá hẹp; ở breakpoint mới, nội dung nhiệm vụ vẫn dễ quét và không có tràn ngang.
- [ ] Chọn môn trong popup vẫn truy cập được bằng chuột và bàn phím, danh sách dài không che chân popup hay làm người dùng mất ngữ cảnh; có trạng thái focus/đóng rõ ràng.
- [ ] Khi ribbon tab bị khuất trên màn hẹp, người dùng nhìn thấy rõ còn nội dung có thể cuộn; tab vẫn truy cập đầy đủ bằng bàn phím.
- [ ] Motion mới chỉ phản hồi cho hành động hoặc thay đổi trạng thái thực (không autoplay/trang trí liên tục), nhất quán với token motion hiện có và tắt/giảm khi `prefers-reduced-motion`.
- [ ] Hiệu ứng hoàn thành, lọc/chuyển trạng thái và milestone tạo phản hồi thị giác rõ hơn nhưng không làm giảm khả năng đọc task, deadline, subject hay priority.
- [ ] Popup/New Tab được kiểm chứng ở 360px, 390px, breakpoint chuyển layout, 1024px và desktop; không hồi quy focus, reduced-motion, build, typecheck, lint và test.

## Ghi chú

- Classification: MODIFY · Bounded Task / Tier 2. Không đổi entity, quyền hay storage contract dự kiến.
- Hướng thiết kế: “wow” bằng khoảnh khắc có ngữ nghĩa (mực thấm, triện đóng, vệt sơn phản hồi, sen sáng theo milestone), không thêm gradient/glassmorphism hoặc animation vô cớ.
- Dark mode không nằm trong scope hiện tại. Nếu được chọn sau này, phải là palette giấy đêm/sơn mài tối được thiết kế riêng, không đảo màu tự động.
- UI review evidence: `.impeccable/review/popup-subject-menu.png`, `.impeccable/review/density-after3-board1024.png`, `.impeccable/review/before/mobile.png`.

## Kết quả (2026-11-17) — đóng feature

Hoàn thành 4 phase, mỗi phase reviewer STRICT PASS round 1:

| Phase | Nội dung | Commit | Review |
|---|---|---|---|
| 1 | Reconcile as-built docs ↔ code (BRD/USER_FLOW/ERD/API_SPEC/DESIGN) | `f90a698` | STRICT PASS + Spec Validator PASS |
| 2 | Responsive New Tab 1024–1199, ribbon keyboard 390px, subject menu bounded | `44a4be3` | STRICT PASS |
| 3 | Micro-interaction trạng thái (triện, filter/menu, sen sáng theo milestone) | `7a1c2f7` | STRICT PASS |
| 4 | Reconcile motion tokens + Known Gaps R-19 | `e89e92b` | Spec Validator PASS (`.context/review-reports/feature-son-mai-experience-polish-phase-4-task-01-spec-validation.md`) |

Close-out bổ sung 2026-11-17 (sau Spec Validator phase-4):

- Dọn **defect trùng selector**: `.streak-lotus[data-lit-just='true']` được khai 2 lần với 2 keyframe khác
  nhau (`lotus-lit` ở `styles/signature.css`, `lotus-light` ở `styles/board.css`; board.css import sau nên
  `lotus-lit` là dead code). Bỏ bản trong `signature.css`, giữ `lotus-light` (`scale 0.85→1`) đúng
  `docs/DESIGN.md` §Motion.
- `docs/DESIGN.md`: bỏ tên component không tồn tại `streak-lotus-lit` → `streak-lotus` + state
  `data-lit` / `data-today` / `data-lit-just`.
- Verify sau sửa: `tsc --noEmit` PASS · `eslint .` PASS · `vitest run` 24 file/136 test PASS ·
  `wxt build` PASS 620.53 kB.

**Residual risk (ghi rõ, không claim quá):**

- R-19 sub-gaps còn mở theo `docs/DESIGN.md` §Known Gaps: 1024–1199px vẫn dùng 2 cột (không phải 3 vùng),
  `.menu` không tự lật lên khi thiếu chỗ, chưa đo lại 360/390/1024 trên Chrome thật trong lần close-out này.
- Chưa bật `prefers-reduced-motion` trong Chrome thật để xác nhận tắt hẳn; đã kiểm bằng CSS + test.
- Kiểm chứng 1024–1199 dựa trên audit artifacts cũ, không phải đo mới.


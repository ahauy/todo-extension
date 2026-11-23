---
id: eisenhower-priority-matrix
type: feature
status: done
created: 2026-11-23
closed: 2026-11-23
---

# Ma trận Eisenhower 4 mức ưu tiên + bảng "Sắp xếp công việc" kéo-thả

## Yêu cầu

Nguồn: user chat 2026-11-23 (maintenance mode, auto-intake).

1. **Thay thế** hệ thống mức độ ưu tiên hiện tại (`thấp` / `vừa` / `cao`) bằng 4 mức mới theo
   ma trận Eisenhower, dùng đúng nhãn:
   - `Quan trọng, cấp bách`
   - `Quan trọng, không cấp bách`
   - `Không quan trọng, cấp bách`
   - `Không quan trọng, không cấp bách`
2. **Cập nhật tất cả nơi hiển thị và chọn mức ưu tiên** sang danh sách 4 mức mới (popup, New Tab,
   thẻ việc, form thêm/sửa và mọi nơi khác có trong code).
3. Ngoài popup, **thêm nút "Sắp xếp công việc"**. Khi nhấn, hiển thị bảng gồm 4 ô tương ứng với
   4 mức độ mới, hỗ trợ **kéo thả công việc vào từng ô** để phân loại theo mức độ.
4. Giao diện kéo-thả trực quan, **phản hồi tức thời** khi di chuyển công việc giữa các ô.

## Bối cảnh / tái hiện (bug)

Không áp dụng — đây là feature (thay thế + bổ sung), không phải bug.

## Acceptance (bắt buộc)

- [ ] Không còn mức ưu tiên `thấp / vừa / cao`; 4 mức Eisenhower dùng nhãn đúng như yêu cầu.
- [ ] Mọi chỗ hiển thị/chọn ưu tiên trong popup và New Tab dùng danh sách 4 mức mới.
- [ ] Có nút "Sắp xếp công việc" ngoài popup; nhấn vào mở bảng 4 ô, mỗi ô ứng với 1 mức.
- [ ] Kéo-thả công việc vào ô bất kỳ → việc được gán mức tương ứng và hiện đúng trong ô đó.
- [ ] Khi kéo qua / thả vào ô có phản hồi thị giác tức thời (ô đích nổi bật, thẻ cập nhật ngay),
      không cần reload.
- [ ] Việc cũ không mất dữ liệu; cách ánh xạ 3 mức cũ → 4 mức mới được change-request làm rõ
      trước khi code.
- [ ] `tsc` / `eslint` / `vitest` / build PASS theo lệnh trong `.context/project-config.md`.

## Ghi chú

- Cần spec delta (đổi business rule của `priority`) → bump `spec_version`, ghi `spec/updates/` +
  `spec/CHANGELOG.md`, sinh lại `spec/test-scope/current.json`.
- Reviewer đề xuất `STRICT`: đụng shared type `priority`, dữ liệu đã lưu và luồng kéo-thả mới.
- Change-request cần làm rõ ở bước classify: ánh xạ dữ liệu cũ, vị trí cụ thể của nút
  (popup hay New Tab — user ghi "ngoài popup"), lối bàn phím thay kéo-thả, và có giữ nhãn
  A/B/C của "việc then chốt" (trước đây gán `priority='high'`) hay không.
- Tham chiếu trước đó: `2026-11-17-keystone-frog.md` (giữ 3 mức + nhãn A/B/C),
  `2026-11-16-time-management-upgrade.md` (ABCDE giữ 3 mức ưu tiên).

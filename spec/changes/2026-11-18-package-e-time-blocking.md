---
id: package-e-time-blocking
type: feature
status: pending
parent: FEAT-003
created: 2026-11-18
---

# Gói E — Time Blocking (timeline + kéo-thả) trên New Tab

## Yêu cầu

Biến danh sách việc thành **thời khoá biểu trong ngày** trên New Tab: mỗi việc đã có
`plannedFor` có thể gán **giờ bắt đầu** (`startAt`) và **độ dài dự kiến** (`estimateMin`);
New Tab hiển thị timeline dọc và cho **kéo block** để đổi giờ.

Phạm vi user đã chốt 2026-11-18 (hỏi–đáp trước khi mở change):

| Quyết định | Lựa chọn |
|---|---|
| Phạm vi | **Bản đầy đủ** — timeline + kéo-thả (không phải bản nhẹ trong roadmap §4) |
| Dữ liệu | `startAt` = `"HH:mm"` wall-clock local + `estimateMin?` (số phút) |
| Hiển thị | **New Tab only** — popup 360×560 giữ nguyên, không thêm khối UI |
| Khung giờ | **06:00–24:00**, bước kéo **15 phút** |
| Độ dài block | `estimateMin` mặc định **30** khi trống, sửa được **15–240** |
| Chồng lấn | Kéo đổi giờ; chồng lấn **chỉ cảnh báo**, vẫn lưu, **không tự sửa** dữ liệu user |

## Bối cảnh

- Nguồn: `docs/ROADMAP_TIME_MANAGEMENT.md` §4 Gói E + §6 thứ tự ưu tiên (E sau cùng, risk **Cao**,
  đề xuất STRICT), umbrella `spec/changes/2026-11-16-time-management-upgrade.md`.
- Phụ thuộc: Gói 0 (wall-clock local), Gói B (`plannedFor` + sheet "Kế hoạch mai") đã done.
  **Cảnh báo của roadmap:** E được khuyến nghị hoãn "đến khi B có dữ liệu dùng thật" — user chọn làm
  ngay, nên rủi ro sản phẩm (giá trị chưa kiểm chứng) được ghi nhận ở residual risk, không chặn.
- Hiện trạng code: `Task.plannedFor?: string | null` có sẵn (`lib/tasks/types.ts:86`);
  **chưa có** `startAt` / `estimateMin` (grep 0 hit). Chưa có timeline/kéo-thả trong New Tab.

## Ràng buộc (không được phá)

- Không thêm permission manifest, không network request (R-17): vẫn `storage`, `alarms`, `notifications`.
- Không tạo key storage mới: `startAt`/`estimateMin` nhúng trong `t:<id>`.
- `plannedFor` (ngày dự định) và `dueAt` (hạn chót) **giữ nguyên nghĩa** — `startAt` chỉ là giờ trong ngày.
- Không đổi semantics R-11 (cuộn hạn/alarm), R-20 (focus), R-21 (frog/archive), R-22 (plannedFor/planReminder),
  R-23 (habit). Không đụng popup 360×560 (R-19).
- A11y: kéo-thả **không phải** lối duy nhất — phải có cách đổi giờ bằng bàn phím/ô nhập.

## Acceptance (bắt buộc)

- [ ] `Task` có `startAt?: "HH:mm"` (local wall-clock, validate 00:00–23:59) + `estimateMin?: number`
      (15–240, mặc định 30 khi `startAt` có mà `estimateMin` trống); task cũ thiếu field vẫn load.
- [ ] New Tab timeline 06:00–24:00: việc có `startAt` hiện đúng thứ tự giờ, block cao theo
      `estimateMin`; việc **không** có giờ nằm cuối (không mất việc nào); việc `startAt` ngoài khung
      hiện ở nhóm cuối với nhãn giờ.
- [ ] Kéo block đổi `startAt` snap 15′ → chỉ đổi `startAt` (không đổi `plannedFor`/`dueAt`/alarm);
      thao tác tương đương bằng bàn phím/ô nhập tồn tại và có test.
- [ ] Chồng lấn thời gian: có cảnh báo trực quan trên block liên quan, **vẫn lưu được**,
      **không** tự sửa/xoá dữ liệu người dùng.
- [ ] Biên: `estimateMin` không có `startAt` → không vẽ block, giữ dữ liệu; block vượt 24:00 → cắt hiển
      thị tại 24:00 + nhãn "vượt khung"; kéo từ nhóm cuối vào khung → snap 15′ + clamp 06:00–24:00;
      `estimateMin` ngoài 15–240 trong dữ liệu cũ → kẹp chiều cao, không tự ghi đè.
- [ ] Popup 360×560 không thêm khối UI mới; `prefers-reduced-motion: reduce` không chạy animation kéo.
- [ ] Không tăng permission/key storage/network; không regression R-11/R-19/R-20/R-21/R-22/R-23.
- [ ] Verify `tsc` / `eslint` / `vitest` / `wxt build` PASS + eyeball 360/1024/1280 có evidence.

## Ghi chú

- Cần spec R mới (đề xuất R-24) + spec delta + bump `spec_version` 1.6.0 → 1.7.0, `scopeVersion` +1.
- Risk cao nhất trong 6 gói (drag/drop + responsive + dữ liệu thời gian) → reviewer **STRICT**.
- Đề xuất chia phase: (1) data + selector/sort/overlap thuần + form nhập; (2) timeline UI + drag + a11y;
  (3) docs reconcile + spec-validator + close-out.

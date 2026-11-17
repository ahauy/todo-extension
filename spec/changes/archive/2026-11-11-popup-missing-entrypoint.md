# Change: Popup thiếu entrypoint — extension không bấm được

- **Loại:** BUG · **Class:** BUG · **Risk:** thấp (build/scaffold, không đụng logic task)
- **Trạng thái:** done (2026-11-11)

## Phát hiện

Khi trả lời câu hỏi "làm sao để dùng extension": build `wxt build` chỉ emit
`background.js` + `manifest.json` — không có `popup.html`, manifest không có
`action.default_popup`. Bấm icon trên toolbar sẽ không hiện gì.

## Root cause

1. `entrypoints/popup/` chỉ có `App.tsx` + `style.css` — **thiếu `index.html` + mount script**,
   WXT không nhận thư mục này làm entrypoint → App.tsx là code chết (không ai import).
2. Do popup chưa từng được build thật nên bug thứ 2 cũng ẩn theo: **`tailwindcss` không có trong
   package.json** — `@import "tailwindcss"` trong style.css fail ngay khi build popup lần đầu.
   L1-T02 ("Tailwind v4 design tokens") không hoàn chỉnh.

## Fix

- Thêm `entrypoints/popup/index.html` (360×600, mount `#root`) + `entrypoints/popup/main.tsx`
  (`createRoot(...).render(<App/>)`).
- `pnpm add -D tailwindcss@4.3.5 @tailwindcss/vite@4.3.5` + wire plugin vào `wxt.config.ts`
  (`vite: () => ({ plugins: [tailwindcss()] })`).

## Verification

- `wxt build` → emit `popup.html` (456 B) + chunk JS 261.77 kB + CSS 35.11 kB;
  manifest có `action.default_popup: "popup.html"`.
- Compiled CSS chứa tokens (`light-dark`), dark variant (`data-theme`) và utilities (`360px`,
  `font-medium`).
- `tsc --noEmit` ✓ · `eslint .` ✓ · `vitest run` 1/1 ✓ · `wxt build` ✓ (khớp 4 bước CI).

## Residual risk

- UI chưa được bấm thử trên Chrome thật (agent không bấm được UI extension) — user cần
  load unpacked và test golden path.
- Icon extension chưa có (manifest không khai `icons`) — cần trước khi đăng Web Store.
- `.output/chrome-mv3` cũ trên máy user cần rebuild/nạp lại sau fix.

## Doc impact

- `docs/DESIGN.md` current-state: bổ sung popup entrypoint + tailwind build — chưa sửa
  (ghi nhận ở đây, sửa khi reconcile kỳ tới).

# UI audit — Học Đường (todo-extension)

- Task slug: `son-mai-ui-audit`
- Classification: **AUDIT_ONLY** (user duyệt báo cáo rồi mới sửa)
- Target: toàn bộ giao diện extension (2 surface: popup 360×560 và newtab board)
- Contract thiết kế: `docs/DESIGN.md` (hệ "Sơn Mài Học Đường", 46KB, đã chốt sáng)

## Stack (tự đọc, không suy đoán)

- WXT 0.20.3 + Chrome MV3, React 19, Tailwind CSS v4 (`@tailwindcss/vite`), TS 5.7, pnpm 11.
- Tokens: `styles/tokens.css` — `:root` CSS vars + `@theme inline` (font/text/radius/spacing/shadow).
- CSS toàn cục: `styles/base.css`, `styles/components.css`, `styles/board.css`, `styles/signature.css`, `styles/fonts.css`.
- Fonts self-hosted Vietnamese subset: `public/fonts/*.woff2` (Cormorant Garamond, EB Garamond, Dancing Script).
- Build fresh: `.output/chrome-mv3/` (16:54 hôm nay) — `assets/popup-DMFj4XwC.css`, `assets/newtab-Cskr5lnl.css`, `chunks/popup-*.js`, `chunks/newtab-*.js`.
- Shim harness cho screenshot: `.context/shots/popup-shim.html`, `newtab-shim.html`, `popup-shim-empty.html` (seed chrome.storage + `window.__errors`). Asset path là **root-absolute** → phải serve `.output/chrome-mv3/` qua HTTP.
- Working tree dirty: 30 M / 15 D / 41 untracked — bản renovation Sơn mài CHƯA commit.

## Scope table (1 file = 1 owner trong pass này)

| Area | Files | Owner |
|---|---|---|
| A1 Newtab shell & board regions | `entrypoints/newtab/App.tsx`, `entrypoints/newtab/style.css`, `styles/board.css`, `components/Greeting.tsx`, `components/Proclamation.tsx`, `components/SubjectShelf.tsx`, `components/StreakCard.tsx`, `components/FocusTimer.tsx`, `components/art/Scenes.tsx` | ui-visual-reviewer |
| A3 Design-system primitives & global CSS | `styles/tokens.css`, `styles/base.css`, `styles/components.css`, `styles/signature.css`, `components/ui/Button.tsx`, `components/ui/IconButton.tsx`, `components/ui/Chips.tsx`, `components/ui/Segmented.tsx`, `components/ui/RibbonTabs.tsx`, `components/ui/Menu.tsx`, `components/ui/Toggle.tsx`, `components/ui/Checkbox.tsx`, `components/ui/Modal.tsx`, `components/ui/QuillInput.tsx`, `components/art/Ornaments.tsx`, `components/art/QuillArt.tsx`, `components/art/Icons.tsx` | ui-visual-reviewer |
| A2 Popup shell & list | `entrypoints/popup/App.tsx`, `entrypoints/popup/style.css`, `components/Header.tsx`, `components/TaskScroll.tsx`, `components/TaskScrollList.tsx`, `components/TaskParchment.tsx`, `components/EmptyState.tsx`, `components/Toast.tsx`, `components/ConfirmDialog.tsx`, `components/ErrorBoundary.tsx` | ui-a11y-responsive-reviewer |
| A4 Forms, composer, settings, shell html | `entrypoints/popup/index.html`, `entrypoints/newtab/index.html`, `components/Composer.tsx`, `components/FilterRow.tsx`, `components/TaskFields.tsx`, `components/SettingsPanel.tsx`, `components/ui/Field.tsx`, `hooks/useMediaQuery.ts` | ui-a11y-responsive-reviewer |
| Baseline evidence | `.output/chrome-mv3/**`, `.context/shots/*.html` → ghi vào `.qoder/ui-team/son-mai-ui-audit/shots/` | ui-visual-verifier |

Không ai được sửa source trong pass này. Finding vượt file của mình → gắn nhãn `OUT-OF-SCOPE` kèm `file:line`, tôi sẽ gán lại.

## Gate

Báo cáo tổng hợp cho user trước, chờ duyệt, rồi mới tới `ui-implementer`.

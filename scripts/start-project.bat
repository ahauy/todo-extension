@echo off
REM ============================================================
REM start-project.bat — Kick off a new project from this template
REM Usage: scripts\start-project.bat
REM Supports: Windows CMD
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════╗
echo ║     🚀 Opencode Project Starter          ║
echo ╚══════════════════════════════════════════╝
echo.

REM ── Step 1: Project name ──────────────────────────────────────
echo [Step 1/4] Project name
set /p PROJECT_NAME="  Tên project: "

if "!PROJECT_NAME!"=="" (
  echo ❌ Tên project không được để trống.
  exit /b 1
)

REM ── Step 2: Brain dump ───────────────────────────────────────
echo.
echo [Step 2/4] Brain dump ý tưởng
echo   Mô tả ngắn gọn về project (không cần chuẩn, cứ dump thôi):
echo   Ví dụ: App làm gì, user là ai, tính năng chính, stack muốn dùng...
echo   (Nhấn Ctrl+Z rồi Enter để xong)
echo.

setlocal enabledelayedexpansion
set "BRIEF="
:read_brief
set /p "LINE="
if not "!LINE!"=="" (
  set "BRIEF=!BRIEF!!LINE!
"
  goto read_brief
)

if "!BRIEF!"=="" (
  set "BRIEF=(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
)

REM ── Step 3: Replace placeholders ────────────────────────────
echo.
echo [Step 3/4] Đang setup files...

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set TODAY=%%c-%%a-%%b)

REM Replace [PROJECT_NAME] trong tất cả markdown
for /r . %%f in (*.md) do (
  if not "%%f"==".\.git\*" (
    powershell -Command "(Get-Content '%%f') -replace '\[PROJECT_NAME\]', '!PROJECT_NAME!' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace '\[DATE\]', '!TODAY!' | Set-Content '%%f'"
  )
)

REM Ghi brain dump vào docs/BRIEF.md
if not exist "docs" mkdir docs
(
  echo # Brain Dump — !PROJECT_NAME!
  echo.
  echo !BRIEF!
) > docs\BRIEF.md

echo   ✅ Files updated
echo   ✅ Brain dump đã ghi vào docs\BRIEF.md

REM ── Step 4: Git reinit ───────────────────────────────────────
echo.
echo [Step 4/4] Reset git history...
if exist ".git" rmdir /s /q .git
git init -b main > nul 2>&1
git add . > nul 2>&1
git commit -m "feat: init !PROJECT_NAME! project" -q > nul 2>&1
echo   ✅ Fresh git repo initialized

REM ── Done ─────────────────────────────────────────────────────
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   ✅ Project sẵn sàng!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   📁 %cd%
echo.
echo   Bước tiếp theo:
echo   1. Mở folder này trong Opencode
echo   2. Opencode đọc CLAUDE.md ^→ tự bắt đầu Phase 0
echo   3. Trả lời câu hỏi của Opencode là xong 🎯
echo.
echo   Happy building! 🎉
echo.

endlocal

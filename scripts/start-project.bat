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

REM ── Step 2: Specifications file ───────────────────────────────
echo.
echo [Step 2/4] Specifications ^& Brain dump
echo   Bạn có file mô tả chức năng không?
echo.

set /p SPEC_FILE="  Đường dẫn file (hoặc Enter để skip): "

set "SPEC_CONTENT="
if not "!SPEC_FILE!"=="" (
  if not exist "!SPEC_FILE!" (
    echo ❌ File không tồn tại: !SPEC_FILE!
    exit /b 1
  )
  for /f "delims=" %%A in ('type "!SPEC_FILE!"') do (
    set "SPEC_CONTENT=!SPEC_CONTENT!%%A
"
  )
  echo   ✅ File đã load
) else (
  echo   Không có file, sẽ nhập brain dump text
)

REM ── Step 3: Brain dump (nếu không có file) ──────────────────
if "!SPEC_CONTENT!"=="" (
  echo.
  echo   Mô tả ngắn gọn về project (không cần chuẩn, cứ dump thôi):
  echo   Ví dụ: App làm gì, user là ai, tính năng chính, stack muốn dùng...
  echo   (Nhấn Ctrl+Z rồi Enter để xong)
  echo.
  
  set "SPEC_CONTENT="
  set "EMPTY_LINES=0"
  :read_spec
  set /p "LINE="
  if not "!LINE!"=="" (
    set "SPEC_CONTENT=!SPEC_CONTENT!!LINE!
"
    set "EMPTY_LINES=0"
    goto read_spec
  ) else (
    set /a EMPTY_LINES=!EMPTY_LINES!+1
    if !EMPTY_LINES! lss 2 (
      goto read_spec
    )
  )
)

if "!SPEC_CONTENT!"=="" (
  set "SPEC_CONTENT=(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
)

REM ── Step 4: Replace placeholders ────────────────────────────
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

REM ── Copy SPECIFICATIONS.md ───────────────────────────────────
if not exist "docs" mkdir docs

if not "!SPEC_FILE!"=="" (
  if exist "!SPEC_FILE!" (
    copy "!SPEC_FILE!" "docs\SPECIFICATIONS.md" > nul
    echo   ✅ Specifications copied to docs\SPECIFICATIONS.md
  )
)

REM ── Create BRIEF.md (tóm tắt) ────────────────────────────────
(
  echo # Brain Dump — !PROJECT_NAME!
  echo.
  echo **Ngày tạo:** !TODAY!
  echo.
  echo ## Tóm tắt
  echo.
  echo !SPEC_CONTENT!
) > docs\BRIEF.md

echo   ✅ Brain dump đã ghi vào docs\BRIEF.md

REM ── Create layer-0-todo.md (Foundation) ──────────────────────
if not exist "tasks" mkdir tasks

(
  echo # Layer 0: Foundation
  echo.
  echo **Status:** In Progress
  echo.
  echo Foundation layer — không phụ thuộc vào layer khác.
  echo Các task ở đây có thể làm song parallel.
  echo.
  echo ## Tasks
  echo.
  echo - [ ] Task 1: [Mô tả]
  echo - [ ] Task 2: [Mô tả]
  echo - [ ] Task 3: [Mô tả]
  echo.
  echo ---
  echo.
  echo **Khi layer 0 xong → tạo layer-1-todo.md và bắt đầu layer 1**
  echo.
  echo ## Hướng dẫn tạo layer tiếp theo
  echo.
  echo Khi layer 0 hoàn toàn xong, tạo file `tasks/layer-1-todo.md`:
  echo.
  echo ```
  echo # Layer 1: [Tên layer]
  echo.
  echo **Status:** Waiting for Layer 0
  echo.
  echo Phụ thuộc vào Layer 0.
  echo Chỉ bắt đầu khi Layer 0 hoàn toàn xong.
  echo.
  echo ## Tasks
  echo.
  echo - [ ] Task 1: [Mô tả]
  echo - [ ] Task 2: [Mô tả]
  echo - [ ] Task 3: [Mô tả]
  echo.
  echo ---
  echo.
  echo **Khi layer 1 xong → tạo layer-2-todo.md**
  echo ```
  echo.
  echo Lặp lại cho layer 2, 3, ... tùy scope breakdown.
) > tasks\layer-0-todo.md

(
  echo # Completed Tasks
  echo.
  echo Log các task đã xong.
  echo.
  echo ## Format
  echo.
  echo ```
  echo - [x] Layer X, Task: [Mô tả] — Commit: [hash]
  echo ```
  echo.
  echo ---
  echo.
  echo (Sẽ update khi có task xong^)
) > tasks\done.md

echo   ✅ Layer-based task files created

REM ── Update CLAUDE.md/CODEX.md ────────────────────────────────
if exist "CLAUDE.md" (
  powershell -Command "^
    $content = Get-Content 'CLAUDE.md' -Raw; ^
    $contextSection = @' `n`n### 📋 Specifications`nXem \`docs/SPECIFICATIONS.md\` để chi tiết đầy đủ về chức năng, requirements, và design.`n`n### 📋 Task Structure — Dependency-Driven`nDùng **Dependency-Driven approach**:`n- \`tasks/layer-0-todo.md\` — Foundation (no dependency)`n- \`tasks/layer-1-todo.md\` — Depends on Layer 0 (tạo khi cần)`n- \`tasks/layer-2-todo.md\` — Depends on Layer 1 (tạo khi cần)`n- ... (thêm layer tùy scope)`n- \`tasks/done.md\` — Completed tasks`n`n**Quy tắc:**`n- Số layer phụ thuộc vào scope breakdown + dependency analysis`n- Các task trong cùng layer có thể làm song parallel`n- Chỉ khi layer N hoàn toàn xong → mới bắt đầu layer N+1`n- Xem \`docs/SCOPE_BREAKDOWN.md\` để chi tiết`n'@; ^
    $content = $content -replace '(## Context)', \"`$1`$contextSection\"; ^
    Set-Content 'CLAUDE.md' $content"
)

if exist "CODEX.md" (
  powershell -Command "^
    $content = Get-Content 'CODEX.md' -Raw; ^
    $contextSection = @' `n`n### 📋 Specifications`nXem \`docs/SPECIFICATIONS.md\` để chi tiết đầy đủ về chức năng, requirements, và design.`n`n### 📋 Task Structure — Dependency-Driven`nDùng **Dependency-Driven approach**:`n- \`tasks/layer-0-todo.md\` — Foundation (no dependency)`n- \`tasks/layer-1-todo.md\` — Depends on Layer 0 (tạo khi cần)`n- \`tasks/layer-2-todo.md\` — Depends on Layer 1 (tạo khi cần)`n- ... (thêm layer tùy scope)`n- \`tasks/done.md\` — Completed tasks`n`n**Quy tắc:**`n- Số layer phụ thuộc vào scope breakdown + dependency analysis`n- Các task trong cùng layer có thể làm song parallel`n- Chỉ khi layer N hoàn toàn xong → mới bắt đầu layer N+1`n- Xem \`docs/SCOPE_BREAKDOWN.md\` để chi tiết`n'@; ^
    $content = $content -replace '(## Context)', \"`$1`$contextSection\"; ^
    Set-Content 'CODEX.md' $content"
)

echo   ✅ CLAUDE.md/CODEX.md updated

REM ── Step 5: Git reinit ───────────────────────────────────────
echo.
echo [Step 4/4] Reset git history...

if exist ".git" rmdir /s /q .git > nul 2>&1
git init -b main > nul 2>&1
git add . > nul 2>&1
git commit -m "feat: init !PROJECT_NAME! project" -q > nul 2>&1
echo   ✅ Fresh git repo initialized

REM ── Step 6: Create GitHub repo (optional) ────────────────────
echo.
echo [Step 5/5] GitHub repo
set /p CREATE_GITHUB="  Tạo repo trên GitHub không? (y/n) [default: n]: "
if "!CREATE_GITHUB!"=="" set CREATE_GITHUB=n

if /i "!CREATE_GITHUB!"=="y" (
  echo   Đang tạo repo...
  
  REM Sanitize project name for GitHub
  set "GITHUB_REPO=!PROJECT_NAME!"
  set "GITHUB_REPO=!GITHUB_REPO: =-!"
  for /f "tokens=*" %%A in ('powershell -Command "[System.Text.RegularExpressions.Regex]::Replace('!GITHUB_REPO!', '[^a-zA-Z0-9-]', '')"') do set "GITHUB_REPO=%%A"
  
  gh repo create "ocanhdt12-gif/!GITHUB_REPO!" --public --description "!PROJECT_NAME!" --source=. --remote=origin --push > nul 2>&1
  
  if !ERRORLEVEL! equ 0 (
    echo   ✅ Repo created: https://github.com/ocanhdt12-gif/!GITHUB_REPO!
  ) else (
    echo   ⚠️  Không thể tạo repo trên GitHub (có thể repo đã tồn tại^)
    echo   Bạn có thể push thủ công sau:
    echo   git remote add origin git@github.com:ocanhdt12-gif/!GITHUB_REPO!.git
    echo   git push -u origin main
  )
) else (
  echo   Bỏ qua tạo GitHub repo
  echo   Bạn có thể push thủ công sau:
  echo   git remote add origin git@github.com:ocanhdt12-gif/^<repo-name^>.git
  echo   git push -u origin main
)

REM ── Done ─────────────────────────────────────────────────────
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   ✅ Project sẵn sàng!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   📁 %cd%
echo.
echo   📄 Files tạo:
echo     • docs\BRIEF.md — Tóm tắt (Opencode đọc^)
if exist "docs\SPECIFICATIONS.md" (
  echo     • docs\SPECIFICATIONS.md — Chi tiết đầy đủ
)
echo     • tasks\layer-0-todo.md — Foundation tasks
echo     • tasks\done.md — Completed tasks log
echo.
echo   📋 Dependency-Driven Approach:
echo     • Số layer phụ thuộc vào scope breakdown
echo     • Tạo layer-1-todo.md, layer-2-todo.md, ... khi cần
echo     • Xem hướng dẫn trong tasks\layer-0-todo.md
echo.
echo   Bước tiếp theo:
echo   1. Mở folder này trong Opencode
echo   2. Opencode đọc CLAUDE.md ^→ tự bắt đầu Phase 0
echo   3. Trả lời câu hỏi của Opencode là xong 🎯
echo.
echo   Happy building! 🎉
echo.

endlocal

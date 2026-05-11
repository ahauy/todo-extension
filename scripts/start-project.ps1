# ============================================================
# start-project.ps1 — Kick off a new project from this template
# Usage: .\scripts\start-project.ps1
# Supports: Windows PowerShell
# ============================================================

$BOLD = "`e[1m"
$GREEN = "`e[0;32m"
$CYAN = "`e[0;36m"
$YELLOW = "`e[0;33m"
$RESET = "`e[0m"

Write-Host ""
Write-Host "${BOLD}╔══════════════════════════════════════════╗${RESET}"
Write-Host "${BOLD}║     🚀 Opencode Project Starter          ║${RESET}"
Write-Host "${BOLD}╚══════════════════════════════════════════╝${RESET}"
Write-Host ""

# ── Step 1: Project name ──────────────────────────────────────
Write-Host "${CYAN}Step 1/4: Project name${RESET}"
$PROJECT_NAME = Read-Host "  Tên project"

if ([string]::IsNullOrWhiteSpace($PROJECT_NAME)) {
  Write-Host "❌ Tên project không được để trống."
  exit 1
}

# ── Step 2: Specifications file ───────────────────────────────
Write-Host ""
Write-Host "${CYAN}Step 2/4: Specifications & Brain dump${RESET}"
Write-Host "  ${YELLOW}Bạn có file mô tả chức năng không?${YELLOW}"
Write-Host ""

$SPEC_FILE = Read-Host "  Đường dẫn file (hoặc Enter để skip)"

$SPEC_CONTENT = ""
if (-not [string]::IsNullOrWhiteSpace($SPEC_FILE)) {
  if (-not (Test-Path $SPEC_FILE)) {
    Write-Host "❌ File không tồn tại: $SPEC_FILE"
    exit 1
  }
  $SPEC_CONTENT = Get-Content -Path $SPEC_FILE -Raw
  Write-Host "  ${GREEN}✅ File đã load${RESET}"
} else {
  Write-Host "  ${YELLOW}Không có file, sẽ nhập brain dump text${RESET}"
}

# ── Step 3: Brain dump (nếu không có file) ──────────────────
if ([string]::IsNullOrWhiteSpace($SPEC_CONTENT)) {
  Write-Host ""
  Write-Host "  ${YELLOW}Mô tả ngắn gọn về project (không cần chuẩn, cứ dump thôi):${RESET}"
  Write-Host "  ${YELLOW}Ví dụ: App làm gì, user là ai, tính năng chính, stack muốn dùng...${RESET}"
  Write-Host "  ${YELLOW}(Nhấn Enter 2 lần để xong)${RESET}"
  Write-Host ""
  
  $SPEC_CONTENT = @()
  $EMPTY_LINES = 0
  while ($true) {
    $line = Read-Host
    if ([string]::IsNullOrWhiteSpace($line)) {
      $EMPTY_LINES++
      if ($EMPTY_LINES -ge 2) {
        break
      }
    } else {
      $EMPTY_LINES = 0
    }
    $SPEC_CONTENT += $line
  }
  
  if ($SPEC_CONTENT.Count -eq 0) {
    $SPEC_CONTENT = "(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
  } else {
    $SPEC_CONTENT = $SPEC_CONTENT -join "`n"
  }
}

if ([string]::IsNullOrWhiteSpace($SPEC_CONTENT)) {
  $SPEC_CONTENT = "(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
}

# ── Step 4: Replace placeholders ────────────────────────────
Write-Host ""
Write-Host "${CYAN}Step 3/4: Đang setup files...${RESET}"

$TODAY = Get-Date -Format "yyyy-MM-dd"

# Replace [PROJECT_NAME] trong tất cả markdown
Get-ChildItem -Path . -Filter "*.md" -Recurse -Exclude ".git" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $content = $content -replace '\[PROJECT_NAME\]', $PROJECT_NAME
  $content = $content -replace '\[DATE\]', $TODAY
  Set-Content $_.FullName $content
}

# ── Copy SPECIFICATIONS.md ───────────────────────────────────
if (-not (Test-Path "docs")) {
  New-Item -ItemType Directory -Path "docs" | Out-Null
}

if (-not [string]::IsNullOrWhiteSpace($SPEC_FILE) -and (Test-Path $SPEC_FILE)) {
  Copy-Item -Path $SPEC_FILE -Destination "docs/SPECIFICATIONS.md"
  Write-Host "  ${GREEN}✅ Specifications copied to docs/SPECIFICATIONS.md${RESET}"
}

# ── Create BRIEF.md (tóm tắt) ────────────────────────────────
$BRIEF_LINES = ($SPEC_CONTENT -split "`n" | Select-Object -First 50) -join "`n"
$TOTAL_LINES = ($SPEC_CONTENT -split "`n").Count

$briefContent = @"
# Brain Dump — $PROJECT_NAME

**Ngày tạo:** $TODAY

## Tóm tắt

$BRIEF_LINES
"@

if ($TOTAL_LINES -gt 50) {
  $briefContent += @"

---

**📌 Lưu ý:** Đây là tóm tắt (50 dòng đầu). Chi tiết đầy đủ xem **\`docs/SPECIFICATIONS.md\`**
"@
}

Set-Content -Path "docs/BRIEF.md" -Value $briefContent
Write-Host "  ${GREEN}✅ Brain dump đã ghi vào docs/BRIEF.md${RESET}"

# ── Create layer-0-todo.md (Foundation) ──────────────────────
if (-not (Test-Path "tasks")) {
  New-Item -ItemType Directory -Path "tasks" | Out-Null
}

$layer0Content = @"
# Layer 0: Foundation

**Status:** In Progress

Foundation layer — không phụ thuộc vào layer khác.
Các task ở đây có thể làm song song.

## Tasks

- [ ] Task 1: [Mô tả]
- [ ] Task 2: [Mô tả]
- [ ] Task 3: [Mô tả]

---

**Khi layer 0 xong → tạo layer-1-todo.md và bắt đầu layer 1**

## Hướng dẫn tạo layer tiếp theo

Khi layer 0 hoàn toàn xong, tạo file `tasks/layer-1-todo.md`:

``````
# Layer 1: [Tên layer]

**Status:** Waiting for Layer 0

Phụ thuộc vào Layer 0.
Chỉ bắt đầu khi Layer 0 hoàn toàn xong.

## Tasks

- [ ] Task 1: [Mô tả]
- [ ] Task 2: [Mô tả]
- [ ] Task 3: [Mô tả]

---

**Khi layer 1 xong → tạo layer-2-todo.md**
``````

Lặp lại cho layer 2, 3, ... tùy scope breakdown.
"@

Set-Content -Path "tasks/layer-0-todo.md" -Value $layer0Content

$doneContent = @"
# Completed Tasks

Log các task đã xong.

## Format

``````
- [x] Layer X, Task: [Mô tả] — Commit: [hash]
``````

---

(Sẽ update khi có task xong)
"@

Set-Content -Path "tasks/done.md" -Value $doneContent
Write-Host "  ${GREEN}✅ Layer-based task files created${RESET}"

# ── Update CLAUDE.md/CODEX.md ────────────────────────────────
if (Test-Path "CLAUDE.md") {
  $claudeContent = Get-Content "CLAUDE.md" -Raw
  $contextSection = @"

### 📋 Specifications
Xem `docs/SPECIFICATIONS.md` để chi tiết đầy đủ về chức năng, requirements, và design.

### 📋 Task Structure — Dependency-Driven
Dùng **Dependency-Driven approach**:
- `tasks/layer-0-todo.md` — Foundation (no dependency)
- `tasks/layer-1-todo.md` — Depends on Layer 0 (tạo khi cần)
- `tasks/layer-2-todo.md` — Depends on Layer 1 (tạo khi cần)
- ... (thêm layer tùy scope)
- `tasks/done.md` — Completed tasks

**Quy tắc:**
- Số layer phụ thuộc vào scope breakdown + dependency analysis
- Các task trong cùng layer có thể làm song parallel
- Chỉ khi layer N hoàn toàn xong → mới bắt đầu layer N+1
- Xem `docs/SCOPE_BREAKDOWN.md` để chi tiết
"@
  
  $claudeContent = $claudeContent -replace '(## Context)', "`$1$contextSection"
  Set-Content "CLAUDE.md" $claudeContent
}

if (Test-Path "CODEX.md") {
  $codexContent = Get-Content "CODEX.md" -Raw
  $contextSection = @"

### 📋 Specifications
Xem `docs/SPECIFICATIONS.md` để chi tiết đầy đủ về chức năng, requirements, và design.

### 📋 Task Structure — Dependency-Driven
Dùng **Dependency-Driven approach**:
- `tasks/layer-0-todo.md` — Foundation (no dependency)
- `tasks/layer-1-todo.md` — Depends on Layer 0 (tạo khi cần)
- `tasks/layer-2-todo.md` — Depends on Layer 1 (tạo khi cần)
- ... (thêm layer tùy scope)
- `tasks/done.md` — Completed tasks

**Quy tắc:**
- Số layer phụ thuộc vào scope breakdown + dependency analysis
- Các task trong cùng layer có thể làm song parallel
- Chỉ khi layer N hoàn toàn xong → mới bắt đầu layer N+1
- Xem `docs/SCOPE_BREAKDOWN.md` để chi tiết
"@
  
  $codexContent = $codexContent -replace '(## Context)', "`$1$contextSection"
  Set-Content "CODEX.md" $codexContent
}

Write-Host "  ${GREEN}✅ CLAUDE.md/CODEX.md updated${RESET}"

# ── Step 5: Git reinit ───────────────────────────────────────
Write-Host ""
Write-Host "${CYAN}Step 4/4: Reset git history...${RESET}"

if (Test-Path ".git") {
  Remove-Item -Path ".git" -Recurse -Force | Out-Null
}

git init -b main | Out-Null
git add . | Out-Null
git commit -m "feat: init $PROJECT_NAME project" -q | Out-Null
Write-Host "  ${GREEN}✅ Fresh git repo initialized${RESET}"

# ── Step 6: Create GitHub repo (optional) ────────────────────
Write-Host ""
Write-Host "${CYAN}Step 5/5: GitHub repo${RESET}"
$CREATE_GITHUB = Read-Host "  Tạo repo trên GitHub không? (y/n) [default: n]"
if ([string]::IsNullOrWhiteSpace($CREATE_GITHUB)) { $CREATE_GITHUB = "n" }

if ($CREATE_GITHUB -match "^[Yy]$") {
  Write-Host "  ${YELLOW}Đang tạo repo...${RESET}"
  
  # Sanitize project name for GitHub
  $GITHUB_REPO = $PROJECT_NAME.ToLower() -replace '\s+', '-'
  
  # Create repo on GitHub
  $output = gh repo create "ocanhdt12-gif/$GITHUB_REPO" `
    --public `
    --description "$PROJECT_NAME" `
    --source=. `
    --remote=origin `
    --push 2>&1
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  ${GREEN}✅ Repo created: https://github.com/ocanhdt12-gif/$GITHUB_REPO${RESET}"
  } else {
    Write-Host "  ${YELLOW}⚠️  Không thể tạo repo trên GitHub (có thể repo đã tồn tại)${RESET}"
    Write-Host "  ${YELLOW}Bạn có thể push thủ công sau:${RESET}"
    Write-Host "  ${YELLOW}  git remote add origin git@github.com:ocanhdt12-gif/$GITHUB_REPO.git${RESET}"
    Write-Host "  ${YELLOW}  git push -u origin main${RESET}"
  }
} else {
  Write-Host "  ${YELLOW}Bỏ qua tạo GitHub repo${RESET}"
  Write-Host "  ${YELLOW}Bạn có thể push thủ công sau:${RESET}"
  Write-Host "  ${YELLOW}  git remote add origin git@github.com:ocanhdt12-gif/<repo-name>.git${RESET}"
  Write-Host "  ${YELLOW}  git push -u origin main${RESET}"
}

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
Write-Host "${BOLD}  ✅ Project sẵn sàng!${RESET}"
Write-Host "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
Write-Host ""
Write-Host "  📁 ${YELLOW}$(Get-Location)${RESET}"
Write-Host ""
Write-Host "  📄 Files tạo:"
Write-Host "    • ${CYAN}docs/BRIEF.md${RESET} — Tóm tắt (Opencode đọc)"
if (Test-Path "docs/SPECIFICATIONS.md") {
  Write-Host "    • ${CYAN}docs/SPECIFICATIONS.md${RESET} — Chi tiết đầy đủ"
}
Write-Host "    • ${CYAN}tasks/layer-0-todo.md${RESET} — Foundation tasks"
Write-Host "    • ${CYAN}tasks/done.md${RESET} — Completed tasks log"
Write-Host ""
Write-Host "  📋 Dependency-Driven Approach:"
Write-Host "    • Số layer phụ thuộc vào scope breakdown"
Write-Host "    • Tạo layer-1-todo.md, layer-2-todo.md, ... khi cần"
Write-Host "    • Xem hướng dẫn trong tasks/layer-0-todo.md"
Write-Host ""
Write-Host "  Bước tiếp theo:"
Write-Host "  ${CYAN}1. Mở folder này trong Opencode${RESET}"
Write-Host "  ${CYAN}2. Opencode đọc CLAUDE.md → tự bắt đầu Phase 0${RESET}"
Write-Host "  ${CYAN}3. Trả lời câu hỏi của Opencode là xong 🎯${RESET}"
Write-Host ""
Write-Host "${GREEN}${BOLD}Happy building! 🎉${RESET}"
Write-Host ""

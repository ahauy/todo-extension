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

# ── Step 2: Brain dump ───────────────────────────────────────
Write-Host ""
Write-Host "${CYAN}Step 2/4: Brain dump ý tưởng${RESET}"
Write-Host "  ${YELLOW}Mô tả ngắn gọn về project (không cần chuẩn, cứ dump thôi):${RESET}"
Write-Host "  ${YELLOW}Ví dụ: App làm gì, user là ai, tính năng chính, stack muốn dùng...${RESET}"
Write-Host "  ${YELLOW}(Nhấn Ctrl+D rồi Enter để xong)${RESET}"
Write-Host ""

$BRIEF = @()
while ($true) {
  $line = Read-Host
  if ([string]::IsNullOrWhiteSpace($line)) {
    break
  }
  $BRIEF += $line
}

if ($BRIEF.Count -eq 0) {
  $BRIEF = "(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
} else {
  $BRIEF = $BRIEF -join "`n"
}

# ── Step 3: Replace placeholders ────────────────────────────
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

# Ghi brain dump vào docs/BRIEF.md
if (-not (Test-Path "docs")) {
  New-Item -ItemType Directory -Path "docs" | Out-Null
}

$briefContent = @"
# Brain Dump — $PROJECT_NAME

$BRIEF
"@

Set-Content -Path "docs/BRIEF.md" -Value $briefContent

Write-Host "  ${GREEN}✅ Files updated${RESET}"
Write-Host "  ${GREEN}✅ Brain dump đã ghi vào docs/BRIEF.md${RESET}"

# ── Step 4: Git reinit ───────────────────────────────────────
Write-Host ""
Write-Host "${CYAN}Step 4/4: Reset git history...${RESET}"

if (Test-Path ".git") {
  Remove-Item -Path ".git" -Recurse -Force | Out-Null
}

git init -b main | Out-Null
git add . | Out-Null
git commit -m "feat: init $PROJECT_NAME project" -q | Out-Null

Write-Host "  ${GREEN}✅ Fresh git repo initialized${RESET}"

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
Write-Host "${BOLD}  ✅ Project sẵn sàng!${RESET}"
Write-Host "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
Write-Host ""
Write-Host "  📁 ${YELLOW}$(Get-Location)${RESET}"
Write-Host ""
Write-Host "  Bước tiếp theo:"
Write-Host "  ${CYAN}1. Mở folder này trong Opencode${RESET}"
Write-Host "  ${CYAN}2. Opencode đọc CLAUDE.md → tự bắt đầu Phase 0${RESET}"
Write-Host "  ${CYAN}3. Trả lời câu hỏi của Opencode là xong 🎯${RESET}"
Write-Host ""
Write-Host "${GREEN}${BOLD}Happy building! 🎉${RESET}"
Write-Host ""

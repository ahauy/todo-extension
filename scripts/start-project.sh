#!/bin/bash

# ============================================================
# start-project.sh — Kick off a new project from this template
# Usage: ./scripts/start-project.sh
# ============================================================

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     🚀 Opencode Project Starter          ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""

# ── Step 1: Project name ─────────────────────────────────────
echo -e "${CYAN}Step 1/4: Project name${RESET}"
read -p "  Tên project (dùng cho folder + repo): " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Tên project không được để trống."
  exit 1
fi

# ── Step 2: Replace placeholders ─────────────────────────────
echo ""
echo -e "${CYAN}Step 2/4: Đang setup files...${RESET}"

# Replace [PROJECT_NAME] in all markdown files
find . -name "*.md" -not -path "./.git/*" | while read file; do
  sed -i "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file"
done

# Update CLAUDE.md with today's date
TODAY=$(date +%Y-%m-%d)
sed -i "s/\[DATE\]/$TODAY/g" docs/PRD.md docs/ARCHITECTURE.md 2>/dev/null || true

echo -e "  ${GREEN}✅ Files updated${RESET}"

# ── Step 3: Git reinit (fresh history) ───────────────────────
echo ""
echo -e "${CYAN}Step 3/4: Reset git history...${RESET}"
rm -rf .git
git init -b main > /dev/null 2>&1
git add .
git commit -m "feat: init $PROJECT_NAME project" -q
echo -e "  ${GREEN}✅ Fresh git repo initialized${RESET}"

# ── Step 4: Print Phase 0 prompt ─────────────────────────────
echo ""
echo -e "${CYAN}Step 4/4: Sẵn sàng!${RESET}"
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  📋 Mở Opencode, paste prompt sau vào:${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
cat docs/phases/phase-0.md | grep -A 200 "## Prompt Cho Opencode" | grep -A 200 '```' | tail -n +2 | head -n -1
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${YELLOW}📁 Project folder: $(pwd)${RESET}"
echo -e "${YELLOW}📄 Chi tiết Phase 0: docs/phases/phase-0.md${RESET}"
echo ""
echo -e "${GREEN}${BOLD}Happy building! 🎉${RESET}"
echo ""

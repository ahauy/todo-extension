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

# ── Step 1: Project name ──────────────────────────────────────
echo -e "${CYAN}Step 1/4: Project name${RESET}"
read -p "  Tên project: " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Tên project không được để trống."
  exit 1
fi

# ── Step 2: Brain dump ───────────────────────────────────────
echo ""
echo -e "${CYAN}Step 2/4: Brain dump ý tưởng${RESET}"
echo -e "  ${YELLOW}Mô tả ngắn gọn về project (không cần chuẩn, cứ dump thôi):${RESET}"
echo -e "  ${YELLOW}Ví dụ: App làm gì, user là ai, tính năng chính, stack muốn dùng...${RESET}"
echo -e "  ${YELLOW}(Nhấn Enter 2 lần để xong)${RESET}"
echo ""

BRIEF=""
while IFS= read -r line; do
  [[ -z "$line" && -z "$(echo "$BRIEF" | tail -1)" ]] && break
  BRIEF="$BRIEF$line"$'\n'
done

if [ -z "$(echo "$BRIEF" | tr -d '[:space:]')" ]; then
  BRIEF="(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
fi

# ── Step 3: Replace placeholders ────────────────────────────
echo ""
echo -e "${CYAN}Step 3/4: Đang setup files...${RESET}"

TODAY=$(date +%Y-%m-%d)

# Replace [PROJECT_NAME] trong tất cả markdown
find . -name "*.md" -not -path "./.git/*" | while read file; do
  sed -i "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file"
  sed -i "s/\[DATE\]/$TODAY/g" "$file"
done

# Ghi brain dump vào docs/BRIEF.md
BRIEF_ESCAPED=$(echo "$BRIEF" | sed 's/[&/\]/\\&/g')
sed -i "s/\[BRIEF_CONTENT\]/$BRIEF_ESCAPED/" docs/BRIEF.md 2>/dev/null || \
  printf '%s' "$BRIEF" >> docs/BRIEF.md

echo -e "  ${GREEN}✅ Files updated${RESET}"
echo -e "  ${GREEN}✅ Brain dump đã ghi vào docs/BRIEF.md${RESET}"

# ── Step 4: Git reinit ───────────────────────────────────────
echo ""
echo -e "${CYAN}Step 4/4: Reset git history...${RESET}"
rm -rf .git
git init -b main > /dev/null 2>&1
git add .
git commit -m "feat: init $PROJECT_NAME project" -q
echo -e "  ${GREEN}✅ Fresh git repo initialized${RESET}"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  ✅ Project sẵn sàng!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  📁 ${YELLOW}$(pwd)${RESET}"
echo ""
echo -e "  Bước tiếp theo:"
echo -e "  ${CYAN}1. Mở folder này trong Opencode${RESET}"
echo -e "  ${CYAN}2. Opencode đọc CLAUDE.md → tự bắt đầu Phase 0${RESET}"
echo -e "  ${CYAN}3. Trả lời câu hỏi của Opencode là xong 🎯${RESET}"
echo ""
echo -e "${GREEN}${BOLD}Happy building! 🎉${RESET}"
echo ""

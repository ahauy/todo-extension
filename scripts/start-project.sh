#!/bin/bash

# ============================================================
# start-project.sh — Kick off a new project from this template
# Usage: ./scripts/start-project.sh
# Supports: Linux, macOS
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

# ── Step 2: Specifications file ──────────────────────────────
echo ""
echo -e "${CYAN}Step 2/4: Specifications & Brain dump${RESET}"
echo -e "  ${YELLOW}Bạn có file mô tả chức năng không?${RESET}"
echo ""

read -p "  Đường dẫn file (hoặc Enter để skip): " SPEC_FILE

SPEC_CONTENT=""
if [ -n "$SPEC_FILE" ]; then
  if [ ! -f "$SPEC_FILE" ]; then
    echo "❌ File không tồn tại: $SPEC_FILE"
    exit 1
  fi
  SPEC_CONTENT=$(cat "$SPEC_FILE")
  echo -e "  ${GREEN}✅ File đã load${RESET}"
else
  echo -e "  ${YELLOW}Không có file, sẽ nhập brain dump text${RESET}"
fi

# ── Step 3: Brain dump (nếu không có file) ──────────────────
if [ -z "$SPEC_CONTENT" ]; then
  echo ""
  echo -e "  ${YELLOW}Mô tả ngắn gọn về project (không cần chuẩn, cứ dump thôi):${RESET}"
  echo -e "  ${YELLOW}Ví dụ: App làm gì, user là ai, tính năng chính, stack muốn dùng...${RESET}"
  echo -e "  ${YELLOW}(Nhấn Enter 2 lần để xong)${RESET}"
  echo ""
  
  SPEC_CONTENT=""
  EMPTY_LINES=0
  while IFS= read -r line; do
    if [ -z "$line" ]; then
      EMPTY_LINES=$((EMPTY_LINES + 1))
      if [ $EMPTY_LINES -ge 2 ]; then
        break
      fi
    else
      EMPTY_LINES=0
    fi
    SPEC_CONTENT="$SPEC_CONTENT$line"$'\n'
  done
  SPEC_CONTENT=$(echo "$SPEC_CONTENT" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}')
fi

if [ -z "$(echo "$SPEC_CONTENT" | tr -d '[:space:]')" ]; then
  SPEC_CONTENT="(Chưa có mô tả — Opencode sẽ hỏi thêm trong Phase 0)"
fi

# ── Step 4: Replace placeholders ────────────────────────────
echo ""
echo -e "${CYAN}Step 3/4: Đang setup files...${RESET}"

TODAY=$(date +%Y-%m-%d)

# Replace [PROJECT_NAME] trong tất cả markdown
find . -name "*.md" -not -path "./.git/*" -type f | while read file; do
  if [ -f "$file" ]; then
    sed -i.bak "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file"
    sed -i.bak "s/\[DATE\]/$TODAY/g" "$file"
    rm -f "$file.bak"
  fi
done

# ── Copy SPECIFICATIONS.md ───────────────────────────────────
mkdir -p docs
if [ -n "$SPEC_FILE" ] && [ -f "$SPEC_FILE" ]; then
  cp "$SPEC_FILE" docs/SPECIFICATIONS.md
  echo -e "  ${GREEN}✅ Specifications copied to docs/SPECIFICATIONS.md${RESET}"
fi

# ── Create BRIEF.md (tóm tắt) ────────────────────────────────
# Lấy first 50 lines hoặc toàn bộ nếu < 50 lines
BRIEF_LINES=$(echo "$SPEC_CONTENT" | head -50)
TOTAL_LINES=$(echo "$SPEC_CONTENT" | wc -l)

cat > docs/BRIEF.md << EOF
# Brain Dump — $PROJECT_NAME

**Ngày tạo:** $TODAY

## Tóm tắt

$BRIEF_LINES
EOF

if [ "$TOTAL_LINES" -gt 50 ]; then
  cat >> docs/BRIEF.md << EOF

---

**📌 Lưu ý:** Đây là tóm tắt (50 dòng đầu). Chi tiết đầy đủ xem **\`docs/SPECIFICATIONS.md\`**
EOF
fi

echo -e "  ${GREEN}✅ Brain dump đã ghi vào docs/BRIEF.md${RESET}"

# ── Create layer-based task files ────────────────────────────
mkdir -p tasks

cat > tasks/layer-0-todo.md << 'EOF'
# Layer 0: Foundation Tasks

**Status:** In Progress

Foundation layer — không phụ thuộc vào layer khác.
Các task ở đây có thể làm song song.

## Tasks

- [ ] Task 1: [Mô tả]
- [ ] Task 2: [Mô tả]
- [ ] Task 3: [Mô tả]

---

**Khi layer 0 xong → bắt đầu layer 1**
EOF

cat > tasks/layer-1-todo.md << 'EOF'
# Layer 1: Core Features

**Status:** Waiting for Layer 0

Phụ thuộc vào Layer 0.
Chỉ bắt đầu khi Layer 0 hoàn toàn xong.

## Tasks

- [ ] Task 1: [Mô tả]
- [ ] Task 2: [Mô tả]
- [ ] Task 3: [Mô tả]

---

**Khi layer 1 xong → bắt đầu layer 2**
EOF

cat > tasks/layer-2-todo.md << 'EOF'
# Layer 2: Secondary Features

**Status:** Waiting for Layer 1

Phụ thuộc vào Layer 1.
Chỉ bắt đầu khi Layer 1 hoàn toàn xong.

## Tasks

- [ ] Task 1: [Mô tả]
- [ ] Task 2: [Mô tả]
- [ ] Task 3: [Mô tả]

---

**Khi layer 2 xong → bắt đầu layer 3**
EOF

cat > tasks/layer-3-todo.md << 'EOF'
# Layer 3: Polish & Release

**Status:** Waiting for Layer 2

Phụ thuộc vào Layer 2.
Chỉ bắt đầu khi Layer 2 hoàn toàn xong.

## Tasks

- [ ] E2E testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Release preparation

---

**Khi layer 3 xong → ready for production 🚀**
EOF

cat > tasks/done.md << 'EOF'
# Completed Tasks

Log các task đã xong.

## Format

```
- [x] Layer X, Task: [Mô tả] — Commit: [hash]
```

---

(Sẽ update khi có task xong)
EOF

echo -e "  ${GREEN}✅ Layer-based task files created${RESET}"

# ── Update CLAUDE.md/CODEX.md ────────────────────────────────
if [ -f "CLAUDE.md" ]; then
  sed -i.bak '/## Context/a\
\
### 📋 Specifications\
Xem `docs/SPECIFICATIONS.md` để chi tiết đầy đủ về chức năng, requirements, và design.\
\
### 📋 Task Structure\
Dùng **Dependency-Driven approach**:\
- `tasks/layer-0-todo.md` — Foundation (no dependency)\
- `tasks/layer-1-todo.md` — Depends on Layer 0\
- `tasks/layer-2-todo.md` — Depends on Layer 1\
- `tasks/layer-3-todo.md` — Depends on Layer 2\
- `tasks/done.md` — Completed tasks\
\
Các task trong cùng layer có thể làm song song. Chỉ khi layer N xong → mới bắt đầu layer N+1.
' CLAUDE.md
  rm -f CLAUDE.md.bak
fi

if [ -f "CODEX.md" ]; then
  sed -i.bak '/## Context/a\
\
### 📋 Specifications\
Xem `docs/SPECIFICATIONS.md` để chi tiết đầy đủ về chức năng, requirements, và design.\
\
### 📋 Task Structure\
Dùng **Dependency-Driven approach**:\
- `tasks/layer-0-todo.md` — Foundation (no dependency)\
- `tasks/layer-1-todo.md` — Depends on Layer 0\
- `tasks/layer-2-todo.md` — Depends on Layer 1\
- `tasks/layer-3-todo.md` — Depends on Layer 2\
- `tasks/done.md` — Completed tasks\
\
Các task trong cùng layer có thể làm song song. Chỉ khi layer N xong → mới bắt đầu layer N+1.
' CODEX.md
  rm -f CODEX.md.bak
fi

echo -e "  ${GREEN}✅ CLAUDE.md/CODEX.md updated${RESET}"

# ── Step 5: Git reinit ───────────────────────────────────────
echo ""
echo -e "${CYAN}Step 4/4: Reset git history...${RESET}"
rm -rf .git
git init -b main > /dev/null 2>&1
git add .
git commit -m "feat: init $PROJECT_NAME project" -q
echo -e "  ${GREEN}✅ Fresh git repo initialized${RESET}"

# ── Step 6: Create GitHub repo (optional) ────────────────────
echo ""
echo -e "${CYAN}Step 5/5: GitHub repo${RESET}"
read -p "  Tạo repo trên GitHub không? (y/n) [default: n]: " CREATE_GITHUB
CREATE_GITHUB=${CREATE_GITHUB:-n}

if [[ "$CREATE_GITHUB" =~ ^[Yy]$ ]]; then
  echo -e "  ${YELLOW}Đang tạo repo...${RESET}"
  
  # Sanitize project name for GitHub (lowercase, replace spaces with hyphens)
  GITHUB_REPO=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
  
  # Create repo on GitHub
  if gh repo create "ocanhdt12-gif/$GITHUB_REPO" \
    --public \
    --description "$PROJECT_NAME" \
    --source=. \
    --remote=origin \
    --push > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Repo created: https://github.com/ocanhdt12-gif/$GITHUB_REPO${RESET}"
  else
    echo -e "  ${YELLOW}⚠️  Không thể tạo repo trên GitHub (có thể repo đã tồn tại)${RESET}"
    echo -e "  ${YELLOW}Bạn có thể push thủ công sau:${RESET}"
    echo -e "  ${YELLOW}  git remote add origin git@github.com:ocanhdt12-gif/$GITHUB_REPO.git${RESET}"
    echo -e "  ${YELLOW}  git push -u origin main${RESET}"
  fi
else
  echo -e "  ${YELLOW}Bỏ qua tạo GitHub repo${RESET}"
  echo -e "  ${YELLOW}Bạn có thể push thủ công sau:${RESET}"
  echo -e "  ${YELLOW}  git remote add origin git@github.com:ocanhdt12-gif/<repo-name>.git${RESET}"
  echo -e "  ${YELLOW}  git push -u origin main${RESET}"
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  ✅ Project sẵn sàng!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  📁 ${YELLOW}$(pwd)${RESET}"
echo ""
echo -e "  📄 Files tạo:"
echo -e "    • ${CYAN}docs/BRIEF.md${RESET} — Tóm tắt (Opencode đọc)"
if [ -f "docs/SPECIFICATIONS.md" ]; then
  echo -e "    • ${CYAN}docs/SPECIFICATIONS.md${RESET} — Chi tiết đầy đủ"
fi
echo -e "    • ${CYAN}tasks/layer-0-todo.md${RESET} — Foundation tasks"
echo -e "    • ${CYAN}tasks/layer-1-todo.md${RESET} — Layer 1 tasks"
echo -e "    • ${CYAN}tasks/layer-2-todo.md${RESET} — Layer 2 tasks"
echo -e "    • ${CYAN}tasks/layer-3-todo.md${RESET} — Layer 3 tasks"
echo ""
echo -e "  Bước tiếp theo:"
echo -e "  ${CYAN}1. Mở folder này trong Opencode${RESET}"
echo -e "  ${CYAN}2. Opencode đọc CLAUDE.md → tự bắt đầu Phase 0${RESET}"
echo -e "  ${CYAN}3. Trả lời câu hỏi của Opencode là xong 🎯${RESET}"
echo ""
echo -e "${GREEN}${BOLD}Happy building! 🎉${RESET}"
echo ""

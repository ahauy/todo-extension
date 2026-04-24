# Memory Hooks — Auto-Save/Load Context

> Tự động lưu context sau mỗi session, tự động load khi mở project lại.

---

## Cách Hoạt Động

```
Session 1 xong
    ↓
Hook tự động save context
    → memory/YYYY-MM-DD.md
    → Ghi: task đã làm, lỗi gặp, tiếp theo là gì
    ↓
Đóng Opencode
    ↓
Session 2 mở
    ↓
Hook tự động load context từ memory/
    ↓
Opencode biết đang ở đâu, làm gì tiếp
```

---

## Setup

### Bước 1: Tạo Hook File

Tạo `.claude/hooks/session-end.sh`:

```bash
#!/bin/bash

# Auto-save context khi session kết thúc
TODAY=$(date +%Y-%m-%d)
MEMORY_FILE="memory/$TODAY.md"

# Tạo memory file nếu chưa có
if [ ! -f "$MEMORY_FILE" ]; then
  cat > "$MEMORY_FILE" << 'EOF'
# Session Log — $TODAY

## Tasks Completed
- [task list]

## Issues Encountered
- [issue list]

## Next Steps
- [next task]

## Learnings
- [lessons learned]
EOF
fi

# Append session summary
echo "" >> "$MEMORY_FILE"
echo "## Session $(date +%H:%M)" >> "$MEMORY_FILE"
echo "- Completed: [task]" >> "$MEMORY_FILE"
echo "- Issues: [issue]" >> "$MEMORY_FILE"
echo "- Next: [next]" >> "$MEMORY_FILE"
```

### Bước 2: Tạo Hook File

Tạo `.claude/hooks/session-start.sh`:

```bash
#!/bin/bash

# Auto-load context khi session bắt đầu
TODAY=$(date +%Y-%m-%d)
MEMORY_FILE="memory/$TODAY.md"

if [ -f "$MEMORY_FILE" ]; then
  echo "📝 Memory from today:"
  tail -20 "$MEMORY_FILE"
  echo ""
  echo "💡 Tip: Check memory/$TODAY.md for full context"
fi
```

### Bước 3: Cấu Hình Opencode

Thêm vào `CLAUDE.md`:

```markdown
## Memory System

Auto-save/load context:
- Session end: save to memory/YYYY-MM-DD.md
- Session start: load from memory/YYYY-MM-DD.md

Check memory/ folder để xem context từ sessions trước.
```

---

## Template Memory File

```markdown
# Session Log — YYYY-MM-DD

## Tasks Completed
- Task 2.3: Implement swatch editor
- Task 2.4: Add variant selection logic

## Issues Encountered
- TypeScript strict mode error in component
  - Fix: Added proper type annotations
- Test coverage dropped to 75%
  - Fix: Added missing test cases

## Next Steps
- Task 2.5: Integration test toàn phase
- Task 3.1: UI responsive design

## Learnings
- Always run type check before commit
- Test coverage must stay > 80%
- Swatch logic needs edge case handling
```

---

## Usage

**Mỗi session kết thúc:**
```bash
# Hook tự động chạy
# → memory/2026-04-24.md được update
```

**Mỗi session bắt đầu:**
```bash
# Hook tự động chạy
# → Hiển thị context từ hôm nay
```

---

## Tips

- Cập nhật memory file thủ công nếu cần
- Review memory/ trước khi bắt đầu session mới
- Archive memory files cũ khi project xong

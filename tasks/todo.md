# Task Board

> Opencode đọc file này để biết task hiện tại cần làm.  
> Cập nhật sau mỗi task hoàn thành.

---

## 🔥 In Progress

### Task [X.Y]: [Tên task]
- **Files được sửa:**
  - `src/[path/to/file.tsx]`
  - `tests/unit/[path/to/file.test.tsx]`
- **Input:** [data/type đầu vào]
- **Output expected:** [kết quả mong muốn]
- **Constraints:** Không sửa `[file/folder không được đụng]`
- **Test:** Viết unit test tại `tests/unit/[...].test.ts`

---

## 📋 Up Next

- [ ] Task [X.Y+1]: [Tên task ngắn gọn]
- [ ] Task [X.Y+2]: [Tên task ngắn gọn]
- [ ] Task [X.Y+3]: [Tên task ngắn gọn]

---

## ✅ Done (Phase hiện tại)

| Task | Mô tả | Commit |
|------|-------|--------|
| [X.1] | [Mô tả] | [hash] |

---

## 📌 Prompt Template Cho Opencode

Dùng prompt này mỗi khi bắt đầu session mới:

```
Đọc CLAUDE.md để hiểu project context.
Đọc docs/phases/phase-[N].md để hiểu phase hiện tại.
Đọc tasks/todo.md để biết task cần làm.

Implement task đang "In Progress".
Chỉ sửa files được liệt kê trong task đó.
Sau khi xong:
1. Viết unit test
2. Chạy test, fix nếu fail
3. Commit với message đúng format
4. Move task sang done.md
5. Báo kết quả + tóm tắt những gì đã làm
```

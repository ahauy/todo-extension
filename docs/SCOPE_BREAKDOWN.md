# Scope Breakdown Strategies

> Khi yêu cầu ban đầu lớn, cách chia scope ảnh hưởng trực tiếp đến hiệu quả agent và timeline project.

---

## 3 Cách Chia Scope

### 1. Feature-Based Breakdown

**Cách chia:** Theo feature/user story

```
Scope lớn
├── Feature 1: User Authentication
│   ├── Story 1.1: Login
│   ├── Story 1.2: Signup
│   └── Story 1.3: Password Reset
├── Feature 2: Dashboard
│   ├── Story 2.1: Display data
│   └── Story 2.2: Export
└── Feature 3: Admin Panel
    └── Story 3.1: User management
```

**Ưu điểm:**
- ✅ Dễ hiểu, dễ demo từng feature
- ✅ Feedback sớm từ user
- ✅ Dễ prioritize

**Nhược điểm:**
- ❌ Có thể bị phụ thuộc lẫn nhau
- ❌ Agent có thể bị block nếu feature khác chưa xong
- ❌ Khó parallelize

**Dùng khi:**
- Scope không quá lớn (< 10 features)
- Features độc lập với nhau
- Cần demo/feedback thường xuyên

---

### 2. Epic-Based Breakdown

**Cách chia:** Theo Epic (lớn) → Stories (nhỏ), theo phase

```
Scope lớn
├── Epic 1: Foundation (Phase 1)
│   ├── Story 1.1: Setup DB
│   ├── Story 1.2: Setup API
│   └── Story 1.3: Setup Auth
├── Epic 2: Core Features (Phase 2)
│   ├── Story 2.1: Feature A
│   └── Story 2.2: Feature B
└── Epic 3: Polish (Phase 3)
    └── Story 3.1: UI/UX
```

**Ưu điểm:**
- ✅ Theo phase, dễ track progress
- ✅ Rõ ràng scope mỗi phase
- ✅ Dễ estimate timeline

**Nhược điểm:**
- ❌ Cứng nhắc, khó adjust
- ❌ Agent phải chờ phase trước xong
- ❌ Khó parallelize

**Dùng khi:**
- Scope rất lớn (> 15 features)
- Cần structure rõ ràng
- Timeline cố định

---

### 3. Dependency-Driven Breakdown ⭐ (Recommended)

**Cách chia:** Theo dependency layer (Layer 0 → Layer 1 → Layer 2 → ...)

```
Scope lớn
├── Layer 0: Foundation (no dependency)
│   ├── DB schema
│   ├── API base
│   └── Auth system
├── Layer 1: Core (depends on Layer 0)
│   ├── Feature A
│   └── Feature B
├── Layer 2: Secondary (depends on Layer 1)
│   ├── Feature C
│   └── Feature D
└── Layer 3: Polish (depends on Layer 2)
    ├── UI/UX
    └── Performance
```

**Ưu điểm:**
- ✅ Agent không bị block (Layer 0 xong → Layer 1 start)
- ✅ Dễ parallelize (nhiều agent làm layer khác nhau)
- ✅ Flexible (có thể adjust layer nếu cần)
- ✅ Rõ ràng scope mỗi layer
- ✅ Tối ưu timeline

**Nhược điểm:**
- ❌ Cần phân tích dependency kỹ lưỡng
- ❌ Phức tạp hơn 2 cách trên

**Dùng khi:**
- Scope lớn (> 10 features)
- Cần parallelize work
- Có nhiều agent/team
- Muốn tối ưu timeline

---

## Cách Chọn

| Tiêu chí | Feature-Based | Epic-Based | Dependency-Driven |
|----------|---------------|-----------|-------------------|
| Scope nhỏ (< 5 features) | ✅ | ❌ | ❌ |
| Scope trung bình (5-10) | ✅ | ✅ | ✅ |
| Scope lớn (> 10) | ❌ | ✅ | ✅✅ |
| Parallelize | ❌ | ❌ | ✅✅ |
| Dễ hiểu | ✅✅ | ✅ | ✅ |
| Flexible | ✅ | ❌ | ✅ |
| Cần phân tích | ❌ | ❌ | ✅ |

---

## Cách Implement Dependency-Driven

### Step 1: List tất cả features/stories

```
- User Auth (login, signup, password reset)
- Dashboard (display data, export)
- Admin Panel (user management)
- Notifications (email, push)
- Analytics (tracking, reports)
```

### Step 2: Phân tích dependency

```
User Auth
  ↓ (depends on)
Dashboard, Admin Panel, Notifications
  ↓ (depends on)
Analytics
```

### Step 3: Chia thành layer

```
Layer 0: User Auth
  - Story 0.1: Login
  - Story 0.2: Signup
  - Story 0.3: Password Reset

Layer 1: Dashboard + Admin Panel
  - Story 1.1: Dashboard display
  - Story 1.2: Admin user management

Layer 2: Notifications
  - Story 2.1: Email notifications
  - Story 2.2: Push notifications

Layer 3: Analytics
  - Story 3.1: Event tracking
  - Story 3.2: Reports
```

### Step 4: Assign agent/sprint

```
Sprint 1: Layer 0 (Agent A)
Sprint 2: Layer 1 (Agent B) + Layer 0 polish (Agent A)
Sprint 3: Layer 2 (Agent C) + Layer 1 polish (Agent B)
Sprint 4: Layer 3 (Agent D) + Layer 2 polish (Agent C)
```

---

## Template Files

Khi dùng Dependency-Driven, tạo:

```
docs/
├── SCOPE_BREAKDOWN.md          ← File này
├── dependency-analysis.md      ← Phân tích dependency
└── layer-breakdown.md          ← Chi tiết mỗi layer

tasks/
├── layer-0-todo.md
├── layer-1-todo.md
├── layer-2-todo.md
└── layer-3-todo.md
```

---

## Checklist

Trước khi bắt đầu:

- [ ] Liệt kê tất cả features/stories
- [ ] Phân tích dependency giữa chúng
- [ ] Chia thành layer (Layer 0 không có dependency)
- [ ] Verify: Layer N chỉ depend on Layer 0 → N-1
- [ ] Assign agent/sprint cho mỗi layer
- [ ] Tạo task file cho mỗi layer
- [ ] Confirm timeline với anh

---

## Khi nào adjust?

- Nếu phát hiện dependency mới → update layer breakdown
- Nếu layer quá lớn → chia nhỏ thêm
- Nếu layer quá nhỏ → merge với layer khác
- Nếu agent finish sớm → pull task từ layer tiếp theo

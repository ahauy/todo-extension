# Architecture — [PROJECT_NAME]

> Technical design document  
> Last updated: [DATE]

---

## 1. System Overview

```
[Vẽ diagram đơn giản ở đây]

User → Frontend → Backend API → Database
                ↓
          External APIs
```

## 2. Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | [e.g. Remix + Polaris] | [Lý do] |
| Backend | [e.g. Node.js] | [Lý do] |
| Database | [e.g. PostgreSQL] | [Lý do] |
| ORM | [e.g. Prisma] | [Lý do] |
| Auth | [e.g. Shopify OAuth] | [Lý do] |
| Deployment | [e.g. Railway] | [Lý do] |

## 3. Data Models

```typescript
// [Model 1]
type [ModelName] = {
  id: string
  // fields...
  createdAt: Date
  updatedAt: Date
}

// [Model 2]
type [ModelName2] = {
  id: string
  // fields...
}
```

## 4. API Design

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/[resource] | List all |
| GET | /api/[resource]/:id | Get one |
| POST | /api/[resource] | Create |
| PUT | /api/[resource]/:id | Update |
| DELETE | /api/[resource]/:id | Delete |

## 5. Component Breakdown

```
src/
  app/
    routes/
      index.tsx         ← Dashboard
      [resource]/
        index.tsx        ← List view
        new.tsx          ← Create form
        $id.tsx          ← Edit form
  components/
    [Component1]/
      index.tsx
      [Component1].test.tsx
    [Component2]/
      ...
```

## 6. Key Decisions
- **[Decision 1]:** [Lý do chọn approach này]
- **[Decision 2]:** [Lý do chọn approach này]

## 7. Potential Risks
- [Risk 1] → Mitigation: [cách xử lý]
- [Risk 2] → Mitigation: [cách xử lý]

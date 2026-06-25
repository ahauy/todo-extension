---
name: database-orm-patterns
description: "Database design and ORM best practices including schema design, migrations, relationships, query optimization, and transactions with Prisma, TypeORM, and Sequelize."
origin: codex-project-template
---

# Database & ORM Patterns Skill

Comprehensive guide for designing databases and using ORMs effectively in Node.js applications.

## When to Use

Invoke this skill:
- When designing database schemas
- When setting up Prisma, TypeORM, or Sequelize
- When creating migrations
- When optimizing database queries
- When handling relationships (one-to-many, many-to-many)
- When implementing transactions
- When dealing with N+1 query problems

## ORM Comparison

| Feature | Prisma | TypeORM | Sequelize |
|---------|--------|---------|-----------|
| **Type Safety** | Excellent | Good | Fair |
| **Learning Curve** | Easy | Medium | Medium |
| **Performance** | Good | Excellent | Good |
| **Migrations** | Built-in | Built-in | Built-in |
| **Relations** | Excellent | Excellent | Good |
| **Databases** | PostgreSQL, MySQL, SQLite, MongoDB | PostgreSQL, MySQL, SQLite, Oracle | PostgreSQL, MySQL, SQLite |

**Recommendation:** Prisma for new projects (best DX), TypeORM for complex queries

## Prisma Setup

### Pattern 1: Basic Setup

```bash
# Install
npm install @prisma/client
npm install -D prisma

# Initialize
npx prisma init

# Create .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

### Pattern 2: Schema Definition

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id    Int     @id @default(autoincrement())
  title String
  content String?
  published Boolean @default(false)
  author User @relation(fields: [authorId], references: [id])
  authorId Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Pattern 3: Migrations

```bash
# Create migration
npx prisma migrate dev --name add_posts

# Apply migration
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## Schema Design

### Pattern 1: One-to-Many Relationship

```prisma
// ✅ GOOD - One user has many posts
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  posts Post[]
}

model Post {
  id    Int     @id @default(autoincrement())
  title String
  author User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### Pattern 2: Many-to-Many Relationship

```prisma
// ✅ GOOD - Many users can have many roles
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  roles UserRole[]
}

model Role {
  id    Int     @id @default(autoincrement())
  name  String  @unique
  users UserRole[]
}

model UserRole {
  id     Int  @id @default(autoincrement())
  user   User @relation(fields: [userId], references: [id])
  userId Int
  role   Role @relation(fields: [roleId], references: [id])
  roleId Int

  @@unique([userId, roleId])
}
```

### Pattern 3: Self-Referencing Relationship

```prisma
// ✅ GOOD - User can have parent user (hierarchical)
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  parent User? @relation("UserParent", fields: [parentId], references: [id])
  parentId Int?
  children User[] @relation("UserParent")
}
```

### Pattern 4: Timestamps

```prisma
// ✅ GOOD - Track creation and updates
model Post {
  id    Int     @id @default(autoincrement())
  title String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Querying with Prisma

### Pattern 1: Basic CRUD

```typescript
// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
})

// Read
const user = await prisma.user.findUnique({
  where: { id: 1 }
})

// Update
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane Doe' }
})

// Delete
await prisma.user.delete({
  where: { id: 1 }
})
```

### Pattern 2: Filtering

```typescript
// ✅ GOOD - Filter with conditions
const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' },
    name: { startsWith: 'John' }
  }
})

// ✅ GOOD - Complex filters
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: 'user1@example.com' },
      { email: 'user2@example.com' }
    ]
  }
})
```

### Pattern 3: Relations (Include)

```typescript
// ✅ GOOD - Include related data
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true
  }
})

// ✅ GOOD - Nested include
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      include: {
        comments: true
      }
    }
  }
})
```

### Pattern 4: Pagination

```typescript
// ✅ GOOD - Pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})

// Get total count
const total = await prisma.user.count()
```

### Pattern 5: Sorting

```typescript
// ✅ GOOD - Sort by multiple fields
const users = await prisma.user.findMany({
  orderBy: [
    { createdAt: 'desc' },
    { name: 'asc' }
  ]
})
```

## Query Optimization

### Pattern 1: Avoid N+1 Queries

```typescript
// ❌ BAD - N+1 query problem
const users = await prisma.user.findMany()
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  })
  // N queries for N users!
}

// ✅ GOOD - Use include
const users = await prisma.user.findMany({
  include: { posts: true }
})
```

### Pattern 2: Select Specific Fields

```typescript
// ✅ GOOD - Only select needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true
  }
})
```

### Pattern 3: Indexing

```prisma
// ✅ GOOD - Add indexes for frequently queried fields
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
  
  @@index([name])
}

model Post {
  id    Int     @id @default(autoincrement())
  title String
  authorId Int
  
  @@index([authorId])
}
```

## Transactions

### Pattern 1: Basic Transaction

```typescript
// ✅ GOOD - Transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com' }
  })

  const post = await tx.post.create({
    data: {
      title: 'First Post',
      authorId: user.id
    }
  })

  return { user, post }
})
```

### Pattern 2: Transaction with Error Handling

```typescript
// ✅ GOOD - Transaction with rollback
try {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: 'user@example.com' }
    })

    // If this fails, entire transaction rolls back
    const post = await tx.post.create({
      data: {
        title: 'First Post',
        authorId: user.id
      }
    })

    return { user, post }
  })
} catch (error) {
  console.error('Transaction failed:', error)
  // Rollback happened automatically
}
```

## Constraints & Validation

### Pattern 1: Unique Constraints

```prisma
// ✅ GOOD - Unique email
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
}

// ✅ GOOD - Composite unique
model UserRole {
  id     Int  @id @default(autoincrement())
  userId Int
  roleId Int

  @@unique([userId, roleId])
}
```

### Pattern 2: Required vs Optional

```prisma
// ✅ GOOD - Required and optional fields
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique        // Required
  name  String?                // Optional
  bio   String?                // Optional
}
```

### Pattern 3: Default Values

```prisma
// ✅ GOOD - Default values
model Post {
  id        Int     @id @default(autoincrement())
  title     String
  published Boolean @default(false)
  createdAt DateTime @default(now())
}
```

## Seeding

### Pattern 1: Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      name: 'User 1'
    }
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      name: 'User 2'
    }
  })

  // Create posts
  await prisma.post.create({
    data: {
      title: 'First Post',
      authorId: user1.id
    }
  })

  console.log('Seeding completed')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Pattern 2: Run Seed

```bash
# Add to package.json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}

# Run seed
npx prisma db seed
```

## Common Mistakes

### ❌ Mistake 1: N+1 Queries
```typescript
// BAD
const users = await prisma.user.findMany()
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } })
}

// GOOD
const users = await prisma.user.findMany({
  include: { posts: true }
})
```

### ❌ Mistake 2: Not using indexes
```prisma
// BAD
model Post {
  id    Int     @id @default(autoincrement())
  title String
  authorId Int  // No index!
}

// GOOD
model Post {
  id    Int     @id @default(autoincrement())
  title String
  authorId Int
  
  @@index([authorId])
}
```

### ❌ Mistake 3: Not handling errors
```typescript
// BAD
const user = await prisma.user.findUnique({
  where: { id: 1 }
})
console.log(user.email) // Might be null!

// GOOD
const user = await prisma.user.findUnique({
  where: { id: 1 }
})
if (!user) {
  throw new Error('User not found')
}
console.log(user.email)
```

### ❌ Mistake 4: Not using transactions
```typescript
// BAD - Can fail halfway
const user = await prisma.user.create({ data: { email: 'user@example.com' } })
const post = await prisma.post.create({ data: { title: 'Post', authorId: user.id } })

// GOOD - All or nothing
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'user@example.com' } })
  const post = await tx.post.create({ data: { title: 'Post', authorId: user.id } })
  return { user, post }
})
```

## Checklist

- [ ] Database schema is designed properly
- [ ] Relationships are defined correctly
- [ ] Indexes are added for frequently queried fields
- [ ] Migrations are created and tested
- [ ] Queries use include/select to avoid N+1
- [ ] Pagination is implemented
- [ ] Transactions are used for multi-step operations
- [ ] Error handling is comprehensive
- [ ] Constraints are enforced (unique, required)
- [ ] Seed script is created
- [ ] Database is normalized
- [ ] Foreign keys are set up
- [ ] Timestamps are tracked (createdAt, updatedAt)

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Sequelize Documentation](https://sequelize.org/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)

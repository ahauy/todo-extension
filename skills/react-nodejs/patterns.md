# React + Node.js — Implementation Patterns

## API Pattern

### Route Definition
```typescript
// server/routes/user-routes.ts
import { Router } from 'express';
import { authenticate } from '@/server/middleware/auth';
import { validate } from '@/server/middleware/validate';
import { createUserSchema, updateUserSchema } from '@/shared/validators/user';
import * as userController from '@/server/controllers/user-controller';

const router = Router();

router.get('/', authenticate, userController.getAll);
router.get('/:id', authenticate, userController.getById);
router.post('/', authenticate, validate(createUserSchema), userController.create);
router.put('/:id', authenticate, validate(updateUserSchema), userController.update);
router.delete('/:id', authenticate, userController.remove);

export { router as userRoutes };
```

### Controller Pattern
```typescript
// server/controllers/user-controller.ts
import { Request, Response, NextFunction } from 'express';
import * as userService from '@/server/services/user-service';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.findAll(req.query);
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};
```

### Service Pattern
```typescript
// server/services/user-service.ts
import { prisma } from '@/server/utils/db';
import type { CreateUserInput } from '@/shared/validators/user';

export const findAll = async (filters: Record<string, unknown>) => {
  return prisma.user.findMany({
    where: buildWhereClause(filters),
    select: { id: true, email: true, name: true, createdAt: true },
  });
};

export const create = async (data: CreateUserInput) => {
  return prisma.user.create({ data });
};
```

---

## Auth Pattern (JWT)

### Token Utils
```typescript
// server/utils/jwt.ts
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const signToken = async (payload: { userId: string; role: string }) => {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
};

export const verifyToken = async (token: string) => {
  const { payload } = await jose.jwtVerify(token, secret);
  return payload;
};
```

### Auth Middleware
```typescript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/server/utils/jwt';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = header.slice(7);
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Database Pattern (Prisma)

### Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### DB Client Singleton
```typescript
// server/utils/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## Frontend Data Fetching (TanStack Query)

```typescript
// client/services/user-service.ts
import ky from 'ky';
import type { User } from '@/shared/types/user';

const api = ky.create({ prefixUrl: '/api' });

export const getUsers = () => api.get('users').json<{ data: User[] }>();
export const getUser = (id: string) => api.get(`users/${id}`).json<{ data: User }>();
export const createUser = (data: CreateUserInput) => api.post('users', { json: data }).json<{ data: User }>();
```

```typescript
// client/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '@/client/services/user-service';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};
```

---

## Error Handling Pattern

### Global Error Handler
```typescript
// server/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '@/server/utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, path: req.path }, 'Request error');

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation error', details: err.errors });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
};
```

---

## Validation Pattern (Zod — shared)

```typescript
// shared/validators/user.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(100),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

### Validation Middleware
```typescript
// server/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
    }
    req.body = result.data;
    next();
  };
};
```

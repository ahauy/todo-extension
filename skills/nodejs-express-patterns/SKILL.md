---
name: nodejs-express-patterns
description: "Express.js best practices including routing, middleware, error handling, request validation, and production patterns."
origin: codex-project-template
---

# Node.js + Express Patterns Skill

Comprehensive guide for building scalable and maintainable Node.js applications with Express.js.

## When to Use

Invoke this skill:
- When building REST APIs with Express
- When designing API routes and middleware
- When handling errors and validation
- When structuring a Node.js project
- When implementing authentication/authorization
- When optimizing performance

## Project Structure

### Pattern 1: Layered Architecture

```
src/
├── routes/           # API routes
├── controllers/      # Business logic
├── services/         # Data access & external APIs
├── middleware/       # Express middleware
├── models/           # Database models
├── utils/            # Utilities & helpers
├── config/           # Configuration
├── types/            # TypeScript types
└── index.ts          # Entry point
```

### Pattern 2: Feature-Based Structure

```
src/
├── features/
│   ├── users/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── model.ts
│   │   └── types.ts
│   ├── posts/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── model.ts
│   │   └── types.ts
├── middleware/
├── utils/
└── index.ts
```

## Routing

### Pattern 1: Basic Routes

```typescript
import express from 'express'

const router = express.Router()

// GET
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

// POST
router.post('/users', (req, res) => {
  res.status(201).json({ id: 1, ...req.body })
})

// PUT
router.put('/users/:id', (req, res) => {
  res.json({ id: req.params.id, ...req.body })
})

// DELETE
router.delete('/users/:id', (req, res) => {
  res.status(204).send()
})

export default router
```

### Pattern 2: Route Organization

```typescript
// routes/index.ts
import express from 'express'
import userRoutes from './users'
import postRoutes from './posts'

const router = express.Router()

router.use('/users', userRoutes)
router.use('/posts', postRoutes)

export default router

// index.ts
import express from 'express'
import routes from './routes'

const app = express()

app.use('/api', routes)
```

### Pattern 3: Route Parameters

```typescript
// ✅ GOOD - Type-safe route parameters
router.get('/users/:id', (req, res) => {
  const userId = req.params.id
  // Validate userId
  if (!isValidId(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' })
  }
  res.json({ id: userId })
})

// ✅ GOOD - Query parameters
router.get('/users', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  res.json({ page, pageSize })
})
```

## Middleware

### Pattern 1: Custom Middleware

```typescript
// ✅ GOOD - Custom middleware
function requestLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.path}`)
  next()
}

app.use(requestLogger)
```

### Pattern 2: Authentication Middleware

```typescript
// ✅ GOOD - Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

app.use(authenticate)
```

### Pattern 3: Error Handling Middleware

```typescript
// ✅ GOOD - Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)

  if (err instanceof ValidationError) {
    return res.status(422).json({ error: err.message })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }

  res.status(500).json({ error: 'Internal server error' })
})
```

### Pattern 4: Middleware Chain

```typescript
// ✅ GOOD - Middleware chain
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(requestLogger)
app.use(authenticate)
app.use('/api', routes)
app.use(errorHandler)
```

## Request Validation

### Pattern 1: Input Validation

```typescript
import { body, param, query, validationResult } from 'express-validator'

// ✅ GOOD - Validate request body
router.post('/users',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }
    // Process valid request
  }
)

// ✅ GOOD - Validate route parameters
router.get('/users/:id',
  param('id').isInt(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // Process valid request
  }
)

// ✅ GOOD - Validate query parameters
router.get('/users',
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // Process valid request
  }
)
```

## Controllers

### Pattern 1: Controller Structure

```typescript
// ✅ GOOD - Controller with business logic
class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20

      const users = await UserService.getUsers(page, pageSize)
      res.json(users)
    } catch (error) {
      next(error)
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.createUser(req.body)
      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  }
}

export default new UserController()
```

### Pattern 2: Route with Controller

```typescript
// ✅ GOOD - Routes using controller
import UserController from './controller'

router.get('/users', UserController.getUsers)
router.get('/users/:id', UserController.getUserById)
router.post('/users', UserController.createUser)
```

## Services

### Pattern 1: Service Layer

```typescript
// ✅ GOOD - Service layer for business logic
class UserService {
  async getUsers(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize
    const users = await User.find().skip(skip).limit(pageSize)
    const total = await User.countDocuments()

    return {
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }

  async getUserById(id: string) {
    return User.findById(id)
  }

  async createUser(data: CreateUserInput) {
    // Validate
    if (await User.findOne({ email: data.email })) {
      throw new Error('Email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const user = new User({
      ...data,
      password: hashedPassword
    })

    return user.save()
  }

  async updateUser(id: string, data: UpdateUserInput) {
    return User.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteUser(id: string) {
    return User.findByIdAndDelete(id)
  }
}

export default new UserService()
```

## Error Handling

### Pattern 1: Custom Error Classes

```typescript
// ✅ GOOD - Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(422, 'VALIDATION_ERROR', message)
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message)
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, 'UNAUTHORIZED', message)
  }
}
```

### Pattern 2: Global Error Handler

```typescript
// ✅ GOOD - Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message
    })
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  })
})
```

## Async/Await Patterns

### Pattern 1: Async Route Handlers

```typescript
// ✅ GOOD - Async route handler
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
})

// ✅ GOOD - Wrapper for async handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    throw new NotFoundError('User not found')
  }
  res.json(user)
}))
```

## Environment Configuration

### Pattern 1: Configuration Management

```typescript
// ✅ GOOD - Environment configuration
interface Config {
  port: number
  nodeEnv: string
  dbUrl: string
  jwtSecret: string
  corsOrigin: string[]
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
}

export default config
```

## Production Patterns

### Pattern 1: Graceful Shutdown

```typescript
// ✅ GOOD - Graceful shutdown
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
```

### Pattern 2: Health Check

```typescript
// ✅ GOOD - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
```

## Common Mistakes

### ❌ Mistake 1: Not handling async errors
```typescript
// BAD
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id) // Error not caught!
  res.json(user)
})

// GOOD
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    res.json(user)
  } catch (error) {
    next(error)
  }
})
```

### ❌ Mistake 2: Mixing business logic in routes
```typescript
// BAD
router.post('/users', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10)
  const user = new User({ ...req.body, password: hashedPassword })
  await user.save()
  res.json(user)
})

// GOOD
router.post('/users', async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body)
    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
})
```

### ❌ Mistake 3: No input validation
```typescript
// BAD
router.post('/users', (req, res) => {
  const user = new User(req.body)
  user.save()
})

// GOOD
router.post('/users',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }
    // Process valid request
  }
)
```

## Checklist

- [ ] Project structure is organized (layered or feature-based)
- [ ] Routes are properly organized
- [ ] Middleware is used correctly
- [ ] Input validation is implemented
- [ ] Business logic is in services
- [ ] Error handling is comprehensive
- [ ] Async/await is used properly
- [ ] Environment configuration is managed
- [ ] Health check endpoint exists
- [ ] Graceful shutdown is implemented
- [ ] No hardcoded values
- [ ] Logging is implemented
- [ ] CORS is configured
- [ ] Authentication/authorization is implemented

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

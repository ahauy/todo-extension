---
name: testing-backend-jest
description: "Write unit, integration, and API tests for Node.js backends with Jest and Supertest. Covers setup, mocking, fixtures, and coverage requirements (80%+)."
origin: codex-project-template
---

# Backend Testing Skill (Jest + Supertest)

Comprehensive guide for testing Node.js applications with Jest and Supertest.

## When to Use

Invoke this skill:
- When writing unit tests for services and utilities
- When testing API endpoints
- When testing database operations
- When mocking external dependencies
- Before committing code (coverage must be ≥80%)
- When debugging test failures

## Setup

### Installation

```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D @testing-library/node
```

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

## Unit Testing

### Pattern 1: Service Testing

```typescript
// src/services/user.service.ts
export class UserService {
  async getUserById(id: string) {
    if (!id) throw new Error('ID is required')
    const user = await User.findById(id)
    if (!user) throw new Error('User not found')
    return user
  }

  async createUser(data: CreateUserInput) {
    if (await User.findOne({ email: data.email })) {
      throw new Error('Email already exists')
    }
    return User.create(data)
  }
}

// src/services/__tests__/user.service.test.ts
import { UserService } from '../user.service'
import { User } from '../../models/User'

jest.mock('../../models/User')

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    userService = new UserService()
    jest.clearAllMocks()
  })

  describe('getUserById', () => {
    it('should throw error if ID is not provided', async () => {
      await expect(userService.getUserById('')).rejects.toThrow('ID is required')
    })

    it('should throw error if user not found', async () => {
      jest.mocked(User.findById).mockResolvedValue(null)
      await expect(userService.getUserById('123')).rejects.toThrow('User not found')
    })

    it('should return user if found', async () => {
      const mockUser = { id: '123', name: 'John', email: 'john@example.com' }
      jest.mocked(User.findById).mockResolvedValue(mockUser)

      const result = await userService.getUserById('123')

      expect(result).toEqual(mockUser)
      expect(User.findById).toHaveBeenCalledWith('123')
    })
  })

  describe('createUser', () => {
    it('should throw error if email already exists', async () => {
      jest.mocked(User.findOne).mockResolvedValue({ id: '1', email: 'john@example.com' })

      await expect(
        userService.createUser({ email: 'john@example.com', name: 'John' })
      ).rejects.toThrow('Email already exists')
    })

    it('should create user if email is unique', async () => {
      jest.mocked(User.findOne).mockResolvedValue(null)
      const mockUser = { id: '123', name: 'John', email: 'john@example.com' }
      jest.mocked(User.create).mockResolvedValue(mockUser)

      const result = await userService.createUser({
        email: 'john@example.com',
        name: 'John'
      })

      expect(result).toEqual(mockUser)
      expect(User.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        name: 'John'
      })
    })
  })
})
```

### Pattern 2: Utility Testing

```typescript
// src/utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
}

// src/utils/__tests__/validation.test.ts
import { validateEmail, validatePassword } from '../validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true)
    })

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      expect(validatePassword('Password123')).toBe(true)
    })

    it('should return false if password is too short', () => {
      expect(validatePassword('Pass1')).toBe(false)
    })

    it('should return false if no uppercase letter', () => {
      expect(validatePassword('password123')).toBe(false)
    })

    it('should return false if no number', () => {
      expect(validatePassword('Password')).toBe(false)
    })
  })
})
```

## Integration Testing

### Pattern 1: API Endpoint Testing

```typescript
// src/routes/users.ts
import express from 'express'
import { UserController } from '../controllers/user.controller'

const router = express.Router()

router.get('/users/:id', UserController.getUserById)
router.post('/users', UserController.createUser)
router.put('/users/:id', UserController.updateUser)
router.delete('/users/:id', UserController.deleteUser)

export default router

// src/routes/__tests__/users.test.ts
import request from 'supertest'
import express from 'express'
import userRoutes from '../users'
import { UserService } from '../../services/user.service'

jest.mock('../../services/user.service')

const app = express()
app.use(express.json())
app.use('/api', userRoutes)

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/users/:id', () => {
    it('should return user if found', async () => {
      const mockUser = { id: '123', name: 'John', email: 'john@example.com' }
      jest.mocked(UserService.getUserById).mockResolvedValue(mockUser)

      const response = await request(app).get('/api/users/123')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockUser)
    })

    it('should return 404 if user not found', async () => {
      jest.mocked(UserService.getUserById).mockRejectedValue(new Error('User not found'))

      const response = await request(app).get('/api/users/999')

      expect(response.status).toBe(404)
    })

    it('should return 400 if ID is invalid', async () => {
      const response = await request(app).get('/api/users/invalid')

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      const newUser = { id: '123', name: 'John', email: 'john@example.com' }
      jest.mocked(UserService.createUser).mockResolvedValue(newUser)

      const response = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' })

      expect(response.status).toBe(201)
      expect(response.body).toEqual(newUser)
    })

    it('should return 422 if email is invalid', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'invalid-email' })

      expect(response.status).toBe(422)
    })

    it('should return 409 if email already exists', async () => {
      jest.mocked(UserService.createUser).mockRejectedValue(
        new Error('Email already exists')
      )

      const response = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' })

      expect(response.status).toBe(409)
    })
  })

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const updatedUser = { id: '123', name: 'Jane', email: 'jane@example.com' }
      jest.mocked(UserService.updateUser).mockResolvedValue(updatedUser)

      const response = await request(app)
        .put('/api/users/123')
        .send({ name: 'Jane' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(updatedUser)
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      jest.mocked(UserService.deleteUser).mockResolvedValue(undefined)

      const response = await request(app).delete('/api/users/123')

      expect(response.status).toBe(204)
    })
  })
})
```

### Pattern 2: Database Integration Testing

```typescript
// src/services/__tests__/user.service.integration.test.ts
import { UserService } from '../user.service'
import { User } from '../../models/User'
import { connectDB, disconnectDB } from '../../config/database'

describe('UserService Integration Tests', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({})
  })

  it('should create and retrieve user', async () => {
    const userService = new UserService()

    // Create user
    const created = await userService.createUser({
      name: 'John',
      email: 'john@example.com'
    })

    expect(created.id).toBeDefined()
    expect(created.email).toBe('john@example.com')

    // Retrieve user
    const retrieved = await userService.getUserById(created.id)

    expect(retrieved).toEqual(created)
  })

  it('should not create duplicate email', async () => {
    const userService = new UserService()

    await userService.createUser({
      name: 'John',
      email: 'john@example.com'
    })

    await expect(
      userService.createUser({
        name: 'Jane',
        email: 'john@example.com'
      })
    ).rejects.toThrow('Email already exists')
  })
})
```

## Mocking Patterns

### Pattern 1: Mock External API

```typescript
// src/services/payment.service.ts
import axios from 'axios'

export class PaymentService {
  async processPayment(amount: number, cardToken: string) {
    const response = await axios.post('https://api.stripe.com/charges', {
      amount,
      source: cardToken
    })
    return response.data
  }
}

// src/services/__tests__/payment.service.test.ts
import { PaymentService } from '../payment.service'
import axios from 'axios'

jest.mock('axios')

describe('PaymentService', () => {
  let paymentService: PaymentService

  beforeEach(() => {
    paymentService = new PaymentService()
    jest.clearAllMocks()
  })

  it('should process payment successfully', async () => {
    const mockResponse = { id: 'ch_123', amount: 1000, status: 'succeeded' }
    jest.mocked(axios.post).mockResolvedValue({ data: mockResponse })

    const result = await paymentService.processPayment(1000, 'tok_visa')

    expect(result).toEqual(mockResponse)
    expect(axios.post).toHaveBeenCalledWith('https://api.stripe.com/charges', {
      amount: 1000,
      source: 'tok_visa'
    })
  })

  it('should handle payment failure', async () => {
    jest.mocked(axios.post).mockRejectedValue(new Error('Card declined'))

    await expect(paymentService.processPayment(1000, 'tok_chargeDeclined')).rejects.toThrow(
      'Card declined'
    )
  })
})
```

### Pattern 2: Mock Database

```typescript
// src/services/__tests__/user.service.test.ts
import { UserService } from '../user.service'
import { User } from '../../models/User'

jest.mock('../../models/User')

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call User.findById', async () => {
    const mockUser = { id: '123', name: 'John' }
    jest.mocked(User.findById).mockResolvedValue(mockUser)

    const userService = new UserService()
    const result = await userService.getUserById('123')

    expect(result).toEqual(mockUser)
    expect(User.findById).toHaveBeenCalledWith('123')
  })
})
```

### Pattern 3: Mock Timers

```typescript
// src/utils/scheduler.ts
export function scheduleTask(callback: () => void, delayMs: number) {
  setTimeout(callback, delayMs)
}

// src/utils/__tests__/scheduler.test.ts
import { scheduleTask } from '../scheduler'

describe('Scheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should call callback after delay', () => {
    const callback = jest.fn()

    scheduleTask(callback, 1000)

    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
```

## Fixtures & Test Data

### Pattern 1: Fixtures

```typescript
// src/__tests__/fixtures/user.fixtures.ts
export const userFixtures = {
  validUser: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123'
  },
  adminUser: {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Password123',
    role: 'admin'
  },
  invalidUser: {
    name: '',
    email: 'invalid-email',
    password: 'short'
  }
}

// Usage in tests
import { userFixtures } from '../fixtures/user.fixtures'

it('should create user with valid data', async () => {
  const result = await userService.createUser(userFixtures.validUser)
  expect(result).toBeDefined()
})
```

### Pattern 2: Test Builders

```typescript
// src/__tests__/builders/user.builder.ts
export class UserBuilder {
  private user = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  }

  withName(name: string) {
    this.user.name = name
    return this
  }

  withEmail(email: string) {
    this.user.email = email
    return this
  }

  withRole(role: string) {
    this.user.role = role
    return this
  }

  build() {
    return { ...this.user }
  }
}

// Usage in tests
it('should create admin user', async () => {
  const adminUser = new UserBuilder()
    .withRole('admin')
    .withEmail('admin@example.com')
    .build()

  const result = await userService.createUser(adminUser)
  expect(result.role).toBe('admin')
})
```

## Coverage Requirements

### Target: 80% minimum

**Coverage breakdown:**
- **Lines**: 80% — most code paths executed
- **Functions**: 80% — all functions called at least once
- **Branches**: 80% — if/else paths tested
- **Statements**: 80% — all statements executed

**Check coverage:**
```bash
npm run test:coverage
```

## Common Mistakes

### ❌ Mistake 1: Not clearing mocks
```typescript
// BAD
describe('Tests', () => {
  it('test 1', () => {
    jest.mocked(User.findById).mockResolvedValue(user1)
  })

  it('test 2', () => {
    // Mock from test 1 still active!
  })
})

// GOOD
describe('Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('test 1', () => {
    jest.mocked(User.findById).mockResolvedValue(user1)
  })

  it('test 2', () => {
    // Mocks cleared
  })
})
```

### ❌ Mistake 2: Testing implementation details
```typescript
// BAD
it('should call User.findById', () => {
  userService.getUserById('123')
  expect(User.findById).toHaveBeenCalled()
})

// GOOD
it('should return user', async () => {
  const result = await userService.getUserById('123')
  expect(result).toEqual(expectedUser)
})
```

### ❌ Mistake 3: Not testing error cases
```typescript
// BAD
it('should get user', async () => {
  const result = await userService.getUserById('123')
  expect(result).toBeDefined()
})

// GOOD
it('should get user', async () => {
  const result = await userService.getUserById('123')
  expect(result).toBeDefined()
})

it('should throw error if user not found', async () => {
  await expect(userService.getUserById('999')).rejects.toThrow()
})
```

### ❌ Mistake 4: Async tests without await
```typescript
// BAD
it('should create user', () => {
  userService.createUser(data) // Not awaited!
  expect(User.create).toHaveBeenCalled()
})

// GOOD
it('should create user', async () => {
  await userService.createUser(data)
  expect(User.create).toHaveBeenCalled()
})
```

## Checklist

- [ ] All tests pass: `npm run test`
- [ ] Coverage ≥80%: `npm run test:coverage`
- [ ] Mocks are properly cleared between tests
- [ ] Error cases are tested
- [ ] Integration tests use real database
- [ ] Unit tests use mocks
- [ ] Fixtures are used for test data
- [ ] Async operations are awaited
- [ ] No skipped tests (`.skip`, `.only`)
- [ ] Tests describe behavior, not implementation

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

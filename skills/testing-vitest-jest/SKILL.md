---
name: testing-vitest-jest
description: "Write unit, integration, and component tests with Vitest + React Testing Library. Covers setup, mocking patterns, async testing, and coverage requirements (80%+)."
origin: codex-project-template
---

# Testing Skill (Vitest + React Testing Library)

Comprehensive guide for writing tests in React projects using **Vitest** and **React Testing Library**.

## When to Use

Invoke this skill:
- When writing unit tests for components, hooks, or utilities
- When testing async operations (API calls, timers)
- When mocking external dependencies (API, modules, timers)
- Before committing code (coverage must be ≥80%)
- When debugging test failures

## Setup

### Installation
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/coverage-v8 jsdom
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### src/test/setup.ts
```typescript
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### package.json scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Testing Patterns

### Pattern 1: Component Testing

**Basic component test:**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const { user } = render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

**Component with state:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Counter } from '@/components/Counter'

describe('Counter', () => {
  it('increments count on button click', async () => {
    const user = userEvent.setup()
    render(<Counter />)
    
    const button = screen.getByRole('button', { name: /increment/i })
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
    
    await user.click(button)
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
    
    await user.click(button)
    expect(screen.getByText('Count: 2')).toBeInTheDocument()
  })
})
```

### Pattern 2: Hook Testing

**Using @testing-library/react hooks:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCounter } from '@/hooks/useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('increments count', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })

  it('accepts initial value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })
})
```

### Pattern 3: Async Testing

**Testing async operations:**
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UserProfile } from '@/components/UserProfile'

describe('UserProfile', () => {
  it('loads and displays user data', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' }
    
    vi.mock('@/api/users', () => ({
      fetchUser: vi.fn().mockResolvedValue(mockUser),
    }))

    render(<UserProfile userId={1} />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    vi.mock('@/api/users', () => ({
      fetchUser: vi.fn().mockRejectedValue(new Error('API Error')),
    }))

    render(<UserProfile userId={1} />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### Pattern 4: Mocking

**Mock modules:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { getUserData } from '@/services/api'

vi.mock('@/services/api', () => ({
  getUserData: vi.fn().mockResolvedValue({ id: 1, name: 'John' }),
}))

describe('API calls', () => {
  it('fetches user data', async () => {
    const data = await getUserData(1)
    expect(data).toEqual({ id: 1, name: 'John' })
  })
})
```

**Mock timers:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  it('debounces value changes', () => {
    vi.useFakeTimers()
    
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )
    
    expect(result.current).toBe('initial')
    
    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')
    
    vi.advanceTimersByTime(500)
    expect(result.current).toBe('updated')
    
    vi.useRealTimers()
  })
})
```

**Mock window/DOM:**
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('Window API', () => {
  it('mocks localStorage', () => {
    const store: Record<string, string> = {}
    
    const mockLocalStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value }),
      removeItem: vi.fn((key) => { delete store[key] }),
      clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]) }),
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    })
    
    window.localStorage.setItem('key', 'value')
    expect(window.localStorage.getItem('key')).toBe('value')
  })
})
```

### Pattern 5: Integration Testing

**Testing component + hook + API together:**
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SearchUsers } from '@/components/SearchUsers'

describe('SearchUsers Integration', () => {
  it('searches and displays results', async () => {
    const user = userEvent.setup()
    
    vi.mock('@/api/users', () => ({
      searchUsers: vi.fn().mockResolvedValue([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]),
    }))

    render(<SearchUsers />)
    
    const input = screen.getByPlaceholderText(/search/i)
    await user.type(input, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })
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

**Coverage report:**
```
File                    | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|----------
All files           |   85.2  |   82.1   |   88.5  |   85.2
 src/components     |   90.0  |   85.0   |   92.0  |   90.0
 src/hooks          |   82.0  |   80.0   |   85.0  |   82.0
 src/utils          |   78.0  |   75.0   |   80.0  |   78.0
```

### What NOT to test
- Third-party library internals
- Implementation details (test behavior, not code)
- Styling/CSS (use visual regression tests instead)
- Console logs (unless critical)

### What TO test
- User interactions (clicks, typing, form submission)
- State changes and side effects
- Error handling and edge cases
- API integration (with mocks)
- Hook logic and custom hooks

## Common Mistakes

### ❌ Mistake 1: Testing implementation details
```typescript
// BAD
it('sets state to true', () => {
  const { result } = renderHook(() => useState(false))
  act(() => result.current[1](true))
  expect(result.current[0]).toBe(true) // Testing internals
})

// GOOD
it('displays success message when form submits', async () => {
  render(<Form />)
  await user.click(screen.getByRole('button', { name: /submit/i }))
  expect(screen.getByText(/success/i)).toBeInTheDocument()
})
```

### ❌ Mistake 2: Not waiting for async operations
```typescript
// BAD
it('loads data', async () => {
  render(<DataLoader />)
  expect(screen.getByText('Data')).toBeInTheDocument() // Fails! Data not loaded yet
})

// GOOD
it('loads data', async () => {
  render(<DataLoader />)
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument()
  })
})
```

### ❌ Mistake 3: Over-mocking
```typescript
// BAD
vi.mock('@/components/Button') // Don't mock components you're testing!

// GOOD
vi.mock('@/api/users') // Mock external dependencies only
```

### ❌ Mistake 4: Not cleaning up
```typescript
// BAD
it('test 1', () => { /* ... */ })
it('test 2', () => { /* ... */ }) // May fail due to test 1 state

// GOOD - setup.ts handles cleanup automatically
// But if you create custom state, clean it up:
afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})
```

## Checklist Before Commit

- [ ] All tests pass: `npm run test`
- [ ] Coverage ≥80%: `npm run test:coverage`
- [ ] No console errors or warnings
- [ ] No skipped tests (`.skip`, `.only`)
- [ ] Mocks are properly cleaned up
- [ ] Async operations use `waitFor` or `act`
- [ ] User interactions use `userEvent` (not `fireEvent`)
- [ ] Tests describe user behavior, not implementation

## Debugging Tests

**Run single test file:**
```bash
npm run test -- src/components/Button.test.tsx
```

**Run tests matching pattern:**
```bash
npm run test -- --grep "Button"
```

**Debug mode (with UI):**
```bash
npm run test:ui
```

**Watch mode:**
```bash
npm run test:watch
```

**Verbose output:**
```bash
npm run test -- --reporter=verbose
```

## Resources

- [Vitest Docs](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

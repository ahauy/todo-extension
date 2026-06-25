---
name: error-handling
description: "Error handling best practices including try/catch patterns, error boundaries, error logging, monitoring, and user-facing error messages."
origin: codex-project-template
---

# Error Handling Skill

Comprehensive guide for handling errors gracefully in **React frontend** applications.

> **Scope:** Frontend (React) only. For backend error handling in Express/Node.js, see `skills/nodejs-express-patterns/SKILL.md` — it covers Express error middleware, custom error classes, and async handler patterns.

## When to Use

Invoke this skill:
- When writing async operations (API calls, timers)
- When handling user input and validation
- When building error boundaries for components
- When setting up error logging and monitoring
- When designing error messages for users
- When debugging production errors

## Error Types

### 1. Synchronous Errors (try/catch)

**Thrown immediately during execution:**
```typescript
// Parsing errors
const data = JSON.parse(invalidJson) // throws SyntaxError

// Type errors
const result = null.property // throws TypeError

// Range errors
const arr = new Array(-1) // throws RangeError
```

### 2. Asynchronous Errors (Promise rejection)

**Thrown during async operations:**
```typescript
// API call fails
const response = await fetch('/api/users')
const data = await response.json() // might throw

// Timeout
const result = await Promise.race([
  fetch('/api/data'),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
])
```

### 3. React Component Errors

**Thrown during render:**
```typescript
// Null reference in render
function Component({ user }) {
  return <div>{user.name}</div> // Error if user is null
}

// Invalid state
function Component() {
  const [count, setCount] = useState('not a number')
  return <div>{count + 1}</div> // NaN error
}
```

## Try/Catch Patterns

### Pattern 1: Basic Try/Catch

```typescript
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const user = await response.json()
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw error // Re-throw for caller to handle
  }
}
```

### Pattern 2: Specific Error Handling

```typescript
async function processPayment(amount: number) {
  try {
    const result = await stripe.charge(amount)
    return result
  } catch (error) {
    if (error instanceof StripeError) {
      // Handle Stripe-specific errors
      if (error.code === 'card_declined') {
        throw new Error('Your card was declined. Please try another.')
      }
      if (error.code === 'insufficient_funds') {
        throw new Error('Insufficient funds. Please add money to your account.')
      }
    } else if (error instanceof NetworkError) {
      // Handle network errors
      throw new Error('Network error. Please check your connection.')
    } else {
      // Handle unknown errors
      throw new Error('Payment failed. Please try again later.')
    }
  }
}
```

### Pattern 3: Cleanup with Finally

```typescript
async function uploadFile(file: File) {
  let uploadId: string | null = null
  
  try {
    uploadId = await startUpload(file)
    const result = await completeUpload(uploadId)
    return result
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  } finally {
    // Always cleanup, even if error occurred
    if (uploadId) {
      await cancelUpload(uploadId)
    }
  }
}
```

### Pattern 4: Retry Logic

```typescript
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error as Error
      console.warn(`Attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('All retries failed')
}
```

### Pattern 5: Error Wrapping

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
  }
}

async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      throw new AppError(
        'FETCH_FAILED',
        `Failed to fetch user: ${response.statusText}`,
        response.status
      )
    }
    return await response.json()
  } catch (error) {
    if (error instanceof AppError) {
      throw error // Already wrapped
    }
    throw new AppError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      500,
      error as Error
    )
  }
}
```

## React Error Boundaries

### Pattern 1: Class Component Error Boundary

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: Error, retry: () => void) => React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)
    logErrorToService(error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) || (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>{this.state.error.message}</p>
            <button onClick={this.retry}>Try again</button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Usage
<ErrorBoundary
  fallback={(error, retry) => (
    <div>
      <h2>Error: {error.message}</h2>
      <button onClick={retry}>Retry</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

### Pattern 2: Functional Error Boundary (with hook)

```typescript
// useErrorHandler hook
function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    logErrorToService(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  if (error) {
    throw error // Throw to nearest Error Boundary
  }

  return { handleError, clearError }
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { handleError } = useErrorHandler()
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [userId, handleError])

  if (loading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return <div>{user.name}</div>
}
```

### Pattern 3: Granular Error Boundaries

```typescript
// Separate error boundaries for different sections
function App() {
  return (
    <div>
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>

      <ErrorBoundary>
        <Footer />
      </ErrorBoundary>
    </div>
  )
}
```

## Error Logging & Monitoring

### Pattern 1: Centralized Error Logger

```typescript
interface ErrorLog {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  code?: string
  stack?: string
  context?: Record<string, any>
  userId?: string
  url?: string
  userAgent?: string
}

class ErrorLogger {
  private static instance: ErrorLogger

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  log(error: Error, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
      userId: getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(errorLog)
    }

    // Send to error tracking service
    this.sendToService(errorLog)
  }

  private sendToService(errorLog: ErrorLog) {
    // Send to Sentry, LogRocket, etc.
    fetch('/api/logs/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog),
    }).catch(err => {
      // Silently fail if logging fails
      console.error('Failed to log error:', err)
    })
  }
}

// Usage
const logger = ErrorLogger.getInstance()
logger.log(error, { userId: 123, action: 'fetchUser' })
```

### Pattern 2: Sentry Integration

```typescript
import * as Sentry from "@sentry/react"

// Initialize Sentry
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})

// Wrap app
export default Sentry.withProfiler(App)

// Capture errors
try {
  await fetchUser(id)
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'user-profile' },
    extra: { userId: id },
  })
}
```

### Pattern 3: Error Tracking with Context

```typescript
interface ErrorContext {
  userId?: string
  sessionId?: string
  feature?: string
  action?: string
  metadata?: Record<string, any>
}

class ContextualErrorLogger {
  private context: ErrorContext = {}

  setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context }
  }

  clearContext() {
    this.context = {}
  }

  log(error: Error) {
    const fullLog = {
      error: error.message,
      stack: error.stack,
      ...this.context,
      timestamp: new Date().toISOString(),
    }

    console.error(fullLog)
    this.sendToService(fullLog)
  }

  private sendToService(log: any) {
    // Send to backend
  }
}

// Usage
const errorLogger = new ContextualErrorLogger()

// Set context when user logs in
errorLogger.setContext({ userId: user.id, sessionId: generateId() })

// Set context when entering feature
errorLogger.setContext({ feature: 'checkout' })

// Log error with full context
try {
  await processPayment()
} catch (error) {
  errorLogger.log(error as Error)
}
```

## User-Facing Error Messages

### Pattern 1: Error Message Mapping

```typescript
interface UserFriendlyError {
  title: string
  message: string
  action?: string
  actionLabel?: string
}

function getUserFriendlyError(error: Error): UserFriendlyError {
  // Network errors
  if (error.message.includes('Failed to fetch')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      action: 'retry',
      actionLabel: 'Try Again',
    }
  }

  // Timeout errors
  if (error.message.includes('Timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      action: 'retry',
      actionLabel: 'Retry',
    }
  }

  // Validation errors
  if (error instanceof ValidationError) {
    return {
      title: 'Invalid Input',
      message: error.message,
    }
  }

  // Authentication errors
  if (error.message.includes('401')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      action: 'login',
      actionLabel: 'Log In',
    }
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again later.',
    action: 'retry',
    actionLabel: 'Try Again',
  }
}
```

### Pattern 2: Error Toast Component

```typescript
interface ErrorToastProps {
  error: Error
  onRetry?: () => void
  onDismiss?: () => void
}

function ErrorToast({ error, onRetry, onDismiss }: ErrorToastProps) {
  const userError = getUserFriendlyError(error)

  return (
    <div className="error-toast">
      <div className="error-toast__content">
        <h3>{userError.title}</h3>
        <p>{userError.message}</p>
      </div>
      <div className="error-toast__actions">
        {userError.action === 'retry' && onRetry && (
          <button onClick={onRetry}>{userError.actionLabel}</button>
        )}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  )
}
```

### Pattern 3: Form Validation Errors

```typescript
interface FormErrors {
  [field: string]: string
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.password) {
    errors.password = 'Password is required'
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  return errors
}

// Usage in component
function LoginForm() {
  const [errors, setErrors] = React.useState<FormErrors>({})

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const errors = validateForm(Object.fromEntries(formData))

    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }

    // Submit form
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <span className="error">{errors.email}</span>}

      <input name="password" type="password" />
      {errors.password && <span className="error">{errors.password}</span>}

      <button type="submit">Login</button>
    </form>
  )
}
```

## Common Patterns

### ✅ DO: Catch specific errors
```typescript
try {
  await fetchData()
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network error
  } else if (error instanceof ValidationError) {
    // Handle validation error
  }
}
```

### ❌ DON'T: Catch all errors silently
```typescript
try {
  await fetchData()
} catch (error) {
  // Silent failure — bad!
}
```

### ✅ DO: Provide context in error logs
```typescript
logger.log(error, {
  userId: user.id,
  action: 'fetchUser',
  timestamp: Date.now(),
})
```

### ❌ DON'T: Log errors without context
```typescript
console.error(error) // No context
```

### ✅ DO: Show user-friendly messages
```typescript
const userError = getUserFriendlyError(error)
showToast(userError.message)
```

### ❌ DON'T: Show technical errors to users
```typescript
showToast(error.message) // "TypeError: Cannot read property 'name' of undefined"
```

### ✅ DO: Use error boundaries for component errors
```typescript
<ErrorBoundary>
  <UserProfile />
</ErrorBoundary>
```

### ❌ DON'T: Let component errors crash the app
```typescript
// No error boundary — entire app crashes
<UserProfile />
```

## Checklist

- [ ] All async operations have try/catch
- [ ] Errors are logged with context
- [ ] Error boundaries wrap major sections
- [ ] User-facing errors are friendly and actionable
- [ ] Sensitive data is not logged
- [ ] Retry logic is implemented for transient errors
- [ ] Error monitoring service is configured
- [ ] Form validation errors are clear
- [ ] Network errors are handled gracefully
- [ ] Error messages guide users to resolution

## Resources

- [MDN: Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Documentation](https://docs.sentry.io/)
- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)

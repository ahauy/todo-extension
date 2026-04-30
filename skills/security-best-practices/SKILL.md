---
name: security-best-practices
description: "Security best practices including authentication, authorization, CORS/CSRF protection, secrets management, XSS prevention, and OWASP Top 10."
origin: codex-project-template
---

# Security Best Practices Skill

Comprehensive guide for building secure web applications and protecting against common vulnerabilities.

> **Scope:** Deep-dive security patterns (auth implementation, CORS config, XSS prevention, secrets management). For HTTP-level API auth patterns (Bearer tokens, status codes, rate limit headers), see `skills/api-design/SKILL.md`.

## When to Use

Invoke this skill:
- When handling user authentication
- When managing sensitive data
- When building APIs
- When handling user input
- Before production deployment
- When conducting security audits
- When integrating third-party services

## OWASP Top 10 (2021)

| # | Vulnerability | Impact | Prevention |
|---|---|---|---|
| 1 | Broken Access Control | Unauthorized access | Implement proper authorization |
| 2 | Cryptographic Failures | Data exposure | Use HTTPS, encrypt sensitive data |
| 3 | Injection | Data theft, code execution | Parameterized queries, input validation |
| 4 | Insecure Design | System compromise | Threat modeling, secure design |
| 5 | Security Misconfiguration | Unauthorized access | Secure defaults, minimal exposure |
| 6 | Vulnerable Components | System compromise | Keep dependencies updated |
| 7 | Authentication Failures | Account takeover | Strong auth, MFA, secure sessions |
| 8 | Data Integrity Failures | Data manipulation | Verify data integrity, use signatures |
| 9 | Logging Failures | Undetected attacks | Comprehensive logging, monitoring |
| 10 | SSRF | Server compromise | Validate URLs, restrict outbound |

## Authentication

### Pattern 1: Password Security

```typescript
// ❌ BAD - Storing plain passwords
const user = {
  email: 'user@example.com',
  password: 'mypassword123' // NEVER store plain text!
}

// ✅ GOOD - Hash passwords with bcrypt
import bcrypt from 'bcrypt'

async function registerUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = {
    email,
    password: hashedPassword // Store hash only
  }
  return user
}

async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
```

### Pattern 2: JWT Authentication

```typescript
// ✅ GOOD - JWT token authentication
import jwt from 'jsonwebtoken'

function generateToken(userId: string) {
  return jwt.sign(
    { userId, iat: Date.now() },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Usage
const token = generateToken('user123')
const decoded = verifyToken(token)
```

### Pattern 3: Session Security

```typescript
// ✅ GOOD - Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JavaScript access
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
```

### Pattern 4: Multi-Factor Authentication (MFA)

```typescript
// ✅ GOOD - TOTP-based MFA
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

async function setupMFA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${userId})`,
    issuer: 'MyApp'
  })

  // Generate QR code for user to scan
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

  return { secret: secret.base32, qrCode }
}

function verifyMFA(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  })
}
```

## Authorization

### Pattern 1: Role-Based Access Control (RBAC)

```typescript
// ✅ GOOD - Role-based authorization
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

// Usage
app.delete('/api/users/:id', requireRole(Role.ADMIN), deleteUser)
```

### Pattern 2: Permission-Based Access Control (PBAC)

```typescript
// ✅ GOOD - Permission-based authorization
interface User {
  id: string
  permissions: string[]
}

function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

// Usage
app.post('/api/posts', requirePermission('create:post'), createPost)
app.delete('/api/posts/:id', requirePermission('delete:post'), deletePost)
```

### Pattern 3: Resource-Level Authorization

```typescript
// ✅ GOOD - Check resource ownership
async function updatePost(req: Request, res: Response) {
  const post = await Post.findById(req.params.id)

  // Check if user owns the post
  if (post.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Update post
  post.title = req.body.title
  await post.save()
  res.json(post)
}
```

## CORS & CSRF Protection

### Pattern 1: CORS Configuration

```typescript
// ✅ GOOD - Secure CORS configuration
import cors from 'cors'

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// ❌ BAD - Allow all origins
app.use(cors({ origin: '*' }))
```

### Pattern 2: CSRF Token

```typescript
// ✅ GOOD - CSRF token protection
import csrf from 'csurf'

const csrfProtection = csrf({ cookie: false })

// Generate token
app.get('/form', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// Verify token
app.post('/form', csrfProtection, (req, res) => {
  // Token is automatically verified
  res.json({ success: true })
})
```

### Pattern 3: SameSite Cookie

```typescript
// ✅ GOOD - SameSite cookie attribute
app.use(session({
  cookie: {
    sameSite: 'strict', // Prevent CSRF
    secure: true,       // HTTPS only
    httpOnly: true      // No JavaScript access
  }
}))
```

## Secrets Management

### Pattern 1: Environment Variables

```typescript
// ✅ GOOD - Use environment variables
const dbPassword = process.env.DB_PASSWORD
const apiKey = process.env.API_KEY
const jwtSecret = process.env.JWT_SECRET

// ❌ BAD - Hardcoded secrets
const dbPassword = 'password123'
const apiKey = 'sk_live_abc123'
```

### Pattern 2: .env File

```bash
# ✅ GOOD - .env file (never commit!)
DB_PASSWORD=secure_password_123
API_KEY=sk_live_abc123def456
JWT_SECRET=my_jwt_secret_key

# .gitignore
.env
.env.local
.env.*.local
```

### Pattern 3: Secrets Vault

```typescript
// ✅ GOOD - Use secrets vault (AWS Secrets Manager, HashiCorp Vault)
import AWS from 'aws-sdk'

const secretsManager = new AWS.SecretsManager()

async function getSecret(secretName: string) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise()
  return JSON.parse(data.SecretString!)
}

// Usage
const dbPassword = await getSecret('db-password')
```

## Input Validation & Sanitization

### Pattern 1: Input Validation

```typescript
// ✅ GOOD - Validate input
import { body, validationResult } from 'express-validator'

app.post('/api/users',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }
    // Process valid input
  }
)
```

### Pattern 2: SQL Injection Prevention

```typescript
// ❌ BAD - SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`
db.query(query)

// ✅ GOOD - Parameterized query
const query = 'SELECT * FROM users WHERE email = ?'
db.query(query, [email])

// ✅ GOOD - ORM (Prisma)
const user = await prisma.user.findUnique({
  where: { email }
})
```

### Pattern 3: XSS Prevention

```typescript
// ❌ BAD - XSS vulnerability
app.get('/user/:id', (req, res) => {
  const userId = req.params.id
  res.send(`<h1>User: ${userId}</h1>`) // Vulnerable!
})

// ✅ GOOD - Escape output
import escapeHtml from 'escape-html'

app.get('/user/:id', (req, res) => {
  const userId = req.params.id
  res.send(`<h1>User: ${escapeHtml(userId)}</h1>`)
})

// ✅ GOOD - Use templating engine
app.get('/user/:id', (req, res) => {
  res.render('user', { userId: req.params.id }) // Auto-escaped
})
```

### Pattern 4: HTML Sanitization

```typescript
// ✅ GOOD - Sanitize HTML
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHTML(html: string) {
  return DOMPurify.sanitize(html)
}

// Usage
const cleanHTML = sanitizeHTML(userInput)
```

## Secure Headers

### Pattern 1: Security Headers

```typescript
// ✅ GOOD - Set security headers
import helmet from 'helmet'

app.use(helmet())

// Or manually
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  next()
})
```

### Pattern 2: Content Security Policy (CSP)

```typescript
// ✅ GOOD - CSP header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  )
  next()
})
```

## HTTPS & TLS

### Pattern 1: Force HTTPS

```typescript
// ✅ GOOD - Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`)
  } else {
    next()
  }
})
```

### Pattern 2: HSTS Header

```typescript
// ✅ GOOD - HSTS header
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  next()
})
```

## Dependency Security

### Pattern 1: Check for Vulnerabilities

```bash
# ✅ GOOD - Check dependencies
npm audit
npm audit fix

# Or use Snyk
npx snyk test
```

### Pattern 2: Keep Dependencies Updated

```bash
# ✅ GOOD - Update dependencies
npm outdated
npm update
npm install -g npm-check-updates
ncu -u
```

## Logging & Monitoring

### Pattern 1: Secure Logging

```typescript
// ✅ GOOD - Log security events
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Log security events
logger.warn('Failed login attempt', { email, ip: req.ip })
logger.error('Unauthorized access attempt', { userId, resource: req.path })

// ❌ BAD - Don't log sensitive data
logger.info('User login', { email, password }) // NEVER log passwords!
```

### Pattern 2: Error Handling

```typescript
// ✅ GOOD - Don't expose sensitive errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })

  // Send generic error to client
  res.status(500).json({
    error: 'An unexpected error occurred'
  })

  // ❌ BAD - Expose error details
  res.status(500).json({
    error: err.message,
    stack: err.stack
  })
})
```

## Common Mistakes

### ❌ Mistake 1: Storing plain passwords
```typescript
// BAD
user.password = 'mypassword123'

// GOOD
user.password = await bcrypt.hash('mypassword123', 10)
```

### ❌ Mistake 2: Hardcoded secrets
```typescript
// BAD
const apiKey = 'sk_live_abc123'

// GOOD
const apiKey = process.env.API_KEY
```

### ❌ Mistake 3: No input validation
```typescript
// BAD
app.post('/api/users', (req, res) => {
  const user = { email: req.body.email }
})

// GOOD
app.post('/api/users',
  body('email').isEmail(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }
  }
)
```

### ❌ Mistake 4: Allowing all CORS origins
```typescript
// BAD
app.use(cors({ origin: '*' }))

// GOOD
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',')
}))
```

### ❌ Mistake 5: No HTTPS
```typescript
// BAD
http://example.com

// GOOD
https://example.com
```

## Checklist

- [ ] Passwords are hashed (bcrypt, Argon2)
- [ ] Authentication is implemented (JWT, sessions)
- [ ] Authorization is enforced (RBAC, PBAC)
- [ ] CORS is configured securely
- [ ] CSRF protection is enabled
- [ ] Secrets are in environment variables
- [ ] Input is validated and sanitized
- [ ] SQL injection is prevented (parameterized queries)
- [ ] XSS is prevented (escaping, sanitization)
- [ ] Security headers are set (CSP, HSTS, etc.)
- [ ] HTTPS is enforced
- [ ] Dependencies are up to date
- [ ] Error messages don't expose sensitive info
- [ ] Security events are logged
- [ ] No hardcoded secrets in code
- [ ] No sensitive data in logs

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js](https://helmetjs.github.io/)

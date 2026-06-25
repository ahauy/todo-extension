---
name: api-design
description: "API design best practices including REST principles, request/response structure, error handling, versioning, authentication, and frontend integration."
origin: codex-project-template
---

# API Design Skill

Comprehensive guide for designing RESTful APIs that are intuitive, maintainable, and easy to integrate with frontend applications.

## When to Use

Invoke this skill:
- When designing new API endpoints
- When integrating frontend with backend
- When reviewing API contracts
- When building internal APIs
- When planning API versioning
- When designing error responses

## REST Principles

### Resource-Oriented Design

**Core Concept:** APIs should be organized around resources, not actions.

```typescript
// ❌ BAD - Action-oriented
GET /api/getUsers
POST /api/createUser
PUT /api/updateUser
DELETE /api/removeUser

// ✅ GOOD - Resource-oriented
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|-----------|------|
| **GET** | Retrieve resource | Yes | Yes |
| **POST** | Create resource | No | No |
| **PUT** | Replace resource | Yes | No |
| **PATCH** | Partial update | No | No |
| **DELETE** | Delete resource | Yes | No |

```typescript
// ✅ GOOD - Correct HTTP methods
GET /api/users/123           // Retrieve user
POST /api/users              // Create user
PUT /api/users/123           // Replace user
PATCH /api/users/123         // Update user
DELETE /api/users/123        // Delete user
```

## Request/Response Structure

### Pattern 1: Standard Response Format

```typescript
// ✅ GOOD - Consistent response structure
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Pattern 2: List Response with Pagination

```typescript
// ✅ GOOD - Paginated list response
{
  "data": [
    { "id": "1", "name": "User 1" },
    { "id": "2", "name": "User 2" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Pattern 3: Request Body

```typescript
// ✅ GOOD - Clear request structure
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

### Pattern 4: Query Parameters

```typescript
// ✅ GOOD - Query parameters for filtering/sorting
GET /api/users?page=1&pageSize=20&role=admin&sort=-createdAt

// Breakdown:
// page=1           - Page number
// pageSize=20      - Items per page
// role=admin       - Filter by role
// sort=-createdAt  - Sort by createdAt descending
```

## HTTP Status Codes

### Success Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| **200** | OK | GET, PUT, PATCH successful |
| **201** | Created | POST successful |
| **204** | No Content | DELETE successful |

```typescript
// ✅ GOOD - Correct status codes
GET /api/users/123 → 200 OK
POST /api/users → 201 Created
PUT /api/users/123 → 200 OK
DELETE /api/users/123 → 204 No Content
```

### Client Error Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| **400** | Bad Request | Invalid input |
| **401** | Unauthorized | Missing/invalid auth |
| **403** | Forbidden | Authenticated but no permission |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists |
| **422** | Unprocessable Entity | Validation failed |
| **429** | Too Many Requests | Rate limited |

```typescript
// ✅ GOOD - Correct error status codes
POST /api/users (invalid email) → 422 Unprocessable Entity
GET /api/users/999 (not found) → 404 Not Found
DELETE /api/users/123 (no permission) → 403 Forbidden
POST /api/users (rate limited) → 429 Too Many Requests
```

### Server Error Codes

| Code | Meaning |
|------|---------|
| **500** | Internal Server Error |
| **502** | Bad Gateway |
| **503** | Service Unavailable |

## Error Response Format

### Pattern 1: Consistent Error Format

```typescript
// ❌ BAD - Inconsistent errors
{ "error": "User not found" }
{ "message": "Invalid email" }
{ "status": "error", "data": "Something went wrong" }

// ✅ GOOD - Consistent error format
{
  "code": "USER_NOT_FOUND",
  "message": "User with ID 123 not found",
  "status": 404,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pattern 2: Validation Errors

```typescript
// ✅ GOOD - Detailed validation errors
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "status": 422,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_EMAIL"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "code": "PASSWORD_TOO_SHORT"
    }
  ]
}
```

### Pattern 3: Error Codes Reference

```typescript
// ✅ GOOD - Consistent error codes
{
  "USER_NOT_FOUND": "User does not exist",
  "INVALID_EMAIL": "Email format is invalid",
  "PASSWORD_TOO_SHORT": "Password must be at least 8 characters",
  "DUPLICATE_EMAIL": "Email already registered",
  "UNAUTHORIZED": "Authentication required",
  "FORBIDDEN": "You don't have permission",
  "RATE_LIMITED": "Too many requests, please try again later",
  "INTERNAL_ERROR": "An unexpected error occurred"
}
```

## Pagination

### Pattern 1: Offset-Based Pagination

```typescript
// ✅ GOOD - Offset pagination
GET /api/users?page=2&pageSize=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### Pattern 2: Cursor-Based Pagination

```typescript
// ✅ GOOD - Cursor pagination (better for large datasets)
GET /api/users?cursor=abc123&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "cursor": "xyz789",
    "hasNextPage": true,
    "limit": 20
  }
}

// Next request
GET /api/users?cursor=xyz789&limit=20
```

## Versioning

### Pattern 1: URL Versioning

```typescript
// ✅ GOOD - Version in URL
GET /api/v1/users
GET /api/v2/users

// Pros: Clear, easy to route
// Cons: Duplicate code
```

### Pattern 2: Header Versioning

```typescript
// ✅ GOOD - Version in header
GET /api/users
Header: Accept: application/vnd.api+json;version=1

// Pros: Cleaner URLs
// Cons: Less obvious
```

### Pattern 3: Backward Compatibility

```typescript
// ✅ GOOD - Support multiple versions
// v1: GET /api/v1/users → { id, name, email }
// v2: GET /api/v2/users → { id, name, email, role, createdAt }

// Deprecation strategy:
// 1. Release v2
// 2. Support both v1 and v2 for 6 months
// 3. Announce v1 deprecation
// 4. Support v1 for 3 more months
// 5. Remove v1
```

## Authentication & Authorization

### Pattern 1: Bearer Token (JWT)

```typescript
// ✅ GOOD - Bearer token authentication
GET /api/users
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Response
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Pattern 2: API Key

```typescript
// ✅ GOOD - API key authentication
GET /api/users
Header: X-API-Key: sk_live_abc123def456

// Or query parameter (less secure)
GET /api/users?apiKey=sk_live_abc123def456
```

### Pattern 3: Authorization Header

```typescript
// ✅ GOOD - Check authorization
GET /api/users/123
Header: Authorization: Bearer token

// Response
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}

// If user doesn't have permission
DELETE /api/users/456
→ 403 Forbidden
{
  "code": "FORBIDDEN",
  "message": "You don't have permission to delete this user"
}
```

## Rate Limiting

### Pattern 1: Rate Limit Headers

```typescript
// ✅ GOOD - Rate limit information in headers
Response Headers:
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705315800

// When rate limited
429 Too Many Requests
{
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again in 60 seconds",
  "retryAfter": 60
}
```

## Filtering & Searching

### Pattern 1: Query Filters

```typescript
// ✅ GOOD - Flexible filtering
GET /api/users?role=admin&status=active&createdAfter=2024-01-01

// Breakdown:
// role=admin           - Filter by role
// status=active        - Filter by status
// createdAfter=2024... - Filter by date range
```

### Pattern 2: Search

```typescript
// ✅ GOOD - Full-text search
GET /api/users?search=john

// Returns users matching "john" in name, email, etc.
```

## Sorting

### Pattern 1: Sort Parameter

```typescript
// ✅ GOOD - Sorting
GET /api/users?sort=name              // Ascending
GET /api/users?sort=-name             // Descending
GET /api/users?sort=name,-createdAt   // Multiple fields
```

## Caching

### Pattern 1: Cache Headers

```typescript
// ✅ GOOD - Cache control headers
GET /api/users/123

Response Headers:
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT

// Client can cache for 1 hour
// Next request with ETag
GET /api/users/123
If-None-Match: "abc123"

// Server responds
304 Not Modified
```

## Frontend Integration

### Pattern 1: Fetch with Error Handling

```typescript
async function fetchUsers() {
  try {
    const response = await fetch('/api/users')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch users:', error)
    throw error
  }
}
```

### Pattern 2: API Client

```typescript
class ApiClient {
  private baseUrl: string
  private token?: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    return response.json()
  }

  get<T>(path: string) {
    return this.request<T>('GET', path)
  }

  post<T>(path: string, data: any) {
    return this.request<T>('POST', path, data)
  }

  put<T>(path: string, data: any) {
    return this.request<T>('PUT', path, data)
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

// Usage
const api = new ApiClient('/api')
const users = await api.get('/users')
```

## Common Mistakes

### ❌ Mistake 1: Action-oriented endpoints
```typescript
// BAD
GET /api/getUsers
POST /api/createUser

// GOOD
GET /api/users
POST /api/users
```

### ❌ Mistake 2: Inconsistent error format
```typescript
// BAD
{ "error": "Not found" }
{ "message": "Invalid input" }

// GOOD
{
  "code": "NOT_FOUND",
  "message": "User not found",
  "status": 404
}
```

### ❌ Mistake 3: Wrong HTTP status codes
```typescript
// BAD
POST /api/users (validation error) → 200 OK

// GOOD
POST /api/users (validation error) → 422 Unprocessable Entity
```

### ❌ Mistake 4: No pagination
```typescript
// BAD
GET /api/users → Returns 10,000 users

// GOOD
GET /api/users?page=1&pageSize=20 → Returns 20 users
```

### ❌ Mistake 5: No versioning
```typescript
// BAD
GET /api/users → Breaking changes affect all clients

// GOOD
GET /api/v1/users → Can release v2 without breaking v1
```

## Checklist

- [ ] Resources are noun-based (not action-based)
- [ ] HTTP methods are used correctly (GET, POST, PUT, DELETE)
- [ ] Status codes are appropriate (200, 201, 400, 404, 500)
- [ ] Error responses are consistent
- [ ] Pagination is implemented
- [ ] Filtering/searching is supported
- [ ] Sorting is supported
- [ ] API is versioned
- [ ] Authentication is implemented
- [ ] Rate limiting is configured
- [ ] Cache headers are set
- [ ] API documentation is complete (OpenAPI/Swagger)
- [ ] Frontend integration is tested

## Resources

- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
- [OpenAPI Specification](https://spec.openapis.org/)
- [JSON API Standard](https://jsonapi.org/)

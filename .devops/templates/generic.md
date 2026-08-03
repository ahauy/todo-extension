# Generic Deployment Template

## Overview
Template cho platform không nằm trong danh sách cụ thể. Áp dụng best practices chung.

## Build

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm run build

# Output: dist/
#   dist/client/  → Static frontend files
#   dist/server/  → Node.js backend
```

## Environment Variables Required

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-connection-string>
JWT_SECRET=<random-64-chars>
FRONTEND_URL=https://yourdomain.com
```

## Start Command

```bash
node dist/server/index.js
```

## Health Check Endpoint

```
GET /api/health
Response: { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

## Deploy Checklist

- [ ] All tests pass locally
- [ ] Build succeeds without errors
- [ ] Environment variables configured on platform
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Health check responds after deploy
- [ ] Frontend loads and can call backend APIs
- [ ] SSL/HTTPS configured

## Rollback Plan

1. Keep previous deployment artifact/image
2. If health check fails after deploy → revert to previous version
3. If database migration fails → restore from backup

## Monitoring Recommendations

- Uptime monitoring (UptimeRobot, Better Uptime)
- Error tracking (Sentry)
- Log aggregation (platform-native or ELK)
- Performance monitoring (platform APM or custom)

# Monitoring Setup — Prometheus + Grafana + Sentry

> Production-ready monitoring cho React + Node.js stack

---

## 🎯 Overview

| Tool | Dùng cho | Cost |
|------|----------|------|
| **Sentry** | Error tracking + source maps | Free tier / $29/mo |
| **Prometheus** | Metrics collection | Free (self-hosted) |
| **Grafana** | Metrics visualization | Free (self-hosted) |

---

## 1️⃣ Sentry — Error Tracking

### Setup

**Step 1: Tạo account**
- Vào https://sentry.io
- Sign up (free tier ok)
- Tạo project: Node.js + React

**Step 2: Lấy DSN**
- Project Settings → Client Keys (DSN)
- Copy DSN → `.env` file

**Step 3: Install packages**
```bash
npm install @sentry/node @sentry/react @sentry/tracing
```

**Step 4: Init Sentry (Node.js)**
```typescript
// src/lib/monitoring.ts
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Express.Integrations.Express({
        app: true,
        request: true,
      }),
    ],
  });
}
```

**Step 5: Init Sentry (React)**
```typescript
// src/app.tsx
import * as Sentry from "@sentry/react";
import * as Tracing from "@sentry/tracing";

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
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const App = Sentry.withProfiler(AppComponent);
```

**Step 6: Use in code**
```typescript
// Automatic error catching
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Manual event
Sentry.captureMessage("Something happened", "info");

// With context
Sentry.withScope((scope) => {
  scope.setContext("character", {
    name: "Mighty Fighter",
    level: 19,
  });
  Sentry.captureException(error);
});
```

---

## 2️⃣ Prometheus — Metrics Collection

### Setup

**Step 1: Install packages**
```bash
npm install prom-client express
```

**Step 2: Init Prometheus (Node.js)**
```typescript
// src/lib/prometheus.ts
import promClient from "prom-client";

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const dbQueryDuration = new promClient.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["query_type"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

export const activeConnections = new promClient.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

export function getMetrics() {
  return promClient.register.metrics();
}
```

**Step 3: Middleware (Express)**
```typescript
// src/middleware/prometheus.ts
import { Request, Response, NextFunction } from "express";
import { httpRequestDuration } from "../lib/prometheus";

export function prometheusMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
}
```

**Step 4: Expose metrics endpoint**
```typescript
// src/app.ts
import express from "express";
import { prometheusMiddleware } from "./middleware/prometheus";
import { getMetrics } from "./lib/prometheus";

const app = express();

app.use(prometheusMiddleware);

// Metrics endpoint
app.get("/metrics", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(getMetrics());
});
```

---

## 3️⃣ Grafana — Visualization

### Setup (Docker)

**Step 1: Create `docker-compose.monitoring.yml`**
```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

**Step 2: Create `prometheus.yml`**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "nodejs"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/metrics"
```

**Step 3: Start services**
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

**Step 4: Access Grafana**
- URL: http://localhost:3000
- Username: admin
- Password: admin

**Step 5: Add Prometheus data source**
1. Settings → Data Sources → Add
2. Type: Prometheus
3. URL: http://prometheus:9090
4. Save

**Step 6: Create dashboard**
1. Create → Dashboard
2. Add Panel
3. Query: `http_request_duration_seconds`
4. Visualize

---

## 📊 Example Queries

```promql
# Request rate (requests per second)
rate(http_request_duration_seconds_count[1m])

# P95 latency
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Error rate
rate(http_request_duration_seconds_count{status_code=~"5.."}[1m])

# Active connections
active_connections

# DB query duration
histogram_quantile(0.99, db_query_duration_seconds_bucket)
```

---

## 🚀 Production Deployment

### Sentry
- Already hosted, just use DSN

### Prometheus + Grafana
**Option 1: Self-hosted (VPS)**
```bash
# SSH vào server
ssh user@server

# Clone repo
git clone your-repo
cd your-repo

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana
# https://your-domain.com:3000
```

**Option 2: Managed (Grafana Cloud)**
- Sign up: https://grafana.com/products/cloud/
- Connect Prometheus
- Use Grafana Cloud dashboard

---

## 📝 .env Setup

```bash
# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
REACT_APP_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Prometheus (local)
PROMETHEUS_URL=http://localhost:9090

# Grafana (local)
GRAFANA_URL=http://localhost:3000
GRAFANA_ADMIN_PASSWORD=admin
```

---

## 🔍 Monitoring Checklist

- [ ] Sentry project created + DSN in .env
- [ ] Sentry initialized in Node.js + React
- [ ] Prometheus metrics endpoint working
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboard created
- [ ] Key metrics visualized (latency, error rate, connections)
- [ ] Alerts configured (optional)

---

## 📚 Resources

- Sentry Docs: https://docs.sentry.io/
- Prometheus Docs: https://prometheus.io/docs/
- Grafana Docs: https://grafana.com/docs/
- prom-client: https://github.com/siimon/prom-client

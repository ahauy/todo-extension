---
name: performance-optimization
description: "Performance optimization including Core Web Vitals, code splitting, lazy loading, image optimization, bundle analysis, and monitoring."
origin: codex-project-template
---

# Performance Optimization Skill

Comprehensive guide for optimizing React application performance.

## When to Use

Invoke this skill:
- When optimizing Core Web Vitals (LCP, FID, CLS)
- When reducing bundle size
- When implementing code splitting and lazy loading
- When optimizing images and assets
- When analyzing performance bottlenecks
- When setting up performance monitoring

## Core Web Vitals

### 1. LCP (Largest Contentful Paint)

**What:** Time until the largest visible element is painted
**Target:** < 2.5 seconds
**Measures:** User perception of page load speed

#### Optimization Strategies

**Strategy 1: Optimize Server Response Time**
```typescript
// Use CDN for static assets
// Implement caching headers
// Optimize database queries
// Use server-side rendering (SSR) for critical content
```

**Strategy 2: Eliminate Render-Blocking Resources**
```typescript
// Defer non-critical CSS
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'" />

// Defer non-critical JavaScript
<script defer src="non-critical.js"></script>

// Inline critical CSS
<style>
  /* Critical styles only */
</style>
```

**Strategy 3: Optimize Images**
```typescript
// Use modern formats (WebP)
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="description" />
</picture>

// Lazy load images
<img src="image.jpg" loading="lazy" alt="description" />

// Responsive images
<img
  srcSet="image-small.jpg 480w, image-large.jpg 1200w"
  sizes="(max-width: 600px) 480px, 1200px"
  src="image-large.jpg"
  alt="description"
/>
```

**Strategy 4: Preload Critical Resources**
```typescript
// Preload fonts
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossOrigin />

// Preload critical images
<link rel="preload" href="hero-image.jpg" as="image" />

// Preload critical scripts
<link rel="preload" href="critical.js" as="script" />
```

### 2. FID (First Input Delay)

**What:** Time from user input to browser response
**Target:** < 100 milliseconds
**Measures:** Interactivity and responsiveness

#### Optimization Strategies

**Strategy 1: Break Up Long Tasks**
```typescript
// Bad: Long task blocks main thread
function processLargeDataset(data: any[]) {
  return data.map(item => expensiveOperation(item))
}

// Good: Break into chunks
async function processLargeDatasetAsync(data: any[]) {
  const results = []
  const chunkSize = 100

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    results.push(...chunk.map(item => expensiveOperation(item)))
    
    // Yield to browser
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return results
}
```

**Strategy 2: Use Web Workers**
```typescript
// main.ts
const worker = new Worker('worker.ts')

worker.postMessage({ data: largeDataset })
worker.onmessage = (event) => {
  const results = event.data
  updateUI(results)
}

// worker.ts
self.onmessage = (event) => {
  const results = event.data.map(item => expensiveOperation(item))
  self.postMessage(results)
}
```

**Strategy 3: Defer Non-Critical JavaScript**
```typescript
// Load analytics after interaction
document.addEventListener('click', () => {
  const script = document.createElement('script')
  script.src = 'analytics.js'
  document.head.appendChild(script)
}, { once: true })
```

**Strategy 4: Optimize React Rendering**
```typescript
// Use React.memo to prevent unnecessary re-renders
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>
})

// Use useMemo for expensive computations
function Component({ items }) {
  const sortedItems = React.useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  return <div>{sortedItems}</div>
}

// Use useCallback to memoize callbacks
function Parent() {
  const handleClick = React.useCallback(() => {
    console.log('clicked')
  }, [])

  return <Child onClick={handleClick} />
}
```

### 3. CLS (Cumulative Layout Shift)

**What:** Unexpected layout shifts during page load
**Target:** < 0.1
**Measures:** Visual stability

#### Optimization Strategies

**Strategy 1: Reserve Space for Dynamic Content**
```typescript
// Bad: Image loads and shifts layout
<img src="image.jpg" alt="description" />

// Good: Reserve space with aspect ratio
<img
  src="image.jpg"
  alt="description"
  width="1200"
  height="800"
  style={{ aspectRatio: '1200 / 800' }}
/>

// Or use container query
<div style={{ aspectRatio: '16 / 9' }}>
  <img src="image.jpg" alt="description" />
</div>
```

**Strategy 2: Avoid Inserting Content Above Existing Content**
```typescript
// Bad: Ad inserted above content
<div id="ad-container"></div>
<div id="content">Main content</div>

// Good: Reserve space for ad
<div id="ad-container" style={{ minHeight: '250px' }}></div>
<div id="content">Main content</div>
```

**Strategy 3: Use transform Instead of Layout Properties**
```typescript
// Bad: Changes layout
element.style.top = '10px'

// Good: Uses transform (no layout shift)
element.style.transform = 'translateY(10px)'
```

**Strategy 4: Avoid Animations That Cause Layout Shifts**
```typescript
// Bad: Animating width causes layout shift
@keyframes expand {
  from { width: 100px; }
  to { width: 200px; }
}

// Good: Use transform
@keyframes expand {
  from { transform: scaleX(1); }
  to { transform: scaleX(2); }
}
```

## Code Splitting & Lazy Loading

### Pattern 1: Route-Based Code Splitting

```typescript
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy load route components
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  )
}
```

### Pattern 2: Component-Based Code Splitting

```typescript
// Lazy load heavy components
const HeavyChart = React.lazy(() => import('./components/HeavyChart'))
const DataTable = React.lazy(() => import('./components/DataTable'))

function Dashboard() {
  const [showChart, setShowChart] = React.useState(false)

  return (
    <div>
      <button onClick={() => setShowChart(!showChart)}>
        Toggle Chart
      </button>

      {showChart && (
        <React.Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </React.Suspense>
      )}

      <React.Suspense fallback={<div>Loading table...</div>}>
        <DataTable />
      </React.Suspense>
    </div>
  )
}
```

### Pattern 3: Dynamic Imports

```typescript
// Load module on demand
async function loadModule() {
  const module = await import('./heavy-module')
  return module.default
}

// Usage
button.addEventListener('click', async () => {
  const HeavyComponent = await loadModule()
  render(HeavyComponent)
})
```

### Pattern 4: Prefetch Routes

```typescript
// Prefetch route before user navigates
function Link({ to, children }: { to: string; children: React.ReactNode }) {
  const handleMouseEnter = () => {
    // Prefetch the route
    import(/* webpackPrefetch: true */ `./pages/${to}`)
  }

  return (
    <a href={to} onMouseEnter={handleMouseEnter}>
      {children}
    </a>
  )
}
```

## Image Optimization

### Pattern 1: Responsive Images

```typescript
function ResponsiveImage({ src, alt }: { src: string; alt: string }) {
  return (
    <picture>
      {/* WebP format for modern browsers */}
      <source
        srcSet={`${src}-small.webp 480w, ${src}-large.webp 1200w`}
        sizes="(max-width: 600px) 480px, 1200px"
        type="image/webp"
      />

      {/* Fallback to JPEG */}
      <img
        srcSet={`${src}-small.jpg 480w, ${src}-large.jpg 1200w`}
        sizes="(max-width: 600px) 480px, 1200px"
        src={`${src}-large.jpg`}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </picture>
  )
}
```

### Pattern 2: Image Optimization Service

```typescript
// Use image optimization service (Cloudinary, Imgix, etc.)
function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  const cloudinaryUrl = `https://res.cloudinary.com/demo/image/fetch/w_auto,q_auto,f_auto/${src}`

  return (
    <img
      src={cloudinaryUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  )
}
```

### Pattern 3: Next.js Image Component

```typescript
import Image from 'next/image'

export default function OptimizedImage() {
  return (
    <Image
      src="/image.jpg"
      alt="description"
      width={1200}
      height={800}
      priority={false}
      loading="lazy"
    />
  )
}
```

## Bundle Analysis

### Pattern 1: Webpack Bundle Analyzer

```bash
# Install
npm install -D webpack-bundle-analyzer

# Add to webpack config
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}

# Run
npm run build
```

### Pattern 2: Vite Bundle Analysis

```bash
# Install
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
}

# Run
npm run build
```

### Pattern 3: Identify Large Dependencies

```bash
# Check bundle size
npm install -D source-map-explorer
npx source-map-explorer 'dist/**/*.js'

# Check dependency size
npm install -D npm-check-updates
npm ls --depth=0

# Find duplicate packages
npm dedupe
```

## Performance Monitoring

### Pattern 1: Web Vitals Monitoring

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Send to analytics service
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify(metric),
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### Pattern 2: Performance Observer

```typescript
function setupPerformanceMonitoring() {
  // Monitor long tasks
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('Long task:', entry.duration)
      
      // Send to analytics
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'long-task',
          duration: entry.duration,
          name: entry.name,
        }),
      })
    }
  })

  observer.observe({ entryTypes: ['longtask'] })
}

setupPerformanceMonitoring()
```

### Pattern 3: React Profiler

```typescript
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`)
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <YourComponent />
    </Profiler>
  )
}
```

## Common Mistakes

### ❌ Mistake 1: Not optimizing images
```typescript
// Bad: Large unoptimized image
<img src="image.jpg" alt="description" />

// Good: Optimized with multiple formats
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="description" loading="lazy" />
</picture>
```

### ❌ Mistake 2: Bundling all code together
```typescript
// Bad: Single large bundle
import { HeavyChart } from './components/HeavyChart'
import { DataTable } from './components/DataTable'

// Good: Code split
const HeavyChart = React.lazy(() => import('./components/HeavyChart'))
const DataTable = React.lazy(() => import('./components/DataTable'))
```

### ❌ Mistake 3: Not memoizing expensive computations
```typescript
// Bad: Recalculates on every render
function Component({ items }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name))
  return <div>{sorted}</div>
}

// Good: Memoize
function Component({ items }) {
  const sorted = React.useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  return <div>{sorted}</div>
}
```

### ❌ Mistake 4: Causing layout shifts
```typescript
// Bad: Image causes layout shift
<img src="image.jpg" alt="description" />

// Good: Reserve space
<img
  src="image.jpg"
  alt="description"
  width="1200"
  height="800"
  style={{ aspectRatio: '1200 / 800' }}
/>
```

### ❌ Mistake 5: Not monitoring performance
```typescript
// Bad: No monitoring
// (can't detect performance issues)

// Good: Monitor Web Vitals
import { getCLS, getFID, getLCP } from 'web-vitals'
getCLS(console.log)
getFID(console.log)
getLCP(console.log)
```

## Checklist

- [ ] Core Web Vitals optimized (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Images optimized (WebP, responsive, lazy loading)
- [ ] Code splitting implemented for routes and heavy components
- [ ] Bundle size analyzed and large dependencies identified
- [ ] Unnecessary dependencies removed
- [ ] React components memoized where appropriate
- [ ] Long tasks broken up or moved to Web Workers
- [ ] Performance monitoring configured
- [ ] Lighthouse score > 90
- [ ] No layout shifts during page load

## Resources

- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://react.dev/reference/react/useMemo)
- [Image Optimization](https://web.dev/image-optimization/)
- [Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Bundle Analysis](https://webpack.js.org/plugins/bundle-analyzer/)

# Chrome DevTools MCP — Browser Automation & Debugging

> Chrome DevTools for Agents (`chrome-devtools-mcp`) lets your agent control and inspect a live Chrome browser.
> Dùng cho browser automation, debugging, performance analysis, và E2E testing.

## 🔗 Resources

- **GitHub:** https://github.com/ChromeDevTools/chrome-devtools-mcp
- **npm:** https://www.npmjs.com/package/chrome-devtools-mcp
- **Tool Reference:** https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md
- **Troubleshooting:** https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/troubleshooting.md

---

## ✨ Key Features

- **Get performance insights** — Record traces, extract actionable performance insights
- **Advanced browser debugging** — Analyze network requests, take screenshots, check console messages
- **Reliable automation** — Use Puppeteer to automate actions, auto-wait for results
- **Full DevTools access** — Inspect, debug, modify browser data

---

## 📋 Requirements

- Node.js v20.19 or newer (latest maintenance LTS)
- Chrome stable version or newer
- npm

---

## 🚀 Setup

### Step 1: Install

```bash
npm install chrome-devtools-mcp
```

### Step 2: Configure MCP Client

Add to your MCP client config (e.g., `~/.claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

### Step 3: Restart MCP Client

Restart your MCP client (Claude Desktop, Cursor, etc.) to load the new server.

---

## 🎯 Usage

### Basic Browser Control

```javascript
// Open URL
await openUrl("https://example.com");

// Take screenshot
const screenshot = await takeScreenshot();

// Get page content
const content = await getPageContent();
```

### Performance Analysis

```javascript
// Record trace
const trace = await recordTrace({ duration: 5000 });

// Get performance insights
const insights = await getPerformanceInsights(trace);
```

### Network Debugging

```javascript
// Get network requests
const requests = await getNetworkRequests();

// Check console messages
const logs = await getConsoleLogs();
```

### Advanced Automation

```javascript
// Click element
await click("button.submit");

// Fill form
await fill("input[name='email']", "test@example.com");

// Wait for element
await waitForElement("div.success-message");
```

---

## 📚 Common Patterns

### E2E Testing

```javascript
// 1. Navigate
await openUrl("https://app.example.com");

// 2. Interact
await fill("input[name='username']", "testuser");
await fill("input[name='password']", "password123");
await click("button[type='submit']");

// 3. Verify
await waitForElement("div.dashboard");
const screenshot = await takeScreenshot();
```

### Performance Monitoring

```javascript
// 1. Record trace
const trace = await recordTrace({ duration: 10000 });

// 2. Get insights
const insights = await getPerformanceInsights(trace);

// 3. Check metrics
console.log(insights.metrics);
```

### Network Inspection

```javascript
// 1. Clear network log
await clearNetworkLog();

// 2. Perform action
await click("button.load-data");

// 3. Analyze requests
const requests = await getNetworkRequests();
const slowRequests = requests.filter(r => r.duration > 1000);
```

---

## 🔧 Slim Mode (Lightweight)

Nếu chỉ cần basic browser tasks, dùng `--slim` mode:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--slim", "--headless"]
    }
  }
}
```

Slim mode có ít tools hơn nhưng nhanh hơn.

---

## ⚙️ Configuration Options

### Headless Mode

```json
{
  "args": ["-y", "chrome-devtools-mcp@latest", "--headless"]
}
```

### Disable Usage Statistics

```json
{
  "args": ["-y", "chrome-devtools-mcp@latest", "--no-usage-statistics"]
}
```

### Disable Update Checks

```bash
export CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS=1
```

---

## 🐛 Troubleshooting

### Chrome Not Found

```bash
# Specify Chrome path
export CHROME_PATH="/path/to/chrome"
```

### Port Already in Use

```bash
# Use different port
npx chrome-devtools-mcp --port 9223
```

### Connection Issues

- Ensure Chrome is running
- Check firewall settings
- Verify Node.js version (v20.19+)

Xem full troubleshooting: https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/troubleshooting.md

---

## 📖 Integration with Project

### Phase 0: Brainstorming

Khi design E2E tests hoặc performance monitoring, mention chrome-devtools-mcp.

### Phase 1-4: Implementation

Dùng chrome-devtools-mcp cho:
- E2E tests (`tests/e2e/`)
- Performance monitoring
- Network debugging
- Screenshot validation

### Example Task

```markdown
### Task: E2E Test Login Flow

**Tools:** chrome-devtools-mcp

**Steps:**
1. Open login page
2. Fill email + password
3. Click submit
4. Verify redirect to dashboard
5. Take screenshot for validation
```

---

## 🔗 Related

- **Testing:** `skills/testing-vitest-jest/SKILL.md`
- **Performance:** `skills/performance-optimization/SKILL.md`
- **Error Handling:** `skills/error-handling/SKILL.md`

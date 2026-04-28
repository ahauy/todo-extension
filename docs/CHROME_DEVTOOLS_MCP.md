# Chrome DevTools MCP — Browser Automation & Debugging

> Control and inspect a live Chrome browser for E2E testing, debugging, and performance analysis.

---

## 🎯 What is Chrome DevTools MCP?

**MCP server** cho phép Opencode/Codex điều khiển Chrome browser:
- ✅ Automate browser actions (click, type, navigate)
- ✅ Take screenshots & record videos
- ✅ Inspect network requests
- ✅ Analyze performance traces
- ✅ Check console messages (source-mapped)

---

## 📦 Installation

### Step 1: Install MCP Server

```bash
npm install -g chrome-devtools-mcp
```

### Step 2: Configure Opencode

Edit `~/.config/opencode/opencode.json`:

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

### Step 3: Restart Opencode

```bash
opencode .
```

---

## 🚀 Usage Examples

### Screenshot

```
"Mở https://example.com rồi chụp screenshot"
```

### E2E Test

```
"Mở https://example.com
- Click button 'Sign Up'
- Điền email: test@example.com
- Click 'Submit'
- Chụp screenshot kết quả"
```

### Network Debugging

```
"Mở https://example.com
- Inspect network requests
- Báo cáo các request chậm (> 1s)"
```

### Performance Analysis

```
"Mở https://example.com
- Record performance trace
- Analyze Core Web Vitals
- Suggest optimizations"
```

### Console Inspection

```
"Mở https://example.com
- Check console messages
- Báo cáo errors/warnings"
```

---

## 🛠️ Available Tools

| Tool | Purpose |
|------|---------|
| `navigate(url)` | Mở URL |
| `screenshot()` | Chụp screenshot |
| `click(selector)` | Click element |
| `type(selector, text)` | Gõ text |
| `waitForNavigation()` | Chờ page load |
| `getNetworkRequests()` | Lấy network requests |
| `recordTrace()` | Record performance trace |
| `getConsoleMessages()` | Lấy console logs |
| `evaluate(js)` | Chạy JavaScript |

---

## 📝 E2E Testing Workflow

### Phase 4: E2E Testing

Khi sắp release, dùng Chrome DevTools MCP để test:

```
1. Mở staging URL
2. Test user flows:
   - Sign up
   - Login
   - Create item
   - Edit item
   - Delete item
3. Check performance
4. Inspect network
5. Screenshot results
```

### Example Task

```
"Test sign-up flow trên https://staging.example.com:
1. Click 'Sign Up'
2. Điền form:
   - Email: test@example.com
   - Password: Test123!
   - Name: Test User
3. Click 'Create Account'
4. Verify redirect to dashboard
5. Chụp screenshot
6. Check console cho errors"
```

---

## ⚙️ Configuration

### Slim Mode (Basic Tasks)

Nếu chỉ cần basic browser tasks:

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

### Headless Mode

Chạy Chrome mà không hiển thị UI:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--headless"]
    }
  }
}
```

### Disable Usage Statistics

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--no-usage-statistics"]
    }
  }
}
```

---

## 🔗 Resources

- **GitHub:** https://github.com/ChromeDevTools/chrome-devtools-mcp
- **Tool Reference:** https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md
- **Troubleshooting:** https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/troubleshooting.md

---

## ⚠️ Important Notes

- Chrome DevTools MCP exposes browser content → avoid sensitive data
- Supports Chrome + Chrome for Testing only
- Performance tools may send traces to Google CrUX API (opt-out: `--no-performance-crux`)
- Usage statistics enabled by default (opt-out: `--no-usage-statistics`)

/** Đo nhanh vài chi tiết nghi ngờ trên bảng lớn (chỉ dùng lúc phát triển). */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const EXT = path.resolve('.output/chrome-mv3');
const PORT = 9351;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hocduong-probe',
  `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });

let n = 0;
function conn(url) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      const pending = new Map();
      ws.addEventListener('message', (e) => {
        const d = JSON.parse(e.data);
        if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      });
      resolve({
        ws,
        rpc: (method, params = {}) => new Promise((res) => {
          const id = ++n; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
        }),
      });
    }, { once: true });
  });
}

async function main() {
  let list = [];
  for (let i = 0; i < 60; i += 1) {
    try {
      list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      if (list.some((t) => t.type === 'service_worker' && t.url.endsWith('/background.js'))) break;
    } catch { /* chờ */ }
    await sleep(250);
  }
  let extId = null;
  for (const t of list.filter((x) => x.type === 'service_worker' && x.url.endsWith('/background.js'))) {
    const c = await conn(t.webSocketDebuggerUrl);
    await c.rpc('Runtime.enable');
    const r = await c.rpc('Runtime.evaluate', {
      expression: 'fetch(chrome.runtime.getURL("manifest.json")).then(r=>r.json()).then(m=>m.name).catch(()=>"")',
      awaitPromise: true, returnByValue: true,
    });
    c.ws.close();
    if (String(r.result.result.value).startsWith('Học Đường')) { extId = new URL(t.url).host; break; }
  }
  const page = list.find((t) => t.type === 'page');
  const { ws, rpc } = await conn(page.webSocketDebuggerUrl);
  await rpc('Page.enable'); await rpc('Runtime.enable');
  await rpc('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  await rpc('Page.navigate', { url: `chrome-extension://${extId}/newtab.html` });
  await sleep(1600);
  await rpc('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>true)', awaitPromise: true });

  const probe = await rpc('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const cap = document.querySelector('.drop-cap');
      const ph = document.querySelector('.quill-input');
      const cs = cap ? getComputedStyle(cap) : null;
      const box = cap ? cap.getBoundingClientRect() : null;
      return {
        pirataLoaded: document.fonts.check('72px "Pirata One"'),
        dancingLoaded: document.fonts.check('24px "Dancing Script"'),
        capFont: cs && cs.fontFamily, capSize: cs && cs.fontSize,
        capBox: box && { w: Math.round(box.width), h: Math.round(box.height), x: Math.round(box.x), y: Math.round(box.y) },
        capChar: cap && cap.textContent,
        phFont: ph && getComputedStyle(ph).fontFamily,
        phSize: ph && getComputedStyle(ph).fontSize,
        loaded: [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+':'+f.weight),
      };
    })()`,
  });
  console.log(JSON.stringify(probe.result.result.value, null, 1));

  const shot = await rpc('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 380, y: 130, width: 620, height: 130, scale: 1 },
  });
  writeFileSync('.impeccable/review/crop-greeting.png', Buffer.from(shot.result.data, 'base64'));
  ws.close(); browser.kill(); process.exit(0);
}
main().catch((e) => { console.error(e); browser.kill(); process.exit(1); });
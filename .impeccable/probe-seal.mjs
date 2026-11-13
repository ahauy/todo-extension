/**
 * Probe BUG-002 (dev-only): seal affordance + done-today + undo + reload.
 *   node .impeccable/probe-seal.mjs <ext-dir> <tag>
 * Seed: t1 = việc lặp daily hạn HÔM NAY; t2 = việc thường hạn hôm nay.
 * Ghi .impeccable/review/seal-<tag>.json + seal-<tag>-{open,donetoday,undo,reload,done}.png
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const EXT = path.resolve(process.argv[2] ?? '.output/chrome-mv3');
const TAG = process.argv[3] ?? 'after';
const OUT = path.resolve('.impeccable/review');
const PORT = 9460 + Math.floor(Math.random() * 30);
const PROFILE = `/tmp/hocduong-seal-${TAG}-${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
  '--no-first-run', '--no-default-browser-check', '--force-color-profile=srgb', 'about:blank',
], { stdio: 'ignore' });

let msgId = 0;
function rpc(ws, method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id !== id) return;
      ws.removeEventListener('message', onMessage);
      if (data.error) reject(new Error(`${method}: ${JSON.stringify(data.error)}`));
      else resolve(data.result);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  return ws;
}
async function evaluate(ws, expression) {
  const resp = await rpc(ws, 'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (resp.exceptionDetails) throw new Error(`evaluate: ${JSON.stringify(resp.exceptionDetails)}`);
  return resp.result.value;
}
async function shot(ws, name) {
  const s = await rpc(ws, 'Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(OUT, `seal-${TAG}-${name}.png`), Buffer.from(s.data, 'base64'));
}

function seedExpression() {
  const pad = (n) => `${n}`.padStart(2, '0');
  const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const at = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return local(d); };
  const nowIso = new Date().toISOString();
  const mk = (id, title, extra) => ({ id, title, note: '', priority: 'medium', dueAt: null, recurrence: { kind: 'none' }, tags: [], subtasks: [], subjectId: null, done: false, createdAt: nowIso, updatedAt: nowIso, ...extra });
  const tasks = [
    mk('t1', 'Học từ vựng Tiếng anh', { priority: 'high', dueAt: at(23, 59), recurrence: { kind: 'daily' }, tags: ['Học Toiec'] }),
    mk('t2', 'Nộp báo cáo thí nghiệm', { dueAt: at(23, 58) }),
  ];
  const items = { subjects: [], studyLog: {} };
  for (const t of tasks) items[`t:${t.id}`] = t;
  return `new Promise((resolve) => chrome.storage.sync.clear(() => chrome.storage.sync.set(${JSON.stringify(items)}, () => resolve(true))))`;
}

const PROBE = `(() => {
  return [...document.querySelectorAll('.scroll-task')].map((el) => {
    const seal = el.querySelector('.seal-button');
    return {
      state: el.dataset.state,
      pressed: seal?.getAttribute('aria-pressed'),
      label: seal?.getAttribute('aria-label'),
      title: seal?.getAttribute('title'),
      glyph: !!seal?.querySelector('.seal-button-glyph'),
      stamp: el.querySelector('.seal-stamp')?.textContent ?? null,
      chips: [...el.querySelectorAll('[data-chip-row] .chip, [data-chip-row] time')].map((c) => c.textContent.trim()),
    };
  });
})()`;

async function main() {
  let pageWsUrl = null, candidates = [];
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      candidates = list.filter((t) => t.type === 'service_worker' && t.url.endsWith('/background.js'));
      const page = list.find((t) => t.type === 'page');
      if (candidates.length && page) { pageWsUrl = page.webSocketDebuggerUrl; break; }
    } catch { /* chưa mở cổng */ }
    await sleep(250);
  }
  let extId = null;
  for (const c of candidates) {
    const p = await connect(c.webSocketDebuggerUrl);
    await rpc(p, 'Runtime.enable');
    const name = await evaluate(p, 'fetch(chrome.runtime.getURL("manifest.json")).then((r) => r.json()).then((m) => m.name).catch(() => "")');
    p.close();
    if (typeof name === 'string' && name.startsWith('Học Đường')) { extId = new URL(c.url).host; break; }
  }
  if (!extId) throw new Error('Không thấy extension Học Đường');

  const ws = await connect(pageWsUrl);
  await rpc(ws, 'Page.enable');
  await rpc(ws, 'Runtime.enable');
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 360, height: 560, deviceScaleFactor: 1, mobile: false });
  const url = `chrome-extension://${extId}/popup.html`;
  await rpc(ws, 'Page.navigate', { url });
  await sleep(900);
  await evaluate(ws, seedExpression());
  await sleep(500);
  await evaluate(ws, 'document.fonts.ready.then(() => true)');
  await sleep(300);

  const open = await evaluate(ws, PROBE);
  await shot(ws, 'open');

  await evaluate(ws, `document.querySelectorAll('.seal-button')[0].click()`);
  await sleep(500);
  const doneToday = await evaluate(ws, PROBE);
  await shot(ws, 'donetoday');

  await evaluate(ws, `document.querySelectorAll('.seal-button')[0].click()`);
  await sleep(500);
  const undo = await evaluate(ws, PROBE);
  await shot(ws, 'undo');

  await evaluate(ws, `document.querySelectorAll('.seal-button')[0].click()`);
  await sleep(400);
  await rpc(ws, 'Page.navigate', { url });
  await sleep(900);
  await evaluate(ws, 'document.fonts.ready.then(() => true)');
  await sleep(300);
  const reload = await evaluate(ws, PROBE);
  await shot(ws, 'reload');

  await evaluate(ws, `document.querySelectorAll('.seal-button')[1].click()`);
  await sleep(500);
  const done = await evaluate(ws, PROBE);
  await shot(ws, 'done');

  // Undo done-today trên việc lặp (index 1) → về open, không cuộn hạn nữa.
  await evaluate(ws, `document.querySelectorAll('.seal-button')[1].click()`);
  await sleep(400);
  const undoToday = await evaluate(ws, PROBE);

  // Đóng dấu lại rồi reload → done-today phải bền vững qua reload.
  await evaluate(ws, `document.querySelectorAll('.seal-button')[1].click()`);
  await sleep(400);
  await rpc(ws, 'Page.navigate', { url });
  await sleep(900);
  await evaluate(ws, 'document.fonts.ready.then(() => true)');
  await sleep(300);
  const reloadToday = await evaluate(ws, PROBE);
  await shot(ws, 'reloadtoday');

  const result = { tag: TAG, ext: EXT, measuredAt: new Date().toISOString(), open, doneToday, undo, reload, done, undoToday, reloadToday };
  writeFileSync(path.join(OUT, `seal-${TAG}.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ open: open.map((c) => c.state), doneToday: doneToday.map((c) => c.state), undo: undo.map((c) => c.state), reload: reload.map((c) => c.state), done: done.map((c) => c.state), undoToday: undoToday.map((c) => c.state), reloadToday: reloadToday.map((c) => c.state) }));
  ws.close(); browser.kill(); process.exit(0);
}
main().catch((e) => { console.error('FAILED', e); try { browser.kill(); } catch {} process.exit(1); });
/**
 * So hình học thẻ việc trên board newtab giữa 2 bản build (dev-only).
 * Không dựa vào data-chip-row (baseline chưa có) — dùng class .scroll-task
 * và các div flex-wrap bên trong. Cùng seed 8 việc với measure-density.mjs.
 *
 *   node .impeccable/board-geometry.mjs <ext-dir> <tag>
 *   → .impeccable/review/board-geom-<tag>.json
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const EXT = path.resolve(process.argv[2]);
const TAG = process.argv[3];
const WIDTH = Number(process.argv[4] ?? 1024);
const OUT = path.resolve('.impeccable/review');
const PORT = 9420 + Math.floor(Math.random() * 30);
const PROFILE = `/tmp/hocduong-geom-${TAG}-${PORT}`;
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

function seedExpression() {
  const pad = (n) => `${n}`.padStart(2, '0');
  const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const at = (offsetDays, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(h, m, 0, 0); return local(d); };
  const nowIso = new Date().toISOString();
  const subjects = [
    { id: 's1', name: 'Giải tích 2', order: 0, createdAt: nowIso },
    { id: 's2', name: 'Lịch sử Đảng', order: 1, createdAt: nowIso },
    { id: 's3', name: 'Tiếng Anh B2', order: 2, createdAt: nowIso },
    { id: 's4', name: 'Cấu trúc dữ liệu', order: 3, createdAt: nowIso },
    { id: 's5', name: 'Vật lý đại cương', order: 4, createdAt: nowIso },
  ];
  const mk = (id, title, extra) => ({ id, title, note: '', priority: 'medium', dueAt: null, recurrence: { kind: 'none' }, tags: [], subtasks: [], subjectId: null, done: false, createdAt: nowIso, updatedAt: nowIso, ...extra });
  const sub = (n, doneCount) => Array.from({ length: n }, (_, i) => ({ id: `x${i}`, title: `Bước ${i + 1}`, done: i < doneCount }));
  const tasks = [
    mk('t1', 'Nghiên cứu phương trình vi phân thường', { priority: 'high', dueAt: at(0, 18), subjectId: 's1', note: 'Đọc mục 3.2 rồi làm lại ví dụ 4 trong vở.', subtasks: sub(3, 1), tags: ['bài tập'] }),
    mk('t2', 'Làm bài tập chương 4 — tích phân bội', { priority: 'medium', dueAt: at(-1, 20), subjectId: 's1', tags: ['bài tập'] }),
    mk('t3', 'Học 20 từ vựng chủ đề Environment', { priority: 'low', dueAt: at(0, 21), subjectId: 's3', recurrence: { kind: 'daily' } }),
    mk('t4', 'Đọc chương 3: Đường lối kháng chiến toàn quốc', { dueAt: at(1, 9), subjectId: 's2' }),
    mk('t5', 'Cài đặt cây nhị phân tìm kiếm bằng C', { priority: 'high', dueAt: at(3, 23, 59), subjectId: 's4', subtasks: sub(4, 2), tags: ['đồ án'] }),
    mk('t6', 'Ôn thí nghiệm con lắc đơn', { priority: 'low', subjectId: 's5' }),
    mk('t7', 'Nộp báo cáo thí nghiệm tuần 6', { dueAt: at(0, 8), subjectId: 's5', done: true }),
    mk('t8', 'Dịch đoạn văn về biến đổi khí hậu', { dueAt: at(-1, 15), subjectId: 's3', done: true }),
  ];
  const log = {};
  for (let back = 5; back >= 1; back -= 1) { const d = new Date(); d.setDate(d.getDate() - back); log[dayKey(d)] = { tasks: 2 + (back % 3), focus: back % 2 }; }
  log[dayKey(new Date())] = { tasks: 1, focus: 0 };
  const items = { subjects, studyLog: log };
  for (const t of tasks) items[`t:${t.id}`] = t;
  return `new Promise((resolve) => chrome.storage.sync.clear(() => chrome.storage.sync.set(${JSON.stringify(items)}, () => resolve(true))))`;
}

const GEOM_PROBE = `(() => {
  const cards = [...document.querySelectorAll('.scroll-task')].map((el) => {
    const r = el.getBoundingClientRect();
    const rows = [...el.querySelectorAll('div.flex.flex-wrap')].map((row) => {
      const rr = row.getBoundingClientRect();
      return { top: Math.round(rr.top), h: Math.round(rr.height), w: Math.round(rr.width), chips: row.children.length };
    });
    const title = el.querySelector('.scroll-title');
    const tr = title ? title.getBoundingClientRect() : null;
    return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width),
             titleH: tr ? Math.round(tr.height) : null, rows };
  });
  return { cardCount: cards.length, cards };
})()`;

async function main() {
  let candidates = [];
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      candidates = list.filter((t) => t.type === 'service_worker' && t.url.endsWith('/background.js'));
      if (candidates.length > 0) {
        const page = list.find((t) => t.type === 'page');
        var pageWsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch { /* chưa mở cổng */ }
    await sleep(250);
  }
  let extId = null;
  for (const c of candidates) {
    const probe = await connect(c.webSocketDebuggerUrl);
    await rpc(probe, 'Runtime.enable');
    const name = await evaluate(probe, 'fetch(chrome.runtime.getURL("manifest.json")).then((r) => r.json()).then((m) => m.name).catch(() => "")');
    probe.close();
    if (typeof name === 'string' && name.startsWith('Học Đường')) { extId = new URL(c.url).host; break; }
  }
  if (!extId) throw new Error('Không thấy extension Học Đường được nạp');

  const ws = await connect(pageWsUrl);
  await rpc(ws, 'Page.enable');
  await rpc(ws, 'Runtime.enable');
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 820, deviceScaleFactor: 1, mobile: false });
  await rpc(ws, 'Page.navigate', { url: `chrome-extension://${extId}/newtab.html` });
  await sleep(1100);
  await evaluate(ws, seedExpression());
  await sleep(500);
  await evaluate(ws, 'document.fonts.ready.then(() => true)');
  await sleep(500);
  const geom = await evaluate(ws, GEOM_PROBE);
  writeFileSync(path.join(OUT, `board-geom-${TAG}.json`), JSON.stringify({ tag: TAG, ext: EXT, measuredAt: new Date().toISOString(), ...geom }, null, 2));
  console.log(JSON.stringify({ tag: TAG, cardCount: geom.cardCount, heights: geom.cards.map((c) => c.h), rowsPerCard: geom.cards.map((c) => c.rows.length) }));
  ws.close(); browser.kill(); process.exit(0);
}
main().catch((e) => { console.error('FAILED', e); try { browser.kill(); } catch {} process.exit(1); });
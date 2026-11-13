/**
 * Công cụ chụp ảnh kiểm chứng (chỉ dùng lúc phát triển, không đóng gói).
 * Máy này không có Chrome → dùng Edge headless + CDP thô, nạp extension thật
 * để chrome.storage / chrome.tabs hoạt động như lúc chạy thật.
 *
 *   node .impeccable/shoot.mjs
 *
 * Dữ liệu gieo vào sổ là DỮ LIỆU MẪU tổng hợp, chỉ nằm trong profile tạm.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const EXT = path.resolve('.output/chrome-mv3');
const OUT = path.resolve('.impeccable/review');
const PORT = 9345;
const PROFILE = '/tmp/hocduong-shoot';

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  `--disable-extensions-except=${EXT}`,
  `--load-extension=${EXT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars=false',
  '--force-color-profile=srgb',
  'about:blank',
], { stdio: 'ignore' });

async function targets() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  return res.json();
}

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
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return ws;
}

async function evaluate(ws, expression) {
  const resp = await rpc(ws, 'Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (resp.exceptionDetails) {
    throw new Error(`evaluate: ${JSON.stringify(resp.exceptionDetails)}`);
  }
  return resp.result.value;
}

function seedExpression() {
  const pad = (n) => `${n}`.padStart(2, '0');
  const local = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const at = (offsetDays, h, m = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(h, m, 0, 0);
    return local(d);
  };
  const nowIso = new Date().toISOString();
  const subjects = [
    { id: 's1', name: 'Giải tích 2', order: 0, createdAt: nowIso },
    { id: 's2', name: 'Lịch sử Đảng', order: 1, createdAt: nowIso },
    { id: 's3', name: 'Tiếng Anh B2', order: 2, createdAt: nowIso },
    { id: 's4', name: 'Cấu trúc dữ liệu', order: 3, createdAt: nowIso },
    { id: 's5', name: 'Vật lý đại cương', order: 4, createdAt: nowIso },
  ];
  const mk = (id, title, extra) => ({
    id,
    title,
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    subjectId: null,
    done: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...extra,
  });
  const sub = (n, doneCount) =>
    Array.from({ length: n }, (_, i) => ({ id: `x${i}`, title: `Bước ${i + 1}`, done: i < doneCount }));
  const tasks = [
    mk('t1', 'Nghiên cứu phương trình vi phân thường', {
      priority: 'high', dueAt: at(0, 18), subjectId: 's1',
      note: 'Đọc mục 3.2 rồi làm lại ví dụ 4 trong vở.',
      subtasks: sub(3, 1), tags: ['bài tập'],
    }),
    mk('t2', 'Làm bài tập chương 4 — tích phân bội', {
      priority: 'medium', dueAt: at(-1, 20), subjectId: 's1', tags: ['bài tập'],
    }),
    mk('t3', 'Học 20 từ vựng chủ đề Environment', {
      priority: 'low', dueAt: at(0, 21), subjectId: 's3', recurrence: { kind: 'daily' },
    }),
    mk('t4', 'Đọc chương 3: Đường lối kháng chiến toàn quốc', {
      dueAt: at(1, 9), subjectId: 's2',
    }),
    mk('t5', 'Cài đặt cây nhị phân tìm kiếm bằng C', {
      priority: 'high', dueAt: at(3, 23, 59), subjectId: 's4', subtasks: sub(4, 2), tags: ['đồ án'],
    }),
    mk('t6', 'Ôn thí nghiệm con lắc đơn', { priority: 'low', subjectId: 's5' }),
    mk('t7', 'Nộp báo cáo thí nghiệm tuần 6', {
      dueAt: at(0, 8), subjectId: 's5', done: true,
    }),
    mk('t8', 'Dịch đoạn văn về biến đổi khí hậu', {
      dueAt: at(-1, 15), subjectId: 's3', done: true,
    }),
  ];
  const log = {};
  for (let back = 5; back >= 1; back -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - back);
    log[dayKey(d)] = { tasks: 2 + (back % 3), focus: back % 2 };
  }
  log[dayKey(new Date())] = { tasks: 1, focus: 0 };

  const items = { subjects, studyLog: log };
  for (const t of tasks) items[`t:${t.id}`] = t;
  return `new Promise((resolve) => chrome.storage.sync.clear(() => chrome.storage.sync.set(${JSON.stringify(items)}, () => resolve(true))))`;
}

const shots = [
  { name: 'popup', page: 'popup.html', width: 360, height: 560, full: false },
  {
    name: 'popup-subject-menu',
    page: 'popup.html',
    width: 360,
    height: 560,
    full: false,
    // Mở menu lọc môn để chụp trạng thái đang mở (F2)
    action: `(() => {
      const b = document.querySelector('button[aria-label^="Lọc theo môn học"]');
      if (!b) return false;
      b.click();
      return true;
    })()`,
  },
  { name: 'desktop', page: 'newtab.html', width: 1440, height: 900, full: true },
  { name: 'board-1024', page: 'newtab.html', width: 1024, height: 820, full: true },
  { name: 'board-1100', page: 'newtab.html', width: 1100, height: 820, full: true },
  { name: 'board-1280', page: 'newtab.html', width: 1280, height: 900, full: true },
  { name: 'board-900', page: 'newtab.html', width: 900, height: 900, full: true },
  { name: 'board-800', page: 'newtab.html', width: 800, height: 900, full: true },
  { name: 'mobile', page: 'newtab.html', width: 390, height: 844, full: true, touch: true },
];

async function main() {
  let list = [];
  let candidates = [];
  for (let i = 0; i < 60; i += 1) {
    try {
      list = await targets();
      // Edge dựng sẵn nhiều extension cũng có background.js (Gemini, …) —
      // phải đọc manifest để chọn đúng Học Đường, không đoán theo tên file.
      candidates = list.filter(
        (t) => t.type === 'service_worker' && t.url.endsWith('/background.js')
      );
      if (candidates.length > 0) break;
    } catch { /* chưa mở cổng */ }
    await sleep(250);
  }

  let extId = null;
  for (const candidate of candidates) {
    const probe = await connect(candidate.webSocketDebuggerUrl);
    await rpc(probe, 'Runtime.enable');
    const name = await evaluate(
      probe,
      'fetch(chrome.runtime.getURL("manifest.json")).then((r) => r.json()).then((m) => m.name).catch(() => "")'
    );
    probe.close();
    if (typeof name === 'string' && name.startsWith('Học Đường')) {
      extId = new URL(candidate.url).host;
      break;
    }
  }
  if (!extId) throw new Error('Không thấy extension Học Đường được nạp');
  console.log('extension id:', extId);

  const page = list.find((t) => t.type === 'page');
  const ws = await connect(page.webSocketDebuggerUrl);
  await rpc(ws, 'Page.enable');
  await rpc(ws, 'Runtime.enable');

  // Gieo dữ liệu mẫu một lần trên trang extension (có quyền storage)
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 360, height: 560, deviceScaleFactor: 1, mobile: false,
  });
  await rpc(ws, 'Page.navigate', { url: `chrome-extension://${extId}/popup.html` });
  await sleep(900);
  await evaluate(ws, seedExpression());
  console.log('seeded');

  const report = {};
  for (const shot of shots) {
    await rpc(ws, 'Emulation.setDeviceMetricsOverride', {
      width: shot.width,
      height: shot.height,
      deviceScaleFactor: shot.full ? 1 : 2,
      mobile: !!shot.touch,
    });
    await rpc(ws, 'Emulation.setTouchEmulationEnabled', {
      enabled: !!shot.touch, maxTouchPoints: 5,
    });
    await rpc(ws, 'Page.navigate', { url: `chrome-extension://${extId}/${shot.page}` });
    await sleep(1100);
    await evaluate(ws, 'document.fonts.ready.then(() => true)');
    await sleep(500);
    if (shot.action) {
      await evaluate(ws, shot.action);
      await sleep(350);
    }

    const probe = await evaluate(ws, `(() => {
      const de = document.documentElement;
      const overflow = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > window.innerWidth + 1 || r.left < -1) {
          overflow.push(el.className + ' | ' + Math.round(r.left) + '..' + Math.round(r.right));
        }
      }
      return {
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        scrollHeight: de.scrollHeight,
        coarse: matchMedia('(pointer: coarse)').matches,
        fontsLoaded: document.fonts.status,
        bodyFont: getComputedStyle(document.body).fontFamily,
        canvas: getComputedStyle(document.body).backgroundColor,
        overflow: overflow.slice(0, 12),
        scrolls: document.querySelectorAll('.scroll-task').length,
        spines: document.querySelectorAll('.spine').length,
      };
    })()`);
    report[shot.name] = probe;

    const shot64 = await rpc(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: !!shot.full,
    });
    writeFileSync(path.join(OUT, `${shot.name}.png`), Buffer.from(shot64.data, 'base64'));
    console.log('shot', shot.name, JSON.stringify(probe));
  }

  writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(report, null, 2));
  ws.close();
  browser.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error('FAILED', error);
  try { browser.kill(); } catch { /* noop */ }
  process.exit(1);
});
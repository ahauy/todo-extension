/**
 * Baseline evidence probe for son-mai-ui-audit (scratch tooling, NOT product code).
 * Drives headless Edge over raw CDP: screenshots + DOM/layout/contrast/font measurements.
 * Usage: node baseline-probe.mjs
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CDP_PORT = process.env.CDP_PORT || '9345';
const HTTP_PORT = process.env.HTTP_PORT || '8899';
const BASE = `http://127.0.0.1:${HTTP_PORT}`;
const OUT = '/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/shots';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  const list = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then((r) => r.json());
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target: ' + JSON.stringify(list));
  return page;
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
const eventWaiters = [];
const consoleErrors = [];

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    consoleErrors.push('exception: ' + d.text + ' ' + (d.exception?.description || ''));
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    const e = msg.params.entry;
    consoleErrors.push(`${e.source}: ${e.text} ${e.url || ''}`.trim());
  }
  for (let i = 0; i < eventWaiters.length; i++) {
    if (eventWaiters[i].method === msg.method) {
      const w = eventWaiters.splice(i, 1)[0];
      clearTimeout(w.timer);
      w.resolve(msg.params);
      return;
    }
  }
});

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('cdp timeout: ' + method));
    }, 20000);
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function waitEvent(method, ms = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const i = eventWaiters.findIndex((w) => w.method === method);
      if (i >= 0) eventWaiters.splice(i, 1);
      reject(new Error('event timeout: ' + method));
    }, ms);
    eventWaiters.push({ method, resolve, timer });
  });
}

async function evaluate(expression, { awaitPromise = false } = {}) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (res.exceptionDetails) {
    throw new Error('evaluate: ' + res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
  }
  const ro = res.result ?? res;
  return ro?.value !== undefined ? ro.value : ro?.result?.value;
}

async function emulate(width, height, dsf, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dsf, mobile });
}

async function nav(url) {
  const loaded = waitEvent('Page.loadEventFired', 25000);
  await send('Page.navigate', { url });
  await loaded;
}

async function settle(ms = 1200) {
  await sleep(ms);
  try {
    await evaluate('document.fonts.ready.then(() => true)', { awaitPromise: true });
  } catch { /* keep going */ }
  await sleep(150);
}

async function shot(name) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const p = join(OUT, name);
  const buf = Buffer.from(res.data, 'base64');
  writeFileSync(p, buf);
  return { path: p, bytes: buf.length };
}

/* ---------------- in-page probe source ---------------- */

const PAGE_PROBE = String.raw`
(function () {
  var errors = (window.__errors || []).slice(0, 40);

  function selPath(el) {
    var parts = [], n = el, guard = 0;
    while (n && n.nodeType === 1 && parts.length < 5 && guard++ < 20) {
      var s = n.tagName.toLowerCase();
      if (n.id) s += '#' + n.id;
      var cls = (typeof n.className === 'string' ? n.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
      n = n.parentElement;
    }
    return parts.join('>');
  }

  function inScrollerX(el) {
    var n = el.parentElement;
    while (n && n !== document.documentElement) {
      var ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
      n = n.parentElement;
    }
    return false;
  }

  function bgChain(el) {
    var chain = [], n = el, guard = 0;
    while (n && n.nodeType === 1 && guard++ < 12) {
      var cs = getComputedStyle(n);
      var bg = cs.backgroundColor;
      var hasImg = cs.backgroundImage && cs.backgroundImage !== 'none';
      chain.push({ sel: selPath(n), bg: bg, img: hasImg ? cs.backgroundImage.slice(0, 60) : null, opacity: cs.opacity });
      if (hasImg) break;
      if (bg && bg !== 'rgba(0, 0, 0, 0)') {
        var m = bg.match(/rgba?\(([^)]+)\)/);
        if (!m) break;
        var p = m[1].split(',').map(Number);
        if (p.length < 4 || p[3] >= 0.999) break;
      }
      n = n.parentElement;
    }
    return chain;
  }

  var vw = document.documentElement.clientWidth;
  var docOverflow = document.documentElement.scrollWidth - vw;

  var overflow = [];
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    var rightOver = +(r.right - vw).toFixed(1);
    var swOver = el.clientWidth > 0 ? el.scrollWidth - el.clientWidth : 0;
    if (rightOver > 0.5 || swOver > 1) {
      overflow.push({
        sel: selPath(el),
        rightOver: rightOver,
        scrollW: el.scrollWidth,
        clientW: el.clientWidth,
        inXScroller: inScrollerX(el),
        pos: getComputedStyle(el).position,
      });
    }
  }

  var tokens = {};
  var rootCS = getComputedStyle(document.documentElement);
  for (var j = 0; j < rootCS.length; j++) {
    var name = rootCS[j];
    if (name.indexOf('--') === 0) tokens[name] = rootCS.getPropertyValue(name).trim();
  }

  // visible text elements with a direct text node
  var texts = [];
  var nodes = document.querySelectorAll('body *');
  for (var k = 0; k < nodes.length && texts.length < 150; k++) {
    var n2 = nodes[k];
    var direct = '';
    for (var c = 0; c < n2.childNodes.length; c++) {
      var ch = n2.childNodes[c];
      if (ch.nodeType === 3) direct += ch.nodeValue;
    }
    direct = direct.replace(/\s+/g, ' ').trim();
    if (!direct) continue;
    var r2 = n2.getBoundingClientRect();
    if (r2.width === 0 || r2.height === 0) continue;
    var cs2 = getComputedStyle(n2);
    if (cs2.visibility === 'hidden' || cs2.display === 'none') continue;
    texts.push({
      sel: selPath(n2),
      text: direct.slice(0, 60),
      color: cs2.color,
      fontSize: parseFloat(cs2.fontSize),
      fontWeight: cs2.fontWeight,
      opacity: cs2.opacity,
      chain: bgChain(n2),
    });
  }

  // interactive targets
  var targets = [];
  var inter = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="menuitem"]');
  for (var t = 0; t < inter.length; t++) {
    var e2 = inter[t];
    var r3 = e2.getBoundingClientRect();
    if (r3.width === 0 && r3.height === 0) continue;
    targets.push({
      sel: selPath(e2),
      label: (e2.getAttribute('aria-label') || e2.textContent || e2.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      w: +r3.width.toFixed(1),
      h: +r3.height.toFixed(1),
      x: +r3.left.toFixed(1),
      y: +r3.top.toFixed(1),
    });
  }

  var fontsLoaded = [];
  try {
    document.fonts.forEach(function (f) {
      fontsLoaded.push({
        family: f.family.replace(/"/g, ''),
        status: f.status,
        unicodeRange: (f.unicodeRange || '').slice(0, 40),
        display: f.display,
      });
    });
  } catch (e) { fontsLoaded.push({ error: String(e) }); }

  var h1 = document.querySelector('h1, h2');
  var bodyCS = getComputedStyle(document.body);

  var fixedEls = [];
  var fixedNodes = document.querySelectorAll('body *');
  for (var f = 0; f < fixedNodes.length; f++) {
    var cs3 = getComputedStyle(fixedNodes[f]);
    if (cs3.position === 'fixed' || cs3.position === 'sticky') {
      var rr = fixedNodes[f].getBoundingClientRect();
      fixedEls.push({ sel: selPath(fixedNodes[f]), pos: cs3.position, top: +rr.top.toFixed(1), bottom: +rr.bottom.toFixed(1), h: +rr.height.toFixed(1) });
    }
  }

  var scrollables = [];
  var scrNodes = document.querySelectorAll('body *');
  for (var s = 0; s < scrNodes.length; s++) {
    var c2 = getComputedStyle(scrNodes[s]);
    if ((c2.overflowY === 'auto' || c2.overflowY === 'scroll') && scrNodes[s].scrollHeight > scrNodes[s].clientHeight + 1) {
      scrollables.push({ sel: selPath(scrNodes[s]), clientH: scrNodes[s].clientHeight, scrollH: scrNodes[s].scrollHeight });
    }
  }

  var dialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
  var active = document.activeElement;

  var failedRes = performance.getEntriesByType('resource')
    .filter(function (r) { return r.responseStatus && r.responseStatus >= 400; })
    .map(function (r) { return r.name + ' -> ' + r.responseStatus; });

  return JSON.stringify({
    url: location.href,
    title: document.title,
    rootChildren: (document.getElementById('root') || {}).children ? document.getElementById('root').children.length : -1,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    docScrollWidth: document.documentElement.scrollWidth,
    docScrollHeight: document.documentElement.scrollHeight,
    docOverflow: docOverflow,
    errors: errors,
    overflow: overflow,
    tokens: tokens,
    texts: texts,
    targets: targets,
    fonts: {
      status: document.fonts.status,
      loaded: fontsLoaded,
      cormorant: document.fonts.check('16px "Cormorant Garamond"'),
      cormorantVi: document.fonts.check('16px "Cormorant Garamond"', 'Tốt nghiệp Ấp Ủ Đường'),
      ebGaramond: document.fonts.check('16px "EB Garamond"'),
      ebGaramondVi: document.fonts.check('16px "EB Garamond"', 'Tốt nghiệp Ấp Ủ Đường'),
      dancing: document.fonts.check('16px "Dancing Script"'),
      headingFamily: h1 ? getComputedStyle(h1).fontFamily : null,
      headingText: h1 ? h1.textContent.trim().slice(0, 40) : null,
      bodyFamily: bodyCS.fontFamily,
      bodySize: bodyCS.fontSize,
    },
    fixedEls: fixedEls,
    scrollables: scrollables,
    dialog: dialog ? { sel: selPath(dialog), label: dialog.getAttribute('aria-label') || dialog.getAttribute('aria-labelledby') || '' } : null,
    activeElement: active ? (active.tagName + '.' + (typeof active.className === 'string' ? active.className.slice(0, 40) : '') + '|' + (active.textContent || '').trim().slice(0, 30)) : null,
    failedResources: failedRes,
    bodyText: (document.body.innerText || '').slice(0, 600),
  });
})()
`;

/* ---------------- contrast math ---------------- */

function parseColor(str) {
  if (!str) return null;
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((s) => parseFloat(s.trim()));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

function over(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function lum(c) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

function ratio(a, b) {
  const l1 = lum(a), l2 = lum(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function resolveBg(chain) {
  let bg = { r: 255, g: 255, b: 255, a: 1 };
  for (let i = chain.length - 1; i >= 0; i--) {
    const c = parseColor(chain[i].bg);
    if (c && c.a > 0) bg = over(c, bg);
  }
  return bg;
}

function contrastReport(probe) {
  const rows = [];
  for (const t of probe.texts) {
    const fgRaw = parseColor(t.color);
    if (!fgRaw) continue;
    const bg = resolveBg(t.chain);
    const fg = over(fgRaw, bg);
    const cr = ratio(fg, bg);
    const large = t.fontSize >= 24 || (t.fontSize >= 18.66 && parseInt(t.fontWeight, 10) >= 700);
    rows.push({
      sel: t.sel,
      text: t.text,
      color: t.color,
      size: t.fontSize,
      weight: t.fontWeight,
      bg: `rgb(${bg.r.toFixed(0)}, ${bg.g.toFixed(0)}, ${bg.b.toFixed(0)})`,
      bgFrom: t.chain.length > 1 ? t.chain[t.chain.length - 2].sel : t.chain[0]?.sel,
      cr: +cr.toFixed(2),
      need: large ? 3 : 4.5,
      pass: cr >= (large ? 3 : 4.5),
      gradientNote: t.chain.some((c) => c.img),
    });
  }
  return rows;
}

/* ---------------- run ---------------- */

const report = { startedAt: new Date().toISOString(), frames: [], states: [], notes: [] };

async function captureProbe(name, meta = {}) {
  const raw = await evaluate(PAGE_PROBE);
  const probe = JSON.parse(raw);
  const shotInfo = await shot(name);
  const entry = { name, ...meta, shot: shotInfo.path, bytes: shotInfo.bytes, probe, contrast: contrastReport(probe) };
  report.frames.push(entry);
  return entry;
}

async function main() {
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__errors = window.__errors || [];',
  });

  /* -------- POPUP 360x560 @2x -------- */
  await emulate(360, 560, 2, false);
  await nav(`${BASE}/popup-shim.html`);
  await settle(1500);
  const popup = await captureProbe('popup-default-360x560-light-before.png', { surface: 'popup', viewport: '360x560', dsf: 2 });

  // overdue marker check
  report.notes.push('popup body text: ' + popup.probe.bodyText.replace(/\n/g, ' | '));

  // detail (TaskParchment)
  const detailClick = await evaluate(`(function(){
    var b = document.querySelector('button.scroll-title') || document.querySelector('.scroll-title') || document.querySelector('[data-task-id] button');
    if (!b) return 'NOT_FOUND';
    b.click(); return 'clicked:' + (b.className||'').toString().slice(0,40);
  })()`);
  await sleep(700);
  const detail = await captureProbe('popup-detail-parchment-360x560-light-before.png', { surface: 'popup', state: 'task detail open' });
  report.notes.push('detail click: ' + detailClick + ' | dialog: ' + JSON.stringify(detail.probe.dialog));

  // Escape closes top layer?
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await sleep(450);
  const afterEsc = await evaluate(`JSON.stringify({
    dialog: !!document.querySelector('[role="dialog"],[aria-modal="true"]'),
    focus: document.activeElement ? document.activeElement.tagName + '|' + (document.activeElement.textContent||'').trim().slice(0,25) : null
  })`);
  report.notes.push('after Escape: ' + afterEsc);

  // settings
  const settingsClick = await evaluate(`(function(){
    var b = document.querySelector('button[aria-label="Cài đặt"]') || Array.from(document.querySelectorAll('button')).find(function(x){return /cài đặt/i.test(x.textContent||'')});
    if (!b) return 'NOT_FOUND';
    b.click(); return 'clicked';
  })()`);
  await sleep(700);
  const settings = await captureProbe('popup-settings-360x560-light-before.png', { surface: 'popup', state: 'settings open' });
  report.notes.push('settings click: ' + settingsClick + ' | body: ' + settings.probe.bodyText.replace(/\n/g, ' | ').slice(0, 300));

  // pomodoro running (fresh load then start)
  await nav(`${BASE}/popup-shim.html?p=2`);
  await settle(1300);
  const startClick = await evaluate(`(function(){
    var b = Array.from(document.querySelectorAll('button')).find(function(x){return /Bắt đầu học/i.test(x.textContent||'')});
    if (!b) return 'NOT_FOUND:' + Array.from(document.querySelectorAll('button')).map(function(x){return (x.textContent||'').trim().slice(0,18)}).join(' / ');
    b.click(); return 'clicked';
  })()`);
  await sleep(1600);
  const pomo = await captureProbe('popup-pomodoro-running-360x560-light-before.png', { surface: 'popup', state: 'pomodoro running' });
  report.notes.push('pomodoro start: ' + startClick + ' | body: ' + pomo.probe.bodyText.replace(/\n/g, ' | ').slice(0, 300));

  /* -------- POPUP EMPTY -------- */
  await nav(`${BASE}/popup-shim-empty.html`);
  await settle(1300);
  const empty = await captureProbe('popup-empty-360x560-light-before.png', { surface: 'popup', state: 'empty' });
  report.notes.push('empty body: ' + empty.probe.bodyText.replace(/\n/g, ' | ').slice(0, 300));

  /* -------- NEWTAB WIDTHS -------- */
  const widths = [
    [1440, 900],
    [1280, 800],
    [1023, 900],
    [768, 1024],
    [390, 844],
    [320, 568],
  ];
  for (const [w, h] of widths) {
    await emulate(w, h, 1, false);
    await nav(`${BASE}/newtab-shim.html?vw=${w}`);
    await settle(1500);
    await captureProbe(`newtab-${w}x${h}-light-before.png`, { surface: 'newtab', viewport: `${w}x${h}`, dsf: 1 });
  }

  // full-page 1440 for context
  await emulate(1440, 900, 1, false);
  await nav(`${BASE}/newtab-shim.html?vw=1440full`);
  await settle(1500);
  {
    const res = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const buf = Buffer.from(res.data, 'base64');
    writeFileSync(join(OUT, 'newtab-1440x900-full-light-before.png'), buf);
    report.notes.push('full-page 1440: ' + buf.length + ' bytes, docScrollHeight=' + (await evaluate('document.documentElement.scrollHeight')));
  }

  report.consoleErrors = consoleErrors;
  writeFileSync('/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/baseline-measurements.json', JSON.stringify(report, null, 2));

  // compact console summary
  for (const f of report.frames) {
    const p = f.probe;
    const wide = f.contrast.filter((c) => !c.pass);
    const small = p.targets.filter((t) => t.w < 24 || t.h < 24);
    console.log(`${f.name} | docOverflow=${p.docOverflow} | errors=${p.errors.length} | overflowEls=${p.overflow.length} | contrastFail=${wide.length} | smallTargets=${small.length} | h=${p.docScrollHeight}`);
  }
  console.log('notes: ' + JSON.stringify(report.notes, null, 1));
  ws.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('PROBE FAILED:', err);
  try { ws.close(); } catch { /* ignore */ }
  process.exit(1);
});

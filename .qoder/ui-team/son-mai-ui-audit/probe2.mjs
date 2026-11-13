/** Follow-up probe: disabled states, real target boxes, scroller classification, pomodoro run. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://127.0.0.1:8899';
const OUT = '/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = await fetch('http://127.0.0.1:9345/json/list').then((r) => r.json());
const target = list.find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const waiters = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(String(ev.data));
  if (m.id !== undefined && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
    return;
  }
  const i = waiters.findIndex((w) => w.method === m.method);
  if (i >= 0) { clearTimeout(waiters[i].timer); waiters.splice(i, 1)[0].resolve(m.params); }
});
function send(method, params = {}) {
  const n = ++id;
  return new Promise((res, rej) => {
    pending.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
function waitEvent(method, ms = 20000) {
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error('timeout ' + method)), ms);
    waiters.push({ method, resolve: res, timer });
  });
}
async function ev(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  const ro = r.result ?? r;
  return ro?.value !== undefined ? ro.value : ro?.result?.value;
}
async function emulate(w, h, dsf) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: false });
}
async function nav(url) {
  const p = waitEvent('Page.loadEventFired', 25000);
  await send('Page.navigate', { url });
  await p;
}
async function settle(ms = 1400) {
  await sleep(ms);
  await ev('document.fonts.ready.then(()=>true)', true).catch(() => {});
  await sleep(150);
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(r.data, 'base64');
  writeFileSync(join(OUT, name), buf);
  return buf.length;
}

const HELPER = String.raw`
window.__h = {
  path: function (el) {
    var parts = [], n = el, g = 0;
    while (n && n.nodeType === 1 && parts.length < 5 && g++ < 20) {
      var s = n.tagName.toLowerCase();
      if (n.id) s += '#' + n.id;
      var cls = (typeof n.className === 'string' ? n.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s); n = n.parentElement;
    }
    return parts.join('>');
  },
  box: function (el) { var r = el.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +r.left.toFixed(1), y: +r.top.toFixed(1) }; },
  scrollInfo: function () {
    var out = [], nodes = document.querySelectorAll('body *');
    for (var i = 0; i < nodes.length; i++) {
      var cs = getComputedStyle(nodes[i]);
      if (nodes[i].scrollWidth > nodes[i].clientWidth + 1 && nodes[i].clientWidth > 0) {
        out.push({ sel: __h.path(nodes[i]), ownOX: cs.overflowX, sw: nodes[i].scrollWidth, cw: nodes[i].clientWidth });
      }
    }
    return out;
  }
};
'ok'
`;

const report = { steps: [], shots: [] };

async function main() {
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  await send('Page.enable');
  await send('Runtime.enable');

  /* ---- popup: disabled + target boxes + scrollers ---- */
  await emulate(360, 560, 2);
  await nav(`${BASE}/popup-shim.html?x=1`);
  await settle();
  await ev(HELPER);
  report.popupDefault = JSON.parse(await ev(String.raw`JSON.stringify({
    scrollers: __h.scrollInfo(),
    buttons: Array.from(document.querySelectorAll('button')).map(function (b) {
      return { sel: __h.path(b), label: (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g,' ').trim().slice(0,40), disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled'), box: __h.box(b) };
    }),
    footer: (function(){ var f=document.querySelector('footer.popup-footer'); var c=document.querySelector('div.min-h-0.flex-1'); return { footer: f?__h.box(f):null, listRect: c?__h.box(c):null, listScroll: c?{clientH:c.clientHeight,scrollH:c.scrollHeight}:null }; })(),
    composerInput: (function(){ var i=document.querySelector('textarea, input'); return i?{sel:__h.path(i), value:i.value, placeholder:i.placeholder, box:__h.box(i)}:null; })()
  })`));

  /* ---- popup: detail target boxes ---- */
  await ev(`(function(){ var b=document.querySelector('button.scroll-title'); if(b) b.click(); return !!b; })()`);
  await sleep(700);
  report.detail = JSON.parse(await ev(String.raw`JSON.stringify({
    tagChip: (function(){ var b=document.querySelector('button[aria-label^="Bỏ thẻ"]'); if(!b) return null; return { box: __h.box(b), parent: __h.box(b.parentElement), parentSel: __h.path(b.parentElement) }; })(),
    sealCheck: Array.from(document.querySelectorAll('label.seal-check')).map(function(l){ return { box: __h.box(l), inputBox: __h.box(l.querySelector('input')), text: l.textContent.trim().slice(0,20) }; }),
    saveBtn: (function(){ var b=Array.from(document.querySelectorAll('button')).find(function(x){return /^Lưu/.test(x.textContent.trim())}); return b?{disabled:b.disabled, box:__h.box(b), color:getComputedStyle(b).color, opacity:getComputedStyle(b).opacity}:null; })(),
    addBtn: (function(){ var b=Array.from(document.querySelectorAll('button')).find(function(x){return /^Thêm/.test(x.textContent.trim())}); return b?{disabled:b.disabled, box:__h.box(b), color:getComputedStyle(b).color, opacity:getComputedStyle(b).opacity}:null; })(),
    scrollers: __h.scrollInfo(),
    heading: (function(){ var h=document.getElementById('_r_3_'); if(!h) return null; var r=h.getBoundingClientRect(); return { text:h.innerText.replace(/\s+/g,' '), w:+r.width.toFixed(1), scrollW:h.scrollWidth, clientW:h.clientWidth, font:getComputedStyle(h).fontFamily, size:getComputedStyle(h).fontSize }; })()
  })`));

  /* ---- popup: pomodoro running via compact timer button ---- */
  await nav(`${BASE}/popup-shim.html?x=2`);
  await settle(1200);
  const clickTimer = await ev(`(function(){
    var b = document.querySelector('button.timer-compact-button');
    if (!b) return 'NOT_FOUND';
    var before = { label: b.getAttribute('aria-label'), box: (function(){var r=b.getBoundingClientRect();return {w:+r.width.toFixed(1),h:+r.height.toFixed(1)};})() };
    b.click();
    return JSON.stringify(before);
  })()`);
  await sleep(1500);
  const pomoState = await ev(`JSON.stringify({
    timerLabel: (document.querySelector('button.timer-compact-button')||{}).getAttribute ? document.querySelector('button.timer-compact-button').getAttribute('aria-label') : null,
    readout: (document.querySelector('.timer-readout')||{}).textContent,
    phaseText: document.body.innerText.split(String.fromCharCode(10)).filter(function(l){return /Giờ (học|nghỉ)/.test(l)}).slice(0,3),
    ring: !!document.querySelector('.timer-ring'),
    timerBox: (function(){var b=document.querySelector('button.timer-compact-button'); if(!b) return null; var r=b.getBoundingClientRect(); return {w:+r.width.toFixed(1),h:+r.height.toFixed(1)};})()
  })`);
  report.pomodoroPopup = { click: clickTimer, state: JSON.parse(pomoState), bytes: await shot('popup-pomodoro-running-360x560-light-before.png') };

  /* ---- newtab 1440: pomodoro running + settings in footer ---- */
  await emulate(1440, 900, 1);
  await nav(`${BASE}/newtab-shim.html?x=3`);
  await settle(1500);
  await ev(HELPER);
  const start2 = await ev(`(function(){
    var b = Array.from(document.querySelectorAll('button')).find(function(x){ return /Bắt đầu học/.test(x.textContent||''); });
    if (!b) return 'NOT_FOUND';
    b.click(); return 'clicked';
  })()`);
  await sleep(1500);
  report.pomodoroNewtab = {
    click: start2,
    state: JSON.parse(await ev(`JSON.stringify({
      readout: (document.querySelector('.timer-readout')||{}).textContent,
      pauseLabel: !!Array.from(document.querySelectorAll('button')).find(function(x){return /Tạm dừng/.test(x.textContent||'')}),
      ringOpacity: (function(){var c=document.querySelector('.timer-ring circle'); return c?getComputedStyle(c).opacity:null;})()
    })`)),
    bytes: await shot('newtab-1440x900-pomodoro-running-light-before.png'),
  };

  /* ---- newtab 1023 + 320: shelf strip scroller facts ---- */
  for (const [w, h] of [[1023, 900], [320, 568]]) {
    await emulate(w, h, 1);
    await nav(`${BASE}/newtab-shim.html?x=${w}`);
    await settle(1400);
    await ev(HELPER);
    report['scrollers' + w] = JSON.parse(await ev(`JSON.stringify({
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrollers: __h.scrollInfo().slice(0, 12),
      shelfStrip: (function(){var s=document.querySelector('.board-shelf-strip'); if(!s) return null; var r=s.getBoundingClientRect(); var cs=getComputedStyle(s); return {box:{w:+r.width.toFixed(1),h:+r.height.toFixed(1)}, display:cs.display, grid:getComputedStyle(document.querySelector('.board-grid')).gridTemplateColumns};})(),
      shelfRibbon: (function(){var s=document.querySelector('.board-shelf-strip .ribbon'); if(!s) return null; var cs=getComputedStyle(s); var b=s.querySelector('button.ribbon-tab'); return {ownOX:cs.overflowX, sw:s.scrollWidth, cw:s.clientWidth, firstTab:b?__h.box(b):null};})()
    })`));
  }

  /* ---- newtab 1440: settings via footer link ---- */
  await emulate(1440, 900, 1);
  await nav(`${BASE}/newtab-shim.html?x=4`);
  await settle(1400);
  const settingsOpen = await ev(`(function(){
    var b = document.querySelector('footer.colophon button');
    if (!b) return 'NOT_FOUND';
    b.click(); return 'clicked';
  })()`);
  await sleep(800);
  report.newtabSettings = { click: settingsOpen, bytes: await shot('newtab-1440x900-settings-light-before.png') };

  writeFileSync('/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/probe2.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1).slice(0, 6000));
  ws.close();
  process.exit(0);
}

main().catch((e) => { console.error('FAILED', e); try { ws.close(); } catch {} process.exit(1); });

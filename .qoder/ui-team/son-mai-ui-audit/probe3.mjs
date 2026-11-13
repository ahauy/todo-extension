/** Probe 3: seal button internals, drop-cap metrics, sepia usage, muted text audit. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const BASE = 'http://127.0.0.1:8899';
const OUT = '/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const list = await fetch('http://127.0.0.1:9345/json/list').then((r) => r.json());
const target = list.find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const waiters = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(String(ev.data));
  if (m.id !== undefined && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
  const i = waiters.findIndex((w) => w.method === m.method);
  if (i >= 0) { clearTimeout(waiters[i].timer); waiters.splice(i, 1)[0].resolve(m.params); }
});
const send = (method, params = {}) => { const n = ++id; return new Promise((res, rej) => { pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params })); }); };
const waitEvent = (method, ms = 20000) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout ' + method)), ms); waiters.push({ method, resolve: res, timer: t }); });
async function ev(expression, ap = false) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: ap }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); const ro = r.result ?? r; return ro?.value !== undefined ? ro.value : ro?.result?.value; }
const emulate = (w, h, d) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: d, mobile: false });
async function nav(url) { const p = waitEvent('Page.loadEventFired', 25000); await send('Page.navigate', { url }); await p; }
async function settle(ms = 1400) { await sleep(ms); await ev('document.fonts.ready.then(()=>true)', true).catch(() => {}); await sleep(150); }

async function main() {
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  await send('Page.enable'); await send('Runtime.enable');

  await emulate(1440, 900, 1);
  await nav(`${BASE}/newtab-shim.html?y=1`);
  await settle(1600);

  const out = JSON.parse(await ev(String.raw`JSON.stringify({
    sealButtons: Array.from(document.querySelectorAll('button.seal-button')).map(function (b) {
      var cs = getComputedStyle(b); var svg = b.querySelector('svg'); var r = b.getBoundingClientRect();
      return {
        label: b.getAttribute('aria-label'),
        box: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        bg: cs.backgroundColor, color: cs.color, border: cs.borderColor,
        hasSvg: !!svg,
        svg: svg ? svg.outerHTML.slice(0, 400) : null,
        html: b.innerHTML.slice(0, 300),
      };
    }),
    dropCaps: Array.from(document.querySelectorAll('.drop-cap, .greeting-title .drop-cap')).map(function (s) {
      var cs = getComputedStyle(s); var r = s.getBoundingClientRect(); var h = s.parentElement.getBoundingClientRect();
      return { text: s.textContent, font: cs.fontFamily, size: cs.fontSize, marginRight: cs.marginRight, marginLeft: cs.marginLeft, box: { w: +r.width.toFixed(1), x: +r.left.toFixed(1), y: +r.top.toFixed(1) }, parentW: +h.width.toFixed(1) };
    }),
    greeting: (function () {
      var h = document.querySelector('h1.greeting-title'); if (!h) return null;
      var cs = getComputedStyle(h); var r = h.getBoundingClientRect();
      var range = document.createRange(); range.selectNodeContents(h);
      var rects = Array.from(range.getClientRects()).map(function (x) { return { x: +x.left.toFixed(1), y: +x.top.toFixed(1), w: +x.width.toFixed(1), h: +x.height.toFixed(1) }; }).slice(0, 8);
      return { text: h.innerText.replace(/\s+/g, ' '), font: cs.fontFamily, size: cs.fontSize, lh: cs.lineHeight, box: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, textRects: rects };
    })(),
    sepiaText: Array.from(document.querySelectorAll('body *')).filter(function (el) {
      var c = getComputedStyle(el).color;
      return c === 'rgb(154, 123, 92)' && el.textContent.trim();
    }).slice(0, 8).map(function (el) { var r = el.getBoundingClientRect(); return { text: el.textContent.trim().slice(0, 40), size: getComputedStyle(el).fontSize, box: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }; }),
    smallTextColors: (function () {
      var m = {};
      Array.from(document.querySelectorAll('body *')).forEach(function (el) {
        var t = Array.from(el.childNodes).some(function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
        if (!t) return;
        var cs = getComputedStyle(el); var fs = parseFloat(cs.fontSize);
        if (fs >= 16) return;
        var k = cs.color + ' @ ' + fs + 'px';
        m[k] = (m[k] || 0) + 1;
      });
      return m;
    })(),
    hiddenTabs: Array.from(document.querySelectorAll('.ribbon')).map(function (rb) {
      var r = rb.getBoundingClientRect(); var cs = getComputedStyle(rb);
      return { sel: (rb.className || '').toString().slice(0, 40), w: +r.width.toFixed(1), sw: rb.scrollWidth, cw: rb.clientWidth, ox: cs.overflowX, mask: cs.maskImage, fade: cs.getPropertyValue('--fade') };
    }),
    ornamentFloat: (function () {
      var cand = Array.from(document.querySelectorAll('svg, .ornament, .rule, .flourish')).map(function (s) {
        var r = s.getBoundingClientRect(); return { cls: (s.getAttribute('class') || s.tagName).toString().slice(0, 40), x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      }).filter(function (o) { return o.w > 20 && o.w < 120 && o.h < 20; });
      return cand.slice(0, 10);
    })(),
    footerLink: (function () { var b = document.querySelector('footer.colophon button'); if (!b) return null; var r = b.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), pad: getComputedStyle(b).padding }; })()
  })`));

  writeFileSync('/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/probe3.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1).slice(0, 7000));
  ws.close(); process.exit(0);
}
main().catch((e) => { console.error('FAILED', e); try { ws.close(); } catch {} process.exit(1); });

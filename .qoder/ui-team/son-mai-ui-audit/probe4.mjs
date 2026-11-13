/** Probe 4: narrow-width card overflow + composer placeholder/chevron collision. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const BASE = 'http://127.0.0.1:8899';
const OUT = '/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const list = await fetch('http://127.0.0.1:9345/json/list').then((r) => r.json());
const target = list.find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const waits = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(String(e.data));
  if (m.id !== undefined && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
  const i = waits.findIndex((w) => w.method === m.method); if (i >= 0) { clearTimeout(waits[i].timer); waits.splice(i, 1)[0].res(m.params); }
});
const send = (method, params = {}) => { const n = ++id; return new Promise((res, rej) => { pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params })); }); };
const waitEvent = (m, ms = 20000) => new Promise((res, rej) => { const timer = setTimeout(() => rej(new Error('t')), ms); waits.push({ method: m, res, timer }); });
const ev = async (expr, ap = false) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); const ro = r.result ?? r; return ro?.value !== undefined ? ro.value : ro?.result?.value; };
const emulate = (w, h, d) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: d, mobile: false });
async function nav(url) { const p = waitEvent('Page.loadEventFired', 25000); await send('Page.navigate', { url }); await p; }
async function settle(ms = 1400) { await sleep(ms); await ev('document.fonts.ready.then(()=>true)', true).catch(() => {}); await sleep(150); }
async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); const b = Buffer.from(r.data, 'base64'); writeFileSync(join(OUT, name), b); return b.length; }

const probe = String.raw`(function(){
  function path(el){var p=[],n=el,g=0;while(n&&n.nodeType===1&&p.length<5&&g++<20){var s=n.tagName.toLowerCase();if(n.id)s+='#'+n.id;var c=(typeof n.className==='string'?n.className:'').trim().split(/\s+/).filter(Boolean).slice(0,2);if(c.length)s+='.'+c.join('.');p.unshift(s);n=n.parentElement;}return p.join('>');}
  function box(el){var r=el.getBoundingClientRect();return {w:+r.width.toFixed(1),h:+r.height.toFixed(1),x:+r.left.toFixed(1),y:+r.top.toFixed(1),right:+r.right.toFixed(1)};}
  var cards = Array.from(document.querySelectorAll('article.scroll-task')).map(function(a){
    var inner = a.querySelector('div.min-w-0.flex-1');
    var meta = a.querySelector('div.mt-xs.flex');
    var title = a.querySelector('button.scroll-title');
    return {
      title: title ? title.textContent.trim() : null,
      card: box(a),
      innerScroll: inner ? { sw: inner.scrollWidth, cw: inner.clientWidth } : null,
      metaScroll: meta ? { sw: meta.scrollWidth, cw: meta.clientWidth, wrap: getComputedStyle(meta).flexWrap } : null,
      titleScroll: title ? { sw: title.scrollWidth, cw: title.clientWidth } : null,
      chips: meta ? Array.from(meta.children).map(function(c){ return { t:(c.textContent||'').trim().slice(0,22), box: box(c), ws: getComputedStyle(c).whiteSpace }; }) : []
    };
  });
  var input = document.querySelector('.quill-input');
  var quillBtn = document.querySelector('.quill button.btn-icon, .quill button');
  var row = document.querySelector('.composer-row');
  return JSON.stringify({
    innerWidth: window.innerWidth,
    cards: cards,
    composer: input ? {
      input: box(input), inputPadRight: getComputedStyle(input).paddingRight, inputFont: getComputedStyle(input).fontSize,
      placeholder: input.placeholder, chevron: quillBtn ? box(quillBtn) : null,
      row: row ? box(row) : null,
      chevronLeft: quillBtn ? box(quillBtn).x : null
    } : null
  });
})()`;

async function main() {
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  await send('Page.enable'); await send('Runtime.enable');
  const out = {};
  for (const [w, h, scrollTo] of [[768, 1024, 470], [390, 844, 620], [320, 568, 760]]) {
    await emulate(w, h, 1);
    await nav(`${BASE}/newtab-shim.html?c=${w}`);
    await settle(1400);
    const before = JSON.parse(await ev(probe));
    await ev(`window.scrollTo(0, ${scrollTo}); true`);
    await sleep(500);
    const bytes = await shot(`newtab-${w}x${h}-cards-scrolled-light-before.png`);
    out[w] = { before, bytes };
  }
  writeFileSync('/Users/vutuanhau/Dev/todo-extension/.qoder/ui-team/son-mai-ui-audit/probe4.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1).slice(0, 8000));
  ws.close(); process.exit(0);
}
main().catch((e) => { console.error('FAILED', e); try { ws.close(); } catch {} process.exit(1); });

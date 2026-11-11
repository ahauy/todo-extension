/**
 * Regression test cho bug/popup-blank-black (phase-1-task-01).
 *
 * Root cause: hooks/useTasks.ts gọi useRef() ở top-level module (ngoài
 * component) → React ném TypeError khi bundle được evaluate →
 * createRoot(...).render() ở main.tsx không bao giờ chạy → #root rỗng.
 *
 * Test chứng minh 2 điều:
 * (a) import module hooks/useTasks không ném lỗi (module eval an toàn);
 * (b) render App vào #root cho ra DOM có nội dung (Header "Việc" +
 *     empty state "Chưa có việc nào."), #root.innerHTML khác rỗng.
 *
 * Stub chrome.storage/alarms/runtime/notifications — không gọi extension API thật.
 */
import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

// ── chrome.* stub (trước khi import module runtime) ─────────────────────────
const store = new Map<string, unknown>();

function snapshotGet(
  keys: string | string[] | Record<string, unknown> | null
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (keys === null) {
    for (const [k, v] of store) out[k] = v;
  } else if (Array.isArray(keys)) {
    for (const k of keys) if (store.has(k)) out[k] = store.get(k);
  } else if (typeof keys === 'string') {
    if (store.has(keys)) out[keys] = store.get(keys);
  } else {
    for (const k of Object.keys(keys)) if (store.has(k)) out[k] = store.get(k);
  }
  return out;
}

const storageChangeListeners: Array<(c: Record<string, unknown>) => void> = [];

const chromeStub = {
  storage: {
    sync: {
      get(
        keys: string | string[] | Record<string, unknown> | null,
        cb: (r: Record<string, unknown>) => void
      ) {
        cb(snapshotGet(keys));
      },
      set(items: Record<string, unknown>, cb?: () => void) {
        for (const [k, v] of Object.entries(items)) store.set(k, v);
        if (cb) cb();
      },
      remove(keys: string | string[], cb?: () => void) {
        for (const k of Array.isArray(keys) ? keys : [keys]) store.delete(k);
        if (cb) cb();
      },
    },
    onChanged: {
      addListener(cb: (c: Record<string, unknown>) => void) {
        storageChangeListeners.push(cb);
      },
      removeListener(cb: (c: Record<string, unknown>) => void) {
        const i = storageChangeListeners.indexOf(cb);
        if (i >= 0) storageChangeListeners.splice(i, 1);
      },
    },
  },
  runtime: { lastError: null as { message?: string } | null },
  alarms: {
    create() {},
    clear() {},
    getAll(cb: (alarms: { name: string }[]) => void) {
      cb([]);
    },
  },
  notifications: { create() {} },
};

// @ts-expect-error — stub toàn cục cho test, khớp chặt hơn type @types/chrome
globalThis.chrome = chromeStub as typeof chrome;

// React act environment (jsdom)
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('popup mount (regression bug/popup-blank-black)', () => {
  it('(a) import hooks/useTasks không ném lỗi ở module scope', async () => {
    await expect(import('../../hooks/useTasks')).resolves.toBeDefined();
  });

  it('(b) render App vào #root cho ra DOM có nội dung', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const { default: App } = await import('./App');

    const root = createRoot(document.getElementById('root')!);
    await act(async () => {
      root.render(React.createElement(App));
    });
    // Flush async loadAll (useEffect mount) → snapshot set lần đầu
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const html = document.getElementById('root')!.innerHTML;
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('Việc');
    expect(html).toContain('Chưa có việc nào.');
    root.unmount();
  });
});

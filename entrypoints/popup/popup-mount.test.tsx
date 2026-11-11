/**
 * Regression test cho bug/popup-blank-black (phase-1-task-01).
 *
 * Root cause: hooks/useTasks.ts gọi useRef() ở top-level module (ngoài
 * component) → React ném TypeError khi bundle được evaluate →
 * createRoot(...).render() ở main.tsx không bao giờ chạy → #root rỗng.
 *
 * Test chứng minh 3 điều:
 * (a) import module hooks/useTasks không ném lỗi (module eval an toàn);
 * (b) render App vào #root cho ra DOM có nội dung: header "Học Đường" +
 *     empty state "Chưa có điều gì cần ghi. Hãy cầm bút lên." (UI Sơn mài
 *     Học Đường), #root.innerHTML khác rỗng;
 * (c) expand composer qua nút "Mở chi tiết việc" (không còn nút '+') bày
 *     form chi tiết — datetime-local + bộ chọn Ưu tiên — ô bút lông
 *     "Tên việc cần ghi" vẫn còn, và body KHÔNG rơi vào fallback
 *     "Có lỗi khi tải popup".
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

  it('(b) render App vào #root cho ra DOM có nội dung (header + empty state)', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const { default: App } = await import('./App');

    const root = createRoot(document.getElementById('root')!);
    await act(async () => {
      root.render(React.createElement(App));
      // Flush ngay trong cùng act: loadAll/useSubjects/useSettings bootstrap
      // async phải resolve trước khi act thoát, tránh cảnh báo update ngoài act
      await new Promise((r) => setTimeout(r, 0));
    });

    const html = document.getElementById('root')!.innerHTML;
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('Học Đường');
    expect(html).toContain('Chưa có điều gì cần ghi. Hãy cầm bút lên.');
    await act(async () => {
      root.unmount();
    });
  });

  it('(c) expand composer hiện form chi tiết, không rơi vào fallback lỗi (D24)', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const { default: App } = await import('./App');

    const root = createRoot(document.getElementById('root')!);
    await act(async () => {
      root.render(React.createElement(App));
      await new Promise((r) => setTimeout(r, 0));
    });

    const expand = document.querySelector(
      'button[aria-label="Mở chi tiết việc"]'
    ) as HTMLButtonElement | null;
    expect(expand).not.toBeNull();
    await act(async () => {
      expand!.click();
    });

    expect(document.querySelector('input[type="datetime-local"]')).not.toBeNull();
    expect(
      document.querySelector('[role="group"][aria-label="Ưu tiên"]')
    ).not.toBeNull();
    expect(
      document.querySelector('input[aria-label="Tên việc cần ghi"]')
    ).not.toBeNull();
    expect(document.body.textContent).not.toContain('Có lỗi khi tải popup');
    await act(async () => {
      root.unmount();
    });
  });
});

/**
 * Regression test cho bug/popup-blank-black (phase-1-task-02).
 *
 * Root cause: popup không có nền dự phòng tĩnh (index.html chỉ set margin/size,
 * còn style.css khai `color-scheme: light dark` → OS dark thì canvas UA đen tuyền)
 * và main.tsx render <App/> không có ErrorBoundary → mọi exception khi render
 * unmount cả cây → màn đen/trống, không text, không thông báo.
 *
 * Test chứng minh 3 điều:
 * (a) ErrorBoundary bắt lỗi render của child → DOM có fallback text đọc được,
 *     không rỗng, không ném tiếp ra ngoài;
 * (b) fallback dùng token nền/chữ (class ổn định `bg-bg` + `text-fg`) + `role="alert"`
 *     — không assert computed CSS vì jsdom không layout;
 * (c) guard tĩnh: index.html có background cho html/body + fallback dark
 *     ⇒ chặn regression "ai đó xoá nền dự phòng".
 */
import { describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

// vitest chạy với root = repo root (vitest.config.ts) → đường dẫn tuyệt đối ổn định.
const INDEX_HTML = resolve(cwd(), 'entrypoints/popup/index.html');

/** Component cố tình ném lỗi khi render — thay cho App crash thật. */
function ThrowingChild(): React.ReactNode {
  throw new Error('lỗi render giả lập trong test');
}

/** Mount <ErrorBoundary><ThrowingChild/></ErrorBoundary> vào #root, giữ console sạch. */
async function mountThrowingChild(): Promise<{
  root: Root;
  container: HTMLElement;
  consoleError: ReturnType<typeof vi.spyOn>;
}> {
  const { default: ErrorBoundary } = await import('../../components/ErrorBoundary');
  document.body.innerHTML = '<div id="root"></div>';
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  // act() sẽ throw nếu lỗi thoát ra ngoài boundary → (a) cũng kiểm tra "không ném tiếp".
  await act(async () => {
    root.render(
      React.createElement(ErrorBoundary, null, React.createElement(ThrowingChild))
    );
  });

  return { root, container, consoleError };
}

describe('popup fallback (regression bug/popup-blank-black #2)', () => {
  it('(a) ErrorBoundary bắt lỗi render và hiện fallback đọc được', async () => {
    const { root, container, consoleError } = await mountThrowingChild();

    const text = container.textContent ?? '';
    expect(text).toContain('Có lỗi khi tải popup');
    expect(container.innerHTML.length).toBeGreaterThan(0);
    expect(consoleError).toHaveBeenCalled();

    root.unmount();
    consoleError.mockRestore();
  });

  it('(b) fallback dùng token nền/chữ (bg-bg + text-fg) và có role="alert"', async () => {
    const { root, container, consoleError } = await mountThrowingChild();

    const fallback = container.querySelector('[role="alert"]') as HTMLElement | null;
    expect(fallback).not.toBeNull();
    expect(fallback!.className).toContain('bg-bg');
    expect(fallback!.className).toContain('text-fg');

    root.unmount();
    consoleError.mockRestore();
  });

  it('(c) index.html có nền tĩnh cho html/body + fallback dark', () => {
    const html = readFileSync(INDEX_HTML, 'utf8');
    const styleStart = html.indexOf('<style>');
    const styleEnd = html.indexOf('</style>');
    expect(styleStart).toBeGreaterThan(-1);
    expect(styleEnd).toBeGreaterThan(styleStart);

    const css = html.slice(styleStart, styleEnd).replace(/\s+/g, ' ').toLowerCase();
    expect(css).toMatch(/html[^{}]*\{[^}]*background\s*:/);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{[^}]*background/);
    expect(css).toContain('#f5f6f7');
    expect(css).toContain('#14171a');
  });
});

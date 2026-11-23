/**
 * D-14/D-18/D-19/D-22/D-23 — regression guards cho đợt polish chi tiết UI cuối.
 * Behavioral defects (D-18, D-19) có test render thật — chạy FAIL trước fix.
 * D-14/D-22/D-23 là thay đổi source/CSS thuần nên dùng source guard.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Modal from '../../components/ui/Modal';
import QuillInput from '../../components/ui/QuillInput';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const rootDir = process.cwd();
const read = (file: string) => readFileSync(resolve(rootDir, file), 'utf8');
const roots: Root[] = [];

function render(node: React.ReactNode): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(node));
  return container;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('D-14 — icon SVG trong Timeline', () => {
  it('không còn glyph Unicode ⤡/⤢/⚠ và dùng icon nét từ hệ Icons', () => {
    const source = read('components/Timeline.tsx');
    expect(source).not.toMatch(/[⤡⤢⚠]/);
    for (const name of ['ExpandIcon', 'CollapseIcon', 'WarningIcon']) {
      expect(source, `Timeline phải render ${name}`).toContain(`<${name}`);
    }
  });

  it('giữ nguyên aria-label/title của nút fullscreen và hai nhãn cảnh báo', () => {
    const source = read('components/Timeline.tsx');
    expect(source).toContain("aria-label={fullscreen ? 'Thu nhỏ thời khoá biểu' : 'Phóng to thời khoá biểu'}");
    expect(source).toContain("title={fullscreen ? 'Thu về bảng' : 'Phóng to toàn tab'}");
    expect(source).toContain('aria-label="Vượt khung 24:00"');
    expect(source).toContain('aria-label="Cảnh báo chồng lấn"');
  });
});

describe('D-18 — Modal labelledBy', () => {
  it('aria-labelledby dùng id truyền vào khi caller cung cấp labelledBy', () => {
    const container = render(
      <>
        <h2 id="title-from-caller">Tiêu đề ngoài</h2>
        <Modal
          open
          onClose={vi.fn()}
          title="Cài đặt"
          labelledBy="title-from-caller"
        >
          Nội dung
        </Modal>
      </>
    );
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-labelledby')).toBe('title-from-caller');
  });

  it('fallback tự sinh vẫn trỏ đúng h2 bên trong khi caller không truyền labelledBy', () => {
    const container = render(
      <Modal open onClose={vi.fn()} title="Cài đặt">
        Nội dung
      </Modal>
    );
    const dialog = container.querySelector('[role="dialog"]')!;
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(dialog.querySelector(`h2#${CSS.escape(labelledBy!)}`)).not.toBeNull();
  });
});

describe('D-19 — QuillInput phản ứng reduced-motion lúc đang mở', () => {
  const listeners = new Set<() => void>();
  let matches = false;
  let removeEventListener: ReturnType<typeof vi.fn>;

  function installMatchMediaMock() {
    listeners.clear();
    matches = false;
    const list = {
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn((type: string, cb: () => void) => {
        if (type === 'change') listeners.add(cb);
      }),
      removeEventListener: vi.fn((type: string, cb: () => void) => {
        if (type === 'change') listeners.delete(cb);
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      get matches() {
        return matches;
      },
    };
    removeEventListener = list.removeEventListener;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn(() => list),
    });
  }

  it('đổi matchMedia change → data-plain đổi ngay, listener được gỡ khi unmount', () => {
    installMatchMediaMock();
    const container = render(
      <QuillInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        placeholder="Nhập việc"
        aria-label="Việc mới"
        quillStyle="pen"
        effectEnabled
      />
    );
    const quill = container.querySelector('.quill')!;
    expect(quill.getAttribute('data-plain')).toBe('false');

    act(() => {
      matches = true;
      for (const cb of listeners) cb();
    });
    expect(quill.getAttribute('data-plain')).toBe('true');

    act(() => roots[0].unmount());
    roots.splice(0, 1); // afterEach không unmount lại root đã đóng.
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(listeners.size).toBe(0);
  });
});

describe('D-22 — :hover cho nút chính / icon', () => {
  it('btn-primary, btn-secondary, btn-ghost, btn-icon đều có rule hover riêng', () => {
    const css = read('styles/components.css');
    for (const name of ['btn-primary', 'btn-secondary', 'btn-ghost', 'btn-icon']) {
      expect(css, `${name} cần :hover`).toMatch(
        new RegExp(`\\.${name}:not\\(:disabled\\)[^\\{]*\\:hover\\s*\\{[^}]*\\}`)
      );
    }
    // Không đổi disabled/focus: rule disabled vẫn còn nguyên.
    expect(css).toMatch(/\.btn:disabled\s*\{[^}]*\}/);
  });
});

describe('D-23 — shadow mềm cho .btn-primary', () => {
  it('.btn-primary dùng token có offset + blur, không còn hard 0 2px 0', () => {
    const css = read('styles/components.css');
    const primary = css.match(/\.btn-primary\s*\{[^}]*\}/)?.[0] ?? '';
    expect(primary).toMatch(/box-shadow:\s*var\(--elev-seal-soft\)/);

    const tokens = read('styles/tokens.css');
    const soft = tokens.match(/--elev-seal-soft:\s*([^;]+);/)?.[1] ?? '';
    expect(soft, 'shadow mềm phải có blur > 0').toMatch(/\b\d+px\s+[1-9]\d*px\b/);
    expect(soft).not.toMatch(/\b0\s+2px\s+0\b/);
  });
});

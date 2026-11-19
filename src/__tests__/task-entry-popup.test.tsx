/**
 * R-25 — TaskEntryPopup: neo con trỏ, ẩn hạn chót/lặp/habit, lỗi quota giữ popup mở,
 * Esc/click ngoài khi đã nhập liệu thì hỏi xác nhận.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaskEntryPopup from '../../components/TaskEntryPopup';
import type { TaskDraft } from '../../lib/tasks/form';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

afterEach(async () => {
  if (root) {
    await React.act(async () => {
      root!.unmount();
    });
  }
  root = null;
  container?.remove();
  container = null;
});

async function mount(props: {
  onCreate?: (draft: TaskDraft) => Promise<void>;
  onClose?: () => void;
}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await React.act(async () => {
    root!.render(
      React.createElement(TaskEntryPopup, {
        mode: 'create',
        anchor: { x: 1200, y: 900 },
        subjects: [],
        onCreate: props.onCreate ?? vi.fn(async () => {}),
        onUpdate: vi.fn(async () => {}),
        onClose: props.onClose ?? vi.fn(),
      })
    );
  });
  return container;
}

function dialog(): HTMLElement {
  const node = document.querySelector('[role="dialog"]') as HTMLElement | null;
  if (!node) throw new Error('popup không tồn tại');
  return node;
}

async function type(title: string) {
  const input = dialog().querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  await React.act(async () => {
    setter.call(input, title);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('TaskEntryPopup (R-25)', () => {
  it('neo sát con trỏ nhưng clamp trong viewport', async () => {
    const el = await mount({});
    const node = dialog();
    expect(node.style.left).toBeTruthy();
    expect(parseFloat(node.style.left)).toBeLessThanOrEqual(window.innerWidth);
    expect(parseFloat(node.style.top)).toBeLessThanOrEqual(window.innerHeight);
    expect(el.querySelector('input[type="datetime-local"]')).toBeNull();
    expect(node.textContent).not.toContain('Lặp lại');
  });

  it('lỗi quota: popup ở lại, hiện inline error, không đóng', async () => {
    const onClose = vi.fn();
    await mount({
      onClose,
      onCreate: vi.fn(async () => {
        throw new Error('QUOTA_BYTES exceeded');
      }),
    });
    await type('Việc bị lỗi');
    const save = [...dialog().querySelectorAll('button')].find(
      (node) => node.textContent?.trim() === 'Ghi vào sổ'
    )!;
    await React.act(async () => {
      save.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(dialog().textContent).toContain('QUOTA_BYTES exceeded');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Tab được giữ trong dialog (focus trap)', async () => {
    await mount({});
    const node = dialog();
    const focusables = [...node.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )];
    const last = focusables[focusables.length - 1];
    const first = focusables[0];
    last.focus();
    await React.act(async () => {
      last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    });
    expect(document.activeElement).toBe(first);
  });

  it('Esc khi đã nhập liệu → hỏi xác nhận trước khi huỷ', async () => {
    const onClose = vi.fn();
    await mount({ onClose });
    await type('Việc đang nhập');
    await React.act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(dialog().querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});

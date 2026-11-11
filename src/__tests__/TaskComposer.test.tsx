/**
 * Test cho TaskComposer (defect #4 trong scan.md).
 * Chỉ test contract ở tầng composer (validate + payload onSubmit).
 * KHÔNG test việc App bỏ mất field khi lưu (defect #5) hay setErrors trong
 * useMemo (defect #19) — các lỗi đó ngoài scope task này.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaskComposer from '../../components/TaskComposer';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Draft = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

const roots: Root[] = [];

function renderComposer(onSubmit: (draft: Draft) => void): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(<TaskComposer onSubmit={onSubmit} />);
  });
  return container;
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

function expand(container: HTMLElement): HTMLInputElement {
  act(() => {
    findButton(container, '+').click();
  });
  const input = container.querySelector(
    'input[placeholder="Ví dụ: Mua sắm tuần"]'
  ) as HTMLInputElement | null;
  if (!input) throw new Error('Form expanded chưa mở');
  return input;
}

function typeTitle(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('TaskComposer', () => {
  it('collapsed hiện "Thêm việc"; bấm + thì mở form', () => {
    const container = renderComposer(vi.fn());

    expect(container.textContent).toContain('Thêm việc');
    expect(
      container.querySelector('input[placeholder="Ví dụ: Mua sắm tuần"]')
    ).toBeNull();

    const input = expand(container);
    expect(input).not.toBeNull();
    expect(container.textContent).toContain('Tên việc');
  });

  it('title rỗng: nút Lưu disabled và không gọi onSubmit', () => {
    const onSubmit = vi.fn();
    const container = renderComposer(onSubmit);
    expand(container);

    const save = findButton(container, 'Lưu');
    expect(save.disabled).toBe(true);

    act(() => {
      save.click();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('title hợp lệ: onSubmit nhận draft đúng default', () => {
    const onSubmit = vi.fn();
    const container = renderComposer(onSubmit);
    const input = expand(container);

    typeTitle(input, '  Mua sắm  ');
    const save = findButton(container, 'Lưu');
    expect(save.disabled).toBe(false);

    act(() => {
      save.click();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const draft = onSubmit.mock.calls[0][0] as Draft;
    expect(draft.title).toBe('Mua sắm');
    expect(draft.done).toBe(false);
    expect(draft.priority).toBe('medium');
    expect(draft.note).toBe('');
    expect(draft.dueAt).toBeNull();
    expect(draft.recurrence).toEqual({ kind: 'none' });
  });

  it('chọn lặp daily khi chưa có hạn: Lưu vẫn disabled', () => {
    const container = renderComposer(vi.fn());
    const input = expand(container);
    typeTitle(input, 'Việc có lặp');

    // Title hợp lệ → Lưu phải enabled trước khi chọn lặp (test không vacuous)
    expect(findButton(container, 'Lưu').disabled).toBe(false);

    act(() => {
      findButton(container, 'Hàng ngày').click();
    });

    // Lặp daily nhưng chưa có dueAt → rule "Cần đặt hạn trước khi chọn lặp lại." chặn
    expect(findButton(container, 'Lưu').disabled).toBe(true);
  });
});

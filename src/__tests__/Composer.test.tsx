/**
 * Test Composer (khu ghi việc — Sơn mài Học Đường):
 * - mặc định thu gọn: ô bút lông + nút "Ghi", chưa có trường chi tiết;
 * - ghi hợp lệ → onSubmit đúng 1 lần với TaskDraft chuẩn hoá (trim + mặc định);
 * - submit khi trống → không gọi onSubmit, hiện role="alert";
 * - mở chi tiết → TaskFields (datetime-local + Segmented "Ưu tiên"), submit
 *   vẫn chạy và tự thu gọn;
 * - expandSignal đổi → focus ô bút lông;
 * - title chỉ toàn khoảng trắng → nút Ghi bị khoá, validate vẫn chặn.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Composer from '../../components/Composer';
import { DEFAULT_SETTINGS } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

interface Rendered {
  container: HTMLElement;
  rerender: (node: React.ReactElement) => void;
}

function renderNode(node: React.ReactElement): Rendered {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(node);
  });
  return {
    container,
    rerender(next: React.ReactElement) {
      act(() => {
        root.render(next);
      });
    },
  };
}

function findButton(scope: ParentNode, label: string): HTMLButtonElement {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

/** Ô nhập THẬT là <input> chuẩn → phải dùng native setter + Event('input'). */
function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressEnter(input: HTMLInputElement): void {
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  );
}

function quillInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector(
    'input[aria-label="Tên việc cần ghi"]'
  ) as HTMLInputElement | null;
  if (!input) throw new Error('Không tìm thấy ô bút lông "Tên việc cần ghi"');
  return input;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('Composer', () => {
  it('mặc định thu gọn: ô bút lông + nút Ghi, chưa có trường chi tiết', () => {
    const { container } = renderNode(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        onSubmit={vi.fn()}
      />
    );

    const input = quillInput(container);
    expect(input.getAttribute('placeholder')).toBe('Hôm nay con cần làm gì?');
    expect(findButton(container, 'Ghi')).not.toBeNull();
    expect(
      container.querySelector('button[aria-label="Mở chi tiết việc"]')
    ).not.toBeNull();
    expect(container.querySelector('input[type="datetime-local"]')).toBeNull();
    expect(
      container.querySelector('[role="group"][aria-label="Ưu tiên"]')
    ).toBeNull();
  });

  it('ghi hợp lệ: onSubmit đúng 1 lần với TaskDraft chuẩn hoá', () => {
    const onSubmit = vi.fn();
    const { container } = renderNode(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        onSubmit={onSubmit}
      />
    );

    act(() => {
      setInputValue(quillInput(container), '  Học bài sử  ');
    });
    act(() => {
      findButton(container, 'Ghi').click();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Học bài sử',
      note: '',
      priority: 'medium',
      dueAt: null,
      recurrence: { kind: 'none' },
      tags: [],
      subtasks: [],
      subjectId: 'subj-1',
      done: false,
    });
  });

  it('submit khi trống: không gọi onSubmit và hiện alert', () => {
    const onSubmit = vi.fn();
    const { container } = renderNode(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        onSubmit={onSubmit}
      />
    );

    act(() => {
      pressEnter(quillInput(container));
    });

    expect(onSubmit).not.toHaveBeenCalled();
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe('Con chưa viết tên việc.');
    // Validate fail → focus được trả về ô bút lông để sửa ngay.
    expect(document.activeElement).toBe(quillInput(container));
  });

  it('mở chi tiết: hiện TaskFields, submit vẫn chạy và tự thu gọn', () => {
    const onSubmit = vi.fn();
    const { container } = renderNode(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        onSubmit={onSubmit}
      />
    );

    const expand = container.querySelector(
      'button[aria-label="Mở chi tiết việc"]'
    ) as HTMLButtonElement;
    act(() => {
      expand.click();
    });

    expect(expand.getAttribute('aria-expanded')).toBe('true');
    expect(
      container.querySelector('button[aria-label="Thu gọn chi tiết việc"]')
    ).not.toBeNull();
    expect(
      container.querySelector('input[type="datetime-local"]')
    ).not.toBeNull();
    const priority = container.querySelector(
      '[role="group"][aria-label="Ưu tiên"]'
    );
    expect(priority).not.toBeNull();
    expect(priority!.querySelectorAll('[role="radio"]')).toHaveLength(3);

    act(() => {
      setInputValue(quillInput(container), 'Làm bài tập toán');
    });
    act(() => {
      findButton(container, 'Ghi').click();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Làm bài tập toán',
    });
    // Ghi xong tự thu gọn phần chi tiết.
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('input[type="datetime-local"]')).toBeNull();
    expect(
      container.querySelector('button[aria-label="Mở chi tiết việc"]')
    ).not.toBeNull();
  });

  it('expandSignal đổi → focus ô bút lông', () => {
    const { container, rerender } = renderNode(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        expandSignal={0}
        onSubmit={vi.fn()}
      />
    );
    const input = quillInput(container);
    expect(document.activeElement).not.toBe(input);

    rerender(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        expandSignal={1}
        onSubmit={vi.fn()}
      />
    );

    expect(document.activeElement).toBe(input);
  });

  it('title chỉ toàn khoảng trắng: nút Ghi khoá, validate vẫn chặn', () => {
    const onSubmit = vi.fn();
    const { container } = renderNode(
      <Composer
        subjects={[]}
        settings={DEFAULT_SETTINGS}
        defaultSubjectId="subj-1"
        onSubmit={onSubmit}
      />
    );

    act(() => {
      setInputValue(quillInput(container), '   ');
    });

    const submit = findButton(container, 'Ghi');
    expect(submit.disabled).toBe(true);
    // Nút bị khoá → click không được phép ghi việc.
    act(() => {
      submit.click();
    });
    // Enter trong ô bút lông vẫn chạy submit → validate chặn bằng alert.
    act(() => {
      pressEnter(quillInput(container));
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Con chưa viết tên việc.'
    );
  });
});

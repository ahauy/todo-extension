/**
 * Integration test cho nhóm A (phase-2-task-01): App wiring.
 * Defects: #5 composer data, #6 FilterBar/tab/search/sort, #10 dirty dialog,
 * #15 undo, #20 keyboard n + /.
 *
 * Không dùng @testing-library — createRoot + act + chrome stub.
 * Module useTasks có state ở module scope → resetModules mỗi test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createChromeStub,
  type ChromeStub,
} from '../../src/__tests__/helpers/chrome-stub';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Việc mẫu',
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

let stub: ChromeStub;
let cleanup: (() => Promise<void>) | null = null;

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
    await flush();
  });
}

async function renderApp(): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('./App');

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(App));
  });
  await React.act(async () => {
    await flush();
  });

  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return container;
}

function findButton(scope: ParentNode, label: string): HTMLButtonElement {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressKey(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  await flush();
  document.body.innerHTML = '';
});

describe('App wiring — tab / search / sort (#6)', () => {
  it('tab "Đang làm" ẩn task đã xong', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc đang làm' }),
      't:b': fixture({ id: 'b', title: 'Việc đã xong', done: true }),
    });
    const container = await renderApp();

    expect(container.textContent).toContain('Việc đã xong');

    await act(async () => {
      findButton(container, 'Đang làm').click();
    });

    expect(container.textContent).toContain('Việc đang làm');
    expect(container.textContent).not.toContain('Việc đã xong');
  });

  it('chỉ render 1 FilterBar trong list view', async () => {
    await renderApp();
    expect(document.querySelectorAll('[role="group"]')).toHaveLength(1);
  });

  it('phím / mở search và lọc theo tiêu đề; đóng search xoá filter', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Alpha task' }),
      't:b': fixture({ id: 'b', title: 'Beta task' }),
    });
    const container = await renderApp();

    await act(async () => {
      pressKey('/');
    });
    const input = document.querySelector(
      'input[placeholder="Tìm việc…"]'
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    await act(async () => {
      setInputValue(input!, 'alpha');
    });

    expect(container.textContent).toContain('Alpha task');
    expect(container.textContent).not.toContain('Beta task');

    await act(async () => {
      pressKey('Escape');
    });
    expect(container.textContent).toContain('Beta task');
  });

  it('lọc theo thẻ từ menu tag', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc Work', tags: ['work'] }),
      't:b': fixture({ id: 'b', title: 'Việc Home', tags: ['home'] }),
    });
    const container = await renderApp();

    const tagButton = document.querySelector(
      '[aria-label="Lọc theo thẻ"]'
    ) as HTMLButtonElement;
    await act(async () => {
      tagButton.click();
    });
    await act(async () => {
      findButton(container, '#work').click();
    });

    expect(container.textContent).toContain('Việc Work');
    expect(container.textContent).not.toContain('Việc Home');
  });

  it('nút sort header cycle sang ưu tiên và đổi thứ tự list', async () => {
    stub.seed({
      't:a': fixture({
        id: 'a',
        title: 'Việc ưu tiên thấp',
        priority: 'low',
        dueAt: '2035-01-01T08:00:00.000Z',
      }),
      't:b': fixture({
        id: 'b',
        title: 'Việc ưu tiên cao',
        priority: 'high',
        dueAt: '2036-01-01T08:00:00.000Z',
      }),
    });
    const container = await renderApp();
    const titles = () =>
      [...container.querySelectorAll('[role="listitem"]')].map(
        (item) => item.textContent ?? ''
      );

    // Sort mặc định (hạn chót): task due sớm hơn đứng trước
    expect(titles()[0]).toContain('Việc ưu tiên thấp');

    const sortButtons = document.querySelectorAll('[aria-label="Sắp xếp"]');
    await act(async () => {
      (sortButtons[0] as HTMLButtonElement).click();
    });

    expect(container.textContent).toContain('Sắp xếp: Ưu tiên');
    expect(titles()[0]).toContain('Việc ưu tiên cao');
  });
});

describe('App wiring — composer & keyboard (#5, #20)', () => {
  it('phím n mở composer expanded và focus ô tên', async () => {
    await renderApp();

    await act(async () => {
      pressKey('n');
    });

    const input = document.querySelector(
      'input[placeholder="Ví dụ: Mua sắm tuần"]'
    );
    expect(input).not.toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('phím n khi composer đang mở vẫn focus lại ô tên', async () => {
    await renderApp();

    await act(async () => {
      pressKey('n');
    });
    const input = document.querySelector(
      'input[placeholder="Ví dụ: Mua sắm tuần"]'
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(input);

    await act(async () => {
      input.blur();
    });
    expect(document.activeElement).not.toBe(input);

    await act(async () => {
      pressKey('n');
    });
    expect(document.activeElement).toBe(input);
  });

  it('lưu composer giữ đủ field (không chỉ title)', async () => {
    await renderApp();

    await act(async () => {
      pressKey('n');
    });
    const titleInput = document.querySelector(
      'input[placeholder="Ví dụ: Mua sắm tuần"]'
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(titleInput, 'Việc đầy đủ');
    });
    await act(async () => {
      findButton(document.body, 'Cao').click();
    });
    await act(async () => {
      findButton(document.body, 'Lưu').click();
    });

    const keys = [...stub.store.keys()].filter((key) => key.startsWith('t:'));
    expect(keys).toHaveLength(1);
    const saved = stub.store.get(keys[0]) as Task;
    expect(saved.title).toBe('Việc đầy đủ');
    expect(saved.priority).toBe('high');
  });
});

describe('App wiring — detail persistence (#11)', () => {
  it('lưu detail bump updatedAt', async () => {
    const original = fixture({
      id: 'a',
      title: 'Việc A',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
    stub.seed({ 't:a': original });
    const container = await renderApp();

    await act(async () => {
      findButton(container, 'Việc A').click();
    });
    const titleInput = container.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(titleInput, 'Việc A mới');
    });
    await act(async () => {
      findButton(container, 'Lưu').click();
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.title).toBe('Việc A mới');
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThan(
      new Date(original.updatedAt).getTime()
    );
  });

  it('toggle subtask trong detail bump updatedAt', async () => {
    const original = fixture({
      id: 'a',
      title: 'Việc A',
      updatedAt: '2020-01-01T00:00:00.000Z',
      subtasks: [{ id: 's1', title: 'Bước 1', done: false }],
    });
    stub.seed({ 't:a': original });
    const container = await renderApp();

    await act(async () => {
      findButton(container, 'Việc A').click();
    });
    const subtask = document.querySelector(
      'input[aria-label="Đánh dấu subtask: Bước 1"]'
    ) as HTMLInputElement;
    expect(subtask).not.toBeNull();
    await act(async () => {
      subtask.click();
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.subtasks[0].done).toBe(true);
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThan(
      new Date(original.updatedAt).getTime()
    );
  });
});

describe('App wiring — dirty confirm & undo (#10, #15)', () => {
  it('sửa title rồi Quay lại hiện dialog "Bỏ thay đổi?"', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();

    await act(async () => {
      findButton(container, 'Việc A').click();
    });
    const titleInput = container.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement | null;
    expect(titleInput?.value).toBe('Việc A');

    await act(async () => {
      setInputValue(titleInput!, 'Việc A sửa');
    });
    await act(async () => {
      findButton(container, 'Quay lại').click();
    });

    expect(container.textContent).toContain('Bỏ thay đổi?');

    await act(async () => {
      findButton(container, 'Bỏ').click();
    });

    expect(container.textContent).not.toContain('Bỏ thay đổi?');
    expect(container.textContent).toContain('Việc A');
    const saved = stub.store.get('t:a') as Task;
    expect(saved.title).toBe('Việc A');
  });

  it('xoá việc rồi Hoàn tác khôi phục task', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc xoá' }) });
    const container = await renderApp();

    await act(async () => {
      findButton(container, 'Việc xoá').click();
    });
    await act(async () => {
      findButton(container, 'Xoá việc').click();
    });
    await act(async () => {
      findButton(container, 'Xoá').click();
    });

    expect(stub.store.has('t:a')).toBe(false);
    expect(container.textContent).toContain('Đã xoá việc');

    await act(async () => {
      findButton(container, 'Hoàn tác').click();
    });

    expect(stub.store.has('t:a')).toBe(true);
    expect(container.textContent).toContain('Việc xoá');
  });
});

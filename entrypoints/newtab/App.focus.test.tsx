/**
 * R-20 New Tab — focus panel là cột chính, board thu thành cột phụ; xác nhận
 * đổi việc/tick việc khác trong phiên. Không snapshot: assertion trên DOM,
 * storage.local và contract CSS responsive.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createChromeStub,
  type ChromeStub,
} from '../../src/__tests__/helpers/chrome-stub';
import { POMODORO_KEY, type PomodoroState, type Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Việc A',
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

const activeState = (taskId: string, interruptions = 0): PomodoroState => ({
  phase: 'focus',
  running: true,
  endsAt: Date.now() + 600_000,
  remaining: 600_000,
  taskId,
  interruptions,
});

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

describe('New Tab — R-20 focus layout', () => {
  it('focus chạy: board-grid thu cột phụ, focus panel ở board-desk, board vẫn còn', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    const grid = container.querySelector('.board-grid');
    expect(grid).not.toBeNull();
    expect(grid!.classList.contains('board-grid--focus')).toBe(true);
    expect(container.querySelector('.board-scroll')).not.toBeNull(); // không xoá board
    const desk = container.querySelector('.board-desk') as HTMLElement;
    expect(desk.querySelector('.focus-overlay')).not.toBeNull();
    expect(desk.textContent).toContain('Việc A');
    expect(desk.textContent).toContain('Kết thúc');
  });

  it('không có taskId → giao diện y hệt cũ (0 regression)', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();
    expect(container.querySelector('.board-grid')!.classList.contains('board-grid--focus')).toBe(
      false
    );
    expect(container.querySelector('.board-desk .focus-overlay')).toBeNull();
    expect(container.querySelector('.focus-card')).not.toBeNull();
  });

  it('CSS cột phụ: minmax(0,…) ở mọi breakpoint + 1 cột dưới 720px (không tràn ngang)', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'entrypoints/newtab/style.css'),
      'utf8'
    );
    const focusBlock = css.match(/\.board-grid--focus\s*\{([^}]*)\}/);
    expect(focusBlock).not.toBeNull();
    expect(focusBlock![1]).toContain('minmax(0, 1fr)');
    expect(focusBlock![1]).toContain('minmax(0, 320px)');
    // Breakpoint hẹp 360/1024/1199 đều có rule chặn tràn ngang.
    expect(css).toContain('@media (max-width: 719px)');
    const narrow = css.match(/@media \(max-width: 719px\)\s*\{[\s\S]*?\.board-grid--focus\s*\{([^}]*)\}/);
    expect(narrow).not.toBeNull();
    expect(narrow![1]).toContain('minmax(0, 1fr)');
  });

  it('đổi việc giữa phiên có xác nhận: xác nhận → 1 ngắt; từ chối → không đổi', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc A' }),
      't:b': fixture({ id: 'b', title: 'Việc B' }),
    });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();
    const buttonB = container.querySelector(
      'button[aria-label="Tập trung việc này: Việc B"]'
    ) as HTMLButtonElement;
    expect(buttonB).not.toBeNull();

    await act(() => {
      buttonB.click();
    });
    expect(container.textContent).toContain('Đang trong phiên, đổi việc sẽ phá tập trung?');

    await act(() => {
      findButton(container, 'Giữ việc cũ').click();
    });
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('a');

    await act(() => {
      buttonB.click();
    });
    await act(() => {
      findButton(container, 'Đổi việc').click();
    });
    await act(async () => {
      await flush();
      await flush();
      await flush();
    });
    const saved = stub.localStore.get(POMODORO_KEY) as PomodoroState;
    expect(saved.taskId).toBe('b');
    expect(saved.interruptions).toBe(1);
  });

  it('tick việc khác giữa phiên có xác nhận; xác nhận → tick + 1 ngắt', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc A' }),
      't:b': fixture({ id: 'b', title: 'Việc B' }),
    });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();
    const sealB = container.querySelector(
      'button[aria-label="Đóng dấu xong: Việc B"]'
    ) as HTMLButtonElement;
    expect(sealB).not.toBeNull();

    await act(() => {
      sealB.click();
    });
    expect(container.textContent).toContain('Đang trong phiên, đổi việc sẽ phá tập trung?');
    expect((stub.store.get('t:b') as Task).done).toBe(false);

    await act(() => {
      findButton(container, 'Đổi việc').click();
    });
    await act(async () => {
      await flush();
    });
    expect((stub.store.get('t:b') as Task).done).toBe(true);
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).interruptions).toBe(1);
  });

  it('FUP-001: "Huỷ gắn việc" → xác nhận → attach(null) + 1 ngắt; từ chối → không đổi', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    const desk = container.querySelector('.board-desk') as HTMLElement;
    expect(findButton(desk, 'Huỷ gắn việc')).not.toBeNull();

    await act(() => {
      findButton(container, 'Huỷ gắn việc').click();
    });
    expect(container.textContent).toContain('Huỷ gắn việc đang tập trung?');
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('a');

    // Từ chối: việc vẫn gắn, không đếm ngắt
    await act(() => {
      findButton(container, 'Giữ việc cũ').click();
    });
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('a');
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).interruptions).toBe(0);

    // Xác nhận: huỷ gắn + đúng 1 interruption; phiên vẫn chạy
    await act(() => {
      findButton(container, 'Huỷ gắn việc').click();
    });
    await act(() => {
      findButton(container, 'Huỷ gắn').click();
    });
    await act(async () => {
      await flush();
      await flush();
      await flush();
    });
    const saved = stub.localStore.get(POMODORO_KEY) as PomodoroState;
    expect(saved.taskId).toBeNull();
    expect(saved.interruptions).toBe(1);
    expect(saved.running).toBe(true);
    expect(saved.phase).toBe('focus');
  });
});

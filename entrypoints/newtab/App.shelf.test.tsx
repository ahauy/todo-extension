/**
 * G11 — New Tab Giá sách đúng 1 thể hiện / breakpoint.
 * jsdom không có matchMedia thật → stub theo width rồi đếm container DOM.
 * Không snapshot: assert số `.board-shelf` / `.board-shelf-strip` thật.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from '../../src/__tests__/helpers/chrome-stub';
import {
  POMODORO_KEY,
  TASK_KEY_PREFIX,
  type PomodoroState,
  type Task,
} from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function focusFixture(): { task: Task; pomodoro: PomodoroState } {
  return {
    task: {
      id: 'task-focus',
      title: 'Việc đang học',
      note: '',
      priority: 'medium',
      dueAt: null,
      recurrence: { kind: 'none' },
      tags: [],
      subtasks: [],
      done: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    pomodoro: {
      phase: 'focus',
      running: true,
      endsAt: Date.now() + 600_000,
      remaining: 600_000,
      taskId: 'task-focus',
      interruptions: 0,
    },
  };
}

let stub: ChromeStub;
let cleanup: (() => Promise<void>) | null = null;
let originalMatchMedia: typeof window.matchMedia | undefined;

function installMatchMedia(width: number): void {
  const list = new Set<() => void>();
  const query = (media: string): MediaQueryList => {
    const min = media.match(/min-width:\s*(\d+)px/);
    const max = media.match(/max-width:\s*(\d+)px/);
    const matches =
      (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]));
    return {
      matches,
      media,
      onchange: null,
      addEventListener: (_type: string, cb: () => void) => { list.add(cb); },
      removeEventListener: (_type: string, cb: () => void) => { list.delete(cb); },
      addListener: (cb: () => void) => { list.add(cb); },
      removeListener: (cb: () => void) => { list.delete(cb); },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: query });
}

async function renderAt(width: number, withFocus = false): Promise<HTMLElement> {
  if (withFocus) {
    const fixture = focusFixture();
    stub.seed({ [`${TASK_KEY_PREFIX}${fixture.task.id}`]: fixture.task });
    stub.localStore.set(POMODORO_KEY, fixture.pomodoro);
  }
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('./App');
  installMatchMedia(width);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(App));
  });
  await React.act(async () => { await flush(); });

  cleanup = async () => {
    await React.act(async () => { root.unmount(); });
    container.remove();
  };
  return container;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  cleanup = null;
  originalMatchMedia = window.matchMedia;
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
  document.body.innerHTML = '';
});

describe('G11 — Giá sách render đúng 1 bản theo breakpoint', () => {
  it('1280px: chỉ có aside cột trái, không có dải ngang', async () => {
    const container = await renderAt(1280);
    expect(container.querySelectorAll('.board-shelf')).toHaveLength(1);
    expect(container.querySelectorAll('.board-shelf-strip')).toHaveLength(0);
  });

  it('1024px: chỉ có dải ngang thật (ribbon-tab), không có aside/spine dọc', async () => {
    const container = await renderAt(1024);
    expect(container.querySelectorAll('.board-shelf')).toHaveLength(0);
    const strip = container.querySelector('.board-shelf-strip');
    expect(strip).not.toBeNull();
    expect(strip?.querySelector('.shelf-strip')).not.toBeNull();
    expect(strip?.querySelectorAll('.spine')).toHaveLength(0);
    expect(strip?.querySelector('button[role="tab"][aria-selected]')).not.toBeNull();
  });

  it('360px: vẫn có đúng 1 dải ngang thật', async () => {
    const container = await renderAt(360);
    expect(container.querySelectorAll('.board-shelf')).toHaveLength(0);
    const strip = container.querySelector('.board-shelf-strip');
    expect(strip).not.toBeNull();
    expect(strip?.querySelector('.shelf-strip')).not.toBeNull();
    expect(strip?.querySelectorAll('.spine')).toHaveLength(0);
  });

  it('focus @1024px: strip được bỏ hẳn khỏi DOM, grid chuyển board-grid--focus', async () => {
    const container = await renderAt(1024, true);
    expect(container.querySelectorAll('.board-shelf-strip')).toHaveLength(0);
    expect(container.querySelectorAll('.board-shelf')).toHaveLength(0);
    expect(container.querySelector('.board-grid--focus')).not.toBeNull();
  });

  it('focus @1280px: aside cũng bị bỏ khỏi DOM (không chỉ ẩn bằng CSS)', async () => {
    const container = await renderAt(1280, true);
    expect(container.querySelectorAll('.board-shelf')).toHaveLength(0);
    expect(container.querySelectorAll('.board-shelf-strip')).toHaveLength(0);
    expect(container.querySelector('.board-grid--focus')).not.toBeNull();
  });
});

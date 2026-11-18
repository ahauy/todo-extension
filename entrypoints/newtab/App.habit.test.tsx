/**
 * R-23 — New Tab wiring: HabitCard nằm đúng chỗ trong board-desk, bỏ dấu chỉ
 * đổi `doneDays` (không dueAt/alarm/StudyLog), ẩn khi focusActive, và sửa việc
 * rồi tắt toggle vẫn GIỮ sổ thói quen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from '../../src/__tests__/helpers/chrome-stub';
import { dayKey } from '../../lib/datetime';
import {
  DEFAULT_SETTINGS,
  POMODORO_KEY,
  SETTINGS_KEY,
  STUDY_LOG_KEY,
  TASK_KEY_PREFIX,
  type Task,
} from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function shiftDay(delta: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta);
}

function taskFixture(): Task {
  return {
    id: 'habit-ui',
    title: 'Ôn bài',
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'daily' },
    tags: [],
    subtasks: [],
    done: false,
    habit: {
      startedAt: shiftDay(-30).toISOString(),
      doneDays: [dayKey(shiftDay(-1)), dayKey(shiftDay(0))],
    },
    lastDoneAt: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

let stub: ChromeStub;
let cleanup: (() => Promise<void>) | null = null;

async function mountApp(): Promise<HTMLElement> {
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

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  cleanup = null;
  stub.seed({ [SETTINGS_KEY]: { ...DEFAULT_SETTINGS } });
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  document.body.innerHTML = '';
});

describe('R-23 — New Tab HabitCard wiring', () => {
  it('nằm sau StreakCard trước MaximCard; bỏ dấu CHỈ đổi doneDays', async () => {
    const task = taskFixture();
    stub.seed({
      [`${TASK_KEY_PREFIX}${task.id}`]: task,
      [STUDY_LOG_KEY]: { [dayKey(shiftDay(0))]: { tasks: 3, focus: 1 } },
    });
    const container = await mountApp();
    const React = await import('react');

    const desk = container.querySelector('.board-desk') as HTMLElement;
    const streak = desk.querySelector('.streak-card') as HTMLElement;
    const card = desk.querySelector('[data-habit-card]') as HTMLElement;
    const maxim = desk.querySelector('.board-maxim') as HTMLElement;
    expect(card).not.toBeNull();
    expect(streak.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card.compareDocumentPosition(maxim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const today = dayKey(shiftDay(0));
    const button = [...card.querySelectorAll('button.habit-cell')].find(
      (candidate) => candidate.getAttribute('data-day') === today
    ) as HTMLButtonElement | undefined;
    expect(button).toBeDefined();

    const alarmsBefore = [...stub.alarms.entries()];
    await React.act(async () => {
      button!.click();
      await flush();
      await flush();
    });

    const saved = stub.store.get(`${TASK_KEY_PREFIX}${task.id}`) as Task;
    expect(saved.habit!.doneDays).toEqual([dayKey(shiftDay(-1))]);
    // Mọi field khác (kể cả dueAt/lastDoneAt) giữ nguyên — chỉ updatedAt tự bump.
    expect({ ...saved, updatedAt: task.updatedAt }).toEqual({
      ...task,
      habit: { ...task.habit!, doneDays: [dayKey(shiftDay(-1))] },
    });
    expect(stub.store.get(STUDY_LOG_KEY)).toEqual({
      [dayKey(shiftDay(0))]: { tasks: 3, focus: 1 },
    });
    expect([...stub.alarms.entries()]).toEqual(alarmsBefore);
  });

  it('focusActive → ẩn hoàn toàn thẻ thói quen', async () => {
    const task = taskFixture();
    stub.seed({ [`${TASK_KEY_PREFIX}${task.id}`]: task });
    stub.localStore.set(POMODORO_KEY, {
      phase: 'focus',
      running: true,
      endsAt: Date.now() + 600_000,
      remaining: 600_000,
      taskId: task.id,
      interruptions: 0,
    });
    const container = await mountApp();

    expect(container.textContent).toContain(task.title);
    expect(container.querySelector('[data-habit-card]')).toBeNull();
  });

  it('sửa việc rồi tắt toggle: Lưu vẫn giữ nguyên sổ trong storage', async () => {
    const task = taskFixture();
    stub.seed({ [`${TASK_KEY_PREFIX}${task.id}`]: task });
    const container = await mountApp();
    const React = await import('react');

    const title = [...container.querySelectorAll('button.scroll-title')].find(
      (candidate) => candidate.textContent === task.title
    ) as HTMLButtonElement;
    await React.act(async () => {
      title.click();
      await flush();
      await flush();
    });
    const toggle = container.querySelector(
      '[role="switch"][aria-label="Theo dõi như thói quen"]'
    ) as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await React.act(async () => {
      toggle.click();
      await flush();
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    const save = [...container.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === 'Lưu'
    ) as HTMLButtonElement;
    await React.act(async () => {
      save.click();
      await flush();
      await flush();
    });

    const saved = stub.store.get(`${TASK_KEY_PREFIX}${task.id}`) as Task;
    expect(saved.habit).toEqual(task.habit);
  });
});

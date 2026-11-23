/**
 * R-22 — New Tab integration: cờ notification mở sheet, nút mở sheet, khối
 * "Đã hẹn hôm nay", lưu plannedFor + ếch cho mai. DOM/storage thật.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from '../../src/__tests__/helpers/chrome-stub';
import {
  DAY_PLAN_KEY,
  DEFAULT_SETTINGS,
  PLAN_SHEET_KEY,
  SETTINGS_KEY,
  TASK_KEY_PREFIX,
  type Task,
} from '../../lib/tasks/types';
import { dayKey } from '../../lib/datetime';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function taskFixture(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Việc ${id}`,
    note: '',
    priority: 'important-not-urgent',
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

async function mountApp(): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('./App');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => { root.render(React.createElement(App)); });
  await React.act(async () => { await flush(); await flush(); });
  cleanup = async () => {
    await React.act(async () => { root.unmount(); });
    container.remove();
  };
  return container;
}

function buttonByText(scope: ParentNode, text: string): HTMLButtonElement {
  const found = [...scope.querySelectorAll('button')]
    .find((button) => button.textContent?.includes(text));
  if (!found) throw new Error(`Không tìm thấy nút "${text}"`);
  return found as HTMLButtonElement;
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

describe('R-22 — New Tab sheet & planned block', () => {
  it('cờ từ notification mở sheet ngay khi mount', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}t1`]: taskFixture('t1') });
    stub.localStore.set(PLAN_SHEET_KEY, true);

    const container = await mountApp();

    expect(container.textContent).toContain('Kế hoạch mai');
    expect(stub.localStore.has(PLAN_SHEET_KEY)).toBe(false);
  });

  it('displayMode=popup: cờ notification vẫn mở sheet, không dừng ở màn lời chào', async () => {
    stub.seed({
      [SETTINGS_KEY]: { ...DEFAULT_SETTINGS, displayMode: 'popup' },
    });
    stub.localStore.set(PLAN_SHEET_KEY, true);

    const container = await mountApp();

    expect(container.textContent).not.toContain('Sổ đang ở chế độ Popup');
    expect(container.textContent).toContain('Kế hoạch mai');
  });

  it('nút "Kế hoạch mai" mở sheet; lưu gán plannedFor=mai cho việc đã chọn', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}t1`]: taskFixture('t1') });
    const container = await mountApp();

    const React = await import('react');
    await React.act(async () => { buttonByText(container, 'Kế hoạch mai').click(); await flush(); });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    await React.act(async () => { checkbox.click(); await flush(); });
    const frog = container.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(frog).not.toBeNull();
    await React.act(async () => { frog.click(); await flush(); });

    const save = buttonByText(container, 'Lưu kế hoạch');
    await React.act(async () => { save.click(); await flush(); await flush(); });

    const now = new Date();
    const tomorrow = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const saved = stub.store.get(`${TASK_KEY_PREFIX}t1`) as Task;
    expect(saved.plannedFor).toBe(tomorrow);
    const dayPlan = stub.store.get(DAY_PLAN_KEY) as Record<string, { frogTaskId: string | null }>;
    expect(dayPlan[tomorrow]?.frogTaskId).toBe('t1');
  });

  it('tab Hôm nay hiện khối "Đã hẹn hôm nay" từ plannedFor', async () => {
    const today = dayKey(new Date());
    stub.seed({
      [`${TASK_KEY_PREFIX}t1`]: taskFixture('t1', { plannedFor: today, dueAt: null }),
    });
    const container = await mountApp();

    const React = await import('react');
    const todayTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes('Hôm nay')) as HTMLButtonElement;
    await React.act(async () => { todayTab.click(); await flush(); });

    const block = container.querySelector('[data-section="planned-today"]');
    expect(block).not.toBeNull();
    expect(block?.textContent).toContain('Đã hẹn hôm nay');
    expect(block?.textContent).toContain('Việc t1');
  });
});

/**
 * R-22 UI — sheet Kế hoạch mai, cài đặt nhắc, và query plannedFor không đổi overdue/sort.
 * Assert DOM/storage thật, không snapshot.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Task } from '../../lib/tasks/types';
import { plannedForDay, sortTasks } from '../../lib/tasks/query';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function taskFixture(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Việc ${id}`,
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

async function render(element: React.ReactElement): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => { root.render(element); });
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
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  document.body.innerHTML = '';
});

describe('R-22 — query plannedFor', () => {
  it('plannedForDay chỉ lấy việc mở, không archived, đúng ngày', () => {
    const tasks = [
      taskFixture('a', { plannedFor: '2026-11-18' }),
      taskFixture('b', { plannedFor: '2026-11-18', done: true }),
      taskFixture('c', { plannedFor: '2026-11-18', archived: true }),
      taskFixture('d', { plannedFor: '2026-11-19' }),
    ];
    expect(plannedForDay(tasks, '2026-11-18').map((t) => t.id)).toEqual(['a']);
  });

  it('plannedFor quá khứ không đổi thứ tự sort theo dueAt (R-15)', () => {
    const now = new Date(2026, 10, 18, 12, 0);
    const tasks = [
      taskFixture('late-plan', { plannedFor: '2026-01-01', dueAt: '2026-11-19T08:00' }),
      taskFixture('due-today', { dueAt: '2026-11-18T18:00' }),
    ];
    expect(sortTasks(tasks, now).map((t) => t.id)).toEqual(['due-today', 'late-plan']);
  });
});

describe('R-22 — sheet Kế hoạch mai', () => {
  it('chọn tối đa 5 việc, chọn ếch trong số đã chọn, trả đúng payload', async () => {
    const React = await import('react');
    const { default: PlanTomorrowSheet } = await import('../../components/PlanTomorrowSheet');
    const onSave = vi.fn();
    const tasks = Array.from({ length: 6 }, (_, i) => taskFixture(`t${i}`));

    const container = await render(React.createElement(PlanTomorrowSheet, {
      open: true,
      tasks,
      dayLabel: '19/11/2026',
      onClose: () => {},
      onSave,
    }));

    const boxes = [...container.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[];
    expect(boxes).toHaveLength(6);
    for (let i = 0; i < 6; i += 1) {
      await React.act(async () => {
        boxes[i].click();
        await flush();
      });
    }
    expect(boxes.filter((box) => box.checked)).toHaveLength(5);

    const radios = [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    expect(radios).toHaveLength(5);
    await React.act(async () => { radios[1].click(); await flush(); });

    const saveButton = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Lưu kế hoạch') as HTMLButtonElement;
    await React.act(async () => { saveButton.click(); await flush(); });

    expect(onSave).toHaveBeenCalledTimes(1);
    const [ids, frogId] = onSave.mock.calls[0];
    expect(ids).toHaveLength(5);
    expect(ids).toContain('t1');
    expect(frogId).toBe('t1');
  });
});

describe('R-22 — SettingsPanel', () => {
  it('hiện giờ mặc định 21:00 và lưu giờ mới qua useSettings.update', async () => {
    const React = await import('react');
    const { default: SettingsPanel } = await import('../../components/SettingsPanel');
    stub.seed({ [SETTINGS_KEY]: { ...DEFAULT_SETTINGS } });

    const container = await render(React.createElement(SettingsPanel));
    const time = container.querySelector('input[type="time"]') as HTMLInputElement;
    expect(time).not.toBeNull();
    expect(time.value).toBe('21:00');

    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(time, '22:30');
      time.dispatchEvent(new Event('input', { bubbles: true }));
      time.dispatchEvent(new Event('change', { bubbles: true }));
      await flush();
      await flush();
    });

    const saved = (stub.store.get(SETTINGS_KEY) as typeof DEFAULT_SETTINGS).planReminder;
    expect(saved).toEqual({ enabled: true, at: '22:30' });
  });
});

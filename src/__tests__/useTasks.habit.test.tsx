/**
 * R-23 — Integration test: `useTasks.toggle` ghi/bớt `habit.doneDays` trong
 * CÙNG một lần `put(task)` hiện có (1 key/task, không key storage mới).
 *
 * Dùng pattern `vi.resetModules()` + dynamic React import như useTasks.test.tsx
 * vì hook giữ snapshot/listeners ở module scope.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { dayKey, toLocalInput } from '../../lib/datetime';
import { habitOccurrenceDay } from '../../lib/tasks/habit';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface UseTasksApi {
  tasks: Task[];
  toggle: (id: string) => Promise<void>;
  loading: boolean;
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Wall-clock local `YYYY-MM-DDTHH:mm` cách bây giờ `days` ngày. */
function localDaysAgo(days: number): string {
  return toLocalInput(new Date(Date.now() - days * 86_400_000).toISOString());
}

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'h',
    title: 'Thói quen',
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'daily' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function habitTask(dueAt: string, doneDays: string[], daysAgo = 3): Task {
  return fixture({
    id: 'h',
    dueAt,
    recurrence: { kind: 'daily' },
    habit: {
      startedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      doneDays,
    },
  });
}

let stub: ChromeStub;
let api: UseTasksApi;
let cleanup: (() => Promise<void>) | null = null;

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
  });
}

async function mountHook(): Promise<void> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { useTasks } = await import('../../hooks/useTasks');

  const container = document.createElement('div');
  document.body.appendChild(container);

  function Probe() {
    api = useTasks() as UseTasksApi;
    return React.createElement('div', null, String(api.tasks.length));
  }

  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Probe));
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
}

function taskKeys(): string[] {
  return [...stub.store.keys()].filter((key) => key.startsWith('t:'));
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
  vi.restoreAllMocks();
  await flush();
  document.body.innerHTML = '';
});

describe('useTasks.toggle — R-23 habit integration', () => {
  it('tick lặp: ghi ngày local của dueAt CŨ vào đúng 1 key / 1 lần sync.set', async () => {
    const oldDue = localDaysAgo(1);
    stub.seed({ 't:h': habitTask(oldDue, []) });
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    await mountHook();
    setSpy.mockClear();

    await act(() => api.toggle('h'));

    expect(taskKeys()).toEqual(['t:h']);
    expect(stub.store.size).toBe(1); // không key storage mới cho habit
    const saved = stub.store.get('t:h') as Task;
    expect(saved.habit!.doneDays).toEqual([habitOccurrenceDay(oldDue)]);
    expect(saved.prevDueAt).toBe(oldDue);
    expect(saved.dueAt).not.toBe(oldDue); // dueAt mới là occurrence kế, KHÔNG được ghi
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(setSpy.mock.calls[0][0] as object)).toEqual(['t:h']);
  });

  it('tick muộn 3 ngày: ghi đúng ngày occurrence, không phải hôm nay', async () => {
    const oldDue = localDaysAgo(3);
    stub.seed({ 't:h': habitTask(oldDue, []) });
    await mountHook();

    await act(() => api.toggle('h'));

    const saved = stub.store.get('t:h') as Task;
    expect(saved.habit!.doneDays).toEqual([habitOccurrenceDay(oldDue)]);
    expect(saved.habit!.doneDays).not.toEqual([habitOccurrenceDay(localDaysAgo(0))]);
    expect(new Date(saved.dueAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it('tick sớm: dueAt tương lai vẫn ghi ngày local cũ, 1 put/key, chỉ alarm due:<id>', async () => {
    const futureDue = toLocalInput(
      new Date(Date.now() + 2 * 86_400_000).toISOString()
    );
    stub.seed({ 't:h': habitTask(futureDue, []) });
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    await mountHook();
    setSpy.mockClear();

    await act(() => api.toggle('h'));

    const saved = stub.store.get('t:h') as Task;
    expect(saved.habit!.doneDays).toEqual([habitOccurrenceDay(futureDue)]);
    expect(saved.prevDueAt).toBe(futureDue);
    expect(saved.dueAt).not.toBe(futureDue);
    expect(saved.dueAt!.slice(11)).toBe(futureDue.slice(11)); // daily giữ HH:mm local
    const nextDay = new Date(futureDue);
    nextDay.setDate(nextDay.getDate() + 1);
    expect(saved.dueAt!.slice(0, 10)).toBe(dayKey(nextDay));
    expect(taskKeys()).toEqual(['t:h']);
    expect(stub.store.size).toBe(1);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(setSpy.mock.calls[0][0] as object)).toEqual(['t:h']);
    expect([...stub.alarms.keys()]).toEqual(['due:h']);
    expect(stub.alarms.get('due:h')!.delayInMinutes).toBeGreaterThan(0);
  });

  it('quá cửa sổ 31 ngày: tick vẫn chạy nhưng KHÔNG ghi ngày mới', async () => {
    const veryOldDue = localDaysAgo(60);
    stub.seed({ 't:h': habitTask(veryOldDue, [], 60) });
    await mountHook();

    await act(() => api.toggle('h'));

    const saved = stub.store.get('t:h') as Task;
    expect(saved.habit!.doneDays).toEqual([]);
    expect(saved.dueAt).not.toBe(veryOldDue); // R-11 vẫn cuộn hạn bình thường
  });

  it('undo R-11: gỡ đúng ngày prevDueAt (occurrence vừa xong)', async () => {
    const oldDue = localDaysAgo(1);
    stub.seed({ 't:h': habitTask(oldDue, []) });
    await mountHook();

    await act(() => api.toggle('h'));
    const afterTick = stub.store.get('t:h') as Task;
    expect(afterTick.habit!.doneDays).toEqual([habitOccurrenceDay(oldDue)]);

    await act(() => api.toggle('h'));
    const saved = stub.store.get('t:h') as Task;
    expect(saved.habit!.doneDays).toEqual([]);
    expect(saved.dueAt).toBe(oldDue); // R-11 hoàn tác về prevDueAt
    expect(saved.prevDueAt).toBeNull();
    expect(saved.lastDoneAt).toBeNull();
  });

  it('un-toggle done=true: gỡ ngày lấy từ prevDueAt', async () => {
    const oldDue = localDaysAgo(2);
    const seeded = fixture({
      id: 'h',
      dueAt: localDaysAgo(0),
      prevDueAt: oldDue,
      lastDoneAt: localDaysAgo(0),
      done: true,
      habit: {
        startedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
        doneDays: [habitOccurrenceDay(oldDue)!],
      },
    });
    stub.seed({ 't:h': seeded });
    await mountHook();

    await act(() => api.toggle('h'));

    const saved = stub.store.get('t:h') as Task;
    expect(saved.habit!.doneDays).toEqual([]);
    expect(saved.done).toBe(false);
    expect(saved.prevDueAt).toBeNull();
    expect(saved.lastDoneAt).toBeNull();
  });

  it('put fail (quota) → snapshot không đổi, habit trong bộ nhớ không đổi', async () => {
    const oldDue = localDaysAgo(1);
    stub.seed({ 't:h': habitTask(oldDue, []) });
    await mountHook();
    const before = api.tasks[0];

    let rejected = false;
    await act(async () => {
      const runtime = chrome.runtime as { lastError: { message: string } | null };
      runtime.lastError = { message: 'QUOTA_BYTES exceeded' };
      try {
        await api.toggle('h');
      } catch {
        rejected = true;
      }
      runtime.lastError = null;
    });

    expect(rejected).toBe(true);
    expect(api.tasks[0]).toBe(before); // setSnapshot không chạy khi put reject
    expect(api.tasks[0].habit!.doneDays).toEqual([]);
  });
});

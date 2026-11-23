/**
 * R-24 — integration test: `useTasks.setTaskTime` ghi giờ/độ dài vào ĐÚNG 1 key
 * `t:<id>` hiện có, KHÔNG đụng plannedFor/dueAt/habit/alarm, và rollback snapshot
 * khi put lỗi (R-16). Pattern vi.resetModules + dynamic React import như các
 * test hook khác vì snapshot/listeners nằm ở module scope.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { toLocalInput } from '../../lib/datetime';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface UseTasksApi {
  tasks: Task[];
  loading: boolean;
  setTaskTime: (
    id: string,
    patch: { startAt?: string | null; estimateMin?: number | null; endAt?: string | null }
  ) => Promise<void>;
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Việc có giờ',
    note: 'ghi chú',
    priority: 'important-urgent',
    dueAt: toLocalInput(new Date(Date.now() + 86_400_000).toISOString()),
    recurrence: { kind: 'none' },
    tags: ['a'],
    subtasks: [{ id: 's1', title: 'nhỏ', done: false }],
    done: false,
    lastDoneAt: '2026-01-02T00:00:00.000Z',
    prevDueAt: '2026-01-03T09:00',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
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

describe('useTasks.setTaskTime — R-24 additive update', () => {
  it('chỉ đổi startAt/estimateMin; mọi field khác + alarm giữ nguyên, 1 key/1 put', async () => {
    const before = fixture({
      startAt: '07:00',
      estimateMin: 30,
      plannedFor: '2026-11-18',
      habit: { startedAt: '2026-01-01T00:00:00.000Z', doneDays: ['2026-11-17'] },
    });
    stub.seed({ 't:t1': before });
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    await mountHook();
    const alarmBefore = stub.alarms.get('due:t1');
    expect(alarmBefore).toBeDefined();
    setSpy.mockClear();

    await act(() =>
      api.setTaskTime('t1', { startAt: '09:15', estimateMin: 45 })
    );

    const saved = stub.store.get('t:t1') as Task;
    expect(saved.startAt).toBe('09:15');
    expect(saved.estimateMin).toBe(45);
    expect(saved.plannedFor).toBe(before.plannedFor);
    expect(saved.dueAt).toBe(before.dueAt);
    expect(saved.lastDoneAt).toBe(before.lastDoneAt);
    expect(saved.prevDueAt).toBe(before.prevDueAt);
    expect(saved.habit).toEqual(before.habit);
    expect(saved.tags).toEqual(before.tags);
    expect(saved.subtasks).toEqual(before.subtasks);
    expect(saved.done).toBe(before.done);
    expect(taskKeys()).toEqual(['t:t1']);
    expect(stub.store.size).toBe(1); // không key storage mới
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(setSpy.mock.calls[0][0] as object)).toEqual(['t:t1']);
    expect(stub.alarms.get('due:t1')).toEqual(alarmBefore); // không đụng alarm
  });

  it('patch null → xoá field (task cũ không mang startAt/estimateMin)', async () => {
    stub.seed({ 't:t1': fixture({ startAt: '08:00', estimateMin: 60 }) });
    await mountHook();

    await act(() => api.setTaskTime('t1', { startAt: null, estimateMin: null }));

    const saved = stub.store.get('t:t1') as Task;
    expect(saved.startAt).toBeUndefined();
    expect(saved.estimateMin).toBeUndefined();
    expect(saved.title).toBe('Việc có giờ');
  });

  it('patch chỉ startAt → estimateMin cũ giữ nguyên', async () => {
    stub.seed({ 't:t1': fixture({ startAt: '08:00', estimateMin: 90 }) });
    await mountHook();

    await act(() => api.setTaskTime('t1', { startAt: '10:00' }));

    const saved = stub.store.get('t:t1') as Task;
    expect(saved.startAt).toBe('10:00');
    expect(saved.estimateMin).toBe(90);
  });

  it('R-25: patch endAt → ghi endAt + estimateMin dẫn xuất trong 1 put, field khác giữ nguyên', async () => {
    const before = fixture({
      startAt: '09:00',
      estimateMin: 30,
      plannedFor: '2026-11-19',
      habit: { startedAt: '2026-01-01T00:00:00.000Z', doneDays: ['2026-11-18'] },
    });
    stub.seed({ 't:t1': before });
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    await mountHook();
    setSpy.mockClear();

    await act(() => api.setTaskTime('t1', { endAt: '10:30' }));

    const saved = stub.store.get('t:t1') as Task;
    expect(saved.endAt).toBe('10:30');
    expect(saved.estimateMin).toBe(90);
    expect(saved.startAt).toBe('09:00');
    expect(saved.dueAt).toBe(before.dueAt);
    expect(saved.plannedFor).toBe(before.plannedFor);
    expect(saved.habit).toEqual(before.habit);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(setSpy.mock.calls[0][0] as object)).toEqual(['t:t1']);
    expect(stub.store.size).toBe(1);
  });

  it('R-25: endAt null → xoá field, không tạo key mới', async () => {
    stub.seed({ 't:t1': fixture({ startAt: '09:00', endAt: '10:00', estimateMin: 60 }) });
    await mountHook();

    await act(() => api.setTaskTime('t1', { endAt: null }));

    const saved = stub.store.get('t:t1') as Task;
    expect(saved.endAt).toBeUndefined();
    expect(saved.startAt).toBe('09:00');
    expect(typeof saved.estimateMin).toBe('number');
    expect(stub.store.size).toBe(1);
  });

  it('put fail (quota) → snapshot cũ giữ nguyên (R-16)', async () => {
    stub.seed({ 't:t1': fixture({ startAt: '07:00' }) });
    await mountHook();
    const before = api.tasks[0];

    let rejected = false;
    await act(async () => {
      const runtime = chrome.runtime as { lastError: { message: string } | null };
      runtime.lastError = { message: 'QUOTA_BYTES exceeded' };
      try {
        await api.setTaskTime('t1', { startAt: '11:00' });
      } catch {
        rejected = true;
      }
      runtime.lastError = null;
    });

    expect(rejected).toBe(true);
    expect(api.tasks[0]).toBe(before); // setSnapshot KHÔNG chạy khi put reject
    // (chrome stub ghi store TRƯỚC khi callback đọc lastError — nên chỉ assert snapshot,
    //  đúng pattern của useTasks.habit.test.tsx; Chrome thật không ghi khi quota lỗi.)
  });

  it('id không tồn tại → no-op, không ghi storage', async () => {
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    await mountHook();
    setSpy.mockClear();

    await act(() => api.setTaskTime('missing', { startAt: '08:00' }));

    expect(setSpy).not.toHaveBeenCalled();
    expect(stub.store.size).toBe(0);
  });
});

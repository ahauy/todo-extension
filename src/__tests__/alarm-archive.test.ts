/**
 * R-21 / A-01 — guard chống rò rỉ thông báo của việc bị cắt bỏ.
 * Dùng chrome-stub thật + syncAlarms/useTasks.update thật (không test lại predicate private).
 * useTasks giữ snapshot/listeners ở module scope → resetModules + import động mỗi test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Hạn tương lai chắc chắn (> 2026) để shouldCreateAlarm chỉ bị chặn bởi archived. */
const FUTURE_DUE = '2035-01-01T08:00';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'a',
    title: 'Việc có hạn',
    note: '',
    priority: 'medium',
    dueAt: FUTURE_DUE,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

interface UseTasksApi {
  tasks: Task[];
  update: (task: Task) => Promise<void>;
  loading: boolean;
}

let stub: ChromeStub;
let api: UseTasksApi;
let cleanup: (() => Promise<void>) | null = null;

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
    await flush();
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
    return React.createElement('div');
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

describe('alarm & archived (R-21 / A-01)', () => {
  it('syncAlarms: archived có hạn tương lai không tạo alarm và clear alarm cũ', async () => {
    const { syncAlarms } = await import('../../lib/alarms/scheduler');
    stub.alarms.set('due:a', {}); // alarm còn sót từ trước lúc cắt bỏ

    syncAlarms([fixture({ archived: true })]);

    expect(stub.alarms.has('due:a')).toBe(false);
    expect(stub.alarms.size).toBe(0);
  });

  it('update() cắt bỏ (archived=true) → clear alarm ngay', async () => {
    const original = fixture();
    stub.seed({ 't:a': original });
    await mountHook();
    expect(stub.alarms.has('due:a')).toBe(true);

    await act(async () => {
      await api.update({ ...original, archived: true });
    });

    expect(stub.alarms.has('due:a')).toBe(false);
    expect((stub.store.get('t:a') as Task).archived).toBe(true);
  });

  it('update() phục hồi (archived=false) → tạo lại alarm', async () => {
    const archived = fixture({ archived: true });
    stub.seed({ 't:a': archived });
    await mountHook();
    expect(stub.alarms.has('due:a')).toBe(false);

    await act(async () => {
      await api.update({ ...archived, archived: false });
    });

    expect(stub.alarms.has('due:a')).toBe(true);
    expect((stub.store.get('t:a') as Task).archived).toBe(false);
  });

  it('update() edit thường (archived không đổi) → không đụng alarm', async () => {
    const original = fixture();
    stub.seed({ 't:a': original });
    await mountHook();
    const before = stub.alarms.get('due:a');
    expect(before).toBeDefined();

    await act(async () => {
      await api.update({ ...original, title: 'Tên mới' });
    });

    expect(stub.alarms.has('due:a')).toBe(true);
    expect(stub.alarms.get('due:a')).toEqual(before);
  });
});

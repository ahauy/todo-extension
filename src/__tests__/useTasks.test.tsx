/**
 * Test cho logic `hooks/useTasks` (defect #4 trong scan.md).
 *
 * `useTasks.ts` giữ `snapshotStore`/`listeners` ở module scope nên mỗi test phải
 * `vi.resetModules()` + dynamic import để có module sạch. Vì module được reset,
 * React cũng phải import động trong từng test — tránh "Invalid hook call" do
 * hook dùng instance React khác renderer.
 *
 * Không dùng @testing-library/* (giữ đúng pattern createRoot + act của repo).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface UseTasksApi {
  tasks: Task[];
  add: (title: string) => Promise<void>;
  create: (draft: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (task: Task) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  restore: (task: Task) => Promise<void>;
}

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
let api: UseTasksApi;
let cleanup: (() => Promise<void>) | null = null;

async function settle(ReactModule: typeof import('react')): Promise<void> {
  await ReactModule.act(async () => {
    await flush();
  });
}

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
  });
}

async function mountHook(): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { useTasks } = await import('../../hooks/useTasks');

  const container = document.createElement('div');
  document.body.appendChild(container);

  function Probe() {
    api = useTasks() as UseTasksApi;
    return React.createElement(
      'ul',
      null,
      api.tasks.map((task) =>
        React.createElement('li', { key: task.id, 'data-id': task.id }, task.title)
      )
    );
  }

  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Probe));
  });
  await settle(React);

  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return container;
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
  await flush();
  document.body.innerHTML = '';
});

describe('useTasks — load & add', () => {
  it('nạp task có sẵn từ storage khi mount', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc cũ' }) });
    const container = await mountHook();

    expect(container.textContent).toContain('Việc cũ');
    expect(api.tasks).toHaveLength(1);
  });

  it('add ghi đúng 1 key với default và title đã trim', async () => {
    const container = await mountHook();

    await act(async () => {
      await api.add('  Việc mới  ');
    });

    const keys = taskKeys();
    expect(keys).toHaveLength(1);
    // 1 key/task, không ghi cả danh sách vào 1 key khác
    expect(stub.store.size).toBe(1);
    const saved = stub.store.get(keys[0]) as Task;
    expect(saved.id).toBe(keys[0].slice('t:'.length));
    expect(saved.title).toBe('Việc mới');
    expect(saved.done).toBe(false);
    expect(saved.priority).toBe('medium');
    expect(saved.note).toBe('');
    expect(saved.tags).toEqual([]);
    expect(saved.subtasks).toEqual([]);
    expect(saved.recurrence).toEqual({ kind: 'none' });
    expect(container.textContent).toContain('Việc mới');
  });

  it('add từ chối title rỗng/khoảng trắng/quá 200 ký tự', async () => {
    const container = await mountHook();

    await act(async () => {
      await api.add('');
      await api.add('   ');
      await api.add('x'.repeat(201));
    });

    expect(taskKeys()).toHaveLength(0);
    expect(stub.store.size).toBe(0);
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});

describe('useTasks — create & restore', () => {
  it('create lưu đủ field từ draft composer', async () => {
    const container = await mountHook();

    await act(async () => {
      await api.create({
        title: '  Họp nhóm  ',
        note: 'chuẩn bị slide',
        priority: 'high',
        dueAt: '2035-01-01T08:00:00.000Z',
        recurrence: { kind: 'daily' },
        tags: ['work', 'urgent'],
        subtasks: [{ id: 's1', title: 'Chuẩn bị', done: false }],
        done: false,
      });
    });

    const saved = stub.store.get(taskKeys()[0]) as Task;
    expect(saved.title).toBe('Họp nhóm');
    expect(saved.note).toBe('chuẩn bị slide');
    expect(saved.priority).toBe('high');
    expect(saved.dueAt).toBe('2035-01-01T08:00:00.000Z');
    expect(saved.recurrence).toEqual({ kind: 'daily' });
    expect(saved.tags).toEqual(['work', 'urgent']);
    expect(saved.subtasks).toEqual([
      { id: 's1', title: 'Chuẩn bị', done: false },
    ]);
    expect(container.textContent).toContain('Họp nhóm');
  });

  it('restore đưa task đã xoá trở lại với id/createdAt gốc', async () => {
    const container = await mountHook();
    const task = fixture({ id: 'gone', title: 'Khôi phục tôi' });

    await act(async () => {
      await api.restore(task);
    });

    expect(stub.store.get('t:gone')).toEqual(task);
    expect(container.textContent).toContain('Khôi phục tôi');
  });
  it('restore task đã có sẵn thì thay thế, không duplicate', async () => {
    stub.seed({ 't:x': fixture({ id: 'x', title: 'Bản cũ' }) });
    const container = await mountHook();

    await act(async () => {
      await api.restore(fixture({ id: 'x', title: 'Bản khôi phục' }));
    });

    expect(taskKeys()).toHaveLength(1);
    expect((stub.store.get('t:x') as Task).title).toBe('Bản khôi phục');
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(container.textContent).toContain('Bản khôi phục');
  });
});

describe('useTasks — update & remove', () => {
  it('update ghi lại task và bump updatedAt', async () => {
    const original = fixture({ id: 'a', title: 'Tên cũ' });
    stub.seed({ 't:a': original });
    const container = await mountHook();

    await act(async () => {
      await api.update({ ...original, title: 'Tên mới' });
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.title).toBe('Tên mới');
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThan(
      new Date(original.updatedAt).getTime()
    );
    expect(container.textContent).toContain('Tên mới');
  });

  it('remove xoá key storage, clear alarm và bỏ task khỏi snapshot', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', dueAt: '2035-01-01T08:00:00.000Z' }),
    });
    const container = await mountHook();
    expect(stub.alarms.has('due:a')).toBe(true);

    await act(async () => {
      await api.remove('a');
    });

    expect(stub.store.has('t:a')).toBe(false);
    expect(stub.alarms.has('due:a')).toBe(false);
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});

describe('useTasks — toggle', () => {
  it('toggle task thường: done=true và clear alarm', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', dueAt: '2035-01-01T08:00:00.000Z' }),
    });
    await mountHook();
    expect(stub.alarms.has('due:a')).toBe(true);

    await act(async () => {
      await api.toggle('a');
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.done).toBe(true);
    expect(stub.alarms.has('due:a')).toBe(false);
  });

  it('toggle task lặp daily: dời dueAt sang tương lai, done=false, tạo alarm mới', async () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const task = fixture({
      id: 'a',
      dueAt: yesterday,
      recurrence: { kind: 'daily' },
    });
    stub.seed({ 't:a': task });
    await mountHook();

    await act(async () => {
      await api.toggle('a');
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.done).toBe(false);
    expect(saved.dueAt).not.toBe(task.dueAt);
    expect(new Date(saved.dueAt!).getTime()).toBeGreaterThan(Date.now());
    expect(stub.alarms.has('due:a')).toBe(true);
    expect(stub.alarms.get('due:a')!.delayInMinutes).toBeGreaterThan(0);
  });
});

describe('useTasks — storage.onChanged', () => {
  it('task từ máy khác xuất hiện, rồi biến mất khi bị xoá', async () => {
    const container = await mountHook();

    const external = fixture({ id: 'x', title: 'Từ máy khác' });
    await act(async () => {
      stub.store.set('t:x', external);
      stub.emitChange(['t:x']);
      await flush();
    });
    expect(container.textContent).toContain('Từ máy khác');

    await act(async () => {
      stub.store.delete('t:x');
      stub.emitChange(['t:x']);
      await flush();
    });
    expect(container.textContent).not.toContain('Từ máy khác');
  });
});

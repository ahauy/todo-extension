/**
 * Test migration in-memory của `loadAll` (Gói 0/G6): task cũ có `dueAt`/
 * `prevDueAt` dạng UTC `Z` được đọc ra canonical wall-clock local, task đã
 * local giữ nguyên văn, và việc đọc KHÔNG sinh write (quota 120 write/phút).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { loadAll } from '../../lib/storage/adapter';
import type { Task } from '../../lib/tasks/types';

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

let stub: ChromeStub;

function fixture(overrides: Partial<Task>): Task {
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
    createdAt: '2035-01-01T00:00:00.000Z',
    updatedAt: '2035-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  stub = createChromeStub();
  stub.install();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadAll — chuẩn hoá dueAt/prevDueAt khi đọc', () => {
  it('task dạng Z và task dạng local đều đọc ra canonical', async () => {
    const instant = '2035-01-15T09:00:00.000Z';
    stub.seed({
      't:utc': fixture({
        id: 'utc',
        dueAt: instant,
        prevDueAt: '2035-01-14T09:00:00.000Z',
      }),
      't:local': fixture({ id: 'local', dueAt: '2035-01-16T08:30' }),
    });

    const tasks = await loadAll();
    const utcTask = tasks.find((task) => task.id === 'utc')!;
    const localTask = tasks.find((task) => task.id === 'local')!;

    expect(utcTask.dueAt).toMatch(LOCAL_DATETIME);
    expect(utcTask.dueAt).not.toContain('Z');
    expect(new Date(utcTask.dueAt!).getTime()).toBe(new Date(instant).getTime());
    expect(utcTask.prevDueAt).toMatch(LOCAL_DATETIME);
    expect(utcTask.prevDueAt).not.toContain('Z');

    // Đã local → nguyên văn, không đụng.
    expect(localTask.dueAt).toBe('2035-01-16T08:30');
    expect(localTask.prevDueAt).toBeUndefined();
  });

  it('đọc 2 lần cho cùng kết quả (idempotent) và không ghi storage', async () => {
    stub.seed({
      't:utc': fixture({ id: 'utc', dueAt: '2035-01-15T09:00:00.000Z' }),
    });
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');

    const first = await loadAll();
    const second = await loadAll();

    expect(second).toEqual(first);
    expect(second[0].dueAt).toBe(first[0].dueAt);
    expect(setSpy).not.toHaveBeenCalled();
  });
});

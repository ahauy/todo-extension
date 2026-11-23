/**
 * Test sortBoard (G8): mọi tiêu chí phải deterministic — tie-breaker cuối là `id`,
 * không phụ thuộc thứ tự key trong storage (R-15).
 * Fixture `dueAt` dùng wall-clock local `YYYY-MM-DDTHH:mm` (không `Z`, Gói 0/G6).
 */
import { describe, expect, it } from 'vitest';
import { sortBoard, sortTasks } from '../../lib/tasks/query';
import type { Task } from '../../lib/tasks/types';

const NOW = new Date('2035-01-15T12:00');

function makeTask(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  const { id, ...rest } = overrides;
  return {
    id,
    title: id,
    note: '',
    priority: 'important-not-urgent',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2035-01-01T00:00:00Z',
    updatedAt: '2035-01-01T00:00:00Z',
    ...rest,
  };
}

const ids = (tasks: Task[]) => tasks.map((task) => task.id);

describe('sortBoard — created (G8)', () => {
  const tiedCreated = [
    makeTask({ id: 'c', createdAt: '2035-02-01T00:00:00Z' }),
    makeTask({ id: 'b', createdAt: '2035-03-01T00:00:00Z' }),
    makeTask({ id: 'a', createdAt: '2035-03-01T00:00:00Z' }),
    makeTask({ id: 'd', createdAt: '2035-01-01T00:00:00Z' }),
  ];

  it('createdAt desc, tie cùng createdAt → id tăng dần', () => {
    expect(ids(sortBoard(tiedCreated, 'created', NOW))).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('cùng output khi chạy 2 lần và khi đảo thứ tự input', () => {
    const first = ids(sortBoard(tiedCreated, 'created', NOW));
    const second = ids(sortBoard(tiedCreated, 'created', NOW));
    const reversed = ids(sortBoard([...tiedCreated].reverse(), 'created', NOW));
    expect(second).toEqual(first);
    expect(reversed).toEqual(first);
  });
});

describe('sortTasks — 4 mức Eisenhower (R-05)', () => {
  it('xếp Q1 → Q2 → Q3 → Q4 (mọi dueAt/createdAt bằng nhau; id KHÔNG ăn theo rank)', () => {
    const tasks = [
      makeTask({ id: 'a', priority: 'not-important-not-urgent', dueAt: '2035-01-20T09:00' }),
      makeTask({ id: 'b', priority: 'important-not-urgent', dueAt: '2035-01-20T09:00' }),
      makeTask({ id: 'c', priority: 'important-urgent', dueAt: '2035-01-20T09:00' }),
      makeTask({ id: 'd', priority: 'not-important-urgent', dueAt: '2035-01-20T09:00' }),
    ];
    expect(ids(sortTasks(tasks, NOW))).toEqual(['c', 'b', 'd', 'a']);
  });

  it('priority là tiêu chí phụ: cùng priority giữ tie-break dueAt → createdAt → id (R-15)', () => {
    const tasks = [
      makeTask({ id: 'later', priority: 'important-urgent', dueAt: '2035-01-21T09:00' }),
      makeTask({ id: 'newer', priority: 'important-urgent', dueAt: '2035-01-20T09:00', createdAt: '2035-02-01T00:00:00Z' }),
      makeTask({ id: 'older', priority: 'important-urgent', dueAt: '2035-01-20T09:00' }),
    ];
    expect(ids(sortTasks(tasks, NOW))).toEqual(['newer', 'older', 'later']);
  });
});

describe('sortBoard — priority (G8)', () => {
  it('priority desc → dueAt asc (không hạn cuối) → createdAt desc → id', () => {
    const tasks = [
      makeTask({ id: 'late-high', priority: 'important-urgent', dueAt: '2035-01-20T09:00' }),
      makeTask({ id: 'no-due-high', priority: 'important-urgent' }),
      makeTask({ id: 'early-high', priority: 'important-urgent', dueAt: '2035-01-18T09:00' }),
      makeTask({ id: 'low', priority: 'not-important-not-urgent', dueAt: '2035-01-10T09:00' }),
    ];
    expect(ids(sortBoard(tasks, 'priority', NOW))).toEqual([
      'early-high',
      'late-high',
      'no-due-high',
      'low',
    ]);
  });

  it('tie priority + dueAt → createdAt desc, rồi id; ổn định qua 2 lần chạy', () => {
    const tasks = [
      makeTask({
        id: 't-b',
        priority: 'important-urgent',
        dueAt: '2035-01-20T09:00',
      }),
      makeTask({
        id: 't-a',
        priority: 'important-urgent',
        dueAt: '2035-01-20T09:00',
      }),
      makeTask({
        id: 't-newer',
        priority: 'important-urgent',
        dueAt: '2035-01-20T09:00',
        createdAt: '2035-02-01T00:00:00Z',
      }),
    ];
    const expected = ['t-newer', 't-a', 't-b'];
    expect(ids(sortBoard(tasks, 'priority', NOW))).toEqual(expected);
    expect(ids(sortBoard(tasks, 'priority', NOW))).toEqual(expected);
    expect(ids(sortBoard([...tasks].reverse(), 'priority', NOW))).toEqual(
      expected
    );
  });
});

/** Test gate thông báo (defect #16). */
import { describe, expect, it } from 'vitest';
import { shouldNotify } from '../../lib/notifications';
import type { Settings, Task } from '../../lib/tasks/types';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Việc',
    note: '',
    priority: 'medium',
    dueAt: '2035-01-01T09:00:00.000Z',
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const settings = (enabled: boolean): Settings => ({
  theme: 'system',
  notificationsEnabled: enabled,
});

describe('shouldNotify (#16)', () => {
  it('bật + có hạn + chưa done → true', () => {
    expect(shouldNotify(task(), settings(true))).toBe(true);
  });

  it('settings notificationsEnabled=false → false', () => {
    expect(shouldNotify(task(), settings(false))).toBe(false);
  });

  it('settings null → mặc định bật', () => {
    expect(shouldNotify(task(), null)).toBe(true);
  });

  it('task done hoặc không có hạn → false', () => {
    expect(shouldNotify(task({ done: true }), settings(true))).toBe(false);
    expect(shouldNotify(task({ dueAt: null }), settings(true))).toBe(false);
  });
});

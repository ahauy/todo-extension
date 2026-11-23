/** Test gate thông báo (defect #16). */
import { describe, expect, it } from 'vitest';
import { notificationPriority, shouldNotify } from '../../lib/notifications';
import { DEFAULT_SETTINGS, type Settings, type Task } from '../../lib/tasks/types';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Việc',
    note: '',
    priority: 'important-not-urgent',
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
  ...DEFAULT_SETTINGS,
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

describe('notificationPriority (R-05/R-12)', () => {
  it('chỉ important-urgent (Q1) → 2; các mức khác → 0', () => {
    expect(notificationPriority('important-urgent')).toBe(2);
    expect(notificationPriority('important-not-urgent')).toBe(0);
    expect(notificationPriority('not-important-urgent')).toBe(0);
    expect(notificationPriority('not-important-not-urgent')).toBe(0);
  });
});

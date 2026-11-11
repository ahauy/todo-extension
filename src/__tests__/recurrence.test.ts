/**
 * Test domain recurrence (defect #9): monthly rule phải có `day`; dữ liệu cũ
 * thiếu rule không được crash; weekly lấy weekday từ hạn.
 */
import { describe, expect, it } from 'vitest';
import {
  nextDueAt,
  nextFutureDue,
  recurrenceForKind,
} from '../../lib/tasks/recurrence';
import type { RecurrenceRule } from '../../lib/tasks/types';

describe('recurrenceForKind', () => {
  it('monthly lấy day từ dueAt', () => {
    expect(recurrenceForKind('monthly', '2035-01-15T09:00:00')).toEqual({
      kind: 'monthly',
      rule: { day: 15 },
    });
  });

  it('weekly lấy weekday từ dueAt (2035-01-15 là thứ 2)', () => {
    expect(recurrenceForKind('weekly', '2035-01-15T09:00:00')).toEqual({
      kind: 'weekly',
      rule: { weekdays: [1] },
    });
  });

  it('none/daily trả kind đơn giản', () => {
    expect(recurrenceForKind('none', null)).toEqual({ kind: 'none' });
    expect(recurrenceForKind('daily', null)).toEqual({ kind: 'daily' });
  });

  it('dueAt null fallback hôm nay (không ném)', () => {
    expect(() => recurrenceForKind('monthly', null)).not.toThrow();
    expect(() => recurrenceForKind('weekly', 'invalid-date')).not.toThrow();
  });
});

describe('nextDueAt — monthly (#9)', () => {
  it('clamp day 31 về ngày cuối tháng ngắn', () => {
    const next = nextDueAt('2035-01-31T09:00:00', {
      kind: 'monthly',
      rule: { day: 31 },
    });
    expect(next).not.toBeNull();
    const date = new Date(next!);
    expect(date.getMonth()).toBe(1); // tháng 2
    expect(date.getDate()).toBe(28); // 2035 không nhuận
  });

  it('rule legacy thiếu day không ném (fallback ngày của prevDue)', () => {
    const legacy = { kind: 'monthly' } as unknown as RecurrenceRule;
    expect(() => nextDueAt('2035-01-15T09:00:00', legacy)).not.toThrow();
    const next = nextDueAt('2035-01-15T09:00:00', legacy);
    expect(new Date(next!).getDate()).toBe(15);
  });
});

describe('nextFutureDue', () => {
  it('catch-up daily trả mốc > now', () => {
    const now = new Date('2035-01-10T09:00:00');
    const next = nextFutureDue('2035-01-01T09:00:00', { kind: 'daily' }, now);
    expect(next).not.toBeNull();
    expect(new Date(next!).getTime()).toBeGreaterThan(now.getTime());
  });
});

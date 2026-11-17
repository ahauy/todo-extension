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

describe('nextDueAt — wall-clock local không Z (G6)', () => {
  it('daily giữ nguyên HH:mm, trả YYYY-MM-DDTHH:mm', () => {
    expect(nextDueAt('2035-01-15T09:00', { kind: 'daily' })).toBe(
      '2035-01-16T09:00'
    );
  });

  it('weekly cộng 7 ngày, giữ nguyên HH:mm', () => {
    const next = nextDueAt('2035-01-15T09:00', {
      kind: 'weekly',
      rule: { weekdays: [1] },
    });
    expect(next).toBe('2035-01-22T09:00');
  });

  it('monthly giữ ngày/giờ local', () => {
    expect(
      nextDueAt('2035-01-15T09:00', { kind: 'monthly', rule: { day: 15 } })
    ).toBe('2035-02-15T09:00');
  });

  it('không có hậu tố Z ở mọi kind', () => {
    const next = nextDueAt('2035-01-15T23:30', { kind: 'daily' });
    expect(next).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(next).not.toContain('Z');
  });
});

describe('nextFutureDue', () => {
  it('catch-up daily trả mốc > now dạng local', () => {
    const now = new Date('2035-01-10T09:00');
    const next = nextFutureDue('2035-01-01T09:00', { kind: 'daily' }, now);
    expect(next).not.toBeNull();
    expect(new Date(next!).getTime()).toBeGreaterThan(now.getTime());
    expect(next).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(next).not.toContain('Z');
  });

  it('catch-up daily trả đúng occurrence kế tiếp giữ HH:mm', () => {
    const now = new Date('2035-01-10T09:00');
    expect(nextFutureDue('2035-01-01T09:00', { kind: 'daily' }, now)).toBe(
      '2035-01-11T09:00'
    );
  });
});

describe('nextDueAt — weekly tôn trọng weekdays (G3)', () => {
  const monWedFri: RecurrenceRule = {
    kind: 'weekly',
    rule: { weekdays: [1, 3, 5] },
  };

  it('T2 → T4 → T6 → T2 tuần sau, giữ HH:mm qua nhiều tuần', () => {
    const wed = nextDueAt('2035-01-15T09:00', monWedFri); // 2035-01-15 là thứ 2
    expect(wed).toBe('2035-01-17T09:00');
    expect(new Date(wed!).getDay()).toBe(3);

    const fri = nextDueAt(wed!, monWedFri);
    expect(fri).toBe('2035-01-19T09:00');
    expect(new Date(fri!).getDay()).toBe(5);

    const nextMon = nextDueAt(fri!, monWedFri);
    expect(nextMon).toBe('2035-01-22T09:00');
    expect(new Date(nextMon!).getDay()).toBe(1);

    // Tuần kế tiếp vẫn giữ chuỗi T2/T4/T6 và giờ 09:00.
    expect(nextDueAt(nextMon!, monWedFri)).toBe('2035-01-24T09:00');
    expect(nextDueAt('2035-01-24T09:00', monWedFri)).toBe('2035-01-26T09:00');
  });

  it('offset vắt qua ranh giới tháng (T4 31/01 → T6 02/02)', () => {
    expect(nextDueAt('2035-01-31T09:00', monWedFri)).toBe('2035-02-02T09:00');
  });

  it('không hardcode +7: thứ đã qua trong tuần phải nhảy sang tuần sau', () => {
    // 2035-01-17 là thứ 4, weekdays chỉ có thứ 2 → thứ 2 kế tiếp là 22/01.
    const onlyMonday: RecurrenceRule = {
      kind: 'weekly',
      rule: { weekdays: [1] },
    };
    expect(nextDueAt('2035-01-17T18:15', onlyMonday)).toBe('2035-01-22T18:15');
  });

  it('weekdays rỗng → fallback +7 ngày, giữ giờ', () => {
    expect(
      nextDueAt('2035-01-15T09:00', { kind: 'weekly', rule: { weekdays: [] } })
    ).toBe('2035-01-22T09:00');
  });

  it('rule thiếu (dữ liệu cũ lỗi) → fallback +7 ngày, không ném', () => {
    const legacy = { kind: 'weekly' } as unknown as RecurrenceRule;
    expect(nextDueAt('2035-01-15T09:00', legacy)).toBe('2035-01-22T09:00');
  });

  it('weekdays lẫn giá trị ngoài 0..6 → chỉ dùng thứ hợp lệ, giữ HH:mm', () => {
    // 2035-01-17 là thứ 4; [1, 9, -1] → chỉ thứ 2 (1) hợp lệ → T2 22/01 18:15.
    const mixed: RecurrenceRule = {
      kind: 'weekly',
      rule: { weekdays: [1, 9, -1] },
    };
    expect(nextDueAt('2035-01-17T18:15', mixed)).toBe('2035-01-22T18:15');
  });

  it('weekdays toàn giá trị lạ hoặc không phải array → fallback +7 ngày', () => {
    const allInvalid: RecurrenceRule = {
      kind: 'weekly',
      rule: { weekdays: [9, 42] },
    };
    expect(nextDueAt('2035-01-15T09:00', allInvalid)).toBe('2035-01-22T09:00');

    // Data corrupt từ máy khác: `weekdays` không phải array → không được ném TypeError.
    const corrupted = {
      kind: 'weekly',
      rule: { weekdays: 'mon' },
    } as unknown as RecurrenceRule;
    expect(nextDueAt('2035-01-15T09:00', corrupted)).toBe('2035-01-22T09:00');
  });
});

describe('nextFutureDue — weekly catch-up (G3)', () => {
  const monWedFri: RecurrenceRule = {
    kind: 'weekly',
    rule: { weekdays: [1, 3, 5] },
  };

  it('tick muộn 2 tuần: từ T6 ghim đúng T6 kế tiếp > now, giữ HH:mm', () => {
    const now = new Date('2035-02-01T12:00'); // thứ 5
    const next = nextFutureDue('2035-01-19T09:00', monWedFri, now); // T6 19/01
    expect(next).toBe('2035-02-02T09:00');
    expect(new Date(next!).getDay()).toBe(5);
    expect(new Date(next!).getTime()).toBeGreaterThan(now.getTime());
  });

  it('now rơi đúng ngày có lịch nhưng sau giờ hẹn → nhảy sang thứ kế tiếp', () => {
    const now = new Date('2035-01-22T10:00'); // T2 10:00, hẹn 09:00 đã qua
    expect(nextFutureDue('2035-01-19T09:00', monWedFri, now)).toBe(
      '2035-01-24T09:00'
    );
  });
});

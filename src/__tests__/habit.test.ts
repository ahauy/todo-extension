/**
 * R-23 — Unit test cho logic thuần `lib/tasks/habit.ts`.
 * Mọi mốc thời gian dùng giờ local (`new Date(y, m, d)`), không UTC.
 */
import { describe, expect, it } from 'vitest';
import { dayKey } from '../../lib/datetime';
import {
  HABIT_MAX_DAYS,
  habitCells21,
  habitOccurrenceDay,
  habitStartDay,
  habitStreak,
  isHabitScheduledDay,
  normalizeHabitDays,
  withHabitDay,
  withHabitEnabled,
} from '../../lib/tasks/habit';
import type { Task } from '../../lib/tasks/types';

function local(y: number, m: number, d: number, hour = 12): Date {
  return new Date(y, m - 1, d, hour);
}

/** ISO UTC của một trưa local — startedAt luôn là instant có `Z`. */
function localISO(y: number, m: number, d: number): string {
  return local(y, m, d).toISOString();
}

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'h',
    title: 'Thói quen',
    note: '',
    priority: 'important-not-urgent',
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

function habitTask(
  startedAt: string,
  doneDays: string[],
  recurrence: Task['recurrence'] = { kind: 'daily' }
): Task {
  return fixture({ recurrence, habit: { startedAt, doneDays } });
}

function days(from: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    dayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + index))
  );
}

describe('normalizeHabitDays', () => {
  it('bỏ giá trị sai định dạng / ngày không tồn tại / không phải string', () => {
    expect(
      normalizeHabitDays([
        '2026-11-18',
        '2026-02-30',
        '18-11-2026',
        '2026-13-01',
        'garbage',
        null,
        5,
        '2026-11-18',
      ])
    ).toEqual(['2026-11-18']);
  });

  it('unique, sort tăng và cap 31 (giữ mới nhất) sau 60 ngày', () => {
    const sixty = days(local(2026, 9, 1), 60);
    const normalized = normalizeHabitDays([...sixty].reverse().concat(sixty[0]));
    expect(normalized).toHaveLength(HABIT_MAX_DAYS);
    expect(normalized[0]).toBe(sixty[29]);
    expect(normalized.at(-1)).toBe(sixty[59]);
    expect([...new Set(normalized)].sort()).toEqual(normalized);
  });

  it('input không phải array → []', () => {
    expect(normalizeHabitDays(null)).toEqual([]);
    expect(normalizeHabitDays('2026-11-18')).toEqual([]);
  });
});

describe('habitStartDay — ngày LOCAL của startedAt', () => {
  it('dùng getFullYear/getMonth/getDate, không cắt chuỗi UTC', () => {
    // 18:00Z = 01:00 ngày hôm sau giờ UTC+7 → UTC day = 18, local day = 19.
    const startedAt = '2026-11-18T18:00:00.000Z';
    expect(dayKey(new Date(startedAt))).toBe('2026-11-19');
    expect(habitStartDay(fixture({ habit: { startedAt, doneDays: [] } }))).toBe(
      '2026-11-19'
    );
  });

  it('task cũ thiếu habit / startedAt hỏng → null', () => {
    expect(habitStartDay(fixture())).toBeNull();
    expect(
      habitStartDay(fixture({ habit: { startedAt: 'oops', doneDays: [] } }))
    ).toBeNull();
  });
});

describe('habitOccurrenceDay — ngày occurrence cũ', () => {
  it('đọc dueAt CŨ theo giờ local, kể cả instant ISO có Z', () => {
    expect(habitOccurrenceDay('2026-11-18T23:00')).toBe('2026-11-18');
    expect(habitOccurrenceDay('2026-11-18T18:00:00.000Z')).toBe('2026-11-19');
  });

  it('null khi thiếu/không parse được', () => {
    expect(habitOccurrenceDay(null)).toBeNull();
    expect(habitOccurrenceDay(undefined)).toBeNull();
    expect(habitOccurrenceDay('bad')).toBeNull();
  });
});

describe('isHabitScheduledDay', () => {
  it('weekly T2–T6: T7/CN là off-calendar', () => {
    const task = habitTask(localISO(2026, 11, 16), [], {
      kind: 'weekly',
      rule: { weekdays: [1, 2, 3, 4, 5] },
    });
    for (const day of [16, 17, 18, 19, 20]) {
      expect(isHabitScheduledDay(task, local(2026, 11, day))).toBe(true);
    }
    expect(isHabitScheduledDay(task, local(2026, 11, 21))).toBe(false); // T7
    expect(isHabitScheduledDay(task, local(2026, 11, 22))).toBe(false); // CN
  });

  it('nhiều weekdays rời rạc', () => {
    const task = habitTask(localISO(2026, 11, 16), [], {
      kind: 'weekly',
      rule: { weekdays: [0, 3, 6] },
    });
    expect(isHabitScheduledDay(task, local(2026, 11, 18))).toBe(true); // T4
    expect(isHabitScheduledDay(task, local(2026, 11, 21))).toBe(true); // T7
    expect(isHabitScheduledDay(task, local(2026, 11, 22))).toBe(true); // CN
    expect(isHabitScheduledDay(task, local(2026, 11, 16))).toBe(false); // T2
  });

  it('monthly clamp theo số ngày trong tháng; rule.day hỏng → fallback ngày local của startedAt', () => {
    const task = habitTask(localISO(2026, 1, 15), [], {
      kind: 'monthly',
      rule: { day: 31 },
    });
    expect(isHabitScheduledDay(task, local(2026, 1, 31))).toBe(true);
    expect(isHabitScheduledDay(task, local(2026, 2, 28))).toBe(true); // clamp 28
    expect(isHabitScheduledDay(task, local(2026, 2, 27))).toBe(false);
    expect(isHabitScheduledDay(task, local(2026, 4, 30))).toBe(true); // clamp 30

    const fallback = habitTask(localISO(2026, 1, 15), [], {
      kind: 'monthly',
      rule: { day: undefined as unknown as number },
    });
    expect(isHabitScheduledDay(fallback, local(2026, 1, 15))).toBe(true);
    expect(isHabitScheduledDay(fallback, local(2026, 1, 31))).toBe(false);
  });

  it('không tính ngày trước startDay; rule đổi thì lịch đổi theo rule hiện tại', () => {
    const weekdays = habitTask(localISO(2026, 11, 16), [], {
      kind: 'weekly',
      rule: { weekdays: [1, 2, 3, 4, 5] },
    });
    expect(isHabitScheduledDay(weekdays, local(2026, 11, 13))).toBe(false);

    const doneDays = days(local(2026, 11, 16), 5); // T2..T6
    const original = habitTask(localISO(2026, 11, 16), doneDays, weekdays.recurrence);
    expect(habitStreak(original, local(2026, 11, 20))).toBe(5);

    const changed = { ...original, recurrence: { kind: 'weekly' as const, rule: { weekdays: [1] } } };
    expect(habitStreak(changed, local(2026, 11, 22))).toBe(1); // chỉ T2 16/11 còn thuộc lịch
  });

  it('recurrence none → không có ngày thuộc lịch (nhưng KHÔNG xoá habit)', () => {
    const task = habitTask(localISO(2026, 11, 16), [], { kind: 'none' });
    expect(isHabitScheduledDay(task, local(2026, 11, 16))).toBe(false);
    expect(task.habit).toBeDefined();
  });
});

describe('habitStreak', () => {
  it('hôm nay thuộc lịch & đã làm → tính từ hôm nay', () => {
    const task = habitTask(
      localISO(2026, 11, 16),
      days(local(2026, 11, 16), 5)
    );
    expect(habitStreak(task, local(2026, 11, 20))).toBe(5);
  });

  it('hôm nay thuộc lịch nhưng chưa làm → grace, tính từ hôm qua', () => {
    const doneDays = days(local(2026, 11, 16), 4); // 16..19, thiếu 20
    const task = habitTask(localISO(2026, 11, 16), doneDays);
    expect(habitStreak(task, local(2026, 11, 20))).toBe(4);
  });

  it('T7/CN ngoài lịch không đứt streak', () => {
    const task = habitTask(localISO(2026, 11, 16), days(local(2026, 11, 16), 5), {
      kind: 'weekly',
      rule: { weekdays: [1, 2, 3, 4, 5] },
    });
    // Chủ nhật 22/11: off-calendar → bỏ qua 22, 21 rồi đếm 20..16.
    expect(habitStreak(task, local(2026, 11, 22))).toBe(5);
  });

  it('ngày thuộc lịch bị thiếu → dừng streak', () => {
    const doneDays = ['2026-11-16', '2026-11-17', '2026-11-19', '2026-11-20'];
    const task = habitTask(localISO(2026, 11, 16), doneDays);
    expect(habitStreak(task, local(2026, 11, 20))).toBe(2); // 20,19 rồi dừng ở 18
  });

  it('trần 31 dù sổ có 40 ngày liên tiếp', () => {
    const task = habitTask(localISO(2026, 10, 12), days(local(2026, 10, 12), 40));
    expect(habitStreak(task, local(2026, 11, 20))).toBe(31);
  });

  it('streak CHỈ đọc doneDays — lastDoneAt không ảnh hưởng', () => {
    const base = habitTask(localISO(2026, 11, 16), []);
    const withStamp = { ...base, lastDoneAt: localISO(2026, 11, 20) };
    expect(habitStreak(base, local(2026, 11, 20))).toBe(0);
    expect(habitStreak(withStamp, local(2026, 11, 20))).toBe(0);
  });

  it('task không có habit → 0', () => {
    expect(habitStreak(fixture(), local(2026, 11, 20))).toBe(0);
  });
});

describe('habitCells21', () => {
  it('21 ô liên tiếp kết thúc hôm nay, 3 trạng thái', () => {
    const task = habitTask(localISO(2026, 11, 16), days(local(2026, 11, 16), 5), {
      kind: 'weekly',
      rule: { weekdays: [1, 2, 3, 4, 5] },
    });
    const cells = habitCells21(task, local(2026, 11, 20));
    expect(cells).toHaveLength(21);
    expect(cells.at(-1)).toEqual({ key: '2026-11-20', state: 'done' });
    expect(cells[0].key).toBe('2026-10-31');
    expect(cells.find((cell) => cell.key === '2026-11-18')?.state).toBe('done');
    expect(cells.find((cell) => cell.key === '2026-11-17')?.state).toBe('done');
    // Trước startDay → off-calendar, không phải missed.
    expect(cells.find((cell) => cell.key === '2026-11-15')?.state).toBe('off-calendar');
    expect(cells.every((cell) => ['done', 'missed', 'off-calendar'].includes(cell.state))).toBe(true);
  });

  it('T7/CN là off-calendar, ngày thuộc lịch thiếu là missed', () => {
    const task = habitTask(localISO(2026, 11, 16), ['2026-11-18'], {
      kind: 'weekly',
      rule: { weekdays: [1, 2, 3, 4, 5] },
    });
    const cells = habitCells21(task, local(2026, 11, 22));
    expect(cells.find((cell) => cell.key === '2026-11-21')?.state).toBe('off-calendar');
    expect(cells.at(-1)).toEqual({ key: '2026-11-22', state: 'off-calendar' });
    expect(cells.find((cell) => cell.key === '2026-11-16')?.state).toBe('missed');
    expect(cells.find((cell) => cell.key === '2026-11-18')?.state).toBe('done');
  });
});

describe('withHabitDay', () => {
  const now = local(2026, 11, 20);

  it('add trong cửa sổ 31 ngày: unique/sort, không đụng field khác', () => {
    const base = habitTask(localISO(2026, 11, 16), ['2026-11-20']);
    const next = withHabitDay(base, '2026-11-18', 'add', now);
    expect(next).not.toBe(base);
    expect(next.habit!.doneDays).toEqual(['2026-11-18', '2026-11-20']);
    expect(next.dueAt).toBe(base.dueAt);
    expect(next.updatedAt).toBe(base.updatedAt);
    expect(next.lastDoneAt).toBe(base.lastDoneAt);
  });

  it('add ngày đã có → no-op; ngày tương lai (tick sớm) vẫn được ghi', () => {
    const base = habitTask(localISO(2026, 11, 16), ['2026-11-18']);
    expect(withHabitDay(base, '2026-11-18', 'add', now)).toBe(base);

    const added = withHabitDay(base, '2026-11-21', 'add', now);
    expect(added).not.toBe(base);
    expect(added.habit!.doneDays).toEqual(['2026-11-18', '2026-11-21']);
    // Ngày tương lai xa hơn 31 ngày so với hôm nay vẫn không bị chặn.
    expect(withHabitDay(base, '2027-01-15', 'add', now).habit!.doneDays).toEqual([
      '2026-11-18',
      '2027-01-15',
    ]);
  });

  it('add ngày tương lai khi sổ đã đầy → normalize cắt phần tử cũ nhất, vẫn unique/sorted', () => {
    const full = habitTask(localISO(2026, 9, 20), days(local(2026, 10, 21), 31));
    const next = withHabitDay(full, '2026-12-01', 'add', now);
    expect(next.habit!.doneDays).toHaveLength(HABIT_MAX_DAYS);
    expect(next.habit!.doneDays[0]).toBe('2026-10-22');
    expect(next.habit!.doneDays.at(-1)).toBe('2026-12-01');
    expect([...new Set(next.habit!.doneDays)].sort()).toEqual(next.habit!.doneDays);
  });

  it('add ngày đã aged-out (>30 ngày) → no-op, không đẩy ngày mới ra', () => {
    const base = habitTask(localISO(2026, 8, 1), ['2026-11-19']);
    expect(withHabitDay(base, '2026-09-01', 'add', now)).toBe(base);
    expect(withHabitDay(base, '2026-10-20', 'add', now)).toBe(base); // đúng 31 ngày trước
    expect(base.habit!.doneDays).toEqual(['2026-11-19']);
    expect(withHabitDay(base, '2026-10-21', 'add', now).habit!.doneDays).toEqual([
      '2026-10-21',
      '2026-11-19',
    ]); // 30 ngày trước vẫn nằm trong cửa sổ
  });

  it('remove đúng một ngày; gỡ lần 2 no-op cùng reference', () => {
    const base = habitTask(localISO(2026, 11, 16), ['2026-11-18', '2026-11-20']);
    const removed = withHabitDay(base, '2026-11-18', 'remove', now);
    expect(removed.habit!.doneDays).toEqual(['2026-11-20']);
    expect(removed.dueAt).toBe(base.dueAt);
    expect(removed.updatedAt).toBe(base.updatedAt);
    expect(withHabitDay(removed, '2026-11-18', 'remove', now)).toBe(removed);
    expect(withHabitDay(base, '2026-11-19', 'remove', now)).toBe(base);
  });

  it('task không có habit / ngày null / ngày lạ → no-op', () => {
    const bare = fixture();
    expect(withHabitDay(bare, '2026-11-20', 'add', now)).toBe(bare);
    const base = habitTask(localISO(2026, 11, 16), []);
    expect(withHabitDay(base, null, 'add', now)).toBe(base);
    expect(withHabitDay(base, '2026-02-30', 'add', now)).toBe(base);
  });
});

describe('withHabitEnabled', () => {
  const now = local(2026, 11, 20);

  it('bật lần đầu gán startedAt ISO UTC + doneDays rỗng', () => {
    const enabled = withHabitEnabled(fixture(), true, now);
    expect(enabled.habit).toBeDefined();
    expect(enabled.habit!.doneDays).toEqual([]);
    expect(enabled.habit!.startedAt).toBe(now.toISOString());
    expect(enabled.habit!.startedAt).toContain('Z');
  });

  it('bật lại giữ dữ liệu cũ; tắt giữ nguyên habit (chỉ ẩn ở UI)', () => {
    const old = habitTask(localISO(2026, 11, 16), ['2026-11-18']);
    expect(withHabitEnabled(old, true, now)).toBe(old);
    expect(withHabitEnabled(old, false, now)).toBe(old);
    expect(withHabitEnabled(old, false, now).habit).toEqual(old.habit);
  });
});

describe('HABIT_MAX_DAYS', () => {
  it('bằng 31', () => {
    expect(HABIT_MAX_DAYS).toBe(31);
  });
});

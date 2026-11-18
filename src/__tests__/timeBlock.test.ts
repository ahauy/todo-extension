/**
 * R-24 — unit test cho module THUẦN `lib/tasks/timeBlock.ts`: parse/validate,
 * mặc định 30′, selector timeline, snap 15′ và overlap (chỉ cảnh báo).
 * Không storage/chrome/React — mọi input là Task thường.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ESTIMATE_MIN,
  TIMELINE_END_MIN,
  TIMELINE_START_MIN,
  detectOverlaps,
  formatStartAtMinutes,
  isValidEstimateMin,
  isValidStartAt,
  normalizeEstimateMin,
  parseStartAtMinutes,
  snapStartAt,
  timelineOrder,
} from '../../lib/tasks/timeBlock';
import type { Task } from '../../lib/tasks/types';

function fixture(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Việc ${id}`,
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

describe('isValidStartAt / parseStartAtMinutes', () => {
  it('chấp nhận HH:mm 24h, reject mốc 24:00 và sai định dạng', () => {
    expect(isValidStartAt('00:00')).toBe(true);
    expect(isValidStartAt('09:05')).toBe(true);
    expect(isValidStartAt('23:59')).toBe(true);
    for (const bad of ['24:00', '9:05', '12:60', '12:5', '', '07:15:00']) {
      expect(isValidStartAt(bad)).toBe(false);
    }
    expect(isValidStartAt(null)).toBe(false);
    expect(isValidStartAt(450)).toBe(false);
  });

  it('parse đúng phút từ 00:00, null khi không hợp lệ', () => {
    expect(parseStartAtMinutes('00:00')).toBe(0);
    expect(parseStartAtMinutes('07:15')).toBe(435);
    expect(parseStartAtMinutes('23:59')).toBe(1439);
    expect(parseStartAtMinutes('24:00')).toBeNull();
    expect(parseStartAtMinutes(undefined)).toBeNull();
  });

  it('formatStartAtMinutes clamp 00:00–24:00 (24:00 chỉ là mốc kết thúc)', () => {
    expect(formatStartAtMinutes(0)).toBe('00:00');
    expect(formatStartAtMinutes(435)).toBe('07:15');
    expect(formatStartAtMinutes(TIMELINE_END_MIN)).toBe('24:00');
    expect(formatStartAtMinutes(-5)).toBe('00:00');
    expect(formatStartAtMinutes(9999)).toBe('24:00');
  });
});

describe('normalizeEstimateMin / isValidEstimateMin', () => {
  it('mặc định 30′ khi có giờ mà độ dài trống', () => {
    expect(normalizeEstimateMin('08:00', undefined)).toBe(DEFAULT_ESTIMATE_MIN);
    expect(normalizeEstimateMin('08:00', null)).toBe(30);
  });

  it('không có giờ hợp lệ → undefined (không vẽ block)', () => {
    expect(normalizeEstimateMin(undefined, 45)).toBeUndefined();
    expect(normalizeEstimateMin('24:00', 45)).toBeUndefined();
  });

  it('giữ nguyên giá trị đã lưu, kể cả ngoài 15–240 (không ghi đè dữ liệu)', () => {
    expect(normalizeEstimateMin('08:00', 45)).toBe(45);
    expect(normalizeEstimateMin('08:00', 300)).toBe(300);
  });

  it('giá trị hỏng (< 1 phút, NaN, chuỗi) → 30 để không phá layout', () => {
    expect(normalizeEstimateMin('08:00', 0)).toBe(30);
    expect(normalizeEstimateMin('08:00', Number.NaN)).toBe(30);
    expect(normalizeEstimateMin('08:00', '45')).toBe(30);
  });

  it('validate số nguyên 15–240', () => {
    expect(isValidEstimateMin(15)).toBe(true);
    expect(isValidEstimateMin(240)).toBe(true);
    for (const bad of [14, 241, 0, 30.5, Number.NaN, '30', null, undefined]) {
      expect(isValidEstimateMin(bad)).toBe(false);
    }
  });
});

describe('timelineOrder — selector thuần cho timeline 06:00–24:00', () => {
  it('giờ trong khung tăng dần, tie-breaker theo id', () => {
    const tasks = [
      fixture('b', { startAt: '09:00' }),
      fixture('a', { startAt: '07:30' }),
      fixture('c', { startAt: '07:30' }),
    ];
    expect(timelineOrder(tasks).map((entry) => entry.task.id)).toEqual(['a', 'c', 'b']);
  });

  it('giờ ngoài khung 00:00–05:59 và việc không giờ → nhóm cuối, giữ nhãn giờ', () => {
    const tasks = [
      fixture('none'),
      fixture('night', { startAt: '03:15' }),
      fixture('day', { startAt: '08:00' }),
      fixture('night2', { startAt: '01:00' }),
    ];
    const entries = timelineOrder(tasks);
    expect(entries.map((entry) => entry.task.id)).toEqual([
      'day',
      'night2',
      'night',
      'none',
    ]);
    expect(entries[1].outsideWindow).toBe(true);
    expect(entries[1].startMinutes).toBe(60);
    expect(entries[3].startMinutes).toBeNull();
    expect(entries[3].outsideWindow).toBe(false);
  });

  it('không làm mất việc, không mutate input, estimateMin đã chuẩn hoá', () => {
    const tasks = [
      fixture('x', { startAt: '07:00' }),
      fixture('y', { startAt: '09:00', estimateMin: 45 }),
      fixture('z'),
    ];
    const before = JSON.stringify(tasks);
    const entries = timelineOrder(tasks);
    expect(JSON.stringify(tasks)).toBe(before);
    expect(entries).toHaveLength(tasks.length);
    expect(entries.map((entry) => entry.estimateMin)).toEqual([30, 45, undefined]);
  });

  it('việc có giờ nhưng estimateMin ngoài range vẫn giữ nhãn/giá trị đã lưu', () => {
    const entries = timelineOrder([fixture('w', { startAt: '23:30', estimateMin: 300 })]);
    expect(entries[0].estimateMin).toBe(300);
    expect(entries[0].outsideWindow).toBe(false);
  });
});

describe('detectOverlaps — cảnh báo chồng lấn, nửa khoảng [start, end)', () => {
  it('trả cặp/id sort ổn định, chạm biên KHÔNG tính chồng', () => {
    const tasks = [
      fixture('b', { startAt: '08:15', estimateMin: 30 }),
      fixture('a', { startAt: '08:00', estimateMin: 30 }),
      fixture('c', { startAt: '08:30', estimateMin: 30 }),
    ];
    expect(detectOverlaps(tasks)).toEqual({
      ids: ['a', 'b', 'c'],
      pairs: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    });
  });

  it('nhiều cặp: block sau chồng 2 block trước → 2 cặp, ids unique', () => {
    const tasks = [
      fixture('a', { startAt: '09:00', estimateMin: 60 }),
      fixture('b', { startAt: '09:30', estimateMin: 60 }),
      fixture('c', { startAt: '09:45', estimateMin: 30 }),
    ];
    expect(detectOverlaps(tasks)).toEqual({
      ids: ['a', 'b', 'c'],
      pairs: [
        ['a', 'b'],
        ['a', 'c'],
        ['b', 'c'],
      ],
    });
  });

  it('block không giờ / ngoài khung / bị cắt rỗng không tạo chồng', () => {
    const tasks = [
      fixture('none'),
      fixture('night', { startAt: '03:00', estimateMin: 30 }),
      fixture('edge', { startAt: '05:50', estimateMin: 30 }),
      fixture('day', { startAt: '10:00', estimateMin: 30 }),
    ];
    // 05:50–06:20 cắt vào khung → 06:00–06:20, không chồng 10:00.
    expect(detectOverlaps(tasks)).toEqual({ ids: [], pairs: [] });
  });

  it('thuần đọc: không mutate, gọi lại cùng kết quả', () => {
    const tasks = [
      fixture('b', { startAt: '07:00', estimateMin: 30 }),
      fixture('a', { startAt: '07:10', estimateMin: 30 }),
    ];
    const before = JSON.stringify(tasks);
    const first = detectOverlaps(tasks);
    const second = detectOverlaps(tasks);
    expect(JSON.stringify(tasks)).toBe(before);
    expect(second).toEqual(first);
    expect(tasks[0].startAt).toBe('07:00');
  });
});

describe('snapStartAt — bước 15′ + clamp 06:00–23:45', () => {
  it('làm tròn tới bước 15 phút gần nhất', () => {
    expect(snapStartAt(7 * 60 + 7)).toBe('07:00');
    expect(snapStartAt(7 * 60 + 8)).toBe('07:15');
    expect(snapStartAt(7 * 60 + 53)).toBe('08:00');
  });

  it('clamp dưới 06:00 và trên 23:45 (24:00 không phải giờ bắt đầu)', () => {
    expect(TIMELINE_START_MIN).toBe(360);
    expect(snapStartAt(0)).toBe('06:00');
    expect(snapStartAt(23 * 60 + 59)).toBe('23:45');
    expect(snapStartAt(48 * 60)).toBe('23:45');
  });

  it('input hỏng → 06:00, output luôn hợp lệ', () => {
    expect(snapStartAt(Number.NaN)).toBe('06:00');
    for (const value of [0, 435, 1425, 9999]) {
      expect(isValidStartAt(snapStartAt(value))).toBe(true);
    }
  });
});

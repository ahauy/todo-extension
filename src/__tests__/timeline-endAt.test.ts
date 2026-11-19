/**
 * R-25 — hợp đồng thuần của `endAt`: nguồn thật, duration dẫn xuất, timeline 00:00–24:00.
 * Không storage/chrome — chỉ test module `lib/tasks/timeBlock`.
 */
import { describe, expect, it } from 'vitest';
import {
  detectOverlaps,
  durationMinutes,
  isValidEndAt,
  normalizeEstimateMin,
  snapStartAt,
  timelineOrder,
} from '../../lib/tasks/timeBlock';
import type { Task } from '../../lib/tasks/types';

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: 'Việc thử',
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

describe('R-25 durationMinutes — endAt là nguồn thật', () => {
  it('end > start → hiệu số phút', () => {
    expect(durationMinutes('09:00', '10:30', 999)).toBe(90);
  });

  it('end <= start (qua nửa đêm) → cộng 1440′', () => {
    expect(durationMinutes('23:00', '01:00')).toBe(120);
    expect(durationMinutes('23:00', '23:00')).toBe(1440);
    expect(durationMinutes('00:00', '00:00')).toBe(1440);
  });

  it('thiếu endAt → dùng estimateMin legacy / mặc định 30', () => {
    expect(durationMinutes('08:00', undefined, 75)).toBe(75);
    expect(durationMinutes('08:00', null)).toBe(30);
    expect(durationMinutes('08:00', 'oops', 45)).toBe(45);
  });

  it('start không hợp lệ → undefined (nhóm không giờ)', () => {
    expect(durationMinutes('24:00', '01:00')).toBeUndefined();
    expect(durationMinutes(undefined, '01:00')).toBeUndefined();
  });
});

describe('R-25 validator + normalize', () => {
  it('isValidEndAt dùng chung miền 00:00–23:59', () => {
    expect(isValidEndAt('00:00')).toBe(true);
    expect(isValidEndAt('23:59')).toBe(true);
    expect(isValidEndAt('24:00')).toBe(false);
    expect(isValidEndAt('1:00')).toBe(false);
  });

  it('normalizeEstimateMin: endAt thắng estimateMin đã lưu', () => {
    expect(normalizeEstimateMin('09:00', 999, '10:00')).toBe(60);
    expect(normalizeEstimateMin('09:00', 45, undefined)).toBe(45);
    expect(normalizeEstimateMin(undefined, 45, '10:00')).toBeUndefined();
  });
});

describe('R-25 timeline 00:00–24:00', () => {
  it('snapStartAt clamp 00:00–23:45 (không còn sàn 06:00)', () => {
    expect(snapStartAt(-100)).toBe('00:00');
    expect(snapStartAt(90)).toBe('01:30');
    expect(snapStartAt(5000)).toBe('23:45');
  });

  it('giờ 00:30/01:00 vào head; việc không giờ vào tail; không mất việc', () => {
    const tasks = [
      task({ id: 'none' }),
      task({ id: 'a', startAt: '01:00', endAt: '01:30' }),
      task({ id: 'b', startAt: '00:30', endAt: '01:15' }),
    ];
    const entries = timelineOrder(tasks);
    expect(entries.map((entry) => entry.task.id)).toEqual(['b', 'a', 'none']);
    expect(entries.every((entry) => !entry.outsideWindow)).toBe(true);
    expect(entries[0].estimateMin).toBe(45);
  });

  it('overnight bị cắt tại 24:00 → không chồng block đầu ngày cùng canvas', () => {
    const touching = [
      task({ id: 'a', startAt: '00:00', endAt: '00:30' }),
      task({ id: 'b', startAt: '00:30', endAt: '01:00' }),
    ];
    expect(detectOverlaps(touching).ids).toEqual([]);

    const crossing = [
      task({ id: 'a', startAt: '23:00', endAt: '01:00' }),
      task({ id: 'b', startAt: '00:30', estimateMin: 60 }),
    ];
    expect(detectOverlaps(crossing).ids).toEqual([]);
    expect(detectOverlaps(crossing).pairs).toEqual([]);
  });
});

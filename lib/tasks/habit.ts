/**
 * R-23 — Logic thuần cho streak thói quen. KHÔNG import storage/chrome/React:
 * mọi hàm ở đây chỉ đọc Task và trả giá trị/Task mới (pure, idempotent).
 *
 * Hợp đồng:
 * - `doneDays` là `YYYY-MM-DD` local, unique, tăng, tối đa `HABIT_MAX_DAYS`.
 * - Ngày bắt đầu là ngày **local** của `startedAt` (ISO UTC) qua `dayKey`.
 * - Lịch luôn đánh giá theo `recurrence` HIỆN TẠI (không lưu lịch sử rule).
 * - Streak chỉ đọc `doneDays`, KHÔNG đọc `lastDoneAt` (chip done-today R-11 là
 *   tín hiệu riêng). Ngày ngoài lịch không tính thiếu, không đứt streak.
 */

import { dayKey } from '../datetime';
import { HABIT_MAX_DAYS, type Task } from './types';

export { HABIT_MAX_DAYS };

export type HabitCellState = 'done' | 'missed' | 'off-calendar';

export interface HabitCell {
  /** `YYYY-MM-DD` local */
  key: string;
  state: HabitCellState;
}

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse `YYYY-MM-DD` thành Date local 00:00; null nếu sai định dạng/ngày không tồn tại. */
function parseDay(key: string): Date | null {
  const match = DAY_RE.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  if (month < 1 || month > 12 || date < 1 || date > 31) return null;
  const parsed = new Date(0);
  parsed.setHours(0, 0, 0, 0);
  parsed.setFullYear(year, month - 1, date); // setFullYear sửa mapping năm 0..99
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== date
  ) {
    return null;
  }
  return parsed;
}

/** Dời một day-key local theo số ngày (DST-safe vì tính trên thành phần lịch). */
function shiftDay(key: string, delta: number): string | null {
  const parsed = parseDay(key);
  if (!parsed) return null;
  return dayKey(
    new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + delta)
  );
}

/** Instant ISO UTC của `startedAt`, đã validate. */
function habitStartInstant(task: Task): Date | null {
  const startedAt = task.habit?.startedAt;
  if (typeof startedAt !== 'string') return null;
  const date = new Date(startedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Lọc `YYYY-MM-DD` hợp lệ, unique, sort tăng, cắt tối đa 31 (giữ mới nhất). */
export function normalizeHabitDays(days: unknown): string[] {
  if (!Array.isArray(days)) return [];
  const valid = days.filter(
    (value): value is string => typeof value === 'string' && parseDay(value) !== null
  );
  return [...new Set(valid)].sort().slice(-HABIT_MAX_DAYS);
}

/** Ngày local của `startedAt` (ISO UTC) — KHÔNG dùng UTC day. */
export function habitStartDay(task: Task): string | null {
  const start = habitStartInstant(task);
  return start ? dayKey(start) : null;
}

/** Ngày local của occurrence vừa xong, lấy từ `dueAt` CŨ / `prevDueAt` sau R-11. */
export function habitOccurrenceDay(
  prevDueAt: string | null | undefined
): string | null {
  if (!prevDueAt) return null;
  const date = new Date(prevDueAt);
  return Number.isNaN(date.getTime()) ? null : dayKey(date);
}

/**
 * Ngày có thuộc lịch hiện tại không (chỉ tính từ `startDay` trở đi).
 * `off-calendar` = trước startDay, sai thứ, hoặc sai ngày monthly đã clamp.
 * Dùng `getDay`/`getDate` local nên đúng quy tắc giờ thiết bị (R-10).
 */
export function isHabitScheduledDay(task: Task, date: Date): boolean {
  const start = habitStartDay(task);
  if (!start) return false;
  const key = dayKey(date);
  if (key < start) return false;

  const recurrence = task.recurrence;
  switch (recurrence.kind) {
    case 'daily':
      return true;

    case 'weekly': {
      const weekdays = Array.isArray(recurrence.rule?.weekdays)
        ? recurrence.rule.weekdays
        : [];
      return weekdays.some(
        (weekday) => Number.isInteger(weekday) && weekday === date.getDay()
      );
    }

    case 'monthly': {
      const requested = recurrence.rule?.day;
      const fallback = habitStartInstant(task)?.getDate() ?? null;
      const target =
        Number.isInteger(requested) && (requested as number) >= 1 &&
        (requested as number) <= 31
          ? (requested as number)
          : fallback;
      if (target === null) return false;
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();
      return date.getDate() === Math.min(target, daysInMonth);
    }

    case 'none':
      return false;
  }
}

/**
 * Streak hiện tại — grace cho hôm nay, bỏ qua ngày off-calendar, dừng ở
 * startDay, trần 31. CHỈ đọc `doneDays`.
 */
export function habitStreak(task: Task, today: Date): number {
  const start = habitStartDay(task);
  if (!start || !task.habit) return 0;

  const done = new Set(normalizeHabitDays(task.habit.doneDays));
  const todayKey = dayKey(today);
  const todayScheduled = isHabitScheduledDay(task, today);

  let cursor: string;
  if (todayScheduled && done.has(todayKey)) {
    cursor = todayKey;
  } else if (todayScheduled) {
    // Hôm nay thuộc lịch nhưng chưa làm → ân hạn đến hết ngày: bắt đầu từ hôm qua.
    cursor = shiftDay(todayKey, -1) ?? todayKey;
  } else {
    // Hôm nay ngoài lịch → vẫn bắt đầu từ hôm nay rồi bỏ qua ngày off-calendar.
    cursor = todayKey;
  }

  let streak = 0;
  while (streak < HABIT_MAX_DAYS) {
    if (cursor < start) break;
    const date = parseDay(cursor);
    if (!date) break;
    if (isHabitScheduledDay(task, date)) {
      if (!done.has(cursor)) break; // ngày thuộc lịch mà thiếu → đứt streak
      streak += 1;
    }
    const previous = shiftDay(cursor, -1);
    if (!previous || previous === cursor) break;
    cursor = previous;
  }
  return streak;
}

/** 21 ngày liên tiếp kết thúc hôm nay, mỗi ô 1 trong 3 trạng thái. */
export function habitCells21(task: Task, today: Date): HabitCell[] {
  const done = new Set(normalizeHabitDays(task.habit?.doneDays));
  const start = habitStartDay(task);
  const todayKey = dayKey(today);
  const cells: HabitCell[] = [];

  for (let offset = 20; offset >= 0; offset -= 1) {
    const key = shiftDay(todayKey, -offset) ?? todayKey;
    let state: HabitCellState = 'off-calendar';
    if (task.habit && start && key >= start) {
      const date = parseDay(key);
      if (date && isHabitScheduledDay(task, date)) {
        state = done.has(key) ? 'done' : 'missed';
      }
    }
    cells.push({ key, state });
  }
  return cells;
}

/**
 * Thêm/bớt một ngày trong `doneDays`. Pure & idempotent:
 * - `remove` ngày không có → trả CÙNG task/reference;
 * - `add` ngày đã có hoặc đã RƠI KHỎI cửa sổ 31 ngày (cũ hơn `hôm nay - 30`)
 *   → no-op; ngày tương lai (tick sớm) vẫn được ghi, `normalizeHabitDays` tự
 *   cắt phần tử cũ nhất nếu vượt 31;
 * - mọi field khác của Task (kể cả `dueAt`, `updatedAt`) giữ nguyên.
 */
export function withHabitDay(
  task: Task,
  day: string | null,
  mode: 'add' | 'remove',
  now: Date
): Task {
  const habit = task.habit;
  if (!habit || !day || !parseDay(day)) return task;

  const current = normalizeHabitDays(habit.doneDays);
  if (mode === 'remove') {
    if (!current.includes(day)) return task;
    return {
      ...task,
      habit: { ...habit, doneDays: current.filter((value) => value !== day) },
    };
  }

  if (current.includes(day)) return task;
  const todayKey = dayKey(now);
  const earliest = shiftDay(todayKey, -(HABIT_MAX_DAYS - 1));
  // Chỉ chặn ngày ĐÃ aged-out (cũ hơn hôm nay - 30). Ngày tương lai không bị
  // chặn: occurrence tick sớm vẫn được ghi vào sổ.
  if (!earliest || day < earliest) return task;

  return {
    ...task,
    habit: { ...habit, doneDays: normalizeHabitDays([...current, day]) },
  };
}

/**
 * Bật: gán `startedAt` ISO UTC + `doneDays: []` nếu CHƯA có; đã có thì giữ
 * nguyên dữ liệu cũ. Tắt: GIỚI NGUYÊN habit (chỉ ẩn ở UI — R-23).
 */
export function withHabitEnabled(
  task: Task,
  enabled: boolean,
  now: Date
): Task {
  if (!enabled || task.habit) return task;
  return {
    ...task,
    habit: { startedAt: now.toISOString(), doneDays: [] },
  };
}

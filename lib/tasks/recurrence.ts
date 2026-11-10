/**
 * Recurrence domain (L2-T06).
 * Thuật toán lặp lại theo múi giờ local thiết bị (không UTC).
 * Không lưu lịch sử occurrence (R-11).
 *
 * - nextDueAt(prevDue, rule): tính ngày/giờ lần kế tiếp.
 * - nextFutureDue(prevDue, rule, now): catch-up — lặp nextDueAt cho tới khi > now
 *   (tối đa 1000 vòng để chặn vòng lặp vô hạn với rule lỗi).
 */

import type { RecurrenceRule } from './types';

const MAX_ITERATIONS = 1000;

/** Lấy thành phần local time của Date (không dùng UTC) */
function localParts(d: Date) {
  return {
    year: d.getFullYear(),
    month: d.getMonth(), // 0-based
    date: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    ms: d.getMilliseconds(),
  };
}

/** Tạo Date từ thành phần local time */
function makeLocal(
  year: number,
  month: number,
  date: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number
): Date {
  return new Date(year, month, date, hours, minutes, seconds, ms);
}

/** Số ngày trong tháng (local time) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Tính ngày/giờ lần kế tiếp sau `prevDue` theo `rule`.
 * Trả về null nếu rule = "none" (không lặp).
 * Tính theo local time thiết bị.
 */
export function nextDueAt(
  prevDue: string | Date,
  rule: RecurrenceRule
): string | null {
  const prev = typeof prevDue === 'string' ? new Date(prevDue) : prevDue;
  const p = localParts(prev);

  switch (rule.kind) {
    case 'none':
      return null;

    case 'daily':
      return makeLocal(
        p.year, p.month, p.date + 1,
        p.hours, p.minutes, p.seconds, p.ms
      ).toISOString();

    case 'weekly':
      return makeLocal(
        p.year, p.month, p.date + 7,
        p.hours, p.minutes, p.seconds, p.ms
      ).toISOString();

    case 'monthly': {
      const targetDay = Math.min(rule.rule.day, daysInMonth(p.year, p.month + 1));
      const next = makeLocal(
        p.year, p.month + 1, targetDay,
        p.hours, p.minutes, p.seconds, p.ms
      );
      // Nếu sang năm mới (month + 1 = 12), Date tự xử lý año++
      return next.toISOString();
    }
  }
}

/**
 * Catch-up: lặp nextDueAt cho tới khi kết quả > now.
 * Trả về lần tới để tạo alarm. Nếu vượt MAX_ITERATIONS → ném lỗi rõ.
 * Tính theo local time thiết bị.
 */
export function nextFutureDue(
  prevDue: string | Date,
  rule: RecurrenceRule,
  now: Date = new Date()
): string | null {
  if (rule.kind === 'none') return null;

  let current = typeof prevDue === 'string' ? new Date(prevDue) : prevDue;
  let iterations = 0;

  while (true) {
    const next = nextDueAt(current, rule);
    if (next === null) return null;

    const nextDate = new Date(next);
    iterations++;

    if (nextDate > now) {
      return next;
    }

    if (iterations >= MAX_ITERATIONS) {
      throw new Error(
        `Recurrence catch-up exceeded ${MAX_ITERATIONS} iterations (possible invalid rule)`
      );
    }

    current = nextDate;
  }
}

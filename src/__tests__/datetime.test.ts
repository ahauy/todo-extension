/**
 * Test helper biểu diễn thời gian (Gói 0/G6): `dueAt` là wall-clock local
 * `YYYY-MM-DDTHH:mm` không `Z`; `normalizeDueAt` idempotent và không nuốt
 * chuỗi lạ. Test không phụ thuộc timezone máy chạy (không hardcode giờ local
 * cho chuỗi `Z`, chỉ so instant).
 */
import { describe, expect, it } from 'vitest';
import {
  formatLocalInput,
  normalizeDueAt,
  toLocalInput,
} from '../../lib/datetime';

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

describe('formatLocalInput', () => {
  it('dựng YYYY-MM-DDTHH:mm từ thành phần local (bỏ giây)', () => {
    expect(formatLocalInput(new Date(2035, 0, 15, 9, 5, 42, 123))).toBe(
      '2035-01-15T09:05'
    );
  });
});

describe('normalizeDueAt', () => {
  it('giá trị đã local trả nguyên văn (idempotent)', () => {
    expect(normalizeDueAt('2035-01-15T09:00')).toBe('2035-01-15T09:00');
  });

  it('chuỗi UTC có Z quy về cùng instant dạng local không Z', () => {
    const instant = '2035-01-15T09:00:00.000Z';
    const local = normalizeDueAt(instant);

    expect(local).toMatch(LOCAL_DATETIME);
    expect(local).not.toContain('Z');
    // Cùng thời điểm thật, chỉ khác biểu diễn → đúng bất kể TZ máy chạy.
    expect(new Date(local!).getTime()).toBe(new Date(instant).getTime());
    expect(local).toBe(toLocalInput(instant));
  });

  it('idempotent: normalize 2 lần cho cùng kết quả', () => {
    const once = normalizeDueAt('2035-01-15T09:00:00.000Z');
    expect(normalizeDueAt(once)).toBe(once);
  });

  it('chuỗi không parse được trả nguyên văn (không nuốt dữ liệu)', () => {
    expect(normalizeDueAt('không-phải-ngày')).toBe('không-phải-ngày');
    expect(normalizeDueAt('')).toBe('');
    expect(normalizeDueAt(null)).toBeNull();
  });
});

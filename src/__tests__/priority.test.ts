/**
 * R-05 — ánh xạ priority cũ khi hydrate (read-only): high→Q1, medium→Q2,
 * low→Q4, giá trị lạ/không nhận diện được→Q2. Giá trị 4 mức mới đi qua nguyên
 * văn (idempotent). Không có write/migration ở đây.
 */
import { describe, expect, it } from 'vitest';
import { normalizePriority } from '../../lib/tasks/priority';

describe('normalizePriority — legacy → Eisenhower (R-05)', () => {
  it('high → important-urgent (Q1)', () => {
    expect(normalizePriority('high')).toBe('important-urgent');
  });

  it('medium → important-not-urgent (Q2)', () => {
    expect(normalizePriority('medium')).toBe('important-not-urgent');
  });

  it('low → not-important-not-urgent (Q4)', () => {
    expect(normalizePriority('low')).toBe('not-important-not-urgent');
  });

  it('giá trị lạ / sai kiểu / thiếu → important-not-urgent (Q2)', () => {
    expect(normalizePriority('urgent')).toBe('important-not-urgent');
    expect(normalizePriority('')).toBe('important-not-urgent');
    expect(normalizePriority(undefined)).toBe('important-not-urgent');
    expect(normalizePriority(null)).toBe('important-not-urgent');
    expect(normalizePriority(42)).toBe('important-not-urgent');
  });

  it('4 giá trị mới đi qua nguyên văn, kể cả Q3 (chỉ user chọn)', () => {
    for (const value of [
      'important-urgent',
      'important-not-urgent',
      'not-important-urgent',
      'not-important-not-urgent',
    ]) {
      expect(normalizePriority(value)).toBe(value);
    }
  });
});

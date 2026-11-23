/**
 * R-05 — Chuẩn hoá `priority` khi ĐỌC dữ liệu đã lưu (hydrate).
 *
 * Storage có thể chứa giá trị 3 mức cũ (`high|medium|low`) từ trước khi đổi miền.
 * Helper này trả về giá trị 4 mức tương ứng TRONG BỘ NHỚ; KHÔNG ghi lại storage,
 * không backfill, không xoá/ghi đè dữ liệu cũ (lần lưu tiếp theo của chính task
 * đó mới ghi bản canonical). Q3 không có tương đương cũ, chỉ user chọn mới.
 */
import type { Priority } from './types';

const CURRENT_PRIORITIES: readonly string[] = [
  'important-urgent',
  'important-not-urgent',
  'not-important-urgent',
  'not-important-not-urgent',
];

/** Mặc định khi tạo mới (R-01/R-05) và khi gặp giá trị lạ (R-05): Q2. */
export const DEFAULT_PRIORITY: Priority = 'important-not-urgent';

export function normalizePriority(raw: unknown): Priority {
  if (raw === 'high') return 'important-urgent';
  if (raw === 'medium') return 'important-not-urgent';
  if (raw === 'low') return 'not-important-not-urgent';
  if (typeof raw === 'string' && CURRENT_PRIORITIES.includes(raw)) {
    return raw as Priority;
  }
  return DEFAULT_PRIORITY;
}

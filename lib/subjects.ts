/**
 * Môn học và màu gáy sách. DESIGN.md chốt: tối đa 5 môn có màu riêng lấy từ
 * bảng màu chính, môn thứ 6 trở đi dùng nâu bạc. Không thêm màu ngoài bảng.
 */
import type { Subject } from './tasks/types';

export const SPINE_COLORS = [
  'var(--primary)',
  'var(--indigo)',
  'var(--jade)',
  'var(--gold)',
  'var(--umber)',
] as const;

const SPINE_WASHES = [
  'var(--primary-wash)',
  'var(--indigo-wash)',
  'var(--jade-wash)',
  'var(--gold-pale)',
  'var(--surface-paper)',
] as const;

export const REST_COLOR = 'var(--sepia)';
export const REST_WASH = 'var(--surface-sunk)';

/** Màu viền trái 8px của gáy sách theo thứ tự môn */
export function spineColor(order: number): string {
  return SPINE_COLORS[order] ?? REST_COLOR;
}

/** Nền nhạt của nhãn môn trên cuộn thư */
export function spineWash(order: number): string {
  return SPINE_WASHES[order] ?? REST_WASH;
}

export function findSubject(
  subjects: Subject[],
  id: string | null | undefined
): Subject | null {
  if (!id) return null;
  return subjects.find((subject) => subject.id === id) ?? null;
}

/** Sắp xếp theo thứ tự nhận màu, ổn định khi hai môn cùng order */
export function sortedSubjects(subjects: Subject[]): Subject[] {
  return [...subjects].sort(
    (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)
  );
}

export const MAX_SUBJECTS = 12;
export const MAX_SUBJECT_NAME = 28;
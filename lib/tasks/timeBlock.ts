/**
 * R-24/R-25 — Giờ bắt đầu/kết thúc + độ dài block (time blocking). Module THUẦN:
 * không storage/chrome/React, không mutate `Task`; mọi hàm chỉ đọc và trả giá trị mới.
 *
 * Tách khỏi `query.ts`: sort dùng chung R-15 giữ nguyên, timeline do đây sắp.
 * `startAt`/`endAt` là wall-clock local `"HH:mm"` như `dueAt` (R-09) — KHÔNG phải instant UTC.
 */

import type { Task } from './types';

/** Khung timeline New Tab, tính bằng phút từ 00:00 (R-25: 00:00 → 24:00). */
export const TIMELINE_START_MIN = 0;
export const TIMELINE_END_MIN = 24 * 60;
export const DEFAULT_ESTIMATE_MIN = 30;
export const MIN_ESTIMATE_MIN = 15;
export const MAX_ESTIMATE_MIN = 240;
/** Bước kéo/nhập giờ trên timeline. */
export const SNAP_STEP_MIN = 15;
/** Bước cuối còn hợp lệ làm `startAt`: 23:45 — 24:00 là mốc KẾT THÚC khung, không phải giờ bắt đầu. */
const MAX_START_MIN = TIMELINE_END_MIN - SNAP_STEP_MIN;

const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** R-24/R-25 — thay đổi thời khoá biểu được phép ghi (`null` = xoá field). */
export interface TaskTimePatch {
  startAt?: string | null;
  estimateMin?: number | null;
  /** R-25 — giờ kết thúc; `null` = xoá field, quay lại `estimateMin` đã lưu. */
  endAt?: string | null;
}

/** Một việc trên timeline: giờ đã parse + nhóm (trong khung / nhóm cuối). */
export interface TimelineEntry {
  task: Task;
  /** Phút từ 00:00 của `startAt`; `null` khi việc không có giờ hợp lệ. */
  startMinutes: number | null;
  /** R-25: luôn `false` — canvas phủ 00:00–24:00 nên không còn giờ "ngoài khung". */
  outsideWindow: boolean;
  /** Độ dài block đã chuẩn hoá (chỉ có khi `startMinutes` khác `null`). */
  estimateMin?: number;
}

/** Báo cáo chồng lấn — CHỈ cảnh báo, không sửa dữ liệu người dùng. */
export interface OverlapReport {
  /** Id các block chồng lấn với ít nhất một block khác (sort ổn định). */
  ids: string[];
  /** Cặp id chồng lấn: mỗi cặp sort theo id, cả danh sách sort theo cặp. */
  pairs: Array<[string, string]>;
}

function compareIds(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** `"HH:mm"` 24h hợp lệ (00:00–23:59). */
export function isValidStartAt(value: unknown): value is string {
  return typeof value === 'string' && HHMM_PATTERN.test(value);
}

/** `"HH:mm"` → số phút từ 00:00; `null` nếu không hợp lệ. */
export function parseStartAtMinutes(value: unknown): number | null {
  if (!isValidStartAt(value)) return null;
  const [hours, minutes] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

/** Số phút → nhãn `"HH:mm"` trong khung 00:00–24:00 (dùng cho nhãn hiển thị). */
export function formatStartAtMinutes(minutes: number): string {
  const safe = Number.isFinite(minutes) ? Math.round(minutes) : TIMELINE_START_MIN;
  const clamped = Math.min(Math.max(safe, 0), TIMELINE_END_MIN);
  const hours = Math.floor(clamped / 60);
  const rest = clamped % 60;
  return `${`${hours}`.padStart(2, '0')}:${`${rest}`.padStart(2, '0')}`;
}

/** `estimateMin` hợp lệ: số nguyên 15–240. */
export function isValidEstimateMin(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_ESTIMATE_MIN &&
    value <= MAX_ESTIMATE_MIN
  );
}

/** `"HH:mm"` hợp lệ cho GIỜ KẾT THÚC — dùng chung validator 00:00–23:59 (R-25). */
export function isValidEndAt(value: unknown): value is string {
  return isValidStartAt(value);
}

/**
 * R-25 — độ dài block (phút), thuần đọc, KHÔNG mutate:
 * - có `startAt` + `endAt` hợp lệ → `end − start`; `end <= start` (kể cả bằng nhau)
 *   là khoảng QUA NỬA ĐÊM → cộng 1440′;
 * - không có `endAt` dùng `estimateMin` đã lưu (legacy), trống → 30;
 * - không có `startAt` hợp lệ → `undefined` (nhóm "không giờ").
 */
export function durationMinutes(
  startAt: unknown,
  endAt: unknown,
  legacyEstimateMin?: unknown
): number | undefined {
  if (!isValidStartAt(startAt)) return undefined;
  if (isValidEndAt(endAt)) {
    const diff = parseStartAtMinutes(endAt)! - parseStartAtMinutes(startAt)!;
    return diff > 0 ? diff : diff + TIMELINE_END_MIN;
  }
  if (legacyEstimateMin === null || legacyEstimateMin === undefined) return DEFAULT_ESTIMATE_MIN;
  if (
    typeof legacyEstimateMin !== 'number' ||
    !Number.isFinite(legacyEstimateMin) ||
    legacyEstimateMin < 1
  ) {
    return DEFAULT_ESTIMATE_MIN;
  }
  return legacyEstimateMin;
}

/**
 * Độ dài block để vẽ/tính chồng lấn. `endAt` (R-25) là nguồn thật; khi có
 * `endAt` thì `estimateMin` truyền vào bị bỏ qua. Các trường hợp legacy giữ nguyên:
 * - có `startAt`, `estimateMin` trống → 30 (`DEFAULT_ESTIMATE_MIN`);
 * - có giá trị đã lưu → trả NGUYÊN, kể cả ngoài 15–240 (R-24: hiển thị như đã lưu,
 *   form báo lỗi, KHÔNG tự ghi đè);
 * - giá trị không dùng được (< 1 phút, NaN) → 30 để không phá layout.
 */
export function normalizeEstimateMin(
  startAt: unknown,
  estimateMin: unknown,
  endAt?: unknown
): number | undefined {
  if (!isValidStartAt(startAt)) return undefined;
  if (isValidEndAt(endAt)) return durationMinutes(startAt, endAt);
  if (estimateMin === null || estimateMin === undefined) return DEFAULT_ESTIMATE_MIN;
  if (
    typeof estimateMin !== 'number' ||
    !Number.isFinite(estimateMin) ||
    estimateMin < 1
  ) {
    return DEFAULT_ESTIMATE_MIN;
  }
  return estimateMin;
}

function isInWindow(minutes: number): boolean {
  return minutes >= TIMELINE_START_MIN && minutes < TIMELINE_END_MIN;
}

/**
 * Sắp việc cho timeline 00:00–24:00 (KHÔNG thay `sortTasks`/`sortBoard` R-15):
 * - có giờ hợp lệ: giờ tăng dần, hoà giờ → tie-breaker `id` (như R-15) để ổn định;
 * - nhóm cuối: **chỉ** việc không có giờ hợp lệ (R-25 không còn giờ "ngoài khung");
 * - không làm mất việc: mỗi task vào đúng 1 entry, không mutate đầu vào.
 */
export function timelineOrder(tasks: Task[]): TimelineEntry[] {
  const entries = tasks.map((task) => {
    const startMinutes = parseStartAtMinutes(task.startAt);
    return {
      task,
      startMinutes,
      outsideWindow: startMinutes !== null && !isInWindow(startMinutes),
      estimateMin: normalizeEstimateMin(task.startAt, task.estimateMin, task.endAt),
    };
  });

  const head = entries.filter((entry) => entry.startMinutes !== null && !entry.outsideWindow);
  const tail = entries.filter((entry) => entry.startMinutes === null || entry.outsideWindow);

  head.sort((a, b) => {
    const diff = (a.startMinutes ?? 0) - (b.startMinutes ?? 0);
    return diff !== 0 ? diff : compareIds(a.task.id, b.task.id);
  });
  // Việc không giờ dùng +∞ để luôn nằm cuối danh sách (R-25: nhóm cuối chỉ còn việc này).
  tail.sort((a, b) => {
    const aMin = a.startMinutes ?? Number.POSITIVE_INFINITY;
    const bMin = b.startMinutes ?? Number.POSITIVE_INFINITY;
    return aMin !== bMin ? aMin - bMin : compareIds(a.task.id, b.task.id);
  });

  return [...head, ...tail];
}

interface WindowBlock {
  id: string;
  /** Phút bắt đầu đã cắt vào khung 00:00–24:00. */
  start: number;
  /** Phút kết thúc đã cắt vào khung (không cắt `estimateMin` của người dùng). */
  end: number;
}

/** Block trong khung timeline; `null` khi không có giờ hoặc phần giao rỗng. */
function windowBlock(task: Task): WindowBlock | null {
  const startMinutes = parseStartAtMinutes(task.startAt);
  if (startMinutes === null) return null;
  const minutes = durationMinutes(task.startAt, task.endAt, task.estimateMin);
  const start = Math.max(startMinutes, TIMELINE_START_MIN);
  const end = Math.min(startMinutes + (minutes ?? DEFAULT_ESTIMATE_MIN), TIMELINE_END_MIN);
  return end > start ? { id: task.id, start, end } : null;
}

/**
 * R-24/R-25 — cặp block chồng lấn theo nửa khoảng `[start, start + duration)`,
 * chỉ tính phần giao trong khung 00:00–24:00. Chạm biên (07:00–07:30 với
 * 07:30–08:00) KHÔNG tính là chồng. Thuần đọc: không mutate, gọi lại cho cùng kết quả.
 */
export function detectOverlaps(tasks: Task[]): OverlapReport {
  const blocks = tasks
    .map(windowBlock)
    .filter((block): block is WindowBlock => block !== null)
    .sort(
      (a, b) => a.start - b.start || a.end - b.end || compareIds(a.id, b.id)
    );

  const ids = new Set<string>();
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      // Đã sort theo start nên block sau không thể chồng với block i nữa.
      if (blocks[j].start >= blocks[i].end) break;
      ids.add(blocks[i].id);
      ids.add(blocks[j].id);
      pairs.push(
        compareIds(blocks[i].id, blocks[j].id) < 0
          ? [blocks[i].id, blocks[j].id]
          : [blocks[j].id, blocks[i].id]
      );
    }
  }

  pairs.sort((a, b) => compareIds(a[0], b[0]) || compareIds(a[1], b[1]));
  return { ids: [...ids].sort(compareIds), pairs };
}

/**
 * Snap vị trí thả/nhập về bước 15′ rồi clamp khung **00:00–23:45** (R-25).
 * Mốc cuối là 23:45 vì `startAt` phải là giờ hợp lệ 00:00–23:59
 * (24:00 chỉ là mốc kết thúc khung). Kết quả luôn qua `isValidStartAt`.
 */
export function snapStartAt(minutes: number): string {
  const safe = Number.isFinite(minutes) ? minutes : TIMELINE_START_MIN;
  const snapped = Math.round(safe / SNAP_STEP_MIN) * SNAP_STEP_MIN;
  return formatStartAtMinutes(Math.min(Math.max(snapped, TIMELINE_START_MIN), MAX_START_MIN));
}

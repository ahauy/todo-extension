/**
 * Query domain (L2-T07).
 * Pure functions tính danh sách task đã xử lý (filter / search / sort).
 * Không side effect, dùng `useMemo` ở component (L4-T13).
 *
 * Sort precedence (deterministic, R-15):
 *   overdue (dueAt < now) đầu tiên → dueAt gần nhất → priority high→low
 *   → createdAt mới nhất → tie-breaker cố định (id).
 * Task không có dueAt xếp cuối. Tab "Đã xong" luôn sort updatedAt desc.
 */

import type { DayPlan, Task } from './types';
import { startOfWeekLocal } from '../datetime';

export type SortCriterion = 'default';

/** R-21 — `archived` bị loại ở MỌI cổng vào; dữ liệu vẫn nằm trong storage
 *  để mục "Đã cắt" phục hồi. Không đụng sort/tie-breaker R-15. */
function notArchived(task: Task): boolean {
  return !task.archived;
}

/** Nguồn "đã xong" dùng cho summary: `lastDoneAt` ưu tiên (task lặp done-today
 *  có `done=false` nhưng đã đóng dấu), rồi `updatedAt` khi `done=true`.
 *  Không đọc `studyLog`/`board.doneToday` (aggregate đã lưu). */
function doneAt(task: Task): string | null {
  return task.lastDoneAt ?? (task.done ? task.updatedAt : null);
}

/** Tìm kiếm theo title/note/tag, case-insensitive */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  const visible = tasks.filter(notArchived);
  if (!q) return [...visible];
  return visible.filter((t) => {
    const haystack = `${t.title} ${t.note} ${t.tags.join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
}

/** Kiểm tra task có overdue không (dueAt < now, local time) */
function isOverdue(task: Task, now: Date): boolean {
  if (!task.dueAt || task.done) return false;
  return new Date(task.dueAt) < now;
}

/** Số tiền độ ưu tiên (high=2, medium=1, low=0) */
function priorityRank(p: Task['priority']): number {
  switch (p) {
    case 'high':
      return 2;
    case 'medium':
      return 1;
    case 'low':
      return 0;
  }
}

/**
 * Sắp xếp theo overdue → dueAt → priority → createdAt, tie-breaker id.
 * Task không dueAt xếp cuối.
 */
export function sortTasks(
  tasks: Task[],
  now: Date = new Date()
): Task[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a, now) ? 0 : 1;
    const bOverdue = isOverdue(b, now) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    // Nếu cả hai overdue hoặc đều không overdue: so sánh dueAt
    const aHasDue = !!a.dueAt;
    const bHasDue = !!b.dueAt;
    if (aHasDue && !bHasDue) return -1;
    if (!aHasDue && bHasDue) return 1;

    if (aHasDue && bHasDue && a.dueAt && b.dueAt) {
      const ad = new Date(a.dueAt).getTime();
      const bd = new Date(b.dueAt).getTime();
      if (ad !== bd) return ad - bd;
    }

    // Priority: high → low
    const pa = priorityRank(a.priority);
    const pb = priorityRank(b.priority);
    if (pa !== pb) return pb - pa;

    // CreatedAt: mới nhất trước
    const ca = new Date(a.createdAt).getTime();
    const cb = new Date(b.createdAt).getTime();
    if (ca !== cb) return cb - ca;

    // Tie-breaker cố định (id) để kết quả ổn định
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

/* ── Bảng Học Đường: Tất cả · Hôm nay · Sắp tới · Đã xong ─────────────── */

export type BoardTab = 'all' | 'today' | 'upcoming' | 'done';
export type SortKey = 'deadline' | 'priority' | 'created';

function sameLocalDay(iso: string, now: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Việc lặp đã đóng dấu HÔM NAY (lastDoneAt cùng ngày local) nhưng chưa sang
 *  occurrence kế tiếp → trạng thái "done-today", phân biệt với open và done. */
export function isRecurringDoneToday(task: Task, now: Date): boolean {
  return (
    task.recurrence.kind !== 'none' &&
    !task.done &&
    !!task.lastDoneAt &&
    sameLocalDay(task.lastDoneAt, now)
  );
}

/** "Hôm nay" gồm cả việc quá hạn chưa xong — chúng vẫn đang chờ hôm nay */
export function filterByBoard(tasks: Task[], tab: BoardTab, now: Date): Task[] {
  const visible = tasks.filter(notArchived);
  switch (tab) {
    case 'today':
      return visible.filter(
        (task) =>
          !task.done &&
          !!task.dueAt &&
          (sameLocalDay(task.dueAt, now) || new Date(task.dueAt) < now)
      );
    case 'upcoming':
      return visible.filter(
        (task) => !task.done && !!task.dueAt && new Date(task.dueAt) > now && !sameLocalDay(task.dueAt, now)
      );
    case 'done':
      return visible.filter((task) => task.done);
    case 'all':
      return [...visible];
  }
}

/** Lọc theo gáy sách. 'all' = mọi môn, 'none' = việc chưa xếp môn */
export function filterBySubject(tasks: Task[], subjectId: string): Task[] {
  const visible = tasks.filter(notArchived);
  if (subjectId === 'all') return [...visible];
  if (subjectId === 'none') return visible.filter((task) => !task.subjectId);
  return visible.filter((task) => task.subjectId === subjectId);
}

/** R-21 — chip "20%": thuần `keystone && !archived` (không đổi SortKey). */
export function filterByKeystone(tasks: Task[]): Task[] {
  return tasks.filter((task) => !!task.keystone && !task.archived);
}

/** Tie-breaker cố định theo `id` (chuỗi) — kết quả sort không phụ thuộc thứ tự key storage */
function compareById(a: Task, b: Task): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function sortBoard(tasks: Task[], key: SortKey, now: Date): Task[] {
  if (key === 'created') {
    return [...tasks].sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return diff !== 0 ? diff : compareById(a, b);
    });
  }
  if (key === 'priority') {
    return [...tasks].sort((a, b) => {
      const diff = priorityRank(b.priority) - priorityRank(a.priority);
      if (diff !== 0) return diff;
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      const created =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return created !== 0 ? created : compareById(a, b);
    });
  }
  return sortTasks(tasks, now);
}

/** Việc chưa xong đang chờ hôm nay — dùng cho chiếu chỉ và lời chào */
export function dueTodayCount(tasks: Task[], now: Date): number {
  return filterByBoard(tasks, 'today', now).length;
}

export function overdueCount(tasks: Task[], now: Date): number {
  return tasks.filter(notArchived).filter((task) => isOverdue(task, now)).length;
}

/** R-21 — việc đang chờ (chưa xong, chưa cắt) — bộ đếm dùng chung. */
export function activeCount(tasks: Task[]): number {
  return tasks.filter((task) => !task.archived && !task.done).length;
}

/** R-21 — dòng "Then chốt: x/y xong" cho hôm nay (local).
 *  `total` = then chốt đang mở hoặc vừa xong hôm nay; `done` = xong hôm nay. */
export function todayKeystoneSummary(
  tasks: Task[],
  now: Date
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const task of filterByKeystone(tasks)) {
    const stamp = doneAt(task);
    const finishedToday = !!stamp && sameLocalDay(stamp, now);
    if (finishedToday || !task.done) total += 1;
    if (finishedToday) done += 1;
  }
  return { done, total };
}

/**
 * R-21 — review tuần: Thứ 2 local 00:00 → hiện tại (không UTC).
 * `keystoneDone` = then chốt xong trong cửa sổ; `keystoneTotal` = then chốt
 * đang mở hoặc xong trong cửa sổ; `tasksDone` = mọi việc xong trong cửa sổ.
 * `dayPlan` là một phần của contract (chỗ ở con ếch, Gói B mở rộng sau);
 * các con số được suy thuần từ task, KHÔNG đọc studyLog aggregate.
 */
export function weeklySummary(
  tasks: Task[],
  dayPlan: DayPlan,
  now: Date
): { keystoneDone: number; keystoneTotal: number; tasksDone: number } {
  const weekStart = startOfWeekLocal(now).getTime();
  const nowMs = now.getTime();
  const inWindow = (stamp: string | null): boolean => {
    if (!stamp) return false;
    const t = new Date(stamp).getTime();
    return !Number.isNaN(t) && t >= weekStart && t <= nowMs;
  };

  let keystoneDone = 0;
  let keystoneTotal = 0;
  let tasksDone = 0;
  for (const task of tasks.filter(notArchived)) {
    const finished = inWindow(doneAt(task));
    if (finished) tasksDone += 1;
    if (task.keystone) {
      if (finished) keystoneDone += 1;
      if (finished || !task.done) keystoneTotal += 1;
    }
  }
  return { keystoneDone, keystoneTotal, tasksDone };
}

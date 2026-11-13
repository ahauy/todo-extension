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

import type { Task } from './types';

export type SortCriterion = 'default';

/** Tìm kiếm theo title/note/tag, case-insensitive */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...tasks];
  return tasks.filter((t) => {
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
  switch (tab) {
    case 'today':
      return tasks.filter(
        (task) =>
          !task.done &&
          !!task.dueAt &&
          (sameLocalDay(task.dueAt, now) || new Date(task.dueAt) < now)
      );
    case 'upcoming':
      return tasks.filter(
        (task) => !task.done && !!task.dueAt && new Date(task.dueAt) > now && !sameLocalDay(task.dueAt, now)
      );
    case 'done':
      return tasks.filter((task) => task.done);
    case 'all':
      return [...tasks];
  }
}

/** Lọc theo gáy sách. 'all' = mọi môn, 'none' = việc chưa xếp môn */
export function filterBySubject(tasks: Task[], subjectId: string): Task[] {
  if (subjectId === 'all') return [...tasks];
  if (subjectId === 'none') return tasks.filter((task) => !task.subjectId);
  return tasks.filter((task) => task.subjectId === subjectId);
}

export function sortBoard(tasks: Task[], key: SortKey, now: Date): Task[] {
  if (key === 'created') {
    return [...tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  if (key === 'priority') {
    return [...tasks].sort((a, b) => {
      const diff = priorityRank(b.priority) - priorityRank(a.priority);
      if (diff !== 0) return diff;
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return sortTasks(tasks, now);
}

/** Việc chưa xong đang chờ hôm nay — dùng cho chiếu chỉ và lời chào */
export function dueTodayCount(tasks: Task[], now: Date): number {
  return filterByBoard(tasks, 'today', now).length;
}

export function overdueCount(tasks: Task[], now: Date): number {
  return tasks.filter((task) => isOverdue(task, now)).length;
}

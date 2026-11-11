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

export type Tab = 'all' | 'active' | 'done';

export type SortCriterion = 'default';

/** Lọc theo tab */
export function filterTasks(tasks: Task[], tab: Tab): Task[] {
  switch (tab) {
    case 'all':
      return [...tasks];
    case 'active':
      return tasks.filter((t) => !t.done);
    case 'done':
      return tasks.filter((t) => t.done);
  }
}

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

/** Sắp xếp tab "Đã xong": updatedAt desc */
export function sortDoneTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const ta = new Date(a.updatedAt).getTime();
    const tb = new Date(b.updatedAt).getTime();
    return tb - ta;
  });
}

import type { Priority, Settings, Task } from './tasks/types';

/**
 * Có nên hiện notification cho task không (R-12).
 * Background PHẢI gate qua đây trước chrome.notifications.create.
 */
export function shouldNotify(task: Task, settings: Settings | null): boolean {
  if (task.done) return false;
  if (!task.dueAt) return false;
  return settings?.notificationsEnabled !== false;
}

/** R-05/R-12 — chỉ Q1 (`important-urgent`) được Chrome ưu tiên hoá thông báo. */
export function notificationPriority(priority: Priority): 0 | 2 {
  return priority === 'important-urgent' ? 2 : 0;
}

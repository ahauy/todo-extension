import type { Settings, Task } from './tasks/types';

/**
 * Có nên hiện notification cho task không (R-12).
 * Background PHẢI gate qua đây trước chrome.notifications.create.
 */
export function shouldNotify(task: Task, settings: Settings | null): boolean {
  if (task.done) return false;
  if (!task.dueAt) return false;
  return settings?.notificationsEnabled !== false;
}

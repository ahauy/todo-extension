/**
 * Alarm scheduler lib (L3-T08).
 * Quản lý alarm nhắc việc cho toàn bộ task qua chrome.alarms.
 * Alarm bền hơn setTimeout trong service worker (SW bị kill).
 *
 * Mock chrome.alarms trong Vitest (không gọi extension API thật).
 */

import { PLAN_ALARM_NAME, type Settings, type Task } from '../tasks/types';

const ALARM_PREFIX = 'due:';

/** Tên alarm cho task id */
export function alarmName(id: string): string {
  return `${ALARM_PREFIX}${id}`;
}

/** Trích xuất task id từ tên alarm */
export function taskIdFromAlarm(name: string): string | null {
  if (!name.startsWith(ALARM_PREFIX)) return null;
  return name.slice(ALARM_PREFIX.length);
}

/** Kiểm tra task có nên tạo alarm không (dueAt > now && !done && !archived).
 *  R-21: việc bị cắt bỏ (archived) vẫn nằm trong storage nhưng KHÔNG được nhắc. */
function shouldCreateAlarm(task: Task, now: Date): boolean {
  if (task.done) return false;
  if (task.archived) return false;
  if (!task.dueAt) return false;
  return new Date(task.dueAt) > now;
}

/** Đồng bộ toàn bộ alarm từ danh sách task */
export function syncAlarms(tasks: Task[], now: Date = new Date()): void {
  const activeIds = new Set<string>();

  for (const task of tasks) {
    if (!shouldCreateAlarm(task, now)) {
      // Task done, archived, không có dueAt, hoặc quá hạn (dueAt <= now) → xoá alarm
      chrome.alarms.clear(alarmName(task.id));
      continue;
    }

    const dueDate = new Date(task.dueAt!);
    const delayInMinutes = Math.max(0, (dueDate.getTime() - now.getTime()) / 60000);

    chrome.alarms.create(alarmName(task.id), { delayInMinutes });
    activeIds.add(task.id);
  }

  // Xoá alarm của task không còn trong danh sách (đã xoá task)
  chrome.alarms.getAll((alarms) => {
    for (const alarm of alarms) {
      const id = taskIdFromAlarm(alarm.name);
      if (id && !activeIds.has(id)) {
        chrome.alarms.clear(alarm.name);
      }
    }
  });
}

/** Tạo/cập nhật alarm cho 1 task */
export function scheduleTask(task: Task, now: Date = new Date()): void {
  if (!shouldCreateAlarm(task, now)) {
    chrome.alarms.clear(alarmName(task.id));
    return;
  }
  const dueDate = new Date(task.dueAt!);
  const delayInMinutes = Math.max(0, (dueDate.getTime() - now.getTime()) / 60000);
  chrome.alarms.create(alarmName(task.id), { delayInMinutes });
}

/** Xoá alarm của task */
export function clearTaskAlarm(id: string): void {
  chrome.alarms.clear(alarmName(id));
}

/* ── R-22 — nhắc lập kế hoạch ngày mai (1 alarm/ngày) ─────────────────── */

/** Lần kế tiếp của giờ local `HH:mm`; nếu hôm nay đã qua thì sang ngày mai. */
export function nextPlanReminderAt(at: string, now: Date = new Date()): Date {
  const [hours, minutes] = at.split(':').map(Number);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

/** Giữ đúng 1 plan alarm. Tắt → clear; đổi giờ → clear rồi create, không nhân đôi. */
export function syncPlanReminder(reminder: Settings['planReminder'], now: Date = new Date()): void {
  chrome.alarms.clear(PLAN_ALARM_NAME);
  if (!reminder.enabled) return;
  // Không dùng periodInMinutes cố định: 1440 phút bị trôi sau DST. Alarm chỉ
  // chạy 1 lần/ngày; background resync sau mỗi lần fire để ép lại giờ local.
  chrome.alarms.create(PLAN_ALARM_NAME, {
    when: nextPlanReminderAt(reminder.at, now).getTime(),
  });
}

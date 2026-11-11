/**
 * Background service worker (L3-T09, thay stub L1-T01).
 * Service worker MV3: alarm → notification, resync, storage.onChanged.
 * Không content script, không host_permissions, không network request (R-17).
 *
 * WXT yêu cầu entrypoint background có default export là `defineBackground(...)`.
 * Hàm wrapper local này sẽ được WXT nhận diện và gọi khi SW load.
 */

import { syncAlarms, scheduleTask, clearTaskAlarm, alarmName } from '../lib/alarms/scheduler';
import { loadAll, loadSettings } from '../lib/storage/adapter';
import { recallBoardTab } from '../lib/storage/local';
import { shouldNotify } from '../lib/notifications';
import { DEFAULT_SETTINGS, type DisplayMode, type Task } from '../lib/tasks/types';

const MAX_NOTE_PREVIEW = 60;

/** Lấy tên task cho notification */
function taskTitle(task: Task): string {
  return task.title || '(không tên)';
}

/** Rút gọn note cho notification body */
function notePreview(task: Task): string {
  if (!task.note) return '';
  return task.note.length > MAX_NOTE_PREVIEW
    ? task.note.slice(0, MAX_NOTE_PREVIEW) + '…'
    : task.note;
}

/** Hiện notification cho task */
function notifyTask(task: Task): void {
  chrome.notifications.create(alarmName(task.id), {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon/48.png'),
    title: taskTitle(task),
    message: notePreview(task) || `Đến hạn rồi con ơi: ${task.dueAt || 'không có hạn'}`,
    priority: task.priority === 'high' ? 2 : 0,
  });
}

/** Đồng bộ toàn bộ alarm từ storage */
async function resyncAlarmsFromStorage(): Promise<void> {
  try {
    const tasks = await loadAll();
    const now = new Date();
    syncAlarms(tasks, now);
  } catch (err) {
    console.error('[todo-extension] resync alarms failed:', err);
  }
}

/** Chế độ hiển thị quyết định nút biểu tượng mở gì.
 *  Popup / Tự động → mở popup. New Tab → gỡ popup để onClicked chạy. */
async function applyDisplayMode(mode: DisplayMode): Promise<void> {
  try {
    await chrome.action.setPopup({ popup: mode === 'newtab' ? '' : 'popup.html' });
  } catch (err) {
    console.error('[học đường] không đổi được chế độ nút biểu tượng:', err);
  }
}

async function currentDisplayMode(): Promise<DisplayMode> {
  const settings = await loadSettings();
  return (settings ?? DEFAULT_SETTINGS).displayMode;
}

/** Mở hoặc quay lại bảng lớn. Id tab nhớ trong storage.session nên không
 *  cần quyền `tabs` để truy vấn theo URL. */
async function openBoard(): Promise<void> {
  const remembered = await recallBoardTab();
  if (remembered !== null) {
    try {
      await chrome.tabs.update(remembered, { active: true });
      return;
    } catch {
      // Tab đã đóng → mở cái mới
    }
  }
  await chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
}

import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  /** Nút biểu tượng khi đang ở chế độ New Tab */
  chrome.action.onClicked.addListener(() => {
    void openBoard();
  });

  /** onAlarm → hiện notification (tôn trọng settings.notificationsEnabled) */
  chrome.alarms.onAlarm.addListener((alarm) => {
    void (async () => {
      try {
        const id = alarm.name.slice('due:'.length);
        const tasks = await loadAll();
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        const settings = await loadSettings();
        if (shouldNotify(task, settings)) notifyTask(task);
      } catch (err) {
        console.error('[todo-extension] onAlarm failed:', err);
      }
    })();
  });

  /** onInstalled / onStartup → resync toàn bộ alarm + áp chế độ hiển thị */
  chrome.runtime.onInstalled.addListener(() => {
    void resyncAlarmsFromStorage();
    void currentDisplayMode().then(applyDisplayMode);
  });

  chrome.runtime.onStartup.addListener(() => {
    void resyncAlarmsFromStorage();
    void currentDisplayMode().then(applyDisplayMode);
  });

  /** storage.onChanged → reschedule alarm khi task thay đổi (settings do popup/useTasks xử lý) */
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;

    void (async () => {
      if (changes.settings) {
        await applyDisplayMode(await currentDisplayMode());
      }
      for (const [key, change] of Object.entries(changes)) {
        if (typeof key === 'string' && key.startsWith('t:')) {
          const id = key.slice('t:'.length);
          if (change.newValue === null || change.newValue === undefined) {
            // Task bị xoá → clear alarm
            clearTaskAlarm(id);
          } else {
            // Task thay đổi → reschedule alarm
            const task = change.newValue as Task;
            scheduleTask(task);
          }
        }
      }
    })();
  });
});

/**
 * Storage adapter trên chrome.storage.sync (L2-T05).
 * Mọi đọc/ghi dữ liệu đi qua adapter này. Mỗi task 1 key `t:<id>`,
 * ghi atomic theo key (không ghi đè toàn bộ danh sách) để tránh vượt
 * quota (102KB tổng, 8KB/item, 512 item, 120 write/phút).
 * Lỗi quota được ném ra rõ ràng, KHÔNG swallow (R-16).
 *
 * Vitest mock `chrome.storage` (không gọi extension API thật trong unit test).
 */

import type { Settings, Task } from '../tasks/types';
import { SETTINGS_KEY, TASK_KEY_PREFIX, taskKey } from '../tasks/types';

const MAX_ITEM_BYTES = 8192;

/** Lỗi quota rõ ràng (không swallow) */
export class StorageQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

function isQuotaError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('QUOTA_BYTES') || msg.includes('quota');
}

async function storageGet<T>(
  keys: string | string[] | null
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(result as T);
    });
  });
}

async function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(items, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve();
    });
  });
}

async function storageRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(keys, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve();
    });
  });
}

/** Đọc toàn bộ task từ storage (các key `t:*`) */
export async function loadAll(): Promise<Task[]> {
  try {
    const all = await storageGet<Record<string, unknown>>(null);
    const tasks: Task[] = [];
    for (const [key, value] of Object.entries(all)) {
      if (typeof key === 'string' && key.startsWith(TASK_KEY_PREFIX)) {
        tasks.push(value as Task);
      }
    }
    return tasks;
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`loadAll quota: ${err}`);
    }
    throw err;
  }
}

/** Ghi key `t:<id>` (atomic per task) */
export async function put(task: Task): Promise<void> {
  const key = taskKey(task.id);
  try {
    const size = new Blob([JSON.stringify(task)]).size;
    if (size > MAX_ITEM_BYTES) {
      throw new StorageQuotaError(
        `Task ${task.id} exceeds ${MAX_ITEM_BYTES} bytes`
      );
    }
    await storageSet({ [key]: task });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`put ${task.id} quota: ${err}`);
    }
    throw err;
  }
}

/** Xoá key `t:<id>` */
export async function remove(id: string): Promise<void> {
  try {
    await storageRemove(taskKey(id));
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`remove ${id} quota: ${err}`);
    }
    throw err;
  }
}

/** Đọc settings */
export async function loadSettings(): Promise<Settings | null> {
  try {
    const all = await storageGet<Record<string, unknown>>([SETTINGS_KEY]);
    return (all[SETTINGS_KEY] as Settings) ?? null;
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`loadSettings quota: ${err}`);
    }
    throw err;
  }
}

/** Ghi settings */
export async function putSettings(settings: Settings): Promise<void> {
  try {
    await storageSet({ [SETTINGS_KEY]: settings });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`putSettings quota: ${err}`);
    }
    throw err;
  }
}

/** Lắng nghe onChanged, callback với danh sách key đã thay đổi/bị xoá */
export function subscribe(
  cb: (changedKeys: string[]) => void
): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>
  ) => {
    cb(Object.keys(changes));
  };
  chrome.storage.onChanged.addListener(handler);
  return () => {
    chrome.storage.onChanged.removeListener(handler);
  };
}

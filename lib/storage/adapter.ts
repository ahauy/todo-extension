/**
 * Storage adapter trên chrome.storage.sync (L2-T05).
 * Mọi đọc/ghi dữ liệu đi qua adapter này. Mỗi task 1 key `t:<id>`,
 * ghi atomic theo key (không ghi đè toàn bộ danh sách) để tránh vượt
 * quota (102KB tổng, 8KB/item, 512 item, 120 write/phút).
 * Lỗi quota được ném ra rõ ràng, KHÔNG swallow (R-16).
 *
 * Vitest mock `chrome.storage` (không gọi extension API thật trong unit test).
 */

import type { Settings, StudyLog, Subject, Task } from '../tasks/types';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  STUDY_LOG_KEY,
  SUBJECTS_KEY,
  TASK_KEY_PREFIX,
  taskKey,
} from '../tasks/types';

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

/** Gộp settings đã lưu với mặc định. Bản cũ có `theme` (sáng/tối) — hệ màu
 *  mới chỉ có tông sáng nên trường đó bị bỏ, các trường mới lấy mặc định. */
export function normalizeSettings(raw: unknown): Settings {
  const source = (raw ?? {}) as Partial<Record<keyof Settings, unknown>>;
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = source[key];
    if (typeof value === typeof DEFAULT_SETTINGS[key]) {
      Object.assign(merged, { [key]: value });
    }
  }
  return merged;
}

/** Đọc settings */
export async function loadSettings(): Promise<Settings | null> {
  try {
    const all = await storageGet<Record<string, unknown>>([SETTINGS_KEY]);
    const raw = all[SETTINGS_KEY];
    return raw === undefined ? null : normalizeSettings(raw);
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

/** Danh sách môn học — một key nhỏ, ghi nguyên cả danh sách */
export async function loadSubjects(): Promise<Subject[]> {
  const all = await storageGet<Record<string, unknown>>([SUBJECTS_KEY]);
  const raw = all[SUBJECTS_KEY];
  return Array.isArray(raw) ? (raw as Subject[]) : [];
}

export async function putSubjects(subjects: Subject[]): Promise<void> {
  try {
    await storageSet({ [SUBJECTS_KEY]: subjects });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`putSubjects quota: ${err}`);
    }
    throw err;
  }
}

/** Nhật ký học — chỉ giữ 60 ngày gần nhất để không phình key */
export const STUDY_LOG_DAYS = 60;

export async function loadStudyLog(): Promise<StudyLog> {
  const all = await storageGet<Record<string, unknown>>([STUDY_LOG_KEY]);
  const raw = all[STUDY_LOG_KEY];
  return raw && typeof raw === 'object' ? (raw as StudyLog) : {};
}

export async function putStudyLog(log: StudyLog): Promise<void> {
  const keys = Object.keys(log).sort();
  const kept = keys.slice(-STUDY_LOG_DAYS);
  const pruned: StudyLog = {};
  for (const key of kept) pruned[key] = log[key];
  try {
    await storageSet({ [STUDY_LOG_KEY]: pruned });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new StorageQuotaError(`putStudyLog quota: ${err}`);
    }
    throw err;
  }
}

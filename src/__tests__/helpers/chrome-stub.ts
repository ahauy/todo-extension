/**
 * In-memory chrome.* stub cho unit test — không gọi extension API thật.
 *
 * Khớp đúng shape mà `lib/storage/adapter.ts` + `lib/alarms/scheduler.ts` sử dụng:
 * - `chrome.storage.sync.get(keys, cb)` / `set(items, cb)` / `remove(keys, cb)`
 * - `chrome.storage.local.get/set/remove` + riêng `chrome.storage.local.onChanged`
 * - `chrome.storage.onChanged.addListener/removeListener` + `emitChange(keys)` (sync)
 * - `chrome.runtime.lastError`
 * - `chrome.alarms.create/clear/getAll(cb)`
 * - `chrome.notifications.create` (no-op)
 *
 * local và sync là 2 area ĐỘC LẬP (store/localStore, listeners/localListeners).
 * `local.set` phát local onChanged như Chrome thật — nên 2 surface dùng chung stub
 * hydrate được lẫn nhau. Dùng `localStore` + `emitLocalChange` khi cần giả lập
 * "surface khác ghi" mà không đi qua API storage.local.
 */

export interface AlarmRecord {
  delayInMinutes?: number;
  periodInMinutes?: number;
}

export type StorageChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>
) => void;

export interface ChromeStub {
  /** Nội dung chrome.storage.sync (key → value) */
  store: Map<string, unknown>;
  /** Nội dung chrome.storage.local (key → value) — độc lập với sync */
  localStore: Map<string, unknown>;
  /** Alarm đang có (name → info) */
  alarms: Map<string, AlarmRecord>;
  /** Listener của chrome.storage.onChanged (sync) */
  listeners: Set<StorageChangeListener>;
  /** Listener của chrome.storage.local.onChanged (area local) */
  localListeners: Set<StorageChangeListener>;
  /** Số lần addListener được gọi (đo resubscribe — defect #22) */
  subscribeCalls: number;
  /** Mức quyền thông báo trả về từ chrome.notifications.getPermissionLevel */
  notificationLevel: 'granted' | 'denied';
  /** Ghi trực tiếp nhiều key (không phát onChanged — dùng trước khi mount) */
  seed(items: Record<string, unknown>): void;
  /** Phát onChanged cho danh sách key (shape tối thiểu mà adapter cần) */
  emitChange(keys: string[]): void;
  /** Phát chrome.storage.local.onChanged cho danh sách key (1 đối số changes) */
  emitLocalChange(keys: string[]): void;
  /** Xoá sạch store/alarms/listeners */
  reset(): void;
  /** Gán stub vào globalThis.chrome */
  install(): void;
}

function pickValues(
  store: Map<string, unknown>,
  keys: string | string[] | Record<string, unknown> | null
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (keys === null) {
    for (const [key, value] of store) out[key] = value;
    return out;
  }
  if (typeof keys === 'string') {
    if (store.has(keys)) out[keys] = store.get(keys);
    return out;
  }
  if (Array.isArray(keys)) {
    for (const key of keys) if (store.has(key)) out[key] = store.get(key);
    return out;
  }
  for (const key of Object.keys(keys)) {
    out[key] = store.has(key) ? store.get(key) : keys[key];
  }
  return out;
}

export function createChromeStub(): ChromeStub {
  const store = new Map<string, unknown>();
  const localStore = new Map<string, unknown>();
  const alarms = new Map<string, AlarmRecord>();
  const listeners = new Set<StorageChangeListener>();
  const localListeners = new Set<StorageChangeListener>();
  const notificationState: { level: 'granted' | 'denied' } = {
    level: 'granted',
  };
  const subscribeCallsState = { calls: 0 };

  /** Phát local onChanged — shape đúng của area-local event: (changes) => void */
  const fireLocal = (changes: Record<string, chrome.storage.StorageChange>) => {
    if (Object.keys(changes).length === 0) return;
    for (const listener of localListeners) listener(changes);
  };

  const stub = {
    storage: {
      sync: {
        get(
          keys: string | string[] | Record<string, unknown> | null,
          cb: (result: Record<string, unknown>) => void
        ) {
          cb(pickValues(store, keys));
        },
        set(items: Record<string, unknown>, cb?: () => void) {
          for (const [key, value] of Object.entries(items)) store.set(key, value);
          if (cb) cb();
        },
        remove(keys: string | string[], cb?: () => void) {
          for (const key of Array.isArray(keys) ? keys : [keys]) store.delete(key);
          if (cb) cb();
        },
      },
      local: {
        get(
          keys: string | string[] | Record<string, unknown> | null,
          cb: (result: Record<string, unknown>) => void
        ) {
          cb(pickValues(localStore, keys));
        },
        set(items: Record<string, unknown>, cb?: () => void) {
          const changes: Record<string, chrome.storage.StorageChange> = {};
          for (const [key, value] of Object.entries(items)) {
            changes[key] = { oldValue: localStore.get(key), newValue: value };
            localStore.set(key, value);
          }
          if (cb) cb();
          fireLocal(changes);
        },
        remove(keys: string | string[], cb?: () => void) {
          const changes: Record<string, chrome.storage.StorageChange> = {};
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            if (localStore.has(key)) changes[key] = { oldValue: localStore.get(key) };
            localStore.delete(key);
          }
          if (cb) cb();
          fireLocal(changes);
        },
        onChanged: {
          addListener(cb: StorageChangeListener) {
            localListeners.add(cb);
          },
          removeListener(cb: StorageChangeListener) {
            localListeners.delete(cb);
          },
        },
      },
      onChanged: {
        addListener(cb: StorageChangeListener) {
          subscribeCallsState.calls += 1;
          listeners.add(cb);
        },
        removeListener(cb: StorageChangeListener) {
          listeners.delete(cb);
        },
      },
    },
    runtime: { lastError: null as { message?: string } | null },
    alarms: {
      create(name: string, info?: AlarmRecord) {
        alarms.set(name, { ...info });
      },
      clear(name: string, cb?: () => void) {
        alarms.delete(name);
        if (cb) cb();
      },
      getAll(cb: (items: { name: string }[]) => void) {
        cb([...alarms.keys()].map((name) => ({ name })));
      },
    },
    notifications: {
      create() {},
      getPermissionLevel(cb: (level: 'granted' | 'denied') => void) {
        cb(notificationState.level);
      },
    },
  };

  return {
    store,
    localStore,
    alarms,
    listeners,
    localListeners,
    get subscribeCalls() {
      return subscribeCallsState.calls;
    },
    get notificationLevel() {
      return notificationState.level;
    },
    set notificationLevel(level: 'granted' | 'denied') {
      notificationState.level = level;
    },
    seed(items) {
      for (const [key, value] of Object.entries(items)) store.set(key, value);
    },
    emitChange(keys) {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const key of keys) changes[key] = { newValue: store.get(key) };
      for (const listener of listeners) listener(changes);
    },
    emitLocalChange(keys) {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const key of keys) changes[key] = { newValue: localStore.get(key) };
      fireLocal(changes);
    },
    reset() {
      store.clear();
      localStore.clear();
      alarms.clear();
      listeners.clear();
      localListeners.clear();
      subscribeCallsState.calls = 0;
    },
    install() {
      (globalThis as typeof globalThis & { chrome: typeof chrome }).chrome =
        stub as unknown as typeof chrome;
    },
  };
}

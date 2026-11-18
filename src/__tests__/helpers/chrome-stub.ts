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
  /** R-22 — chrome.alarms.create({ when }) */
  when?: number;
}

export type StorageChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area?: string
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
  /** Phát chrome.storage.onChanged cho danh sách key (area mặc định `sync`) */
  emitChange(keys: string[], area?: string): void;
  /** R-22 — event/API cho background wiring test */
  alarmListeners: Set<(alarm: { name: string }) => void>;
  notificationListeners: Set<(id: string) => void>;
  installedListeners: Set<() => void>;
  startupListeners: Set<() => void>;
  notificationsCreated: Array<{ id: string; options: unknown }>;
  tabsCreated: Array<{ url?: string }>;
  emitAlarm(name: string): void;
  emitNotificationClick(id: string): void;
  emitInstalled(): void;
  emitStartup(): void;
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
  const alarmListeners = new Set<(alarm: { name: string }) => void>();
  const notificationListeners = new Set<(id: string) => void>();
  const installedListeners = new Set<() => void>();
  const startupListeners = new Set<() => void>();
  const notificationsCreated: Array<{ id: string; options: unknown }> = [];
  const tabsCreated: Array<{ url?: string }> = [];

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
    runtime: {
      lastError: null as { message?: string } | null,
      getURL(path: string) {
        return `chrome-extension://stub/${path}`;
      },
      onInstalled: {
        addListener(cb: () => void) { installedListeners.add(cb); },
        removeListener(cb: () => void) { installedListeners.delete(cb); },
      },
      onStartup: {
        addListener(cb: () => void) { startupListeners.add(cb); },
        removeListener(cb: () => void) { startupListeners.delete(cb); },
      },
    },
    action: {
      onClicked: {
        addListener() {},
      },
      setPopup() {},
    },
    tabs: {
      create(info: { url?: string }) {
        tabsCreated.push(info);
        return Promise.resolve({ id: tabsCreated.length });
      },
      update() {
        return Promise.resolve();
      },
    },
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
      onAlarm: {
        addListener(cb: (alarm: { name: string }) => void) { alarmListeners.add(cb); },
        removeListener(cb: (alarm: { name: string }) => void) { alarmListeners.delete(cb); },
      },
    },
    notifications: {
      create(id: string, options: unknown) {
        notificationsCreated.push({ id, options });
      },
      onClicked: {
        addListener(cb: (id: string) => void) { notificationListeners.add(cb); },
        removeListener(cb: (id: string) => void) { notificationListeners.delete(cb); },
      },
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
    alarmListeners,
    notificationListeners,
    installedListeners,
    startupListeners,
    notificationsCreated,
    tabsCreated,
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
    emitChange(keys, area = 'sync') {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const key of keys) changes[key] = { newValue: store.get(key) };
      for (const listener of listeners) listener(changes, area);
    },
    emitLocalChange(keys) {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const key of keys) changes[key] = { newValue: localStore.get(key) };
      fireLocal(changes);
    },
    emitAlarm(name) {
      for (const listener of alarmListeners) listener({ name });
    },
    emitNotificationClick(id) {
      for (const listener of notificationListeners) listener(id);
    },
    emitInstalled() {
      for (const listener of installedListeners) listener();
    },
    emitStartup() {
      for (const listener of startupListeners) listener();
    },
    reset() {
      store.clear();
      localStore.clear();
      alarms.clear();
      listeners.clear();
      localListeners.clear();
      alarmListeners.clear();
      notificationListeners.clear();
      installedListeners.clear();
      startupListeners.clear();
      notificationsCreated.length = 0;
      tabsCreated.length = 0;
      subscribeCallsState.calls = 0;
    },
    install() {
      (globalThis as typeof globalThis & { chrome: typeof chrome }).chrome =
        stub as unknown as typeof chrome;
    },
  };
}

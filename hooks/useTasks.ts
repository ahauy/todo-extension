/**
 * useTasks hook (L6-T18). Nguồn state popup qua useSyncExternalStore trên
 * storage adapter — { tasks, add, create, update, remove, toggle, restore, loading }.
 *
 * Logic:
 * - add(title): quick-add chỉ title → create(default draft).
 * - create(draft): validate title 1-200 trim, id = crypto.randomUUID(), put
 *   (1 key/task) — dùng cho composer đầy đủ field (R-05).
 * - restore(task): đưa task đã xoá trở lại storage (undo) — giữ nguyên id/createdAt.
 * - toggle done: task thường → done=true + clear alarm; task lặp →
 *   nextDueAt/nextFutureDue catch-up (max 1000), done=false, dueAt=next,
 *   updatedAt=now, tạo alarm mới (R-11).
 * - remove: xoá key + clear alarm.
 * - update: updatedAt now → put.
 * - chrome.storage.onChanged: key t:<id> đổi → merge theo updatedAt lớn hơn
 *   thắng (last-write-wins), cập nhật UI + reschedule alarm; key bị xoá →
 *   xoá local + clear alarm; key settings → resync alarm.
 * Ghi 1 key/task (không ghi cả danh sách), không autosave keystroke
 * (giới hạn 120 write/phút).
 * Lỗi quota ném từ adapter → không swallow.
 */
import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  clearTaskAlarm,
  scheduleTask,
  syncAlarms,
} from '../lib/alarms/scheduler';
import { loadAll, put, remove as storageRemove, subscribe } from '../lib/storage/adapter';
import { nextFutureDue } from '../lib/tasks/recurrence';
import type { Task } from '../lib/tasks/types';

const MAX_TITLE = 200;

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

function nowISO(): string {
  return new Date().toISOString();
}

function defaultDraft(title: string): TaskDraft {
  return {
    title,
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    subjectId: null,
    done: false,
  };
}

function buildTask(draft: TaskDraft): Task {
  return {
    id: crypto.randomUUID(),
    ...draft,
    title: draft.title.trim(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

/** Snapshot mutable để useSyncExternalStore đọc đồng bộ (module-level mutable
 * object — KHÔNG dùng useRef ở module scope, vi phạm Rules of Hooks). */
const snapshotStore: { tasks: Task[] } = { tasks: [] };

/** Callback listeners cho React re-render */
let listeners: (() => void)[] = [];
let unsubscribeStorage: (() => void) | null = null;

/** getServerSnapshot trả cùng 1 tham chiếu — tránh render dư (defect #22). */
const EMPTY_TASKS: Task[] = [];
function getSnapshot(): Task[] {
  return snapshotStore.tasks;
}
function getServerSnapshot(): Task[] {
  return EMPTY_TASKS;
}

export function useTasks() {
  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  const [loading, setLoading] = useState(true);

  const notify = useCallback(() => {
    forceUpdate();
    listeners.forEach((cb) => cb());
  }, []);

  const setSnapshot = useCallback((next: Task[]) => {
    snapshotStore.tasks = next;
    notify();
  }, [notify]);

  const handleStorageChanged = useCallback(
    async (changedKeys: string[]) => {
      const current = await loadAll();
      setSnapshot(current);

      for (const key of changedKeys) {
        if (key.startsWith('t:')) {
          const id = key.slice('t:'.length);
          const task = current.find((t) => t.id === id);
          if (!task) {
            clearTaskAlarm(id);
          } else {
            scheduleTask(task);
          }
        }
      }

      if (changedKeys.includes('settings')) {
        try {
          syncAlarms(current);
        } catch {
          // không throw trong onChanged listener
        }
      }
    },
    [setSnapshot]
  );

  // subscribe ổn định identity — không resubscribe mỗi render (defect #22).
  const subscribeStore = useCallback(
    (cb: () => void) => {
      listeners.push(cb);
      if (!unsubscribeStorage) {
        unsubscribeStorage = subscribe(async (changedKeys) => {
          await handleStorageChanged(changedKeys);
          notify();
        });
      }
      return () => {
        listeners = listeners.filter((l) => l !== cb);
        if (listeners.length === 0 && unsubscribeStorage) {
          unsubscribeStorage();
          unsubscribeStorage = null;
        }
      };
    },
    [handleStorageChanged, notify]
  );

  const tasks = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  const create = useCallback(
    async (draft: TaskDraft) => {
      const title = draft.title.trim();
      if (!title || title.length > MAX_TITLE) return null;
      const task = buildTask({ ...draft, title });
      await put(task);
      setSnapshot([...snapshotStore.tasks, task]);
      syncAlarms(snapshotStore.tasks);
      return task;
    },
    [setSnapshot]
  );

  const add = useCallback(
    async (title: string) => {
      await create(defaultDraft(title));
    },
    [create]
  );

  const restore = useCallback(
    async (task: Task) => {
      await put(task);
      const exists = snapshotStore.tasks.some((t) => t.id === task.id);
      setSnapshot(
        exists
          ? snapshotStore.tasks.map((t) => (t.id === task.id ? task : t))
          : [...snapshotStore.tasks, task]
      );
      syncAlarms(snapshotStore.tasks);
    },
    [setSnapshot]
  );

  const update = useCallback(
    async (task: Task) => {
      const next = { ...task, updatedAt: nowISO() };
      await put(next);
      setSnapshot(
        snapshotStore.tasks.map((t) => (t.id === task.id ? next : t))
      );
    },
    [setSnapshot]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await storageRemove(id);
        clearTaskAlarm(id);
        setSnapshot(snapshotStore.tasks.filter((t) => t.id !== id));
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const toggle = useCallback(
    async (id: string) => {
      const task = snapshotStore.tasks.find((t) => t.id === id);
      if (!task) return;

      const now = new Date();

      if (task.done) {
        // Un-toggle: done = false, giữ dueAt cũ, reschedule
        clearTaskAlarm(id);
        const next = { ...task, done: false, updatedAt: nowISO() };
        try {
          await put(next);
          setSnapshot(
            snapshotStore.tasks.map((t) => (t.id === id ? next : t))
          );
          scheduleTask(next);
        } catch (err) {
          throw err;
        }
        return;
      }

      if (task.recurrence.kind === 'none') {
        // Task thường: done = true, clear alarm
        clearTaskAlarm(id);
        const next = { ...task, done: true, updatedAt: nowISO() };
        try {
          await put(next);
          setSnapshot(
            snapshotStore.tasks.map((t) => (t.id === id ? next : t))
          );
        } catch (err) {
          throw err;
        }
        return;
      }

      // Task lặp: catch-up nextDueAt > now
      try {
        const nextDue = nextFutureDue(task.dueAt ?? nowISO(), task.recurrence, now);
        if (nextDue === null) {
          // Không lặp nữa → done, clear alarm
          clearTaskAlarm(id);
          const next = { ...task, done: true, updatedAt: nowISO() };
          await put(next);
          setSnapshot(
            snapshotStore.tasks.map((t) => (t.id === id ? next : t))
          );
          return;
        }
        const nextTask: Task = {
          ...task,
          done: false,
          dueAt: nextDue,
          updatedAt: nowISO(),
        };
        try {
          await put(nextTask);
          setSnapshot(
            snapshotStore.tasks.map((t) => (t.id === id ? nextTask : t))
          );
          scheduleTask(nextTask);
        } catch (err) {
          throw err;
        }
      } catch (err) {
        throw err;
      }
    },
    []
  );

  // Sync lần đầu khi mount
  useEffect(() => {
    void (async () => {
      try {
        const current = await loadAll();
        setSnapshot(current);
        syncAlarms(current);
      } catch {
        // load lỗi: giữ snapshot rỗng, hết loading, không unhandled rejection
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { tasks, add, create, update, remove, toggle, restore, loading };
}

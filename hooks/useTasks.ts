/**
 * useTasks hook (L6-T18). Nguồn state popup qua useSyncExternalStore trên
 * storage adapter — { tasks, dayPlan, add, create, update, remove, toggle,
 * restore, selectFrog, loading }.
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
 *   xoá local + clear alarm; key settings → resync alarm; key `dayPlan` →
 *   hydrate frog (R-21).
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
import {
  DAY_PLAN_DAYS,
  loadAll,
  loadDayPlan,
  put,
  putDayPlan,
  remove as storageRemove,
  subscribe,
} from '../lib/storage/adapter';
import { nextFutureDue } from '../lib/tasks/recurrence';
import { habitOccurrenceDay, withHabitDay } from '../lib/tasks/habit';
import type { TaskTimePatch } from '../lib/tasks/timeBlock';
import { isRecurringDoneToday } from '../lib/tasks/query';
import { DAY_PLAN_KEY, type DayPlan, type Task } from '../lib/tasks/types';

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
    keystone: false,
    archived: false,
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
const snapshotStore: { tasks: Task[]; dayPlan: DayPlan } = {
  tasks: [],
  dayPlan: {},
};

/** Callback listeners cho React re-render */
let listeners: (() => void)[] = [];
let unsubscribeStorage: (() => void) | null = null;

/** getServerSnapshot trả cùng 1 tham chiếu — tránh render dư (defect #22). */
const EMPTY_TASKS: Task[] = [];
const EMPTY_DAY_PLAN: DayPlan = {};
function getSnapshot(): Task[] {
  return snapshotStore.tasks;
}
function getServerSnapshot(): Task[] {
  return EMPTY_TASKS;
}
function getDayPlanSnapshot(): DayPlan {
  return snapshotStore.dayPlan;
}
function getServerDayPlanSnapshot(): DayPlan {
  return EMPTY_DAY_PLAN;
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
      // R-21 — key `dayPlan` đổi từ bề mặt/thiết bị khác → hydrate con ếch.
      if (changedKeys.includes(DAY_PLAN_KEY)) {
        try {
          snapshotStore.dayPlan = await loadDayPlan();
        } catch {
          // không throw trong onChanged listener
        }
      }

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
  const dayPlan = useSyncExternalStore(
    subscribeStore,
    getDayPlanSnapshot,
    getServerDayPlanSnapshot
  );

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
      const previous = snapshotStore.tasks.find((t) => t.id === task.id);
      const next = { ...task, updatedAt: nowISO() };
      await put(next);
      setSnapshot(
        snapshotStore.tasks.map((t) => (t.id === task.id ? next : t))
      );
      // R-21 — chỉ đổi alarm khi trạng thái archived đổi so với bản đã lưu:
      // cắt bỏ xoá alarm, phục hồi tạo lại. Edit thường không đụng alarm
      // (tránh write churn). snapshotStore.tasks đã được setSnapshot cập nhật.
      if (!!previous?.archived !== !!next.archived) {
        syncAlarms(snapshotStore.tasks);
      }
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

  /**
   * R-24 — chỉ đổi giờ bắt đầu / độ dài block, đi qua MỘT `put(task)`.
   * Không đụng `plannedFor`, `dueAt`, `lastDoneAt`/`prevDueAt`, `habit` hay alarm
   * `due:<id>` (chép nguyên task rồi sửa 2 field). `put` lỗi (quota) → throw TRƯỚC
   * `setSnapshot` nên snapshot cũ giữ nguyên (R-16).
   */
  const setTaskTime = useCallback(
    async (id: string, patch: TaskTimePatch) => {
      const task = snapshotStore.tasks.find((item) => item.id === id);
      if (!task) return;
      const next: Task = { ...task, updatedAt: nowISO() };
      if (patch.startAt !== undefined) {
        if (patch.startAt) next.startAt = patch.startAt;
        else delete next.startAt;
      }
      if (patch.estimateMin !== undefined) {
        if (typeof patch.estimateMin === 'number') next.estimateMin = patch.estimateMin;
        else delete next.estimateMin;
      }
      await put(next);
      setSnapshot(snapshotStore.tasks.map((item) => (item.id === id ? next : item)));
    },
    [setSnapshot]
  );

  /** R-21 — chọn/bỏ con ếch cho một ngày local. Cùng ngày → thay thế; sang
   *  ngày khác thì entry cũ tự hết hiệu lực (consumer đọc dayPlan[dayKey hiện tại]). */
  const selectFrog = useCallback(
    async (dayKey: string, taskId: string | null): Promise<void> => {
      const next: DayPlan = {
        ...snapshotStore.dayPlan,
        [dayKey]: { frogTaskId: taskId },
      };
      await putDayPlan(next);
      // putDayPlan chỉ ghi 14 ngày mới nhất — cache phải khớp shape đã lưu (F-02).
      const kept = Object.keys(next).sort().slice(-DAY_PLAN_DAYS);
      const pruned: DayPlan = {};
      for (const key of kept) pruned[key] = next[key];
      snapshotStore.dayPlan = pruned;
      notify();
    },
    [notify]
  );

  const toggle = useCallback(
    async (id: string) => {
      const task = snapshotStore.tasks.find((t) => t.id === id);
      if (!task) return;

      const now = new Date();
      const stamp = nowISO();

      // Hoàn tác hôm nay: trả về occurrence vừa làm (prevDueAt), KHÔNG cuộn thêm; gán thẳng vì cùng wall-clock local.
      // R-23 — gỡ ngày occurrence vừa xong khỏi sổ thói quen (cùng 1 put bên dưới).
      if (isRecurringDoneToday(task, now)) {
        clearTaskAlarm(id);
        const worked = withHabitDay(
          task,
          habitOccurrenceDay(task.prevDueAt),
          'remove',
          now
        );
        const next: Task = {
          ...worked,
          done: false,
          dueAt: task.prevDueAt ?? task.dueAt,
          prevDueAt: null,
          lastDoneAt: null,
          updatedAt: stamp,
        };
        await put(next);
        setSnapshot(snapshotStore.tasks.map((t) => (t.id === id ? next : t)));
        scheduleTask(next);
        return;
      }

      if (task.done) {
        // Un-toggle: done = false, giữ dueAt cũ, reschedule
        // R-23 — gỡ ngày từ prevDueAt nếu có (no-op nếu đã gỡ / không có habit).
        clearTaskAlarm(id);
        const worked = withHabitDay(
          task,
          habitOccurrenceDay(task.prevDueAt),
          'remove',
          now
        );
        const next = {
          ...worked,
          done: false,
          lastDoneAt: null,
          prevDueAt: null,
          updatedAt: stamp,
        };
        await put(next);
        setSnapshot(snapshotStore.tasks.map((t) => (t.id === id ? next : t)));
        scheduleTask(next);
        return;
      }

      if (task.recurrence.kind === 'none') {
        // Task thường: done = true, clear alarm
        clearTaskAlarm(id);
        const next = { ...task, done: true, lastDoneAt: stamp, prevDueAt: null, updatedAt: stamp };
        await put(next);
        setSnapshot(snapshotStore.tasks.map((t) => (t.id === id ? next : t)));
        return;
      }

      // Task lặp: catch-up nextDueAt > now; prevDueAt giữ nguyên văn hạn cũ (wall-clock local) để Hoàn tác gán thẳng.
      const nextDue = nextFutureDue(task.dueAt ?? stamp, task.recurrence, now);
      if (nextDue === null) {
        // Không lặp nữa → done, clear alarm
        // R-23 — route qua cùng helper dù nhánh này hiện unreachable.
        clearTaskAlarm(id);
        const worked = withHabitDay(
          task,
          habitOccurrenceDay(task.dueAt),
          'add',
          now
        );
        const next = {
          ...worked,
          done: true,
          lastDoneAt: stamp,
          prevDueAt: null,
          updatedAt: stamp,
        };
        await put(next);
        setSnapshot(snapshotStore.tasks.map((t) => (t.id === id ? next : t)));
        return;
      }
      // R-23 — ngày ghi là ngày local của dueAt CŨ (trước khi R-11 ghi
      // prevDueAt = dueAt), KHÔNG đọc prevDueAt cũ, KHÔNG dùng dueAt mới.
      const occurrenceDay = habitOccurrenceDay(task.dueAt);
      const worked = withHabitDay(task, occurrenceDay, 'add', now);
      const nextTask: Task = {
        ...worked,
        done: false,
        dueAt: nextDue,
        prevDueAt: task.dueAt,
        lastDoneAt: stamp,
        updatedAt: stamp,
      };
      await put(nextTask);
      setSnapshot(snapshotStore.tasks.map((t) => (t.id === id ? nextTask : t)));
      scheduleTask(nextTask);
    },
    []
  );

  // Sync lần đầu khi mount
  useEffect(() => {
    void (async () => {
      try {
        const current = await loadAll();
        // hydrate dayPlan trước khi notify để 1 lần render thấy cả 2 snapshot.
        snapshotStore.dayPlan = await loadDayPlan().catch(() => snapshotStore.dayPlan);
        setSnapshot(current);
        syncAlarms(current);
      } catch {
        // load lỗi: giữ snapshot rỗng, hết loading, không unhandled rejection
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return {
    tasks,
    dayPlan,
    add,
    create,
    update,
    setTaskTime,
    remove,
    toggle,
    restore,
    selectFrog,
    loading,
  };
}

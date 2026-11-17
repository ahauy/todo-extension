/**
 * Bộ điều khiển chung cho Popup và New Tab: cùng một sổ, cùng một luật.
 * Gộp tasks + môn học + cài đặt + nhật ký + đồng hồ, và bọc các hành động để
 * mọi nơi đều ghi nhật ký, phát tiếng và báo khôi phục theo một cách.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTasks, type TaskDraft } from './useTasks';
import { useSubjects } from './useSubjects';
import { useSettings } from './useSettings';
import { useStudyLog } from './useStudyLog';
import { usePomodoro } from './usePomodoro';
import { filterByBoard, type BoardTab } from '../lib/tasks/query';
import { dayKey } from '../lib/datetime';
import { playPaper, unlockAudio } from '../lib/sound';
import type { Task } from '../lib/tasks/types';

/** FUP-001: sentinel cho pendingInterruptId khi huỷ gắn (taskId về null). */
const DETACH_SENTINEL = '';

export interface BoardToast {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function useBoard() {
  const { tasks, create, update, remove, toggle, restore, loading } = useTasks();
  const { subjects, create: createSubject, remove: removeSubject } = useSubjects();
  const { settings, update: updateSettings } = useSettings();
  const { log, record } = useStudyLog();
  const [now, setNow] = useState(() => new Date());
  const [freshId, setFreshId] = useState<string | null>(null);
  const [toast, setToast] = useState<BoardToast | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  // R-20: completion được hoãn tới khi UI xác nhận "Xong việc này chưa?".
  const [pendingCompletion, setPendingCompletion] = useState<{
    taskId: string;
    interruptions: number;
  } | null>(null);
  const [pendingStartId, setPendingStartId] = useState<string | null>(null);
  const [pendingInterruptId, setPendingInterruptId] = useState<string | null>(null);
  const focusTaskIdRef = useRef<string | null>(null);
  const interruptionRef = useRef(0);

  // Hạn chót và lời chào đổi theo phút, không cần nhịp giây
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const recordFocus = useCallback(() => {
    void record('focus', 1);
    setToast({ message: 'Hết giờ học. Đứng dậy uống ngụm nước đã.' });
  }, [record]);

  const onFocusComplete = useCallback(() => {
    // Phase 1 đảm bảo callback này chỉ bắn ở natural completion (không phải skip).
    // R-20: có việc gắn → hoãn record/tick cho ConfirmDialog ở UI; từ chối = không ghi.
    const attached = focusTaskIdRef.current;
    if (attached) {
      setPendingCompletion({ taskId: attached, interruptions: interruptionRef.current });
      return;
    }
    recordFocus();
  }, [recordFocus]);

  const pomodoro = usePomodoro({
    preset: settings.pomodoroPreset,
    soundEnabled: settings.soundEnabled,
    onFocusComplete,
  });

  // Hook clear taskId NGAY SAU khi gọi callback → cập nhật ref trong render
  // (effect chạy SAU completion effect của usePomodoro nên đọc sẽ trễ 1 nhịp).
  focusTaskIdRef.current = pomodoro.taskId;
  // Hook xoá bộ đếm khi rời focus → snapshot lại để hiện trong tổng kết.
  interruptionRef.current = pomodoro.interruptions;

  const counts = useMemo(() => {
    const result = {} as Record<BoardTab, number>;
    for (const tab of ['all', 'today', 'upcoming', 'done'] as BoardTab[]) {
      result[tab] = filterByBoard(tasks, tab, now).length;
    }
    return result;
  }, [tasks, now]);

  const overdue = useMemo(
    () => tasks.filter((task) => !task.done && task.dueAt && new Date(task.dueAt) < now).length,
    [tasks, now]
  );

  const doneToday = log[dayKey(now)]?.tasks ?? 0;
  const activeCount = tasks.filter((task) => !task.done).length;

  const createDraft = useCallback(
    async (draft: TaskDraft) => {
      try {
        const created = await create(draft);
        setQuotaError(null);
        if (created) {
          setFreshId(created.id);
          window.setTimeout(() => setFreshId(null), 600);
        }
      } catch (error) {
        setQuotaError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [create]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      if (settings.soundEnabled) {
        unlockAudio();
        if (!task.done) playPaper();
      }
      await toggle(id);
      void record('tasks', task.done ? -1 : 1);
      if (!task.done) {
        setToast({
          message: 'Đã đóng dấu son.',
          detail: task.title,
          actionLabel: 'Hoàn tác',
          onAction: () => {
            void toggle(id);
            void record('tasks', -1);
          },
        });
      }
    },
    [tasks, toggle, record, settings.soundEnabled]
  );

  /** R-20: xác nhận "Xong việc này chưa?" → tick (R-11 qua toggle) + focus +1. */
  const confirmFocusCompletion = useCallback(() => {
    const pending = pendingCompletion;
    if (!pending) return;
    setPendingCompletion(null);
    void toggleTask(pending.taskId);
    recordFocus();
  }, [pendingCompletion, toggleTask, recordFocus]);

  const declineFocusCompletion = useCallback(() => setPendingCompletion(null), []);

  /** R-20: gắn việc rồi start — start phải chạy ở render đã thấy taskId mới. */
  const startFocusOn = useCallback(
    (id: string) => {
      pomodoro.attach(id);
      setPendingStartId(id);
    },
    [pomodoro]
  );

  useEffect(() => {
    if (!pendingStartId) return;
    if (pomodoro.taskId !== pendingStartId || pomodoro.running) return;
    pomodoro.start();
    setPendingStartId(null);
  }, [pendingStartId, pomodoro.taskId, pomodoro.running, pomodoro.start]);

  /** R-20: đổi việc giữa phiên — attach r mới noteInterruption (cùng 1 render thì
      commit sau ghi đè commit trước vì cả 2 dùng chung state closure cũ). */
  const switchTaskMidSession = useCallback(
    (id: string) => {
      pomodoro.attach(id);
      setPendingInterruptId(id);
    },
    [pomodoro]
  );

  useEffect(() => {
    if (pendingInterruptId === null) return;
    const matched =
      pendingInterruptId === DETACH_SENTINEL
        ? pomodoro.taskId === null
        : pomodoro.taskId === pendingInterruptId;
    if (!matched) return;
    pomodoro.noteInterruption();
    setPendingInterruptId(null);
  }, [pendingInterruptId, pomodoro.taskId, pomodoro.noteInterruption]);

  /** FUP-001: huỷ gắn việc giữa phiên — attach(null) rồi noteInterruption ở render SAU
      (cùng pattern với switchTaskMidSession, tránh commit sau ghi đè commit trước). */
  const detachFocus = useCallback(() => {
    pomodoro.attach(null);
    setPendingInterruptId(DETACH_SENTINEL);
  }, [pomodoro]);

  const deleteTask = useCallback(
    async (id: string) => {
      const deleted = tasks.find((item) => item.id === id) ?? null;
      await remove(id);
      setToast({
        message: 'Đã xoá việc khỏi sổ.',
        detail: deleted?.title,
        actionLabel: 'Hoàn tác',
        onAction: deleted ? () => void restore(deleted) : undefined,
      });
    },
    [tasks, remove, restore]
  );

  const updateTask = useCallback(
    async (task: Task) => {
      try {
        await update(task);
        setQuotaError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setQuotaError(message);
        throw error;
      }
    },
    [update]
  );

  const dropSubject = useCallback(
    async (id: string) => {
      const affected = tasks.filter((task) => task.subjectId === id);
      await removeSubject(id);
      for (const task of affected) {
        await update({ ...task, subjectId: null });
      }
    },
    [tasks, removeSubject, update]
  );

  const toggleSound = useCallback(() => {
    const next = !settings.soundEnabled;
    void updateSettings({ soundEnabled: next });
    if (next) unlockAudio();
  }, [settings.soundEnabled, updateSettings]);

  return {
    tasks,
    subjects,
    settings,
    updateSettings,
    loading,
    now,
    counts,
    overdue,
    activeCount,
    doneToday,
    log,
    pomodoro,
    pendingCompletion,
    confirmFocusCompletion,
    declineFocusCompletion,
    startFocusOn,
    switchTaskMidSession,
    detachFocus,
    freshId,
    setFreshId,
    toast,
    setToast,
    quotaError,
    setQuotaError,
    createDraft,
    toggleTask,
    deleteTask,
    updateTask,
    createSubject,
    dropSubject,
    toggleSound,
  };
}

export type Board = ReturnType<typeof useBoard>;
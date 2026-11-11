/**
 * Chuỗi ngày học. Một ngày "sáng đèn" khi có ít nhất một việc được đóng dấu
 * hoặc một phiên tập trung trọn vẹn. Nhật ký giữ 60 ngày, chuỗi vẫn đếm tiếp
 * từ hôm qua nếu hôm nay chưa học — ngày chỉ đứt khi đã qua trọn một ngày.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { loadStudyLog, putStudyLog } from '../lib/storage/adapter';
import { dayKey } from '../lib/datetime';
import type { StudyLog } from '../lib/tasks/types';

let current: StudyLog = {};
let started = false;
let listeners: (() => void)[] = [];
let unsubscribe: (() => void) | null = null;

const EMPTY: StudyLog = {};

function emit(): void {
  for (const listener of listeners) listener();
}

function adopt(next: StudyLog): void {
  current = next;
  emit();
}

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string
): void {
  if (area !== 'sync' || !changes.studyLog) return;
  const raw = changes.studyLog.newValue;
  adopt(raw && typeof raw === 'object' ? (raw as StudyLog) : {});
}

function subscribeStore(listener: () => void): () => void {
  listeners.push(listener);
  if (!started) {
    started = true;
    void loadStudyLog().then(adopt).catch(() => adopt({}));
  }
  if (!unsubscribe && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    unsubscribe = () => chrome.storage.onChanged.removeListener(onStorageChanged);
    chrome.storage.onChanged.addListener(onStorageChanged);
  }
  return () => {
    listeners = listeners.filter((item) => item !== listener);
    if (listeners.length === 0 && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}

function getSnapshot(): StudyLog {
  return current;
}

export function isLit(log: StudyLog, key: string): boolean {
  const day = log[key];
  return !!day && (day.tasks > 0 || day.focus > 0);
}

/** Đếm ngược từ hôm nay (hoặc hôm qua nếu hôm nay chưa học) */
export function streakLength(log: StudyLog, today: Date): number {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!isLit(log, dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (isLit(log, dayKey(cursor)) && count < 400) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export interface StreakCell {
  key: string;
  weekday: string;
  lit: boolean;
  today: boolean;
}

const SHORT_WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function lastSevenDays(log: StudyLog, today: Date): StreakCell[] {
  const cells: StreakCell[] = [];
  for (let back = 6; back >= 0; back -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const key = dayKey(date);
    cells.push({
      key,
      weekday: SHORT_WEEKDAY[date.getDay()],
      lit: isLit(log, key),
      today: back === 0,
    });
  }
  return cells;
}

export function useStudyLog(): {
  log: StudyLog;
  record: (kind: 'tasks' | 'focus', delta?: number) => Promise<void>;
} {
  const log = useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

  const record = useCallback(async (kind: 'tasks' | 'focus', delta = 1) => {
    const key = dayKey(new Date());
    const day = current[key] ?? { tasks: 0, focus: 0 };
    const next: StudyLog = {
      ...current,
      [key]: { ...day, [kind]: Math.max(0, day[kind] + delta) },
    };
    const previous = current;
    adopt(next);
    try {
      await putStudyLog(next);
    } catch {
      adopt(previous);
    }
  }, []);

  return { log, record };
}

export { EMPTY as EMPTY_LOG };
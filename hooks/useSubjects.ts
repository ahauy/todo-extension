/**
 * Môn học (gáy sách). Một store ngoài React, đồng bộ qua key `subjects`.
 * Màu gáy lấy theo thứ tự tạo — xem lib/subjects.ts.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { loadSubjects, putSubjects } from '../lib/storage/adapter';
import { MAX_SUBJECTS, MAX_SUBJECT_NAME, sortedSubjects } from '../lib/subjects';
import type { Subject } from '../lib/tasks/types';

let current: Subject[] = [];
let started = false;
let listeners: (() => void)[] = [];
let unsubscribe: (() => void) | null = null;

const EMPTY: Subject[] = [];

function emit(): void {
  for (const listener of listeners) listener();
}

function adopt(next: Subject[]): void {
  current = sortedSubjects(next);
  emit();
}

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string
): void {
  if (area !== 'sync' || !changes.subjects) return;
  const raw = changes.subjects.newValue;
  adopt(Array.isArray(raw) ? (raw as Subject[]) : []);
}

function subscribeStore(listener: () => void): () => void {
  listeners.push(listener);
  if (!started) {
    started = true;
    void loadSubjects().then(adopt).catch(() => adopt([]));
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

function getSnapshot(): Subject[] {
  return current.length === 0 ? EMPTY : current;
}

async function persist(next: Subject[]): Promise<void> {
  const previous = current;
  adopt(next);
  try {
    await putSubjects(next);
  } catch {
    adopt(previous);
    throw new Error('Không lưu được môn học. Bộ nhớ đồng bộ có thể đã đầy.');
  }
}

export function useSubjects(): {
  subjects: Subject[];
  create: (name: string) => Promise<Subject | null>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
} {
  const subjects = useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

  const create = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > MAX_SUBJECT_NAME) return null;
    if (current.length >= MAX_SUBJECTS) return null;
    if (current.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return null;
    const subject: Subject = {
      id: crypto.randomUUID(),
      name: trimmed,
      order: current.length,
      createdAt: new Date().toISOString(),
    };
    await persist([...current, subject]);
    return subject;
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > MAX_SUBJECT_NAME) return;
    await persist(
      current.map((s) => (s.id === id ? { ...s, name: trimmed } : s))
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await persist(
      current
        .filter((s) => s.id !== id)
        .map((s, index) => ({ ...s, order: index }))
    );
  }, []);

  return { subjects, create, rename, remove };
}
/**
 * Settings dùng chung cho Popup và New Tab. Một store ngoài React để nhiều
 * component đọc cùng một bản, cộng một listener storage.onChanged duy nhất.
 * Áp cờ hiệu ứng lên <html> để CSS tự tắt bút / họa tiết / vệt sáng.
 */
import { useCallback, useSyncExternalStore } from 'react';
import {
  loadSettings,
  normalizeSettings,
  putSettings,
} from '../lib/storage/adapter';
import { DEFAULT_SETTINGS, type Settings } from '../lib/tasks/types';

let current: Settings = DEFAULT_SETTINGS;
let started = false;
let listeners: (() => void)[] = [];
let unsubscribe: (() => void) | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

/** Cờ hiệu ứng đọc bằng CSS: :root[data-quill='off'] … */
export function applyEffectFlags(settings: Settings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.quill = settings.quillEffect ? 'on' : 'off';
  root.dataset.ornaments = settings.ornaments ? 'on' : 'off';
  root.dataset.grain = settings.ornaments ? 'on' : 'off';
  root.dataset.sheen = settings.lacquerSheen ? 'on' : 'off';
  root.dataset.quillStyle = settings.quillStyle;
}

function adopt(next: Settings): void {
  current = next;
  applyEffectFlags(next);
  emit();
}

async function bootstrap(): Promise<void> {
  try {
    const stored = await loadSettings();
    adopt(stored ?? DEFAULT_SETTINGS);
  } catch {
    adopt(DEFAULT_SETTINGS);
  }
}

function subscribeStore(listener: () => void): () => void {
  listeners.push(listener);
  if (!started) {
    started = true;
    void bootstrap();
  }
  if (!unsubscribe && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    unsubscribe = () => {
      chrome.storage.onChanged.removeListener(onStorageChanged);
    };
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

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string
): void {
  if (area !== 'sync' || !changes.settings) return;
  adopt(normalizeSettings(changes.settings.newValue));
}

function getSnapshot(): Settings {
  return current;
}

export function useSettings(): {
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
} {
  const settings = useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const previous = current;
    const next = { ...previous, ...patch };
    adopt(next);
    try {
      await putSettings(next);
    } catch {
      // Ghi lỗi (quota) → trả lại bản cũ để UI không nói dối
      adopt(previous);
      throw new Error('Không lưu được cài đặt. Bộ nhớ đồng bộ có thể đã đầy.');
    }
  }, []);

  return { settings, update };
}

/** Đọc một lần ngoài React (background, đồng hồ) */
export function currentSettings(): Settings {
  return current;
}
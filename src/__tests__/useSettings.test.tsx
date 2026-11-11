/**
 * Test cho `hooks/useSettings` — kế thừa intent của test theme cũ (#7) sau
 * cải tạo "Sơn mài Học Đường": không còn dark mode hay `theme` trong Settings,
 * thay bằng cờ hiệu ứng đặt lên <html> dataset (quill/ornaments/grain/sheen/
 * quillStyle) mà CSS đọc để bật/tắt bút lông, họa tiết, vệt sáng.
 *
 * useSettings giữ state module-scope (`current`/`started`) nên mỗi test phải
 * `vi.resetModules()` + dynamic import React và hook trong từng test — và
 * chrome stub phải `install()` TRƯỚC khi import (beforeEach chạy trước).
 *
 * Không dùng @testing-library/* (giữ đúng pattern createRoot + act của repo).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { DEFAULT_SETTINGS, type Settings } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface UseSettingsApi {
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Shape listener thật của chrome.storage.onChanged: (changes, areaName). */
type SyncListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string
) => void;

/** stub.emitChange chỉ truyền `changes` (đủ cho adapter), còn useSettings đòi
 * area 'sync' — nên phát đúng shape chrome bằng cách gọi listener trực tiếp. */
function emitSyncSettingsChange(stub: ChromeStub, newValue: Settings): void {
  const listeners = [...stub.listeners] as SyncListener[];
  for (const listener of listeners) {
    listener({ settings: { newValue } }, 'sync');
  }
}

let stub: ChromeStub;
let api: UseSettingsApi;
let cleanup: (() => Promise<void>) | null = null;

async function settle(ReactModule: typeof import('react')): Promise<void> {
  await ReactModule.act(async () => {
    await flush();
  });
}

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
  });
}

async function mountHook(): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { useSettings } = await import('../../hooks/useSettings');

  const container = document.createElement('div');
  document.body.appendChild(container);

  function Probe() {
    api = useSettings();
    return React.createElement('div', null, api.settings.quillStyle);
  }

  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Probe));
  });
  await settle(React);

  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return container;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  await flush();
  document.body.innerHTML = '';
  // Cờ hiệu ứng do applyEffectFlags đặt — dọn để test sau start sạch
  for (const flag of ['quill', 'ornaments', 'grain', 'sheen', 'quillStyle']) {
    delete document.documentElement.dataset[flag];
  }
});

describe('useSettings — cờ hiệu ứng khi mount', () => {
  it('không có settings lưu → mặc định: quill/ornaments/sheen on, quillStyle pen', async () => {
    await mountHook();

    expect(document.documentElement.dataset.quill).toBe('on');
    expect(document.documentElement.dataset.ornaments).toBe('on');
    expect(document.documentElement.dataset.sheen).toBe('on');
    expect(document.documentElement.dataset.quillStyle).toBe('pen');
  });

  it('settings đã lưu áp ngay khi mount (quillEffect off, quillStyle hand)', async () => {
    stub.seed({
      settings: { ...DEFAULT_SETTINGS, quillEffect: false, quillStyle: 'hand' },
    });
    await mountHook();

    expect(document.documentElement.dataset.quill).toBe('off');
    expect(document.documentElement.dataset.quillStyle).toBe('hand');
  });

  it('cờ cũ còn treo trên <html> mà không có settings lưu → bootstrap trả về mặc định', async () => {
    document.documentElement.dataset.quill = 'off';
    await mountHook();

    expect(document.documentElement.dataset.quill).toBe('on');
  });
});

describe('useSettings — cập nhật', () => {
  it('storage.onChanged (area sync, key settings) áp ngay vào dataset', async () => {
    await mountHook();
    expect(document.documentElement.dataset.ornaments).toBe('on');

    await act(async () => {
      const next = { ...DEFAULT_SETTINGS, ornaments: false };
      stub.store.set('settings', next);
      emitSyncSettingsChange(stub, next);
      await flush();
    });

    expect(document.documentElement.dataset.ornaments).toBe('off');
  });

  it('update() ghi key "settings" vào storage.sync và snapshot phản ánh ngay', async () => {
    await mountHook();

    await act(async () => {
      await api.update({ soundEnabled: true });
    });

    // putSettings ghi nguyên object Settings vào 1 key duy nhất là "settings"
    const saved = stub.store.get('settings') as Settings;
    expect(saved.soundEnabled).toBe(true);
    expect(api.settings.soundEnabled).toBe(true);
  });
});

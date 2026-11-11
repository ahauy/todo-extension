/** Test Settings notifications control + quyền thật (defect #16). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import SettingsPanel from '../../components/Settings';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import type { Settings } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

let stub: ChromeStub;
let root: Root | null = null;
let container: HTMLElement | null = null;

async function renderSettings(): Promise<HTMLElement> {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(React.createElement(SettingsPanel, { onBack: vi.fn() }));
  });
  await act(async () => {
    await flush();
  });
  return container;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
  }
  root = null;
  container = null;
  document.body.innerHTML = '';
});

describe('Settings notifications (#16)', () => {
  it('toggle tắt lưu notificationsEnabled=false vào storage', async () => {
    stub.seed({
      settings: { theme: 'system', notificationsEnabled: true },
    });
    const el = await renderSettings();
    const checkbox = el.querySelector(
      'input[aria-label="Bật nhắc việc"]'
    ) as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(true);

    await act(async () => {
      checkbox.click();
      await flush();
    });

    const saved = stub.store.get('settings') as Settings;
    expect(saved.notificationsEnabled).toBe(false);
  });

  it('quyền bị chặn: hiện cảnh báo + nút sao chép', async () => {
    stub.notificationLevel = 'denied';
    stub.seed({
      settings: { theme: 'system', notificationsEnabled: true },
    });
    const el = await renderSettings();

    expect(el.textContent).toContain('Trình duyệt đang chặn thông báo');
    expect(el.textContent).toContain('Sao chép địa chỉ');
  });

  it('quyền granted: không hiện cảnh báo chặn', async () => {
    stub.seed({
      settings: { theme: 'system', notificationsEnabled: true },
    });
    const el = await renderSettings();
    expect(el.textContent).not.toContain('Trình duyệt đang chặn thông báo');
  });
});

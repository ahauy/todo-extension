/**
 * Test SettingsPanel: component tự mount useSettings — hook có state ở module
 * scope → bắt buộc `vi.resetModules()` trong beforeEach + import ĐỘNG cả
 * component lẫn React trong từng test, và chrome stub phải cài TRƯỚC khi
 * import (bootstrap đọc chrome.storage ngay lần subscribe đầu tiên).
 * SettingsPanel gọi chrome.notifications?.getPermissionLevel?.() và
 * chrome.storage.sync.getBytesInUse?.() — optional chaining, stub chuẩn chạy
 * được (getBytesInUse thiếu → usage mặc định 0).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { DEFAULT_SETTINGS, type Settings } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Cờ hiệu ứng applyEffectFlags ghi lên <html> — xoá sạch giữa các test. */
const EFFECT_FLAG_ATTRS = [
  'data-quill',
  'data-ornaments',
  'data-grain',
  'data-sheen',
  'data-quill-style',
];

let stub: ChromeStub;
const cleanups: (() => Promise<void>)[] = [];

/** import('react') sau resetModules → cùng một bản React với component. */
function getReact(): Promise<typeof import('react')> {
  return import('react');
}

async function renderPanel(): Promise<HTMLElement> {
  const React = await getReact();
  const { createRoot } = await import('react-dom/client');
  const { default: SettingsPanel } = await import('../../components/SettingsPanel');

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(SettingsPanel));
  });
  // Bootstrap settings load async → flush để adopt() kịp chạy.
  await React.act(async () => {
    await flush();
  });
  cleanups.push(async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  });
  return container;
}

beforeEach(() => {
  vi.resetModules();
  // Stub phải sẵn sàng TRƯỚC khi import component (bootstrap đọc storage).
  stub = createChromeStub();
  stub.install();
  document.body.innerHTML = '';
  for (const attr of EFFECT_FLAG_ATTRS) {
    document.documentElement.removeAttribute(attr);
  }
});

afterEach(async () => {
  while (cleanups.length > 0) {
    await cleanups.pop()!();
  }
  document.body.innerHTML = '';
});

describe('SettingsPanel', () => {
  it('render đủ các nhóm điều khiển', async () => {
    const el = await renderPanel();

    const mode = el.querySelector('[role="group"][aria-label="Chế độ hiển thị"]');
    expect(mode).not.toBeNull();
    expect(
      [...mode!.querySelectorAll('[role="radio"]')].map((radio) => radio.textContent)
    ).toEqual(['Popup', 'New Tab', 'Tự động']);

    const quillStyle = el.querySelector('[role="group"][aria-label="Kiểu bút"]');
    expect(quillStyle).not.toBeNull();
    expect(
      [...quillStyle!.querySelectorAll('[role="radio"]')].map(
        (radio) => radio.textContent
      )
    ).toEqual(['Bút lông', 'Bàn tay cầm bút']);

    for (const label of [
      'Hiệu ứng bút và mực thấm',
      'Họa tiết góc và hạt khảm vỏ trứng',
      'Vệt sáng sơn mài trên thẻ',
    ]) {
      expect(
        el.querySelector(`button[role="switch"][aria-label="${label}"]`)
      ).not.toBeNull();
    }

    const pomodoro = el.querySelector(
      '[role="group"][aria-label="Độ dài giờ học"]'
    );
    expect(pomodoro).not.toBeNull();
    expect(
      [...pomodoro!.querySelectorAll('[role="radio"]')].map(
        (radio) => radio.textContent
      )
    ).toEqual(['25 / 5', '50 / 10']);
  });

  it('tắt "Hiệu ứng bút và mực thấm": lưu quillEffect=false + data-quill="off"', async () => {
    const React = await getReact();
    const el = await renderPanel();

    const quillSwitch = el.querySelector(
      'button[role="switch"][aria-label="Hiệu ứng bút và mực thấm"]'
    ) as HTMLButtonElement;
    expect(quillSwitch.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset.quill).toBe('on');

    await React.act(async () => {
      quillSwitch.click();
      await flush();
    });

    expect(quillSwitch.getAttribute('aria-checked')).toBe('false');
    const saved = stub.store.get('settings') as Settings;
    expect(saved.quillEffect).toBe(false);
    // Cờ hiệu ứng được áp lên <html> ngay khi update (optimistic).
    expect(document.documentElement.dataset.quill).toBe('off');
  });

  it('chọn "Tự động" trong Chế độ hiển thị → lưu displayMode="auto"', async () => {
    const React = await getReact();
    stub.seed({ settings: { ...DEFAULT_SETTINGS, displayMode: 'popup' } });
    const el = await renderPanel();

    const radios = [
      ...el.querySelectorAll(
        '[role="group"][aria-label="Chế độ hiển thị"] [role="radio"]'
      ),
    ] as HTMLButtonElement[];
    const auto = radios.find((radio) => radio.textContent === 'Tự động');
    if (!auto) throw new Error('Không tìm thấy lựa chọn "Tự động"');
    expect(auto.getAttribute('aria-checked')).toBe('false');

    await React.act(async () => {
      auto.click();
      await flush();
    });

    expect(auto.getAttribute('aria-checked')).toBe('true');
    const saved = stub.store.get('settings') as Settings;
    expect(saved.displayMode).toBe('auto');
  });

  it('cờ hiệu ứng mặc định ngay lần render đầu: quill=on, quillStyle=pen', async () => {
    await renderPanel();

    expect(document.documentElement.dataset.quill).toBe('on');
    expect(document.documentElement.dataset.quillStyle).toBe('pen');
  });
});

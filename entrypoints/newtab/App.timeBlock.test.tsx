/**
 * R-24 — New Tab integration cho thời khoá biểu: chỉ New Tab render, thứ tự
 * giờ + nhóm cuối, kéo snap 15′, bàn phím/ô nhập đổi giờ, cảnh báo chồng lấn
 * và a11y. DOM + storage thật (chrome stub), không snapshot.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from '../../src/__tests__/helpers/chrome-stub';
import { DEFAULT_SETTINGS, SETTINGS_KEY, TASK_KEY_PREFIX, type Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function taskFixture(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Việc ${id}`,
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

let stub: ChromeStub;
let cleanup: (() => Promise<void>) | null = null;

async function mount(which: 'newtab' | 'popup' = 'newtab'): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import(
    which === 'newtab' ? '../../entrypoints/newtab/App' : '../../entrypoints/popup/App'
  );
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(App));
  });
  await React.act(async () => {
    await flush();
    await flush();
  });
  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return container;
}

async function keyOn(element: Element, key: string): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await flush();
  });
  await React.act(async () => {
    await flush();
  });
}

async function pointer(element: Element, type: string, clientY: number): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientY }));
    await flush();
  });
}

function saved(id: string): Task {
  return stub.store.get(`${TASK_KEY_PREFIX}${id}`) as Task;
}

function blockFor(container: HTMLElement, id: string): HTMLElement {
  const block = container.querySelector(`[data-section="time-block"] [data-task-id="${id}"]`);
  if (!block) throw new Error(`Không tìm thấy block ${id}`);
  return block as HTMLElement;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  stub.seed({ [SETTINGS_KEY]: { ...DEFAULT_SETTINGS } });
  cleanup = null;
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  document.body.innerHTML = '';
});

describe('R-24 — timeline New Tab: phạm vi, thứ tự, nhóm cuối', () => {
  it('chỉ render ở New Tab; popup giữ nguyên số khối UI', async () => {
    const newtab = await mount('newtab');
    expect(newtab.querySelector('[data-section="time-block"]')).not.toBeNull();
    if (cleanup) await cleanup();
    cleanup = null;
    document.body.innerHTML = '';

    const popup = await mount('popup');
    expect(popup.querySelector('[data-section="time-block"]')).toBeNull();
  });

  it('R-25: khung 00:00–24:00, mọi giờ hợp lệ lên trước; chỉ việc không giờ xuống cuối', async () => {
    stub.seed({
      [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '09:00' }),
      [`${TASK_KEY_PREFIX}b`]: taskFixture('b', { startAt: '07:30' }),
      [`${TASK_KEY_PREFIX}c`]: taskFixture('c'),
      [`${TASK_KEY_PREFIX}d`]: taskFixture('d', { startAt: '03:15' }),
    });

    const container = await mount();
    const section = container.querySelector('[data-section="time-block"]')!;
    expect(section.textContent).toContain('00:00');
    expect(section.textContent).toContain('24:00');

    const ids = [...section.querySelectorAll('[data-task-id]')].map(
      (node) => (node as HTMLElement).dataset.taskId
    );
    // R-25: 03:15 là giờ trong khung; chỉ việc không giờ ("c") ở nhóm cuối.
    expect(ids).toEqual(['d', 'b', 'a', 'c']);

    const tail = section.querySelector('.timeline-tail')!;
    expect(tail.textContent).toContain('Chưa xếp giờ');
    expect(tail.textContent).not.toContain('03:15');
  });

  it('mỗi block có nhãn, nút focusable và live region cho screen reader', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    const handle = blockFor(container, 'a').querySelector('button')!;
    expect(handle.getAttribute('aria-label')).toContain('08:00');
    expect(handle.getAttribute('aria-label')).toContain('mũi tên');
    expect(container.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
  });
});

describe('R-24 — đổi giờ: bàn phím, ô nhập, kéo', () => {
  it('mũi tên dời 15′: đúng 1 put, chỉ startAt đổi; plannedFor/dueAt/habit/alarm giữ nguyên', async () => {
    const before = taskFixture('a', {
      startAt: '08:00',
      estimateMin: 30,
      plannedFor: '2026-11-19',
      dueAt: '2026-12-01T09:00',
      habit: { startedAt: '2026-01-01T00:00:00.000Z', doneDays: [] },
    });
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: before });
    const container = await mount();
    const alarmBefore = stub.alarms.get('due:a');
    expect(alarmBefore).toBeDefined();
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    setSpy.mockClear();

    await keyOn(blockFor(container, 'a').querySelector('button')!, 'ArrowUp');

    expect(saved('a').startAt).toBe('08:15');
    expect(saved('a').plannedFor).toBe(before.plannedFor);
    expect(saved('a').dueAt).toBe(before.dueAt);
    expect(saved('a').habit).toEqual(before.habit);
    expect(stub.alarms.get('due:a')).toEqual(alarmBefore);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(setSpy.mock.calls[0][0] as object)).toEqual([`${TASK_KEY_PREFIX}a`]);
  });

  it('Home/End clamp về 00:00 / 23:45', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    const handle = blockFor(container, 'a').querySelector('button')!;

    await keyOn(handle, 'Home');
    expect(saved('a').startAt).toBe('00:00');
    await keyOn(handle, 'End');
    expect(saved('a').startAt).toBe('23:45');
  });

  it('ô nhập HH:mm đổi giờ trực tiếp', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    const input = blockFor(container, 'a').querySelector('input[type="time"]') as HTMLInputElement;
    const React = await import('react');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    await React.act(async () => {
      setter.call(input, '10:30');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
    });
    await React.act(async () => {
      await flush();
    });

    expect(saved('a').startAt).toBe('10:30');
  });

  it('kéo block 45px = +30 phút, snap 15′, đúng 1 put', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    const handle = blockFor(container, 'a').querySelector('button')!;
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    setSpy.mockClear();

    await pointer(handle, 'pointerdown', 100);
    await pointer(handle, 'pointermove', 145); // 45px = 22.5′ → snap 08:30
    await pointer(handle, 'pointerup', 145);
    await flush();

    expect(saved('a').startAt).toBe('08:30');
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(setSpy.mock.calls[0][0] as object)).toEqual([`${TASK_KEY_PREFIX}a`]);
  });
});

describe('R-24/R-25 — biên: vượt 24:00, estimate ngoài range, kéo giờ sớm', () => {
  it('23:00 + 240′: vẽ tới 24:00 rồi dừng, hiện nhãn "Vượt khung", không sửa dữ liệu', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}g`]: taskFixture('g', { startAt: '23:00', estimateMin: 240 }) });
    const container = await mount();
    const block = blockFor(container, 'g');
    expect(parseFloat((block as HTMLElement).style.height)).toBe(120); // 60′ × 2px
    expect(block.textContent).toContain('Vượt khung');
    expect(saved('g').estimateMin).toBe(240); // KHÔNG tự đổi dữ liệu
  });

  it('estimateMin=300 đã lưu: giữ giá trị nhưng kẹp chiều cao 240′ (480px)', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}h`]: taskFixture('h', { startAt: '08:00', estimateMin: 300 }) });
    const container = await mount();
    const block = blockFor(container, 'h') as HTMLElement;
    expect(parseFloat(block.style.height)).toBe(480); // 240′ × 2px, không phải 600
    expect(block.querySelector('button')!.getAttribute('aria-label')).toContain('đã kẹp');
    expect(saved('h').estimateMin).toBe(300);
  });

  it('kéo block 03:00 (đã nằm trong khung R-25) tới 11:00: snap 15′, chỉ đổi giờ', async () => {
    const before = taskFixture('c', {
      startAt: '03:00',
      plannedFor: '2026-11-19',
      dueAt: '2026-12-01T09:00',
    });
    stub.seed({ [`${TASK_KEY_PREFIX}c`]: before });
    const container = await mount();
    const handle = blockFor(container, 'c').querySelector('button')!;
    const alarmBefore = stub.alarms.get('due:c');
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    setSpy.mockClear();

    await pointer(handle, 'pointerdown', 100);
    await pointer(handle, 'pointermove', 1060); // +960px / 2px mỗi phút = +480′ → 11:00
    await pointer(handle, 'pointerup', 1060);
    await flush();

    expect(saved('c').startAt).toBe('11:00');
    expect(saved('c').plannedFor).toBe(before.plannedFor);
    expect(saved('c').dueAt).toBe(before.dueAt);
    expect(stub.alarms.get('due:c')).toEqual(alarmBefore);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });
});

describe('R-24 — chồng lấn: cảnh báo nhưng vẫn lưu', () => {
  it('cả 2 block có chữ "Chồng lấn"; kéo vẫn ghi startAt mới, không sửa block kia', async () => {
    stub.seed({
      [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00', estimateMin: 30 }),
      [`${TASK_KEY_PREFIX}b`]: taskFixture('b', { startAt: '08:15', estimateMin: 30 }),
    });
    const container = await mount();

    expect(blockFor(container, 'a').textContent).toContain('Chồng lấn');
    expect(blockFor(container, 'b').textContent).toContain('Chồng lấn');

    const handle = blockFor(container, 'a').querySelector('button')!;
    await keyOn(handle, 'ArrowDown');
    expect(saved('a').startAt).toBe('07:45');
    expect(saved('b').startAt).toBe('08:15'); // KHÔNG tự dời block kia
  });

  it('chạm biên (08:30 sau block 08:00/30′) không hiện cảnh báo', async () => {
    stub.seed({
      [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00', estimateMin: 30 }),
      [`${TASK_KEY_PREFIX}b`]: taskFixture('b', { startAt: '08:30', estimateMin: 30 }),
    });
    const container = await mount();
    expect(blockFor(container, 'a').textContent).not.toContain('Chồng lấn');
    expect(blockFor(container, 'b').textContent).not.toContain('Chồng lấn');
  });
});

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

async function fire(element: Element, type: string, init: MouseEventInit = {}): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
    await flush();
  });
}

async function click(element: Element): Promise<void> {
  await fire(element, 'click');
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

describe('R-25 — New Tab: popup neo con trỏ, kéo tạo, fullscreen', () => {
  it('không còn Composer dưới bảng; right-click mở popup TẠO với giờ trống', async () => {
    const container = await mount();
    expect(container.querySelector('[aria-label="Ghi việc vào sổ"]')).toBeNull();

    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'contextmenu', { clientX: 140, clientY: 220 });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).not.toBeNull();
    expect(dialog!.dataset.mode).toBe('create');
    expect((dialog!.querySelector('input[aria-label="Giờ bắt đầu"]') as HTMLInputElement).value).toBe('');
    expect((dialog!.querySelector('input[aria-label="Giờ kết thúc"]') as HTMLInputElement).value).toBe('');
    expect(dialog!.querySelector('input[type="datetime-local"]')).toBeNull(); // không có hạn chót
    expect(dialog!.textContent).not.toContain('Lặp lại');
  });

  it('kéo trên vùng trống → popup TẠO điền sẵn start→end đã snap 15′', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;

    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.dataset.mode).toBe('create');
    expect((dialog.querySelector('input[aria-label="Giờ bắt đầu"]') as HTMLInputElement).value).toBe('01:00');
    expect((dialog.querySelector('input[aria-label="Giờ kết thúc"]') as HTMLInputElement).value).toBe('02:00');
  });

  it('kéo vùng trống hiện ghost chữ nhật mờ, giữ nguyên khi popup TẠO mở', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;

    await fire(canvas, 'pointerdown', { clientY: 120 });
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();

    await fire(canvas, 'pointermove', { clientY: 240 });
    const ghost = container.querySelector('[data-testid="timeline-create-ghost"]') as HTMLElement;
    expect(ghost).not.toBeNull();
    expect(ghost.style.top).toBe('120px');
    expect(ghost.style.height).toBe('120px');
    expect(ghost.textContent).toContain('01:00–02:00');
    expect(ghost.textContent).toContain('1h');
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.className).toContain('timeline-create-ghost--label-bottom');

    await fire(canvas, 'pointerup', { clientY: 240 });
    const behindPopup = container.querySelector(
      '[data-testid="timeline-create-ghost"]'
    ) as HTMLElement;
    expect(container.querySelector('[role="dialog"]')?.getAttribute('data-mode')).toBe('create');
    expect(behindPopup).not.toBeNull();
    expect(behindPopup.style.top).toBe('120px');
    expect(behindPopup.style.height).toBe('120px');
    expect(behindPopup.textContent).toContain('01:00–02:00');
  });

  it('BUG-003: popup đang mở, di chuột qua canvas không làm ghost đổi vị trí', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });

    const before = container.querySelector(
      '[data-testid="timeline-create-ghost"]'
    ) as HTMLElement;
    expect(before.style.top).toBe('120px');
    expect(before.style.height).toBe('120px');
    expect(before.textContent).toContain('01:00–02:00');

    await fire(canvas, 'pointermove', { clientY: 600 });

    const after = container.querySelector('[data-testid="timeline-create-ghost"]') as HTMLElement;
    expect(after.style.top).toBe('120px');
    expect(after.style.height).toBe('120px');
    expect(after.textContent).toContain('01:00–02:00');

    await fire(canvas, 'pointerdown', { clientY: 900 });
    const afterDown = container.querySelectorAll('[data-testid="timeline-create-ghost"]');
    expect(afterDown).toHaveLength(1);
    expect((afterDown[0] as HTMLElement).style.top).toBe('120px');
    expect((afterDown[0] as HTMLElement).style.height).toBe('120px');
  });

  it('đóng popup clean (nút ×) → ghost biến mất', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).not.toBeNull();

    await click(container.querySelector('button[aria-label="Đóng hộp việc"]')!);

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();
  });

  it('sửa giờ trong popup → ghost vẫn giữ khoảng lúc kéo (neo thị giác)', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    const start = dialog.querySelector('input[aria-label="Giờ bắt đầu"]') as HTMLInputElement;
    const React = await import('react');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    await React.act(async () => {
      setter.call(start, '03:00');
      start.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
    });

    const ghost = container.querySelector('[data-testid="timeline-create-ghost"]') as HTMLElement;
    expect(ghost.textContent).toContain('01:00–02:00');
    expect(ghost.textContent).not.toContain('03:00');
    expect(ghost.style.top).toBe('120px');
  });

  it('popup dirty → Esc hỏi xác nhận, ghost còn; chọn Bỏ thì ghost mất', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    const title = dialog.querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement;
    const React = await import('react');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    await React.act(async () => {
      setter.call(title, 'Việc nháp');
      title.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
    });

    await keyOn(document.body, 'Escape');
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).not.toBeNull();

    const confirm = container.querySelector('[role="alertdialog"]') as HTMLElement;
    const discard = [...confirm.querySelectorAll('button')].find(
      (node) => node.textContent?.trim() === 'Bỏ'
    )!;
    await click(discard);

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();
  });

  it('right-click tạo và popup sửa không hồi sinh ghost', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();

    await fire(container.querySelector('.timeline-canvas')!, 'contextmenu', {
      clientX: 140,
      clientY: 220,
    });
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();
    await click(container.querySelector('button[aria-label="Đóng hộp việc"]')!);

    const handle = blockFor(container, 'a').querySelector('button')!;
    await pointer(handle, 'pointerdown', 100);
    await pointer(handle, 'pointerup', 100);
    expect(container.querySelector('[role="dialog"]')?.getAttribute('data-mode')).toBe('edit');
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();
  });

  it('popup sạch: Esc đóng ngay + ghost mất; phím n mở tạo không có ghost', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });

    await keyOn(document.body, 'Escape');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();

    await keyOn(document.body, 'n');
    expect(container.querySelector('[role="dialog"]')?.getAttribute('data-mode')).toBe('create');
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();
  });

  it('kéo ngược lên: ghost vẫn tính từ mốc sớm hơn, nhãn ở cạnh trên', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;

    await fire(canvas, 'pointerdown', { clientY: 240 });
    await fire(canvas, 'pointermove', { clientY: 120 });

    const ghost = container.querySelector('[data-testid="timeline-create-ghost"]') as HTMLElement;
    expect(ghost.style.top).toBe('120px');
    expect(ghost.style.height).toBe('120px');
    expect(ghost.textContent).toContain('01:00–02:00');
    expect(ghost.className).not.toContain('timeline-create-ghost--label-bottom');
  });

  it('kéo tới 24:00: ghost kết thúc 00:00 và cao tối thiểu 15′', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;

    await fire(canvas, 'pointerdown', { clientY: 2860 }); // 23:45
    await fire(canvas, 'pointermove', { clientY: 3000 });

    const ghost = container.querySelector('[data-testid="timeline-create-ghost"]') as HTMLElement;
    expect(ghost.style.top).toBe('2850px');
    expect(ghost.style.height).toBe('30px');
    expect(ghost.textContent).toContain('23:45–00:00');
  });

  it('right-click TRÊN BLOCK mở popup SỬA (không phải tạo)', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    const block = blockFor(container, 'a');

    await fire(block, 'contextmenu', { clientX: 200, clientY: 120 });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.dataset.mode).toBe('edit');
    expect((dialog.querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement).value).toBe('Việc a');
  });

  it('right-click trong popup đang mở không đổi mode (không tạo bản trùng)', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    await fire(blockFor(container, 'a'), 'contextmenu', { clientX: 200, clientY: 120 });

    const before = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(before.dataset.mode).toBe('edit');
    await fire(before, 'contextmenu', { clientX: 260, clientY: 160 });

    const after = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(after.dataset.mode).toBe('edit');
    expect((after.querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement).value).toBe('Việc a');
  });

  it('click block (không di chuyển) mở popup SỬA; hold+move vẫn dời giờ', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}a`]: taskFixture('a', { startAt: '08:00' }) });
    const container = await mount();
    const handle = blockFor(container, 'a').querySelector('button')!;

    await pointer(handle, 'pointerdown', 100);
    await pointer(handle, 'pointerup', 100);

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.dataset.mode).toBe('edit');
    expect((dialog.querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement).value).toBe('Việc a');
  });

  it('nút phóng to chiếm toàn tab, bấm lại thu về', async () => {
    const container = await mount();
    const section = container.querySelector('[data-section="time-block"]')!;
    const expand = container.querySelector('button[aria-label="Phóng to thời khoá biểu"]')!;

    await click(expand);
    expect(section.className).toContain('timeline--fullscreen');

    const collapse = container.querySelector('button[aria-label="Thu nhỏ thời khoá biểu"]')!;
    await click(collapse);
    expect(section.className).not.toContain('timeline--fullscreen');
  });

  it('Esc thoát fullscreen khi không có popup mở', async () => {
    const container = await mount();
    const section = container.querySelector('[data-section="time-block"]')!;
    await click(container.querySelector('button[aria-label="Phóng to thời khoá biểu"]')!);
    expect(section.className).toContain('timeline--fullscreen');

    await keyOn(document.body, 'Escape');
    expect(section.className).not.toContain('timeline--fullscreen');
  });

  it('ghi từ popup tạo việc mới có startAt/endAt, không key storage mới', async () => {
    const container = await mount();
    const canvas = container.querySelector('.timeline-canvas')!;
    await fire(canvas, 'pointerdown', { clientY: 120 });
    await fire(canvas, 'pointermove', { clientY: 240 });
    await fire(canvas, 'pointerup', { clientY: 240 });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    const title = dialog.querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement;
    const React = await import('react');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    await React.act(async () => {
      setter.call(title, 'Việc từ timeline');
      title.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
    });
    const save = [...dialog.querySelectorAll('button')].find(
      (node) => node.textContent?.trim() === 'Ghi vào sổ'
    )!;
    await click(save);
    await flush();

    const created = [...stub.store.values()].find(
      (value) => (value as Task).title === 'Việc từ timeline'
    ) as Task | undefined;
    expect(created).toBeDefined();
    expect(created!.startAt).toBe('01:00');
    expect(created!.endAt).toBe('02:00');
    expect(created!.estimateMin).toBe(60);
    expect(container.querySelector('[data-testid="timeline-create-ghost"]')).toBeNull();
  });
});

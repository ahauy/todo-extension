/**
 * R-26 — Bảng "Sắp xếp công việc": 4 ô R-05, kéo thả Q2→Q1 với đúng 1 put
 * copy-then-patch, highlight ô đích, quota rollback + inline error, bàn phím,
 * focus mode và không khoá storage mới. DOM + chrome stub thật, không snapshot.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from '../../src/__tests__/helpers/chrome-stub';
import {
  DEFAULT_SETTINGS,
  POMODORO_KEY,
  SETTINGS_KEY,
  TASK_KEY_PREFIX,
  type PomodoroState,
  type Task,
} from '../../lib/tasks/types';
import { StorageQuotaError } from '../../lib/storage/adapter';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Việc ${id}`,
    note: 'ghi chú',
    priority: 'important-not-urgent',
    dueAt: '2026-12-01T08:00',
    recurrence: { kind: 'none' },
    tags: ['toan'],
    subtasks: [],
    done: false,
    keystone: false,
    archived: false,
    plannedFor: '2026-11-24',
    startAt: '08:00',
    endAt: '09:30',
    estimateMin: 90,
    habit: { startedAt: '2026-01-01T00:00:00.000Z', doneDays: ['2026-01-02'] },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const activeState = (taskId: string): PomodoroState => ({
  phase: 'focus',
  running: true,
  endsAt: Date.now() + 600_000,
  remaining: 600_000,
  taskId,
  interruptions: 0,
});

let stub: ChromeStub;
let cleanup: (() => Promise<void>) | null = null;
let originalElementFromPoint: typeof document.elementFromPoint | undefined;

function stubDropCell(cell: Element | null): void {
  document.elementFromPoint = (() => cell) as typeof document.elementFromPoint;
}

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
    await flush();
  });
}

async function mountApp(): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('./App');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(App));
  });
  await act(async () => {
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

async function mountBoard(
  props: {
    tasks: Task[];
    disabled?: boolean;
    onAssign?: (task: Task) => Promise<void>;
    onClose?: () => void;
  }
) {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: PriorityBoard } = await import('../../components/PriorityBoard');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const onAssign = props.onAssign ?? vi.fn().mockResolvedValue(undefined);
  const onClose = props.onClose ?? vi.fn();
  let current = {
    tasks: props.tasks,
    disabled: props.disabled,
    onAssign,
    onClose,
  };
  await React.act(async () => {
    root.render(React.createElement(PriorityBoard, current));
  });
  await act(async () => {
    await flush();
  });
  const rerender = async (
    next: Partial<typeof current>
  ) => {
    current = { ...current, ...next };
    await React.act(async () => {
      root.render(React.createElement(PriorityBoard, current));
    });
    await act(async () => {
      await flush();
    });
  };
  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return { container, onAssign, onClose, rerender };
}

async function fire(element: Element, type: string, init: MouseEventInit = {}): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
  });
}

async function click(element: Element): Promise<void> {
  await fire(element, 'click');
}

async function key(element: Element, value: string): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));
  });
}

function launch(container: HTMLElement): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>('.priority-board-launch-btn');
  if (!button) throw new Error('Không tìm thấy nút Sắp xếp công việc');
  return button;
}

function cell(container: HTMLElement, priority: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-priority-cell="${priority}"]`);
  if (!node) throw new Error(`Không tìm thấy ô ${priority}`);
  return node;
}

function card(container: HTMLElement, id: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-task-id="${id}"]`);
  if (!node) throw new Error(`Không tìm thấy thẻ ${id}`);
  return node;
}

async function dragCard(from: HTMLElement, to: HTMLElement): Promise<void> {
  stubDropCell(to);
  await fire(from, 'pointerdown', { clientX: 0, clientY: 0 });
  await fire(from, 'pointermove', { clientX: 20, clientY: 20 });
  await fire(from, 'pointerup', { clientX: 20, clientY: 20 });
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  stub.seed({ [SETTINGS_KEY]: { ...DEFAULT_SETTINGS } });
  cleanup = null;
  originalElementFromPoint = document.elementFromPoint;
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  document.elementFromPoint = originalElementFromPoint as typeof document.elementFromPoint;
  document.body.innerHTML = '';
});

describe('R-26 — nút và 4 ô ma trận', () => {
  it('nút nằm cạnh FilterRow trên New Tab, mở panel đúng 4 nhãn R-05', async () => {
    const container = await mountApp();
    const button = launch(container);
    expect(button.textContent).toContain('Ma trận ưu tiên');
    expect(container.querySelector('.priority-board-launch .filter-line')).not.toBeNull();
    expect(container.querySelector('[data-priority-board]')).toBeNull();

    await click(button);
    const panel = container.querySelector('[data-priority-board]');
    expect(panel).not.toBeNull();
    const cells = Array.from(panel!.querySelectorAll('[data-priority-cell]'));
    expect(cells).toHaveLength(4);
    expect(cells.map((node) => node.getAttribute('data-priority-cell'))).toEqual([
      'important-urgent',
      'important-not-urgent',
      'not-important-urgent',
      'not-important-not-urgent',
    ]);
    expect(cells.map((node) => node.textContent)).toEqual([
      expect.stringContaining('Quan trọng, cấp bách'),
      expect.stringContaining('Quan trọng, không cấp bách'),
      expect.stringContaining('Không quan trọng, cấp bách'),
      expect.stringContaining('Không quan trọng, không cấp bách'),
    ]);
  });

  it('bao gồm task priority 3 mức cũ đã hydrate; archived bị loại', async () => {
    stub.seed({
      't:legacy': fixture('legacy', { priority: 'important-not-urgent' }),
      't:cut': fixture('cut', { priority: 'important-urgent', archived: true }),
    });
    const container = await mountApp();
    await click(launch(container));
    const panel = container.querySelector<HTMLElement>('[data-priority-board]')!;
    expect(panel.querySelector('[data-task-id="legacy"]')).not.toBeNull();
    expect(panel.querySelector('[data-task-id="cut"]')).toBeNull();
  });
});

describe('R-26 — kéo thả: 1 put copy-then-patch, highlight, quota', () => {
  it('kéo Q2→Q1: priority đích, đúng 1 put, mọi field khác giữ nguyên, không key mới', async () => {
    const before = fixture('q2');
    stub.seed({ 't:q2': before });
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    const container = await mountApp();
    await click(launch(container));
    const panel = container.querySelector<HTMLElement>('[data-priority-board]')!;

    await dragCard(card(panel, 'q2'), cell(panel, 'important-urgent'));

    const stored = stub.store.get(`${TASK_KEY_PREFIX}q2`) as Task;
    expect(stored.priority).toBe('important-urgent');
    for (const key of [
      'dueAt', 'startAt', 'endAt', 'plannedFor', 'archived', 'habit', 'estimateMin',
      'keystone', 'tags', 'done', 'note', 'createdAt', 'id', 'title',
    ] as const) {
      expect(stored[key]).toEqual(before[key]);
    }
    const taskWrites = setSpy.mock.calls.filter((call) =>
      Object.keys(call[0] as Record<string, unknown>).some((key) =>
        key.startsWith(TASK_KEY_PREFIX)
      )
    );
    expect(taskWrites).toHaveLength(1);
    expect(Array.from(stub.store.keys()).sort()).toEqual(
      [SETTINGS_KEY, `${TASK_KEY_PREFIX}q2`].sort()
    );
  });

  it('ô đang trỏ nổi bật trong lúc kéo rồi tắt khi thả', async () => {
    const { container } = await mountBoard({ tasks: [fixture('q2')] });
    const q2 = cell(container, 'important-not-urgent');
    const q1 = cell(container, 'important-urgent');
    stubDropCell(q1);
    await fire(card(container, 'q2'), 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(card(container, 'q2'), 'pointermove', { clientX: 20, clientY: 20 });
    expect(q1.getAttribute('data-drop-target')).toBe('true');
    expect(q1.classList.contains('priority-cell--drop')).toBe(true);
    expect(q2.getAttribute('data-drop-target')).toBeNull();

    await fire(card(container, 'q2'), 'pointerup', { clientX: 20, clientY: 20 });
    expect(q1.getAttribute('data-drop-target')).toBeNull();
  });

  it('pointercancel clears drag state and drop highlight without assigning', async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const { container } = await mountBoard({ tasks: [fixture('q2')], onAssign });
    const q1 = cell(container, 'important-urgent');
    stubDropCell(q1);
    const target = card(container, 'q2');
    await fire(target, 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(target, 'pointermove', { clientX: 20, clientY: 20 });
    expect(q1.getAttribute('data-drop-target')).toBe('true');

    await fire(target, 'pointercancel', { clientX: 20, clientY: 20 });
    expect(q1.getAttribute('data-drop-target')).toBeNull();
    expect(q1.classList.contains('priority-cell--drop')).toBe(false);
    expect(onAssign).not.toHaveBeenCalled();
  });

  it('click thường (dưới ngưỡng) không đổi priority', async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const { container } = await mountBoard({ tasks: [fixture('q2')], onAssign });
    await dragCard(card(container, 'q2'), cell(container, 'important-urgent'));
    expect(onAssign).toHaveBeenCalledTimes(1);
    onAssign.mockClear();

    const target = card(container, 'q2');
    stubDropCell(cell(container, 'important-urgent'));
    await fire(target, 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(target, 'pointerup', { clientX: 2, clientY: 2 });
    expect(onAssign).not.toHaveBeenCalled();
  });

  it('quota: hoàn tác priority trong bộ nhớ, lỗi inline, không toast', async () => {
    stub.seed({ 't:q2': fixture('q2') });
    const container = await mountApp();
    await click(launch(container));
    const panel = container.querySelector<HTMLElement>('[data-priority-board]')!;
    const runtime = chrome.runtime as { lastError: { message: string } | null };
    runtime.lastError = { message: 'QUOTA_BYTES exceeded' };
    await dragCard(card(panel, 'q2'), cell(panel, 'important-urgent'));
    runtime.lastError = null;

    expect(panel.querySelector('[data-priority-error]')?.textContent).toContain('Không lưu được');
    expect(cell(panel, 'important-not-urgent').querySelector('[data-task-id="q2"]')).not.toBeNull();
    expect(cell(panel, 'important-urgent').querySelector('[data-task-id="q2"]')).toBeNull();
    expect(container.querySelector('.toast-reminder')).toBeNull();
  });

  it('StorageQuotaError từ onAssign: rollback + lỗi inline trong panel', async () => {
    const onAssign = vi
      .fn()
      .mockRejectedValue(new StorageQuotaError('QUOTA_BYTES exceeded'));
    const { container } = await mountBoard({ tasks: [fixture('q2')], onAssign });
    await dragCard(card(container, 'q2'), cell(container, 'important-urgent'));
    expect(onAssign).toHaveBeenCalledTimes(1);
    expect(cell(container, 'important-not-urgent').querySelector('[data-task-id="q2"]')).not.toBeNull();
    expect(container.querySelector('[data-priority-error]')?.getAttribute('role')).toBe('alert');
  });
});

describe('R-26 — bàn phím, Esc, focus mode', () => {
  it('chọn thẻ bằng click, mũi tên tới ô, Enter/click ô gán + aria-live', async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const { container } = await mountBoard({ tasks: [fixture('q2')], onAssign });
    const target = card(container, 'q2');
    await click(target);
    expect(target.getAttribute('aria-pressed')).toBe('true');

    await key(target, 'ArrowRight');
    expect(document.activeElement?.getAttribute('data-cell-assign')).toBe('important-urgent');
    const assignQ1 = container.querySelector<HTMLButtonElement>(
      '[data-cell-assign="important-urgent"]'
    )!;
    await click(assignQ1);
    expect(onAssign).toHaveBeenCalledTimes(1);
    const payload = onAssign.mock.calls[0][0] as Task;
    expect(payload.priority).toBe('important-urgent');
    expect(payload.plannedFor).toBe('2026-11-24');
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Quan trọng, cấp bách');
  });

  it('Esc đóng panel, không mở tìm kiếm (thứ tự panel → search/menu)', async () => {
    const container = await mountApp();
    await click(launch(container));
    expect(container.querySelector('[data-priority-board]')).not.toBeNull();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('[data-priority-board]')).toBeNull();
    expect(container.querySelector('.search-field')).toBeNull();
  });

  it('re-render kiểu App (tasks/onClose mới) không giật focus khỏi thẻ đang chọn', async () => {
    const { container, rerender } = await mountBoard({
      tasks: [fixture('q2'), fixture('q3')],
    });
    const selected = card(container, 'q2');
    selected.focus();
    expect(document.activeElement).toBe(selected);

    // Mô phỏng App re-render: tasks array mới + onClose identity mới (inline
    // callback như trước khi sửa) — focus chỉ được đặt lúc mount, không bị giật.
    await rerender({
      tasks: [fixture('q2'), fixture('q3', { title: 'Việc q3 mới' })],
      onClose: vi.fn(),
    });
    expect(document.activeElement).toBe(selected);
  });

  it('focus quay lại nút mở panel sau khi đóng bằng Esc', async () => {
    const container = await mountApp();
    const button = launch(container);
    button.focus();
    expect(document.activeElement).toBe(button);

    await click(button);
    const panel = container.querySelector<HTMLElement>('[data-priority-board]')!;
    expect(panel).not.toBeNull();
    expect(panel.contains(document.activeElement)).toBe(true);

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('[data-priority-board]')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('focusActive vô hiệu nút mở panel và mọi gesture trong panel', async () => {
    stub.seed({ 't:q2': fixture('q2') });
    stub.localStore.set(POMODORO_KEY, activeState('q2'));
    const container = await mountApp();
    expect(launch(container).disabled).toBe(true);
    await click(launch(container));
    expect(container.querySelector('[data-priority-board]')).toBeNull();

    if (cleanup) await cleanup();
    cleanup = null;
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const board = await mountBoard({ tasks: [fixture('q2')], disabled: true, onAssign });
    await dragCard(card(board.container, 'q2'), cell(board.container, 'important-urgent'));
    expect(onAssign).not.toHaveBeenCalled();
    expect(board.container.querySelector('[data-priority-board]')?.getAttribute('data-disabled')).toBe('true');
  });
});

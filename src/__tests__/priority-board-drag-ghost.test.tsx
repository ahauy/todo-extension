/**
 * FEAT-007 / R-26 — regression tests for the drag ghost, hit-test isolation
 * and no-fallback drop. All three groups are fail-before-fix: the pre-fix
 * PriorityBoard never renders a ghost and falls back to the last target.
 *
 * The hit-test test uses a REAL ghost element rendered by the component and a
 * jsdom hit-test shim that reads the rendered nodes' computed pointer-events
 * instead of returning a canned cell — it proves `pointer-events: none` keeps
 * the underlying cell detectable.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PriorityBoard from '../../components/PriorityBoard';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((done) => setTimeout(done, 0));
const roots: Root[] = [];
let originalElementFromPoint: typeof document.elementFromPoint;

function fixture(id: string, priority: Task['priority'] = 'important-not-urgent'): Task {
  return {
    id,
    title: `Việc ${id}`,
    note: '',
    priority,
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    keystone: false,
    archived: false,
    plannedFor: null,
    startAt: undefined,
    endAt: undefined,
    estimateMin: undefined,
    habit: undefined,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

async function mount(
  tasks: Task[],
  onAssign: (task: Task) => Promise<void> = vi.fn().mockResolvedValue(undefined)
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(React.createElement(PriorityBoard, { tasks, onAssign, onClose: vi.fn() }));
    await flush();
  });
  return { container, onAssign };
}

function fire(element: Element, type: string, init: MouseEventInit = {}): Promise<void> {
  return act(async () => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
    await flush();
  });
}

function card(container: HTMLElement, id: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-task-id="${id}"]`);
  if (!node) throw new Error(`Không tìm thấy thẻ ${id}`);
  return node;
}

function cell(container: HTMLElement, priority: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-priority-cell="${priority}"]`);
  if (!node) throw new Error(`Không tìm thấy ô ${priority}`);
  return node;
}

function stubElementFromPoint(target: Element | null): void {
  document.elementFromPoint = (() => target) as typeof document.elementFromPoint;
}

/**
 * jsdom has no layout, so this is a minimal hit-test shim that emulates what a
 * browser does with `elementsFromPoint`: collect the REAL rendered nodes that
 * sit at the pointer (ghost on top, then cells) and return the topmost one that
 * is not `pointer-events: none`. The ghost/cells and their styles come from the
 * mounted DOM — this is not a canned return value.
 */
function installDomAwareHitTest(): void {
  document.elementFromPoint = (() => {
    const candidates: Element[] = [];
    const ghost = document.querySelector('[data-drag-ghost]');
    if (ghost) candidates.push(ghost);
    document.querySelectorAll('[data-priority-cell]').forEach((node) => candidates.push(node));
    for (const candidate of candidates) {
      const pointerEvents =
        window.getComputedStyle(candidate).pointerEvents ||
        (candidate as HTMLElement).style.pointerEvents;
      if (pointerEvents !== 'none') return candidate;
    }
    return null;
  }) as typeof document.elementFromPoint;
}

beforeEach(() => {
  originalElementFromPoint = document.elementFromPoint;
  document.body.innerHTML = '';
});

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.elementFromPoint = originalElementFromPoint;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('FEAT-007 — ghost bám theo con trỏ', () => {
  it('render ghost của đúng thẻ và cập nhật translate3d sau mỗi pointermove', async () => {
    const { container } = await mount([fixture('q2')]);
    const target = card(container, 'q2');

    await fire(target, 'pointerdown', { clientX: 0, clientY: 0 });
    expect(container.querySelector('[data-drag-ghost]')).toBeNull();

    await fire(target, 'pointermove', { clientX: 20, clientY: 15 });
    const ghost = container.querySelector<HTMLElement>('[data-drag-ghost]');
    expect(ghost).not.toBeNull();
    expect(ghost!.textContent).toContain('Việc q2');
    expect(ghost!.style.transform).toBe('translate3d(20px, 15px, 0)');

    await fire(target, 'pointermove', { clientX: 90, clientY: 60 });
    expect(ghost!.style.transform).toBe('translate3d(90px, 60px, 0)');
  });

  it('dọn ghost khi thả, huỷ và lostpointercapture', async () => {
    const { container } = await mount([fixture('q2')]);
    stubElementFromPoint(cell(container, 'important-urgent'));

    // Successful drop — card moves to another cell, so re-query it afterwards.
    await fire(card(container, 'q2'), 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(card(container, 'q2'), 'pointermove', { clientX: 20, clientY: 20 });
    expect(container.querySelector('[data-drag-ghost]')).not.toBeNull();
    await fire(card(container, 'q2'), 'pointerup', { clientX: 20, clientY: 20 });
    expect(container.querySelector('[data-drag-ghost]')).toBeNull();

    // pointercancel.
    await fire(card(container, 'q2'), 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(card(container, 'q2'), 'pointermove', { clientX: 20, clientY: 20 });
    expect(container.querySelector('[data-drag-ghost]')).not.toBeNull();
    await fire(card(container, 'q2'), 'pointercancel', { clientX: 20, clientY: 20 });
    expect(container.querySelector('[data-drag-ghost]')).toBeNull();

    // lostpointercapture (auto-released capture).
    await fire(card(container, 'q2'), 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(card(container, 'q2'), 'pointermove', { clientX: 20, clientY: 20 });
    expect(container.querySelector('[data-drag-ghost]')).not.toBeNull();
    await fire(card(container, 'q2'), 'lostpointercapture', { clientX: 20, clientY: 20 });
    expect(container.querySelector('[data-drag-ghost]')).toBeNull();
  });
});

describe('FEAT-007 — hit-test isolation với ghost DOM thật', () => {
  it('ô dưới ghost vẫn được nhận diện nhờ pointer-events: none', async () => {
    installDomAwareHitTest();
    const { container } = await mount([fixture('q2')]);
    const target = card(container, 'q2');
    const q1 = cell(container, 'important-urgent');

    await fire(target, 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(target, 'pointermove', { clientX: 40, clientY: 40 });

    const ghost = container.querySelector<HTMLElement>('[data-drag-ghost]');
    expect(ghost).not.toBeNull();
    expect(window.getComputedStyle(ghost!).pointerEvents).toBe('none');
    // Ghost is the topmost rendered node at the pointer, yet the cell wins
    // the hit test — exactly one cell is highlighted.
    expect(q1.getAttribute('data-drop-target')).toBe('true');
    expect(
      container.querySelectorAll('[data-priority-cell][data-drop-target="true"]')
    ).toHaveLength(1);
  });
});

describe('FEAT-007 — thả ngoài mọi ô không gán', () => {
  it('không fallback về ô đã highlight trước đó khi pointerup ngoài ô', async () => {
    const { container, onAssign } = await mount([fixture('q2')]);
    const target = card(container, 'q2');
    const q1 = cell(container, 'important-urgent');

    stubElementFromPoint(q1);
    await fire(target, 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(target, 'pointermove', { clientX: 30, clientY: 30 });
    expect(q1.getAttribute('data-drop-target')).toBe('true');

    // Release outside every cell WITHOUT another pointermove: this is the exact
    // case the old `cellFromPoint(...) ?? drag.target` fallback mishandled.
    stubElementFromPoint(null);
    await fire(target, 'pointerup', { clientX: 900, clientY: 900 });

    expect(onAssign).not.toHaveBeenCalled();
    expect(container.querySelector('[data-priority-success]')).toBeNull();
    expect(cell(container, 'important-not-urgent').querySelector('[data-task-id="q2"]')).not.toBeNull();
    expect(cell(container, 'important-urgent').querySelector('[data-task-id="q2"]')).toBeNull();
  });

  it('rời khỏi ô làm tắt highlight, chỉ còn một ô highlight tại một thời điểm', async () => {
    const { container } = await mount([fixture('q2')]);
    const target = card(container, 'q2');
    const q1 = cell(container, 'important-urgent');
    const q4 = cell(container, 'not-important-not-urgent');

    stubElementFromPoint(q1);
    await fire(target, 'pointerdown', { clientX: 0, clientY: 0 });
    await fire(target, 'pointermove', { clientX: 30, clientY: 30 });
    expect(q1.getAttribute('data-drop-target')).toBe('true');

    stubElementFromPoint(q4);
    await fire(target, 'pointermove', { clientX: 60, clientY: 60 });
    expect(q1.getAttribute('data-drop-target')).toBeNull();
    expect(q4.getAttribute('data-drop-target')).toBe('true');
    expect(
      container.querySelectorAll('[data-priority-cell][data-drop-target="true"]')
    ).toHaveLength(1);
  });
});

/**
 * Regression tests for bug/newtab-board-ux phase-1-task-01
 * (D-02/D-03/D-04/D-05/D-10/D-11/D-12/D-20).
 *
 * Behavioral defects (D-03/D-04/D-05) mount the real component and assert the
 * fail-before-fix behavior. Layout/copy defects assert the source-of-truth CSS
 * and the launcher's accessible name. Storage write path is intentionally not
 * re-tested here — App.priorityBoard.test.tsx owns that contract.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PriorityBoard from '../../components/PriorityBoard';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((done) => setTimeout(done, 0));
const css = () => readFileSync(resolve(process.cwd(), 'entrypoints/newtab/style.css'), 'utf8');
const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const block = (text: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`))?.[0] ?? '';
};

const roots: Root[] = [];
let originalElementFromPoint: typeof document.elementFromPoint;

function fixture(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Việc ${id}`,
    note: '',
    priority: 'important-not-urgent',
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
    ...overrides,
  };
}

async function mount(tasks: Task[], onAssign: (task: Task) => Promise<void>) {
  vi.resetModules();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(React.createElement(PriorityBoard, { tasks, onAssign, onClose: vi.fn() }));
    await flush();
  });
  return container;
}

function fire(element: Element, type: string, init: MouseEventInit = {}): Promise<void> {
  return act(async () => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));
    await flush();
  });
}

async function drop(container: HTMLElement, taskId: string, priority: string): Promise<void> {
  const target = container.querySelector<HTMLElement>(`[data-priority-cell="${priority}"]`)!;
  document.elementFromPoint = (() => target) as typeof document.elementFromPoint;
  const card = container.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`)!;
  await fire(card, 'pointerdown', { clientX: 0, clientY: 0 });
  await fire(card, 'pointermove', { clientX: 20, clientY: 20 });
  await fire(card, 'pointerup', { clientX: 20, clientY: 20 });
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

describe('D-03 — keyboard hint and post-selection focus', () => {
  it('explicit hint names Enter, arrow keys and Enter/Space', async () => {
    const container = await mount([fixture('t1')], vi.fn().mockResolvedValue(undefined));
    // Hint tách 2 hàng (kéo / bàn phím); gộp lại để chặn nội dung, không chặn bố cục
    const hint = Array.from(container.querySelectorAll('.priority-board-hint'))
      .map((node) => node.textContent ?? '')
      .join(' ');
    expect(hint).toContain('Enter');
    expect(hint).toContain('mũi tên');
    expect(hint).toContain('Space');
  });

  it('selecting a card moves focus to the first "Chọn ô Qn" cell button', async () => {
    const container = await mount([fixture('t1')], vi.fn().mockResolvedValue(undefined));
    const card = container.querySelector<HTMLButtonElement>('[data-task-id="t1"]')!;
    await act(async () => {
      card.click();
      await flush();
    });
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(
      container.querySelector('[data-cell-assign="important-urgent"]')
    );
  });
});

describe('D-04 — visible success feedback after drag-assign', () => {
  it('renders a visible success message (not only an sr-only announcement)', async () => {
    const container = await mount([fixture('t1')], vi.fn().mockResolvedValue(undefined));
    await drop(container, 't1', 'important-urgent');
    const success = container.querySelector('[data-priority-success]');
    expect(success).not.toBeNull();
    expect(success!.textContent).toContain('Quan trọng, cấp bách');
    expect(success!.closest('.sr-only')).toBeNull();
  });
});

describe('D-05 — quota copy without a phantom retry button', () => {
  it('says the change was not saved and must be re-entered, never "thử lại"', async () => {
    const container = await mount(
      [fixture('t1')],
      vi.fn().mockRejectedValue(new Error('QUOTA_BYTES exceeded'))
    );
    await drop(container, 't1', 'important-urgent');
    const error = container.querySelector('[data-priority-error]')?.textContent ?? '';
    expect(error).toContain('Không lưu được');
    expect(error).toContain('chưa được lưu');
    expect(error).toContain('làm lại');
    expect(error).not.toContain('thử lại');
  });
});

describe('D-02 — disambiguated control names', () => {
  it('board launcher has its own accessible name, distinct from the sort control', () => {
    const app = source('entrypoints/newtab/App.tsx');
    expect(app).toContain('aria-label="Ma trận ưu tiên"');
    expect(app).toContain('Ma trận ưu tiên');
    expect(app).toContain('className="priority-board-launch-btn"');
  });
});

describe('D-10 / D-11 / D-12 / D-20 — CSS guards', () => {
  it('D-10: launch row centers and lets the filter take a full row', () => {
    const text = css();
    const launch = block(text, '.priority-board-launch');
    expect(launch).toContain('align-items: center');
    expect(launch).not.toContain('align-items: flex-start');
    expect(launch).toContain('flex-wrap: wrap');
    expect(block(text, '.priority-board-launch-filter')).toContain('flex: 1 1 100%');
  });

  it('D-11: panel uses a hairline, drop state owns the doubled edge (border + inset, no layout shift)', () => {
    const text = css();
    expect(block(text, '.priority-board-panel')).toContain('border: 1px solid');
    expect(block(text, '.priority-cell')).not.toContain('background: var(--surface-lacquer)');
    expect(block(text, '.priority-card')).not.toContain('background: var(--surface-paper)');
    const drop = block(text, '.priority-cell--drop[data-drop-target=\'true\']');
    expect(drop).toContain('border-color: var(--primary)');
    expect(drop).toContain('box-shadow: inset 0 0 0 1px var(--primary)');
  });

  it('D-12: frog-hero has clear top spacing after Greeting', () => {
    expect(block(css(), '.frog-hero')).toMatch(/margin-top:\s*var\(--spacing-(lg|base)\)/);
  });

  it('D-20: the backdrop is not a scroll owner', () => {
    const text = css();
    expect(block(text, '.priority-board-backdrop')).toContain('overflow: hidden');
    expect(block(text, '.priority-board-backdrop')).not.toContain('overflow: auto');
    const panel = block(text, '.priority-board-panel');
    expect(panel).not.toContain('88vh');
    expect(panel).toMatch(/max-height:\s*calc\(100dvh/);
    expect(panel).toContain('overflow-y: auto');
  });
});

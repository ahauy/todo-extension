/**
 * R-20 UI tests — TaskScroll nút focus + FocusTimer overlay.
 * Không dùng snapshot: mọi assertion đều trên hành vi/DOM/CSS contract.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import TaskScroll from '../../components/TaskScroll';
import FocusTimer from '../../components/FocusTimer';
import type { PomodoroApi } from '../../hooks/usePomodoro';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date(2026, 0, 15, 10, 0, 0);

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Học bài sử',
    note: '',
    priority: 'medium',
    dueAt: '2026-01-15T18:00',
    recurrence: { kind: 'none' },
    tags: ['bài tập'],
    subtasks: [{ id: 'st-1', title: 'Đọc', done: true }],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function fakeApi(overrides: Partial<PomodoroApi> = {}): PomodoroApi {
  return {
    phase: 'focus',
    running: true,
    remaining: 25 * 60_000,
    progress: 0.4,
    taskId: 'task-1',
    interruptions: 2,
    start: vi.fn(),
    pause: vi.fn(),
    skip: vi.fn(),
    reset: vi.fn(),
    attach: vi.fn(),
    noteInterruption: vi.fn(),
    ...overrides,
  };
}

const roots: Root[] = [];

function render(node: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(node));
  return container;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('TaskScroll — nút "Tập trung việc này" (R-20)', () => {
  it('không truyền onFocusTask → giữ nguyên DOM cũ, không có nút focus', () => {
    const container = render(
      <TaskScroll task={fixture()} subject={null} now={NOW} onToggle={vi.fn()} onOpen={vi.fn()} />
    );
    expect(container.querySelector('.focus-task-button')).toBeNull();
    expect(
      container.querySelector('[role="listitem"]')?.getAttribute('data-focus-active')
    ).toBe('false');
  });

  it('có onFocusTask → nút trong hàng hành động, click gọi đúng id việc', () => {
    const onFocusTask = vi.fn();
    const container = render(
      <TaskScroll
        task={fixture({ id: 't-42' })}
        subject={null}
        now={NOW}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
        onFocusTask={onFocusTask}
      />
    );
    const button = container.querySelector('.focus-task-button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Tập trung việc này');
    // Nút nằm cùng hàng với dấu son, NGOÀI [data-chip-row].
    expect(button.closest('.flex.items-start')).not.toBeNull();
    expect(button.closest('[data-chip-row]')).toBeNull();
    act(() => button.click());
    expect(onFocusTask).toHaveBeenCalledTimes(1);
    expect(onFocusTask).toHaveBeenCalledWith('t-42');
  });

  it('activeTaskId trùng việc → tô trạng thái (aria-pressed + data-focus-active)', () => {
    const container = render(
      <TaskScroll
        task={fixture()}
        subject={null}
        now={NOW}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
        onFocusTask={vi.fn()}
        activeTaskId="task-1"
      />
    );
    const button = container.querySelector('.focus-task-button') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList.contains('is-active')).toBe(true);
    expect(
      container.querySelector('[role="listitem"]')?.getAttribute('data-focus-active')
    ).toBe('true');
  });

  it('compact/full parity: nút focus hiện đúng 1 ở cả 2 nhánh, không đụng gate chip', () => {
    const task = fixture();
    const props = { subject: null, now: NOW, onToggle: vi.fn(), onOpen: vi.fn(), onFocusTask: vi.fn() };
    const board = render(<TaskScroll {...props} task={task} compact={false} />);
    const popup = render(<TaskScroll {...props} task={task} compact />);

    expect(board.querySelectorAll('.focus-task-button')).toHaveLength(1);
    expect(popup.querySelectorAll('.focus-task-button')).toHaveLength(1);

    const boardChips = [...board.querySelectorAll('[data-chip-row]')].reduce(
      (sum, row) => sum + row.children.length,
      0
    );
    const compactRow = popup.querySelector('[data-chip-row="1"]') as HTMLElement;
    expect(compactRow.children.length).toBe(boardChips);
    expect(compactRow.querySelector('.focus-task-button')).toBeNull();
  });
});

describe('FocusTimer — overlay (R-20)', () => {
  it('dial overlay ≥96px theo CSS contract', () => {
    const css = readFileSync(resolve(process.cwd(), 'styles/board.css'), 'utf8');
    const block = css.match(/\.timer-dial\[data-size='overlay'\]\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    const width = block![1].match(/width:\s*(\d+)px/);
    const height = block![1].match(/height:\s*(\d+)px/);
    expect(width).not.toBeNull();
    expect(height).not.toBeNull();
    expect(Number(width![1])).toBeGreaterThanOrEqual(96);
    expect(Number(height![1])).toBeGreaterThanOrEqual(96);
  });

  it('dial overlay có vòng mực, task card, count ngắt, 2 nút riêng Tạm dừng / Kết thúc', () => {
    const api = fakeApi();
    const container = render(
      <FocusTimer
        api={api}
        preset="25/5"
        onPresetChange={vi.fn()}
        overlay
        taskTitle="Học bài sử"
        interruptions={2}
      />
    );
    expect(container.querySelector('.timer-dial')?.getAttribute('data-size')).toBe('overlay');
    expect(container.querySelector('.timer-ring')).not.toBeNull();
    expect(container.querySelector('.focus-overlay-task-title')?.textContent).toBe('Học bài sử');
    expect(container.textContent).toContain('2 lần');

    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent?.trim());
    expect(buttons).toContain('Tạm dừng');
    expect(buttons).toContain('Kết thúc');

    const pause = buttons!.indexOf('Tạm dừng');
    const end = buttons!.indexOf('Kết thúc');
    const all = [...container.querySelectorAll('button')];
    act(() => all[pause].click());
    expect(api.pause).toHaveBeenCalledTimes(1);
    act(() => all[end].click());
    expect(api.reset).toHaveBeenCalledTimes(1);
    // Kết thúc KHÔNG phải skip và KHÔNG ghi focus (state layer lo ở phase 1).
    expect(api.skip).not.toHaveBeenCalled();
  });

  it('taskId dangling → placeholder, không crash, vẫn có nút Kết thúc', () => {
    const api = fakeApi();
    const container = render(
      <FocusTimer api={api} preset="25/5" onPresetChange={vi.fn()} overlay dangling />
    );
    expect(container.textContent).toContain('Việc không còn tồn tại');
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'Kết thúc')).toBe(
      true
    );
  });

  it('compact giữ nguyên bản 48px, 1 nút (0 regression khi không có taskId)', () => {
    const container = render(
      <FocusTimer api={fakeApi()} preset="25/5" onPresetChange={vi.fn()} compact />
    );
    expect(container.querySelector('.timer-dial')?.getAttribute('data-size')).toBe('sm');
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });
});

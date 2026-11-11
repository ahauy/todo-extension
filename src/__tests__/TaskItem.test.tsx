/**
 * Test cho TaskItem row (defect #4 trong scan.md).
 * Chỉ assert hành vi đúng ở tầng component; KHÔNG assert class động của
 * PriorityGlyph (defect #13) hay hành vi FilterBar/skeleton (#6/#12).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaskItem from '../../components/TaskItem';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Mua sắm tuần',
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

const roots: Root[] = [];

function renderItem(
  task: Task,
  handlers: {
    onToggle?: (id: string) => void;
    onOpenDetail?: (id: string) => void;
  } = {}
): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <TaskItem
        task={task}
        onToggle={handlers.onToggle ?? (() => {})}
        onOpenDetail={handlers.onOpenDetail ?? (() => {})}
      />
    );
  });
  return container;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('TaskItem', () => {
  it('render title và checkbox có aria-label đúng', () => {
    const container = renderItem(fixture());
    const checkbox = container.querySelector('input[type="checkbox"]');

    expect(container.textContent).toContain('Mua sắm tuần');
    expect(checkbox?.getAttribute('aria-label')).toBe(
      'Đánh dấu xong: Mua sắm tuần'
    );
  });

  it('click checkbox gọi onToggle với task id', () => {
    const onToggle = vi.fn();
    const container = renderItem(fixture(), { onToggle });
    const checkbox = container.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;

    act(() => {
      checkbox.click();
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('task-1');
  });

  it('task quá hạn hiển thị "Quá hạn"', () => {
    const container = renderItem(
      fixture({ dueAt: '2020-01-01T08:00:00.000Z' })
    );
    expect(container.textContent).toContain('Quá hạn');
  });

  it('task done có line-through và không hiện "Quá hạn"', () => {
    const container = renderItem(
      fixture({ done: true, dueAt: '2020-01-01T08:00:00.000Z' })
    );
    const titleButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Mua sắm tuần'
    );

    expect(titleButton?.className).toContain('line-through');
    expect(container.textContent).not.toContain('Quá hạn');
  });

  it('hiển thị tiến độ subtask dạng done/total', () => {
    const container = renderItem(
      fixture({
        subtasks: [
          { id: 's1', title: 'Một', done: true },
          { id: 's2', title: 'Hai', done: false },
          { id: 's3', title: 'Ba', done: false },
        ],
      })
    );
    expect(container.textContent).toContain('1/3');
  });

  it('chỉ hiện 2 tag đầu và phần dư dạng +N', () => {
    const container = renderItem(fixture({ tags: ['a', 'b', 'c'] }));
    const tagButtons = [...container.querySelectorAll('button')]
      .map((button) => button.textContent)
      .filter((text) => text?.startsWith('#'));

    expect(tagButtons).toEqual(['#a', '#b']);
    expect(container.textContent).toContain('+1');
  });
});

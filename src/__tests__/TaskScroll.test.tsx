/**
 * Test TaskScroll (một cuộn thư): data-state open/overdue/done, nút dấu son
 * + tiêu đề gọi đúng callback, PriorityBadge/SubjectBadge, tiến độ việc nhỏ,
 * chip hạn chót, và vòng đời done: dấu XONG + nút "Hoàn tác" rồi biến mất
 * khi bỏ dấu.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaskScroll from '../../components/TaskScroll';
import type { Subject, Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Mốc cố định: 15/01/2026, 10:00 giờ địa phương. */
const NOW = new Date(2026, 0, 15, 10, 0, 0);

const SUBJECT: Subject = {
  id: 's1',
  name: 'Toán',
  order: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Học bài sử',
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

interface Rendered {
  container: HTMLElement;
  rerender: (node: React.ReactElement) => void;
}

function renderNode(node: React.ReactElement): Rendered {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(node);
  });
  return {
    container,
    rerender(next: React.ReactElement) {
      act(() => {
        root.render(next);
      });
    },
  };
}

function findButton(scope: ParentNode, label: string): HTMLButtonElement {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

function article(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[role="listitem"]') as HTMLElement | null;
  if (!el) throw new Error('Không tìm thấy article[role="listitem"]');
  return el;
}

function renderScroll(
  task: Task,
  overrides: Partial<React.ComponentProps<typeof TaskScroll>> = {}
): Rendered {
  return renderNode(
    <TaskScroll
      task={task}
      subject={null}
      now={NOW}
      onToggle={vi.fn()}
      onOpen={vi.fn()}
      {...overrides}
    />
  );
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('TaskScroll', () => {
  it('việc mở: role listitem, data-state=open, tiêu đề trong button.scroll-title', () => {
    const { container } = renderScroll(fixture({ title: 'Học bài sử' }));

    expect(article(container).dataset.state).toBe('open');
    const title = container.querySelector('button.scroll-title');
    expect(title?.textContent).toBe('Học bài sử');
  });

  it('quá hạn (hạn trong quá khứ, chưa xong): data-state=overdue', () => {
    const { container } = renderScroll(fixture({ dueAt: '2026-01-14T09:00' }));

    expect(article(container).dataset.state).toBe('overdue');
    const chip = container.querySelector('time');
    expect(chip?.className).toContain('chip-overdue');
    expect(chip?.textContent).toContain('Quá hạn');
  });

  it('nút dấu son: aria-pressed + label, click gọi onToggle; tiêu đề gọi onOpen', () => {
    const onToggle = vi.fn();
    const onOpen = vi.fn();
    const task = fixture({ id: 't-42', title: 'Học từ vựng' });
    const { container } = renderScroll(task, { onToggle, onOpen });

    const seal = container.querySelector('.seal-button') as HTMLButtonElement;
    expect(seal.getAttribute('aria-pressed')).toBe('false');
    expect(seal.getAttribute('aria-label')).toBe('Đánh dấu xong: Học từ vựng');
    act(() => {
      seal.click();
    });
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('t-42');

    const title = container.querySelector(
      'button.scroll-title'
    ) as HTMLButtonElement;
    act(() => {
      title.click();
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('t-42');
  });

  it('PriorityBadge: chữ luôn kèm theo lớp màu tương ứng', () => {
    const { container, rerender } = renderScroll(fixture({ priority: 'low' }));

    expect(container.querySelector('.badge-low')?.textContent).toBe('Thấp');

    rerender(
      <TaskScroll
        task={fixture({ priority: 'medium' })}
        subject={null}
        now={NOW}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
      />
    );
    expect(container.querySelector('.badge-mid')?.textContent).toBe('Vừa');

    rerender(
      <TaskScroll
        task={fixture({ priority: 'high' })}
        subject={null}
        now={NOW}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
      />
    );
    expect(container.querySelector('.badge-high')?.textContent).toBe('Cao');
  });

  it('SubjectBadge: không có môn → "Chưa xếp môn"; có môn → tên môn', () => {
    const { container, rerender } = renderScroll(fixture());

    expect(container.querySelector('.badge-subject')?.textContent).toBe(
      'Chưa xếp môn'
    );

    rerender(
      <TaskScroll
        task={fixture()}
        subject={SUBJECT}
        now={NOW}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
      />
    );
    expect(container.querySelector('.badge-subject')?.textContent).toBe('Toán');
  });

  it('tiến độ việc nhỏ: "1/2" khi xong 1 trên 2; không có khi không có việc nhỏ', () => {
    const { container, rerender } = renderScroll(
      fixture({
        subtasks: [
          { id: 'st-1', title: 'Đọc bài', done: true },
          { id: 'st-2', title: 'Làm bài', done: false },
        ],
      })
    );

    expect(container.textContent).toContain('1/2');
    expect(container.querySelector('.progress-ink')).not.toBeNull();

    rerender(
      <TaskScroll
        task={fixture()}
        subject={null}
        now={NOW}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
      />
    );
    expect(container.querySelector('.progress-ink')).toBeNull();
    expect(container.textContent).not.toContain('/2');
  });

  it('chip hạn chót: <time> hiện với nhãn theo deadlineText', () => {
    const { container } = renderScroll(
      fixture({ dueAt: '2026-01-15T18:00' })
    );

    const chip = container.querySelector('time');
    expect(chip).not.toBeNull();
    expect(chip?.getAttribute('datetime')).toBe('2026-01-15T18:00');
    expect(chip?.className).toContain('chip-soon');
    expect(chip?.textContent).toContain('Hôm nay 18:00');
  });

  it('vòng đời done: dấu XONG + nút Hoàn tác; bỏ dấu thì mất hết', () => {
    const onToggle = vi.fn();
    const task = fixture({ id: 't-9', title: 'Học từ vựng' });
    const { container, rerender } = renderScroll(task, { onToggle });

    rerender(
      <TaskScroll
        task={{ ...task, done: true }}
        subject={null}
        now={NOW}
        onToggle={onToggle}
        onOpen={vi.fn()}
      />
    );

    expect(article(container).dataset.state).toBe('done');
    const stamp = container.querySelector('.seal-stamp');
    expect(stamp?.textContent).toBe('XONG');
    const seal = container.querySelector('.seal-button') as HTMLButtonElement;
    expect(seal.getAttribute('aria-pressed')).toBe('true');
    expect(seal.getAttribute('aria-label')).toBe('Bỏ dấu xong: Học từ vựng');

    const undo = findButton(container, 'Hoàn tác');
    act(() => {
      undo.click();
    });
    expect(onToggle).toHaveBeenCalledWith('t-9');

    rerender(
      <TaskScroll
        task={{ ...task, done: false }}
        subject={null}
        now={NOW}
        onToggle={onToggle}
        onOpen={vi.fn()}
      />
    );
    expect(container.querySelector('.seal-stamp')).toBeNull();
    expect(article(container).dataset.state).toBe('open');
    expect(container.textContent).not.toContain('Hoàn tác');
  });
});

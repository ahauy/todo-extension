/**
 * Test TaskScroll (một cuộn thư): data-state open/overdue/done/done-today, nút dấu son
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
    expect(seal.getAttribute('aria-label')).toBe('Đóng dấu xong: Học từ vựng');
    expect(seal.getAttribute('title')).toBe('Đóng dấu xong');
    expect(seal.querySelector('.seal-button-glyph')).not.toBeNull();
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

  describe('bố cục hàng chip (data-chip-row)', () => {
    const FULL_TASK = fixture({
      priority: 'high',
      dueAt: '2026-01-15T18:00',
      tags: ['bài tập'],
      subtasks: [
        { id: 'st-1', title: 'Đọc bài', done: true },
        { id: 'st-2', title: 'Làm bài', done: false },
      ],
    });

    it('compact: đúng 1 hàng chip, chứa đủ hạn chót + ưu tiên + môn + tag + tiến độ', () => {
      const { container } = renderScroll(FULL_TASK, { compact: true });

      const rows = container.querySelectorAll('[data-chip-row]');
      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.querySelector('time')).not.toBeNull(); // hạn chót
      expect(row.querySelector('.badge-high')?.textContent).toBe('Cao'); // ưu tiên
      expect(row.querySelector('.badge-subject')).not.toBeNull(); // môn
      expect(row.textContent).toContain('#bài tập'); // tag
      expect(row.querySelector('.progress-ink')).not.toBeNull(); // tiến độ
      expect(row.textContent).toContain('1/2');
      expect(row.textContent).not.toContain('Lặp lại'); // có hạn chót → không chip lặp
    });

    it('compact: lặp lại mà không có hạn chót → chip "Lặp lại" trong hàng duy nhất', () => {
      const { container } = renderScroll(
        fixture({ recurrence: { kind: 'daily' } }),
        { compact: true }
      );

      const rows = container.querySelectorAll('[data-chip-row]');
      expect(rows).toHaveLength(1);
      expect(rows[0].querySelector('time')).toBeNull();
      expect(rows[0].textContent).toContain('Lặp lại');
    });

    it('không compact: giữ nguyên 2 hàng — hạn chót + ưu tiên ở hàng 1, môn + tag + tiến độ ở hàng 2', () => {
      const { container } = renderScroll(FULL_TASK, { compact: false });

      const rows = container.querySelectorAll('[data-chip-row]');
      expect(rows).toHaveLength(2);
      const row1 = container.querySelector('[data-chip-row="1"]') as HTMLElement;
      const row2 = container.querySelector('[data-chip-row="2"]') as HTMLElement;
      expect(row1.querySelector('time')).not.toBeNull();
      expect(row1.querySelector('.badge-high')).not.toBeNull();
      expect(row1.querySelector('.badge-subject')).toBeNull();
      expect(row2.querySelector('.badge-subject')).not.toBeNull();
      expect(row2.textContent).toContain('#bài tập');
      expect(row2.querySelector('.progress-ink')).not.toBeNull();
      expect(row2.querySelector('time')).toBeNull();
    });

    it('không mất chip: hàng compact gộp đủ từng chip của bản 2 hàng, đúng thứ tự (task đầy đủ)', () => {
      const full = fixture({
        priority: 'high',
        dueAt: '2026-01-15T18:00',
        tags: ['bài tập', 'đồ án'],
        subtasks: [
          { id: 'st-1', title: 'Đọc bài', done: true },
          { id: 'st-2', title: 'Làm bài', done: false },
        ],
      });
      const board = renderScroll(full, { subject: SUBJECT, compact: false });
      const popup = renderScroll(full, { subject: SUBJECT, compact: true });

      const boardRows = [...board.container.querySelectorAll('[data-chip-row]')];
      expect(boardRows).toHaveLength(2);
      const rowOne = popup.container.querySelector('[data-chip-row="1"]') as HTMLElement;

      // Parity cấu trúc: tổng chip con của 2 hàng board = chip con của hàng compact.
      const boardChipCount = boardRows.reduce((sum, row) => sum + row.children.length, 0);
      expect(rowOne.children.length).toBe(boardChipCount);

      // Từng chip đối chiếu với chính bản board, không hardcode chữ.
      const boardTime = boardRows[0].querySelector('time') as HTMLTimeElement;
      const compactTime = rowOne.querySelector('time') as HTMLTimeElement;
      expect(compactTime.getAttribute('datetime')).toBe(boardTime.getAttribute('datetime'));
      expect(rowOne.querySelector('.badge-high')?.textContent).toBe(
        boardRows[0].querySelector('.badge-high')?.textContent
      );
      expect(rowOne.querySelector('.badge-subject')?.textContent).toBe(
        boardRows[1].querySelector('.badge-subject')?.textContent
      );
      const compactText = rowOne.textContent ?? '';
      for (const tag of full.tags) expect(compactText).toContain(`#${tag}`);
      expect(rowOne.querySelector('.progress-ink')).not.toBeNull();
      expect(compactText).toContain('1/2');

      // Đúng thứ tự: hạn chót · ưu tiên · môn · tag · tiến độ.
      const positions = [
        compactText.indexOf(compactTime.textContent ?? ''),
        compactText.indexOf('Cao'),
        compactText.indexOf('Toán'),
        compactText.indexOf('#bài tập'),
        compactText.indexOf('#đồ án'),
        compactText.indexOf('1/2'),
      ];
      expect(positions.every((pos) => pos >= 0)).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });
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

describe('TaskScroll — done-today & affordance (BUG-002)', () => {
  const recurring = (extra: Partial<Task> = {}) =>
    fixture({ recurrence: { kind: 'daily' }, dueAt: '2026-01-16T10:40', ...extra });

  it('việc lặp sắp tới: state open + chip "lặp" + seal có mộc affordance, aria-pressed false', () => {
    const { container } = renderScroll(recurring());
    expect(article(container).dataset.state).toBe('open');
    expect(container.textContent).toContain('lặp');
    const seal = container.querySelector('.seal-button') as HTMLButtonElement;
    expect(seal.getAttribute('aria-pressed')).toBe('false');
    expect(seal.querySelector('.seal-button-glyph')).not.toBeNull();
    expect(seal.getAttribute('title')).toBe('Đóng dấu xong');
  });

  it('việc lặp đã đóng dấu hôm nay: done-today + chip "đã làm hôm nay" + XONG + seal pressed', () => {
    const { container } = renderScroll(recurring({ lastDoneAt: '2026-01-15T09:00' }));
    expect(article(container).dataset.state).toBe('done-today');
    expect(container.textContent).toContain('đã làm hôm nay');
    expect(container.querySelector('.seal-stamp')?.textContent).toBe('XONG');
    const seal = container.querySelector('.seal-button') as HTMLButtonElement;
    expect(seal.getAttribute('aria-pressed')).toBe('true');
    expect(seal.getAttribute('aria-label')).toContain('Bỏ dấu hôm nay');
    expect(container.querySelector('time')).not.toBeNull();
  });

  it('sang ngày kế tiếp: lastDoneAt hôm qua → trở về open, hết done-today', () => {
    const { container } = renderScroll(recurring({ lastDoneAt: '2026-01-14T09:00' }));
    expect(article(container).dataset.state).toBe('open');
    expect(container.textContent).not.toContain('đã làm hôm nay');
    expect(container.querySelector('.seal-stamp')).toBeNull();
  });

  it('done-today: bấm seal gọi onToggle (Hoàn tác hôm nay, không cuộn hạn nữa)', () => {
    const onToggle = vi.fn();
    const { container } = renderScroll(recurring({ lastDoneAt: '2026-01-15T09:00' }), { onToggle });
    const seal = container.querySelector('.seal-button') as HTMLButtonElement;
    act(() => {
      seal.click();
    });
    expect(onToggle).toHaveBeenCalledWith('task-1');
  });
});

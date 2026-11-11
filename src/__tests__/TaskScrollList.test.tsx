/**
 * Test TaskScrollList (danh sách cuộn thư): role="list" một TaskScroll mỗi
 * việc, lọc theo tab / tìm kiếm / môn học, sắp xếp theo ưu tiên, skeleton khi
 * đang tải, alert quota + nút "Thử lại", và 4 trạng thái rỗng với đúng copy.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaskScrollList from '../../components/TaskScrollList';
import type { Subject, Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Mốc cố định: 15/01/2026, 10:00 giờ địa phương. */
const NOW = new Date(2026, 0, 15, 10, 0, 0);

const SUBJECTS: Subject[] = [
  { id: 's1', name: 'Toán', order: 0, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 's2', name: 'Văn', order: 1, createdAt: '2026-01-01T00:00:00.000Z' },
];

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

function renderNode(node: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(node);
  });
  return container;
}

function findButton(scope: ParentNode, label: string): HTMLButtonElement {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

function titles(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('[role="listitem"] .scroll-title')].map(
    (el) => el.textContent
  );
}

function listProps(
  overrides: Partial<React.ComponentProps<typeof TaskScrollList>> = {}
): React.ComponentProps<typeof TaskScrollList> {
  return {
    tasks: [],
    subjects: SUBJECTS,
    tab: 'all',
    subjectId: 'all',
    searchQuery: '',
    sortKey: 'deadline',
    now: NOW,
    onToggle: vi.fn(),
    onOpen: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('TaskScrollList', () => {
  it('render role="list" với một TaskScroll cho mỗi việc', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [
            fixture({ id: 'a', title: 'Alpha' }),
            fixture({ id: 'b', title: 'Beta' }),
            fixture({ id: 'c', title: 'Gamma' }),
          ],
        })}
      />
    );

    expect(container.querySelector('[role="list"]')).not.toBeNull();
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    const shown = titles(container);
    expect(shown).toContain('Alpha');
    expect(shown).toContain('Beta');
    expect(shown).toContain('Gamma');
  });

  it('lọc tab: "done" chỉ còn việc xong; "today" chỉ việc đến hạn hôm nay', () => {
    const tasks = [
      fixture({ id: 'a', title: 'Việc thường' }),
      fixture({ id: 'b', title: 'Việc xong', done: true }),
      fixture({ id: 'c', title: 'Việc hôm nay', dueAt: '2026-01-15T18:00' }),
    ];

    const doneView = renderNode(
      <TaskScrollList {...listProps({ tasks, tab: 'done' })} />
    );
    expect(titles(doneView)).toEqual(['Việc xong']);

    const todayView = renderNode(
      <TaskScrollList {...listProps({ tasks, tab: 'today' })} />
    );
    expect(titles(todayView)).toEqual(['Việc hôm nay']);
  });

  it('searchQuery lọc theo tiêu đề, không phân biệt hoa/thường', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [
            fixture({ id: 'a', title: 'Học Alpha' }),
            fixture({ id: 'b', title: 'Học Beta' }),
          ],
          searchQuery: 'alpha',
        })}
      />
    );

    expect(titles(container)).toEqual(['Học Alpha']);
  });

  it('subjectId lọc đúng gáy sách', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [
            fixture({ id: 'a', title: 'Việc Toán', subjectId: 's1' }),
            fixture({ id: 'b', title: 'Việc Văn', subjectId: 's2' }),
          ],
          subjectId: 's1',
        })}
      />
    );

    expect(titles(container)).toEqual(['Việc Toán']);
    // Nhãn môn học hiển thị theo subject đã tìm được.
    expect(container.querySelector('.badge-subject')?.textContent).toBe('Toán');
  });

  it('sortKey "priority" xếp Cao → Vừa → Thấp', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [
            fixture({ id: 'a', title: 'Việc thấp', priority: 'low' }),
            fixture({ id: 'b', title: 'Việc cao', priority: 'high' }),
            fixture({ id: 'c', title: 'Việc vừa', priority: 'medium' }),
          ],
          sortKey: 'priority',
        })}
      />
    );

    expect(titles(container)).toEqual(['Việc cao', 'Việc vừa', 'Việc thấp']);
  });

  it('loading: 4 skeleton-scroll + aria-busy, không có role="list"', () => {
    const container = renderNode(<TaskScrollList {...listProps({ loading: true })} />);

    expect(container.querySelectorAll('.skeleton-scroll')).toHaveLength(4);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelector('[role="list"]')).toBeNull();
  });

  it('quotaError: role="alert" với thông điệp + nút "Thử lại" gọi onQuotaRetry', () => {
    const onQuotaRetry = vi.fn();
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          quotaError: 'Không lưu được việc. Bộ nhớ đồng bộ có thể đã đầy.',
          onQuotaRetry,
        })}
      />
    );

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain(
      'Không lưu được việc. Bộ nhớ đồng bộ có thể đã đầy.'
    );
    expect(alert?.textContent).toContain(
      'Bộ nhớ đồng bộ của trình duyệt đã đầy.'
    );

    act(() => {
      findButton(container, 'Thử lại').click();
    });
    expect(onQuotaRetry).toHaveBeenCalledTimes(1);
  });

  it('sổ trống ở tab "all" → lời mời ghi việc đầu tiên', () => {
    const container = renderNode(<TaskScrollList {...listProps()} />);

    expect(container.textContent).toContain(
      'Chưa có điều gì cần ghi. Hãy cầm bút lên.'
    );
  });

  it('tab "hôm nay" trống → copy hôm nay', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [fixture({ id: 'a', title: 'Việc không hạn' })],
          tab: 'today',
        })}
      />
    );

    expect(container.textContent).toContain(
      'Hôm nay chưa có việc nào đến hạn. Con có thể học trước một chút.'
    );
  });

  it('tìm kiếm không khớp → copy tìm kiếm', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [fixture({ id: 'a', title: 'Học Toán' })],
          searchQuery: 'zzz',
        })}
      />
    );

    expect(container.textContent).toContain(
      'Không tìm thấy việc nào khớp. Thử chữ khác ngắn hơn xem sao.'
    );
  });

  it('môn chưa có việc nào → copy môn học', () => {
    const container = renderNode(
      <TaskScrollList
        {...listProps({
          tasks: [fixture({ id: 'a', title: 'Việc Văn', subjectId: 's2' })],
          subjectId: 's1',
        })}
      />
    );

    expect(container.textContent).toContain(
      'Gáy sách này còn trắng. Ghi việc đầu tiên cho môn này nhé.'
    );
  });
});

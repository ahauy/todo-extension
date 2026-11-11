/**
 * Test TaskList cho defect #12: skeleton chỉ hiện khi loading, empty state
 * không đi kèm skeleton.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaskList from '../../components/TaskList';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

function renderList(loading: boolean): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <TaskList
        tasks={[]}
        tab="all"
        searchQuery=""
        sortCriterion="default"
        selectedTags={[]}
        loading={loading}
        onToggle={vi.fn()}
        onOpenDetail={vi.fn()}
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

describe('TaskList loading state (#12)', () => {
  it('loading=true: hiện 4 skeleton, không hiện empty text', () => {
    const container = renderList(true);
    expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(4);
    expect(container.textContent).not.toContain('Chưa có việc nào.');
  });

  it('loading=false + rỗng: hiện empty text, không skeleton', () => {
    const container = renderList(false);
    expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(0);
    expect(container.textContent).toContain('Chưa có việc nào.');
  });
});

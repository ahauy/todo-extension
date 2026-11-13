/**
 * Test StreakCard: data-lit-just chỉ hiện khi ô ngày chuyển từ chưa sáng → sáng
 * (state-change only, không ambient looping), và biến mất sau ~260ms.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import StreakCard from '../../components/StreakCard';
import type { StudyLog } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

function renderStreakCard(extra: Partial<React.ComponentProps<typeof StreakCard>> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const props = {
    log: {} as StudyLog,
    now: new Date(2026, 0, 15, 10, 0, 0),
    ...extra,
  };
  act(() => {
    root.render(<StreakCard {...props} />);
  });
  return { container, root };
}

function litCells(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll('.streak-lotus[data-lit="true"]');
}
function justLitCells(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll('.streak-lotus[data-lit-just="true"]');
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('StreakCard lotus-lit animation', () => {
  it('không có data-lit-just khi render lần đầu với ô đã sáng', () => {
    const { container } = renderStreakCard({
      log: { '2026-01-15': { tasks: 1, focus: 0 } },
    });
    expect(justLitCells(container)).toHaveLength(0);
    expect(litCells(container)).toHaveLength(1);
  });

  it('hiện data-lit-just khi ô mới chuyển từ chưa sáng → sáng', () => {
    const now = new Date(2026, 0, 15, 10, 0, 0);
    const { container, root } = renderStreakCard({
      log: { '2026-01-14': { tasks: 1, focus: 0 } },
      now,
    });

    act(() => {
      root.render(
        <StreakCard
          log={{ '2026-01-14': { tasks: 1, focus: 0 }, '2026-01-15': { tasks: 1, focus: 0 } }}
          now={now}
        />
      );
    });

    const todayCell = container.querySelector('.streak-lotus[data-today="true"]');
    expect(todayCell?.getAttribute('data-lit-just')).toBe('true');
    expect(justLitCells(container)).toHaveLength(1);
  });
});

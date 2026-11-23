/** FilterRow: menu môn học (popup subject chooser) — mở/đóng/bàn phím/trả fokus. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import FilterRow from '../../components/FilterRow';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

const defaultSubjects = [
  { id: 's1', name: 'Toán', order: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 's2', name: 'Văn', order: 1, createdAt: '2026-01-02T00:00:00Z' },
];

function renderFilterRow(extra: Partial<React.ComponentProps<typeof FilterRow>> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const props = {
    tab: 'all' as const,
    counts: { all: 2, today: 1, upcoming: 0, done: 0 },
    onTabChange: vi.fn(),
    searchQuery: '',
    searchOpen: false,
    onSearchOpenChange: vi.fn(),
    onSearchChange: vi.fn(),
    sortKey: 'deadline' as const,
    onSortChange: vi.fn(),
    subjects: defaultSubjects,
    subjectId: 'all',
    onSubjectChange: vi.fn(),
    onlyKeystone: false,
    onOnlyKeystoneChange: vi.fn(),
    ...extra,
  };
  act(() => {
    root.render(
      <React.StrictMode>
        <FilterRow {...props} />
      </React.StrictMode>
    );
  });
  return { container, props };
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function keyDown(element: Element | null, key: string) {
  if (!element) return;
  act(() => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

function click(element: Element | null) {
  if (!element) return;
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('FilterRow subject chooser', () => {
  it('mở menu môn, ArrowDown di chuyển fokus, Escape đóng và trả fokus về nút kích hoạt', () => {
    vi.useFakeTimers();
    const { container } = renderFilterRow();
    const trigger = container.querySelector('button[aria-label="Lọc theo môn học: Cả giá sách"]');
    expect(trigger).not.toBeNull();

    click(trigger);
    const menu = container.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();

    const items = menu!.querySelectorAll('[role="menuitemradio"]');
    expect(items.length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(items[0]);

    keyDown(document.activeElement as Element, 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);

    keyDown(document.activeElement as Element, 'Escape');
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('chọn mục môn gọi onSelect đúng giá trị, đóng menu và trả fokus về nút kích hoạt', () => {
    vi.useFakeTimers();
    const { container, props } = renderFilterRow();
    const trigger = container.querySelector('button[aria-label="Lọc theo môn học: Cả giá sách"]')!;
    click(trigger);
    const items = container.querySelectorAll('[role="menuitemradio"]');
    const second = items[1];
    click(second);
    expect(props.onSubjectChange).toHaveBeenCalledWith('s1');
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab trên item đóng menu nhưng KHÔNG trả focus về trigger (Finding 1)', () => {
    vi.useFakeTimers();
    const { container } = renderFilterRow();
    const trigger = container.querySelector(
      'button[aria-label="Lọc theo môn học: Cả giá sách"]'
    )!;
    click(trigger);
    const first = container.querySelector(
      '[role="menu"][aria-label="Lọc theo môn học"] [role="menuitemradio"]'
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(first);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => {
      first.dispatchEvent(event);
    });

    // jsdom không mô phỏng native Tab movement, nên assert điều cốt lõi: focus
    // KHÔNG bị force-set về trigger và Tab không bị preventDefault.
    expect(document.activeElement).not.toBe(trigger);
    expect(event.defaultPrevented).toBe(false);
    // Trong 180ms thoát, item bị bỏ khỏi tab order → Tab không quay lại menu đang đóng.
    for (const item of container.querySelectorAll(
      '[role="menu"][aria-label="Lọc theo môn học"] [role="menuitemradio"]'
    )) {
      expect((item as HTMLButtonElement).tabIndex).toBe(-1);
    }

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"][aria-label="Lọc theo môn học"]')).toBeNull();
  });

  it('menu mở có data-entering, đóng có data-exiting rồi biến mất', () => {
    vi.useFakeTimers();
    const { container } = renderFilterRow();
    const trigger = container.querySelector('button[aria-label="Lọc theo môn học: Cả giá sách"]');
    expect(trigger).not.toBeNull();

    click(trigger);
    const menu = container.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute('data-entering')).toBe('true');

    // Chạy hết timer enter → data-entering biến mất
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"]')?.getAttribute('data-entering')).toBeNull();

    click(trigger);
    const menu2 = container.querySelector('[role="menu"]');
    expect(menu2).not.toBeNull();
    expect(menu2?.getAttribute('data-exiting')).toBe('true');

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });
});

describe('FilterRow chip "20%" (R-21)', () => {
  it('chip bật/tắt đúng aria-pressed, nằm ngoài tablist và giữ đúng 4 tab', () => {
    const { container, props } = renderFilterRow({ onlyKeystone: false });
    const chip = container.querySelector(
      'button[aria-label="Chỉ hiện việc then chốt (20%)"]'
    ) as HTMLButtonElement;
    expect(chip).not.toBeNull();
    expect(chip.textContent).toBe('20%');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    expect(chip.closest('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(4);

    click(chip);
    expect(props.onOnlyKeystoneChange).toHaveBeenCalledWith(true);
  });

  it('chip đang bật: aria-pressed=true + is-active, click tắt; vẫn 4 tab', () => {
    const { container, props } = renderFilterRow({ onlyKeystone: true });
    const chip = container.querySelector(
      'button[aria-label="Chỉ hiện việc then chốt (20%)"]'
    ) as HTMLButtonElement;
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.classList.contains('is-active')).toBe(true);

    click(chip);
    expect(props.onOnlyKeystoneChange).toHaveBeenCalledWith(false);
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(4);
  });

  it('chip đi cùng dải nút lọc (filter-actions), không phải nút tab', () => {
    const { container } = renderFilterRow();
    const chip = container.querySelector(
      'button[aria-label="Chỉ hiện việc then chốt (20%)"]'
    ) as HTMLButtonElement;
    expect(chip.closest('.filter-actions')).not.toBeNull();
    expect(container.querySelector('[role="tab"]')?.textContent).not.toContain('20%');
  });
});

describe('FilterRow sort menu', () => {
  it('Escape đóng menu sắp xếp và trả fokus về nút sắp xếp', () => {
    vi.useFakeTimers();
    const { container } = renderFilterRow();
    const trigger = container.querySelector('button[aria-label="Sắp xếp theo: Hạn chót"]')!;
    click(trigger);
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
    keyDown(document.activeElement as Element, 'Escape');
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab đóng menu sắp xếp mà không trả focus về nút sắp xếp', () => {
    vi.useFakeTimers();
    const { container } = renderFilterRow();
    const trigger = container.querySelector('button[aria-label="Sắp xếp theo: Hạn chót"]')!;
    click(trigger);
    const first = container.querySelector(
      '[role="menu"][aria-label="Sắp xếp"] [role="menuitemradio"]'
    ) as HTMLButtonElement;
    act(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    });
    expect(document.activeElement).not.toBe(trigger);
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(container.querySelector('[role="menu"][aria-label="Sắp xếp"]')).toBeNull();
  });
});

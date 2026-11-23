/** D-15/D-16/D-17 — đóng bằng Tab, outside-click bỏ qua trigger, menuitemradio. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Menu from '../../components/ui/Menu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];
const items = [
  { value: 'deadline', label: 'Hạn chót' },
  { value: 'priority', label: 'Ưu tiên' },
];

interface RenderExtra {
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

function renderMenu(extra: RenderExtra = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <Menu
        aria-label="Sắp xếp"
        items={items}
        value="deadline"
        onSelect={vi.fn()}
        open
        onClose={extra.onClose ?? vi.fn()}
        triggerRef={extra.triggerRef}
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

describe('Menu keyboard & outside click (D-15/D-16/D-17)', () => {
  it('Tab khi menu mở gọi onClose(reason="tab") và không chặn Tab', () => {
    const onClose = vi.fn();
    const container = renderMenu({ onClose });
    const item = container.querySelector('button')!;

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => {
      item.dispatchEvent(event);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('tab');
    // Không preventDefault → browser tự chuyển focus tới control kế tiếp.
    expect(event.defaultPrevented).toBe(false);
  });

  it('mousedown ngoài menu đóng, nhưng mousedown trên trigger thì bỏ qua', () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    renderMenu({ onClose, triggerRef: { current: trigger } });

    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('item có checked state dùng role=menuitemradio giữ aria-checked', () => {
    const container = renderMenu();
    const radios = container.querySelectorAll('[role="menuitemradio"]');
    expect(radios).toHaveLength(items.length);
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    expect(radios[1].getAttribute('aria-checked')).toBe('false');
    expect(container.querySelector('[role="menuitem"]')).toBeNull();
  });
});

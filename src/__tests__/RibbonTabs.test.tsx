/** RibbonTabs: phím mũi trái/phải chu kỳ qua mọi tab, không bị cắt mất tab cuối. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import RibbonTabs, { type RibbonTab } from '../../components/ui/RibbonTabs';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

const tabs: RibbonTab[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'upcoming', label: 'Sắp tới' },
  { value: 'done', label: 'Đã xong' },
];

function Harness({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) {
  const [value, setValue] = useState(initialValue);
  return (
    <RibbonTabs
      tabs={tabs}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      aria-label="Lọc việc"
    />
  );
}

function renderHarness(initialValue: string, onChange: (value: string) => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <React.StrictMode>
        <Harness initialValue={initialValue} onChange={onChange} />
      </React.StrictMode>
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

function getButtons(container: HTMLElement) {
  return container.querySelectorAll('[role="tab"]');
}

describe('RibbonTabs phím mũi tên', () => {
  it('ArrowRight di chuyển fokus qua mọi tab, onChange từng bước, quay vòng về đầu', () => {
    const onChange = vi.fn();
    const container = renderHarness('all', onChange);
    const buttons = getButtons(container);
    expect(buttons.length).toBe(4);
    act(() => {
      (buttons[0] as HTMLButtonElement).focus();
    });
    expect(document.activeElement).toBe(buttons[0]);

    const expected = ['today', 'upcoming', 'done', 'all'];
    for (const target of expected) {
      const active = document.activeElement as HTMLButtonElement;
      act(() => {
        active.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      });
      expect(document.activeElement).not.toBe(active);
      expect(onChange).lastCalledWith(target);
    }
    expect(document.activeElement).toBe(buttons[0]);
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('ArrowLeft từ tab đầu quay vòng về tab cuối', () => {
    const onChange = vi.fn();
    const container = renderHarness('all', onChange);
    const buttons = getButtons(container);
    act(() => {
      (buttons[0] as HTMLButtonElement).focus();
    });
    act(() => {
      (document.activeElement as HTMLButtonElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(buttons[3]);
    expect(onChange).toHaveBeenCalledWith('done');
  });
});

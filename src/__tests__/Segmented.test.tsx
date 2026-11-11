/** Test Segmented (defect #21): arrow key chỉ gọi onChange 1 lần kể cả trong StrictMode. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Segmented from '../../components/ui/Segmented';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

function renderSegmented(onChange: (value: string) => void): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <React.StrictMode>
        <Segmented
          options={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
            { value: 'c', label: 'C' },
          ]}
          value="a"
          onChange={onChange}
        />
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

describe('Segmented arrow keys (#21)', () => {
  it('ArrowRight gọi onChange đúng 1 lần với giá trị kế tiếp', () => {
    const onChange = vi.fn();
    const container = renderSegmented(onChange);
    const first = container.querySelectorAll('[role="radio"]')[0];

    act(() => {
      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('ArrowLeft từ item đầu quay vòng về cuối, 1 lần', () => {
    const onChange = vi.fn();
    const container = renderSegmented(onChange);
    const first = container.querySelectorAll('[role="radio"]')[0];

    act(() => {
      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c');
  });
});

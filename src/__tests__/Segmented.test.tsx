/** Test Segmented (defect #21): arrow key chỉ gọi onChange 1 lần kể cả trong StrictMode. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act, useState } from 'react';
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

/** D-06/D-07 — ngữ nghĩa radiogroup + roving tabindex + mũi tên di chuyển DOM focus. */
describe('Segmented radiogroup (D-06/D-07)', () => {
  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ];

  function Harness({ onChange }: { onChange: (value: string) => void }) {
    const [value, setValue] = useState('a');
    return (
      <Segmented
        aria-label="Mức ưu tiên"
        options={options}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    );
  }

  function renderHarness(onChange: (value: string) => void) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    act(() => {
      root.render(<Harness onChange={onChange} />);
    });
    return container;
  }

  it('dùng role=radiogroup và chỉ option được chọn là tab stop', () => {
    const container = renderHarness(vi.fn());
    expect(container.querySelector('[role="radiogroup"]')).not.toBeNull();
    const radios = container.querySelectorAll('[role="radio"]');
    expect(Array.from(radios, (radio) => radio.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
    ]);
  });

  it('ArrowRight đổi lựa chọn VÀ chuyển DOM focus sang option kế tiếp', () => {
    const onChange = vi.fn();
    const container = renderHarness(onChange);
    const radios = container.querySelectorAll('[role="radio"]');
    act(() => {
      (radios[0] as HTMLButtonElement).focus();
    });

    act(() => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
    });

    expect(document.activeElement).toBe(radios[1]);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('ArrowLeft từ option đầu quay vòng về cuối, focus đi theo', () => {
    const onChange = vi.fn();
    const container = renderHarness(onChange);
    const radios = container.querySelectorAll('[role="radio"]');
    act(() => {
      (radios[0] as HTMLButtonElement).focus();
    });

    act(() => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      );
    });

    expect(document.activeElement).toBe(radios[2]);
    expect(onChange).toHaveBeenCalledWith('c');
  });
});

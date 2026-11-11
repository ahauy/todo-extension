/**
 * Test Field (defect #18 + regression D24): id helper/error phải unique và
 * aria-describedby/aria-invalid phải gắn đúng control (kể cả trong wrapper div).
 */
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Field from '../../components/ui/Field';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

function renderField(node: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(node);
  });
  return container;
}

function describedText(input: Element | null): string | null {
  const id = input?.getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent ?? null : null;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('Field', () => {
  it('render array children không crash và gắn aria vào input', () => {
    const container = renderField(
      <Field label="Tên việc" helper="Bắt buộc">
        <input type="text" />
        {false}
      </Field>
    );

    const input = container.querySelector('input');
    expect(container.textContent).toContain('Tên việc');
    expect(describedText(input)).toBe('Bắt buộc');
  });

  it('single child vẫn gắn aria-describedby như trước', () => {
    const container = renderField(
      <Field label="Ghi chú" helper="Tối đa 1000 ký tự">
        <input type="text" />
      </Field>
    );
    expect(describedText(container.querySelector('input'))).toBe(
      'Tối đa 1000 ký tự'
    );
  });

  it('control trong wrapper div vẫn nhận aria-describedby', () => {
    const container = renderField(
      <Field label="Hạn hết" helper="Chọn ngày và giờ">
        <div>
          <input type="datetime-local" />
        </div>
      </Field>
    );
    expect(describedText(container.querySelector('input'))).toBe(
      'Chọn ngày và giờ'
    );
    const wrapped = container.querySelector('input')?.parentElement;
    expect(wrapped?.tagName).toBe('DIV');
    expect(wrapped?.getAttribute('aria-describedby')).toBeNull();
  });

  it('textarea cũng nhận aria-describedby', () => {
    const container = renderField(
      <Field label="Ghi chú" helper="Tối đa 1000 ký tự">
        <textarea />
      </Field>
    );
    expect(describedText(container.querySelector('textarea'))).toBe(
      'Tối đa 1000 ký tự'
    );
  });

  it('khi có error: aria-invalid=true và error text qua id', () => {
    const container = renderField(
      <Field label="Tên việc" error="Nhập tên việc trước khi thêm.">
        <input type="text" />
        <span>phụ</span>
      </Field>
    );

    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(input)).toBe('Nhập tên việc trước khi thêm.');
    expect(
      container.querySelector('[role="alert"]')?.textContent
    ).toBe('Nhập tên việc trước khi thêm.');
  });

  it('hai Field cùng render có id helper khác nhau', () => {
    const container = renderField(
      <div>
        <Field label="A" helper="Gợi ý A">
          <input type="text" />
        </Field>
        <Field label="B" helper="Gợi ý B">
          <input type="text" />
        </Field>
      </div>
    );

    const inputs = [...container.querySelectorAll('input')];
    const ids = inputs.map((input) => input.getAttribute('aria-describedby'));
    expect(ids[0]).not.toBe(ids[1]);
    expect(describedText(inputs[0])).toBe('Gợi ý A');
    expect(describedText(inputs[1])).toBe('Gợi ý B');
  });
});

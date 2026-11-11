/**
 * Regression test cho defect #24 (do lưới test task-04 phát hiện):
 * `Field` cloneElement(children) crash khi children là array (input + span
 * conditional) → expand TaskComposer làm sập popup.
 *
 * Test chứng minh Field render được array children + vẫn inject aria cho input.
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

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('Field', () => {
  it('render array children không crash và inject aria-describedby vào input', () => {
    const container = renderField(
      <Field label="Tên việc" helper="Bắt buộc">
        <input type="text" />
        {false}
      </Field>
    );

    const input = container.querySelector('input');
    expect(container.textContent).toContain('Tên việc');
    expect(container.textContent).toContain('Bắt buộc');
    expect(input?.getAttribute('aria-describedby')).toBe('field-helper');
  });

  it('single child vẫn inject aria-describedby như hành vi trước fix', () => {
    const container = renderField(
      <Field label="Ghi chú" helper="Tối đa 1000 ký tự">
        <input type="text" />
      </Field>
    );

    expect(
      container.querySelector('input')?.getAttribute('aria-describedby')
    ).toBe('field-helper');
  });

  it('khi có error: aria-invalid=true và error text role=alert', () => {
    const container = renderField(
      <Field label="Tên việc" error="Nhập tên việc trước khi thêm.">
        <input type="text" />
        <span>phụ</span>
      </Field>
    );

    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(
      container.querySelector('[role="alert"]')?.textContent
    ).toContain('Nhập tên việc trước khi thêm.');
  });
});

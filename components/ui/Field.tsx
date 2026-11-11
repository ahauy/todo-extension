/**
 * Field (L4-T10). Label hiển thị + helper/error text + aria-describedby/aria-invalid.
 * Không hex inline, focus ring 2px.
 */
import React from 'react';

interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

export default function Field({ label, helper, error, children }: FieldProps) {
  if (!children) return null;
  const describedBy = error ? 'field-error' : helper ? 'field-helper' : undefined;
  // Children có thể là array (vd input + conditional helper) — cloneElement(array)
  // tạo element type undefined → crash. Clone từng element hợp lệ, giữ nguyên child khác.
  const injected = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
        })
      : child
  );
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-meta text-fg-secondary">{label}</label>
      {injected}
      {error ? (
        <p id="field-error" className="text-meta text-danger" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id="field-helper" className="text-meta text-fg-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

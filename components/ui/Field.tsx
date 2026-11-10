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
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-meta text-fg-secondary">{label}</label>
      {React.cloneElement(children, {
        className: (children.props.className ?? '') + ' border-border-control bg-surface rounded-control',
        'aria-describedby': error ? 'field-error' : helper ? 'field-helper' : undefined,
        'aria-invalid': error ? true : undefined,
      })}
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

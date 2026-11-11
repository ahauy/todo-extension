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

interface AriaProps {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const CONTROL_TYPES = new Set(['input', 'textarea', 'select']);

/** Inject aria vào control thật, kể cả khi nằm trong wrapper div (mọi field dùng id riêng). */
function injectAria(
  node: React.ReactNode,
  describedBy: string | undefined,
  invalid: boolean | undefined
): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (typeof child.type === 'string' && CONTROL_TYPES.has(child.type)) {
      const aria: AriaProps = {};
      if (describedBy !== undefined) aria['aria-describedby'] = describedBy;
      if (invalid !== undefined) aria['aria-invalid'] = invalid;
      return React.cloneElement(child as React.ReactElement<AriaProps>, aria);
    }
    // Chỉ đệ quy vào host element (div/span...), không đụng custom component.
    if (typeof child.type !== 'string') return child;
    const props = child.props as { children?: React.ReactNode };
    if (props.children === undefined) return child;
    return React.cloneElement(
      child as React.ReactElement<{ children?: React.ReactNode }>,
      undefined,
      injectAria(props.children, describedBy, invalid)
    );
  });
}

export default function Field({ label, helper, error, children }: FieldProps) {
  const helperId = React.useId();
  const errorId = React.useId();
  if (!children) return null;

  const describedBy = error ? errorId : helper ? helperId : undefined;
  const injected = injectAria(children, describedBy, error ? true : undefined);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-meta text-fg-secondary">{label}</label>
      {injected}
      {error ? (
        <p id={errorId} className="text-meta text-danger" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-meta text-fg-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

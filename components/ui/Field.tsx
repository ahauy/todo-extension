/**
 * Nhãn + chú thích/lỗi cho một trường. aria-describedby/aria-invalid được tiêm
 * thẳng vào control thật, kể cả khi control nằm trong div bọc — mỗi Field có
 * id riêng nên hai Field cạnh nhau không dùng chung mô tả.
 */
import React from 'react';

interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

interface AriaProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const CONTROL_TYPES = new Set(['input', 'textarea', 'select']);

/** Có control thật (trực tiếp hoặc trong div bọc) thì mới dùng <label htmlFor> */
function containsControl(node: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(node, (child) => {
    if (found || !React.isValidElement(child)) return;
    if (typeof child.type === 'string' && CONTROL_TYPES.has(child.type)) {
      found = true;
      return;
    }
    if (typeof child.type !== 'string') return;
    const props = child.props as { children?: React.ReactNode };
    if (props.children !== undefined && containsControl(props.children)) found = true;
  });
  return found;
}

function injectAria(
  node: React.ReactNode,
  controlId: string,
  describedBy: string | undefined,
  invalid: boolean | undefined
): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (typeof child.type === 'string' && CONTROL_TYPES.has(child.type)) {
      const existing = child.props as AriaProps;
      const aria: AriaProps = { id: existing.id ?? controlId };
      if (describedBy !== undefined) aria['aria-describedby'] = describedBy;
      if (invalid !== undefined) aria['aria-invalid'] = invalid;
      return React.cloneElement(child as React.ReactElement<AriaProps>, aria);
    }
    if (typeof child.type !== 'string') return child;
    const props = child.props as { children?: React.ReactNode };
    if (props.children === undefined) return child;
    return React.cloneElement(
      child as React.ReactElement<{ children?: React.ReactNode }>,
      undefined,
      injectAria(props.children, controlId, describedBy, invalid)
    );
  });
}

export default function Field({ label, helper, error, children }: FieldProps) {
  const helperId = React.useId();
  const errorId = React.useId();
  const controlId = React.useId();
  if (!children) return null;

  const describedBy = error ? errorId : helper ? helperId : undefined;
  const injected = injectAria(children, controlId, describedBy, error ? true : undefined);
  // Con là nhóm (Segmented role="group") thì label htmlFor sẽ trỏ vào id không tồn tại
  const grouped = !containsControl(children);

  return (
    <div className="flex flex-col gap-xs">
      {grouped ? (
        <fieldset
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="m-0 flex min-w-0 flex-col gap-xs border-0 p-0"
        >
          <legend className="p-0 text-caption font-bold tracking-[0.4px] text-brown">
            {label}
          </legend>
          {children}
        </fieldset>
      ) : (
        <>
          <label htmlFor={controlId} className="text-caption font-bold tracking-[0.4px] text-brown">
            {label}
          </label>
          {injected}
        </>
      )}
      {error ? (
        <p id={errorId} className="text-body-sm text-critical" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-caption text-umber">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
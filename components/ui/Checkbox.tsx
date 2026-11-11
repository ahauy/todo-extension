/**
 * Ô chọn kiểu dấu triện: vuông 28px bo 4px, viền nâu giấy cũ; khi chọn nền đỏ
 * son và hiện dấu tích cách điệu. Vùng bấm thật 44×44.
 */
import React from 'react';
import { CheckIcon } from '../art/Icons';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label': string;
  disabled?: boolean;
}

export default function Checkbox({
  checked,
  onChange,
  'aria-label': ariaLabel,
  disabled = false,
}: CheckboxProps) {
  return (
    <label className="seal-check">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="seal-check-box" aria-hidden="true">
        {checked ? <CheckIcon size={16} /> : null}
      </span>
    </label>
  );
}
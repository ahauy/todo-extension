/**
 * Checkbox (L4-T10). Visual 18px + hit area 44×44, done state.
 * Màu đi qua token, focus ring 2px.
 */
import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label': string;
}

export default function Checkbox({ checked, onChange, 'aria-label': ariaLabel }: CheckboxProps) {
  return (
    <span className="relative size-11 -m-3 p-3 flex items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="sr-only w-0 h-0 border-0 p-0 -m-0"
      />
      <span
        className={`size-[18px] rounded-checkbox border-[1.5px] flex items-center justify-center ${
          checked ? 'bg-accent border-accent text-on-accent' : 'border-border-control bg-surface'
        }`}
      >
        {checked ? '✓' : null}
      </span>
    </span>
  );
}

/**
 * Công tắc bật/tắt. Màu chỉ hỗ trợ — chữ bên cạnh luôn nói rõ đang bật hay tắt
 * để không phải phân biệt bằng màu.
 */
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  onText?: string;
  offText?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  onText = 'Đang bật',
  offText = 'Đang tắt',
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="switch"
    >
      <span className="min-w-0 flex-1 text-body-md text-ink">{label}</span>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
      <span className="flex-none text-body-sm text-brown">{checked ? onText : offText}</span>
    </button>
  );
}
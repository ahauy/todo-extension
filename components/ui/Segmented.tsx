/**
 * Bộ chọn phân đoạn — nền mực đậm, chữ vàng nhạt khi đang chọn.
 * Điều hướng bằng mũi tên trái/phải, quấn vòng; onChange gọi ngoài updater
 * để StrictMode không gọi hai lần.
 */
import React, { useCallback, useState } from 'react';

interface SegmentedProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  className?: string;
}

export default function Segmented({
  options,
  value,
  onChange,
  'aria-label': ariaLabel = 'Bộ chọn',
  className,
}: SegmentedProps) {
  const [focusIndex, setFocusIndex] = useState(() =>
    options.findIndex((option) => option.value === value)
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = (focusIndex + step + options.length) % options.length;
      setFocusIndex(next);
      onChange(options[next].value);
    },
    [options, onChange, focusIndex]
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={['segmented', className].filter(Boolean).join(' ')}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          onKeyDown={handleKeyDown}
          className="segmented-option"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
/**
 * Segmented (L4-T10). 3 tab (priority/filter), role=group, arrow keys.
 * Idle text-fg-secondary; active bg-accent-soft text-accent-text border border-accent-border.
 */
import React, { useCallback, useState } from 'react';

interface SegmentedProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export default function Segmented({ options, value, onChange }: SegmentedProps) {
  const [focusIndex, setFocusIndex] = useState(options.findIndex((o) => o.value === value));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        const next = (focusIndex + step + options.length) % options.length;
        setFocusIndex(next);
        // Gọi onChange ngoài updater — StrictMode không gọi 2 lần (defect #21).
        onChange(options[next].value);
      }
    },
    [options, onChange, focusIndex]
  );

  return (
    <div
      role="group"
      aria-label="segmented control"
      className="rounded-control bg-surface-sunken p-0.5 border border-border-subtle flex"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          onKeyDown={handleKeyDown}
          className={`h-11 px-3 text-body rounded-control transition-colors ${
            option.value === value
              ? 'bg-accent-soft text-accent-text font-medium border border-accent-border'
              : 'text-fg-secondary hover:bg-surface-hover'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusIndex((i) => (i + 1) % options.length);
        onChange(options[(i + 1) % options.length].value);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusIndex((i) => (i - 1 + options.length) % options.length);
        onChange(options[(i - 1 + options.length) % options.length].value);
      }
    },
    [options, onChange]
  );

  return (
    <div
      role="group"
      aria-label="segmented control"
      className="rounded-control bg-surface-sunken p-0.5 border border-border-subtle flex"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
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

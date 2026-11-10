/**
 * PriorityGlyph (L4-T10). 3 vạch 1/2/3 + text sr-only.
 * Màu đi qua token, không hex inline.
 */
import React from 'react';

interface PriorityGlyphProps {
  priority: 'low' | 'medium' | 'high';
}

const barHeights: Record<'low' | 'medium' | 'high', number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const labels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Thấp',
  medium: 'Vừa',
  high: 'Cao',
};

export default function PriorityGlyph({ priority }: PriorityGlyphProps) {
  const threshold = barHeights[priority];
  return (
    <div className="flex gap-0.5 items-end">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`w-[3px] rounded-[1px] transition-colors ${
            n <= threshold
              ? `bg-priority-${priority}`
              : 'bg-border-subtle'
          }`}
        />
      ))}
      <span className="sr-only">{labels[priority]}</span>
    </div>
  );
}

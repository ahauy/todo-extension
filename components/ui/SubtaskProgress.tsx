/**
 * SubtaskProgress (L4-T10). Bar 2px + text 2/5 + aria-label.
 * Màu đi qua token, không hex inline.
 */
import React from 'react';

interface SubtaskProgressProps {
  done: number;
  total: number;
}

export default function SubtaskProgress({ done, total }: SubtaskProgressProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-meta text-fg-muted tabular-nums">
        {done}/{total}
      </span>
      <div className="h-0.5 w-10 rounded-bar bg-surface-sunken">
        <div
          className="h-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

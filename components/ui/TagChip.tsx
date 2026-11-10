/**
 * TagChip (L4-T10). Display (idle) + interactive (selected).
 * Màu đi qua token, focus ring 2px.
 */
import React from 'react';

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function TagChip({ label, selected = false, onPress }: TagChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`h-8 px-2.5 rounded-chip text-meta transition-colors ${
        selected
          ? 'bg-accent-soft text-accent-text border border-accent-border'
          : 'bg-surface-sunken text-fg-secondary hover:bg-surface-hover'
      }`}
    >
      {label}
    </button>
  );
}

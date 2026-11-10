/**
 * Menu (L4-T10). Sort/tag menu, role=menu, arrow keys.
 * Màu đi qua token, focus ring 2px.
 */
import React, { useCallback, useState } from 'react';

interface MenuItem {
  value: string;
  label: string;
}

interface MenuProps {
  items: MenuItem[];
  value: string;
  onSelect: (value: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function Menu({ items, value, onSelect, open, onClose }: MenuProps) {
  const [focusIndex, setFocusIndex] = useState(items.findIndex((i) => i.value === value));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => (i + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(items[focusIndex]?.value ?? value);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [items, value, onSelect, onClose, focusIndex]
  );

  if (!open) return null;

  return (
    <div
      role="menu"
      className="rounded-container border border-border bg-surface-raised shadow-e2 p-1"
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="menuitem"
          type="button"
          aria-checked={item.value === value}
          onClick={() => {
            onSelect(item.value);
            onClose();
          }}
          className={`h-10 px-3 rounded-control text-body w-full text-left transition-colors ${
            item.value === value
              ? 'bg-accent-soft text-accent-text font-medium'
              : 'text-fg-secondary hover:bg-surface-hover'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

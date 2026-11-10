/**
 * IconButton (L4-T10). Hit area 44×44, aria-label + title, focus ring 2px.
 * Màu đi qua token, không hex inline.
 */
import React from 'react';

interface IconButtonProps {
  'aria-label': string;
  title?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export default function IconButton({
  'aria-label': ariaLabel,
  title,
  icon,
  onClick,
  active = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      onClick={onClick}
      className={`relative size-9 rounded-control ${
        active
          ? 'text-accent-text bg-accent-soft border border-accent-border'
          : 'text-fg-secondary border-transparent hover:bg-surface-hover active:scale-[0.98]'
      }`}
    >
      <span className="absolute -inset-1" />
      {icon}
    </button>
  );
}

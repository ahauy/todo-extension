/**
 * Menu thả xuống kiểu giấy dó: nền sơn bóng, viền mảnh, bóng nổi.
 * Mở thì focus mục đầu, mũi tên lên/xuống di chuyển, Enter chọn, Escape đóng,
 * bấm ra ngoài đóng. Đặt absolute nên phần tử cha cần position: relative.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon } from '../art/Icons';

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
  'aria-label'?: string;
  align?: 'left' | 'right';
}

export default function Menu({
  items,
  value,
  onSelect,
  open,
  onClose,
  'aria-label': ariaLabel = 'Tuỳ chọn',
  align = 'left',
}: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [entering, setEntering] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    if (open) {
      setExiting(false);
      setEntering(true);
      exitTimer.current = setTimeout(() => setEntering(false), 180);
    } else {
      setEntering(false);
      setExiting(true);
      exitTimer.current = setTimeout(() => setExiting(false), 180);
    }
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    first?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
      );
      const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        nodes[(index + 1) % nodes.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        nodes[(index - 1 + nodes.length) % nodes.length]?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  if (!open && !entering && !exiting || items.length === 0) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={ariaLabel}
      data-entering={entering ? 'true' : undefined}
      data-exiting={exiting ? 'true' : undefined}
      onKeyDown={handleKeyDown}
      className={`menu absolute top-[calc(100%+4px)] z-50 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
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
          className="menu-item"
        >
          <span className="w-4 flex-none text-primary">
            {item.value === value ? <CheckIcon size={14} /> : null}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
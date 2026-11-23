/**
 * Menu thả xuống kiểu giấy dó: nền sơn bóng, viền mảnh, bóng nổi.
 * Mở thì focus mục đầu, mũi tên lên/xuống di chuyển, Enter chọn, Escape/Tab đóng,
 * bấm ra ngoài đóng (trừ nút kích hoạt). Đặt absolute nên phần tử cha cần position: relative.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon } from '../art/Icons';

interface MenuItem {
  value: string;
  label: string;
}

/** Lý do đóng để chủ sở hữu quyết định có trả focus về nút kích hoạt hay không. */
export type MenuCloseReason = 'escape' | 'select' | 'tab' | 'outside';

interface MenuProps {
  items: MenuItem[];
  value: string;
  onSelect: (value: string) => void;
  open: boolean;
  onClose: (reason: MenuCloseReason) => void;
  'aria-label'?: string;
  align?: 'left' | 'right';
  /** Nút kích hoạt — mousedown trên nút này bỏ qua để một click đóng menu gọn. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const itemSelector = '[role="menuitemradio"]';

export default function Menu({
  items,
  value,
  onSelect,
  open,
  onClose,
  'aria-label': ariaLabel = 'Tuỳ chọn',
  align = 'left',
  triggerRef,
}: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transitionState, setTransitionState] = useState<'idle' | 'entering' | 'exiting'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (open) {
      setTransitionState('entering');
      timer.current = setTimeout(() => setTransitionState('idle'), 180);
    } else {
      setTransitionState('exiting');
      timer.current = setTimeout(() => setTransitionState('idle'), 180);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = ref.current?.querySelector<HTMLButtonElement>(itemSelector);
    first?.focus();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef?.current?.contains(target)) return;
      if (ref.current && !ref.current.contains(target)) onClose('outside');
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, onClose, triggerRef]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLButtonElement>(itemSelector) ?? []
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
        onClose('escape');
      } else if (event.key === 'Tab') {
        // Menu-button pattern: Tab đóng menu rồi đi tiếp, không chặn tab.
        // Không preventDefault để trình duyệt tự chuyển focus tới control kế tiếp.
        onClose('tab');
      }
    },
    [onClose]
  );

  if (!open && transitionState === 'idle' || items.length === 0) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={ariaLabel}
      data-entering={transitionState === 'entering' ? 'true' : undefined}
      data-exiting={transitionState === 'exiting' ? 'true' : undefined}
      onKeyDown={handleKeyDown}
      className={`menu absolute top-[calc(100%+4px)] z-50 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="menuitemradio"
          type="button"
          aria-checked={item.value === value}
          onClick={() => {
            onSelect(item.value);
            onClose('select');
          }}
          // Trong 180ms thoát, item vẫn còn trong DOM: bỏ khỏi tab order để Tab
          // không quay lại menu đang đóng mà đi thẳng tới control kế tiếp.
          tabIndex={transitionState === 'exiting' ? -1 : undefined}
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
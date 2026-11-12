/**
 * Hộp thoại giấy da: khung đôi vàng kim, bo 24px, bóng lớp 3, chữ cái đầu
 * trang trí ở tiêu đề. Trong Popup nó là tờ trượt từ dưới lên chiếm hết bề
 * ngang; trong New Tab là hộp căn giữa. Focus bị giữ trong hộp, Escape đóng,
 * đóng xong trả focus về phần tử đã mở.
 */
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { CloseIcon } from '../art/Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sheet?: boolean;
  labelledBy?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  sheet = false,
}: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previous = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previous.current = (document.activeElement as HTMLElement) ?? null;
    const node = boxRef.current;
    const target =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.offsetParent !== null
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previous.current?.focus();
      previous.current = null;
    };
  }, [open, onClose]);

  const stop = useCallback((event: React.MouseEvent) => event.stopPropagation(), []);

  if (!open) return null;

  const initial = title.charAt(0).toUpperCase();
  const rest = title.slice(1);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-sheet={sheet}
        data-centered={!sheet || undefined}
        onClick={stop}
        className="parchment"
      >
        <div className="mb-base flex items-start gap-md">
          <h2 id={titleId} className="flex-1 text-heading-md text-ink-deep">
            <span
              className="align-baseline font-drop text-[44px] font-bold leading-none text-primary"
              aria-hidden="true"
            >
              {initial}
            </span>
            <span className="sr-only">{initial}</span>
            {rest}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="btn-icon"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="mt-lg flex flex-wrap items-center justify-end gap-sm">{footer}</div>}
      </div>
    </>
  );
}
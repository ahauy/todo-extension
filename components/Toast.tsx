/**
 * Nhắc nhở trong trang: tờ giấy nhỏ viền vàng kim, thanh đỏ son bên trái.
 * role="status" để đọc màn hình đọc được, tự đóng sau thời lượng cho trước.
 */
import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import { CloseIcon } from './art/Icons';

interface ToastProps {
  isOpen: boolean;
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
}

export default function Toast({
  isOpen,
  message,
  detail,
  actionLabel,
  onAction,
  onClose,
  duration = 5000,
}: ToastProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDismissed(false);
      return undefined;
    }
    if (dismissed) return undefined;
    const timer = window.setTimeout(() => {
      setDismissed(true);
      onClose?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [isOpen, dismissed, duration, onClose]);

  if (!isOpen || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-reminder pointer-events-auto w-[min(340px,calc(100vw-32px))]"
    >
      <div className="flex items-start gap-sm">
        <div className="min-w-0 flex-1">
          <p className="text-subtitle font-semibold text-ink">{message}</p>
          {detail && <p className="mt-xxs text-body-sm text-umber">{detail}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onClose?.();
          }}
          aria-label="Đóng thông báo"
          className="btn-icon size-8 flex-none"
        >
          <CloseIcon size={14} />
        </button>
      </div>
      {actionLabel && onAction && (
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDismissed(true);
              onAction();
              onClose?.();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
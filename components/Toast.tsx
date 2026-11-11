/**
 * Toast (L5-T17). role="status" aria-live="polite", bottom center.
 * "Đã xoá việc" + "Hoàn tác" (6 giây) — P2 theo design-spec O1.
 */
import React, { useEffect, useState } from 'react';
import Button from './ui/Button';

interface ToastProps {
  isOpen: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
}

export default function Toast({
  isOpen,
  message,
  actionLabel = 'Hoàn tác',
  onAction,
  onClose,
  duration = 6000,
}: ToastProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOpen || dismissed) return;
    const t = setTimeout(() => {
      setDismissed(true);
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [isOpen, dismissed, duration, onClose]);

  if (!isOpen || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 rounded-control bg-fg text-bg px-3 py-2 shadow-e2"
    >
      <span className="text-caption">{message}</span>
      {actionLabel && onAction ? (
        <Button variant="ghost" onClick={() => {
          setDismissed(true);
          onAction?.();
          onClose?.();
        }}>
          {actionLabel}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        onClick={() => {
          setDismissed(true);
          onClose?.();
        }}
        aria-label="Đóng thông báo"
      >
        ✕
      </Button>
    </div>
  );
}

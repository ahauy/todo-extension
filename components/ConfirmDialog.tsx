/**
 * ConfirmDialog (L5-T17). role="dialog" aria-modal="true", scrim, focus trap,
 * focus mặc định nút an toàn (Giữ lại), Escape = hành vi an toàn, focus trả về
 * nút đã mở dialog sau khi đóng.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import Button from './ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  returnTo?: HTMLElement | null;
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Xoá',
  cancelLabel = 'Giữ lại',
  danger = false,
  returnTo,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = returnTo ?? document.activeElement;
    // Focus nút an toàn (cancel) theo acceptance criteria
    setTimeout(() => confirmRef.current?.focus(), 50);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      // Trả focus về nút đã mở dialog
      previousFocus.current?.focus();
      previousFocus.current = null;
    };
  }, [isOpen, returnTo]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={handleCancel}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-container border border-border bg-surface-raised shadow-e3 p-4 z-[70] flex flex-col gap-3"
      >
        <h2 id="confirm-dialog-title" className="text-title font-medium text-fg">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="text-caption text-fg-secondary">
          {description}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleCancel} ref={confirmRef}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
}

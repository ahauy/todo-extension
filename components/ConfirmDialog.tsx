/**
 * Hộp xác nhận trên giấy da. Focus mặc định rơi vào lựa chọn AN TOÀN, Escape
 * là hành vi an toàn, đóng xong trả focus về chỗ đã mở hộp.
 */
import React from 'react';
import Modal from './ui/Modal';
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
  sheet?: boolean;
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
  sheet = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      title={title}
      sheet={sheet}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body-md text-brown">{description}</p>
    </Modal>
  );
}
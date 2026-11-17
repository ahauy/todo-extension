/**
 * R-20: hai hộp xác nhận dùng chung cho Popup và New Tab.
 * - Đổi việc/tick việc khác giữa phiên → phá tập trung (+1 interruption).
 * - Hết phiên tự nhiên có việc gắn → hỏi "Xong việc này chưa?".
 */
import React from 'react';
import ConfirmDialog from './ConfirmDialog';

export interface FocusInterrupt {
  kind: 'attach' | 'toggle';
  id: string;
}

interface FocusConfirmsProps {
  interrupt: FocusInterrupt | null;
  pendingCompletion: { taskId: string; interruptions: number } | null;
  sheet?: boolean;
  onCancelInterrupt: () => void;
  onConfirmInterrupt: (interrupt: FocusInterrupt) => void;
  onCancelCompletion: () => void;
  onConfirmCompletion: () => void;
}

export default function FocusConfirms({
  interrupt,
  pendingCompletion,
  sheet = false,
  onCancelInterrupt,
  onConfirmInterrupt,
  onCancelCompletion,
  onConfirmCompletion,
}: FocusConfirmsProps) {
  return (
    <>
      <ConfirmDialog
        isOpen={!!interrupt}
        sheet={sheet}
        title="Đổi việc đang tập trung?"
        description="Đang trong phiên, đổi việc sẽ phá tập trung?"
        confirmLabel="Đổi việc"
        cancelLabel="Giữ việc cũ"
        onCancel={onCancelInterrupt}
        onConfirm={() => {
          if (interrupt) onConfirmInterrupt(interrupt);
        }}
      />
      <ConfirmDialog
        isOpen={!!pendingCompletion}
        sheet={sheet}
        title="Xong việc này chưa?"
        description={`Hết giờ học.${(pendingCompletion?.interruptions ?? 0) > 0 ? ` Bạn đã đổi việc ${pendingCompletion?.interruptions} lần trong phiên này.` : ''} Xác nhận sẽ đóng dấu việc này và ghi một phiên học.`}
        confirmLabel="Xong rồi"
        cancelLabel="Chưa xong"
        onCancel={onCancelCompletion}
        onConfirm={onConfirmCompletion}
      />
    </>
  );
}

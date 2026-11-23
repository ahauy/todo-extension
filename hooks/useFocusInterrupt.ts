/**
 * R-20 — xác nhận đổi việc/giờ tập trung dùng chung cho Popup và New Tab.
 * Chỉ khác nhau ở chỗ gắn UI (sheet hay overlay), còn luồng xử lý là một.
 */
import { useCallback, useState } from 'react';
import type { FocusInterrupt } from '../components/FocusConfirms';
import type { Board } from './useBoard';

export function useFocusInterrupt(board: Board) {
  const [interrupt, setInterrupt] = useState<FocusInterrupt | null>(null);

  const handleFocusTask = useCallback(
    (id: string) => {
      if (id === board.pomodoro.taskId) return;
      if (board.pomodoro.running && board.pomodoro.phase === 'focus') {
        setInterrupt({ kind: 'attach', id });
        return;
      }
      board.startFocusOn(id);
    },
    [board]
  );

  const handleInterrupt = useCallback(
    (next: FocusInterrupt) => {
      if (next.kind === 'detach') {
        board.detachFocus();
        return;
      }
      if (next.kind === 'attach') {
        board.switchTaskMidSession(next.id);
        return;
      }
      void board.toggleTask(next.id);
      board.pomodoro.noteInterruption();
    },
    [board]
  );

  return { interrupt, setInterrupt, handleFocusTask, handleInterrupt };
}

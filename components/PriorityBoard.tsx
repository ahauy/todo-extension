/**
 * R-26 — Bảng "Sắp xếp công việc": 4 ô theo ma trận Eisenhower (R-05).
 * Panel là state local của New Tab, KHÔNG ghi storage riêng (R-17). Kéo thẻ bằng
 * pointer events theo mẫu Timeline; thả vào ô → đổi priority trong bộ nhớ ngay
 * rồi gọi `onAssign` đúng 1 lần (App nối tới board.updateTask → copy-then-patch
 * + 1 put). Quota → hoàn tác optimistic + lỗi inline (R-16), không toast.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PRIORITY_BADGE } from '../lib/tasks/priority';
import type { Priority, Task } from '../lib/tasks/types';

/** Nhãn đúng R-05 (Q1→Q4) — không rút gõ, không thêm nhãn 3 mức cũ. */
export const PRIORITY_CELLS: ReadonlyArray<{ value: Priority; label: string; short: string }> = [
  { value: 'important-urgent', label: 'Quan trọng, cấp bách', short: 'Q1' },
  { value: 'important-not-urgent', label: 'Quan trọng, không cấp bách', short: 'Q2' },
  { value: 'not-important-urgent', label: 'Không quan trọng, cấp bách', short: 'Q3' },
  { value: 'not-important-not-urgent', label: 'Không quan trọng, không cấp bách', short: 'Q4' },
];

const DRAG_THRESHOLD_PX = 5;

export interface PriorityBoardProps {
  /** Task đã hydrate (phase 1 ánh xạ priority 3 mức cũ). Archived bị loại. */
  tasks: Task[];
  /** R-20 — focusActive → mọi gesture bị vô hiệu. */
  disabled?: boolean;
  /** Nhận task ĐÃ copy-then-patch; App nối board.updateTask (đúng 1 put). */
  onAssign: (task: Task) => Promise<void>;
  onClose: () => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  moved: boolean;
  target: Priority | null;
  /* FEAT-007 — toạ độ con trỏ KHÔNG nằm trong state: ghost bám con trỏ bằng
     transform trực tiếp qua ref, mỗi pointermove không re-render toàn panel
     (tới 100+ thẻ). State chỉ đổi khi `moved` lật hoặc ô đích đổi. */
}

function labelOf(priority: Priority): string {
  return PRIORITY_CELLS.find((cell) => cell.value === priority)?.label ?? priority;
}

/** Ô đang nằm dưới con trỏ. elementFromPoint là nguồn thật trong browser;
 *  test stub lại hàm này để mô phỏng vị trí thả mà không cần layout jsdom.
 *  Ghost được render có `pointer-events: none` nên browser bỏ qua nó ở đây —
 *  không cần lọc ghost thủ công trong hit-test. */
function cellFromPoint(clientX: number, clientY: number): Priority | null {
  const element = document.elementFromPoint?.(clientX, clientY);
  const cell = element?.closest?.('[data-priority-cell]');
  const value = cell?.getAttribute('data-priority-cell');
  return PRIORITY_CELLS.some((item) => item.value === value) ? (value as Priority) : null;
}

/** Best-effort release: on pointercancel/lostpointercapture the browser may
 *  already have released capture, and releasePointerCapture can throw. */
function releaseCapture(element: HTMLElement, pointerId: number): void {
  try {
    element.releasePointerCapture?.(pointerId);
  } catch {
    /* capture already released */
  }
}

export default function PriorityBoard({
  tasks,
  disabled = false,
  onAssign,
  onClose,
}: PriorityBoardProps) {
  const [overrides, setOverrides] = useState<Record<string, Priority>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // D-04 — sighted users need the same confirmation the live region announces.
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const visible = useMemo(() => tasks.filter((task) => !task.archived), [tasks]);
  const priorityOf = useCallback(
    (task: Task): Priority => overrides[task.id] ?? task.priority,
    [overrides]
  );

  const assign = useCallback(
    async (id: string, priority: Priority) => {
      if (disabled) return;
      const task = visible.find((item) => item.id === id);
      if (!task || priorityOf(task) === priority) {
        setSelectedId(null);
        return;
      }
      // Copy-then-patch: mọi field khác (dueAt/startAt/endAt/plannedFor/
      // archived/habit/dayPlan) đi nguyên vẹn cùng task được ghi.
      const patched: Task = { ...task, priority };
      setOverrides((prev) => ({ ...prev, [id]: priority }));
      setError(null);
      setSelectedId(null);
      try {
        await onAssign(patched);
        const message = `Đã chuyển "${task.title}" sang ô ${labelOf(priority)}.`;
        setAnnouncement(message);
        setSuccessMessage(message);
      } catch {
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        // D-05 — no retry button exists; copy must not promise one (D-01 pattern).
        setError(
          'Không lưu được thay đổi. Bộ nhớ đồng bộ có thể đã đầy — thay đổi này chưa được lưu, hãy làm lại sau khi xoá bớt việc cũ.'
        );
        setSuccessMessage(null);
        setAnnouncement('Không lưu được thay đổi, đã hoàn tác.');
      }
    },
    [disabled, visible, priorityOf, onAssign]
  );

  // H-1/M-1 — mount-only: focus close button once when panel opens, capture the
  // launcher for restore, and give focus back on unmount. Empty deps keep this
  // from re-running on parent re-renders (30s timer / after each put).
  useEffect(() => {
    const returnFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    return () => returnFocus?.focus({ preventScroll: true });
  }, []);

  // D-03 — selecting a card enables the assign buttons; move focus to the
  // first one in the same commit so the keyboard path is self-discoverable.
  useEffect(() => {
    if (!selectedId) return;
    const firstCell = panelRef.current?.querySelector<HTMLElement>('[data-cell-assign]');
    firstCell?.focus({ preventScroll: true });
  }, [selectedId]);

  // Esc: ưu tiên popup R-25 → panel này → fullscreen/search (App bỏ qua phím
  // khi có [role="dialog"]). Đăng ký ở window capture để thắng listener capture
  // của fullscreen trên document mà không đụng Timeline. No focus() here — that
  // would steal focus again whenever disabled/onClose identity changes.
  useEffect(() => {
    if (disabled) {
      onClose();
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('.task-entry-popup, [role="alertdialog"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [disabled, onClose]);

  const focusCell = (index: number) => {
    const buttons = panelRef.current?.querySelectorAll<HTMLElement>('[data-cell-assign]');
    buttons?.[Math.max(0, Math.min(index, buttons.length - 1))]?.focus({ preventScroll: true });
  };

  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  const onCardPointerDown =
    (id: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      lastPoint.current = { x: event.clientX, y: event.clientY };
      setDrag({
        id,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        target: null,
      });
    };

  const onCardPointerMove =
    (id: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!drag || drag.id !== id) return;
      lastPoint.current = { x: event.clientX, y: event.clientY };
      // Ghost bám con trỏ ngoài React: transform ghi thẳng vào node, không
      // đưa toạ độ vào state nên pointermove không re-render danh sách thẻ.
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }
      const moved =
        drag.moved ||
        Math.abs(event.clientX - drag.startX) >= DRAG_THRESHOLD_PX ||
        Math.abs(event.clientY - drag.startY) >= DRAG_THRESHOLD_PX;
      const target = moved ? cellFromPoint(event.clientX, event.clientY) : null;
      // Chỉ render lại khi trạng thái người dùng nhìn thấy thật sự đổi.
      if (moved === drag.moved && target === drag.target) return;
      setDrag({ ...drag, moved, target });
    };

  const onCardPointerUp =
    (id: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
      releaseCapture(event.currentTarget, event.pointerId);
      if (!drag || drag.id !== id) return;
      // FEAT-007 — chỉ gán ô đang nằm dưới con trỏ lúc thả; thả ngoài mọi ô
      // thì KHÔNG fallback về ô highlight trước đó.
      const target = drag.moved ? cellFromPoint(event.clientX, event.clientY) : null;
      setDrag(null);
      if (target) void assign(id, target);
    };

  // M-2 — interruption / auto-released capture: clear drag + drop highlight
  // without assigning (no storage write on a cancelled gesture).
  const onCardPointerCancel =
    (id: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
      releaseCapture(event.currentTarget, event.pointerId);
      if (!drag || drag.id !== id) return;
      setDrag(null);
    };

  // FEAT-007 — ghost là bản hiển thị của chính thẻ đang kéo, chỉ tồn tại sau
  // khi vượt ngưỡng. fixed + translate3d nên ghost nằm ngoài flow của grid và
  // không bị overflow:hidden của backdrop cắt (không có ancestor transform).
  // Vị trí do pointermove ghi thẳng qua ghostRef; callback ref đặt vị trí ngay
  // lúc mount để không nháy ở góc (0,0) trong frame đầu.
  const mountGhost = useCallback((node: HTMLDivElement | null) => {
    ghostRef.current = node;
    if (node && lastPoint.current) {
      node.style.transform = `translate3d(${lastPoint.current.x}px, ${lastPoint.current.y}px, 0)`;
    }
  }, []);

  const activeDrag = drag?.moved ? drag : null;
  const draggedTask = activeDrag
    ? visible.find((task) => task.id === activeDrag.id)
    : undefined;
  const ghost =
    activeDrag && draggedTask ? (
      <div
        ref={mountGhost}
        className="priority-drag-ghost"
        data-drag-ghost
        data-ghost-task-id={draggedTask.id}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 200,
          pointerEvents: 'none',
        }}
      >
        {draggedTask.title}
      </div>
    ) : null;

  return (
    <div
      className="priority-board-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="priority-board-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="priority-board-title"
        data-priority-board
        data-disabled={disabled ? 'true' : undefined}
        onKeyDown={onPanelKeyDown}
      >
        <div className="priority-board-head">
          <h2 id="priority-board-title" className="text-heading-sm font-bold text-primary-deep">
            Sắp xếp công việc
          </h2>
          <button
            type="button"
            className="priority-board-close"
            aria-label="Đóng bảng sắp xếp"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {selectedId ? (
          <p className="priority-board-hint priority-board-hint--active">
            Đã chọn “{visible.find((task) => task.id === selectedId)?.title ?? ''}” — bấm ô đích để
            gán (Enter hoặc Space khi dùng bàn phím).
          </p>
        ) : (
          <>
            <p className="priority-board-hint">Kéo thẻ sang ô khác, hoặc chọn thẻ rồi gán bằng bàn phím.</p>
            <p className="priority-board-hint">
              Bàn phím: Enter chọn thẻ → mũi tên di chuyển giữa các ô → Enter hoặc Space gán vào ô.
            </p>
          </>
        )}
        {error && (
          <p className="priority-board-error" role="alert" data-priority-error>
            {error}
          </p>
        )}
        {successMessage && (
          <p className="priority-board-success" data-priority-success>
            {successMessage}
          </p>
        )}

        <div className="priority-board-grid">
          {PRIORITY_CELLS.map((cell, index) => {
            const items = visible.filter((task) => priorityOf(task) === cell.value);
            const isTarget = drag?.target === cell.value;
            return (
              <section
                key={cell.value}
                className={`priority-cell${isTarget ? ' priority-cell--drop' : ''}`}
                data-priority-cell={cell.value}
                data-drop-target={isTarget ? 'true' : undefined}
                aria-label={`Ô ${cell.short}: ${cell.label}`}
              >
                <h3 className="priority-cell-title">
                  <span className={`badge ${PRIORITY_BADGE[cell.value]}`}>{cell.short}</span>
                  <span className="priority-cell-label">{cell.label}</span>
                </h3>
                {/* Nút gán chỉ xuất hiện khi đang có thẻ được chọn — 4 nút disabled
                    luôn hiện là noise thị giác; khi chọn, D-03 tự focus nút ô đầu. */}
                {selectedId && (
                  <button
                    type="button"
                    className="priority-cell-assign"
                    data-cell-assign={cell.value}
                    disabled={disabled}
                    aria-label={`Chọn ô ${cell.short}: ${cell.label}`}
                    onClick={() => {
                      if (selectedId) void assign(selectedId, cell.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        focusCell(index + 1);
                      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        focusCell(index - 1);
                      }
                    }}
                  >
                    Gán vào đây
                  </button>
                )}
                <ul className="priority-cell-list">
                  {items.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="priority-card"
                        data-task-id={task.id}
                        aria-label={`Chọn việc "${task.title}" rồi chọn ô đích`}
                        aria-pressed={selectedId === task.id}
                        data-selected={selectedId === task.id ? 'true' : undefined}
                        onClick={() => {
                          if (!disabled) setSelectedId(task.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                            event.preventDefault();
                            focusCell(0);
                          }
                        }}
                        onPointerDown={onCardPointerDown(task.id)}
                        onPointerMove={onCardPointerMove(task.id)}
                        onPointerUp={onCardPointerUp(task.id)}
                        onPointerCancel={onCardPointerCancel(task.id)}
                        onLostPointerCapture={onCardPointerCancel(task.id)}
                      >
                        {task.title}
                      </button>
                    </li>
                  ))}
                </ul>
                {items.length === 0 && (
                  <p className="priority-cell-empty">Chưa có việc — kéo thẻ vào đây</p>
                )}
              </section>
            );
          })}
        </div>
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </div>
      {ghost}
    </div>
  );
}

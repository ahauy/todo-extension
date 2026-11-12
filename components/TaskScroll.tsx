/**
 * Một công việc = một cuộn thư. Trục cuộn trên/dưới là trang trí, nút đỏ son
 * bên trái đóng dấu XONG, dấu triện nghiêng −6° ép xuống đúng một lần khi
 * hoàn thành (không chạy lại khi cuộn danh sách). Việc đã xong giữ nguyên
 * chữ, không gạch ngang. Quá hạn đổi nền đỏ son nhạt.
 */
import React, { useEffect, useRef, useState } from 'react';
import { DeadlineChip, PriorityBadge, SubjectBadge } from './ui/Chips';
import { CheckIcon, RepeatIcon } from './art/Icons';
import type { Subject, Task } from '../lib/tasks/types';

const UNDO_MS = 5000;

interface TaskScrollProps {
  task: Task;
  subject: Subject | null;
  now: Date;
  compact?: boolean;
  fresh?: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function TaskScroll({
  task,
  subject,
  now,
  compact = false,
  fresh = false,
  onToggle,
  onOpen,
}: TaskScrollProps) {
  const overdue = !!task.dueAt && !task.done && new Date(task.dueAt) < now;
  const state = task.done ? 'done' : overdue ? 'overdue' : 'open';
  const wasDone = useRef(task.done);
  const [striking, setStriking] = useState(false);
  const [undoable, setUndoable] = useState(false);

  useEffect(() => {
    if (task.done && !wasDone.current) {
      setStriking(true);
      setUndoable(true);
      const timer = window.setTimeout(() => setUndoable(false), UNDO_MS);
      wasDone.current = task.done;
      return () => window.clearTimeout(timer);
    }
    wasDone.current = task.done;
    if (!task.done) setUndoable(false);
    return undefined;
  }, [task.done]);

  const doneSubtasks = task.subtasks.filter((item) => item.done).length;

  return (
    <article
      role="listitem"
      className={`scroll-task sheen ${compact ? '' : 'px-lg py-base'}`}
      data-state={state}
      data-fresh={fresh}
    >
      <div className="flex items-start gap-md">
        <button
          type="button"
          className="seal-button"
          aria-pressed={task.done}
          aria-label={
            task.done ? `Bỏ dấu xong: ${task.title}` : `Đánh dấu xong: ${task.title}`
          }
          onClick={() => onToggle(task.id)}
        >
          {task.done ? (
            <CheckIcon size={20} />
          ) : (
            /* Dấu son chưa đóng: đĩa đỏ son trống — chữ XONG là phần thưởng
               chỉ xuất hiện khi hoàn thành (seal-stamp bên phải). */
            null
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" className="scroll-title" onClick={() => onOpen(task.id)}>
            {task.title}
          </button>

          <div className="mt-xs flex flex-wrap items-center gap-xs">
            {task.dueAt && (
              <DeadlineChip
                dueAt={task.dueAt}
                now={now}
                done={task.done}
                recurring={task.recurrence.kind !== 'none'}
              />
            )}
            <PriorityBadge priority={task.priority} />
            {task.recurrence.kind !== 'none' && !task.dueAt && (
              <span className="chip">
                <RepeatIcon size={12} />
                Lặp lại
              </span>
            )}
          </div>

          <div className="mt-xs flex flex-wrap items-center gap-xs">
            <SubjectBadge subject={subject} />
            {task.tags.map((tag) => (
              <span key={tag} className={`text-caption ${state === 'overdue' ? 'text-brown' : 'text-umber'}`}>
                #{tag}
              </span>
            ))}
            {task.subtasks.length > 0 && (
              <span className={`tnum ml-auto flex items-center gap-xs text-caption ${state === 'overdue' ? 'text-brown' : 'text-umber'}`}>
                <span className="progress-ink w-14" style={{ height: 6 }}>
                  <span style={{ width: `${(doneSubtasks / task.subtasks.length) * 100}%` }} />
                </span>
                {doneSubtasks}/{task.subtasks.length}
              </span>
            )}
          </div>

          {undoable && (
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-sm"
              onClick={() => onToggle(task.id)}
            >
              Hoàn tác
            </button>
          )}
        </div>

        {task.done && (
          <span
            className="seal-stamp -mt-xs"
            data-size={compact ? 'sm' : 'md'}
            data-striking={striking}
            aria-hidden="true"
          >
            XONG
          </span>
        )}
      </div>
    </article>
  );
}
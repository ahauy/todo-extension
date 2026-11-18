/**
 * Một công việc = một cuộn thư. Trục cuộn trên/dưới là trang trí, nút đỏ son
 * bên trái đóng dấu XONG, dấu triện nghiêng −6° ép xuống đúng một lần khi
 * hoàn thành (không chạy lại khi cuộn danh sách). Việc đã xong giữ nguyên
 * chữ, không gạch ngang. Quá hạn đổi nền đỏ son nhạt.
 *
 * Bố cục hàng chip theo chế độ:
 * - Tab mới (mặc định): hai hàng trong cột nội dung — hàng 1 hạn chót /
 *   ưu tiên / "Lặp lại", hàng 2 môn / tag / tiến độ (ml-auto đẩy phải).
 * - Popup (compact): MỘT hàng flex-wrap duy nhất TRẢI toàn bề rộng thẻ
 *   (article-level, dưới hàng dấu triện + tiêu đề) — hạn chót · ưu tiên ·
 *   "Lặp lại" · môn · tag · tiến độ. Trải rộng để thẻ thấp lại (cột nội dung
 *   hẹp sẽ bắt hàng wrap 2 dòng). Hết chỗ wrap, không ẩn dữ liệu nào.
 *   Layout + acceptance mật độ nới: user duyệt 2026-11-12 (spec delta).
 */
import React, { useEffect, useRef, useState } from 'react';
import { DeadlineChip, PriorityBadge, SubjectBadge } from './ui/Chips';
import { CheckIcon, RepeatIcon, SealIcon } from './art/Icons';
import { isRecurringDoneToday } from '../lib/tasks/query';
import { habitStreak } from '../lib/tasks/habit';
import { dayKey } from '../lib/datetime';
import type { DayPlan, Subject, Task } from '../lib/tasks/types';

const UNDO_MS = 5000;

interface TaskScrollProps {
  task: Task;
  subject: Subject | null;
  now: Date;
  compact?: boolean;
  fresh?: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  /** R-20: nút "Tập trung việc này" chỉ hiện khi surface truyền handler. */
  onFocusTask?: (id: string) => void;
  /** R-20: việc đang gắn vào phiên focus — dùng để tô trạng thái. */
  activeTaskId?: string | null;
  /** R-21 — kế hoạch ngày; đọc con ếch của ngày hiện tại từ đây. */
  dayPlan?: DayPlan;
  /** R-21 — chọn/bỏ con ếch: (dayKey, taskId|null), 1 key/ngày. */
  selectFrog?: (dayKey: string, taskId: string | null) => void;
}

export default function TaskScroll({
  task,
  subject,
  now,
  compact = false,
  fresh = false,
  onToggle,
  onOpen,
  onFocusTask,
  activeTaskId,
  dayPlan,
  selectFrog,
}: TaskScrollProps) {
  const todayKey = dayKey(now);
  const frogTaskId = dayPlan?.[todayKey]?.frogTaskId ?? null;
  const isFrog = frogTaskId === task.id;
  const focusActive = !!onFocusTask && activeTaskId === task.id;
  const doneToday = isRecurringDoneToday(task, now);
  const completed = task.done || doneToday;
  // R-23 — badge chỉ tính khi ĐANG theo dõi. Chỉ đọc doneDays (O(31)/task),
  // không storage read, không nút bấm — undo R-11 vẫn đi qua seal hiện có.
  const habitTracked =
    !!task.habit && task.recurrence.kind !== 'none' && !task.archived;
  const habitStreakDays = habitTracked ? habitStreak(task, now) : 0;
  const overdue = !!task.dueAt && !completed && new Date(task.dueAt) < now;
  const state = task.done ? 'done' : doneToday ? 'done-today' : overdue ? 'overdue' : 'open';
  const wasCompleted = useRef(completed);
  const [striking, setStriking] = useState(false);
  const [undoable, setUndoable] = useState(false);

  useEffect(() => {
    if (completed && !wasCompleted.current) {
      setStriking(true);
      setUndoable(true);
      const timer = window.setTimeout(() => setUndoable(false), UNDO_MS);
      wasCompleted.current = completed;
      return () => window.clearTimeout(timer);
    }
    wasCompleted.current = completed;
    if (!completed) {
      setUndoable(false);
      setStriking(false);
    }
    return undefined;
  }, [completed]);

  const doneSubtasks = task.subtasks.filter((item) => item.done).length;

  /* R-21 — ribbon then chốt + dấu ếch. Hai dấu KHÁC màu LẪN khác chữ
     (R-21/R-19): "THEN CHỐT" vàng kim vs "Ếch hôm nay" xanh ngọc; khi chưa
     chọn thì nút nói "Chọn ếch". Nằm trong fragment chip dùng chung 2 nhánh
     nên compact/full cùng số con trong [data-chip-row] (gate parity). */
  const keystoneMarkers = (
    <>
      {task.keystone && (
        <span className="keystone-ribbon" data-marker="keystone">
          THEN CHỐT
        </span>
      )}
      {selectFrog && (
        <button
          type="button"
          className={`frog-toggle${isFrog ? ' is-frog' : ''}`}
          data-marker="frog"
          aria-pressed={isFrog}
          aria-label={
            isFrog ? `Bỏ ếch hôm nay: ${task.title}` : `Chọn làm ếch hôm nay: ${task.title}`
          }
          title={isFrog ? 'Bỏ ếch hôm nay' : 'Chọn làm ếch hôm nay'}
          onClick={() => selectFrog(todayKey, isFrog ? null : task.id)}
        >
          {isFrog ? 'Ếch hôm nay' : 'Chọn ếch'}
        </button>
      )}
    </>
  );

  /* Fragment chung cho cả 2 nhánh để DOM board giữ nguyên từng class
     (gate STRICT: board không đổi). Thứ tự: hạn chót · ưu tiên · "Lặp lại"
     — chip lặp chỉ là fallback khi việc lặp mà không có hạn chót. */
  const deadlinePriorityChips = (
    <>
      {keystoneMarkers}
      {doneToday && <span className="chip chip-done-today">đã làm hôm nay</span>}
      {habitTracked && (
        <span
          className="habit-streak-badge"
          data-habit-streak={habitStreakDays}
          aria-label={`Chuỗi thói quen ${habitStreakDays} ngày`}
          title={`Chuỗi thói quen ${habitStreakDays} ngày`}
        >
          Chuỗi {habitStreakDays} ngày
        </span>
      )}
      {!completed && task.recurrence.kind !== 'none' && task.dueAt && (
        <span className="chip chip-recurring">lặp</span>
      )}
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
    </>
  );

  /* pushProgressRight: board đẩy tiến độ sang phải bằng ml-auto như cũ;
     compact bỏ ml-auto để chip không bị đẩy lệch khi hàng wrap. */
  const metaChips = (pushProgressRight: boolean) => (
    <>
      <SubjectBadge subject={subject} />
      {task.tags.map((tag) => (
        <span key={tag} className={`text-caption ${state === 'overdue' ? 'text-brown' : 'text-umber'}`}>
          #{tag}
        </span>
      ))}
      {task.subtasks.length > 0 && (
        <span className={`tnum ${pushProgressRight ? 'ml-auto ' : ''}flex items-center gap-xs text-caption ${state === 'overdue' ? 'text-brown' : 'text-umber'}`}>
          <span className="progress-ink w-14" style={{ height: 6 }}>
            <span
              style={{ transform: `scaleX(${doneSubtasks / task.subtasks.length})` }}
            />
          </span>
          {doneSubtasks}/{task.subtasks.length}
        </span>
      )}
    </>
  );

  /* Nút Hoàn tác dùng chung 2 vị trí: board trong cột sau hàng 2; compact
     sau hàng chip trải rộng — cùng JSX để không lệch class/hành vi. */
  const undoButton = undoable && (
    <button
      type="button"
      className="btn btn-ghost btn-sm mt-sm"
      onClick={() => onToggle(task.id)}
    >
      Hoàn tác
    </button>
  );

  return (
    <article
      role="listitem"
      className={`scroll-task sheen ${compact ? '' : 'px-lg py-base'}`}
      data-state={state}
      data-fresh={fresh}
      data-focus-active={focusActive}
    >
      <div className="flex items-start gap-md">
        <button
          type="button"
          className="seal-button"
          aria-pressed={completed}
          title={task.done ? 'Bỏ dấu xong' : doneToday ? 'Bỏ dấu hôm nay' : 'Đóng dấu xong'}
          aria-label={
            task.done
              ? `Bỏ dấu xong: ${task.title}`
              : doneToday
                ? `Bỏ dấu hôm nay: ${task.title}`
                : `Đóng dấu xong: ${task.title}`
          }
          onClick={() => onToggle(task.id)}
        >
          {completed ? (
            <CheckIcon size={20} />
          ) : (
            /* Mộc mờ = affordance "bấm để đóng dấu"; chữ XONG là phần thưởng
               chỉ xuất hiện khi hoàn thành (seal-stamp bên phải). */
            <SealIcon size={20} className="seal-button-glyph" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" className="scroll-title" onClick={() => onOpen(task.id)}>
            {task.title}
          </button>

          {!compact && (
            /* Tab mới: giữ nguyên 2 hàng trong cột (gate STRICT: board không đổi). */
            <>
              <div data-chip-row="1" className="mt-xs flex flex-wrap items-center gap-xs">
                {deadlinePriorityChips}
              </div>

              <div data-chip-row="2" className="mt-xs flex flex-wrap items-center gap-xs">
                {metaChips(true)}
              </div>

              {undoButton}
            </>
          )}
        </div>

        {/* R-20: nút focus nằm cùng hàng hành động với dấu triện, ngoài
            [data-chip-row] nên không đụng gate parity compact/full. */}
        {onFocusTask && (
          <button
            type="button"
            className={`focus-task-button${focusActive ? ' is-active' : ''}`}
            aria-pressed={focusActive}
            aria-label={`Tập trung việc này: ${task.title}`}
            onClick={() => onFocusTask(task.id)}
          >
            Tập trung việc này
          </button>
        )}

        {completed && (
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

      {compact && (
        /* Popup: hàng chip trải toàn bề rộng thẻ (user duyệt 2026-11-12) —
           cột nội dung hẹp bắt wrap 2 dòng, trải rộng giúp thẻ thấp lại. */
        <>
          <div data-chip-row="1" className="mt-xs flex flex-wrap items-center gap-xs">
            {deadlinePriorityChips}
            {metaChips(false)}
          </div>
          {undoButton}
        </>
      )}
    </article>
  );
}

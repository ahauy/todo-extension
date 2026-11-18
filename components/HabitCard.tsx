/**
 * R-23 — Thẻ thói quen trên Bàn học (New Tab). Chỉ đọc Task đã hydrate; KHÔNG
 * storage read, KHÔNG ghi StudyLog. Bỏ dấu đi qua `onUnmark` (helper phase 1
 * ở App) — thao tác này chỉ đổi `doneDays`, không đụng dueAt/alarm/R-11.
 *
 * 21 ô là CỬA SỔ HIỂN THỊ kết thúc hôm nay; streak có thể dài hơn (tới 31).
 * Seal 7/14/21 chỉ là mốc ăn mừng — không phải kết luận khoa học.
 */
import React from 'react';
import { habitCells21, habitStreak, type HabitCellState } from '../lib/tasks/habit';
import type { Task } from '../lib/tasks/types';

interface HabitCardProps {
  tasks: Task[];
  now: Date;
  onUnmark: (taskId: string, day: string) => void;
}

const SEAL_MILESTONES = [7, 14, 21] as const;
const STATE_LABEL: Record<HabitCellState, string> = {
  done: 'Đã làm',
  missed: 'Thiếu',
  'off-calendar': 'Ngoài lịch',
};

export default function HabitCard({ tasks, now, onUnmark }: HabitCardProps) {
  const tracked = tasks
    .filter((task) => !task.archived && !!task.habit && task.recurrence.kind !== 'none')
    .map((task) => ({ task, streak: habitStreak(task, now) }))
    .sort(
      (left, right) =>
        right.streak - left.streak || left.task.title.localeCompare(right.task.title, 'vi')
    )
    .slice(0, 3);

  if (tracked.length === 0) return null;

  return (
    <section className="habit-card" data-habit-card aria-label="Thói quen">
      <h2 className="habit-card-title text-heading-sm text-ink-deep">Thói quen</h2>
      <div className="habit-card-list">
        {tracked.map(({ task, streak }) => {
          const cells = habitCells21(task, now);
          const seals = SEAL_MILESTONES.filter((milestone) => streak >= milestone);
          return (
            <article key={task.id} className="habit-card-item" data-habit-task={task.id}>
              <h3 className="habit-card-name text-body-sm text-ink">{task.title}</h3>
              <p className="habit-card-streak text-caption text-brown" data-habit-streak={streak}>
                Chuỗi {streak} ngày
              </p>

              {seals.length > 0 && (
                <div className="habit-seals" data-habit-seals={seals.join(',')} aria-hidden="true">
                  {seals.map((milestone) => (
                    <span key={milestone} className="habit-seal" data-habit-seal={milestone}>
                      {milestone}
                    </span>
                  ))}
                </div>
              )}

              <div className="habit-grid" role="group" aria-label={`Lưới 21 ngày: ${task.title}`}>
                {cells.map((cell) =>
                  cell.state === 'done' ? (
                    <button
                      key={cell.key}
                      type="button"
                      className="habit-cell habit-cell-done"
                      data-state="done"
                      data-habit-state="done"
                      data-day={cell.key}
                      aria-label={`Bỏ dấu ${cell.key} cho ${task.title}`}
                      title={`Bỏ dấu ${cell.key} cho ${task.title}`}
                      onClick={() => onUnmark(task.id, cell.key)}
                    >
                      <span aria-hidden="true">✓</span>
                    </button>
                  ) : (
                    <span
                      key={cell.key}
                      role="img"
                      className={`habit-cell habit-cell-${cell.state}`}
                      data-state={cell.state}
                      data-habit-state={cell.state}
                      data-day={cell.key}
                      aria-label={`${cell.key}: ${STATE_LABEL[cell.state]}`}
                      title={`${cell.key}: ${STATE_LABEL[cell.state]}`}
                    />
                  )
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="habit-card-copy text-caption text-umber">
        21 ô là cửa sổ hiển thị, chuỗi có thể dài hơn. 21 ngày là mốc ăn mừng, không phải kết luận
        khoa học.
      </p>
    </section>
  );
}

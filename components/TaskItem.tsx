/**
 * TaskItem row (L4-T12). Checkbox hit area 44×44, title button mở detail,
 * meta line (hạn, tiến độ subtask, tag, priority glyph), done state.
 * Tick done gọi onToggle (không tự lưu storage — lưu ở L6-T18).
 */
import React from 'react';
import Checkbox from './ui/Checkbox';
import PriorityGlyph from './ui/PriorityGlyph';
import SubtaskProgress from './ui/SubtaskProgress';
import TagChip from './ui/TagChip';
import type { Task } from '../lib/tasks/types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onOpenDetail }: TaskItemProps) {
  const isOverdue =
    !!task.dueAt && !task.done && new Date(task.dueAt) < new Date();
  const doneTags = task.tags.slice(0, 2);
  const extraTags = Math.max(0, task.tags.length - 2);

  return (
    <div
      role="listitem"
      className={`min-h-[52px] px-3 py-2 flex gap-2.5 items-start ${
        task.done
          ? 'bg-surface text-fg-muted'
          : 'bg-surface hover:bg-surface-hover active:scale-[0.98] border-b border-border-subtle last:border-b-0'
      } transition-colors duration-75`}
    >
      {/* Cột 1: checkbox hit area 44×44 */}
      <div className="flex items-start justify-center mt-0.5">
        <Checkbox
          checked={task.done}
          onChange={() => onToggle(task.id)}
          aria-label={`Đánh dấu xong: ${task.title}`}
        />
      </div>

      {/* Cột 2: title + meta */}
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onOpenDetail(task.id)}
          className={`text-body font-medium ${
            task.done ? 'line-through text-fg-muted' : 'text-fg'
          } line-clamp-2 hover:underline`}
        >
          {task.title}
        </button>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {/* Hạn */}
          {task.dueAt && (
            <time
              dateTime={task.dueAt}
              className={`text-meta ${
                isOverdue ? 'text-overdue font-medium' : 'text-fg-secondary'
              }`}
            >
              {isOverdue ? 'Quá hạn' : new Date(task.dueAt).toLocaleDateString(
                'vi-VN',
                { weekday: 'short', day: 'numeric', month: 'short' }
              )}
            </time>
          )}
          {/* Tiến độ subtask */}
          {task.subtasks.length > 0 && (
            <div className="flex items-center gap-1">
              <SubtaskProgress
                done={task.subtasks.filter((s) => s.done).length}
                total={task.subtasks.length}
              />
            </div>
          )}
          {/* Tags (tối đa 2 chip display-only + +2) */}
          {doneTags.map((tag) => (
            <TagChip key={tag} label={`#${tag}`} />
          ))}
          {extraTags > 0 && (
            <span className="text-meta text-fg-muted">+{extraTags}</span>
          )}
          {/* Priority glyph (ml-auto) */}
          <div className="ml-auto flex items-end gap-0.5">
            <PriorityGlyph priority={task.priority} />
          </div>
        </div>
      </div>
    </div>
  );
}

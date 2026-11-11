/**
 * TaskDetail panel (L5-T15). Toàn popup 360×600, mở từ title row.
 * Edit task: dirty state, lưu khi nút Lưu/Cmd+Enter, toggle done/subtask ghi ngay.
 * Task bị xoá nơi khác → thông báo + Đóng (không lưu đè).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';
import Field from './ui/Field';
import Segmented from './ui/Segmented';
import TagChip from './ui/TagChip';
import type { Task } from '../lib/tasks/types';
import { recurrenceForKind } from '../lib/tasks/recurrence';
import { loadAll } from '../lib/storage/adapter';

const MAX_NOTE = 1000;

interface TaskDetailProps {
  taskId: string;
  onSave: () => void;
  onDelete: () => void;
  onBack: () => void;
  onUpdateTask: (task: Task) => Promise<void>;
  onQuotaError?: (message: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function TaskDetail({
  taskId,
  onSave,
  onDelete,
  onBack,
  onUpdateTask,
  onQuotaError,
  onDirtyChange,
}: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [removedElsewhere, setRemovedElsewhere] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [noteCounter, setNoteCounter] = useState(0);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const localTask = useMemo(() => task, [task]);

  // Load task từ storage khi mount
  useEffect(() => {
    (async () => {
      const tasks = await loadAll();
      const found = tasks.find((t) => t.id === taskId);
      if (!found) {
        setRemovedElsewhere(true);
        return;
      }
      setTask(found);
      setNoteCounter(found.note.length);
    })();
  }, [taskId]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!localTask) return;
      setTask({ ...localTask, title: e.target.value });
      setDirty(true);
      setSaveError(null);
    },
    [localTask]
  );

  const handleNoteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!localTask) return;
      setTask({ ...localTask, note: e.target.value.slice(0, MAX_NOTE) });
      setNoteCounter(e.target.value.length);
      setDirty(true);
      setSaveError(null);
    },
    [localTask]
  );

  const handlePriorityChange = useCallback(
    (value: string) => {
      if (!localTask) return;
      setTask({ ...localTask, priority: value as Task['priority'] });
      setDirty(true);
      setSaveError(null);
    },
    [localTask]
  );

  const handleDueChange = useCallback(
    (value: string | null) => {
      if (!localTask) return;
      const recurrence =
        localTask.recurrence.kind === 'weekly' ||
        localTask.recurrence.kind === 'monthly'
          ? recurrenceForKind(localTask.recurrence.kind, value)
          : localTask.recurrence;
      setTask({ ...localTask, dueAt: value, recurrence });
      setDirty(true);
      setSaveError(null);
    },
    [localTask]
  );

  const handleRecurrenceChange = useCallback(
    (value: string) => {
      if (!localTask) return;
      setTask({
        ...localTask,
        recurrence: recurrenceForKind(value as Task['recurrence']['kind'], localTask.dueAt),
      });
      setDirty(true);
      setSaveError(null);
    },
    [localTask]
  );

  const handleSubtaskToggle = useCallback(
    async (id: string) => {
      if (!localTask) return;
      const next = {
        ...localTask,
        subtasks: localTask.subtasks.map((s) =>
          s.id === id ? { ...s, done: !s.done } : s
        ),
      };
      setTask(next);
      try {
        await onUpdateTask(next);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSaveError(msg);
        if (onQuotaError) onQuotaError(msg);
      }
    },
    [localTask, onQuotaError, onUpdateTask]
  );

  const handleSave = useCallback(async () => {
    if (!localTask || dirty === false) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onUpdateTask(localTask);
      setDirty(false);
      setSaving(false);
      onSave();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(msg);
      setSaving(false);
      if (onQuotaError) onQuotaError(msg);
    }
  }, [localTask, dirty, onSave, onQuotaError, onUpdateTask]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const isValid = useMemo(() => {
    if (!localTask) return false;
    return localTask.title.trim().length > 0;
  }, [localTask]);

  if (removedElsewhere) {
    return (
      <div className="h-[600px] flex flex-col">
        <header className="h-[52px] px-3 flex items-center justify-between bg-bg">
          <button
            type="button"
            onClick={onBack}
            className="text-fg-secondary hover:text-fg"
          >
            Quay lại
          </button>
          <div className="text-title font-medium text-fg">Việc đã bị xoá</div>
          <div className="w-9" />
        </header>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="text-fg text-body font-medium mb-2">
            Việc này đã bị xoá ở thiết bị khác.
          </div>
          <Button variant="primary" onClick={onBack} className="w-32">
            Đóng
          </Button>
        </div>
      </div>
    );
  }

  if (!localTask) {
    return null;
  }

  return (
    <div className="h-[600px] flex flex-col bg-bg">
      <header className="h-[52px] px-3 flex items-center justify-between bg-bg border-b border-border-subtle">
        <button type="button" onClick={onBack} className="text-fg-secondary hover:text-fg">
          Quay lại
        </button>
        <div className="text-title font-medium text-fg">Sửa việc</div>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <Field label="Tên việc" helper={`${localTask.title.length}/200`}>
          <input
            type="text"
            ref={titleRef}
            value={localTask.title}
            onChange={handleTitleChange}
            className="w-full h-10 px-2.5 rounded-control border border-border-control bg-surface text-body placeholder:text-fg-muted"
            maxLength={200}
            autoFocus
            disabled={saving}
          />
        </Field>

        <Field label="Ghi chú" helper={`${noteCounter}/${MAX_NOTE}`}>
          <textarea
            value={localTask.note}
            onChange={handleNoteChange}
            className="w-full h-32 px-2.5 rounded-control border border-border-control bg-surface text-body placeholder:text-fg-muted"
            placeholder="Ghi chú thêm về việc này…"
            maxLength={MAX_NOTE}
            disabled={saving}
          />
        </Field>

        <Field label="Ưu tiên">
          <Segmented
            options={[
              { value: 'low', label: 'Thấp' },
              { value: 'medium', label: 'Vừa' },
              { value: 'high', label: 'Cao' },
            ]}
            value={localTask.priority}
            onChange={handlePriorityChange}
          />
        </Field>

        <Field label="Hạn hết" helper="Chọn ngày và giờ">
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={localTask.dueAt ?? ''}
              onChange={(e) => handleDueChange(e.target.value || null)}
              className="flex-1 h-10 px-2.5 rounded-control border border-border-control bg-surface text-body"
              disabled={saving}
            />
            <Button
              variant="ghost"
              onClick={() => handleDueChange(null)}
              disabled={!localTask.dueAt || saving}
            >
              Bỏ hạn
            </Button>
          </div>
        </Field>

        <Field label="Lặp lại" helper="Không lặp / hàng tuần / hàng tháng">
          <Segmented
            options={[
              { value: 'none', label: 'Không' },
              { value: 'daily', label: 'Hàng ngày' },
              { value: 'weekly', label: 'Hàng tuần' },
              { value: 'monthly', label: 'Hàng tháng' },
            ]}
            value={localTask.recurrence.kind}
            onChange={handleRecurrenceChange}
          />
        </Field>

        <Field label="Thẻ" helper={`Tối đa 5 thẻ`}>
          <div className="flex flex-wrap gap-1.5">
            {localTask.tags.map((tag, i) => (
              <TagChip key={i} label={`#${tag}`} selected />
            ))}
            <span className="text-meta text-fg-muted">
              {localTask.tags.length}/5
            </span>
          </div>
        </Field>

        <Field label="Subtask" helper={`${localTask.subtasks.filter((s) => s.done).length}/${localTask.subtasks.length}`}>
          <div className="space-y-1">
            {localTask.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox
                  checked={s.done}
                  onChange={() => handleSubtaskToggle(s.id)}
                  aria-label={`Đánh dấu subtask: ${s.title}`}
                />
                <span
                  className={`text-meta text-fg-secondary ${
                    s.done ? 'line-through text-fg-muted' : ''
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </Field>

        <button
          type="button"
          onClick={handleDelete}
          className="text-meta text-danger hover:bg-surface-hover rounded-control px-2 py-1.5 flex items-center gap-1"
        >
          Xoá việc
        </button>
      </div>

      <footer
        className={`sticky bottom-0 px-3 py-2 flex items-center justify-between gap-2 bg-${
          saving ? 'surface' : 'bg'
        } border-t border-border-subtle z-10`}
      >
        {dirty && (
          <span className="text-meta text-fg-muted">
            Có thay đổi chưa lưu
          </span>
        )}
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-meta text-fg-secondary animate-pulse">
              Đang lưu…
            </span>
          )}
          {saveError && (
            <span className="text-meta text-danger">Lưu thất bại</span>
          )}
          <Button variant="ghost" onClick={onBack} disabled={saving}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isValid || !dirty || saving}
          >
            Lưu
          </Button>
        </div>
      </footer>

      {saveError && (
        <div className="fixed bottom-[70px] left-3 right-3 z-50">
          <div className="bg-danger-fill text-on-danger rounded-container px-3 py-2 text-body shadow-e2">
            {saveError}
          </div>
        </div>
      )}
    </div>
  );
}

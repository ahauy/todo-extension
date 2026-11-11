/**
 * Hộp thoại sửa một việc — tờ giấy da khung đôi vàng kim. Trong Popup nó
 * trượt từ dưới lên, trong New Tab nó căn giữa. Đổi chữ là "chưa lưu"; tick
 * việc nhỏ thì ghi ngay. Việc bị xoá ở máy khác thì báo chứ không lưu đè.
 * Cmd/Ctrl+Enter lưu nhanh.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Field from './ui/Field';
import TaskFields from './TaskFields';
import { formError, type TaskForm } from '../lib/tasks/form';
import { TrashIcon } from './art/Icons';
import { loadAll } from '../lib/storage/adapter';
import { longDate } from '../lib/datetime';
import type { Subject, Task } from '../lib/tasks/types';

interface TaskParchmentProps {
  taskId: string;
  subjects: Subject[];
  sheet?: boolean;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onUpdateTask: (task: Task) => Promise<void>;
  onQuotaError?: (message: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

function toForm(task: Task): TaskForm {
  return {
    title: task.title,
    note: task.note,
    priority: task.priority,
    dueAt: task.dueAt,
    recurrence: task.recurrence,
    tags: task.tags,
    subtasks: task.subtasks,
    subjectId: task.subjectId ?? null,
  };
}

export default function TaskParchment({
  taskId,
  subjects,
  sheet = false,
  onSave,
  onDelete,
  onClose,
  onUpdateTask,
  onQuotaError,
  onDirtyChange,
}: TaskParchmentProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm | null>(null);
  const [gone, setGone] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void loadAll().then((all) => {
      if (!alive) return;
      const found = all.find((item) => item.id === taskId);
      if (!found) {
        setGone(true);
        return;
      }
      setTask(found);
      setForm(toForm(found));
    });
    return () => {
      alive = false;
    };
  }, [taskId]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const patch = useCallback((next: Partial<TaskForm>) => {
    setForm((prev) => (prev ? { ...prev, ...next } : prev));
    setDirty(true);
    setSaveError(null);
  }, []);

  const problem = useMemo(
    () => (form ? formError(form, form.recurrence.kind !== task?.recurrence.kind) : null),
    [form, task]
  );

  const save = useCallback(async () => {
    if (!task || !form || !dirty || problem) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onUpdateTask({ ...task, ...form, title: form.title.trim(), note: form.note.trim() });
      setDirty(false);
      onSave();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message);
      onQuotaError?.(message);
    } finally {
      setSaving(false);
    }
  }, [task, form, dirty, problem, onUpdateTask, onSave, onQuotaError]);

  const toggleSubtask = useCallback(
    async (id: string) => {
      if (!task || !form) return;
      const subtasks = form.subtasks.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      );
      setForm({ ...form, subtasks });
      try {
        await onUpdateTask({ ...task, subtasks });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSaveError(message);
        onQuotaError?.(message);
      }
    },
    [task, form, onUpdateTask, onQuotaError]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void save();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [save]);

  if (gone) {
    return (
      <Modal open onClose={onClose} title="Việc đã bị xoá" sheet={sheet}>
        <p className="text-body-md text-brown">
          Việc này đã bị xoá ở một thiết bị khác. Sổ không ghi đè lên thay đổi đó.
        </p>
        <div className="mt-lg flex justify-end">
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Đóng
          </Button>
        </div>
      </Modal>
    );
  }

  if (!task || !form) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Sửa việc"
      sheet={sheet}
      footer={
        <>
          {dirty && <span className="mr-auto text-caption text-umber">Có thay đổi chưa lưu</span>}
          {saving && <span className="text-caption text-umber">Đang lưu…</span>}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Để sau
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={!dirty || !!problem || saving}>
            Lưu
          </Button>
        </>
      }
    >
      <p className="mb-base text-caption text-umber">
        Ghi vào sổ ngày {longDate(new Date(task.createdAt))}
      </p>

      <div className="stack gap-base">
        <Field label="Tên việc" helper={`${form.title.length}/200 ký tự`} error={problem ?? undefined}>
          <input
            type="text"
            className="text-input"
            value={form.title}
            maxLength={200}
            disabled={saving}
            data-autofocus
            onChange={(event) => patch({ title: event.target.value })}
          />
        </Field>

        <TaskFields
          form={form}
          subjects={subjects}
          onChange={(next) => {
            if (next.subtasks) {
              const before = form.subtasks;
              const changed = next.subtasks.find(
                (item, index) => before[index] && before[index].done !== item.done
              );
              if (changed && next.subtasks.length === before.length) {
                void toggleSubtask(changed.id);
                return;
              }
            }
            patch(next);
          }}
        />

        <button
          type="button"
          onClick={onDelete}
          className="btn btn-danger btn-sm self-start"
        >
          <TrashIcon size={16} />
          Xoá việc
        </button>

        {saveError && (
          <p role="alert" className="text-body-sm text-critical">
            Không lưu được: {saveError}
          </p>
        )}
      </div>
    </Modal>
  );
}
/**
 * R-25 — popup tạo/sửa việc neo sát con trỏ trên timeline New Tab.
 * Không dùng cho extension popup 360×560 (R-19) — component này chỉ chạy ở New Tab.
 * `endAt` là nguồn thật; `TaskFields` ẩn hạn chót/lặp/thói quen theo spec R-25.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from './ui/Button';
import Field from './ui/Field';
import TaskFields from './TaskFields';
import { toForm } from './TaskParchment';
import {
  emptyForm,
  formError,
  formErrors,
  formToDraft,
  type TaskDraft,
  type TaskForm,
} from '../lib/tasks/form';
import type { Subject, Task } from '../lib/tasks/types';

export interface PopupAnchor {
  x: number;
  y: number;
}

interface TaskEntryPopupProps {
  mode: 'create' | 'edit';
  task?: Task | null;
  anchor: PopupAnchor;
  subjects: Subject[];
  defaultSubjectId?: string | null;
  keystoneCount?: number;
  /** R-25 — khoảng start→end đã kéo điền sẵn khi mở popup tạo. */
  initialTime?: { startAt?: string | null; endAt?: string | null };
  onCreate: (draft: TaskDraft) => Promise<void>;
  onUpdate: (task: Task) => Promise<void>;
  onClose: () => void;
}

const POPUP_W = 420;
const POPUP_H = 560;
const EDGE = 12;

function clampAnchor(anchor: PopupAnchor): React.CSSProperties {
  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const width = Math.min(POPUP_W, vw - EDGE * 2);
  const height = Math.min(POPUP_H, vh - EDGE * 2);
  return {
    left: Math.max(EDGE, Math.min(anchor.x, vw - width - EDGE)),
    top: Math.max(EDGE, Math.min(anchor.y, vh - height - EDGE)),
    width,
    maxHeight: height,
  };
}

export default function TaskEntryPopup({
  mode,
  task = null,
  anchor,
  subjects,
  defaultSubjectId = null,
  keystoneCount = 0,
  initialTime,
  onCreate,
  onUpdate,
  onClose,
}: TaskEntryPopupProps) {
  const [form, setForm] = useState<TaskForm>(() => {
    const base = task ? toForm(task) : { ...emptyForm(defaultSubjectId) };
    return {
      ...base,
      startAt: initialTime?.startAt ?? base.startAt,
      endAt: initialTime?.endAt ?? base.endAt,
    };
  });
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const style = useMemo(() => clampAnchor(anchor), [anchor.x, anchor.y]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const requestClose = useCallback(() => {
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (confirming) setConfirming(false);
        else requestClose();
      }
    };
    const onDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) requestClose();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [confirming, requestClose]);

  const patch = useCallback((next: Partial<TaskForm>) => {
    setForm((prev) => ({ ...prev, ...next }));
    setDirty(true);
    setError(null);
  }, []);

  const errors = formErrors(form, !task || form.recurrence.kind !== task.recurrence.kind);
  const problem = formError(form, !task || form.recurrence.kind !== task.recurrence.kind);

  const submit = useCallback(async () => {
    if (problem || saving) return;
    setSaving(true);
    setError(null);
    const draft = formToDraft(form);
    try {
      if (mode === 'edit' && task) {
        // Giữ id/timestamp/done của tờ cũ — draft luôn mang done:false.
        await onUpdate({ ...task, ...draft, done: task.done });
      } else {
        await onCreate(draft);
      }
      onClose();
    } catch (caught) {
      // R-16/R-25 — lỗi quota: popup ở lại, hiện lỗi inline, KHÔNG toast, KHÔNG mutate snapshot.
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSaving(false);
    }
  }, [form, mode, onClose, onCreate, onUpdate, problem, saving, task]);

  /** R-19/R-25 — aria-modal phải đi kèm focus trap: Tab không thoát khỏi popup. */
  const trapFocus = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={trapFocus}
      aria-label={mode === 'create' ? 'Ghi việc mới vào thời khoá biểu' : 'Sửa việc trên thời khoá biểu'}
      className="task-entry-popup"
      style={style}
      data-mode={mode}
    >
      <div className="task-entry-popup-head">
        <h3 className="text-caption font-bold text-brown">
          {mode === 'create' ? 'Việc mới' : 'Sửa việc'}
        </h3>
        <button
          type="button"
          className="btn-icon size-8"
          aria-label="Đóng hộp việc"
          onClick={requestClose}
        >
          ×
        </button>
      </div>

      <div className="task-entry-popup-body stack gap-base">
        <Field label="Tên việc" error={errors.title} helper="Bắt buộc, tối đa 200 ký tự">
          <input
            ref={titleRef}
            type="text"
            className="text-input"
            value={form.title}
            maxLength={200}
            placeholder="Hôm nay con cần làm gì?"
            aria-label="Tên việc cần ghi"
            onChange={(event) => patch({ title: event.target.value })}
          />
        </Field>

        <TaskFields
          form={form}
          subjects={subjects}
          errors={errors}
          onChange={patch}
          keystoneCount={keystoneCount}
          withTime
          withDue={false}
          withRecurrence={false}
        />
      </div>

      {error && (
        <p className="text-body-sm text-critical" role="alert">
          {error}
        </p>
      )}

      {confirming && (
        <div className="task-entry-popup-confirm" role="alertdialog" aria-label="Bỏ thay đổi?">
          <p className="text-body-sm text-ink">Bỏ những gì vừa nhập?</p>
          <div className="flex gap-xs">
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Ở lại
            </Button>
            <Button variant="danger" size="sm" onClick={onClose}>
              Bỏ
            </Button>
          </div>
        </div>
      )}

      <div className="task-entry-popup-foot flex items-center justify-end gap-xs">
        <Button variant="ghost" size="sm" onClick={requestClose}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" onClick={() => void submit()} disabled={!!problem || saving}>
          Ghi vào sổ
        </Button>
      </div>
    </div>
  );
}

/**
 * TaskComposer (L4-T11). Collapsed (80px) + expanded (max 380px).
 * Validation inline: title, priority, due date, recurrence, tag, subtask.
 * Tick subtask không đổi trạng thái task cha (R-08).
 * Lưu khi submit (L6-T18 useTasks), component chỉ gọi onSubmit.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';
import Field from './ui/Field';
import IconButton from './ui/IconButton';
import Segmented from './ui/Segmented';
import TagChip from './ui/TagChip';
import type { RecurrenceRule, Task } from '../lib/tasks/types';
import { recurrenceForKind } from '../lib/tasks/recurrence';

const MAX_TITLE = 200;
const MAX_TAGS = 5;
const MAX_TAG_LEN = 20;
const MAX_SUBTASKS = 50;

interface TaskComposerProps {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  initial?: Partial<Task>;
  expandSignal?: number;
}

export default function TaskComposer({
  onSubmit,
  onCancel,
  initial = {},
  expandSignal,
}: TaskComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastExpandSignal = useRef(expandSignal);

  useEffect(() => {
    if (expandSignal !== undefined && expandSignal !== lastExpandSignal.current) {
      lastExpandSignal.current = expandSignal;
      setExpanded(true);
      titleInputRef.current?.focus();
    }
  }, [expandSignal]);

  useEffect(() => {
    if (expanded) titleInputRef.current?.focus();
  }, [expanded]);
  const [title, setTitle] = useState(initial.title ?? '');
  const [note, setNote] = useState(initial.note ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueAt, setDueAt] = useState<string | null>(initial.dueAt ?? null);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    kind: 'none',
  });

  const handleRecurrenceChange = useCallback(
    (v: string) => {
      setRecurrence(recurrenceForKind(v as RecurrenceRule['kind'], dueAt));
    },
    [dueAt]
  );

  const handleDueChange = useCallback((value: string | null) => {
    setDueAt(value);
    setRecurrence((prev) =>
      prev.kind === 'weekly' || prev.kind === 'monthly'
        ? recurrenceForKind(prev.kind, value)
        : prev
    );
  }, []);
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; done: boolean }[]>(
    initial.subtasks ?? []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid = useMemo(() => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Nhập tên việc trước khi thêm.';
    else if (title.length > MAX_TITLE)
      next.title = 'Tên việc tối đa 200 ký tự.';
    if (
      recurrence.kind !== 'none' &&
      (!dueAt || new Date(dueAt) <= new Date())
    )
      next.dueAt = 'Cần đặt hạn trước khi chọn lặp lại.';
    const trimmedTags = tags.filter(Boolean);
    if (trimmedTags.length > MAX_TAGS)
      next.tags = `Tối đa ${MAX_TAGS} thẻ.`;
    for (const tag of trimmedTags) {
      if (tag.length < 1 || tag.length > MAX_TAG_LEN)
        next.tags = `Mỗi thẻ từ 1-${MAX_TAG_LEN} ký tự.`;
    }
    const uniqueTags = new Set(trimmedTags);
    if (uniqueTags.size !== trimmedTags.length)
      next.tags = 'Không được trùng thẻ.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, dueAt, recurrence, tags]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    const trimmedTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
    onSubmit({
      title: title.trim(),
      note: note.trim(),
      priority,
      dueAt: dueAt ?? null,
      recurrence,
      tags: trimmedTags.slice(0, MAX_TAGS),
      subtasks: subtasks.map((s) => ({ ...s, done: false })),
      done: false,
    });
  }, [title, note, priority, dueAt, recurrence, tags, subtasks, isValid, onSubmit]);

  const handleAddTag = useCallback(() => {
    // handled via input below
  }, []);

  return (
    <div
      className={`mx-3 rounded-container border border-border bg-surface shadow-e1 ${
        expanded ? 'max-h-[380px] overflow-y-auto' : 'h-[80px] overflow-hidden'
      } transition-all duration-150`}
    >
      {/* Collapsed header */}
      <div
        className="px-3 py-2 flex items-center justify-between bg-surface cursor-pointer"
        onClick={() => setExpanded(true)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-fg">Thêm việc</div>
          <div className="text-meta text-fg-muted">
            Nhấn để chi tiết hơn
          </div>
        </div>
        <Button variant="ghost" onClick={() => setExpanded(true)}>
          +
        </Button>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-3 py-2 space-y-3">
          <Field label="Tên việc" helper={title.length === 0 ? 'Bắt buộc' : undefined}>
            <input
              type="text"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-2.5 rounded-control border border-border-control bg-surface text-body placeholder:text-fg-muted"
              placeholder="Ví dụ: Mua sắm tuần"
              maxLength={MAX_TITLE}
              autoFocus
            />
            {title.length > 180 && (
              <span className="text-meta text-fg-muted">
                {title.length}/{MAX_TITLE}
              </span>
            )}
          </Field>

          <div className="flex flex-col gap-2">
            <div className="text-meta text-fg-secondary">Ưu tiên</div>
            <Segmented
              options={[
                { value: 'low', label: 'Thấp' },
                { value: 'medium', label: 'Vừa' },
                { value: 'high', label: 'Cao' },
              ]}
              value={priority}
              onChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}
            />
          </div>

          <Field label="Hạn hết" helper="Chọn ngày và giờ">
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={dueAt ?? ''}
                onChange={(e) => handleDueChange(e.target.value || null)}
                className="flex-1 h-10 px-2.5 rounded-control border border-border-control bg-surface text-body"
              />
              <Button
                variant="ghost"
                onClick={() => handleDueChange(null)}
                disabled={!dueAt}
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
              value={recurrence.kind}
              onChange={handleRecurrenceChange}
            />
            {recurrence.kind !== 'none' && (
              <div className="text-meta text-fg-muted">
                Hạn sẽ được lặp lại theo quy tắc đã chọn.
              </div>
            )}
          </Field>

          <Field label="Thẻ" helper={`Tối đa ${MAX_TAGS} thẻ, mỗi thẻ 1-${MAX_TAG_LEN} ký tự`}>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <TagChip
                  key={i}
                  label={tag}
                  selected
                  onPress={() =>
                    setTags(tags.filter((_, j) => j !== i))
                  }
                />
              ))}
              <input
                type="text"
                value=""
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v && tags.length < MAX_TAGS && !tags.includes(v)) {
                    setTags([...tags, v]);
                  }
                  e.target.value = '';
                }}
                placeholder="+ thẻ"
                className="h-8 px-2.5 rounded-chip bg-surface-sunken text-fg-secondary border border-border-control focus:border-focus-ring focus:outline-none focus:outline-2 focus:outline-offset-1"
              />
              {tags.length >= MAX_TAGS && (
                <span className="text-meta text-danger">Tối đa {MAX_TAGS} thẻ</span>
              )}
            </div>
          </Field>

          <Field label="Subtask" helper="Gõ rồi nhấn Enter để thêm">
            <div className="flex gap-1.5">
              <input
                type="text"
                value=""
                onChange={(e) => {
                  // handled by keydown
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v && subtasks.length < MAX_SUBTASKS) {
                      setSubtasks([
                        ...subtasks,
                        { id: crypto.randomUUID(), title: v, done: false },
                      ]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                placeholder="+ subtask"
                className="flex-1 h-8 px-2.5 rounded-control border border-border-control bg-surface text-body"
              />
              <span className="text-meta text-fg-muted tabular-nums">
                {subtasks.length}/{MAX_SUBTASKS}
              </span>
            </div>
            {subtasks.length > 0 && (
              <div className="ml-3 space-y-1">
                {subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={s.done}
                      onChange={(done) =>
                        setSubtasks(
                          subtasks.map((t) =>
                            t.id === s.id ? { ...t, done } : t
                          )
                        )
                      }
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
            )}
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setExpanded(false)}>
              Thu gọn
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              Lưu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

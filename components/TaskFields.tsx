/**
 * Các trường chi tiết của một việc — dùng chung cho khu ghi việc và hộp thoại
 * sửa việc. Không chứa tiêu đề: chỗ ghi nhanh dùng ô bút lông, chỗ sửa dùng
 * ô chữ thường. Mọi validation nằm ở component cha để hai nơi dùng một luật.
 */
import React, { useState } from 'react';
import Field from './ui/Field';
import Segmented from './ui/Segmented';
import Checkbox from './ui/Checkbox';
import Button from './ui/Button';
import { CloseIcon, PlusIcon } from './art/Icons';
import { recurrenceForKind } from '../lib/tasks/recurrence';
import type { Priority, RecurrenceRule, Subject } from '../lib/tasks/types';
import { toLocalInput } from '../lib/datetime';
import {
  MAX_NOTE,
  MAX_SUBTASKS,
  MAX_TAGS,
  MAX_TAG_LEN,
  type TaskForm,
} from '../lib/tasks/form';

interface TaskFieldsProps {
  form: TaskForm;
  subjects: Subject[];
  onChange: (patch: Partial<TaskForm>) => void;
  withNote?: boolean;
}

export default function TaskFields({ form, subjects, onChange, withNote = true }: TaskFieldsProps) {
  const [tagDraft, setTagDraft] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');

  const setDue = (value: string | null) => {
    const recurrence =
      form.recurrence.kind === 'weekly' || form.recurrence.kind === 'monthly'
        ? recurrenceForKind(form.recurrence.kind, value)
        : form.recurrence;
    onChange({ dueAt: value, recurrence });
  };

  const commitTag = () => {
    const tag = tagDraft.trim().replace(/^#/, '');
    if (!tag || tag.length > MAX_TAG_LEN) return;
    if (form.tags.length >= MAX_TAGS || form.tags.includes(tag)) return;
    onChange({ tags: [...form.tags, tag] });
    setTagDraft('');
  };

  const commitSubtask = () => {
    const title = subtaskDraft.trim();
    if (!title || form.subtasks.length >= MAX_SUBTASKS) return;
    onChange({
      subtasks: [...form.subtasks, { id: crypto.randomUUID(), title, done: false }],
    });
    setSubtaskDraft('');
  };

  return (
    <div className="stack gap-base">
      <div className="grid gap-base sm:grid-cols-2">
        <Field label="Môn học" helper="Gáy sách để xếp việc lên giá">
          <select
            className="text-input"
            value={form.subjectId ?? ''}
            onChange={(event) => onChange({ subjectId: event.target.value || null })}
          >
            <option value="">Chưa xếp môn</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Hạn chót" helper="Ngày và giờ cần xong">
          <div className="flex items-center gap-sm">
            <input
              type="datetime-local"
              className="text-input flex-1"
              value={toLocalInput(form.dueAt)}
              onChange={(event) => setDue(event.target.value || null)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 whitespace-nowrap"
              onClick={() => setDue(null)}
              disabled={!form.dueAt}
            >
              Bỏ hạn
            </Button>
          </div>
        </Field>
      </div>

      <Field label="Ưu tiên">
        <Segmented
          aria-label="Ưu tiên"
          options={[
            { value: 'low', label: 'Thấp' },
            { value: 'medium', label: 'Vừa' },
            { value: 'high', label: 'Cao' },
          ]}
          value={form.priority}
          onChange={(value) => onChange({ priority: value as Priority })}
        />
      </Field>

      <Field
        label="Lặp lại"
        helper={
          form.recurrence.kind === 'none'
            ? 'Việc chỉ làm một lần'
            : 'Xong một lần, hạn tự nhảy sang lần sau'
        }
      >
        <Segmented
          aria-label="Lặp lại"
          options={[
            { value: 'none', label: 'Không' },
            { value: 'daily', label: 'Hàng ngày' },
            { value: 'weekly', label: 'Hàng tuần' },
            { value: 'monthly', label: 'Hàng tháng' },
          ]}
          value={form.recurrence.kind}
          onChange={(value) =>
            onChange({ recurrence: recurrenceForKind(value as RecurrenceRule['kind'], form.dueAt) })
          }
        />
      </Field>

      {withNote && (
        <Field label="Ghi chú" helper={`${form.note.length}/${MAX_NOTE} ký tự`}>
          <textarea
            className="text-area"
            value={form.note}
            maxLength={MAX_NOTE}
            placeholder="Ghi thêm điều cần nhớ về việc này…"
            onChange={(event) => onChange({ note: event.target.value })}
          />
        </Field>
      )}

      <Field label="Thẻ" helper={`Tối đa ${MAX_TAGS} thẻ, mỗi thẻ 1–${MAX_TAG_LEN} ký tự`}>
        <div className="flex flex-wrap items-center gap-xs">
          {form.tags.map((tag) => (
            <span key={tag} className="chip">
              #{tag}
              <button
                type="button"
                aria-label={`Bỏ thẻ ${tag}`}
                className="ml-xxs text-umber"
                onClick={() => onChange({ tags: form.tags.filter((item) => item !== tag) })}
              >
                <CloseIcon size={12} />
              </button>
            </span>
          ))}
          {form.tags.length < MAX_TAGS && (
            <input
              type="text"
              className="text-input h-9 w-32 py-xs text-body-sm"
              value={tagDraft}
              placeholder="+ thẻ"
              aria-label="Thêm thẻ"
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  commitTag();
                }
              }}
              onBlur={commitTag}
            />
          )}
        </div>
      </Field>

      <Field label="Việc nhỏ" helper={`${form.subtasks.length}/${MAX_SUBTASKS} bước`}>
        <div className="stack gap-xs">
          {form.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-sm">
              <Checkbox
                checked={subtask.done}
                aria-label={`Đánh dấu subtask: ${subtask.title}`}
                onChange={(done) =>
                  onChange({
                    subtasks: form.subtasks.map((item) =>
                      item.id === subtask.id ? { ...item, done } : item
                    ),
                  })
                }
              />
              <span className={`flex-1 text-body-sm ${subtask.done ? 'text-umber' : 'text-ink'}`}>
                {subtask.title}
              </span>
              <button
                type="button"
                aria-label={`Bỏ bước ${subtask.title}`}
                className="btn-icon size-8"
                onClick={() =>
                  onChange({ subtasks: form.subtasks.filter((item) => item.id !== subtask.id) })
                }
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
          {form.subtasks.length < MAX_SUBTASKS && (
            <div className="flex items-center gap-sm">
              <input
                type="text"
                className="text-input flex-1"
                value={subtaskDraft}
                placeholder="Thêm một bước rồi nhấn Enter"
                aria-label="Thêm việc nhỏ"
                onChange={(event) => setSubtaskDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitSubtask();
                  }
                }}
              />
              <Button variant="ghost" size="sm" onClick={commitSubtask} disabled={!subtaskDraft.trim()}>
                <PlusIcon size={16} />
                Thêm
              </Button>
            </div>
          )}
        </div>
      </Field>

      {subjects.length === 0 && (
        <p className="text-caption text-umber">
          Chưa có môn nào trên giá sách. Thêm môn ở cột Giá sách để xếp việc gọn hơn.
        </p>
      )}
    </div>
  );
}
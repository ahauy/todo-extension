/**
 * Các trường chi tiết của một việc — dùng chung cho khu ghi việc và hộp thoại
 * sửa việc. Không chứa tiêu đề: chỗ ghi nhanh dùng ô bút lông, chỗ sửa dùng
 * ô chữ thường. Mọi validation nằm ở component cha để hai nơi dùng một luật.
 */
import React, { useEffect, useState } from 'react';
import Field from './ui/Field';
import Segmented from './ui/Segmented';
import Checkbox from './ui/Checkbox';
import Button from './ui/Button';
import { CloseIcon, PlusIcon } from './art/Icons';
import { recurrenceForKind } from '../lib/tasks/recurrence';
import { withHabitEnabled } from '../lib/tasks/habit';
import { MAX_ESTIMATE_MIN, MIN_ESTIMATE_MIN } from '../lib/tasks/timeBlock';
import type { Priority, RecurrenceRule, Subject } from '../lib/tasks/types';
import { toLocalInput } from '../lib/datetime';
import {
  MAX_NOTE,
  MAX_SUBTASKS,
  MAX_TAGS,
  MAX_TAG_LEN,
  keystoneWarning,
  type TaskForm,
  type TaskFormErrors,
} from '../lib/tasks/form';

interface TaskFieldsProps {
  form: TaskForm;
  subjects: Subject[];
  errors?: TaskFormErrors;
  onChange: (patch: Partial<TaskForm>) => void;
  withNote?: boolean;
  /** Số việc then chốt đang mở ngoài tờ này — để cảnh báo không đếm đôi. */
  keystoneCount?: number;
  /** R-23 — mốc ISO cho `startedAt` lúc bật; mặc định lúc bấm (dùng được để test). */
  now?: Date;
  /** R-24/R-25 — giờ bắt đầu/kết thúc + độ dài: hộp sửa việc / popup timeline bật. */
  withTime?: boolean;
  /** R-25 — popup timeline và tờ sửa việc không còn nhập hạn chót; task cũ vẫn giữ dữ liệu. */
  withDue?: boolean;
  /** R-25 — popup timeline ẩn lặp lại + habit (R-10 cần `dueAt` cho lặp ≠ none). */
  withRecurrence?: boolean;
}

/** 0=CN … 6=T7 — khớp `WeeklyRule.weekdays` / `Date.getDay()`. */
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

export default function TaskFields({
  form,
  subjects,
  errors,
  onChange,
  withNote = true,
  keystoneCount = 0,
  now,
  withTime = false,
  withDue = true,
  withRecurrence = true,
}: TaskFieldsProps) {
  const [tagDraft, setTagDraft] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  // R-23 — trạng thái HIỂN THỊ của toggle. Tắt chỉ ẩn: `form.habit` vẫn được
  // giữ lại để không xoá sổ khi lưu (data layer không xoá field).
  const [habitOn, setHabitOn] = useState(() => !!form.habit);

  useEffect(() => {
    setHabitOn(!!form.habit);
  }, [form.habit]);

  // R-21 — tổng then chốt đang mở SAU khi tờ này bật; chỉ cảnh báo, không chặn lưu.
  const warning = keystoneWarning(keystoneCount + (form.keystone ? 1 : 0));

  const weekdays =
    form.recurrence.kind === 'weekly' && Array.isArray(form.recurrence.rule?.weekdays)
      ? form.recurrence.rule.weekdays
      : [];

  /** R-10 — picker nhiều thứ nhưng luôn giữ ≥1 ngày. */
  const toggleWeekday = (day: number) => {
    if (form.recurrence.kind !== 'weekly') return;
    const selected = weekdays.includes(day);
    if (selected && weekdays.length <= 1) return;
    const next = selected
      ? weekdays.filter((value) => value !== day)
      : [...weekdays, day].sort((left, right) => left - right);
    onChange({ recurrence: { kind: 'weekly', rule: { weekdays: next } } });
  };

  /** R-23 — dùng chung helper phase 1: bật gán sổ mới, tắt giữ sổ cũ. */
  const toggleHabit = () => {
    const nextOn = !habitOn;
    const next = withHabitEnabled(form, nextOn, now ?? new Date());
    setHabitOn(nextOn);
    onChange({ habit: next.habit });
  };

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

        {withDue && (
          <Field label="Hạn chót" helper="Ngày và giờ cần xong" error={errors?.dueAt}>
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
        )}
      </div>

      {withTime && (
        <div className="grid gap-base sm:grid-cols-3">
          <Field
            label="Giờ bắt đầu"
            helper="Trong ngày, 00:00–23:59"
            error={errors?.startAt}
          >
            <input
              type="time"
              className="text-input"
              value={form.startAt ?? ''}
              aria-label="Giờ bắt đầu"
              onChange={(event) => onChange({ startAt: event.target.value || null })}
            />
          </Field>

          <Field
            label="Giờ kết thúc"
            helper="Trống = dùng độ dài dự kiến"
            error={errors?.endAt}
          >
            <input
              type="time"
              className="text-input"
              value={form.endAt ?? ''}
              aria-label="Giờ kết thúc"
              onChange={(event) => onChange({ endAt: event.target.value || null })}
            />
          </Field>

          <Field
            label="Độ dài dự kiến"
            helper={`${MIN_ESTIMATE_MIN}–${MAX_ESTIMATE_MIN} phút, trống = 30 phút`}
            error={errors?.estimateMin}
          >
            <input
              type="number"
              inputMode="numeric"
              min={MIN_ESTIMATE_MIN}
              max={MAX_ESTIMATE_MIN}
              step={5}
              className="text-input"
              value={form.estimateMin ?? ''}
              onChange={(event) => {
                const raw = event.target.value;
                onChange({ estimateMin: raw === '' ? null : Number(raw) });
              }}
            />
          </Field>
        </div>
      )}

      <Field label="Ưu tiên">
        <Segmented
          aria-label="Ưu tiên"
          options={[
            { value: 'important-urgent', label: 'Quan trọng, cấp bách' },
            { value: 'important-not-urgent', label: 'Quan trọng, không cấp bách' },
            { value: 'not-important-urgent', label: 'Không quan trọng, cấp bách' },
            { value: 'not-important-not-urgent', label: 'Không quan trọng, không cấp bách' },
          ]}
          value={form.priority}
          onChange={(value) => onChange({ priority: value as Priority })}
        />
      </Field>

      <Field label="Việc then chốt" helper="Bật tự đẩy ưu tiên Quan trọng, cấp bách; tắt không hạ ưu tiên">
        <button
          type="button"
          role="switch"
          aria-checked={!!form.keystone}
          aria-label="Việc then chốt"
          className="keystone-switch"
          onClick={() =>
            onChange(
              form.keystone
                ? { keystone: false }
                : { keystone: true, priority: 'important-urgent' }
            )
          }
        >
          <span className="keystone-switch-track" aria-hidden="true">
            <span className="keystone-switch-knob" />
          </span>
          <span className="text-body-sm text-ink">
            {form.keystone ? 'Đang giữ then chốt' : 'Không then chốt'}
          </span>
        </button>
        {warning && (
          <p className="keystone-warning text-caption text-critical" role="status">
            {warning}
          </p>
        )}
      </Field>

      {withRecurrence && (
        <>
        <Field
          label="Lặp lại"
        helper={
          form.recurrence.kind === 'none'
            ? 'Việc chỉ làm một lần'
            : 'Xong một lần, hạn tự nhảy sang lần sau'
        }
        error={errors?.recurrence}
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
        {form.recurrence.kind === 'weekly' && (
          <>
            <div className="habit-weekdays" role="group" aria-label="Chọn thứ lặp lại">
              {WEEKDAY_LABELS.map((label, day) => {
                const pressed = weekdays.includes(day);
                const lastOne = pressed && weekdays.length <= 1;
                return (
                  <button
                    key={label}
                    type="button"
                    className="habit-weekday"
                    data-weekday={day}
                    aria-pressed={pressed}
                    aria-label={`${label}${lastOne ? ' (phải giữ ít nhất một thứ)' : ''}`}
                    title={lastOne ? 'Phải giữ ít nhất một thứ' : undefined}
                    disabled={lastOne}
                    onClick={() => toggleWeekday(day)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-caption text-umber">
              Chọn ít nhất một thứ trong tuần. Thứ không chọn là ngày ngoài lịch.
            </p>
          </>
        )}
      </Field>

      {form.recurrence.kind !== 'none' && (
        <Field
          label="Theo dõi thói quen"
          helper="Sổ streak riêng, tách khỏi chuỗi ngày học chung"
        >
          <button
            type="button"
            role="switch"
            aria-checked={habitOn}
            aria-label="Theo dõi như thói quen"
            className="habit-switch"
            onClick={toggleHabit}
          >
            <span className="habit-switch-track" aria-hidden="true">
              <span className="habit-switch-knob" />
            </span>
            <span className="text-body-sm text-ink">
              {habitOn ? 'Đang theo dõi thói quen' : 'Không theo dõi thói quen'}
            </span>
          </button>
        </Field>
      )}
        </>
      )}

      {withNote && (
        <Field label="Ghi chú" helper={`${form.note.length}/${MAX_NOTE} ký tự`} error={errors?.note}>
          <textarea
            className="text-area"
            value={form.note}
            maxLength={MAX_NOTE}
            placeholder="Ghi thêm điều cần nhớ về việc này…"
            onChange={(event) => onChange({ note: event.target.value })}
          />
        </Field>
      )}

      <Field label="Thẻ" helper={`Tối đa ${MAX_TAGS} thẻ, mỗi thẻ 1–${MAX_TAG_LEN} ký tự`} error={errors?.tags}>
        <div className="flex flex-wrap items-center gap-xs">
          {form.tags.map((tag) => (
            <span key={tag} className="chip">
              #{tag}
              <button
                type="button"
                aria-label={`Bỏ thẻ ${tag}`}
                className="ml-xxs grid size-6 place-items-center text-umber"
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

      <Field label="Việc nhỏ" helper={`${form.subtasks.length}/${MAX_SUBTASKS} bước`} error={errors?.subtasks}>
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
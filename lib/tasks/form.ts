/**
 * Luật của một tờ việc: hình dạng biểu mẫu và validate. Dùng chung cho khu
 * ghi việc (bút lông) và hộp thoại sửa việc để hai nơi không lệch luật.
 */
import type { Priority, RecurrenceRule, Subtask, Task } from './types';

export const MAX_TITLE = 200;
export const MAX_TAGS = 5;
export const MAX_TAG_LEN = 20;
export const MAX_SUBTASKS = 50;
export const MAX_NOTE = 1000;

export interface TaskForm {
  title: string;
  note: string;
  priority: Priority;
  dueAt: string | null;
  recurrence: RecurrenceRule;
  tags: string[];
  subtasks: Subtask[];
  subjectId: string | null;
}

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export function emptyForm(subjectId: string | null): TaskForm {
  return {
    title: '',
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    subjectId,
  };
}

export interface TaskFormErrors {
  title?: string;
  recurrence?: string;
  dueAt?: string;
  tags?: string;
  subtasks?: string;
  note?: string;
}

/** Lỗi theo từng trường — object rỗng nghĩa là tờ việc hợp lệ */
export function formErrors(form: TaskForm, requireFutureDue = true): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const title = form.title.trim();
  if (!title) errors.title = 'Con chưa viết tên việc.';
  else if (title.length > MAX_TITLE) errors.title = `Tên việc chỉ dài tới ${MAX_TITLE} ký tự.`;
  if (form.recurrence.kind !== 'none') {
    if (!form.dueAt) {
      errors.recurrence = 'Việc lặp lại cần một hạn chót để biết bắt đầu từ đâu.';
    } else if (requireFutureDue && new Date(form.dueAt) <= new Date()) {
      errors.dueAt = 'Hạn của việc lặp lại phải nằm sau bây giờ.';
    }
  }
  if (form.tags.length > MAX_TAGS) {
    errors.tags = `Chỉ giữ tối đa ${MAX_TAGS} thẻ.`;
  } else if (form.tags.some((tag) => tag.length < 1 || tag.length > MAX_TAG_LEN)) {
    errors.tags = `Mỗi thẻ dài 1–${MAX_TAG_LEN} ký tự.`;
  }
  if (form.subtasks.length > MAX_SUBTASKS) {
    errors.subtasks = `Chỉ giữ tối đa ${MAX_SUBTASKS} việc nhỏ.`;
  }
  if (form.note.length > MAX_NOTE) errors.note = `Ghi chú chỉ dài tới ${MAX_NOTE} ký tự.`;
  return errors;
}

/** Trả về câu lỗi đầu tiên, hoặc null nếu tờ việc hợp lệ */
export function formError(form: TaskForm, requireFutureDue = true): string | null {
  const errors = formErrors(form, requireFutureDue);
  return (
    errors.title ??
    errors.recurrence ??
    errors.dueAt ??
    errors.tags ??
    errors.subtasks ??
    errors.note ??
    null
  );
}

export function formToDraft(form: TaskForm): TaskDraft {
  return {
    title: form.title.trim(),
    note: form.note.trim(),
    priority: form.priority,
    dueAt: form.dueAt,
    recurrence: form.recurrence,
    tags: [...new Set(form.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, MAX_TAGS),
    subtasks: form.subtasks,
    subjectId: form.subjectId,
    done: false,
  };
}
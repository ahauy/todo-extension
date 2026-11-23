/**
 * Luật của một tờ việc: hình dạng biểu mẫu và validate. Dùng chung cho khu
 * ghi việc (bút lông) và hộp thoại sửa việc để hai nơi không lệch luật.
 */
import type { Habit, Priority, RecurrenceRule, Subtask, Task } from './types';
import { DEFAULT_PRIORITY } from './priority';
import {
  MAX_ESTIMATE_MIN,
  MIN_ESTIMATE_MIN,
  durationMinutes,
  isValidEndAt,
  isValidEstimateMin,
  isValidStartAt,
} from './timeBlock';

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
  /** R-21 — additive: tờ việc cũ/chưa có field vẫn load, coi như false. */
  keystone?: boolean;
  archived?: boolean;
  /** R-23 — additive: sổ thói quen đi kèm tờ việc (chỉ có khi đã bật). */
  habit?: Habit;
  /** R-24 — giờ bắt đầu `"HH:mm"`; `null` = chưa xếp giờ trong ngày. */
  startAt?: string | null;
  /** R-24 — độ dài dự kiến (phút), 15–240; `null` = trống (mặc định 30 khi có giờ). */
  estimateMin?: number | null;
  /** R-25 — giờ kết thúc `"HH:mm"`; có giá trị thì `estimateMin` là dẫn xuất. */
  endAt?: string | null;
}

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export function emptyForm(subjectId: string | null): TaskForm {
  return {
    title: '',
    note: '',
    priority: DEFAULT_PRIORITY,
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    subjectId,
    keystone: false,
    archived: false,
    startAt: null,
    estimateMin: null,
    endAt: null,
  };
}

/** R-21 — việc then chốt đang mở, trừ tờ đang sửa (sửa lại 2 lần không đếm đôi). */
export function openKeystoneCount(tasks: Task[], excludeId?: string): number {
  return tasks.filter(
    (task) =>
      !!task.keystone && !task.archived && !task.done && task.id !== excludeId
  ).length;
}

/** R-21 — cảnh báo inline khi tổng số then chốt đang mở vượt 3 (vẫn lưu bình thường). */
export function keystoneWarning(total: number): string | null {
  return total > 3 ? `Đang giữ ${total} việc then chốt` : null;
}

export interface TaskFormErrors {
  title?: string;
  recurrence?: string;
  dueAt?: string;
  startAt?: string;
  estimateMin?: string;
  endAt?: string;
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
  // R-24 — chỉ báo lỗi khi có giá trị; trống = chưa xếp giờ / dùng mặc định 30.
  if (form.startAt && !isValidStartAt(form.startAt)) {
    errors.startAt = 'Giờ bắt đầu phải trong khoảng 00:00–23:59.';
  }
  if (form.endAt && !isValidEndAt(form.endAt)) {
    errors.endAt = 'Giờ kết thúc phải trong khoảng 00:00–23:59.';
  }
  // R-25 — `endAt` là nguồn thật: `estimateMin` lưu trong trường hợp này là giá trị
  // DẪN XUẤT (có thể >240′, tới 1440′), được phép và chỉ kẹp chiều cao khi vẽ.
  // Chỉ validate range 15–240 khi người dùng nhập tay (không có `endAt`).
  if (
    form.estimateMin != null &&
    !(form.startAt && form.endAt) &&
    !isValidEstimateMin(form.estimateMin)
  ) {
    errors.estimateMin = `Độ dài dự kiến phải từ ${MIN_ESTIMATE_MIN} tới ${MAX_ESTIMATE_MIN} phút.`;
  }
  // R-25 — `endAt` là nguồn thật: khoảng dẫn xuất có thể >240′ (qua nửa đêm,
  // kể cả 1440′ khi end == start). HỢP LỆ, không chặn ở form; chỉ kẹp chiều cao
  // block khi vẽ (R-24). `estimateMin` nhập tay vẫn validate 15–240 ở trên.
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
    errors.startAt ??
    errors.endAt ??
    errors.estimateMin ??
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
    keystone: form.keystone ?? false,
    archived: form.archived ?? false,
    // R-23 — giữ nguyên field habit; tờ cũ thiếu field → undefined (additive).
    habit: form.habit,
    // R-24 — chuỗi rỗng trong form ↔ không lưu field. KHÔNG tự ghi 30: mặc định
    // `estimateMin` là luật hiển thị của timeBlock, không phải dữ liệu người dùng.
    startAt: form.startAt || undefined,
    // R-25 — `endAt` là nguồn thật: ghi kèm `estimateMin` suy ra trong cùng 1 draft.
    // Không có `endAt` → giữ nguyên `estimateMin` đã nhập/đã lưu (legacy).
    endAt: form.endAt || undefined,
    estimateMin:
      (form.startAt && form.endAt
        ? durationMinutes(form.startAt, form.endAt)
        : undefined) ??
      form.estimateMin ??
      undefined,
    done: false,
  };
}
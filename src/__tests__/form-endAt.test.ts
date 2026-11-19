/** R-25 — luật form cho `endAt`: validate HH:mm, suy `estimateMin`, không rơi field cũ. */
import { describe, expect, it } from 'vitest';
import {
  emptyForm,
  formError,
  formErrors,
  formToDraft,
  type TaskForm,
} from '../../lib/tasks/form';

function formWith(overrides: Partial<TaskForm> = {}): TaskForm {
  return { ...emptyForm(null), title: 'Việc có giờ', ...overrides };
}

describe('form endAt (R-25)', () => {
  it('endAt ngoài 00:00–23:59 → lỗi riêng', () => {
    const errors = formErrors(formWith({ startAt: '09:00', endAt: '24:00' }));
    expect(errors.endAt).toContain('00:00–23:59');
    expect(formError(formWith({ startAt: '09:00', endAt: '24:00' }))).toBeTruthy();
  });

  it('khoảng dẫn xuất >240′ vẫn hợp lệ (chỉ kẹp chiều cao khi vẽ)', () => {
    expect(formErrors(formWith({ startAt: '20:00', endAt: '01:00' }))).toEqual({});
    expect(formErrors(formWith({ startAt: '09:00', endAt: '09:00' }))).toEqual({});
    // Khi endAt là nguồn thật, estimateMin đã lưu >240′ KHÔNG bị chặn khi mở lại form.
    expect(formErrors(formWith({ startAt: '08:00', endAt: '14:00', estimateMin: 360 }))).toEqual({});
  });

  it('khoảng qua nửa đêm hợp lệ', () => {
    expect(formErrors(formWith({ startAt: '23:00', endAt: '01:00' }))).toEqual({});
  });

  it('formToDraft ghi endAt + estimateMin suy ra trong cùng 1 draft', () => {
    const draft = formToDraft(
      formWith({ startAt: '09:00', endAt: '10:30', estimateMin: 999, dueAt: '2026-11-20T08:00' })
    );
    expect(draft.endAt).toBe('10:30');
    expect(draft.estimateMin).toBe(90);
    expect(draft.dueAt).toBe('2026-11-20T08:00');
  });

  it('không có endAt → giữ estimateMin legacy, field endAt undefined', () => {
    const draft = formToDraft(formWith({ startAt: '08:00', estimateMin: 75 }));
    expect(draft.endAt).toBeUndefined();
    expect(draft.estimateMin).toBe(75);
  });
});

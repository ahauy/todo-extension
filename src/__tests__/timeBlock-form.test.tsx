/**
 * R-24 — luật form giờ bắt đầu/độ dài: `toForm` giữ field cũ, validate
 * 00:00–23:59 / 15–240, `formToDraft` không tự ghi 30, và 2 ô mới CHỈ hiện
 * trong hộp sửa việc (`withTime`), popup giữ nguyên số khối UI.
 * Dùng createRoot + act theo pattern của repo (không có testing-library).
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskFields from '../../components/TaskFields';
import TaskParchment, { toForm } from '../../components/TaskParchment';
import { createChromeStub } from './helpers/chrome-stub';
import { emptyForm, formError, formErrors, formToDraft } from '../../lib/tasks/form';
import type { Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Việc có giờ',
    note: '',
    priority: 'important-not-urgent',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const roots: Root[] = [];

function renderFields(withTime: boolean, form = emptyForm(null)) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <TaskFields
        form={form}
        subjects={[]}
        onChange={vi.fn()}
        withTime={withTime}
      />
    );
  });
  return container;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('R-24 — toForm / formToDraft giữ dữ liệu giờ', () => {
  it('toForm copy startAt/estimateMin/endAt; task cũ thiếu field → null', () => {
    expect(
      toForm(fixture({ startAt: '08:30', estimateMin: 45, endAt: '09:15' }))
    ).toMatchObject({
      startAt: '08:30',
      estimateMin: 45,
      endAt: '09:15',
    });
    const old = toForm(fixture());
    expect(old.startAt).toBeNull();
    expect(old.estimateMin).toBeNull();
    expect(old.endAt).toBeNull();
  });

  it('formToDraft giữ nguyên giá trị; trống → undefined, KHÔNG tự ghi 30', () => {
    const draft = formToDraft({
      ...emptyForm(null),
      startAt: '08:30',
      estimateMin: 45,
    });
    expect(draft.startAt).toBe('08:30');
    expect(draft.estimateMin).toBe(45);

    const empty = formToDraft(emptyForm(null));
    expect(empty.startAt).toBeUndefined();
    expect(empty.estimateMin).toBeUndefined();
  });
});

describe('R-24 — validate form', () => {
  it('trống (chưa xếp giờ) là hợp lệ', () => {
    const form = { ...emptyForm(null), title: 'Việc hợp lệ' };
    expect(formErrors(form).startAt).toBeUndefined();
    expect(formErrors(form).estimateMin).toBeUndefined();
    expect(formError(form)).toBeNull();
  });

  it('giờ sai / độ dài ngoài 15–240 báo lỗi đúng trường', () => {
    const bad = { ...emptyForm(null), title: 'Hợp lệ', startAt: '24:00', estimateMin: 14 };
    expect(formErrors(bad).startAt).toMatch(/00:00–23:59/);
    expect(formErrors(bad).estimateMin).toMatch(/15.*240/);
    expect(formError(bad)).toMatch(/00:00–23:59/);
    expect(formError({ ...emptyForm(null), title: 'Hợp lệ', estimateMin: 241 })).toMatch(
      /15.*240/
    );
  });

  it('biên 00:00 / 23:59 / 15 / 240 hợp lệ; NaN bị reject', () => {
    for (const startAt of ['00:00', '23:59']) {
      expect(formErrors({ ...emptyForm(null), title: 'x', startAt }).startAt).toBeUndefined();
    }
    for (const estimateMin of [15, 240]) {
      expect(
        formErrors({ ...emptyForm(null), title: 'x', estimateMin }).estimateMin
      ).toBeUndefined();
    }
    expect(
      formErrors({ ...emptyForm(null), title: 'x', estimateMin: Number.NaN }).estimateMin
    ).toBeDefined();
  });
});

describe('R-24 — 2 ô giờ chỉ hiện trong hộp sửa việc', () => {
  it('withTime → time input + number input với giá trị hiện tại', () => {
    const container = renderFields(true, {
      ...emptyForm(null),
      startAt: '08:30',
      estimateMin: 45,
    });
    const time = container.querySelector('input[type="time"]') as HTMLInputElement | null;
    const number = container.querySelector('input[type="number"]') as HTMLInputElement | null;
    expect(time).not.toBeNull();
    expect(number).not.toBeNull();
    expect(time!.value).toBe('08:30');
    expect(number!.value).toBe('45');
    expect(number!.min).toBe('15');
    expect(number!.max).toBe('240');
  });

  it('popup (withTime mặc định false) → KHÔNG có 2 ô mới', () => {
    const container = renderFields(false);
    expect(container.querySelector('input[type="time"]')).toBeNull();
    expect(container.querySelector('input[type="number"]')).toBeNull();
  });
});

describe('R-24 — TaskParchment: cổng withTime đúng bề mặt (review round 1)', () => {
  function installTask(): void {
    const stub = createChromeStub();
    stub.install();
    stub.seed({ 't:t1': fixture({ startAt: '08:30', estimateMin: 45 }) });
  }

  async function mountParchment(withTime?: boolean): Promise<HTMLElement> {
    const ReactMod = await import('react');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    const props = {
      taskId: 't1',
      subjects: [],
      onSave: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onUpdateTask: vi.fn(async () => {}),
      ...(withTime === undefined ? {} : { withTime }),
    };
    await ReactMod.act(async () => {
      root.render(<TaskParchment {...props} />);
    });
    await ReactMod.act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    return container;
  }

  it('popup — không truyền withTime → hộp sửa việc KHÔNG có 2 ô giờ', async () => {
    installTask();
    const container = await mountParchment();
    expect(container.querySelector('input[type="time"]')).toBeNull();
    expect(container.querySelector('input[type="number"]')).toBeNull();
  });

  it('New Tab — truyền withTime → 2 ô giờ hiện trong hộp sửa việc', async () => {
    installTask();
    const container = await mountParchment(true);
    expect(container.querySelector('input[type="time"]')).not.toBeNull();
    expect(container.querySelector('input[type="number"]')).not.toBeNull();
  });
});

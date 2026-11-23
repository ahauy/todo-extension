/**
 * R-23 — UI cho thói quen: weekday picker đa thứ + toggle giữ sổ, toForm giữ
 * `habit`, badge streak compact/full parity, và HabitCard 21 ô / seal / bỏ dấu.
 * Dùng createRoot + act theo pattern của các test UI khác trong repo (không có
 * testing-library).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { useState, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskFields from '../../components/TaskFields';
import TaskScroll from '../../components/TaskScroll';
import HabitCard from '../../components/HabitCard';
import { toForm } from '../../components/TaskParchment';
import { dayKey } from '../../lib/datetime';
import { emptyForm, type TaskForm } from '../../lib/tasks/form';
import type { Habit, Task } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 18/11/2026 là Tư (getDay()=3). Mọi mốc là giờ local. */
const NOW = new Date(2026, 10, 18, 10, 0, 0);

function shift(days: number, from: Date = NOW): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
}
function keyOf(days: number, from: Date = NOW): string {
  return dayKey(shift(days, from));
}
function localISO(days: number): string {
  return shift(days).toISOString();
}
function daysRange(fromOffset: number, toOffset: number): string[] {
  return Array.from({ length: toOffset - fromOffset + 1 }, (_, i) => keyOf(fromOffset + i));
}

function habitFixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'habit-1',
    title: 'Đọc sách',
    note: '',
    priority: 'important-not-urgent',
    dueAt: null,
    recurrence: { kind: 'daily' },
    tags: [],
    subtasks: [],
    done: false,
    habit: { startedAt: localISO(-30), doneDays: [] },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const roots: Root[] = [];

function renderNode(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(node);
  });
  return {
    container,
    rerender(next: React.ReactElement) {
      act(() => {
        root.render(next);
      });
    },
  };
}

function renderFields(form: TaskForm, onChange = vi.fn()) {
  return renderNode(
    <TaskFields form={form} subjects={[]} now={NOW} onChange={onChange} />
  );
}

function weekdayButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll('.habit-weekday')] as HTMLButtonElement[];
}

function habitSwitch(container: HTMLElement): HTMLButtonElement | null {
  return container.querySelector('[role="switch"][aria-label="Theo dõi như thói quen"]');
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

describe('TaskFields — weekday picker nhiều thứ (R-10)', () => {
  const weeklyForm = (weekdays: number[]): TaskForm => ({
    ...emptyForm(null),
    recurrence: { kind: 'weekly', rule: { weekdays } },
  });

  it('7 nút CN..T7 với aria-pressed; bấm T3 cộng thêm thứ vào rule', () => {
    const onChange = vi.fn();
    const { container } = renderFields(weeklyForm([1]), onChange);

    const buttons = weekdayButtons(container);
    expect(buttons.map((button) => button.textContent)).toEqual([
      'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false', 'true', 'false', 'false', 'false', 'false', 'false',
    ]);

    act(() => {
      buttons[2].click(); // T3
    });
    expect(onChange).toHaveBeenCalledWith({
      recurrence: { kind: 'weekly', rule: { weekdays: [1, 2] } },
    });
  });

  it('bỏ được thứ khi vẫn còn ≥1; thứ cuối cùng bị disable và no-op', () => {
    const onChange = vi.fn();
    const { container, rerender } = renderFields(weeklyForm([1, 2]), onChange);

    act(() => {
      weekdayButtons(container)[1].click(); // bỏ T2, còn T3
    });
    expect(onChange).toHaveBeenCalledWith({
      recurrence: { kind: 'weekly', rule: { weekdays: [2] } },
    });

    onChange.mockClear();
    rerender(
      <TaskFields
        form={weeklyForm([2])}
        subjects={[]}
        now={NOW}
        onChange={onChange}
      />
    );
    const last = weekdayButtons(container)[2];
    expect(last.disabled).toBe(true);
    expect(last.getAttribute('title')).toBe('Phải giữ ít nhất một thứ');
    act(() => {
      last.click();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('picker chỉ hiện khi weekly', () => {
    const { container, rerender } = renderFields(weeklyForm([1]));
    expect(weekdayButtons(container)).toHaveLength(7);
    rerender(<TaskFields form={emptyForm(null)} subjects={[]} now={NOW} onChange={vi.fn()} />);
    expect(weekdayButtons(container)).toHaveLength(0);
  });
});

describe('TaskFields — toggle theo dõi thói quen (R-23)', () => {
  function Harness({ initial, spy }: { initial: TaskForm; spy: ReturnType<typeof vi.fn> }) {
    const [form, setForm] = useState(initial);
    return (
      <TaskFields
        form={form}
        subjects={[]}
        now={NOW}
        onChange={(patch) => {
          spy(patch);
          setForm((prev) => ({ ...prev, ...patch }));
        }}
      />
    );
  }

  const recurring = (habit?: Habit): TaskForm => ({
    ...emptyForm(null),
    recurrence: { kind: 'daily' },
    habit,
  });

  it('toggle chỉ hiện khi recurrence khác none', () => {
    const withHabit = renderNode(<Harness initial={recurring()} spy={vi.fn()} />);
    expect(habitSwitch(withHabit.container)).not.toBeNull();

    // Harness giữ state nội bộ → render trực tiếp form none để kiểm tra gate.
    const none = renderFields(emptyForm(null));
    expect(habitSwitch(none.container)).toBeNull();
  });

  it('bật gán startedAt ISO UTC + doneDays rỗng; tắt giữ nguyên habit; bật lại dùng lại sổ', () => {
    const spy = vi.fn();
    const { container } = renderNode(<Harness initial={recurring()} spy={spy} />);
    const toggle = habitSwitch(container)!;

    act(() => {
      toggle.click();
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    const onPatch = spy.mock.calls.at(-1)?.[0] as Partial<TaskForm>;
    expect(onPatch.habit?.startedAt).toBe(NOW.toISOString());
    expect(onPatch.habit?.startedAt).toContain('Z');
    expect(onPatch.habit?.doneDays).toEqual([]);

    act(() => {
      toggle.click(); // tắt — CHỈ ẩn
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    const offPatch = spy.mock.calls.at(-1)?.[0] as Partial<TaskForm>;
    expect(offPatch.habit).toBe(onPatch.habit); // cùng reference, không xoá

    act(() => {
      toggle.click(); // bật lại — streak nguyên vẹn
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    const againPatch = spy.mock.calls.at(-1)?.[0] as Partial<TaskForm>;
    expect(againPatch.habit).toBe(onPatch.habit);
  });

  it('form có sẵn habit → toggle mở và bật lại không ghi đè dữ liệu cũ', () => {
    const old: Habit = { startedAt: localISO(-10), doneDays: daysRange(-5, 0) };
    const spy = vi.fn();
    const { container } = renderNode(<Harness initial={recurring(old)} spy={spy} />);
    const toggle = habitSwitch(container)!;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    act(() => {
      toggle.click();
    });
    act(() => {
      toggle.click();
    });
    expect(spy.mock.calls.at(-1)?.[0].habit).toBe(old);
  });
});

describe('TaskParchment.toForm — giữ sổ thói quen', () => {
  it('copy habit từ task sang form (thiếu → Lưu sẽ xoá sổ)', () => {
    const habit: Habit = { startedAt: localISO(-10), doneDays: ['2026-11-18'] };
    const form = toForm(habitFixture({ habit }));
    expect(form.habit).toBe(habit);
    expect(toForm(habitFixture({ habit: undefined })).habit).toBeUndefined();
  });
});

describe('TaskScroll — badge streak (R-23)', () => {
  const habitTask = habitFixture({
    dueAt: null,
    recurrence: { kind: 'daily' },
    lastDoneAt: NOW.toISOString(),
    habit: { startedAt: localISO(-10), doneDays: daysRange(-9, 0) },
  });

  function renderScroll(task: Task, compact: boolean) {
    return renderNode(
      <TaskScroll
        task={task}
        subject={null}
        now={NOW}
        compact={compact}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
      />
    );
  }

  it('badge nằm trong chip row dùng chung; compact/full cùng số con và cùng data-habit-streak', () => {
    const full = renderScroll(habitTask, false);
    const compact = renderScroll(habitTask, true);

    for (const view of [full, compact]) {
      const badge = view.container.querySelector('.habit-streak-badge') as HTMLElement;
      expect(badge).not.toBeNull();
      expect(badge.tagName).toBe('SPAN');
      expect(badge.getAttribute('data-habit-streak')).toBe('10');
      expect(badge.getAttribute('aria-label')).toBe('Chuỗi thói quen 10 ngày');
      expect(badge.closest('[data-chip-row]')).not.toBeNull();
      // Chip R-11 là tín hiệu RIÊNG, vẫn hiển thị cạnh badge.
      expect(view.container.querySelector('.chip-done-today')?.textContent).toBe(
        'đã làm hôm nay'
      );
    }
    const countChildren = (view: typeof full) =>
      [...view.container.querySelectorAll('[data-chip-row]')].reduce(
        (sum, row) => sum + row.children.length,
        0
      );
    expect(countChildren(compact)).toBe(countChildren(full));
  });

  it('không có habit / recurrence none / archived → không render badge', () => {
    for (const task of [
      habitFixture({ habit: undefined }),
      habitFixture({ recurrence: { kind: 'none' } }),
      habitFixture({ archived: true }),
    ]) {
      const { container } = renderScroll(task, false);
      expect(container.querySelector('.habit-streak-badge')).toBeNull();
    }
  });
});

describe('HabitCard — lưới 21 ô, seal, bỏ dấu (R-23)', () => {
  const windowKeys = daysRange(-20, 0);
  const weekdayRule = { kind: 'weekly' as const, rule: { weekdays: [1, 2, 3, 4, 5] } };
  const scheduled = windowKeys.filter(
    (key) => [1, 2, 3, 4, 5].includes(new Date(`${key}T12:00:00`).getDay())
  );

  const alpha = habitFixture({
    id: 'alpha',
    title: 'Alpha habit',
    habit: { startedAt: localISO(-30), doneDays: daysRange(-20, 0) },
  });
  const zulu = habitFixture({
    id: 'zulu',
    title: 'Zulu habit',
    habit: { startedAt: localISO(-30), doneDays: daysRange(-20, 0) },
  });
  const beta = habitFixture({
    id: 'beta',
    title: 'Beta habit',
    recurrence: weekdayRule,
    habit: {
      startedAt: localISO(-30),
      doneDays: scheduled.filter((_, index) => index !== 1),
    },
  });
  const charlie = habitFixture({ id: 'charlie', title: 'Charlie empty', done: true });

  const allTasks: Task[] = [
    charlie,
    beta,
    zulu,
    alpha,
    habitFixture({ id: 'archived', title: 'Archived', archived: true, habit: alpha.habit }),
    habitFixture({ id: 'none', title: 'None', recurrence: { kind: 'none' }, habit: alpha.habit }),
    habitFixture({ id: 'bare', title: 'Bare', habit: undefined }),
  ];

  function renderCard(onUnmark = vi.fn()) {
    return { ...renderNode(<HabitCard tasks={allTasks} now={NOW} onUnmark={onUnmark} />), onUnmark };
  }

  it('chọn tối đa 3 task, sort streak giảm rồi title; lọc archived/none/không habit', () => {
    const { container } = renderCard();
    const card = container.querySelector('[data-habit-card]') as HTMLElement;
    expect(card).not.toBeNull();
    const items = [...card.querySelectorAll('.habit-card-item')] as HTMLElement[];
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.dataset.habitTask)).toEqual(['alpha', 'zulu', 'beta']);
    expect(card.textContent).not.toContain('Charlie empty');
    expect(card.querySelectorAll('[data-habit-task="archived"]')).toHaveLength(0);
    expect(card.querySelectorAll('[data-habit-task="none"]')).toHaveLength(0);
  });

  it('mỗi thẻ: 21 ô đúng 3 trạng thái + streak/seal 7·14·21 + copy giải thích', () => {
    const { container } = renderCard();
    const alphaCard = container.querySelector('[data-habit-task="alpha"]') as HTMLElement;
    const cells = [...alphaCard.querySelectorAll('.habit-cell')] as HTMLElement[];
    expect(cells).toHaveLength(21);
    expect(cells.at(-1)?.dataset.day).toBe(keyOf(0));
    expect(cells.at(0)?.dataset.day).toBe(keyOf(-20));
    expect(cells.every((cell) => cell.dataset.state === cell.dataset.habitState)).toBe(true);
    expect(cells.every((cell) => cell.dataset.state === 'done')).toBe(true);

    const streak = alphaCard.querySelector('[data-habit-streak]') as HTMLElement;
    expect(streak.textContent).toContain('Chuỗi 21 ngày');
    const seals = [...alphaCard.querySelectorAll('[data-habit-seal]')].map(
      (seal) => seal.getAttribute('data-habit-seal')
    );
    expect(seals).toEqual(['7', '14', '21']);

    const betaCard = container.querySelector('[data-habit-task="beta"]') as HTMLElement;
    const betaStates = new Set(
      ([...betaCard.querySelectorAll('.habit-cell')] as HTMLElement[]).map(
        (cell) => cell.dataset.habitState
      )
    );
    expect(betaStates).toEqual(new Set(['done', 'missed', 'off-calendar']));

    const copy = container.querySelector('.habit-card-copy')?.textContent ?? '';
    expect(copy).toContain('21 ô là cửa sổ hiển thị');
    expect(copy).toContain('chuỗi có thể dài hơn');
    expect(copy).toContain('mốc ăn mừng');
    expect(copy).toContain('không phải kết luận khoa học');
  });

  it('ô done là nút có tên truy cập; click gọi onUnmark(taskId, day); ô khác không tương tác', () => {
    const onUnmark = vi.fn();
    const { container } = renderCard(onUnmark);
    const alphaCard = container.querySelector('[data-habit-task="alpha"]') as HTMLElement;
    const doneCells = [...alphaCard.querySelectorAll('button.habit-cell')] as HTMLButtonElement[];
    expect(doneCells).toHaveLength(21);
    const last = doneCells.at(-1)!;
    expect(last.getAttribute('aria-label')).toBe(`Bỏ dấu ${keyOf(0)} cho Alpha habit`);

    act(() => {
      last.click();
    });
    expect(onUnmark).toHaveBeenCalledTimes(1);
    expect(onUnmark).toHaveBeenCalledWith('alpha', keyOf(0));

    const betaCard = container.querySelector('[data-habit-task="beta"]') as HTMLElement;
    const passive = ([...betaCard.querySelectorAll('.habit-cell')] as HTMLElement[]).filter(
      (cell) => cell.dataset.habitState !== 'done'
    );
    expect(passive.length).toBeGreaterThan(0);
    expect(passive.every((cell) => cell.tagName !== 'BUTTON')).toBe(true);
  });

  it('focus/keyboard: ô done nhận focus; CSS có focus-visible, 44px, reduced-motion', () => {
    const { container } = renderCard();
    const button = container.querySelector(
      '[data-habit-task="alpha"] button.habit-cell'
    ) as HTMLButtonElement;
    button.focus();
    expect(document.activeElement).toBe(button);

    const css = readFileSync(resolve(process.cwd(), 'styles/board.css'), 'utf8');
    expect(css).toMatch(
      /\.habit-cell:focus-visible,[\s\S]{0,120}\{[^}]*outline: 2px solid var\(--primary\)/
    );
    expect(css).toMatch(/\.habit-cell\s*\{[^}]*min-height: 44px/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.habit-cell/);
  });

  it('không có task nào theo dõi → không render section', () => {
    const container = renderNode(
      <HabitCard tasks={[habitFixture({ habit: undefined })]} now={NOW} onUnmark={vi.fn()} />
    ).container;
    expect(container.querySelector('[data-habit-card]')).toBeNull();
  });
});

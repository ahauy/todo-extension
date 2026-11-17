/**
 * R-20 New Tab — focus panel là cột chính, board thu thành cột phụ; xác nhận
 * đổi việc/tick việc khác trong phiên. Không snapshot: assertion trên DOM,
 * storage.local và contract CSS responsive.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createChromeStub,
  type ChromeStub,
} from '../../src/__tests__/helpers/chrome-stub';
import { POMODORO_KEY, DAY_PLAN_KEY, type DayPlan, type PomodoroState, type Task } from '../../lib/tasks/types';
import { dayKey } from '../../lib/datetime';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Việc A',
    note: '',
    priority: 'medium',
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

const activeState = (taskId: string, interruptions = 0): PomodoroState => ({
  phase: 'focus',
  running: true,
  endsAt: Date.now() + 600_000,
  remaining: 600_000,
  taskId,
  interruptions,
});

let stub: ChromeStub;
let cleanup: (() => Promise<void>) | null = null;

async function act(work: () => Promise<void> | void): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
    await flush();
  });
}

async function renderApp(): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('./App');

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(App));
  });
  await React.act(async () => {
    await flush();
  });
  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return container;
}

async function renderShelf(tasks: Task[]): Promise<HTMLElement> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: SubjectShelf } = await import('../../components/SubjectShelf');

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(
      React.createElement(SubjectShelf, {
        subjects: [
          { id: 's1', name: 'Toán', order: 0, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
        tasks,
        value: 'all',
        onChange: () => {},
        onCreate: async () => null,
        onRemove: () => {},
      })
    );
  });
  await React.act(async () => {
    await flush();
  });
  cleanup = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return container;
}

function shelfCount(button: HTMLButtonElement): string {
  return button.querySelector('.spine-count')?.textContent ?? '';
}

function findButton(scope: ParentNode, label: string): HTMLButtonElement {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

/** dayKey local của hôm nay / N ngày trước — cùng múi giờ với board.now. */
function todayKey(): string {
  return dayKey(new Date());
}
function daysAgoKey(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dayKey(date);
}

function frogPlan(frogTaskId: string | null, key = todayKey()): DayPlan {
  return { [key]: { frogTaskId } };
}

function heroFocusButton(scope: ParentNode): HTMLButtonElement | undefined {
  const hero = scope.querySelector('.frog-hero');
  return [...(hero?.querySelectorAll('button') ?? [])].find(
    (button) => button.textContent === 'Tập trung 25 phút'
  ) as HTMLButtonElement | undefined;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  document.body.innerHTML = '';
});

afterEach(async () => {
  if (cleanup) await cleanup();
  cleanup = null;
  await flush();
  document.body.innerHTML = '';
});

describe('New Tab — R-20 focus layout', () => {
  it('focus chạy: board-grid thu cột phụ, focus panel ở board-desk, board vẫn còn', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    const grid = container.querySelector('.board-grid');
    expect(grid).not.toBeNull();
    expect(grid!.classList.contains('board-grid--focus')).toBe(true);
    expect(container.querySelector('.board-scroll')).not.toBeNull(); // không xoá board
    const desk = container.querySelector('.board-desk') as HTMLElement;
    expect(desk.querySelector('.focus-overlay')).not.toBeNull();
    expect(desk.textContent).toContain('Việc A');
    expect(desk.textContent).toContain('Kết thúc');
  });

  it('không có taskId → giao diện y hệt cũ (0 regression)', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();
    expect(container.querySelector('.board-grid')!.classList.contains('board-grid--focus')).toBe(
      false
    );
    expect(container.querySelector('.board-desk .focus-overlay')).toBeNull();
    expect(container.querySelector('.focus-card')).not.toBeNull();
  });

  it('CSS cột phụ: minmax(0,…) ở mọi breakpoint + 1 cột dưới 720px (không tràn ngang)', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'entrypoints/newtab/style.css'),
      'utf8'
    );
    const focusBlock = css.match(/\.board-grid--focus\s*\{([^}]*)\}/);
    expect(focusBlock).not.toBeNull();
    expect(focusBlock![1]).toContain('minmax(0, 1fr)');
    expect(focusBlock![1]).toContain('minmax(0, 320px)');
    // Breakpoint hẹp 360/1024/1199 đều có rule chặn tràn ngang.
    expect(css).toContain('@media (max-width: 719px)');
    const narrow = css.match(/@media \(max-width: 719px\)\s*\{[\s\S]*?\.board-grid--focus\s*\{([^}]*)\}/);
    expect(narrow).not.toBeNull();
    expect(narrow![1]).toContain('minmax(0, 1fr)');
  });

  it('đổi việc giữa phiên có xác nhận: xác nhận → 1 ngắt; từ chối → không đổi', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc A' }),
      't:b': fixture({ id: 'b', title: 'Việc B' }),
    });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();
    const buttonB = container.querySelector(
      'button[aria-label="Tập trung việc này: Việc B"]'
    ) as HTMLButtonElement;
    expect(buttonB).not.toBeNull();

    await act(() => {
      buttonB.click();
    });
    expect(container.textContent).toContain('Đang trong phiên, đổi việc sẽ phá tập trung?');

    await act(() => {
      findButton(container, 'Giữ việc cũ').click();
    });
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('a');

    await act(() => {
      buttonB.click();
    });
    await act(() => {
      findButton(container, 'Đổi việc').click();
    });
    await act(async () => {
      await flush();
      await flush();
      await flush();
    });
    const saved = stub.localStore.get(POMODORO_KEY) as PomodoroState;
    expect(saved.taskId).toBe('b');
    expect(saved.interruptions).toBe(1);
  });

  it('tick việc khác giữa phiên có xác nhận; xác nhận → tick + 1 ngắt', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc A' }),
      't:b': fixture({ id: 'b', title: 'Việc B' }),
    });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();
    const sealB = container.querySelector(
      'button[aria-label="Đóng dấu xong: Việc B"]'
    ) as HTMLButtonElement;
    expect(sealB).not.toBeNull();

    await act(() => {
      sealB.click();
    });
    expect(container.textContent).toContain('Đang trong phiên, đổi việc sẽ phá tập trung?');
    expect((stub.store.get('t:b') as Task).done).toBe(false);

    await act(() => {
      findButton(container, 'Đổi việc').click();
    });
    await act(async () => {
      await flush();
    });
    expect((stub.store.get('t:b') as Task).done).toBe(true);
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).interruptions).toBe(1);
  });

  it('FUP-001: "Huỷ gắn việc" → xác nhận → attach(null) + 1 ngắt; từ chối → không đổi', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    const desk = container.querySelector('.board-desk') as HTMLElement;
    expect(findButton(desk, 'Huỷ gắn việc')).not.toBeNull();

    await act(() => {
      findButton(container, 'Huỷ gắn việc').click();
    });
    expect(container.textContent).toContain('Huỷ gắn việc đang tập trung?');
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('a');

    // Từ chối: việc vẫn gắn, không đếm ngắt
    await act(() => {
      findButton(container, 'Giữ việc cũ').click();
    });
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('a');
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).interruptions).toBe(0);

    // Xác nhận: huỷ gắn + đúng 1 interruption; phiên vẫn chạy
    await act(() => {
      findButton(container, 'Huỷ gắn việc').click();
    });
    await act(() => {
      findButton(container, 'Huỷ gắn').click();
    });
    await act(async () => {
      await flush();
      await flush();
      await flush();
    });
    const saved = stub.localStore.get(POMODORO_KEY) as PomodoroState;
    expect(saved.taskId).toBeNull();
    expect(saved.interruptions).toBe(1);
    expect(saved.running).toBe(true);
    expect(saved.phase).toBe('focus');
  });
});

describe('New Tab — R-21 hero con ếch & tổng kết', () => {
  it('có frogTaskId hôm nay → hero hiện đúng tiêu đề + nút tập trung', async () => {
    stub.seed({
      't:frog': fixture({ id: 'frog', title: 'Việc Ếch' }),
      [DAY_PLAN_KEY]: frogPlan('frog'),
    });
    const container = await renderApp();
    const hero = container.querySelector('.frog-hero') as HTMLElement;
    expect(hero).not.toBeNull();
    expect(hero.textContent).toContain('Con ếch hôm nay');
    expect(hero.textContent).toContain('Việc Ếch');
    expect(hero.querySelector('[data-frog-id="frog"]')).not.toBeNull();
    expect(heroFocusButton(container)).not.toBeUndefined();
  });

  it('sang ngày khác → entry cũ hết hiệu lực, không còn nút focus', async () => {
    stub.seed({
      't:frog': fixture({ id: 'frog', title: 'Việc Ếch' }),
      [DAY_PLAN_KEY]: frogPlan('frog', daysAgoKey(1)),
    });
    const container = await renderApp();
    const hero = container.querySelector('.frog-hero') as HTMLElement;
    expect(hero.textContent).toContain('Chưa chọn ếch cho hôm nay');
    expect(heroFocusButton(container)).toBeUndefined();
  });

  it('ếch đã archived → hiện "Đã cắt", không cho focus', async () => {
    stub.seed({
      't:cut': fixture({ id: 'cut', title: 'Ếch cắt', archived: true }),
      [DAY_PLAN_KEY]: frogPlan('cut'),
    });
    const container = await renderApp();
    expect(container.querySelector('.frog-hero')!.textContent).toContain('Đã cắt');
    expect(heroFocusButton(container)).toBeUndefined();
  });

  it('ếch đã done → hiện "Đã xong", không cho focus', async () => {
    stub.seed({
      't:done': fixture({
        id: 'done',
        title: 'Ếch xong',
        done: true,
        lastDoneAt: new Date().toISOString(),
      }),
      [DAY_PLAN_KEY]: frogPlan('done'),
    });
    const container = await renderApp();
    expect(container.querySelector('.frog-hero')!.textContent).toContain('Đã xong');
    expect(heroFocusButton(container)).toBeUndefined();
  });

  it('stale frogTaskId trỏ tới việc đã xoá → hero rỗng, không crash', async () => {
    stub.seed({ [DAY_PLAN_KEY]: frogPlan('gone') });
    const container = await renderApp();
    expect(container.querySelector('.frog-hero')!.textContent).toContain('Chưa chọn ếch');
    expect(heroFocusButton(container)).toBeUndefined();
    expect(container.querySelector('.board-scroll')).not.toBeNull();
  });

  it('nút focus của hero đi qua handler hiện có: phiên khác → xác nhận R-20', async () => {
    stub.seed({
      't:frog': fixture({ id: 'frog', title: 'Việc Ếch' }),
      't:other': fixture({ id: 'other', title: 'Việc Khác' }),
      [DAY_PLAN_KEY]: frogPlan('frog'),
    });
    stub.localStore.set(POMODORO_KEY, activeState('other'));
    const container = await renderApp();

    await act(() => {
      heroFocusButton(container)!.click();
    });
    expect(container.textContent).toContain('Đang trong phiên, đổi việc sẽ phá tập trung?');
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('other');

    await act(() => {
      findButton(container, 'Giữ việc cũ').click();
    });
    expect((stub.localStore.get(POMODORO_KEY) as PomodoroState).taskId).toBe('other');

    await act(() => {
      heroFocusButton(container)!.click();
    });
    await act(() => {
      findButton(container, 'Đổi việc').click();
    });
    await act(async () => {
      await flush();
      await flush();
      await flush();
    });
    const saved = stub.localStore.get(POMODORO_KEY) as PomodoroState;
    expect(saved.taskId).toBe('frog');
    expect(saved.interruptions).toBe(1);
  });

  it('nút focus của hero khởi động phiên mới qua handleFocusTask (không gọi pomodoro trực tiếp)', async () => {
    stub.seed({
      't:frog': fixture({ id: 'frog', title: 'Việc Ếch' }),
      [DAY_PLAN_KEY]: frogPlan('frog'),
    });
    const container = await renderApp();
    await act(() => {
      heroFocusButton(container)!.click();
    });
    await act(async () => {
      await flush();
      await flush();
    });
    const saved = stub.localStore.get(POMODORO_KEY) as PomodoroState;
    expect(saved.taskId).toBe('frog');
    expect(saved.running).toBe(true);
    expect(container.querySelector('.board-desk .focus-overlay')).not.toBeNull();
  });

  it('dòng hôm nay & tuần khớp lastDoneAt/updatedAt, bỏ studyLog aggregate', async () => {
    const todayISO = new Date().toISOString();
    const old = new Date();
    old.setDate(old.getDate() - 14);
    const oldISO = old.toISOString();

    stub.seed({
      't:k1': fixture({
        id: 'k1', title: 'K1', keystone: true, done: true,
        lastDoneAt: todayISO, updatedAt: todayISO,
      }),
      't:k2': fixture({ id: 'k2', title: 'K2', keystone: true }),
      't:n1': fixture({
        id: 'n1', title: 'N1', done: true,
        lastDoneAt: todayISO, updatedAt: todayISO,
      }),
      't:n2': fixture({ id: 'n2', title: 'N2' }),
      't:a1': fixture({
        id: 'a1', title: 'A1', keystone: true, archived: true, done: true,
        lastDoneAt: todayISO, updatedAt: todayISO,
      }),
      't:o1': fixture({
        id: 'o1', title: 'O1', keystone: true, done: true, updatedAt: oldISO,
      }),
      studyLog: { [todayKey()]: { tasks: 999, focus: 999 } },
      [DAY_PLAN_KEY]: frogPlan('k2'),
    });
    const container = await renderApp();
    const summary = container.querySelector('[data-summary]')!;
    expect(summary.textContent).toContain('Then chốt: 1/2 xong');
    expect(summary.textContent).toContain('Tuần này: then chốt 1/2 · 2 việc xong');
  });

  it('không có ếch → giữ nguyên bố cục board, summary về 0, không nút focus', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();
    expect(container.querySelector('.board-grid')).not.toBeNull();
    expect(container.querySelector('.board-scroll')).not.toBeNull();
    expect(container.querySelector('.board-desk')).not.toBeNull();
    const hero = container.querySelector('.frog-hero') as HTMLElement;
    expect(hero.textContent).toContain('Chưa chọn ếch cho hôm nay');
    expect(heroFocusButton(container)).toBeUndefined();
    const summary = container.querySelector('[data-summary]')!;
    expect(summary.textContent).toContain('Then chốt: 0/0 xong');
    expect(summary.textContent).toContain('Tuần này: then chốt 0/0 · 0 việc xong');
  });

  it('CSS hero/summary: min-width:0, overflow-wrap, không animation/autoplay', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'entrypoints/newtab/style.css'),
      'utf8'
    );
    const hero = css.match(/\.frog-hero\s*\{([^}]*)\}/);
    expect(hero).not.toBeNull();
    expect(hero![1]).toContain('min-width: 0');
    expect(hero![1]).toContain('flex-wrap: wrap');
    const heroText = css.match(/\.frog-hero-task,\s*\.frog-hero-empty\s*\{([^}]*)\}/);
    expect(heroText![1]).toContain('overflow-wrap: anywhere');
    const summary = css.match(/\.frog-summary\s*\{([^}]*)\}/);
    expect(summary![1]).toContain('min-width: 0');
    const heroBlock = css.slice(
      css.indexOf('/* ── R-21: hero'),
      css.indexOf('/* ── R-20: focus')
    );
    expect(heroBlock).not.toMatch(/animation|@keyframes|autoplay|marquee|transition/i);
  });
});

describe('SubjectShelf — R-21 bộ đếm bỏ việc đã cắt', () => {
  it('activeCount dùng trong remaining(): archived/done không lọt vào số gáy sách', async () => {
    const container = await renderShelf([
      fixture({ id: 'a', subjectId: 's1' }),
      fixture({ id: 'b', subjectId: 's1', done: true }),
      fixture({ id: 'c', subjectId: 's1', archived: true }),
      fixture({ id: 'd' }),
    ]);
    const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
    const all = buttons.find((button) => button.textContent?.includes('Cả giá sách'))!;
    const math = buttons.find((button) => button.textContent?.includes('Toán'))!;
    const none = buttons.find((button) => button.textContent?.includes('Chưa xếp môn'))!;
    expect(shelfCount(all)).toBe('2');
    expect(shelfCount(math)).toBe('1');
    expect(shelfCount(none)).toBe('1');
  });
});

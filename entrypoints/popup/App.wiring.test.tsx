/**
 * Integration test wiring popup sau cải tạo UI "Sơn mài Học Đường".
 * Vẫn guard cùng các regression intent của bản cũ (#5 composer data, #6
 * tab/search/sort, #10 dirty dialog, #11 detail persistence, #12 empty state,
 * #15 undo, #20 keyboard n + /) — retarget sang UI mới: Composer bút lông →
 * FilterRow (RibbonTabs + menu Sắp xếp + Tìm việc + Lọc theo môn học) →
 * TaskScrollList → TaskParchment (Modal) + ConfirmDialog + Toast.
 *
 * Không dùng @testing-library — createRoot + act + chrome stub.
 * Module useTasks/useSubjects/useSettings có state ở module scope →
 * vi.resetModules() mỗi test + import động trong từng test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createChromeStub,
  type ChromeStub,
} from '../../src/__tests__/helpers/chrome-stub';
import {
  DAY_PLAN_KEY,
  POMODORO_KEY,
  STUDY_LOG_KEY,
  type DayPlan,
  type PomodoroState,
  type Task,
} from '../../lib/tasks/types';
import { dayKey } from '../../lib/datetime';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Việc mẫu',
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

function findButton(scope: ParentNode, label: string): HTMLButtonElement {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!button) throw new Error(`Không tìm thấy nút "${label}"`);
  return button as HTMLButtonElement;
}

/** Tab ribbon có thêm <span> đếm bên trong → so "chứa nhãn", không so exact text. */
function findTab(scope: ParentNode, label: string): HTMLButtonElement {
  const tab = [...scope.querySelectorAll('[role="tab"]')].find((candidate) =>
    candidate.textContent?.includes(label)
  );
  if (!tab) throw new Error(`Không tìm thấy tab "${label}"`);
  return tab as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressKey(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

/** Mở tờ giấy da sửa việc: bấm tiêu đề cuộn thư rồi flush 2 nhịp (loadAll async). */
async function openParchment(container: HTMLElement, title: string): Promise<void> {
  const titleButton = [
    ...container.querySelectorAll<HTMLButtonElement>('button.scroll-title'),
  ].find((candidate) => candidate.textContent === title);
  if (!titleButton) throw new Error(`Không tìm thấy việc "${title}"`);
  await act(() => {
    titleButton.click();
  });
  await act(async () => {
    await flush();
  });
  await act(async () => {
    await flush();
  });
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
}

/** Nút "Hoàn tác" trong toast — không nhầm với nút undo nội dòng của cuộn thư. */
function toastUndoButton(container: HTMLElement): HTMLButtonElement {
  const toast = container.querySelector('.toast-reminder');
  if (!toast) throw new Error('Không thấy toast');
  const button = [...toast.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === 'Hoàn tác'
  );
  if (!button) throw new Error('Không tìm thấy nút "Hoàn tác" trong toast');
  return button as HTMLButtonElement;
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

describe('App wiring — empty & loading state (#12)', () => {
  it('storage rỗng: empty state "cầm bút lên", không còn skeleton', async () => {
    const container = await renderApp();
    expect(container.textContent).toContain(
      'Chưa có điều gì cần ghi. Hãy cầm bút lên.'
    );
    expect(container.querySelector('.skeleton-scroll')).toBeNull();
  });
});

describe('App wiring — archived không vào Header counter (R-21 / F-01)', () => {
  const headerSummary = (container: HTMLElement): string =>
    container.querySelector('header p[aria-live="polite"]')?.textContent ?? '';

  it('việc archived quá hạn không bị đếm vào "đang chờ" / "quá hạn"', async () => {
    stub.seed({
      't:archived': fixture({
        id: 'archived',
        title: 'Việc cắt bỏ quá hạn',
        dueAt: '2000-01-01T08:00',
        archived: true,
      }),
      't:visible': fixture({
        id: 'visible',
        title: 'Việc đang chờ',
        dueAt: '2000-01-02T08:00',
        archived: false,
      }),
    });
    const container = await renderApp();

    // Trước khi wire helper: "2 việc đang chờ, 2 quá hạn." (task ma ở Header).
    expect(headerSummary(container)).toBe('1 việc đang chờ, 1 quá hạn.');
    expect(container.textContent).not.toContain('Việc cắt bỏ quá hạn');
  });

  it('chỉ còn việc archived → Header thảnh thơi, không current task ma', async () => {
    stub.seed({
      't:archived': fixture({
        id: 'archived',
        title: 'Việc cắt bỏ duy nhất',
        dueAt: '2000-01-01T08:00',
        archived: true,
      }),
    });
    const container = await renderApp();

    expect(headerSummary(container)).toBe('Sổ đang thảnh thơi.');
  });
});

describe('App wiring — tab board (#6)', () => {
  it('tab "Đã xong" chỉ hiện việc xong; "Hôm nay" ẩn việc xong', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Việc đang làm' }),
      't:b': fixture({ id: 'b', title: 'Việc đã xong', done: true }),
    });
    const container = await renderApp();

    expect(container.textContent).toContain('Việc đã xong');

    await act(async () => {
      findTab(container, 'Đã xong').click();
    });
    expect(container.textContent).toContain('Việc đã xong');
    expect(container.textContent).not.toContain('Việc đang làm');

    await act(async () => {
      findTab(container, 'Hôm nay').click();
    });
    expect(container.textContent).not.toContain('Việc đã xong');
    expect(container.textContent).toContain('Hôm nay chưa có việc nào đến hạn.');
  });

  it('list view chỉ có đúng 1 dải tab "Lọc việc theo thời hạn"', async () => {
    await renderApp();
    expect(
      document.querySelectorAll('[role="tablist"][aria-label="Lọc việc theo thời hạn"]')
    ).toHaveLength(1);
  });
});

describe('App wiring — search / subject / sort (#6)', () => {
  it('phím / mở search, lọc theo tiêu đề; Escape đóng và xoá filter', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Alpha task' }),
      't:b': fixture({ id: 'b', title: 'Beta task' }),
    });
    const container = await renderApp();

    await act(async () => {
      pressKey('/');
    });
    const input = document.querySelector(
      'input[aria-label="Tìm việc"]'
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    await act(async () => {
      setInputValue(input!, 'alpha');
    });
    expect(container.textContent).toContain('Alpha task');
    expect(container.textContent).not.toContain('Beta task');

    await act(async () => {
      pressKey('Escape');
    });
    expect(container.textContent).toContain('Alpha task');
    expect(container.textContent).toContain('Beta task');
    expect(document.querySelector('input[aria-label="Tìm việc"]')).toBeNull();
  });

  it('lọc theo môn học qua menu "Lọc theo môn học" (thay <select> native)', async () => {
    stub.seed({
      subjects: [
        { id: 's1', name: 'Toán', order: 0, createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      't:a': fixture({ id: 'a', title: 'Việc Toán', subjectId: 's1' }),
      't:b': fixture({ id: 'b', title: 'Việc tự do' }),
    });
    const container = await renderApp();

    const subjectButton = () =>
      container.querySelector(
        'button[aria-label^="Lọc theo môn học"]'
      ) as HTMLButtonElement;

    expect(subjectButton()).not.toBeNull();
    expect(subjectButton().getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      subjectButton().click();
    });
    expect(
      container.querySelector('[role="menu"][aria-label="Lọc theo môn học"]')
    ).not.toBeNull();
    const toan = [...container.querySelectorAll('[role="menuitemradio"]')].find(
      (candidate) => candidate.textContent === 'Toán'
    ) as HTMLButtonElement | undefined;
    expect(toan).toBeDefined();

    await act(async () => {
      toan!.click();
    });
    expect(container.textContent).toContain('Việc Toán');
    expect(container.textContent).not.toContain('Việc tự do');

    await act(async () => {
      subjectButton().click();
    });
    const none = [...container.querySelectorAll('[role="menuitemradio"]')].find(
      (candidate) => candidate.textContent === 'Chưa xếp môn'
    ) as HTMLButtonElement | undefined;
    expect(none).toBeDefined();

    await act(async () => {
      none!.click();
    });
    expect(container.textContent).not.toContain('Việc Toán');
    expect(container.textContent).toContain('Việc tự do');
  });

  it('menu Sắp xếp chuyển sang Ưu tiên và đổi thứ tự list', async () => {
    stub.seed({
      't:a': fixture({
        id: 'a',
        title: 'Việc ưu tiên thấp',
        priority: 'not-important-not-urgent',
        dueAt: '2035-01-01T08:00:00.000Z',
      }),
      't:b': fixture({
        id: 'b',
        title: 'Việc ưu tiên cao',
        priority: 'important-urgent',
        dueAt: '2036-01-01T08:00:00.000Z',
      }),
    });
    const container = await renderApp();
    const titles = () =>
      [...container.querySelectorAll('[role="listitem"]')].map(
        (item) => item.textContent ?? ''
      );
    const sortButton = () =>
      container.querySelector('button[aria-label^="Sắp xếp"]') as HTMLButtonElement;

    // Mặc định "Hạn chót": việc hết hạn sớm đứng trước
    expect(sortButton().title).toBe('Sắp xếp: Hạn chót');
    expect(titles()[0]).toContain('Việc ưu tiên thấp');

    await act(async () => {
      sortButton().click();
    });
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
    const menuItem = [...container.querySelectorAll('[role="menuitemradio"]')].find(
      (candidate) => candidate.textContent === 'Ưu tiên'
    );
    expect(menuItem).toBeDefined();

    await act(async () => {
      (menuItem as HTMLButtonElement).click();
    });

    expect(sortButton().title).toBe('Sắp xếp: Ưu tiên');
    expect(titles()[0]).toContain('Việc ưu tiên cao');
  });
});

describe('App wiring — composer & keyboard (#5, #20)', () => {
  it('phím n focus ô bút lông; blur rồi bấm n lại vẫn focus lại', async () => {
    await renderApp();
    const quillInput = () =>
      document.querySelector('input[aria-label="Tên việc cần ghi"]') as HTMLInputElement;

    await act(async () => {
      pressKey('n');
    });
    expect(document.activeElement).toBe(quillInput());

    await act(async () => {
      quillInput().blur();
    });
    expect(document.activeElement).not.toBe(quillInput());

    await act(async () => {
      pressKey('n');
    });
    expect(document.activeElement).toBe(quillInput());
  });

  it('lưu composer giữ đủ field (ưu tiên Q1) qua nút "Ghi"', async () => {
    const container = await renderApp();

    await act(async () => {
      pressKey('n');
    });
    const titleInput = document.querySelector(
      'input[aria-label="Tên việc cần ghi"]'
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(titleInput, 'Việc đầy đủ');
    });
    const expandButton = container.querySelector(
      'button[aria-label="Mở chi tiết việc"]'
    ) as HTMLButtonElement;
    await act(async () => {
      expandButton.click();
    });

    const priorityGroup = container.querySelector(
      '[role="radiogroup"][aria-label="Ưu tiên"]'
    );
    expect(priorityGroup).not.toBeNull();
    const q1 = [...priorityGroup!.querySelectorAll('button')].find(
      (candidate) => candidate.textContent === 'Quan trọng, cấp bách'
    );
    expect(q1).toBeDefined();
    await act(async () => {
      q1!.click();
    });

    await act(async () => {
      findButton(container, 'Ghi').click();
    });

    const keys = [...stub.store.keys()].filter((key) => key.startsWith('t:'));
    expect(keys).toHaveLength(1);
    const saved = stub.store.get(keys[0]) as Task;
    expect(saved.title).toBe('Việc đầy đủ');
    expect(saved.priority).toBe('important-urgent');
  });
});

describe('App wiring — parchment persistence (#11)', () => {
  it('lưu parchment đổi title + bump updatedAt', async () => {
    const original = fixture({
      id: 'a',
      title: 'Việc A',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
    stub.seed({ 't:a': original });
    const container = await renderApp();

    await openParchment(container, 'Việc A');
    const titleInput = container.querySelector(
      'input.text-input[data-autofocus]'
    ) as HTMLInputElement;
    expect(titleInput.value).toBe('Việc A');
    await act(async () => {
      setInputValue(titleInput, 'Việc A mới');
    });
    await act(async () => {
      findButton(container, 'Lưu').click();
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.title).toBe('Việc A mới');
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThan(
      new Date(original.updatedAt).getTime()
    );
  });

  it('tick subtask trong parchment ghi NGAY, không cần bấm Lưu', async () => {
    const original = fixture({
      id: 'a',
      title: 'Việc A',
      updatedAt: '2020-01-01T00:00:00.000Z',
      subtasks: [{ id: 's1', title: 'Bước 1', done: false }],
    });
    stub.seed({ 't:a': original });
    const container = await renderApp();

    await openParchment(container, 'Việc A');
    const subtask = container.querySelector(
      'input[aria-label="Đánh dấu subtask: Bước 1"]'
    ) as HTMLInputElement;
    expect(subtask).not.toBeNull();
    await act(async () => {
      subtask.click();
    });

    const saved = stub.store.get('t:a') as Task;
    expect(saved.subtasks[0].done).toBe(true);
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThan(
      new Date(original.updatedAt).getTime()
    );
  });
});

describe('App wiring — dirty confirm & undo (#10, #15)', () => {
  it('sửa title rồi "Để sau" hiện dialog "Bỏ thay đổi?"; "Bỏ" đóng hết, không lưu', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();

    await openParchment(container, 'Việc A');
    const titleInput = container.querySelector(
      'input.text-input[data-autofocus]'
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(titleInput, 'Việc A sửa');
    });
    await act(async () => {
      findButton(container, 'Để sau').click();
    });

    expect(container.textContent).toContain('Bỏ thay đổi?');

    await act(async () => {
      findButton(container, 'Bỏ').click();
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).not.toContain('Bỏ thay đổi?');
    const saved = stub.store.get('t:a') as Task;
    expect(saved.title).toBe('Việc A');
  });

  it('xoá việc qua parchment rồi Hoàn tác trong toast khôi phục', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc xoá' }) });
    const container = await renderApp();

    await openParchment(container, 'Việc xoá');
    await act(async () => {
      findButton(container, 'Xoá việc').click();
    });
    expect(container.textContent).toContain('Xoá việc này?');
    await act(async () => {
      findButton(container, 'Xoá').click();
    });

    expect(stub.store.has('t:a')).toBe(false);
    expect(container.textContent).toContain('Đã xoá việc khỏi sổ.');

    await act(async () => {
      toastUndoButton(container).click();
    });

    expect(stub.store.has('t:a')).toBe(true);
    expect(container.textContent).toContain('Việc xoá');
  });

  it('đóng dấu son rồi Hoàn tác trong toast trả lại việc chưa xong', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();

    const seal = container.querySelector(
      'button[aria-label="Đóng dấu xong: Việc A"]'
    ) as HTMLButtonElement;
    expect(seal).not.toBeNull();
    await act(async () => {
      seal.click();
    });

    expect((stub.store.get('t:a') as Task).done).toBe(true);
    expect(container.textContent).toContain('Đã đóng dấu son.');

    await act(async () => {
      toastUndoButton(container).click();
    });

    expect((stub.store.get('t:a') as Task).done).toBe(false);
  });
});

describe('App wiring — R-21 chip 20% / ếch / archive', () => {
  const chip = (container: HTMLElement) =>
    container.querySelector(
      'button[aria-label="Chỉ hiện việc then chốt (20%)"]'
    ) as HTMLButtonElement;
  const titles = (container: HTMLElement) =>
    [...container.querySelectorAll('[role="listitem"] .scroll-title')].map(
      (element) => element.textContent
    );

  it('chip 20% bật trên nền tab hiện tại, ribbon chỉ hiện ở thẻ then chốt', async () => {
    stub.seed({
      't:a': fixture({ id: 'a', title: 'Keyst A', keystone: true }),
      't:b': fixture({ id: 'b', title: 'Việc B' }),
    });
    const container = await renderApp();

    expect(chip(container).getAttribute('aria-pressed')).toBe('false');
    expect(titles(container)).toEqual(['Keyst A', 'Việc B']);
    expect(container.querySelectorAll('.keystone-ribbon')).toHaveLength(1);

    await act(() => {
      chip(container).click();
    });
    expect(chip(container).getAttribute('aria-pressed')).toBe('true');
    expect(titles(container)).toEqual(['Keyst A']);
  });

  it('ếch cùng ngày: chọn việc khác thì thay thế, bấm ếch hiện tại thì clear(null)', async () => {
    const today = dayKey(new Date());
    stub.seed({
      dayPlan: { [today]: { frogTaskId: 'a' } },
      't:a': fixture({ id: 'a', title: 'Việc A' }),
      't:b': fixture({ id: 'b', title: 'Việc B' }),
    });
    const container = await renderApp();
    const frogOfB = () =>
      container.querySelector(
        'button[aria-label="Chọn làm ếch hôm nay: Việc B"]'
      ) as HTMLButtonElement;

    expect(
      container.querySelector('button[aria-label="Bỏ ếch hôm nay: Việc A"]')
    ).not.toBeNull();
    expect(frogOfB()).not.toBeNull();

    await act(() => {
      frogOfB().click();
    });
    expect((stub.store.get(DAY_PLAN_KEY) as DayPlan)[today].frogTaskId).toBe('b');

    const clearB = container.querySelector(
      'button[aria-label="Bỏ ếch hôm nay: Việc B"]'
    ) as HTMLButtonElement;
    expect(clearB).not.toBeNull();
    await act(() => {
      clearB.click();
    });
    expect((stub.store.get(DAY_PLAN_KEY) as DayPlan)[today].frogTaskId).toBeNull();
  });

  it('archived ẩn khỏi board; Phục hồi trong Cài đặt đưa việc trở lại', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc cắt', archived: true }) });
    const container = await renderApp();
    expect(container.textContent).not.toContain('Việc cắt');

    await act(() => {
      (container.querySelector('button[aria-label="Cài đặt"]') as HTMLButtonElement).click();
    });
    const section = container.querySelector('[data-section="archived"]');
    expect(section?.textContent).toContain('Việc cắt');

    await act(() => {
      (
        section!.querySelector(
          'button[aria-label="Phục hồi việc Việc cắt"]'
        ) as HTMLButtonElement
      ).click();
    });
    expect((stub.store.get('t:a') as Task).archived).toBe(false);

    await act(() => {
      findButton(container, 'Về sổ').click();
    });
    expect(container.textContent).toContain('Việc cắt');
  });
});

describe('App wiring — R-20 focus overlay & completion', () => {
  const activeState = (taskId: string, interruptions = 0): PomodoroState => ({
    phase: 'focus',
    running: true,
    endsAt: Date.now() + 600_000,
    remaining: 600_000,
    taskId,
    interruptions,
  });
  const savedPomodoro = () => stub.localStore.get(POMODORO_KEY) as PomodoroState | undefined;
  const focusTotal = () => {
    const log = stub.store.get(STUDY_LOG_KEY) as Record<string, { focus?: number }> | undefined;
    return Object.values(log ?? {}).reduce((sum, day) => sum + (day.focus ?? 0), 0);
  };

  it('focus chạy + taskId → overlay thay board; Escape không đóng; mở lại vẫn đúng việc', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc đang học' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    expect(container.querySelector('[data-testid="focus-overlay"]')).not.toBeNull();
    expect(container.textContent).toContain('Việc đang học');
    expect(container.querySelector('[role="list"]')).toBeNull(); // board không bấm được

    await act(() => {
      pressKey('Escape');
    });
    expect(container.querySelector('[data-testid="focus-overlay"]')).not.toBeNull();
  });

  it('"Kết thúc" = reset về chờ, không skip, không ghi focus', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc đang học' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    await act(() => {
      findButton(container, 'Kết thúc').click();
    });
    await act(async () => {
      await flush();
    });
    expect(savedPomodoro()?.running).toBe(false);
    expect(savedPomodoro()?.phase).toBe('focus'); // không sang break như skip
    expect(focusTotal()).toBe(0);
    expect(container.querySelector('[data-testid="focus-overlay"]')).toBeNull();
  });

  it('bấm "Tập trung việc này" → attach + start đúng preset rồi vào overlay', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    const container = await renderApp();
    const focusButton = container.querySelector(
      'button[aria-label="Tập trung việc này: Việc A"]'
    ) as HTMLButtonElement;
    expect(focusButton).not.toBeNull();

    await act(() => {
      focusButton.click();
    });
    await act(async () => {
      await flush();
    });
    expect(savedPomodoro()?.taskId).toBe('a');
    expect(savedPomodoro()?.running).toBe(true);
    expect(container.querySelector('[data-testid="focus-overlay"]')).not.toBeNull();
  });

  it('hết phiên tự nhiên + taskId → "Xong việc này chưa?"; xác nhận tick + focus +1', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    stub.localStore.set(POMODORO_KEY, {
      phase: 'focus',
      running: true,
      endsAt: Date.now() - 10,
      remaining: 0,
      taskId: 'a',
      interruptions: 1,
    });
    const container = await renderApp();
    await act(async () => {
      await flush();
      await flush();
    });
    expect(container.textContent).toContain('Xong việc này chưa?');
    expect(container.textContent).toContain('1 lần'); // tổng kết có số lần ngắt

    await act(() => {
      findButton(container, 'Xong rồi').click();
    });
    await act(async () => {
      await flush();
      await flush();
    });
    expect((stub.store.get('t:a') as Task).done).toBe(true);
    expect(focusTotal()).toBe(1);
  });

  it('từ chối completion → không tick, không focus', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc A' }) });
    stub.localStore.set(POMODORO_KEY, {
      phase: 'focus',
      running: true,
      endsAt: Date.now() - 10,
      remaining: 0,
      taskId: 'a',
      interruptions: 0,
    });
    const container = await renderApp();
    await act(async () => {
      await flush();
      await flush();
    });
    await act(() => {
      findButton(container, 'Chưa xong').click();
    });
    await act(async () => {
      await flush();
    });
    expect((stub.store.get('t:a') as Task).done).toBe(false);
    expect(focusTotal()).toBe(0);
  });

  it('completion xác nhận với việc lặp → theo R-11: vẫn mở, dời hạn, focus +1', async () => {
    stub.seed({
      't:a': fixture({
        id: 'a',
        title: 'Việc lặp',
        dueAt: '2035-01-01T08:00',
        recurrence: { kind: 'daily' },
      }),
    });
    stub.localStore.set(POMODORO_KEY, {
      phase: 'focus',
      running: true,
      endsAt: Date.now() - 10,
      remaining: 0,
      taskId: 'a',
      interruptions: 0,
    });
    const container = await renderApp();
    await act(async () => {
      await flush();
      await flush();
    });
    await act(() => {
      findButton(container, 'Xong rồi').click();
    });
    await act(async () => {
      await flush();
      await flush();
    });
    const saved = stub.store.get('t:a') as Task;
    expect(saved.done).toBe(false);
    expect(saved.dueAt).toBe('2035-01-02T08:00');
    expect(focusTotal()).toBe(1);
  });

  it('taskId trỏ việc đã xoá → placeholder "Việc không còn tồn tại", End không crash', async () => {
    stub.localStore.set(POMODORO_KEY, activeState('ghost'));
    const container = await renderApp();
    expect(container.textContent).toContain('Việc không còn tồn tại');
    expect(container.querySelector('[data-testid="focus-overlay"]')).not.toBeNull();

    await act(() => {
      findButton(container, 'Kết thúc').click();
    });
    await act(async () => {
      await flush();
    });
    expect(focusTotal()).toBe(0);
  });

  it('FUP-001: "Huỷ gắn việc" → xác nhận Huỷ gắn → attach(null) + 1 ngắt; Giữ việc cũ → không đổi', async () => {
    stub.seed({ 't:a': fixture({ id: 'a', title: 'Việc đang học' }) });
    stub.localStore.set(POMODORO_KEY, activeState('a'));
    const container = await renderApp();

    expect(findButton(container, 'Huỷ gắn việc')).not.toBeNull();
    expect(container.querySelector('[data-testid="focus-overlay"]')).not.toBeNull();

    await act(() => {
      findButton(container, 'Huỷ gắn việc').click();
    });
    expect(container.textContent).toContain('Huỷ gắn việc đang tập trung?');
    expect(container.textContent).toContain('Huỷ gắn');
    expect(container.textContent).toContain('Giữ việc cũ');

    // Từ chối: việc vẫn gắn, không đếm ngắt, overlay còn nguyên
    await act(() => {
      findButton(container, 'Giữ việc cũ').click();
    });
    expect(savedPomodoro()?.taskId).toBe('a');
    expect(savedPomodoro()?.interruptions).toBe(0);
    expect(container.querySelector('[data-testid="focus-overlay"]')).not.toBeNull();

    // Xác nhận: huỷ gắn + đúng 1 interruption; phiên vẫn chạy (không reset/skip/ghi focus)
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
    const saved = savedPomodoro();
    expect(saved?.taskId).toBeNull();
    expect(saved?.interruptions).toBe(1);
    expect(saved?.running).toBe(true);
    expect(saved?.phase).toBe('focus');
    expect(focusTotal()).toBe(0);
  });
});

/**
 * Behavioral tests cho phase-1-task-01 (R-20 state layer) của usePomodoro.
 *
 * Không dùng @testing-library/* — giữ pattern createRoot + act của repo.
 * `vi.resetModules()` ở beforeEach để có module sạch; React/usePomodoro được
 * import động SAU khi chrome stub install (tránh "Invalid hook call").
 *
 * Không dùng snapshot: mọi assert đều đọc state thật từ API hoặc từ
 * chrome.storage.local sau khi act — false confidence không có chỗ ở đây.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { POMODORO_KEY, type PomodoroState } from '../../lib/tasks/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface UsePomodoroApi {
  phase: 'focus' | 'break';
  running: boolean;
  remaining: number;
  taskId: string | null;
  start: () => void;
  pause: () => void;
  skip: () => void;
  reset: () => void;
  attach: (taskId: string | null) => void;
  noteInterruption: () => void;
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Stored PomodoroState fixture — interruptions: 0 = đầu phiên focus mới. */
function pomodoroFixture(overrides: Partial<PomodoroState> = {}): PomodoroState {
  return {
    phase: 'focus',
    running: false,
    endsAt: null,
    remaining: 25 * 60_000,
    taskId: null,
    interruptions: 0,
    ...overrides,
  };
}

let stub: ChromeStub;
let api: UsePomodoroApi;
let completeCalls: number;
let activeUnmount: (() => Promise<void>) | null = null;

async function act(work: () => void | Promise<void>): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
  });
}

async function settle(): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await flush();
  });
}

interface MountOptions {
  seed?: PomodoroState;
  onFocusComplete?: () => void;
}

async function mount(options: MountOptions = {}): Promise<void> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { usePomodoro } = await import('../../hooks/usePomodoro');

  // Seed trực tiếp localStore TRƯỚC khi mount → không phát onChanged
  if (options.seed) stub.localStore.set(POMODORO_KEY, options.seed);

  const container = document.createElement('div');
  document.body.appendChild(container);

  function Probe() {
    api = usePomodoro({
      preset: '25/5',
      soundEnabled: false,
      onFocusComplete: options.onFocusComplete ?? (() => { completeCalls += 1; }),
    }) as UsePomodoroApi;
    return React.createElement('div', null, api.phase);
  }

  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Probe));
  });
  await settle();

  activeUnmount = async () => {
    await React.act(async () => {
      root.unmount();
    });
    container.remove();
  };
}

async function unmount(): Promise<void> {
  if (activeUnmount) await activeUnmount();
  activeUnmount = null;
}

/** State đã commit xuống chrome.storage.local. */
function saved(): PomodoroState {
  return stub.localStore.get(POMODORO_KEY) as PomodoroState;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  completeCalls = 0;
  activeUnmount = null;
  document.body.innerHTML = '';
});

afterEach(async () => {
  await unmount();
  await flush();
  document.body.innerHTML = '';
});

describe('AC1 — attach + persistence qua đóng/mở popup', () => {
  it('attach("t-1") rồi unmount/remount → vẫn đúng taskId và endsAt', async () => {
    await mount();
    await act(() => { api.attach('t-1'); });
    await act(() => { api.start(); });

    const before = saved();
    expect(before.taskId).toBe('t-1');
    expect(typeof before.endsAt).toBe('number');
    expect(before.running).toBe(true);

    await unmount();
    await mount();

    expect(api.taskId).toBe('t-1');
    const after = saved();
    expect(after.taskId).toBe('t-1');
    expect(after.endsAt).toBe(before.endsAt);
  });
});

describe('AC2 — attach(null) + vòng đời interruptions', () => {
  it('attach(null) huỷ gắn; noteInterruption +1 mỗi lần; reset/skip xoá đúng quyết định 1', async () => {
    await mount();
    await act(() => { api.attach('t-1'); });

    await act(() => { api.noteInterruption(); });
    expect(saved().interruptions).toBe(1);
    await act(() => { api.noteInterruption(); });
    expect(saved().interruptions).toBe(2);

    // attach(null) chỉ huỷ việc, không đụng bộ đếm
    await act(() => { api.attach(null); });
    expect(api.taskId).toBeNull();
    expect(saved().taskId).toBeNull();
    expect(saved().interruptions).toBe(2);

    // reset kết thúc phiên → xoá bộ đếm
    await act(() => { api.reset(); });
    expect(saved().interruptions).toBeUndefined();

    // focus mới sau reset đếm lại từ 1
    await act(() => { api.noteInterruption(); });
    expect(saved().interruptions).toBe(1);

    // skip focus → break → xoá bộ đếm
    await act(() => { api.skip(); });
    expect(saved().phase).toBe('break');
    expect(saved().interruptions).toBeUndefined();

    // skip break → focus mới → init 0
    await act(() => { api.skip(); });
    expect(saved().phase).toBe('focus');
    expect(saved().interruptions).toBe(0);
    expect(completeCalls).toBe(0);
  });
});

describe('AC3 — skip không record; natural completion record đúng 1', () => {
  it('skip() ở focus KHÔNG gọi onFocusComplete', async () => {
    await mount({ seed: pomodoroFixture({ taskId: 't-1' }) });
    await act(() => { api.skip(); });

    expect(completeCalls).toBe(0);
    expect(saved().phase).toBe('break');
  });

  it('natural completion (đếm về 0 ở focus) gọi onFocusComplete đúng 1 lần', async () => {
    await mount({
      seed: pomodoroFixture({ running: true, endsAt: Date.now() - 1000, taskId: 't-1' }),
    });

    expect(completeCalls).toBe(1);
    expect(saved().phase).toBe('break');
    await flush();
    expect(completeCalls).toBe(1);
  });

  it('break hết giờ tự nhiên KHÔNG gọi onFocusComplete', async () => {
    await mount({
      seed: pomodoroFixture({ phase: 'break', running: true, endsAt: Date.now() - 1000 }),
    });

    expect(completeCalls).toBe(0);
    expect(saved().phase).toBe('focus');
  });
});

describe('AC4 — clear taskId sau completion/skip', () => {
  it('natural completion clear taskId; phiên focus kế không tự gắn việc cũ', async () => {
    await mount({
      seed: pomodoroFixture({ running: true, endsAt: Date.now() - 1000, taskId: 't-old' }),
    });

    expect(completeCalls).toBe(1);
    expect(saved().phase).toBe('break');
    expect(saved().taskId).toBeNull();
    expect(api.taskId).toBeNull();

    await act(() => { api.skip(); }); // break → focus
    expect(saved().phase).toBe('focus');
    expect(saved().taskId).toBeNull();
    expect(api.taskId).toBeNull();
  });

  it('skip focus có taskId cũng clear id ngay', async () => {
    await mount({ seed: pomodoroFixture({ taskId: 't-skip' }) });
    await act(() => { api.skip(); });

    expect(saved().taskId).toBeNull();
    expect(completeCalls).toBe(0);
  });
});

describe('AC5 — hydrate từ chrome.storage.local.onChanged', () => {
  it('surface khác ghi local → hook đang mount cập nhật taskId', async () => {
    await mount();
    expect(api.taskId).toBeNull();

    const other = pomodoroFixture({
      taskId: 't-b',
      running: true,
      endsAt: Date.now() + 600_000,
    });
    await act(async () => {
      stub.localStore.set(POMODORO_KEY, other);
      stub.emitLocalChange([POMODORO_KEY]);
      await flush();
    });

    expect(api.taskId).toBe('t-b');
    expect(saved().taskId).toBe('t-b');
  });

  it('subscribe đúng 1 local listener và huỷ khi unmount', async () => {
    await mount();
    expect(stub.localListeners.size).toBe(1);

    await unmount();
    expect(stub.localListeners.size).toBe(0);
  });
});

describe('AC6 — không đụng sync/schema; studyLog đi qua completion thật', () => {
  it('state pomodoro chỉ ở local; skip không tạo studyLog, completion thật mới bắn callback', async () => {
    await mount();
    await act(() => { api.attach('t-1'); });
    await act(() => { api.noteInterruption(); });
    await act(() => { api.skip(); });

    // R-20 là local-only: không key pomodoro/studyLog trong sync
    expect(stub.localStore.has(POMODORO_KEY)).toBe(true);
    expect(stub.store.has(POMODORO_KEY)).toBe(false);
    expect(stub.store.has('studyLog')).toBe(false);
    expect(stub.localStore.has('studyLog')).toBe(false);
    // skip focus → useBoard không nhận completion → record('focus', 1) không chạy
    expect(completeCalls).toBe(0);

    await unmount();
    await mount({
      seed: pomodoroFixture({ running: true, endsAt: Date.now() - 1000 }),
    });
    // Chỉ natural completion mới mở đường cho record('focus', 1)
    expect(completeCalls).toBe(1);
  });
});

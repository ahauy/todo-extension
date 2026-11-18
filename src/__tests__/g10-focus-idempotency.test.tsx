/**
 * G10 — double-focus giữa popup và New Tab.
 *
 * Reproduce: 2 instance usePomodoro cùng hydrate 1 session đã hết giờ từ
 * chrome.storage.local → cả 2 bắn onFocusComplete, nhưng khóa tiêu thụ
 * (`claimFocusCompletion`) chỉ cho phép 1 record cho cùng 1 sessionId.
 * Không dùng snapshot: assert số record/session id thật từ callback.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import { FOCUS_CLAIM_KEY, POMODORO_KEY, type PomodoroState } from '../../lib/tasks/types';

type PomodoroApi = import('../../hooks/usePomodoro').PomodoroApi;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function act(work: () => void | Promise<void>): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
  });
}

async function settle(): Promise<void> {
  await act(flush);
}

function sessionFixture(overrides: Partial<PomodoroState> = {}): PomodoroState {
  return {
    phase: 'focus',
    running: true,
    endsAt: Date.now() - 1_000,
    remaining: 0,
    taskId: 't-g10',
    interruptions: 0,
    focusSessionId: 'session-g10',
    ...overrides,
  };
}

let stub: ChromeStub;
let cleanups: Array<() => Promise<void>>;

async function mountProbe(
  onFocusComplete: (sessionId: string) => void,
  seed?: PomodoroState
): Promise<() => PomodoroApi> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { usePomodoro } = await import('../../hooks/usePomodoro');

  if (seed) stub.localStore.set(POMODORO_KEY, seed);
  const container = document.createElement('div');
  document.body.appendChild(container);
  let api: PomodoroApi | null = null;

  function Probe() {
    api = usePomodoro({ preset: '25/5', soundEnabled: false, onFocusComplete });
    return React.createElement('div');
  }

  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Probe));
  });
  await settle();

  cleanups.push(async () => {
    await React.act(async () => root.unmount());
    container.remove();
  });
  return () => {
    if (!api) throw new Error('Probe chưa render');
    return api as PomodoroApi;
  };
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  cleanups = [];
  document.body.innerHTML = '';
});

afterEach(async () => {
  for (const cleanup of cleanups.reverse()) await cleanup();
  cleanups = [];
  await flush();
  document.body.innerHTML = '';
});

describe('G10 — claimFocusCompletion', () => {
  it('cùng 1 sessionId → đúng 1 lần claim; stale dialog của phiên cũ vẫn bị chặn sau phiên mới', async () => {
    const { claimFocusCompletion } = await import('../../lib/storage/local');

    expect(await claimFocusCompletion('s1')).toBe(true);
    expect(await claimFocusCompletion('s1')).toBe(false);
    expect(stub.localStore.get(FOCUS_CLAIM_KEY)).toEqual(['s1']);
    expect(await claimFocusCompletion('s2')).toBe(true);
    expect(stub.localStore.get(FOCUS_CLAIM_KEY)).toEqual(['s1', 's2']);

    // Context/page khác: Set trong module bị reset nhưng tập đã tiêu thụ vẫn ở local.
    // Review STRICT round 1 / HIGH-01: s1 confirm trễ sau khi s2 claim phải FAIL.
    vi.resetModules();
    const { claimFocusCompletion: freshClaim } = await import('../../lib/storage/local');
    expect(await freshClaim('s1')).toBe(false);
    expect(await freshClaim('s2')).toBe(false);
  });

  it('runOncePerFocusSession không chạy work cho session đã tiêu thụ', async () => {
    const { claimFocusCompletion, runOncePerFocusSession } = await import('../../lib/storage/local');
    const work = vi.fn();

    expect(await claimFocusCompletion('s1')).toBe(true);
    await runOncePerFocusSession('s2', work);
    expect(work).toHaveBeenCalledTimes(1);

    // Context khác vẫn giữ s1 trong tập đã tiêu thụ → không tick task / không record.
    vi.resetModules();
    const { runOncePerFocusSession: freshRun } = await import('../../lib/storage/local');
    const staleWork = vi.fn();
    await freshRun('s1', staleWork);
    expect(staleWork).not.toHaveBeenCalled();
  });

  it('session khác nhau thì mỗi phiên được tính 1 lần', async () => {
    const { claimFocusCompletion } = await import('../../lib/storage/local');
    expect(await claimFocusCompletion('a')).toBe(true);
    expect(await claimFocusCompletion('b')).toBe(true);
  });
});

describe('G10 — 2 surface cùng completion', () => {
  it('2 hook hydrate cùng 1 phiên → 2 callback nhưng chỉ 1 record', async () => {
    const { claimFocusCompletion } = await import('../../lib/storage/local');
    const sessions: string[] = [];
    let records = 0;
    const onComplete = (sessionId: string) => {
      sessions.push(sessionId);
      void claimFocusCompletion(sessionId).then((claimed) => {
        if (claimed) records += 1;
      });
    };

    const seed = sessionFixture();
    await mountProbe(onComplete, seed);
    await mountProbe(onComplete, seed);
    await settle();

    expect(sessions).toHaveLength(2);
    expect(new Set(sessions).size).toBe(1);
    expect(sessions[0]).toBe('session-g10');
    expect(records).toBe(1);
  });

  it('state cũ thiếu focusSessionId → fallback theo endsAt vẫn chỉ tính 1 lần', async () => {
    const { claimFocusCompletion } = await import('../../lib/storage/local');
    const sessions: string[] = [];
    let records = 0;
    const onComplete = (sessionId: string) => {
      sessions.push(sessionId);
      void claimFocusCompletion(sessionId).then((claimed) => {
        if (claimed) records += 1;
      });
    };

    const endsAt = Date.now() - 1_000;
    const seed = sessionFixture({ focusSessionId: undefined, endsAt });
    await mountProbe(onComplete, seed);
    await mountProbe(onComplete, seed);
    await settle();

    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toBe(`legacy:${endsAt}`);
    expect(records).toBe(1);
  });

  it('phiên chưa hết giờ thì không bắn completion; start() sinh id mới mỗi lần', async () => {
    const sessions: string[] = [];
    const getApi = await mountProbe((id) => sessions.push(id), sessionFixture({
      running: false,
      endsAt: null,
      remaining: 25 * 60_000,
    }));

    expect(sessions).toHaveLength(0);
    await act(() => { getApi().start(); });
    const first = (stub.localStore.get(POMODORO_KEY) as PomodoroState).focusSessionId;
    expect(typeof first).toBe('string');

    await act(() => { getApi().pause(); getApi().start(); });
    const second = (stub.localStore.get(POMODORO_KEY) as PomodoroState).focusSessionId;
    expect(typeof second).toBe('string');
    expect(second).not.toBe(first);
  });
});

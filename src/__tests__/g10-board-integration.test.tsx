/**
 * G10 — integration: đi qua useBoard THẬT + useStudyLog THẬT (không tự cộng biến
 * trong test). Kiểm chứng cả hai nhánh: confirm hợp lệ → record('focus',1) +
 * toggle task; stale dialog của phiên đã bị tiêu thụ ở phiên khác → không record,
 * không toggle (review STRICT round 1 / MEDIUM-01).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import {
  FOCUS_CLAIM_KEY,
  POMODORO_KEY,
  STUDY_LOG_KEY,
  TASK_KEY_PREFIX,
  type PomodoroState,
  type Task,
} from '../../lib/tasks/types';
import { dayKey } from '../../lib/datetime';

type Board = import('../../hooks/useBoard').Board;
type StudyLog = Record<string, { tasks: number; focus: number }>;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const TASK_ID = 't-g10';

function taskFixture(): Task {
  return {
    id: TASK_ID,
    title: 'Việc gắn focus',
    note: '',
    priority: 'important-not-urgent',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function sessionFixture(sessionId: string): PomodoroState {
  return {
    phase: 'focus',
    running: true,
    endsAt: Date.now() - 1_000,
    remaining: 0,
    taskId: TASK_ID,
    interruptions: 0,
    focusSessionId: sessionId,
  };
}

let stub: ChromeStub;
let cleanups: Array<() => Promise<void>>;

async function act(work: () => void | Promise<void>): Promise<void> {
  const React = await import('react');
  await React.act(async () => {
    await work();
    await flush();
  });
}

async function mountBoard(): Promise<() => Board> {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { useBoard } = await import('../../hooks/useBoard');

  const container = document.createElement('div');
  document.body.appendChild(container);
  let board: Board | null = null;

  function Probe() {
    board = useBoard();
    return React.createElement('div');
  }

  const root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Probe));
  });
  await act(() => undefined);

  cleanups.push(async () => {
    await React.act(async () => root.unmount());
    container.remove();
  });
  return () => {
    if (!board) throw new Error('Probe chưa render');
    return board as Board;
  };
}

function focusCount(): number {
  return (stub.store.get(STUDY_LOG_KEY) as StudyLog | undefined)?.[dayKey(new Date())]?.focus ?? 0;
}

function taskDone(): boolean {
  return (stub.store.get(`${TASK_KEY_PREFIX}${TASK_ID}`) as Task | undefined)?.done ?? false;
}

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
  cleanups = [];
  document.body.innerHTML = '';
  stub.seed({ [`${TASK_KEY_PREFIX}${TASK_ID}`]: taskFixture() });
  stub.localStore.set(POMODORO_KEY, sessionFixture('s1'));
});

afterEach(async () => {
  for (const cleanup of cleanups.reverse()) await cleanup();
  cleanups = [];
  await flush();
  document.body.innerHTML = '';
});

describe('G10 — useBoard + useStudyLog thật', () => {
  it('confirm dialog hợp lệ → studyLog.focus +1 và task được tick', async () => {
    const getBoard = await mountBoard();
    expect(getBoard().pendingCompletion?.sessionId).toBe('s1');
    expect(focusCount()).toBe(0);
    expect(taskDone()).toBe(false);

    await act(() => { getBoard().confirmFocusCompletion(); });

    expect(focusCount()).toBe(1);
    expect(taskDone()).toBe(true);
    expect(stub.localStore.get(FOCUS_CLAIM_KEY)).toEqual(['s1']);
  });

  it('stale dialog s1 confirm sau khi s1 đã tiêu thụ và s2 cũng đã claim → không record, không tick', async () => {
    // Popup đã claim s1, sau đó một bề mặt claim s2; New Tab vẫn giữ dialog s1 cũ.
    stub.localStore.set(FOCUS_CLAIM_KEY, ['s1', 's2']);
    const getBoard = await mountBoard();
    expect(getBoard().pendingCompletion?.sessionId).toBe('s1');

    await act(() => { getBoard().confirmFocusCompletion(); });

    expect(focusCount()).toBe(0);
    expect(taskDone()).toBe(false);
    expect(stub.localStore.get(FOCUS_CLAIM_KEY)).toEqual(['s1', 's2']);
  });
});

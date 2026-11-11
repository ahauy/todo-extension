/**
 * chrome.storage.local — trạng thái đồng hồ Pomodoro.
 * Không dùng storage.sync cho đồng hồ: sync giới hạn 120 write/phút và đồng hồ
 * đổi trạng thái liên tục; đồng hồ cũng là thứ thuộc về một máy, không đồng bộ.
 * Mọi hàm đều chịu được môi trường không có chrome.storage.local (unit test).
 */
import { POMODORO_KEY, type PomodoroState } from '../tasks/types';

export const DEFAULT_POMODORO: PomodoroState = {
  phase: 'focus',
  running: false,
  endsAt: null,
  remaining: 25 * 60_000,
  taskId: null,
};

function area(): chrome.storage.LocalStorageArea | null {
  return typeof chrome !== 'undefined' ? chrome.storage?.local ?? null : null;
}

export async function loadPomodoro(): Promise<PomodoroState> {
  const local = area();
  if (!local) return { ...DEFAULT_POMODORO };
  return new Promise((resolve) => {
    local.get([POMODORO_KEY], (result) => {
      const raw = result?.[POMODORO_KEY] as PomodoroState | undefined;
      resolve(raw ? { ...DEFAULT_POMODORO, ...raw } : { ...DEFAULT_POMODORO });
    });
  });
}

export async function savePomodoro(state: PomodoroState): Promise<void> {
  const local = area();
  if (!local) return;
  return new Promise((resolve) => {
    local.set({ [POMODORO_KEY]: state }, () => resolve());
  });
}

/** Tab đang mở bảng Học Đường — để nút biểu tượng focus lại thay vì mở trùng.
 *  Dùng session nên không cần quyền `tabs`. */
const BOARD_TAB_KEY = 'boardTabId';

export async function rememberBoardTab(id: number): Promise<void> {
  const session = typeof chrome !== 'undefined' ? chrome.storage?.session : null;
  if (!session) return;
  await session.set({ [BOARD_TAB_KEY]: id });
}

export async function recallBoardTab(): Promise<number | null> {
  const session = typeof chrome !== 'undefined' ? chrome.storage?.session : null;
  if (!session) return null;
  const result = await session.get([BOARD_TAB_KEY]);
  const id = result?.[BOARD_TAB_KEY];
  return typeof id === 'number' ? id : null;
}
/**
 * chrome.storage.local — trạng thái đồng hồ Pomodoro.
 * Không dùng storage.sync cho đồng hồ: sync giới hạn 120 write/phút và đồng hồ
 * đổi trạng thái liên tục; đồng hồ cũng là thứ thuộc về một máy, không đồng bộ.
 * Mọi hàm đều chịu được môi trường không có chrome.storage.local (unit test).
 */
import { FOCUS_CLAIM_KEY, POMODORO_KEY, type PomodoroState } from '../tasks/types';

export const DEFAULT_POMODORO: PomodoroState = {
  phase: 'focus',
  running: false,
  endsAt: null,
  remaining: 25 * 60_000,
  taskId: null,
  interruptions: 0,
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

/**
 * G10 — tiêu thụ completion của 1 phiên focus đúng 1 lần.
 * - Set trong context chặn double-confirm giữa 2 hook cùng page (popup hoặc New Tab).
 * - Tập sessionId ở `focusCompletionClaim` chặn stale dialog của phiên CŨ ngay cả
 *   sau khi phiên MỚI đã được tiêu thụ (review STRICT round 1 / HIGH-01).
 *   Giữ N phiên gần nhất để khoá không tăng vô hạn (New Tab sống lâu).
 * `chrome.storage.local` không có compare-and-swap: 2 context xác nhận cùng tick
 * tuyệt đối vẫn là rủi ro lý thuyết (ghi residual); mọi trường hợp tuần tự được chặn.
 */
const consumedInContext = new Set<string>();
const MAX_CLAIMED_SESSIONS = 32;

export async function claimFocusCompletion(sessionId: string): Promise<boolean> {
  if (consumedInContext.has(sessionId)) return false;
  consumedInContext.add(sessionId);
  if (consumedInContext.size > MAX_CLAIMED_SESSIONS) {
    const oldest = consumedInContext.values().next().value;
    if (oldest) consumedInContext.delete(oldest);
  }

  const local = area();
  if (!local) return true;
  const stored = await new Promise<string[]>((resolve) => {
    local.get([FOCUS_CLAIM_KEY], (result) => {
      const raw = result?.[FOCUS_CLAIM_KEY];
      resolve(Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : []);
    });
  });
  if (stored.includes(sessionId)) return false;

  await new Promise<void>((resolve) => {
    local.set({ [FOCUS_CLAIM_KEY]: [...stored, sessionId].slice(-MAX_CLAIMED_SESSIONS) }, () => resolve());
  });
  return true;
}

/** G10 — dùng ở useBoard: chỉ chạy `work` khi phiên này chưa được tiêu thụ. */
export async function runOncePerFocusSession(sessionId: string, work: () => void): Promise<void> {
  if (await claimFocusCompletion(sessionId)) work();
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
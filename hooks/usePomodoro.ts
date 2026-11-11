/**
 * Đồng hồ giờ học (Pomodoro). State ở chrome.storage.local nên đóng popup rồi
 * mở lại vẫn còn phiên đang chạy. Chỉ ghi storage khi đổi trạng thái, không
 * ghi mỗi nhịp đếm — sync giới hạn 120 write/phút.
 *
 * Hết phiên tập trung → chuông + sang giờ nghỉ và tự chạy.
 * Hết giờ nghỉ → chuông + về phiên tập trung và chờ người dùng bấm bắt đầu.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_POMODORO,
  loadPomodoro,
  savePomodoro,
} from '../lib/storage/local';
import { playBell } from '../lib/sound';
import type { PomodoroPreset, PomodoroState } from '../lib/tasks/types';

export const PRESET_MINUTES: Record<PomodoroPreset, { focus: number; break: number }> = {
  '25/5': { focus: 25, break: 5 },
  '50/10': { focus: 50, break: 10 },
};

export function presetDuration(preset: PomodoroPreset, phase: 'focus' | 'break'): number {
  return PRESET_MINUTES[preset][phase] * 60_000;
}

interface Options {
  preset: PomodoroPreset;
  soundEnabled: boolean;
  onFocusComplete: () => void;
}

export interface PomodoroApi {
  phase: 'focus' | 'break';
  running: boolean;
  remaining: number;
  progress: number;
  taskId: string | null;
  start: () => void;
  pause: () => void;
  skip: () => void;
  reset: () => void;
  attach: (taskId: string | null) => void;
}

export function usePomodoro({ preset, soundEnabled, onFocusComplete }: Options): PomodoroApi {
  const [state, setState] = useState<PomodoroState>(DEFAULT_POMODORO);
  const [now, setNow] = useState(() => Date.now());
  const hydrated = useRef(false);
  const soundRef = useRef(soundEnabled);
  const completeRef = useRef(onFocusComplete);
  soundRef.current = soundEnabled;
  completeRef.current = onFocusComplete;

  useEffect(() => {
    void loadPomodoro().then((stored) => {
      hydrated.current = true;
      setState(stored);
      setNow(Date.now());
    });
  }, []);

  const commit = useCallback((next: PomodoroState) => {
    setState(next);
    if (hydrated.current) void savePomodoro(next);
  }, []);

  const advance = useCallback(
    (from: PomodoroState) => {
      const nextPhase = from.phase === 'focus' ? 'break' : 'focus';
      const duration = presetDuration(preset, nextPhase);
      if (soundRef.current) playBell();
      if (from.phase === 'focus') completeRef.current();
      commit({
        phase: nextPhase,
        // Giờ nghỉ tự chạy; phiên học mới thì chờ người dùng bấm bắt đầu
        running: nextPhase === 'break',
        endsAt: nextPhase === 'break' ? Date.now() + duration : null,
        remaining: duration,
        taskId: from.taskId,
      });
    },
    [preset, commit]
  );

  // Nhịp đếm chỉ chạy khi đồng hồ đang chạy
  useEffect(() => {
    if (!state.running || state.endsAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [state.running, state.endsAt]);

  const remaining = state.running && state.endsAt !== null
    ? Math.max(0, state.endsAt - now)
    : state.remaining;

  // Hết phiên — xử lý một lần, advance đổi endsAt nên không lặp
  useEffect(() => {
    if (!state.running || state.endsAt === null) return;
    if (state.endsAt - now > 0) return;
    advance(state);
  }, [state, now, advance]);

  // Đổi preset khi đang dừng thì nạp lại thời lượng của pha hiện tại.
  // Cố ý chỉ phụ thuộc `preset`: các đổi trạng thái khác đã có commit riêng.
  useEffect(() => {
    if (!hydrated.current || state.running) return;
    const duration = presetDuration(preset, state.phase);
    if (state.remaining === duration) return;
    commit({ ...state, remaining: duration, endsAt: null });
  }, [preset]);

  const total = presetDuration(preset, state.phase);

  const start = useCallback(() => {
    const left = state.remaining > 0 ? state.remaining : presetDuration(preset, state.phase);
    commit({ ...state, running: true, endsAt: Date.now() + left, remaining: left });
  }, [state, preset, commit]);

  const pause = useCallback(() => {
    const left = state.endsAt !== null ? Math.max(0, state.endsAt - Date.now()) : state.remaining;
    commit({ ...state, running: false, endsAt: null, remaining: left });
  }, [state, commit]);

  const skip = useCallback(() => advance(state), [state, advance]);

  const reset = useCallback(() => {
    commit({
      ...state,
      running: false,
      endsAt: null,
      remaining: presetDuration(preset, state.phase),
    });
  }, [state, preset, commit]);

  const attach = useCallback(
    (taskId: string | null) => commit({ ...state, taskId }),
    [state, commit]
  );

  return {
    phase: state.phase,
    running: state.running,
    remaining,
    progress: total === 0 ? 0 : Math.min(1, Math.max(0, 1 - remaining / total)),
    taskId: state.taskId,
    start,
    pause,
    skip,
    reset,
    attach,
  };
}
/**
 * Đồng hồ giờ học. Mặt đồng hồ tròn viền đôi vàng kim, vòng mực đỏ son chạy
 * quanh viền theo phiên. Bản thu gọn 96px dùng ở chân Popup, chỉ số và một
 * nút; bản đầy đủ 220px ở Bàn học có đủ bắt đầu / tạm dừng / bỏ qua và bộ
 * chọn 25/5 · 50/10.
 *
 * R-20: bản `overlay` dùng khi phiên focus đang chạy và đã gắn việc — dial
 * ≥96px, thẻ việc + hai nút riêng "Tạm dừng" / "Kết thúc" (Kết thúc = reset,
 * không chuyển break, không ghi focus). FUP-001: thêm nút "Huỷ gắn việc" khi
 * có việc gắn và truyền `onDetach`.
 */
import React from 'react';
import Button from './ui/Button';
import Segmented from './ui/Segmented';
import IconButton from './ui/IconButton';
import { PauseIcon, PlayIcon, SkipIcon } from './art/Icons';
import { clockText } from '../lib/datetime';
import type { PomodoroApi } from '../hooks/usePomodoro';
import type { PomodoroPreset } from '../lib/tasks/types';

const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Dial({
  api,
  small,
  overlay,
}: {
  api: PomodoroApi;
  small?: boolean;
  overlay?: boolean;
}) {
  return (
    <div className="timer-dial" data-size={overlay ? 'overlay' : small ? 'sm' : undefined}>
      {!small && (
        <svg className="timer-ring" viewBox="0 0 216 216" aria-hidden="true">
          <circle
            cx="108"
            cy="108"
            r={RADIUS}
            strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - api.progress)}
            opacity={api.running ? 1 : 0.35}
          />
        </svg>
      )}
      <div className="stack items-center gap-xxs">
        <span className="timer-readout tnum">{clockText(api.remaining)}</span>
      </div>
    </div>
  );
}

interface FocusTimerProps {
  api: PomodoroApi;
  preset: PomodoroPreset;
  onPresetChange: (preset: PomodoroPreset) => void;
  taskTitle?: string | null;
  compact?: boolean;
  /** R-20: focus overlay (dial ≥96px + 2 nút điều khiển riêng). */
  overlay?: boolean;
  /** R-20: taskId trỏ việc đã xoá/đổi — hiện placeholder thay vì crash. */
  dangling?: boolean;
  /** R-20: số lần đổi việc trong phiên (local-only). */
  interruptions?: number;
  /** FUP-001: huỷ gắn việc giữa phiên (attach(null) + 1 interruption). */
  onDetach?: () => void;
}

/** Overlay view tách riêng để FocusTimer giữ dưới ngưỡng 50 dòng/hàm. */
function OverlayView({
  api,
  taskTitle,
  dangling,
  interruptions = 0,
  onDetach,
}: Pick<FocusTimerProps, 'api' | 'taskTitle' | 'dangling' | 'interruptions' | 'onDetach'>) {
  const title = (taskTitle ?? '').trim();
  const canDetach = !!onDetach && !dangling && !!title;
  return (
    <section
      className="focus-overlay"
      aria-label="Phiên tập trung"
      data-interruptions={interruptions}
    >
      <h2 className="focus-overlay-title">Đang tập trung</h2>
      <Dial api={api} overlay />
      {dangling || !title ? (
        <p className="focus-overlay-task focus-overlay-task--missing" role="status">
          Việc không còn tồn tại
        </p>
      ) : (
        <div className="focus-overlay-task">
          <span className="focus-overlay-task-label">Việc đang học</span>
          <span className="focus-overlay-task-title">{title}</span>
        </div>
      )}
      {interruptions > 0 && (
        <p className="focus-overlay-interruptions" role="status">
          Đã đổi việc {interruptions} lần trong phiên này.
        </p>
      )}
      <div className="focus-overlay-actions">
        {/* Hai nút riêng biệt: Tạm dừng giữ phiên, Kết thúc = reset/abandon. */}
        <Button variant="primary" onClick={api.pause}>
          Tạm dừng
        </Button>
        <Button variant="secondary" onClick={api.reset}>
          Kết thúc
        </Button>
        {canDetach && (
          <Button variant="secondary" onClick={onDetach}>
            Huỷ gắn việc
          </Button>
        )}
      </div>
    </section>
  );
}

export default function FocusTimer({
  api,
  preset,
  onPresetChange,
  taskTitle,
  compact = false,
  overlay = false,
  dangling = false,
  interruptions = 0,
  onDetach,
}: FocusTimerProps) {
  const label = api.running ? 'Tạm dừng' : 'Bắt đầu học';

  if (overlay) {
    return (
      <OverlayView
        api={api}
        taskTitle={taskTitle}
        dangling={dangling}
        interruptions={interruptions}
        onDetach={onDetach}
      />
    );
  }

  if (compact) {
    return (
      <div className="timer-compact">
        <Dial api={api} small />
        <button
          type="button"
          className="timer-compact-button"
          aria-label={label}
          title={label}
          onClick={api.running ? api.pause : api.start}
        >
          {api.running ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
        </button>
      </div>
    );
  }

  return (
    <section className="focus-card sheen" aria-label="Đồng hồ giờ học">
      <h2 className="mb-base text-heading-sm text-ink-deep">
        {api.phase === 'focus' ? 'Giờ học' : 'Giờ nghỉ'}
      </h2>
      <Dial api={api} />

      {taskTitle && (
        <p className="mt-md text-center text-body-sm text-umber">
          Đang học cùng: <span className="text-brown">{taskTitle}</span>
        </p>
      )}

      <div className="mt-base flex items-center justify-center gap-sm">
        <Button variant="primary" onClick={api.running ? api.pause : api.start}>
          {api.running ? 'Tạm dừng' : 'Bắt đầu học'}
        </Button>
        <IconButton
          aria-label="Bỏ qua phiên này"
          title="Bỏ qua phiên này"
          icon={<SkipIcon size={18} />}
          onClick={api.skip}
        />
      </div>

      <div className="mt-base flex justify-center">
        <Segmented
          aria-label="Độ dài phiên học"
          options={[
            { value: '25/5', label: '25 / 5' },
            { value: '50/10', label: '50 / 10' },
          ]}
          value={preset}
          onChange={(value) => onPresetChange(value as PomodoroPreset)}
        />
      </div>
      <p className="mt-sm text-center text-caption text-umber">
        Học {preset.split('/')[0]} phút, nghỉ {preset.split('/')[1]} phút. Hết giờ có chuông nếu con bật tiếng.
      </p>
    </section>
  );
}

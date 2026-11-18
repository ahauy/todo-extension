/**
 * R-24 — Thời khoá biểu dọc 06:00–24:00 (New Tab only). Component CHỈ đọc
 * `Task[]` qua helper thuần `timeBlock.ts` và ghi lại qua 1 API `onSetTime`
 * (mỗi lần kéo/phím = đúng 1 `put` của phase 1). Không storage/chrome trực tiếp.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  MAX_ESTIMATE_MIN,
  MIN_ESTIMATE_MIN,
  SNAP_STEP_MIN,
  TIMELINE_END_MIN,
  TIMELINE_START_MIN,
  detectOverlaps,
  formatStartAtMinutes,
  normalizeEstimateMin,
  parseStartAtMinutes,
  snapStartAt,
  timelineOrder,
  type TaskTimePatch,
} from '../lib/tasks/timeBlock';
import type { Task } from '../lib/tasks/types';

/** 2px/phút → 30′ = 60px, 15′ = 30px (block ngắn vẫn có hit area 44px). */
const PX_PER_MIN = 2;
const MIN_BLOCK_PX = 44;
const TOTAL_MIN = TIMELINE_END_MIN - TIMELINE_START_MIN;
const HOURS = Array.from(
  { length: TOTAL_MIN / 60 },
  (_, index) => TIMELINE_START_MIN / 60 + index
);

interface TimelineProps {
  tasks: Task[];
  onSetTime: (id: string, patch: TaskTimePatch) => Promise<void>;
}

interface DragState {
  id: string;
  startY: number;
  originMin: number;
  original: string | null;
  preview: string | null;
}

interface TailDrag {
  id: string;
  preview: string | null;
}

/** Chỉ kẹp CHIỀU CAO hiển thị — không đụng giá trị đã lưu (form vẫn báo lỗi). */
function displayEstimateMin(estimateMin: number): number {
  return Math.min(Math.max(estimateMin, MIN_ESTIMATE_MIN), MAX_ESTIMATE_MIN);
}

function hourTop(hour: number): number {
  return (hour * 60 - TIMELINE_START_MIN) * PX_PER_MIN;
}

function blockTop(startMinutes: number): number {
  return (startMinutes - TIMELINE_START_MIN) * PX_PER_MIN;
}

export default function Timeline({ tasks, onSetTime }: TimelineProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [tailDrag, setTailDrag] = useState<TailDrag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => timelineOrder(tasks), [tasks]);
  const overlapIds = useMemo(() => new Set(detectOverlaps(tasks).ids), [tasks]);
  const head = entries.filter((entry) => entry.startMinutes !== null && !entry.outsideWindow);
  const tail = entries.filter((entry) => entry.startMinutes === null || entry.outsideWindow);

  const commit = (id: string, startAt: string | null): void => {
    void onSetTime(id, { startAt })
      .then(() => setAnnouncement(startAt ? `Đã xếp giờ ${startAt}.` : 'Đã bỏ giờ.'))
      .catch(() => setAnnouncement('Không lưu được giờ. Thử lại.'));
  };

  const shiftBy = (task: Task, deltaMin: number): void => {
    const current = parseStartAtMinutes(task.startAt) ?? TIMELINE_START_MIN;
    commit(task.id, snapStartAt(current + deltaMin));
  };

  const onBlockKeyDown = (task: Task) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = {
      ArrowUp: SNAP_STEP_MIN,
      ArrowRight: SNAP_STEP_MIN,
      ArrowDown: -SNAP_STEP_MIN,
      ArrowLeft: -SNAP_STEP_MIN,
    };
    if (event.key in steps) {
      event.preventDefault();
      shiftBy(task, steps[event.key]);
    } else if (event.key === 'Home') {
      event.preventDefault();
      commit(task.id, snapStartAt(TIMELINE_START_MIN));
    } else if (event.key === 'End') {
      event.preventDefault();
      commit(task.id, snapStartAt(TIMELINE_END_MIN));
    }
  };

  const onPointerDown =
    (task: Task, startMinutes: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDrag({
        id: task.id,
        startY: event.clientY,
        originMin: startMinutes,
        original: task.startAt ?? null,
        preview: null,
      });
    };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const deltaMin = (event.clientY - drag.startY) / PX_PER_MIN;
    setDrag({ ...drag, preview: snapStartAt(drag.originMin + deltaMin) });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (drag && drag.preview && drag.preview !== drag.original) commit(drag.id, drag.preview);
    setDrag(null);
  };

  /** R-24 — kéo việc ở nhóm cuối vào khung: vị trí thả → phút trong canvas → snap 15′. */
  const dropMinutes = (clientY: number): number => {
    const top = canvasRef.current?.getBoundingClientRect().top ?? 0;
    return TIMELINE_START_MIN + (clientY - top) / PX_PER_MIN;
  };

  const onTailPointerDown = (id: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setTailDrag({ id, preview: snapStartAt(dropMinutes(event.clientY)) });
  };

  const onTailPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!tailDrag) return;
    setTailDrag({ ...tailDrag, preview: snapStartAt(dropMinutes(event.clientY)) });
  };

  const onTailPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (tailDrag?.preview) commit(tailDrag.id, tailDrag.preview);
    setTailDrag(null);
  };

  const renderBlock = (entry: (typeof head)[number]) => {
    const { task } = entry;
    const startMinutes = entry.startMinutes!;
    const storedMin = normalizeEstimateMin(task.startAt, task.estimateMin) ?? 30;
    const displayMin = displayEstimateMin(storedMin);
    const beyondWindow = startMinutes + displayMin > TIMELINE_END_MIN;
    const endMinutes = Math.min(startMinutes + displayMin, TIMELINE_END_MIN);
    const warning = overlapIds.has(task.id);
    const preview = drag?.id === task.id ? drag.preview : null;
    return (
      <div
        key={task.id}
        className={`timeline-block${warning ? ' timeline-block--overlap' : ''}`}
        data-task-id={task.id}
        data-start-at={task.startAt ?? ''}
        style={{
          top: `${blockTop(startMinutes)}px`,
          height: `${Math.max(MIN_BLOCK_PX, (endMinutes - startMinutes) * PX_PER_MIN)}px`,
        }}
      >
        <button
          type="button"
          className="timeline-block-handle"
          aria-label={`${task.title}, bắt đầu ${task.startAt}, ${storedMin} phút${storedMin !== displayMin ? ' (chiều cao hiển thị đã kẹp 15–240 phút)' : ''}${beyondWindow ? ', vượt khung 24:00' : ''}${warning ? ', chồng lấn với việc khác' : ''}. Dùng mũi tên để dời 15 phút.`}
          onKeyDown={onBlockKeyDown(task)}
          onPointerDown={onPointerDown(task, startMinutes)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
        >
          <span className="timeline-block-time">{preview ?? task.startAt}</span>
          {beyondWindow && (
            <span className="timeline-block-beyond" aria-label="Vượt khung 24:00">
              ⚠ Vượt khung
            </span>
          )}
          {warning && (
            <span className="timeline-block-warning" aria-label="Cảnh báo chồng lấn">
              ⚠ Chồng lấn
            </span>
          )}
          <span className="timeline-block-title">{task.title}</span>
        </button>
        <input
          type="time"
          className="timeline-time-input"
          aria-label={`Đổi giờ bắt đầu của ${task.title}`}
          value={preview ?? task.startAt ?? ''}
          onChange={(event) => commit(task.id, event.target.value || null)}
        />
      </div>
    );
  };

  const renderTail = (entry: (typeof tail)[number]) => {
    const { task } = entry;
    const label =
      entry.startMinutes === null ? 'Chưa xếp giờ' : formatStartAtMinutes(entry.startMinutes);
    const preview = tailDrag?.id === task.id ? tailDrag.preview : null;
    return (
      <li key={task.id} className="timeline-tail-item" data-task-id={task.id}>
        <span className="timeline-tail-label">{label}</span>
        <span className="timeline-tail-title">{task.title}</span>
        <button
          type="button"
          className="timeline-tail-handle"
          aria-label={`Kéo ${task.title} vào khung 06:00–24:00${preview ? `, sẽ xếp lúc ${preview}` : ''}`}
          onPointerDown={onTailPointerDown(task.id)}
          onPointerMove={onTailPointerMove}
          onPointerUp={onTailPointerUp}
          onPointerCancel={() => setTailDrag(null)}
        >
          {preview ?? 'Kéo vào khung'}
        </button>
        <input
          type="time"
          className="timeline-time-input"
          aria-label={`Đổi giờ bắt đầu của ${task.title}`}
          value={task.startAt ?? ''}
          onChange={(event) => commit(task.id, event.target.value || null)}
        />
      </li>
    );
  };

  return (
    <section className="timeline" data-section="time-block" aria-labelledby="timeline-title">
      <div className="timeline-head">
        <h3 id="timeline-title" className="text-caption font-bold tracking-[0.4px] text-brown">
          Thời khoá biểu
        </h3>
        <p className="text-caption text-umber">06:00–24:00 · kéo hoặc dùng mũi tên để dời 15 phút</p>
      </div>
      <div className="timeline-scroll">
        <div className="timeline-track" style={{ height: `${TOTAL_MIN * PX_PER_MIN}px` }}>
          <div className="timeline-gutter" aria-hidden="true">
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="timeline-hour-label"
                style={{ top: `${hourTop(hour)}px` }}
              >
                {`${`${hour}`.padStart(2, '0')}:00`}
              </span>
            ))}
            <span className="timeline-hour-label" style={{ top: `${TOTAL_MIN * PX_PER_MIN}px` }}>
              24:00
            </span>
          </div>
          <div className="timeline-canvas" ref={canvasRef}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="timeline-hour-line"
                style={{ top: `${hourTop(hour)}px` }}
              />
            ))}
            {head.map(renderBlock)}
          </div>
        </div>
      </div>
      {tail.length > 0 && (
        <div className="timeline-tail">
          <h4 className="text-caption font-bold text-brown">Chưa xếp hoặc ngoài khung</h4>
          <ul className="timeline-tail-list">{tail.map(renderTail)}</ul>
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </section>
  );
}

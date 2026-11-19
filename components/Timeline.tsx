/**
 * R-24/R-25 — Thời khoá biểu dọc 00:00–24:00 (New Tab only). Component CHỈ đọc
 * `Task[]` qua helper thuần `timeBlock.ts` và ghi qua `onSetTime` / `onCreate` /
 * `onUpdateTask`. Không storage/chrome trực tiếp.
 *
 * R-25: right-click (hoặc phím `n`) mở popup tạo; kéo vùng trống chọn start→end rồi
 * mở popup tạo với khoảng điền sẵn; click block mở popup sửa; hold-left + move dời block.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { TaskDraft } from '../lib/tasks/form';
import type { Subject, Task } from '../lib/tasks/types';
import TaskEntryPopup, { type PopupAnchor } from './TaskEntryPopup';

/** 2px/phút → 30′ = 60px, 15′ = 30px (block ngắn vẫn có hit area 44px). */
const PX_PER_MIN = 2;
const MIN_BLOCK_PX = 44;
const CLICK_THRESHOLD_PX = 5;
const TOTAL_MIN = TIMELINE_END_MIN - TIMELINE_START_MIN;
const HOURS = Array.from(
  { length: TOTAL_MIN / 60 },
  (_, index) => TIMELINE_START_MIN / 60 + index
);

interface TimelineProps {
  tasks: Task[];
  subjects: Subject[];
  defaultSubjectId?: string | null;
  keystoneCount?: number;
  focusActive?: boolean;
  /** Tăng để mở popup tạo từ bàn phím (phím `n` của New Tab). */
  createSignal?: number;
  onSetTime: (id: string, patch: TaskTimePatch) => Promise<void>;
  onCreate: (draft: TaskDraft) => Promise<void>;
  onUpdateTask: (task: Task) => Promise<void>;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  originMin: number;
  original: string | null;
  preview: string | null;
  moved: boolean;
}

interface TailDrag {
  id: string;
  preview: string | null;
}

interface CreateDrag {
  startY: number;
  lastY: number;
  moved: boolean;
  startAt: string | null;
  endAt: string | null;
}

interface PopupState {
  mode: 'create' | 'edit';
  task: Task | null;
  anchor: PopupAnchor;
  prefill?: { startAt?: string | null; endAt?: string | null };
}

/** Chỉ kẹp CHIỀU CAO hiển thị — không đụng giá trị đã lưu (form vẫn báo lỗi). */
function displayEstimateMin(estimateMin: number): number {
  return Math.min(Math.max(estimateMin, MIN_ESTIMATE_MIN), MAX_ESTIMATE_MIN);
}

/** Nhãn độ dài gọn cho ghost kéo tạo: 45′ · 1h · 1h30. */
function durationLabel(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}′`;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}`;
}

function hourTop(hour: number): number {
  return (hour * 60 - TIMELINE_START_MIN) * PX_PER_MIN;
}

function blockTop(startMinutes: number): number {
  return (startMinutes - TIMELINE_START_MIN) * PX_PER_MIN;
}

export default function Timeline({
  tasks,
  subjects,
  defaultSubjectId = null,
  keystoneCount = 0,
  focusActive = false,
  createSignal,
  onSetTime,
  onCreate,
  onUpdateTask,
}: TimelineProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [tailDrag, setTailDrag] = useState<TailDrag | null>(null);
  const [createDrag, setCreateDrag] = useState<CreateDrag | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const lastSignal = useRef(createSignal);

  const entries = useMemo(() => timelineOrder(tasks), [tasks]);
  const overlapIds = useMemo(() => new Set(detectOverlaps(tasks).ids), [tasks]);
  const head = entries.filter((entry) => entry.startMinutes !== null && !entry.outsideWindow);
  const tail = entries.filter((entry) => entry.startMinutes === null || entry.outsideWindow);

  /** Vị trí mặc định khi mở popup từ bàn phím: góc trên trái của timeline. */
  useEffect(() => {
    if (createSignal === undefined || createSignal === lastSignal.current) return;
    lastSignal.current = createSignal;
    if (focusActive) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    setPopup({
      mode: 'create',
      task: null,
      anchor: { x: (rect?.left ?? 24) + 24, y: (rect?.top ?? 24) + 64 },
    });
  }, [createSignal, focusActive]);

  const commit = (id: string, startAt: string | null): void => {
    void onSetTime(id, { startAt })
      .then(() => setAnnouncement(startAt ? `Đã xếp giờ ${startAt}.` : 'Đã bỏ giờ.'))
      .catch(() => setAnnouncement('Không lưu được giờ. Thử lại.'));
  };

  const shiftBy = (task: Task, deltaMin: number): void => {
    const current = parseStartAtMinutes(task.startAt) ?? TIMELINE_START_MIN;
    commit(task.id, snapStartAt(current + deltaMin));
  };

  /**
   * Popup mở = kết thúc gesture kéo khác. Ghost của kéo tạo được giữ lại khi popup
   * mở trực tiếp từ kéo (R-25) — chỉ xoá khi popup đóng hoặc lúc mở popup bằng lối khác.
   */
  const clearGestures = (preserveCreateGhost = false): void => {
    setDrag(null);
    setTailDrag(null);
    if (!preserveCreateGhost) setCreateDrag(null);
  };

  const openCreate = (
    anchor: PopupAnchor,
    prefill?: PopupState['prefill'],
    preserveCreateGhost = false
  ): void => {
    if (focusActive) {
      setCreateDrag(null); // focus mode: không để ghost mồ côi khi popup bị chặn.
      return;
    }
    clearGestures(preserveCreateGhost);
    setPopup({ mode: 'create', task: null, anchor, prefill });
  };

  const openEdit = (task: Task, anchor: PopupAnchor): void => {
    if (focusActive) return;
    clearGestures();
    setPopup({ mode: 'edit', task, anchor });
  };

  const anchorFrom = (clientX: number, clientY: number): PopupAnchor => ({
    x: clientX,
    y: clientY,
  });

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
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      openEdit(task, anchorFrom(rect.right, rect.top));
    }
  };

  const onPointerDown =
    (task: Task, startMinutes: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDrag({
        id: task.id,
        startX: event.clientX,
        startY: event.clientY,
        originMin: startMinutes,
        original: task.startAt ?? null,
        preview: null,
        moved: false,
      });
    };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const deltaY = event.clientY - drag.startY;
    const deltaX = event.clientX - drag.startX;
    const moved =
      drag.moved ||
      Math.abs(deltaY) >= CLICK_THRESHOLD_PX ||
      Math.abs(deltaX) >= CLICK_THRESHOLD_PX;
    setDrag({
      ...drag,
      moved,
      preview: moved ? snapStartAt(drag.originMin + deltaY / PX_PER_MIN) : null,
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!drag) return;
    if (drag.moved) {
      if (drag.preview && drag.preview !== drag.original) commit(drag.id, drag.preview);
    } else {
      const task = tasks.find((item) => item.id === drag.id);
      if (task) openEdit(task, anchorFrom(event.clientX, event.clientY));
    }
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

  /** R-25 — kéo trên vùng trống: start→end đã snap, clamp tại 24:00 → `endAt = "00:00"`. */
  const onCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (focusActive || event.target !== event.currentTarget) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = snapStartAt(dropMinutes(event.clientY));
    setCreateDrag({
      startY: event.clientY,
      lastY: event.clientY,
      moved: false,
      startAt: point,
      endAt: point,
    });
  };

  const onCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!createDrag) return;
    const moved =
      createDrag.moved || Math.abs(event.clientY - createDrag.startY) >= CLICK_THRESHOLD_PX;
    const fromY = Math.min(createDrag.startY, event.clientY);
    const toY = Math.max(createDrag.startY, event.clientY);
    const fromMin = parseStartAtMinutes(snapStartAt(dropMinutes(fromY))) ?? TIMELINE_START_MIN;
    const toMin = parseStartAtMinutes(snapStartAt(dropMinutes(toY))) ?? TIMELINE_START_MIN;
    const endMin =
      toMin >= TIMELINE_END_MIN ? TIMELINE_END_MIN : Math.max(toMin, fromMin + SNAP_STEP_MIN);
    setCreateDrag({
      ...createDrag,
      lastY: event.clientY,
      moved,
      startAt: snapStartAt(fromMin),
      endAt: endMin >= TIMELINE_END_MIN ? '00:00' : formatStartAtMinutes(endMin),
    });
  };

  const onCanvasPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (createDrag?.moved && createDrag.startAt && createDrag.endAt) {
      openCreate(
        anchorFrom(event.clientX, event.clientY),
        { startAt: createDrag.startAt, endAt: createDrag.endAt },
        true // R-25: ghost ở lại phía sau popup tới khi popup đóng.
      );
      return;
    }
    setCreateDrag(null);
  };

  const onContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault(); // R-25 — chặn context menu của Chrome trong vùng timeline.
    const target = event.target as HTMLElement;
    if (target.closest('[role="dialog"]')) return; // Popup đang mở: không đổi mode/anchor.
    const node = target.closest('[data-task-id]');
    const id = node?.getAttribute('data-task-id');
    const task = id ? tasks.find((item) => item.id === id) : null;
    if (task) openEdit(task, anchorFrom(event.clientX, event.clientY));
    else openCreate(anchorFrom(event.clientX, event.clientY));
  };

  /** R-25 — Esc precedence popup → fullscreen → search/menu (popup tự chặn Esc khi mở). */
  useEffect(() => {
    if (!fullscreen || popup) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setFullscreen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [fullscreen, popup]);

  const renderBlock = (entry: (typeof head)[number]) => {
    const { task } = entry;
    const startMinutes = entry.startMinutes!;
    const storedMin = normalizeEstimateMin(task.startAt, task.estimateMin, task.endAt) ?? 30;
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
        data-end-at={task.endAt ?? ''}
        style={{
          top: `${blockTop(startMinutes)}px`,
          height: `${Math.max(MIN_BLOCK_PX, (endMinutes - startMinutes) * PX_PER_MIN)}px`,
        }}
      >
        <button
          type="button"
          className="timeline-block-handle"
          aria-label={`${task.title}, bắt đầu ${task.startAt}, ${storedMin} phút${storedMin !== displayMin ? ' (chiều cao hiển thị đã kẹp 15–240 phút)' : ''}${beyondWindow ? ', vượt khung 24:00' : ''}${warning ? ', chồng lấn với việc khác' : ''}. Dùng mũi tên để dời 15 phút, Enter để sửa.`}
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
        <button
          type="button"
          className="timeline-tail-title timeline-tail-open"
          aria-label={`Sửa việc ${task.title}`}
          onClick={(event) => openEdit(task, anchorFrom(event.clientX, event.clientY))}
        >
          {task.title}
        </button>
        <button
          type="button"
          className="timeline-tail-handle"
          aria-label={`Kéo ${task.title} vào khung 00:00–24:00${preview ? `, sẽ xếp lúc ${preview}` : ''}`}
          onPointerDown={onTailPointerDown(task.id)}
          onPointerMove={onTailPointerMove}
          onPointerUp={onTailPointerUp}
          onPointerCancel={() => setTailDrag(null)}
        >
          {preview ?? 'Kéo vào khung'}
        </button>
      </li>
    );
  };

  /**
   * R-25 — ghost chữ nhật mờ bám vùng đang kéo: top/cao suy từ start→end đã snap,
   * nhãn giờ + độ dài đặt ở cạnh đang di chuyển để luôn nằm dưới con trỏ.
   */
  const createGhost = (() => {
    if (!createDrag?.moved || !createDrag.startAt || !createDrag.endAt) return null;
    const startMin = parseStartAtMinutes(createDrag.startAt);
    const rawEndMin = parseStartAtMinutes(createDrag.endAt);
    if (startMin === null || rawEndMin === null) return null;
    const endMin = rawEndMin <= startMin ? TIMELINE_END_MIN : rawEndMin;
    const height = Math.max(SNAP_STEP_MIN, endMin - startMin) * PX_PER_MIN;
    const labelAtBottom = createDrag.lastY >= createDrag.startY;
    return (
      <div
        className={`timeline-create-ghost${
          labelAtBottom ? ' timeline-create-ghost--label-bottom' : ''
        }`}
        data-testid="timeline-create-ghost"
        aria-hidden="true"
        style={{ top: `${blockTop(startMin)}px`, height: `${height}px` }}
      >
        <span className="timeline-create-ghost-label">
          {createDrag.startAt}–{createDrag.endAt} · {durationLabel(endMin - startMin)}
        </span>
      </div>
    );
  })();

  return (
    <section
      ref={sectionRef}
      className={`timeline${fullscreen ? ' timeline--fullscreen' : ''}`}
      data-section="time-block"
      aria-labelledby="timeline-title"
      onContextMenu={onContextMenu}
    >
      <div className="timeline-head">
        <h3 id="timeline-title" className="text-caption font-bold tracking-[0.4px] text-brown">
          Thời khoá biểu
        </h3>
        <p className="text-caption text-umber">00:00–24:00 · kéo hoặc dùng mũi tên để dời 15 phút</p>
        <div className="timeline-head-actions flex items-center gap-xs">
          <button
            type="button"
            className="btn-icon size-9"
            aria-label={fullscreen ? 'Thu nhỏ thời khoá biểu' : 'Phóng to thời khoá biểu'}
            title={fullscreen ? 'Thu về bảng' : 'Phóng to toàn tab'}
            aria-pressed={fullscreen}
            onClick={() => setFullscreen((value) => !value)}
          >
            {fullscreen ? '⤡' : '⤢'}
          </button>
        </div>
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
          <div
            className="timeline-canvas"
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={() => setCreateDrag(null)}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="timeline-hour-line"
                style={{ top: `${hourTop(hour)}px` }}
              />
            ))}
            {createGhost}
            {head.map(renderBlock)}
          </div>
        </div>
      </div>
      {tail.length > 0 && (
        <div className="timeline-tail">
          <h4 className="text-caption font-bold text-brown">Chưa xếp giờ</h4>
          <ul className="timeline-tail-list">{tail.map(renderTail)}</ul>
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {popup && (
        <TaskEntryPopup
          key={`${popup.mode}:${popup.task?.id ?? 'new'}`}
          mode={popup.mode}
          task={popup.task}
          anchor={popup.anchor}
          initialTime={popup.prefill}
          subjects={subjects}
          defaultSubjectId={defaultSubjectId}
          keystoneCount={keystoneCount}
          onCreate={onCreate}
          onUpdate={onUpdateTask}
          onClose={() => {
            setPopup(null);
            setCreateDrag(null);
          }}
        />
      )}
    </section>
  );
}

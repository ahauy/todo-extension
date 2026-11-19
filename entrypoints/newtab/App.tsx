/**
 * Bảng Học Đường toàn màn hình — Giá sách (240) · Cuộn nhiệm vụ (1fr) ·
 * Bàn học (320), tối đa 1280px căn giữa, khung đôi vàng kim và họa tiết sen
 * ở bốn góc. Dưới 1200px Giá sách thành dải ngang, dưới 720px còn một cột.
 *
 * Khi người dùng chọn chế độ Popup, trang tab mới không bày cả bảng: chỉ
 * hiện lời chào và một nút mở sổ (manifest không cho gỡ ghi đè tab mới lúc
 * chạy — phần Cài đặt nói rõ cách trả tab mới cho trình duyệt).
 */
import React, { useCallback, useEffect, useState } from 'react';
import Greeting from '../../components/Greeting';
import SubjectShelf from '../../components/SubjectShelf';
import FilterRow from '../../components/FilterRow';
import TaskScrollList from '../../components/TaskScrollList';
import TaskParchment from '../../components/TaskParchment';
import SettingsPanel from '../../components/SettingsPanel';
import PlanTomorrowSheet from '../../components/PlanTomorrowSheet';
import ConfirmDialog from '../../components/ConfirmDialog';
import FocusConfirms, { type FocusInterrupt } from '../../components/FocusConfirms';
import Toast from '../../components/Toast';
import FocusTimer from '../../components/FocusTimer';
import StreakCard from '../../components/StreakCard';
import HabitCard from '../../components/HabitCard';
import Timeline from '../../components/Timeline';
import { MaximCard, Proclamation } from '../../components/Proclamation';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import { CornerFlourish, CloudRule } from '../../components/art/Ornaments';
import { GearIcon, SoundOffIcon, SoundOnIcon } from '../../components/art/Icons';
import { StudyWindow } from '../../components/art/Scenes';
import { useBoard } from '../../hooks/useBoard';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { greetingFor, longDate, dayKey } from '../../lib/datetime';
import { rememberBoardTab, consumePlanSheet } from '../../lib/storage/local';
import type { Subject } from '../../lib/tasks/types';
import {
  isRecurringDoneToday,
  plannedForDay,
  todayKeystoneSummary,
  weeklySummary,
  type BoardTab,
  type SortKey,
} from '../../lib/tasks/query';
import { openKeystoneCount } from '../../lib/tasks/form';
import { withHabitDay } from '../../lib/tasks/habit';
import './style.css';

/** Chế độ Popup: tab mới chỉ là một trang chào yên tĩnh */
function QuietNewTab({ onOpenBoard }: { onOpenBoard: () => void }) {
  const now = new Date();
  const { title, part } = greetingFor(now);
  return (
    <main className="quiet-tab frame-double">
      <div className="arch w-[190px]">
        <StudyWindow part={part} className="block w-full" />
      </div>
      <h1 className="font-display text-display-lg text-ink-deep">{title}</h1>
      <p className="text-subtitle text-brown">{longDate(now)}</p>
      <Button variant="primary" onClick={onOpenBoard}>
        Mở sổ Học Đường
      </Button>
      <p className="max-w-[46ch] text-caption text-umber">
        Sổ đang ở chế độ Popup, nên tab mới chỉ hiện lời chào. Muốn trả tab mới cho trình duyệt,
        mở chrome://extensions và tắt quyền ghi đè trang tab mới của Học Đường.
      </p>
    </main>
  );
}

export default function App() {
  const board = useBoard();
  const wide = useMediaQuery('(min-width: 1024px)');
  const narrow = useMediaQuery('(max-width: 1199px)');
  const horizontal = !wide || narrow;
  const [tab, setTab] = useState<BoardTab>('all');
  const [subjectId, setSubjectId] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [onlyKeystone, setOnlyKeystone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dropSubject, setDropSubject] = useState<Subject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dirtyConfirm, setDirtyConfirm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [createSignal, setCreateSignal] = useState(0);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [interrupt, setInterrupt] = useState<FocusInterrupt | null>(null);

  const attached = board.tasks.find((task) => task.id === board.pomodoro.taskId) ?? null;
  const focusActive =
    board.pomodoro.running && board.pomodoro.phase === 'focus' && !!board.pomodoro.taskId;

  useEffect(() => {
    void chrome.tabs?.getCurrent?.((current) => {
      if (current?.id !== undefined) void rememberBoardTab(current.id);
    });
    // R-22 — notification "Kế hoạch mai" đã ghi cờ → mở sheet lần đầu mount.
    void consumePlanSheet().then((requested) => {
      if (requested) setPlanOpen(true);
    });
  }, []);

  const closeDetail = useCallback(() => {
    if (dirty) setDirtyConfirm(true);
    else setDetailId(null);
  }, [dirty]);

  const handleSearchOpen = useCallback((open: boolean) => {
    setSearchOpen(open);
    if (!open) setSearchQuery('');
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Hộp thoại đang mở thì nhường phím cho nó — không giật focus ra sau lớp modal
      if (document.querySelector('[role="dialog"]')) return;
      // R-20: overlay focus không thoát bằng Escape.
      if (focusActive) return;
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === 'n') {
        event.preventDefault();
        setCreateSignal((value) => value + 1); // R-25 — phím `n` mở popup tạo việc trên timeline.
      } else if (event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape' && searchOpen) {
        handleSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () =>     document.removeEventListener('keydown', onKey);
  }, [searchOpen, handleSearchOpen, focusActive]);

  const openBoardTab = useCallback(() => {
    void chrome.tabs?.create?.({ url: chrome.runtime.getURL('newtab.html') });
  }, []);

  // R-22 — notification kế hoạch phải mở đúng sheet ngay cả khi user chọn chế độ Popup:
  // bỏ qua màn lời chào tĩnh khi đã có yêu cầu mở sheet (cờ đã consume → planOpen=true).
  if (board.settings.displayMode === 'popup' && !planOpen) {
    return <QuietNewTab onOpenBoard={openBoardTab} />;
  }

  const shelf = (
    <SubjectShelf
      subjects={board.subjects}
      tasks={board.tasks}
      value={subjectId}
      onChange={setSubjectId}
      onCreate={board.createSubject}
      onRemove={setDropSubject}
      horizontal={horizontal}
    />
  );

  const handleFocusTask = (id: string) => {
    if (id === board.pomodoro.taskId) return;
    if (board.pomodoro.running && board.pomodoro.phase === 'focus') {
      setInterrupt({ kind: 'attach', id });
      return;
    }
    board.startFocusOn(id);
  };

  // R-21 — hero + dòng tổng kết suy thuần từ task/dayPlan đã hydrate, KHÔNG đọc
  // studyLog hay board.doneToday (aggregate đã lưu).
  const todayKey = dayKey(board.now);
  const frogTaskId = board.dayPlan[todayKey]?.frogTaskId ?? null;
  const frogTask = frogTaskId
    ? board.tasks.find((task) => task.id === frogTaskId) ?? null
    : null;
  // id cũ (stale) trỏ tới task đã xoá → frogTask null → hero rỗng, không crash.
  const frogDone =
    !!frogTask && (frogTask.done || isRecurringDoneToday(frogTask, board.now));
  const dailySummary = todayKeystoneSummary(board.tasks, board.now);
  const weekSummary = weeklySummary(board.tasks, board.dayPlan, board.now);

  // R-22 — kế hoạch mai: ngày local kế tiếp, nguồn là Sắp tới + Chưa hẹn.
  const tomorrow = new Date(board.now.getFullYear(), board.now.getMonth(), board.now.getDate() + 1);
  const tomorrowKey = dayKey(tomorrow);
  const planCandidates = board.tasks.filter(
    (task) => !task.done && !task.archived && (!task.dueAt || new Date(task.dueAt) > board.now)
  );
  const plannedToday = tab === 'today' ? plannedForDay(board.tasks, todayKey) : [];
  const saveTomorrowPlan = useCallback(
    (ids: string[], frogId: string | null) => {
      void (async () => {
        for (const id of ids) {
          const task = board.tasks.find((item) => item.id === id);
          if (task) await board.updateTask({ ...task, plannedFor: tomorrowKey });
        }
        if (frogId) await board.selectFrog(tomorrowKey, frogId);
        setPlanOpen(false);
        board.setToast({ message: 'Đã lên kế hoạch cho ngày mai.' });
      })();
    },
    [board.tasks, board.updateTask, board.selectFrog, board.setToast, tomorrowKey]
  );

  const handleToggle = (id: string) => {
    if (focusActive && id !== board.pomodoro.taskId) {
      setInterrupt({ kind: 'toggle', id });
      return;
    }
    void board.toggleTask(id);
  };

  // R-23 — bỏ dấu một ngày từ lưới thói quen: CHỈ đổi `doneDays` qua helper
  // phase 1. Không toggle việc, không đụng dueAt/alarm, không ghi StudyLog.
  const handleHabitUnmark = useCallback(
    (taskId: string, day: string) => {
      const task = board.tasks.find((item) => item.id === taskId);
      if (!task) return;
      const next = withHabitDay(task, day, 'remove', board.now);
      if (next === task) return;
      void board.updateTask(next);
    },
    [board.tasks, board.now, board.updateTask]
  );

  const handleInterrupt = (next: FocusInterrupt) => {
    if (next.kind === 'detach') {
      board.detachFocus();
      return;
    }
    if (next.kind === 'attach') {
      board.switchTaskMidSession(next.id);
      return;
    }
    void board.toggleTask(next.id);
    board.pomodoro.noteInterruption();
  };

  return (
    <div className="board-page">
      <div className="board frame-double">
        <CornerFlourish at="tl" />
        <CornerFlourish at="tr" />
        <CornerFlourish at="bl" />
        <CornerFlourish at="br" />

        <div className="board-top">
          <div className="board-actions">
            <IconButton
              aria-label={board.settings.soundEnabled ? 'Tắt chuông và tiếng giấy' : 'Bật chuông và tiếng giấy'}
              title={board.settings.soundEnabled ? 'Đang có tiếng — bấm để tắt' : 'Đang im lặng — bấm để bật'}
              active={board.settings.soundEnabled}
              icon={board.settings.soundEnabled ? <SoundOnIcon size={17} /> : <SoundOffIcon size={17} />}
              onClick={board.toggleSound}
            />
            <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>
              Kế hoạch mai
            </Button>
            <IconButton
              aria-label="Cài đặt"
              title="Cài đặt"
              icon={<GearIcon size={17} />}
              onClick={() => setSettingsOpen(true)}
            />
          </div>
        </div>

        {!bannerHidden && (
          <Proclamation
            todayCount={board.counts.today}
            overdue={board.overdue}
            onDismiss={() => setBannerHidden(true)}
          />
        )}

        {horizontal && !focusActive && <div className="board-shelf-strip">{shelf}</div>}

        <div className={`board-grid${focusActive ? ' board-grid--focus' : ''}`}>
          {!horizontal && !focusActive && <aside className="board-shelf">{shelf}</aside>}

          <main className="board-scroll">
            {/* Lời chào đã là tiêu đề thị giác của vùng này; giữ h2 cho cấu trúc
                tài liệu và trình đọc màn hình nhưng không bày thêm một dòng chữ. */}
            <h2 className="sr-only">Cuộn nhiệm vụ</h2>
            <Greeting now={board.now} todayCount={board.counts.today} doneToday={board.doneToday} />

            {/* R-21 — một khối UI duy nhất: hero con ếch hôm nay. Không thêm
                màn/navigation; nút focus đi qua handleFocusTask (R-20). */}
            <section className="frog-hero" aria-labelledby="frog-hero-title">
              <h3 id="frog-hero-title" className="frog-hero-title">
                Con ếch hôm nay
              </h3>
              {frogTask && !frogTask.archived && !frogDone ? (
                <>
                  <p className="frog-hero-task" data-frog-id={frogTask.id}>
                    {frogTask.title}
                  </p>
                  <Button
                    variant="primary"
                    className="frog-hero-focus"
                    aria-label={`Tập trung ếch hôm nay: ${frogTask.title}`}
                    onClick={() => handleFocusTask(frogTask.id)}
                  >
                    Tập trung 25 phút
                  </Button>
                </>
              ) : (
                <p
                  className="frog-hero-empty"
                  data-frog-state={frogTask?.archived ? 'cut' : frogTask ? 'done' : 'empty'}
                >
                  {frogTask?.archived
                    ? `Đã cắt · ${frogTask.title}`
                    : frogTask
                      ? `Đã xong · ${frogTask.title}`
                      : 'Chưa chọn ếch cho hôm nay. Chọn một việc trong sổ để bắt đầu.'}
                </p>
              )}
            </section>

            <CloudRule className="my-lg" />

            {/* R-24/R-25 — thời khoá biểu New Tab: tạo/sửa việc trực tiếp, archived ẩn ở lớp hiển thị. */}
            <Timeline
              tasks={board.tasks.filter((task) => !task.archived)}
              subjects={board.subjects}
              defaultSubjectId={subjectId === 'all' || subjectId === 'none' ? null : subjectId}
              keystoneCount={openKeystoneCount(board.tasks)}
              focusActive={focusActive}
              createSignal={createSignal}
              onSetTime={board.setTaskTime}
              onCreate={(draft) => board.createDraft(draft)}
              onUpdateTask={board.updateTask}
            />
            <div className="mt-lg">
              <FilterRow
                tab={tab}
                counts={board.counts}
                onTabChange={setTab}
                searchQuery={searchQuery}
                searchOpen={searchOpen}
                onSearchOpenChange={handleSearchOpen}
                onSearchChange={setSearchQuery}
                sortKey={sortKey}
                onSortChange={setSortKey}
                onlyKeystone={onlyKeystone}
                onOnlyKeystoneChange={setOnlyKeystone}
              />
            </div>
            {tab === 'today' && plannedToday.length > 0 && (
              <section
                className="mt-lg stack gap-xs"
                data-section="planned-today"
                aria-label="Đã hẹn hôm nay"
              >
                <h3 className="text-caption font-bold tracking-[0.4px] text-brown">
                  Đã hẹn hôm nay
                </h3>
                <ul className="stack gap-xs">
                  {plannedToday.map((task) => (
                    <li key={task.id} className="text-body-sm text-umber">
                      {task.title}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="mt-lg">
              <TaskScrollList
                tasks={board.tasks}
                subjects={board.subjects}
                tab={tab}
                subjectId={subjectId}
                searchQuery={searchQuery}
                sortKey={sortKey}
                now={board.now}
                loading={board.loading}
                freshId={board.freshId}
                quotaError={board.quotaError}
                onQuotaRetry={() => board.setQuotaError(null)}
                onToggle={handleToggle}
                onOpen={setDetailId}
                onFocusTask={handleFocusTask}
                activeTaskId={board.pomodoro.taskId}
                onlyKeystone={onlyKeystone}
                dayPlan={board.dayPlan}
                selectFrog={board.selectFrog}
              />
            </div>
          </main>

          <aside className="board-desk">
            <h2 className="region-title mb-base">Bàn học</h2>
            {focusActive ? (
              <FocusTimer
                api={board.pomodoro}
                preset={board.settings.pomodoroPreset}
                onPresetChange={(preset) => void board.updateSettings({ pomodoroPreset: preset })}
                overlay
                taskTitle={attached?.title ?? null}
                dangling={!attached}
                interruptions={board.pomodoro.interruptions}
                onDetach={() => setInterrupt({ kind: 'detach', id: '' })}
              />
            ) : (
              <FocusTimer
                api={board.pomodoro}
                preset={board.settings.pomodoroPreset}
                onPresetChange={(preset) => void board.updateSettings({ pomodoroPreset: preset })}
                taskTitle={attached?.title ?? null}
              />
            )}
            <div className="frog-summary" data-summary>
              <p className="frog-summary-line">
                Then chốt: {dailySummary.done}/{dailySummary.total} xong
              </p>
              <p className="frog-summary-line">
                Tuần này: then chốt {weekSummary.keystoneDone}/{weekSummary.keystoneTotal} ·{' '}
                {weekSummary.tasksDone} việc xong
              </p>
            </div>
            <div className="mt-lg">
              <StreakCard log={board.log} now={board.now} />
            </div>
            {!focusActive && (
              <div className="mt-lg">
                <HabitCard
                  tasks={board.tasks}
                  now={board.now}
                  onUnmark={handleHabitUnmark}
                />
              </div>
            )}
            <div className="board-maxim mt-lg">
              <MaximCard now={board.now} />
            </div>
          </aside>
        </div>

        <footer className="colophon mt-xl">
          <span>Học, nhớ, rồi lại học.</span>
          <button
            type="button"
            className="inline-flex min-h-6 items-center px-xs text-primary-deep underline decoration-dotted underline-offset-4"
            onClick={() => setSettingsOpen(true)}
          >
            Cài đặt
          </button>
        </footer>
      </div>

      {detailId && (
        <TaskParchment
          taskId={detailId}
          subjects={board.subjects}
          suspended={!!deleteId || dirtyConfirm}
          keystoneCount={openKeystoneCount(board.tasks, detailId)}
          withTime
          onClose={closeDetail}
          onDirtyChange={setDirty}
          onSave={() => {
            setDirty(false);
            setDetailId(null);
            board.setToast({ message: 'Đã lưu việc vào sổ.' });
          }}
          onDelete={() => setDeleteId(detailId)}
          onUpdateTask={board.updateTask}
          onQuotaError={(message) => board.setQuotaError(message)}
        />
      )}

      {planOpen && (
        <PlanTomorrowSheet
          open={planOpen}
          tasks={planCandidates}
          dayLabel={longDate(tomorrow)}
          onClose={() => setPlanOpen(false)}
          onSave={saveTomorrowPlan}
        />
      )}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Cài đặt">
        <SettingsPanel />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Xoá việc này?"
        description="Việc sẽ rời khỏi sổ. Con vẫn còn năm giây để hoàn tác sau khi xoá."
        confirmLabel="Xoá"
        cancelLabel="Giữ lại"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) void board.deleteTask(deleteId);
          setDeleteId(null);
          setDetailId(null);
        }}
      />

      <ConfirmDialog
        isOpen={dirtyConfirm}
        title="Bỏ thay đổi?"
        description="Con có thay đổi chưa lưu. Bỏ và quay lại danh sách nhé?"
        confirmLabel="Bỏ"
        cancelLabel="Ở lại"
        onCancel={() => setDirtyConfirm(false)}
        onConfirm={() => {
          setDirtyConfirm(false);
          setDirty(false);
          setDetailId(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!dropSubject}
        title="Bỏ môn này?"
        description={`Gáy sách "${dropSubject?.name ?? ''}" sẽ rời khỏi giá. Việc của môn đó vẫn còn, chỉ trở về ngăn chưa xếp môn.`}
        confirmLabel="Bỏ môn"
        cancelLabel="Giữ lại"
        danger
        onCancel={() => setDropSubject(null)}
        onConfirm={() => {
          if (dropSubject) void board.dropSubject(dropSubject.id);
          if (dropSubject && subjectId === dropSubject.id) setSubjectId('all');
          setDropSubject(null);
        }}
      />

      <FocusConfirms
        interrupt={interrupt}
        pendingCompletion={board.pendingCompletion}
        onCancelInterrupt={() => setInterrupt(null)}
        onConfirmInterrupt={handleInterrupt}
        onCancelCompletion={board.declineFocusCompletion}
        onConfirmCompletion={board.confirmFocusCompletion}
      />

      {/* Live region thường trú: toast mount kèm nội dung nên tự nó không được đọc */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {board.toast
          ? `${board.toast.message}${board.toast.detail ? ` ${board.toast.detail}` : ''}`
          : ''}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-lg z-[80] flex justify-center px-base">
        {board.toast && (
          <Toast
            isOpen
            message={board.toast.message}
            detail={board.toast.detail}
            actionLabel={board.toast.actionLabel}
            onAction={board.toast.onAction}
            onClose={() => board.setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
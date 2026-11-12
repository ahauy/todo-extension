/**
 * Bảng Học Đường toàn màn hình — Giá sách (240) · Cuộn nhiệm vụ (1fr) ·
 * Bàn học (320), tối đa 1280px căn giữa, khung đôi vàng kim và họa tiết sen
 * ở bốn góc. Dưới 1024px Giá sách thành dải ngang, dưới 720px còn một cột.
 *
 * Khi người dùng chọn chế độ Popup, trang tab mới không bày cả bảng: chỉ
 * hiện lời chào và một nút mở sổ (manifest không cho gỡ ghi đè tab mới lúc
 * chạy — phần Cài đặt nói rõ cách trả tab mới cho trình duyệt).
 */
import React, { useCallback, useEffect, useState } from 'react';
import Greeting from '../../components/Greeting';
import SubjectShelf from '../../components/SubjectShelf';
import Composer from '../../components/Composer';
import FilterRow from '../../components/FilterRow';
import TaskScrollList from '../../components/TaskScrollList';
import TaskParchment from '../../components/TaskParchment';
import SettingsPanel from '../../components/SettingsPanel';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import FocusTimer from '../../components/FocusTimer';
import StreakCard from '../../components/StreakCard';
import { MaximCard, Proclamation } from '../../components/Proclamation';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import { CornerFlourish, CloudRule } from '../../components/art/Ornaments';
import { GearIcon, SoundOffIcon, SoundOnIcon } from '../../components/art/Icons';
import { StudyWindow } from '../../components/art/Scenes';
import { useBoard } from '../../hooks/useBoard';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { greetingFor, longDate } from '../../lib/datetime';
import { rememberBoardTab } from '../../lib/storage/local';
import type { Subject } from '../../lib/tasks/types';
import type { BoardTab, SortKey } from '../../lib/tasks/query';
import type { TaskDraft } from '../../lib/tasks/form';
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
  const [tab, setTab] = useState<BoardTab>('all');
  const [subjectId, setSubjectId] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dropSubject, setDropSubject] = useState<Subject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dirtyConfirm, setDirtyConfirm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandSignal, setExpandSignal] = useState(0);
  const [bannerHidden, setBannerHidden] = useState(false);

  useEffect(() => {
    void chrome.tabs?.getCurrent?.((current) => {
      if (current?.id !== undefined) void rememberBoardTab(current.id);
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
        setExpandSignal((value) => value + 1);
      } else if (event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape' && searchOpen) {
        handleSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen, handleSearchOpen]);

  const openBoardTab = useCallback(() => {
    void chrome.tabs?.create?.({ url: chrome.runtime.getURL('newtab.html') });
  }, []);

  if (board.settings.displayMode === 'popup') {
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
      horizontal={!wide}
    />
  );

  const submit = (draft: TaskDraft) => void board.createDraft(draft);
  const attached = board.tasks.find((task) => task.id === board.pomodoro.taskId);

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

        {!wide && <div className="board-shelf-strip">{shelf}</div>}

        <div className="board-grid">
          {wide && <aside className="board-shelf">{shelf}</aside>}

          <main className="board-scroll">
            {/* Lời chào đã là tiêu đề thị giác của vùng này; giữ h2 cho cấu trúc
                tài liệu và trình đọc màn hình nhưng không bày thêm một dòng chữ. */}
            <h2 className="sr-only">Cuộn nhiệm vụ</h2>
            <Greeting now={board.now} todayCount={board.counts.today} doneToday={board.doneToday} />
            <CloudRule className="my-lg" />
            <Composer
              subjects={board.subjects}
              settings={board.settings}
              defaultSubjectId={subjectId === 'all' || subjectId === 'none' ? null : subjectId}
              expandSignal={expandSignal}
              large
              onSubmit={submit}
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
              />
            </div>
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
                onToggle={(id) => void board.toggleTask(id)}
                onOpen={setDetailId}
              />
            </div>
          </main>

          <aside className="board-desk">
            <h2 className="region-title mb-base">Bàn học</h2>
            <FocusTimer
              api={board.pomodoro}
              preset={board.settings.pomodoroPreset}
              onPresetChange={(preset) => void board.updateSettings({ pomodoroPreset: preset })}
              taskTitle={attached?.title ?? null}
            />
            <div className="mt-lg">
              <StreakCard log={board.log} now={board.now} />
            </div>
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
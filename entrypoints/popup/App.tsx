/**
 * Popup Học Đường — 360×560, một cột: đầu trang → ô bút lông → dải tab →
 * cuộn việc → chân trang cố định (đồng hồ thu gọn + bảy đài sen).
 * Sửa việc là tờ giấy da trượt từ dưới lên; Cài đặt thay chỗ vùng nội dung.
 * Phím: n về ô bút, / mở tìm, Escape đóng lớp trên cùng.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../components/Header';
import FilterRow from '../../components/FilterRow';
import Composer from '../../components/Composer';
import TaskScrollList from '../../components/TaskScrollList';
import TaskParchment from '../../components/TaskParchment';
import SettingsPanel from '../../components/SettingsPanel';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import FocusTimer from '../../components/FocusTimer';
import StreakCard from '../../components/StreakCard';
import { Proclamation } from '../../components/Proclamation';
import Button from '../../components/ui/Button';
import { ChevronLeftIcon } from '../../components/art/Icons';
import { useBoard } from '../../hooks/useBoard';
import type { BoardTab, SortKey } from '../../lib/tasks/query';
import type { TaskDraft } from '../../lib/tasks/form';
import './style.css';

export default function App() {
  const board = useBoard();
  const [view, setView] = useState<'list' | 'settings'>('list');
  const [tab, setTab] = useState<BoardTab>('all');
  const [subjectId, setSubjectId] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dirtyConfirm, setDirtyConfirm] = useState(false);
  const [expandSignal, setExpandSignal] = useState(0);
  const [bannerHidden, setBannerHidden] = useState(false);

  const closeDetail = useCallback(() => {
    if (dirty) {
      setDirtyConfirm(true);
      return;
    }
    setDetailId(null);
  }, [dirty]);

  const openBoard = useCallback(() => {
    void chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
    window.close();
  }, []);

  const handleSearchOpen = useCallback((open: boolean) => {
    setSearchOpen(open);
    if (!open) setSearchQuery('');
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Hộp thoại đang mở thì nhường phím cho nó — không giật focus ra sau lớp modal
      if (document.querySelector('[role="dialog"]')) return;
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (typing) return;
      if (event.key === 'n' && view === 'list') {
        event.preventDefault();
        setExpandSignal((value) => value + 1);
      } else if (event.key === '/' && view === 'list') {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape') {
        if (searchOpen) handleSearchOpen(false);
        else if (view === 'settings') setView('list');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, searchOpen, handleSearchOpen]);

  const submit = useCallback(
    (draft: TaskDraft) => {
      void board.createDraft(draft);
    },
    [board]
  );

  return (
    <div className="popup-shell frame-double">
      {view === 'list' ? (
        <>
          <Header
            activeCount={board.activeCount}
            overdueCount={board.overdue}
            soundEnabled={board.settings.soundEnabled}
            onToggleSound={board.toggleSound}
            onOpenBoard={openBoard}
            onSettings={() => {
              // Mở Cài đặt thì gỡ tờ giấy da đang mở — không để lớp cũ tràn sang view mới
              setDetailId(null);
              setDirty(false);
              setView('settings');
            }}
          />

          <div className="flex-none px-base pb-sm">
            <Composer
              subjects={board.subjects}
              settings={board.settings}
              defaultSubjectId={subjectId === 'all' || subjectId === 'none' ? null : subjectId}
              expandSignal={expandSignal}
              onSubmit={submit}
            />
          </div>

          <div className="flex-none px-base pb-sm">
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
              subjects={board.subjects}
              subjectId={subjectId}
              onSubjectChange={setSubjectId}
            />
          </div>

          {!bannerHidden && (
            <Proclamation
              todayCount={board.counts.today}
              overdue={board.overdue}
              compact
              onDismiss={() => setBannerHidden(true)}
            />
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-base py-base">
            <TaskScrollList
              tasks={board.tasks}
              subjects={board.subjects}
              tab={tab}
              subjectId={subjectId}
              searchQuery={searchQuery}
              sortKey={sortKey}
              now={board.now}
              loading={board.loading}
              compact
              freshId={board.freshId}
              quotaError={board.quotaError}
              onQuotaRetry={() => board.setQuotaError(null)}
              onToggle={(id) => void board.toggleTask(id)}
              onOpen={setDetailId}
            />
          </div>

          <footer className="popup-footer">
            <FocusTimer
              api={board.pomodoro}
              preset={board.settings.pomodoroPreset}
              onPresetChange={(preset) => void board.updateSettings({ pomodoroPreset: preset })}
              compact
            />
            <div className="ml-auto">
              <StreakCard
                log={board.log}
                now={board.now}
                compact
                phaseLabel={board.pomodoro.phase === 'focus' ? 'Giờ học' : 'Giờ nghỉ'}
              />
            </div>
          </footer>
        </>
      ) : (
        <>
          <header className="flex h-14 flex-none items-center gap-sm px-base">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              <ChevronLeftIcon size={14} />
              Về sổ
            </Button>
            <h1 className="ml-auto font-display text-heading-sm text-ink-deep">Cài đặt</h1>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-base pb-base">
            <SettingsPanel />
          </div>
        </>
      )}

      {detailId && (
        <TaskParchment
          taskId={detailId}
          subjects={board.subjects}
          sheet
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

      <ConfirmDialog
        isOpen={!!deleteId}
        sheet
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
        sheet
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

      {/* Live region thường trú: toast mount kèm nội dung nên tự nó không được đọc */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {board.toast
          ? `${board.toast.message}${board.toast.detail ? ` ${board.toast.detail}` : ''}`
          : ''}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex justify-center px-base">
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
/**
 * App shell (L6-T19). Popup 360×600 quản lý view state (list / detail / settings),
 * render Header + FilterBar + Composer + TaskList (S1) hoặc TaskDetail (S2) hoặc
 * Settings (S3), ConfirmDialog/Toast đè lên (S4).
 *
 * Điều hướng 1 cấp panel (không nested), Escape/back đóng panel theo thứ tự lớp
 * trên cùng. Keyboard map: n focus composer, / mở search, Escape đóng menu→search→panel,
 * row checkbox Space tick, title Enter/Space mở detail, detail Cmd/Ctrl+Enter lưu,
 * Escape back (confirm nếu dirty).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import FilterBar from '../../components/FilterBar';
import TaskComposer from '../../components/TaskComposer';
import TaskList from '../../components/TaskList';
import TaskDetail from '../../components/TaskDetail';
import Settings from '../../components/Settings';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../lib/tasks/types';
import './style.css';

type View = 'list' | 'detail' | 'settings';
type Tab = 'all' | 'active' | 'done';
type SortCriterion = 'default' | 'priority' | 'created';

const SORT_ORDER: SortCriterion[] = ['default', 'priority', 'created'];
const SORT_LABELS: Record<SortCriterion, string> = {
  default: 'Hạn chót',
  priority: 'Ưu tiên',
  created: 'Mới nhất',
};

export default function App() {
  const { tasks, create, update, remove, toggle, restore } = useTasks();
  const [view, setView] = useState<View>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>('default');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [composerExpandSignal, setComposerExpandSignal] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dirtyBackConfirm, setDirtyBackConfirm] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const availableTags = useMemo(
    () => [...new Set(tasks.flatMap((task) => task.tags))],
    [tasks]
  );

  const openDetail = useCallback((id: string) => {
    setDirty(false);
    setDetailId(id);
    setView('detail');
  }, []);

  const closeDetail = useCallback(() => {
    if (dirty) {
      setDirtyBackConfirm(true);
      return;
    }
    setView('list');
    setDetailId(null);
  }, [dirty]);

  const openSettings = useCallback(() => {
    setView('settings');
  }, []);

  const closeSettings = useCallback(() => {
    setView('list');
  }, []);

  const handleAdd = useCallback(
    async (submitted: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      await create(submitted);
      setView('list');
    },
    [create]
  );

  const handleSave = useCallback(() => {
    setDirty(false);
    setView('list');
    setDetailId(null);
    setToast({
      open: true,
      message: 'Đã lưu việc',
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const deleted = tasks.find((task) => task.id === id) ?? null;
      await remove(id);
      setView('list');
      setDetailId(null);
      setToast({
        open: true,
        message: 'Đã xoá việc',
        actionLabel: 'Hoàn tác',
        onAction: deleted ? () => void restore(deleted) : undefined,
      });
    },
    [remove, restore, tasks]
  );

  const handleQuotaError = useCallback((message: string) => {
    setQuotaError(message);
  }, []);

  const handleToggleDirty = useCallback((value: boolean) => {
    setDirty(value);
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  }, []);

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open);
    if (!open) setSearchQuery('');
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const handleHeaderSort = useCallback(() => {
    const next =
      SORT_ORDER[(SORT_ORDER.indexOf(sortCriterion) + 1) % SORT_ORDER.length];
    setSortCriterion(next);
    setToast({ open: true, message: `Sắp xếp: ${SORT_LABELS[next]}` });
  }, [sortCriterion]);

  // Keyboard map
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur();
        }
        return;
      }
      if (view === 'list') {
        if (e.key === 'n') {
          e.preventDefault();
          setComposerExpandSignal((signal) => signal + 1);
          return;
        }
        if (e.key === '/') {
          e.preventDefault();
          setSearchOpen(true);
          return;
        }
        if (e.key === 'Escape' && searchOpen) {
          e.preventDefault();
          handleSearchOpenChange(false);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (view === 'detail') {
          closeDetail();
        } else if (view === 'settings') {
          closeSettings();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [view, searchOpen, closeDetail, closeSettings, handleSearchOpenChange]);

  return (
    <div className="w-[360px] h-[600px] bg-bg text-fg font-sans text-body antialiased flex flex-col">
      {/* Header - luôn hiển thị trên list view */}
      {view === 'list' && (
        <Header
          activeCount={tasks.filter((t) => !t.done).length}
          overdueCount={tasks.filter(
            (t) => !t.done && !!t.dueAt && new Date(t.dueAt) < new Date()
          ).length}
          onSearch={() => setSearchOpen(true)}
          onSort={handleHeaderSort}
          onSettings={openSettings}
        />
      )}

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <>
            <FilterBar
              tab={tab}
              searchQuery={searchQuery}
              sortCriterion={sortCriterion}
              selectedTags={selectedTags}
              availableTags={availableTags}
              searchOpen={searchOpen}
              onSearchOpenChange={handleSearchOpenChange}
              onTabChange={setTab}
              onSearchChange={setSearchQuery}
              onSortChange={(criterion) =>
                setSortCriterion(criterion as SortCriterion)
              }
              onTagToggle={handleTagToggle}
            />
            <TaskComposer
              onSubmit={handleAdd}
              expandSignal={composerExpandSignal}
            />
            <TaskList
              tasks={tasks}
              tab={tab}
              searchQuery={searchQuery}
              sortCriterion={sortCriterion}
              selectedTags={selectedTags}
              onToggle={toggle}
              onOpenDetail={openDetail}
              onQuotaRetry={() => {}}
              quotaError={quotaError}
            />
          </>
        )}
        {view === 'detail' && detailId && (
          <TaskDetail
            taskId={detailId}
            onSave={handleSave}
            onDelete={() => setDeleteConfirmId(detailId)}
            onBack={closeDetail}
            onUpdateTask={update}
            onQuotaError={handleQuotaError}
            onDirtyChange={handleToggleDirty}
          />
        )}
        {view === 'settings' && (
          <Settings onBack={closeSettings} />
        )}
      </div>

      {/* ConfirmDialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          title="Xoá việc này?"
          description="Việc sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
          confirmLabel="Xoá"
          cancelLabel="Giữ lại"
          danger
          onConfirm={() => {
            handleDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
      {dirtyBackConfirm && (
        <ConfirmDialog
          isOpen={dirtyBackConfirm}
          title="Bỏ thay đổi?"
          description="Bạn có thay đổi chưa lưu. Bỏ và quay lại danh sách?"
          confirmLabel="Bỏ"
          cancelLabel="Giữ lại"
          onConfirm={() => {
            setDirtyBackConfirm(false);
            setDirty(false);
            setView('list');
            setDetailId(null);
          }}
          onCancel={() => setDirtyBackConfirm(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          isOpen={toast.open}
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

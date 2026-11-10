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
import React, { useCallback, useEffect, useState } from 'react';
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

export default function App() {
  const { tasks, add, update, remove, toggle } = useTasks();
  const [view, setView] = useState<View>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCriterion, setSortCriterion] = useState<'default'>('default');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

  const openDetail = useCallback((id: string) => {
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
      const task: Task = {
        id: crypto.randomUUID(),
        ...submitted,
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await add(task.title);
      setView('list');
    },
    [add]
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

  const handleDelete = useCallback(async (id: string) => {
    await remove(id);
    setView('list');
    setDetailId(null);
    setToast({
      open: true,
      message: 'Đã xoá việc',
      actionLabel: 'Hoàn tác',
    });
  }, [remove]);

  const handleQuotaError = useCallback((message: string) => {
    setQuotaError(message);
  }, []);

  const handleToggleDirty = useCallback((value: boolean) => {
    setDirty(value);
  }, []);

  // Keyboard map
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur();
        }
        return;
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
  }, [view, closeDetail, closeSettings]);

  return (
    <div className="w-[360px] h-[600px] bg-bg text-fg font-sans text-body antialiased flex flex-col">
      {/* Header - luôn hiển thị trên list view */}
      {view === 'list' && (
        <Header
          activeCount={tasks.filter((t) => !t.done).length}
          overdueCount={tasks.filter(
            (t) => !t.done && !!t.dueAt && new Date(t.dueAt) < new Date()
          ).length}
          onSearch={() => {}}
          onSort={() => {}}
          onSettings={openSettings}
        />
      )}

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <>
            <FilterBar
              tab="all"
              searchQuery={searchQuery}
              sortCriterion={sortCriterion}
              selectedTags={selectedTags}
            />
            <TaskComposer onSubmit={handleAdd} />
            <TaskList
              tasks={tasks}
              tab="all"
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
            onQuotaError={handleQuotaError}
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
        />
      )}
    </div>
  );
}

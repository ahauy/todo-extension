/**
 * TaskList + FilterBar (L4-T13). S1 danh sách chính.
 * Sort theo R-15, empty states 5 biến thể, skeleton 4 row, quota banner.
 */
import React, { useCallback, useMemo, useState } from 'react';
import Button from './ui/Button';
import TaskItem from './TaskItem';
import Divider from './ui/Divider';
import type { Task } from './lib/tasks/types';
import FilterBar from './FilterBar';

interface TaskListProps {
  tasks: Task[];
  tab: 'all' | 'active' | 'done';
  searchQuery: string;
  sortCriterion: 'default';
  selectedTags: string[];
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onQuotaRetry?: () => void;
  quotaError?: string | null;
}

export default function TaskList({
  tasks,
  tab,
  searchQuery,
  sortCriterion,
  selectedTags,
  onToggle,
  onOpenDetail,
  onQuotaRetry,
  quotaError,
}: TaskListProps) {
  const now = new Date();

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (tab === 'active') return !t.done;
      if (tab === 'done') return t.done;
      return true;
    });
  }, [tasks, tab]);

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.trim().toLowerCase();
    return filtered.filter(
      (t) =>
        `${t.title} ${t.note} ${t.tags.join(' ')}`.toLowerCase().includes(q)
    );
  }, [filtered, searchQuery]);

  const tagged = useMemo(() => {
    if (selectedTags.length === 0) return searched;
    return searched.filter((t) =>
      selectedTags.some((tag) => t.tags.includes(tag))
    );
  }, [searched, selectedTags]);

  const sorted = useMemo(() => {
    return [...tagged].sort((a, b) => {
      const aOverdue = !!a.dueAt && !a.done && new Date(a.dueAt) < now;
      const bOverdue = !!b.dueAt && !b.done && new Date(b.dueAt) < now;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const aHasDue = !!a.dueAt;
      const bHasDue = !!b.dueAt;
      if (aHasDue && !bHasDue) return -1;
      if (!aHasDue && bHasDue) return 1;
      if (aHasDue && bHasDue && a.dueAt && b.dueAt) {
        const ad = new Date(a.dueAt).getTime();
        const bd = new Date(b.dueAt).getTime();
        if (ad !== bd) return ad - bd;
      }

      const rank = (p: Task['priority']) =>
        p === 'high' ? 2 : p === 'medium' ? 1 : 0;
      if (rank(a.priority) !== rank(b.priority))
        return rank(b.priority) - rank(a.priority);

      const ca = new Date(a.createdAt).getTime();
      const cb = new Date(b.createdAt).getTime();
      return cb - ca;
    });
  }, [tagged, now, tab]);

  const isEmpty = sorted.length === 0;

  let emptyVariant:
    | 'none'
    | 'noTasks'
    | 'activeEmpty'
    | 'doneEmpty'
    | 'noSearch'
    | 'noTag' = 'none';
  if (isEmpty) {
    if (tab === 'done') emptyVariant = 'doneEmpty';
    else if (searchQuery.trim()) emptyVariant = 'noSearch';
    else if (selectedTags.length > 0) emptyVariant = 'noTag';
    else if (tab === 'active') emptyVariant = 'activeEmpty';
    else emptyVariant = 'noTasks';
  }

  return (
    <div className="mx-3 rounded-container border border-border bg-surface shadow-e1">
      {quotaError && (
        <div className="mx-3 p-3 rounded-container bg-overdue-soft border border-danger-border text-fg text-body">
          <div className="flex items-start gap-2">
            <span className="text-danger">⚠</span>
            <div>
              <div className="text-body font-medium">{quotaError}</div>
              <div className="flex gap-2 mt-1">
                <Button variant="ghost" onClick={onQuotaRetry}>
                  Thử lại
                </Button>
                <Button variant="ghost" onClick={() => {}}>
                  Ẩn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 py-2 space-y-1">
        <FilterBar
          tab={tab}
          searchQuery={searchQuery}
          sortCriterion={sortCriterion}
          selectedTags={selectedTags}
        />

        {isEmpty && quotaError === null && (
          <div className="opacity-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[56px] rounded-control bg-skeleton mb-1" />
            ))}
          </div>
        )}

        {isEmpty && quotaError === null && (
          <div className="px-3 py-8 text-center">
            <div className="text-meta text-fg-muted">
              {emptyVariant === 'noTasks'
                ? 'Chưa có việc nào.'
                : emptyVariant === 'activeEmpty'
                  ? 'Không có việc đang làm.'
                  : emptyVariant === 'doneEmpty'
                    ? 'Không có việc đã xong.'
                    : emptyVariant === 'noSearch'
                      ? 'Không tìm thấy việc nào.'
                      : 'Không có việc nào có thẻ này.'}
            </div>
          </div>
        )}

        {!isEmpty && (
          <div role="list" className="divide-y divide-border-subtle">
            {sorted.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

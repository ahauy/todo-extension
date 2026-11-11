/**
 * Cuộn nhiệm vụ: lọc theo dải tab + gáy sách + ô tìm, sắp xếp, rồi bày các
 * cuộn thư. Đang tải thì hiện bốn cuộn chờ; trống thì nói rõ lý do.
 */
import React, { useMemo } from 'react';
import TaskScroll from './TaskScroll';
import EmptyState, { type EmptyReason } from './EmptyState';
import Button from './ui/Button';
import {
  filterByBoard,
  filterBySubject,
  searchTasks,
  sortBoard,
  type BoardTab,
  type SortKey,
} from '../lib/tasks/query';
import { findSubject } from '../lib/subjects';
import type { Subject, Task } from '../lib/tasks/types';

interface TaskScrollListProps {
  tasks: Task[];
  subjects: Subject[];
  tab: BoardTab;
  subjectId: string;
  searchQuery: string;
  sortKey: SortKey;
  now: Date;
  loading?: boolean;
  compact?: boolean;
  freshId?: string | null;
  quotaError?: string | null;
  onQuotaRetry?: () => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}

function reasonFor(tab: BoardTab, search: string, subjectId: string, total: number): EmptyReason {
  if (search.trim()) return 'search';
  if (subjectId !== 'all') return 'subject';
  if (total === 0) return 'fresh';
  if (tab === 'today') return 'today';
  if (tab === 'upcoming') return 'upcoming';
  if (tab === 'done') return 'done';
  return 'fresh';
}

export default function TaskScrollList({
  tasks,
  subjects,
  tab,
  subjectId,
  searchQuery,
  sortKey,
  now,
  loading = false,
  compact = false,
  freshId = null,
  quotaError = null,
  onQuotaRetry,
  onToggle,
  onOpen,
}: TaskScrollListProps) {
  const visible = useMemo(() => {
    const byTab = filterByBoard(tasks, tab, now);
    const bySubject = filterBySubject(byTab, subjectId);
    const bySearch = searchTasks(bySubject, searchQuery);
    return sortBoard(bySearch, sortKey, now);
  }, [tasks, tab, subjectId, searchQuery, sortKey, now]);

  if (quotaError) {
    return (
      <div className="scroll-task" data-state="overdue" role="alert">
        <p className="text-body-md font-bold text-primary-deep">{quotaError}</p>
        <p className="mt-xs text-body-sm text-brown">
          Bộ nhớ đồng bộ của trình duyệt đã đầy. Xoá bớt việc cũ rồi thử lại.
        </p>
        <div className="mt-md flex gap-sm">
          <Button variant="secondary" size="sm" onClick={onQuotaRetry}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stack gap-md" aria-busy="true" aria-label="Đang mở sổ">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="skeleton-scroll" style={{ opacity: 1 - index * 0.18 }} />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        reason={reasonFor(tab, searchQuery, subjectId, tasks.length)}
        compact={compact}
      />
    );
  }

  return (
    <div role="list" className={`stack ${compact ? 'gap-md' : 'gap-lg'}`}>
      {visible.map((task) => (
        <TaskScroll
          key={task.id}
          task={task}
          subject={findSubject(subjects, task.subjectId)}
          now={now}
          compact={compact}
          fresh={task.id === freshId}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
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
  filterByKeystone,
  filterBySubject,
  searchTasks,
  sortBoard,
  type BoardTab,
  type SortKey,
} from '../lib/tasks/query';
import { findSubject } from '../lib/subjects';
import type { DayPlan, Subject, Task } from '../lib/tasks/types';

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
  /** R-20: truyền xuống TaskScroll; không truyền = giữ DOM cũ (0 regression). */
  onFocusTask?: (id: string) => void;
  activeTaskId?: string | null;
  /** R-21 — chip "20%": lọc keystone trên nền tab/subject/search, trước sort. */
  onlyKeystone?: boolean;
  dayPlan?: DayPlan;
  selectFrog?: (dayKey: string, taskId: string | null) => void;
}

function reasonFor(
  tab: BoardTab,
  search: string,
  subjectId: string,
  total: number,
  onlyKeystone = false
): EmptyReason {
  if (search.trim()) return 'search';
  if (subjectId !== 'all') return 'subject';
  if (onlyKeystone) return 'keystone';
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
  onFocusTask,
  activeTaskId,
  onlyKeystone = false,
  dayPlan,
  selectFrog,
}: TaskScrollListProps) {
  const visible = useMemo(() => {
    const byTab = filterByBoard(tasks, tab, now);
    const bySubject = filterBySubject(byTab, subjectId);
    const bySearch = searchTasks(bySubject, searchQuery);
    // R-21 — chip xếp SAU tab/subject/search và TRƯỚC sort (R-15 không đổi).
    const byKeystone = onlyKeystone ? filterByKeystone(bySearch) : bySearch;
    return sortBoard(byKeystone, sortKey, now);
  }, [tasks, tab, subjectId, searchQuery, onlyKeystone, sortKey, now]);

  if (quotaError) {
    return (
      <div className="scroll-task" data-state="overdue" role="alert">
        <p className="text-body-md font-bold text-primary-deep">{quotaError}</p>
        <p className="mt-xs text-body-sm text-brown">
          Bộ nhớ đồng bộ của trình duyệt đã đầy. Việc mới hoặc bản sửa này chưa được lưu — hãy
          nhập lại sau khi xoá bớt việc cũ.
        </p>
        <div className="mt-md flex gap-sm">
          {/* D-01: acknowledgment, không phải retry — payload thất bại đã bị bỏ (R-16). */}
          <Button variant="secondary" size="sm" onClick={onQuotaRetry}>
            Đã hiểu
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stack gap-md" role="status" aria-busy="true">
        <span className="sr-only">Đang mở sổ…</span>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="skeleton-scroll" style={{ opacity: 1 - index * 0.18 }} />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div role="status" aria-live="polite">
        <EmptyState
          reason={reasonFor(tab, searchQuery, subjectId, tasks.length, onlyKeystone)}
          compact={compact}
        />
      </div>
    );
  }

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {`Đang bày ${visible.length} việc.`}
      </p>
      <div role="list" className={`stack ${compact ? 'gap-md' : 'gap-base'}`}>
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
            onFocusTask={onFocusTask}
            activeTaskId={activeTaskId}
            dayPlan={dayPlan}
            selectFrog={selectFrog}
          />
        ))}
      </div>
    </>
  );
}
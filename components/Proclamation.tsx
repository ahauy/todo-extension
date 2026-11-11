/**
 * Châm ngôn trong ngày và dải chiếu chỉ. Chiếu chỉ chỉ hiện khi thật sự có
 * việc đang chờ — không chiếm chỗ khi sổ đang thảnh thơi.
 */
import React from 'react';
import { CloseIcon } from './art/Icons';
import { maximFor } from '../lib/maxims';

export function MaximCard({ now }: { now: Date }) {
  const maxim = maximFor(now);
  return (
    <section className="maxim-card" aria-label="Châm ngôn hôm nay">
      <blockquote className="maxim-quote">“{maxim.quote}”</blockquote>
      <p className="mt-sm text-caption text-umber">— {maxim.source}</p>
    </section>
  );
}

export function Proclamation({
  todayCount,
  overdue,
  onDismiss,
  compact = false,
}: {
  todayCount: number;
  overdue: number;
  onDismiss: () => void;
  /** Bản Popup: copy ngắn gọn, luôn vừa một dòng */
  compact?: boolean;
}) {
  if (todayCount === 0) return null;
  const text = compact
    ? overdue > 0
      ? `${todayCount} việc hôm nay · ${overdue} quá hạn`
      : `${todayCount} việc cần làm hôm nay`
    : overdue > 0
      ? `Còn ${todayCount} việc đang chờ con hôm nay, trong đó ${overdue} việc đã quá hạn.`
      : `Còn ${todayCount} việc đang chờ con hôm nay.`;
  return (
    <div role="status" className={compact ? 'proclamation proclamation-compact' : 'proclamation'}>
      <span className="min-w-0 flex-1">{text}</span>
      <button type="button" onClick={onDismiss} aria-label="Ẩn nhắc nhở">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
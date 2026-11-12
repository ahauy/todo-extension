/**
 * Chip hạn chót và huy hiệu ưu tiên / môn học. Mọi tín hiệu màu đều kèm chữ —
 * không bao giờ chỉ dựa vào màu để nói "cao", "quá hạn" hay "sắp đến hạn".
 */
import React from 'react';
import { HourglassIcon, RepeatIcon } from '../art/Icons';
import { deadlineText } from '../../lib/datetime';
import { spineWash } from '../../lib/subjects';
import type { Priority, Subject } from '../../lib/tasks/types';

export function DeadlineChip({
  dueAt,
  now,
  done,
  recurring = false,
}: {
  dueAt: string;
  now: Date;
  done: boolean;
  recurring?: boolean;
}) {
  const { label, tone } = deadlineText(dueAt, now, done);
  const toneClass = tone === 'overdue' ? 'chip-overdue' : tone === 'soon' ? 'chip-soon' : '';
  return (
    <time dateTime={dueAt} className={`chip ${toneClass}`}>
      {recurring ? <RepeatIcon size={12} /> : <HourglassIcon size={12} />}
      {label}
    </time>
  );
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'Cao',
  medium: 'Vừa',
  low: 'Thấp',
};

const PRIORITY_CLASS: Record<Priority, string> = {
  high: 'badge-high',
  medium: 'badge-mid',
  low: 'badge-low',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${PRIORITY_CLASS[priority]}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function SubjectBadge({ subject }: { subject: Subject | null }) {
  if (!subject) {
    return <span className="badge badge-subject">Chưa xếp môn</span>;
  }
  return (
    <span
      className="badge badge-subject"
      style={{ ['--spine-wash' as string]: spineWash(subject.order) }}
    >
      {subject.name}
    </span>
  );
}
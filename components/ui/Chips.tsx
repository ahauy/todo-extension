/**
 * Chip hạn chót và huy hiệu ưu tiên / môn học. Mọi tín hiệu màu đều kèm chữ —
 * không bao giờ chỉ dựa vào màu để nói mức ưu tiên, "quá hạn" hay "sắp đến hạn".
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

/** R-05 — 4 mức Eisenhower; chữ đầy đủ là tín hiệu a11y, màu chỉ để phân biệt. */
const PRIORITY_LABEL: Record<Priority, string> = {
  'important-urgent': 'Quan trọng, cấp bách',
  'important-not-urgent': 'Quan trọng, không cấp bách',
  'not-important-urgent': 'Không quan trọng, cấp bách',
  'not-important-not-urgent': 'Không quan trọng, không cấp bách',
};

/** Class TĨNH để CSS/scan không mất màu — không ghép tên class từ giá trị priority. */
const PRIORITY_CLASS: Record<Priority, string> = {
  'important-urgent': 'badge-q1',
  'important-not-urgent': 'badge-q2',
  'not-important-urgent': 'badge-q3',
  'not-important-not-urgent': 'badge-q4',
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
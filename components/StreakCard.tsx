/**
 * Chuỗi ngày học: bảy ô đài sen, ngày đã học sáng vàng lá. Ô không tương
 * tác nên giữ 28px; nhãn ngày nằm dưới để đọc được bằng chữ chứ không bằng màu.
 */
import React from 'react';
import { Lotus, SealFrame } from './art/Ornaments';
import { lastSevenDays, streakLength } from '../hooks/useStudyLog';
import type { StudyLog } from '../lib/tasks/types';

export default function StreakCard({
  log,
  now,
  compact = false,
  phaseLabel,
}: {
  log: StudyLog;
  now: Date;
  compact?: boolean;
  phaseLabel?: string;
}) {
  const cells = lastSevenDays(log, now);
  const streak = streakLength(log, now);

  if (compact) {
    return (
      <div className="stack items-end gap-xxs" aria-label={`Chuỗi ${streak} ngày học`}>
        <span className="text-caption text-umber">
          {phaseLabel ? `${phaseLabel} · chuỗi ${streak} ngày` : `Chuỗi ${streak} ngày`}
        </span>
        <div className="streak-compact">
          {cells.map((cell) => (
            <span
              key={cell.key}
              className="streak-lotus"
              data-lit={cell.lit}
              data-today={cell.today}
              title={`${cell.weekday}${cell.lit ? ' — đã học' : ' — chưa học'}`}
            >
              <Lotus size={12} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="streak-card" aria-label="Chuỗi ngày học">
      <div className="mb-md flex items-center gap-md">
        <h2 className="text-heading-sm text-ink-deep">Chuỗi {streak} ngày</h2>
        {streak >= 7 && <SealFrame label="BỀN CHÍ" size="sm" />}
      </div>
      <div className="streak-row">
        {cells.map((cell) => (
          <div key={cell.key} className="stack flex-1 items-center gap-xxs">
            <span className="streak-lotus" data-lit={cell.lit} data-today={cell.today}>
              <Lotus size={15} />
            </span>
            <span className="text-caption text-umber">{cell.weekday}</span>
          </div>
        ))}
      </div>
      <p className="mt-md text-body-sm text-umber">
        {streak === 0
          ? 'Đóng một dấu son hôm nay là đài sen đầu tiên sáng lên.'
          : 'Mỗi ngày đóng một dấu son là một đài sen sáng đèn.'}
      </p>
    </section>
  );
}
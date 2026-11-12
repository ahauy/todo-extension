/**
 * Lời chào đầu bảng New Tab: chữ cái đầu trang trí kiểu bản thảo, câu phụ nói
 * sổ đang có gì, và ô cửa sổ vòm nhìn ra trời theo buổi trong ngày.
 */
import React from 'react';
import { StudyWindow } from './art/Scenes';
import { greetingFor, longDate } from '../lib/datetime';

interface GreetingProps {
  now: Date;
  todayCount: number;
  doneToday: number;
}

export default function Greeting({ now, todayCount, doneToday }: GreetingProps) {
  const { title, part } = greetingFor(now);
  const initial = title.charAt(0).toUpperCase();
  const rest = title.slice(1);

  const subtitle =
    todayCount === 0
      ? `Hôm nay sổ chưa có việc đến hạn${doneToday > 0 ? `, con đã đóng ${doneToday} dấu son` : ''}.`
      : `Hôm nay có ${todayCount} việc cần ghi nhớ${doneToday > 0 ? `, đã đóng ${doneToday} dấu son` : ''}.`;

  return (
    <header className="flex items-start gap-lg">
      <div className="min-w-0 flex-1">
        <h1 className="greeting-title">
          <span className="drop-cap" aria-hidden="true">
            {initial}
          </span>
          <span className="sr-only">{initial}</span>
          {rest}
        </h1>
        <p className="mt-sm text-subtitle text-brown">{subtitle}</p>
        <p className="mt-xs text-caption text-umber">{longDate(now)}</p>
      </div>
      <div className="arch hidden w-[168px] flex-none lg:block">
        <StudyWindow part={part} className="block w-full" />
      </div>
    </header>
  );
}
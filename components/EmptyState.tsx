/**
 * Trạng thái rỗng: cuộn thư trắng trong khung vòm, một câu mời gọi, và mũi
 * tên nhẹ trỏ về ô nhập. Mỗi biến thể nói đúng lý do danh sách đang trống.
 */
import React from 'react';
import { BlankScroll } from './art/Scenes';

export type EmptyReason = 'fresh' | 'today' | 'upcoming' | 'done' | 'search' | 'subject';

const COPY: Record<EmptyReason, string> = {
  fresh: 'Chưa có điều gì cần ghi. Hãy cầm bút lên.',
  today: 'Hôm nay chưa có việc nào đến hạn. Con có thể học trước một chút.',
  upcoming: 'Chưa có việc nào hẹn ngày sau. Sổ đang thảnh thơi.',
  done: 'Chưa đóng được dấu son nào. Bắt đầu từ một việc nhỏ thôi.',
  search: 'Không tìm thấy việc nào khớp. Thử chữ khác ngắn hơn xem sao.',
  subject: 'Gáy sách này còn trắng. Ghi việc đầu tiên cho môn này nhé.',
};

export default function EmptyState({
  reason,
  compact = false,
}: {
  reason: EmptyReason;
  compact?: boolean;
}) {
  return (
    <div className="empty-state">
      <div className="arch" style={{ width: compact ? 132 : 180 }}>
        <BlankScroll className="block w-full" />
      </div>
      <p>{COPY[reason]}</p>
      <svg
        width="20"
        height="34"
        viewBox="0 0 20 34"
        fill="none"
        stroke="var(--sepia)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 32V6" />
        <path d="M3.5 12.5 10 5.5l6.5 7" />
      </svg>
    </div>
  );
}
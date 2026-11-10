/**
 * Header (L4-T14). Cao 52px: tiêu đề + dòng đếm (aria-live polite), 3 action button.
 * Không logo/avatar/badge.
 */
import React from 'react';
import IconButton from './ui/IconButton';

interface HeaderProps {
  activeCount: number;
  overdueCount: number;
  onSearch: () => void;
  onSort: () => void;
  onSettings: () => void;
}

export default function Header({
  activeCount,
  overdueCount,
  onSearch,
  onSort,
  onSettings,
}: HeaderProps) {
  const hasOverdue = overdueCount > 0;
  const countText =
    activeCount === 0 && overdueCount === 0
      ? 'Không còn việc đang làm.'
      : `${activeCount} đang làm${hasOverdue ? `, ${overdueCount} quá hạn` : ''}.`;

  return (
    <header className="h-[52px] px-3 flex items-center justify-between bg-bg">
      <div className="flex-1 min-w-0">
        <div className="text-title font-medium text-fg">Việc</div>
        <div className="text-meta text-fg-muted">{countText}</div>
        <span className="sr-only" aria-live="polite">
          {countText}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <IconButton
          aria-label="Tìm việc"
          title="Tìm việc"
          icon="🔍"
          onClick={onSearch}
        />
        <IconButton
          aria-label="Sắp xếp"
          title="Sắp xếp"
          icon="↕"
          onClick={onSort}
        />
        <IconButton
          aria-label="Cài đặt"
          title="Cài đặt"
          icon="⚙"
          onClick={onSettings}
        />
      </div>
    </header>
  );
}

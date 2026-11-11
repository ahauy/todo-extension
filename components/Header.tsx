/**
 * Đầu trang Popup, cao 56px: tên sổ, dòng đếm đọc được bằng aria-live, và ba
 * nút tròn — chuông, mở bảng lớn, cài đặt. Không có menu hamburger.
 */
import React from 'react';
import IconButton from './ui/IconButton';
import { BoardIcon, GearIcon, LampIcon, SoundOffIcon, SoundOnIcon } from './art/Icons';

interface HeaderProps {
  activeCount: number;
  overdueCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenBoard: () => void;
  onSettings: () => void;
}

export default function Header({
  activeCount,
  overdueCount,
  soundEnabled,
  onToggleSound,
  onOpenBoard,
  onSettings,
}: HeaderProps) {
  const countText =
    activeCount === 0
      ? 'Sổ đang thảnh thơi.'
      : `${activeCount} việc đang chờ${overdueCount > 0 ? `, ${overdueCount} quá hạn` : ''}.`;

  return (
    <header className="flex h-14 flex-none items-center gap-sm px-base">
      <span className="grid size-9 flex-none place-items-center rounded-full bg-primary text-on-primary">
        <LampIcon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-heading-sm leading-none text-ink-deep">Học Đường</h1>
        <p className="mt-xxs truncate text-caption text-umber" aria-live="polite">
          {countText}
        </p>
      </div>
      <div className="flex flex-none items-center gap-xs">
        <IconButton
          aria-label={soundEnabled ? 'Tắt chuông và tiếng giấy' : 'Bật chuông và tiếng giấy'}
          title={soundEnabled ? 'Đang có tiếng — bấm để tắt' : 'Đang im lặng — bấm để bật'}
          active={soundEnabled}
          icon={soundEnabled ? <SoundOnIcon size={17} /> : <SoundOffIcon size={17} />}
          onClick={onToggleSound}
        />
        <IconButton
          aria-label="Mở bảng Học Đường ở tab mới"
          title="Mở bảng lớn"
          icon={<BoardIcon size={17} />}
          onClick={onOpenBoard}
        />
        <IconButton
          aria-label="Cài đặt"
          title="Cài đặt"
          icon={<GearIcon size={17} />}
          onClick={onSettings}
        />
      </div>
    </header>
  );
}
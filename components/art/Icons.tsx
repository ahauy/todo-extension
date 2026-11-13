/**
 * Bộ icon nét của Học Đường: dày 1.5px, đầu nét tròn, màu nâu sơn.
 * Vẽ tay để cùng một ngôn ngữ nét với bút lông và họa tiết sen — không dùng
 * emoji hay glyph Unicode thay icon.
 */
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function make(
  path: React.ReactNode,
  viewBox = '0 0 24 24'
): React.FC<IconProps> {
  const Component: React.FC<IconProps> = ({
    size = 20,
    className,
    strokeWidth = 1.5,
  }) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
  return Component;
}

/** Con dấu mộc — affordance cho nút đóng dấu khi việc chưa xong: cán mộc +
 *  đế dấu, để vòng tròn không còn bị đọc như họa tiết trang trí. */
export const SealIcon = make(
  <>
    <path d="M12 3.6a2.3 2.3 0 0 1 2.3 2.3c0 1.5-.9 2.4-.9 3.6h-2.8c0-1.2-.9-2.1-.9-3.6A2.3 2.3 0 0 1 12 3.6Z" />
    <path d="M8.4 9.5h7.2l1 3.4H7.4l1-3.4Z" />
    <path d="M6.4 16.4h11.2v2.2H6.4z" />
    <path d="M9 19.8h6" opacity="0.55" />
  </>
);

/** Kính lúp — cán nghiêng, vòng thấu kính lệch tâm như ống kính đồng */
export const SearchIcon = make(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.4 15.4 L21 21" />
    <path d="M8 8.4a3.6 3.6 0 0 1 2.6-1.6" opacity="0.55" />
  </>
);

/** Sắp xếp — hai mũi tên lên xuống trên một trục */
export const SortIcon = make(
  <>
    <path d="M7 4v16M7 4 4 7.4M7 4l3 3.4" />
    <path d="M17 20V4M17 20l-3-3.4M17 20l3-3.4" />
  </>
);

/** Bánh răng — nút Cài đặt. Bản cũ vẽ vòng tròn + 8 tia nên bị đọc thành
 *  "mặt trời / đổi sáng tối"; bản này là vành răng có lỗ giữa. */
export const GearIcon = make(
  <>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
);

export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />);

export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);

export const ChevronLeftIcon = make(<path d="M15 5l-7 7 7 7" />);

export const ChevronRightIcon = make(<path d="M9 5l7 7-7 7" />);

export const ChevronDownIcon = make(<path d="M5 9l7 7 7-7" />);

export const PlayIcon = make(<path d="M8 5.5l11 6.5-11 6.5z" />);

export const PauseIcon = make(<path d="M9 5v14M15 5v14" strokeWidth={2} />);

export const SkipIcon = make(
  <>
    <path d="M6 5.5l9 6.5-9 6.5z" />
    <path d="M18 5v14" />
  </>
);

/** Thùng rác — nắp có quai, thân ba vạch */
export const TrashIcon = make(
  <>
    <path d="M4.5 7h15" />
    <path d="M9.5 7V4.8h5V7" />
    <path d="M6.5 7l1 12.2h9L17.5 7" />
    <path d="M10.2 10.5v5.6M13.8 10.5v5.6" opacity="0.6" />
  </>
);

/** Chuông đồng — có lưỡi chuông và vành */
export const BellIcon = make(
  <>
    <path d="M6 17.2c1.4-1.5 1.8-3.2 1.8-5.4 0-2.6 1.7-4.6 4.2-4.6s4.2 2 4.2 4.6c0 2.2.4 3.9 1.8 5.4z" />
    <path d="M4.6 17.2h14.8" />
    <path d="M12 7.2V4.6" />
    <path d="M10.4 20a1.7 1.7 0 0 0 3.2 0" />
  </>
);

export const CheckIcon = make(<path d="M4.5 12.5l5 5 10-11" strokeWidth={2} />);

/** Đồng hồ cát cho hạn chót */
export const HourglassIcon = make(
  <>
    <path d="M7 3.5h10M7 20.5h10" />
    <path d="M8 3.5c0 4 4 5.6 4 8.5s-4 4.5-4 8.5" />
    <path d="M16 3.5c0 4-4 5.6-4 8.5s4 4.5 4 8.5" />
  </>
);

/** Mũi tên vòng — lặp lại */
export const RepeatIcon = make(
  <>
    <path d="M4.5 11a7.5 7.5 0 0 1 12.8-5.3L20 8" />
    <path d="M20 4.2V8h-3.8" />
    <path d="M19.5 13a7.5 7.5 0 0 1-12.8 5.3L4 16" />
    <path d="M4 19.8V16h3.8" />
  </>
);

/** Gáy sách đứng — dùng cho nhãn môn và nút thêm môn */
export const BookIcon = make(
  <>
    <path d="M5 4.5h5.5a2 2 0 0 1 2 2v13a1.6 1.6 0 0 0-1.6-1.6H5z" />
    <path d="M19 4.5h-5.5a2 2 0 0 0-2 2v13a1.6 1.6 0 0 1 1.6-1.6H19z" />
  </>
);

export const SoundOnIcon = make(
  <>
    <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
    <path d="M15 9a4 4 0 0 1 0 6" />
    <path d="M17.6 6.6a7.5 7.5 0 0 1 0 10.8" opacity="0.6" />
  </>
);

export const SoundOffIcon = make(
  <>
    <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
    <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
  </>
);

/** Ô cửa sổ vòm có nan — mở bảng lớn ở tab mới */
export const BoardIcon = make(
  <>
    <path d="M4 20.5V11a8 8 0 0 1 16 0v9.5z" />
    <path d="M12 3.2v17.3M4 13h16" />
  </>
);

/** Ngọn đèn dầu — biểu tượng đang học, dùng ở chân trang */
export const LampIcon = make(
  <>
    <path d="M12 3.5c1.6 1.9 2.4 3.3 2.4 4.6a2.4 2.4 0 1 1-4.8 0c0-1.3.8-2.7 2.4-4.6z" />
    <path d="M6.5 14.5h11l-1.2 4.2a2 2 0 0 1-1.9 1.4H9.6a2 2 0 0 1-1.9-1.4z" />
    <path d="M8.2 14.5c1-1.6 2.2-2.4 3.8-2.4s2.8.8 3.8 2.4" />
  </>
);
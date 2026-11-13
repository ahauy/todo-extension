/**
 * Nút icon tròn 40px (44px trên màn cảm ứng) — nền sơn bóng, viền mảnh.
 * Icon luôn là SVG nét của components/art, không dùng emoji.
 * Forward ref để người cha có thể trỏ lại nút (phục hồi fokus sau khi menu đóng).
 */
import React, { forwardRef } from 'react';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  'aria-label': string;
  title?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export default forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    'aria-label': ariaLabel,
    title,
    icon,
    onClick,
    active,
    className,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      aria-pressed={active}
      data-active={active === true ? 'true' : undefined}
      onClick={onClick}
      className={['btn-icon', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon}
    </button>
  );
});

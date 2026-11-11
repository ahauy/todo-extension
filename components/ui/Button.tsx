/**
 * Nút tấm sơn. Bốn biến thể theo docs/DESIGN.md: primary (đỏ son, chữ HOA),
 * secondary (viền nâu), ghost (viền nét đứt như đường may), danger (đỏ thẫm).
 * Mỗi màn chỉ một nút primary. Trạng thái pressed/disabled nằm trong CSS.
 */
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className, disabled = false, ...rest }, ref) => (
    <button
      type="button"
      ref={ref}
      disabled={disabled}
      className={['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export default Button;
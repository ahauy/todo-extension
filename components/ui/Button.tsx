/**
 * Button (L4-T10). Variants: primary | ghost | danger.
 * Màu đi qua token, focus ring 2px, hit area 44.
 * Hỗ trợ className và forwardRef.
 */
import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, onClick, disabled = false, className, ...rest }, ref) => {
    const base = 'h-9 px-3 rounded-control text-body font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
    const classes =
      variant === 'primary'
        ? `${base} bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active`
        : variant === 'danger'
          ? `${base} bg-danger-fill text-on-danger hover:bg-accent-hover`
          : `${base} text-fg-secondary hover:bg-surface-hover`;

    return (
      <button
        type="button"
        ref={ref}
        className={[classes, className].filter(Boolean).join(' ')}
        onClick={onClick}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

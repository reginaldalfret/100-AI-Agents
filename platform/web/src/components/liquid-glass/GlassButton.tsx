import React from 'react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass =
    variant === 'primary'
      ? 'lg-glass-btn-primary'
      : variant === 'destructive'
      ? 'lg-glass-btn-destructive'
      : variant === 'ghost'
      ? 'lg-glass-btn-ghost'
      : '';

  const sizeStyle: React.CSSProperties =
    size === 'sm'
      ? { padding: '4px 12px', fontSize: '0.78rem' }
      : size === 'lg'
      ? { padding: '12px 24px', fontSize: '0.95rem' }
      : { padding: '8px 16px', fontSize: '0.85rem' };

  return (
    <button
      className={`lg-glass-btn ${variantClass} ${className}`}
      style={sizeStyle}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="lg-glass-btn-icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
export default GlassButton;

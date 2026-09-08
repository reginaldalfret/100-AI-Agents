import React from 'react';

export interface GlassToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'static';
  className?: string;
}

export const GlassToolbar: React.FC<GlassToolbarProps> = ({
  children,
  position = 'static',
  className = '',
  style,
  ...props
}) => {
  const positionStyle: React.CSSProperties =
    position === 'top'
      ? { position: 'sticky', top: '16px', zIndex: 50 }
      : position === 'bottom'
      ? { position: 'sticky', bottom: '16px', zIndex: 50 }
      : {};

  return (
    <div
      className={`lg-glass-surface lg-glass-toolbar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderRadius: 'var(--lg-radius-capsule)',
        ...positionStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
export default GlassToolbar;

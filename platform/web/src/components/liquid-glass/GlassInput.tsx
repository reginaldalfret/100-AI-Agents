import React from 'react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, actionButton, className = '', style, ...props }, ref) => {
    return (
      <div
        className="lg-glass-input-wrapper"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--lg-text-muted)',
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`lg-glass-input ${className}`}
          style={{
            width: '100%',
            paddingLeft: icon ? '38px' : '18px',
            paddingRight: actionButton ? '48px' : '18px',
            ...style,
          }}
          {...props}
        />
        {actionButton && (
          <span
            style={{
              position: 'absolute',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {actionButton}
          </span>
        )}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';
export default GlassInput;

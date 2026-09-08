import React from 'react';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 'flat' | 'low' | 'high';
  className?: string;
  as?: React.ElementType;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  elevation = 'low',
  className = '',
  as: Component = 'div',
  style,
  ...props
}) => {
  const elevationShadow =
    elevation === 'high'
      ? 'var(--lg-glass-shadow-lg)'
      : elevation === 'low'
      ? 'var(--lg-glass-shadow)'
      : 'var(--lg-glass-shadow-sm)';

  return (
    <Component
      className={`lg-glass-surface ${className}`}
      style={{
        boxShadow: elevationShadow,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};
export default GlassSurface;

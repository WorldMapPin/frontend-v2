import React from 'react';

export type GradientKey = 'primary' | 'hero' | 'teal' | 'purple';
export interface GradientTextProps { children: React.ReactNode; gradient?: GradientKey; className?: string }

const GradientText = ({ children, gradient = 'primary', className = '' }: GradientTextProps) => {
  const gradients: Record<GradientKey, string> = {
    primary: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
    hero: 'linear-gradient(110.33deg, #FFFFFF 27.27%, #FFCFB5 98.65%)',
    teal: 'linear-gradient(92.88deg, #3FD2D0 1.84%, #39AC7F 100%)',
    purple: 'linear-gradient(92.88deg, #C654F7 1.84%, #5500FF 100%)',
  };
  return (
    <span
      className={className}
      style={{
        background: gradients[gradient],
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
};

export default GradientText;

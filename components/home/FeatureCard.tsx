import GradientText from './GradientText';
import React from 'react';
import Link from 'next/link';

export interface FeatureCardProps { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  iconGradient?: string;
  cardGradient?: string;
  href?: string;
}

const FeatureCard = ({ icon, title, description, iconGradient, href }: FeatureCardProps) => {
  const content = (
    <div
      className="p-6 lg:p-8 rounded-2xl text-center flex flex-col items-center transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group feature-card h-full"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(237, 109, 40, 0.3) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>
      
      <div 
        className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl mb-5 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 text-white relative z-10 shadow-lg"
        style={{ 
          background: iconGradient || 'linear-gradient(135deg, #ED6D28 0%, #FF8C42 100%)',
          boxShadow: '0 6px 16px rgba(237, 109, 40, 0.35)'
        }}
      >
        <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative z-10 scale-75 lg:scale-100">
          {icon}
        </div>
      </div>
      <h3 className="text-xl lg:text-2xl font-bold mb-3 font-lexend relative z-10">
        <GradientText>{title}</GradientText>
      </h3>
      <p className="font-lexend text-sm lg:text-base leading-relaxed relative z-10" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
};

export default FeatureCard;

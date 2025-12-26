import GradientText from './GradientText';
import React from 'react';

export interface FeatureCardProps { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  iconGradient?: string;
  cardGradient?: string;
}
const FeatureCard = ({ icon, title, description, iconGradient }: FeatureCardProps) => (
  <div
    className="p-8 rounded-2xl text-center flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group feature-card"
  >
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(237, 109, 40, 0.3) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }} />
    </div>
    
    <div 
      className="w-24 h-24 rounded-2xl mb-6 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 text-white relative z-10 shadow-lg"
      style={{ 
        background: iconGradient || 'linear-gradient(135deg, #ED6D28 0%, #FF8C42 100%)',
        boxShadow: '0 8px 20px rgba(237, 109, 40, 0.4)'
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      <div className="relative z-10">
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-bold mb-4 font-lexend relative z-10">
      <GradientText>{title}</GradientText>
    </h3>
    <p className="font-lexend text-base leading-relaxed relative z-10" style={{ color: 'var(--text-muted)' }}>
      {description}
    </p>
  </div>
);
export default FeatureCard;

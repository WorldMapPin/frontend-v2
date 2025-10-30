import GradientText from './GradientText';
import React from 'react';

export interface FeatureCardProps { icon: React.ReactNode; title: string; description: string }
const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div
    className="p-8 rounded-xl border-2 text-center flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
    style={{ background: '#FFE2D299', borderColor: '#ED6D281A' }}
  >
    <div 
      className="w-20 h-20 rounded-xl mb-6 flex items-center justify-center text-4xl transform transition-transform duration-300 hover:rotate-12" 
      style={{ background: '#ED6D2899' }}
    >
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 font-lexend">
      <GradientText>{title}</GradientText>
    </h3>
    <p className="font-lexend text-lg leading-relaxed" style={{ color: '#6F5B50' }}>
      {description}
    </p>
  </div>
);
export default FeatureCard;

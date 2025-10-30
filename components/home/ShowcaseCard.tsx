import React from 'react';

export interface ShowcaseCardProps { gradient: string; bgColor: string; borderColor: string; title: React.ReactNode; description: string }
const ShowcaseCard = ({ gradient, bgColor, borderColor, title, description }: ShowcaseCardProps) => (
  <div
    className="rounded-lg shadow-lg overflow-hidden border-2 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
    style={{ background: bgColor, borderColor }}
  >
    <div
      className="h-48 relative overflow-hidden"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold font-lexend mb-2">
        {title}
      </h3>
      <p className="font-lexend font-medium text-base" style={{ color: '#5E506F' }}>
        {description}
      </p>
    </div>
  </div>
);
export default ShowcaseCard;

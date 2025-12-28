import React from 'react';

export interface ShowcaseCardProps { gradient: string; bgColor: string; borderColor: string; title: React.ReactNode; description: string; image?: string }
const ShowcaseCard = ({ gradient, bgColor, borderColor, title, description, image }: ShowcaseCardProps) => (
  <div
    className="rounded-xl lg:rounded-2xl shadow-lg overflow-hidden border-2 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group showcase-card h-full flex flex-col"
    style={{ borderColor }}
  >
    <div
      className="h-44 lg:h-52 relative overflow-hidden"
      style={{ background: image ? 'transparent' : gradient }}
    >
      {image ? (
        <>
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.15) 100%)'
            }}
          />
        </>
      ) : null}
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    </div>
    <div className="p-5 lg:p-6 flex-1 flex flex-col" style={{ backgroundColor: 'var(--card-bg)' }}>
      <h3 className="text-lg lg:text-xl font-bold font-lexend mb-2">
        {title}
      </h3>
      <p className="font-lexend font-medium text-sm lg:text-base" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  </div>
);
export default ShowcaseCard;

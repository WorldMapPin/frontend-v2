import React from 'react';

export interface BenefitItemProps { title: string; description: string }
const BenefitItem = ({ title, description }: BenefitItemProps) => (
  <div
    className="p-6 rounded-xl flex items-start gap-4 transform transition-all duration-300 hover:scale-102 hover:shadow-lg"
    style={{
      background: '#ED6D2847',
      border: '2px solid #FFFFFF33',
      boxShadow: '-2px 2px 5px 0px #5E210040',
      backdropFilter: 'blur(7px)',
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="w-8 h-8 flex-shrink-0 mt-1"
      style={{ color: '#592102' }}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-5" />
    </svg>
    <div className="flex-1">
      <h4 className="font-lexend text-lg font-semibold mb-2" style={{ color: '#592102' }}>
        {title}
      </h4>
      <p className="font-lexend text-base" style={{ color: '#6F5B50' }}>
        {description}
      </p>
    </div>
  </div>
);
export default BenefitItem;

import React from 'react';

export interface BenefitItemProps { title: string; description: string }
const BenefitItem = ({ title, description }: BenefitItemProps) => (
  <div
    className="p-5 lg:p-6 rounded-xl flex items-start gap-3 lg:gap-4 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md benefit-item"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="w-6 h-6 lg:w-7 lg:h-7 flex-shrink-0 mt-0.5"
      style={{ color: 'var(--text-primary)' }}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-5" />
    </svg>
    <div className="flex-1">
      <h4 className="font-lexend text-base lg:text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <p className="font-lexend text-sm lg:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  </div>
);
export default BenefitItem;

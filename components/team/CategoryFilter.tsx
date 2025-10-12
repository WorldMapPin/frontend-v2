'use client';

import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToCategory = (category: string) => {
    const container = scrollContainerRef.current;
    const button = container?.querySelector(`button[data-category="${category}"]`);
    
    if (container && button) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = (button as HTMLElement).offsetLeft;
      const buttonWidth = (button as HTMLElement).offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryClick = (category: string) => {
    onCategoryChange(category);
    scrollToCategory(category);
  };

  return (
    <div className="mb-8 sm:mb-10 lg:mb-12 relative">
      <div className="bg-[linear-gradient(92.88deg,_#ED6D28_1.84%,_#FFA600_100%)] rounded-2xl sm:rounded-3xl p-2 relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#ED6D28] to-transparent pointer-events-none sm:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FFA600] to-transparent pointer-events-none sm:hidden" />
        
        {/* Scrollable Container */}
        <div className="flex overflow-x-auto hide-scrollbar sm:flex-nowrap sm:justify-between items-center" ref={scrollContainerRef}>
          <div className="flex space-x-2 px-2 sm:justify-between w-full">
            {categories.map((category) => (
              <button
                key={category}
                data-category={category}
                onClick={() => handleCategoryClick(category)}
                className={`h-[44px] sm:h-[48px] rounded-lg font-lexend font-medium transition-all flex-shrink-0 flex items-center justify-center text-base sm:text-lg px-6 sm:px-4 ${
                  selectedCategory === category
                    ? 'bg-[#B85518] text-white'
                    : 'text-white hover:bg-[#B85518]/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Position Indicators */}
      <div className="flex justify-center space-x-1 mt-2 sm:hidden">
        {categories.map((category) => (
          <div
            key={category}
            className={`h-1 rounded-full transition-all duration-300 ${
              selectedCategory === category
                ? 'w-4 bg-[#B85518]'
                : 'w-1 bg-[#B85518]/30'
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

'use client';

import React, { useRef, useEffect } from 'react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToCategory = (category: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const button = container.querySelector(`[data-category="${category}"]`) as HTMLElement;
    if (button) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToCategory(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0">
      <div className="bg-[linear-gradient(92.88deg,_#ED6D28_1.84%,_#FFA600_100%)] rounded-xl sm:rounded-3xl p-1.5 sm:p-2 relative shadow-lg">
        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto hide-scrollbar items-center snap-x snap-mandatory"
        >
          <div className="flex space-x-1 sm:space-x-2 px-1 w-full sm:justify-between">
            {categories.map((category) => (
              <button
                key={category}
                data-category={category}
                onClick={() => onCategoryChange(category)}
                className={`
                  h-[38px] sm:h-[48px] rounded-lg sm:rounded-xl font-lexend font-bold transition-all flex-shrink-0 flex items-center justify-center text-xs sm:text-base px-4 sm:px-6 snap-center
                  ${selectedCategory === category
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-white hover:bg-white/10'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Scroll Indicators */}
      <div className="flex justify-center space-x-1.5 mt-3 sm:hidden">
        {categories.map((category) => (
          <div
            key={category}
            className={`h-1 rounded-full transition-all duration-300 ${
              selectedCategory === category
                ? 'w-4 bg-orange-500'
                : 'w-1 bg-orange-200'
            }`}
          />
        ))}
      </div>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

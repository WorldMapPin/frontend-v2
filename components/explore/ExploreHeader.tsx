'use client';

import { SortType } from '@/types/post';

interface ExploreHeaderProps {
  postCount?: number;
  sortType?: SortType;
  onSortChange?: (sort: SortType) => void;
  loading?: boolean;
}

const SORT_OPTIONS: { value: SortType; label: string; icon: React.ReactNode }[] = [
  {
    value: 'created',
    label: 'Latest',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    value: 'trending',
    label: 'Trending',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    value: 'hot',
    label: 'Hot',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    )
  },
  {
    value: 'payout',
    label: 'Top Payout',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function ExploreHeader({ 
  postCount, 
  sortType = 'created', 
  onSortChange,
  loading = false 
}: ExploreHeaderProps) {
  return (
    <div className="mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4" style={{ maxWidth: '1344px' }}>
      <div className="rounded-lg sm:rounded-xl shadow-lg m-2 sm:m-4 relative overflow-hidden" style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)' }}>
        
        <img 
          src="/globe.svg" 
          alt="Globe" 
          className="absolute opacity-10 hidden sm:block"
          style={{ 
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '80px',
            height: '80px',
            zIndex: 1
          }}
        />
        <img 
          src="/globe.svg" 
          alt="Globe" 
          className="absolute opacity-10 sm:hidden"
          style={{ 
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '60px',
            height: '60px',
            zIndex: 1
          }}
        />
        
        {/* Post count badge - Desktop */}
        <div 
          className="absolute hidden sm:flex flex-col items-center justify-center"
          style={{ 
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '80px',
            height: '80px',
            backgroundColor: '#0000001A',
            borderRadius: '8px',
            zIndex: 1
          }}
        >
          {postCount !== undefined && postCount > 0 && (
            <>
              <div className="text-white font-bold text-xl sm:text-2xl lg:text-3xl" style={{ fontFamily: 'var(--font-lexend)' }}>
                {postCount}
              </div>
              <div className="text-white text-[10px] sm:text-xs mt-1 text-center px-1" style={{ fontFamily: 'var(--font-lexend)' }}>
                {postCount === 1 ? 'post' : 'posts'}
              </div>
            </>
          )}
        </div>
        
        {/* Post count badge - Mobile */}
        {postCount !== undefined && postCount > 0 && (
          <div className="absolute bottom-2 right-2 sm:hidden flex flex-col items-end z-10">
            <div className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-lexend)' }}>
              {postCount}
            </div>
            <div className="text-white text-[10px]" style={{ fontFamily: 'var(--font-lexend)' }}>
              {postCount === 1 ? 'post' : 'posts'}
            </div>
          </div>
        )}
        
        {/* Header content */}
        <div className="relative px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 z-10 pl-12 sm:pl-20 lg:pl-16">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend)' }}>Explore</h1>
          <p className="text-white mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base opacity-90" style={{ fontFamily: 'var(--font-lexend)' }}>
            Discover travel stories from the WorldMapPin community
          </p>
        </div>
      </div>

      {/* Sort Filter Buttons */}
      <div className="m-2 sm:m-4 mt-0 sm:mt-0">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {SORT_OPTIONS.map((option) => {
            const isActive = sortType === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onSortChange?.(option.value)}
                disabled={loading}
                className={`
                  inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 
                  rounded-full text-xs sm:text-sm font-medium
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? 'bg-orange-500 text-white shadow-md scale-105 explore-filter-btn-active' 
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 shadow-sm border border-gray-200 explore-filter-btn'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                `}
                style={{ fontFamily: 'var(--font-lexend)' }}
              >
                <span className={`explore-filter-btn-icon ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

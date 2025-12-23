'use client';

import { useCallback } from 'react';
import ExploreCard from '@/components/explore/ExploreCard';
import ExploreHeader from '@/components/explore/ExploreHeader';
import { usePostPaginator, useInfiniteScroll } from '@/hooks/use-post-paginator';

// Skeleton card component that matches ExploreCard design
function SkeletonCard({ index }: { index: number }) {
  return (
    <div 
      className="bg-white rounded-xl sm:rounded-2xl overflow-visible flex flex-col relative h-full animate-pulse"
      style={{ 
        boxShadow: '0px 4px 4px 0px #00000020',
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Cover Image Skeleton */}
      <div className="relative w-full overflow-hidden rounded-t-xl sm:rounded-t-2xl h-[180px] sm:h-[220px] lg:h-[249.6px]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-orange-100 to-amber-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skeleton-shimmer" />
        </div>
        
        {/* Avatar and username skeleton overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/60" />
          <div className="h-3 w-20 bg-white/60 rounded" />
        </div>
        
        {/* Payout skeleton */}
        <div className="absolute top-3 right-3">
          <div className="h-4 w-12 bg-white/60 rounded" />
        </div>
      </div>

      {/* Stats badges skeleton - positioned on border */}
      <div className="absolute left-3 sm:left-4 flex flex-row gap-1.5 sm:gap-2 z-20 top-[180px] sm:top-[220px] lg:top-[249.6px]" style={{ transform: 'translateY(-50%)' }}>
        <div className="rounded-full px-3 py-1 bg-pink-100/80 w-14 h-6" />
        <div className="rounded-full px-3 py-1 bg-blue-100/80 w-14 h-6" />
      </div>
      
      {/* Date skeleton */}
      <div className="absolute right-3 sm:right-4 z-20 top-[180px] sm:top-[220px] lg:top-[249.6px]" style={{ transform: 'translateY(-50%)' }}>
        <div className="rounded-full px-3 py-1 bg-gray-200/80 w-20 h-6" />
      </div>

      {/* Content skeleton */}
      <div className="p-3 sm:p-4 pb-3 sm:pb-4 flex flex-col flex-1 pt-5">
        <div className="space-y-2 mt-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
        
        {/* Tags skeleton */}
        <div className="mt-auto pt-3 flex gap-2">
          <div className="h-4 bg-blue-100 rounded w-14" />
          <div className="h-4 bg-blue-100 rounded w-16" />
          <div className="h-4 bg-blue-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// Inline loading dots animation
function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-2">
      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

export default function ExplorePage() {
  const {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    sortType,
    totalLoaded,
    fetchNextPage,
    changeSortType
  } = usePostPaginator({ initialSort: 'created', postsPerPage: 20 });

  // Memoized load more function for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Enable infinite scroll
  useInfiniteScroll(handleLoadMore, {
    threshold: 400,
    enabled: !loading && hasMore
  });

  // Error state
  if (error && !loading && posts.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFF9ED 30.32%, #FFFFFF 100%)' }} />
        <div className="relative z-10">
          <ExploreHeader sortType={sortType} onSortChange={changeSortType} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lexend)' }}>
                Unable to load posts
              </h2>
              <p className="text-gray-500 mb-6 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
                style={{ fontFamily: 'var(--font-lexend)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFF9ED 30.32%, #FFFFFF 100%)' }} />

      {/* Shimmer animation styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>

      <div className="relative z-10">
        <ExploreHeader 
          postCount={loading ? undefined : totalLoaded} 
          sortType={sortType} 
          onSortChange={changeSortType}
          loading={loading || loadingMore}
        />

        {/* Posts Grid */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Initial Loading State - Show skeleton grid */}
          {loading && posts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 items-stretch">
              {[...Array(12)].map((_, index) => (
                <SkeletonCard key={index} index={index} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium" style={{ fontFamily: 'var(--font-lexend)' }}>No posts found</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different filter</p>
            </div>
          ) : (
            <>
              {/* Posts Grid with Skeleton placeholders for loading more */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 items-stretch">
                {/* Actual posts */}
                {posts.map((post, index) => (
                  <div 
                    key={`${post.slug}-${index}`} 
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${(index % 20) * 50}ms` }}
                  >
                    <ExploreCard post={post} />
                  </div>
                ))}
                
                {/* Skeleton cards while loading more - seamlessly continues the grid */}
                {loadingMore && [...Array(6)].map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} index={index} />
                ))}
              </div>

              {/* Subtle loading indicator at the bottom */}
              {loadingMore && (
                <div className="mt-6 flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-orange-100">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-lexend)' }}>
                      Loading more
                    </span>
                  </div>
                </div>
              )}

              {/* End of Posts */}
              {!hasMore && posts.length > 0 && !loadingMore && (
                <div className="mt-10 flex justify-center">
                  <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-lexend)' }}>
                        You&apos;ve explored all {totalLoaded} posts
                      </p>
                      <p className="text-xs text-gray-400">Check back later for new adventures!</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Load More Button - Shows when not loading and has more */}
              {hasMore && !loadingMore && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <button
                    onClick={fetchNextPage}
                    className="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{ fontFamily: 'var(--font-lexend)' }}
                  >
                    <span>Load More Posts</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-400">or scroll down to auto-load</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

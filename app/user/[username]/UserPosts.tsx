'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchUserPostsWithCoords } from '../../../lib/worldmappinApi';
import { fetchPosts, fetchPostsProgressive } from '@/utils/hivePosts';
import { ProcessedPost, CuratedPost } from '@/types/post';
import ExploreCard from '@/components/explore/ExploreCard';
import { Search, X, ChevronDown, ArrowUpDown, Clock, TrendingUp, Calendar } from 'lucide-react';

interface UserPostsProps {
  username: string;
  initialPins?: any[];
}

const POSTS_PER_PAGE = 12;

type SortOption = 'newest' | 'oldest' | 'popular' | 'payout';

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'Newest', icon: <Clock className="w-4 h-4" /> },
  { value: 'oldest', label: 'Oldest', icon: <Calendar className="w-4 h-4" /> },
  { value: 'popular', label: 'Most Popular', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'payout', label: 'Highest Payout', icon: <ArrowUpDown className="w-4 h-4" /> },
];

export function UserPosts({ username, initialPins }: UserPostsProps) {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [allBasicPosts, setAllBasicPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort posts
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          const dateA = new Date(a.created).getTime();
          const dateB = new Date(b.created).getTime();
          // Handle invalid dates
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1; // Invalid dates go to end
          if (isNaN(dateB)) return -1;
          return dateB - dateA;
        case 'oldest':
          const dateA2 = new Date(a.created).getTime();
          const dateB2 = new Date(b.created).getTime();
          // Handle invalid dates
          if (isNaN(dateA2) && isNaN(dateB2)) return 0;
          if (isNaN(dateA2)) return 1; // Invalid dates go to end
          if (isNaN(dateB2)) return -1;
          return dateA2 - dateB2;
        case 'popular':
          return b.votes - a.votes;
        case 'payout':
          // Parse payout value - handle formats like "$2.14", "2.14 HBD", "2.14 USD", etc.
          const payoutA = parseFloat(a.payout.replace(/[$,]/g, '').replace(/ HBD| USD/gi, '').trim()) || 0;
          const payoutB = parseFloat(b.payout.replace(/[$,]/g, '').replace(/ HBD| USD/gi, '').trim()) || 0;
          return payoutB - payoutA;
        default:
          return 0;
      }
    });

    return result;
  }, [posts, searchQuery, sortOption]);

  // Load initial posts with progressive rendering for faster perceived performance
  useEffect(() => {
    async function loadInitialPosts() {
      try {
        setLoading(true);
        setError(null);

        // Use initialPins if provided, otherwise fetch them
        let basicPosts = [];
        if (initialPins && initialPins.length > 0) {
          basicPosts = initialPins;
        } else {
          basicPosts = await fetchUserPostsWithCoords(username);
        }

        setAllBasicPosts(basicPosts);

        if (basicPosts.length === 0) {
          setLoading(false);
          return;
        }

        // Convert to CuratedPost format for fetchPosts
        const curatedPosts: CuratedPost[] = basicPosts
          .filter((post: any) => post.author && post.permlink)
          .map((post: any) => ({
            url: post.link || `https://peakd.com/@${post.author}/${post.permlink}`,
            source: 'peakd',
            author: post.author,
            permlink: post.permlink
          }));

        if (curatedPosts.length === 0) {
          setError('No posts with valid author/permlink found');
          setLoading(false);
          return;
        }

        const firstBatch = curatedPosts.slice(0, POSTS_PER_PAGE);

        // Prioritize first 6 posts for immediate display
        const priorityPosts = firstBatch.slice(0, 6);
        const remainingPosts = firstBatch.slice(6);

        // Fetch priority posts first with higher concurrency
        const initialPosts = await fetchPosts(priorityPosts, 10);
        // Deduplicate posts by slug to prevent duplicate keys
        const uniqueInitialPosts = Array.from(
          new Map(initialPosts.map(post => [post.slug, post])).values()
        );
        setPosts(uniqueInitialPosts);
        setLoading(false);

        // Progressive loading for remaining posts
        if (remainingPosts.length > 0) {
          await fetchPostsProgressive(
            remainingPosts,
            (newPosts) => {
              setPosts(prev => {
                // Deduplicate posts by slug to prevent duplicate keys
                const existingSlugs = new Set(prev.map(p => p.slug));
                const uniqueNewPosts = newPosts.filter(p => !existingSlugs.has(p.slug));
                return [...prev, ...uniqueNewPosts];
              });
            },
            10
          );
        }
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('Failed to load posts. Please try again later.');
        setLoading(false);
      }
    }

    if (username) {
      loadInitialPosts();
    }
  }, [username]);

  // Load more posts with progressive rendering
  const loadMorePosts = async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const startIndex = currentPage * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;

      // Convert remaining basic posts to CuratedPost format
      const remainingBasicPosts = allBasicPosts.slice(startIndex);
      const curatedPosts: CuratedPost[] = remainingBasicPosts
        .filter((post: any) => post.author && post.permlink)
        .map((post: any) => ({
          url: post.link || `https://peakd.com/@${post.author}/${post.permlink}`,
          source: 'peakd',
          author: post.author,
          permlink: post.permlink
        }));

      const nextBatch = curatedPosts.slice(0, POSTS_PER_PAGE);

      if (nextBatch.length === 0) {
        setLoadingMore(false);
        return;
      }

      // Progressive loading for "Load More"
      await fetchPostsProgressive(
        nextBatch,
        (newPosts) => {
          setPosts(prevPosts => {
            // Deduplicate posts by slug to prevent duplicate keys
            const existingSlugs = new Set(prevPosts.map(p => p.slug));
            const uniqueNewPosts = newPosts.filter(p => !existingSlugs.has(p.slug));
            return [...prevPosts, ...uniqueNewPosts];
          });
        },
        10
      );

      setCurrentPage(nextPage);
      setLoadingMore(false);
    } catch (err) {
      console.error('Error loading more posts:', err);
      setLoadingMore(false);
    }
  };

  // Cache warming - Prefetch next batch in background
  useEffect(() => {
    if (!loading && posts.length > 0 && posts.length >= POSTS_PER_PAGE) {
      // Wait 2 seconds after initial load, then prefetch next batch
      const timer = setTimeout(() => {
        const nextStartIndex = currentPage * POSTS_PER_PAGE;
        const nextEndIndex = nextStartIndex + POSTS_PER_PAGE;
        const remainingBasicPosts = allBasicPosts.slice(nextStartIndex, nextEndIndex);

        const curatedPosts: CuratedPost[] = remainingBasicPosts
          .filter((post: any) => post.author && post.permlink)
          .map((post: any) => ({
            url: post.link || `https://peakd.com/@${post.author}/${post.permlink}`,
            source: 'peakd',
            author: post.author,
            permlink: post.permlink
          }));

        if (curatedPosts.length > 0) {
          // Silently prefetch in background (lower priority - 3 concurrent)
          fetchPosts(curatedPosts, 3).catch(() => {
            // Fail silently - this is just cache warming
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, posts.length, currentPage, allBasicPosts]);

  const hasMorePosts = posts.length < allBasicPosts.length;

  const currentSortOption = SORT_OPTIONS.find(opt => opt.value === sortOption);

  if (loading) {
    return (
      <section className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
                Pins
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-amber-500"></div>
          </div>

          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-lg shadow-md overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="h-36 sm:h-44 md:h-48" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                <div className="p-3 sm:p-4">
                  <div className="h-3 sm:h-4 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="h-3 sm:h-4 rounded w-1/2 mb-3 sm:mb-4" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="flex gap-2 mb-3 sm:mb-4">
                    <div className="h-5 sm:h-6 rounded w-14 sm:w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                    <div className="h-5 sm:h-6 rounded w-14 sm:w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  </div>
                  <div className="h-7 sm:h-8 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
                Pins
              </h2>
            </div>
          </div>
          <div className="text-center p-6 rounded-lg user-posts-error" style={{ color: 'var(--text-primary)' }}>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <section className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
                Pins
              </h2>
            </div>
          </div>
          <div className="text-center py-8 sm:py-12">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
              No Posts Found
            </h3>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              @{username} hasn't shared any travel posts yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
                Pins
              </h2>
              <span
                className="text-sm sm:text-base px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--section-bg)', color: 'var(--text-secondary)', fontFamily: 'var(--font-lexend)' }}
              >
                {allBasicPosts.length}
              </span>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="text"
                  placeholder="Search pins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-lexend)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="w-4 h-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-lexend)'
                  }}
                >
                  {currentSortOption?.icon}
                  <span className="hidden sm:inline">{currentSortOption?.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSortDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSortDropdown(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-20 border"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortOption(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${sortOption === option.value ? 'font-semibold' : ''
                            }`}
                          style={{
                            color: sortOption === option.value ? '#ED6D28' : 'var(--text-primary)',
                            backgroundColor: sortOption === option.value ? 'rgba(237, 109, 40, 0.1)' : 'transparent',
                            fontFamily: 'var(--font-lexend)'
                          }}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search results count */}
          {searchQuery && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-lexend)' }}>
              Found {filteredAndSortedPosts.length} {filteredAndSortedPosts.length === 1 ? 'pin' : 'pins'} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Posts Grid */}
        {filteredAndSortedPosts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--section-bg)' }}>
              <Search className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
              No pins found
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Try a different search term
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredAndSortedPosts.map((post) => (
                <ExploreCard key={post.slug} post={post} hideAvatar={true} />
              ))}
            </div>

            {/* Load More Button - only show when not searching */}
            {hasMorePosts && !searchQuery && (
              <div className="mt-6 sm:mt-8 md:mt-12 text-center">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 sm:gap-3 text-white font-semibold px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg text-sm sm:text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none disabled:cursor-not-allowed disabled:transform-none disabled:opacity-70 user-posts-load-more-btn"
                  style={{
                    background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
                    boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D'
                  }}
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Posts</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                <p className="text-xs sm:text-sm mt-2 sm:mt-3" style={{ color: 'var(--text-muted)' }}>
                  {allBasicPosts.length - posts.length} more {allBasicPosts.length - posts.length === 1 ? 'post' : 'posts'} to explore
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default UserPosts;

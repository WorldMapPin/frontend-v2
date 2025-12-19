'use client';

import { useEffect, useState } from 'react';
import { ProcessedPost, CuratedPost } from '@/types/post';
import { loadCuratedPosts, fetchPosts, fetchPostsProgressive } from '@/utils/hivePosts';
import ExploreCard from '@/components/explore/ExploreCard';
import ExploreHeader from '@/components/explore/ExploreHeader';

const POSTS_PER_PAGE = 12;

export default function ExplorePage() {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [allCuratedPosts, setAllCuratedPosts] = useState<CuratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load initial posts with progressive rendering for faster perceived performance
  useEffect(() => {
    async function loadInitialPosts() {
      try {
        setLoading(true);
        setError(null);

        // Load curated posts list (fast - just JSON)
        const curatedPosts = await loadCuratedPosts();
        setAllCuratedPosts(curatedPosts);

        if (curatedPosts.length === 0) {
          setError('No curated posts found');
          setLoading(false);
          return;
        }

        const firstBatch = curatedPosts.slice(0, POSTS_PER_PAGE);

        // Prioritize first 6 posts for immediate display
        const priorityPosts = firstBatch.slice(0, 6);
        const remainingPosts = firstBatch.slice(6);

        // Fetch priority posts first with higher concurrency
        const initialPosts = await fetchPosts(priorityPosts, 10);
        setPosts(initialPosts);
        setLoading(false);

        // Progressive loading for remaining posts
        if (remainingPosts.length > 0) {
          await fetchPostsProgressive(
            remainingPosts,
            (newPosts) => {
              setPosts(prev => [...prev, ...newPosts]);
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

    loadInitialPosts();
  }, []);

  // Load more posts with progressive rendering
  const loadMorePosts = async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const startIndex = currentPage * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;

      const nextBatch = allCuratedPosts.slice(startIndex, endIndex);

      if (nextBatch.length === 0) {
        setLoadingMore(false);
        return;
      }

      // Progressive loading for "Load More"
      await fetchPostsProgressive(
        nextBatch,
        (newPosts) => {
          setPosts(prevPosts => [...prevPosts, ...newPosts]);
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
        const nextBatch = allCuratedPosts.slice(nextStartIndex, nextEndIndex);

        if (nextBatch.length > 0) {
          // Silently prefetch in background (lower priority - 3 concurrent)
          fetchPosts(nextBatch, 3).catch(() => {
            // Fail silently - this is just cache warming
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, posts.length, currentPage, allCuratedPosts]);

  const hasMorePosts = posts.length < allCuratedPosts.length;

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFF9ED 30.32%, #FFFFFF 100%)' }} />

        <div className="relative z-10">
          <ExploreHeader />

          {/* Loading State */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-600">Loading curated posts...</p>
            </div>

            {/* Loading Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFF9ED 30.32%, #FFFFFF 100%)' }} />

        <div className="relative z-10">
          <ExploreHeader />

          {/* Error State */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Posts</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Retry
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

      <div className="relative z-10">
        <ExploreHeader postCount={posts.length} totalCount={allCuratedPosts.length} />

        {/* Posts Grid */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          {posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-600 text-sm sm:text-base">No posts available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 items-stretch">
                {posts.map((post) => (
                  <ExploreCard key={post.slug} post={post} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMorePosts && (
                <div className="mt-6 sm:mt-8 lg:mt-12 text-center">
                  <button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 sm:gap-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg text-sm sm:text-base lg:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Explore More</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                    {allCuratedPosts.length - posts.length} more {allCuratedPosts.length - posts.length === 1 ? 'post' : 'posts'} to explore
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
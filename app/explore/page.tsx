'use client';

import { useEffect, useState } from 'react';
import { ProcessedPost, CuratedPost } from '@/types/post';
import { loadCuratedPosts, fetchPosts } from '@/utils/hivePosts';
import ExploreCard from '@/components/explore/ExploreCard';

const POSTS_PER_PAGE = 12;

export default function ExplorePage() {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [allCuratedPosts, setAllCuratedPosts] = useState<CuratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load initial posts
  useEffect(() => {
    async function loadInitialPosts() {
      try {
        setLoading(true);
        setError(null);
        
        // Load curated posts list
        const curatedPosts = await loadCuratedPosts();
        setAllCuratedPosts(curatedPosts);
        
        if (curatedPosts.length === 0) {
          setError('No curated posts found');
          setLoading(false);
          return;
        }
        
        // Fetch first 30 posts from Hive with batching
        const firstBatch = curatedPosts.slice(0, POSTS_PER_PAGE);
        const fetchedPosts = await fetchPosts(firstBatch, 6);
        setPosts(fetchedPosts);
        setLoading(false);
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('Failed to load posts. Please try again later.');
        setLoading(false);
      }
    }

    loadInitialPosts();
  }, []);

  // Load more posts
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
      
      const fetchedPosts = await fetchPosts(nextBatch, 6);
      setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
      setCurrentPage(nextPage);
      setLoadingMore(false);
    } catch (err) {
      console.error('Error loading more posts:', err);
      setLoadingMore(false);
    }
  };

  const hasMorePosts = posts.length < allCuratedPosts.length;

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background - matching home page */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/40 via-amber-600/30 to-white" />
        
        <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
            <p className="text-gray-600 mt-2">Discover curated travel stories from the WorldMapPin community</p>
          </div>
        </div>
        
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
        {/* Background - matching home page */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/40 via-amber-600/30 to-white" />
        
        <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
            <p className="text-gray-600 mt-2">Discover curated travel stories from the WorldMapPin community</p>
          </div>
        </div>
        
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
      {/* Background - matching home page */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-300" />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400/40 via-amber-600/30 to-white" />
      
      <div className="relative z-10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
          <p className="text-gray-600 mt-2">
            Discover curated travel stories from the WorldMapPin community
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Showing {posts.length} of {allCuratedPosts.length} {allCuratedPosts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </div>
      
      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <ExploreCard key={post.slug} post={post} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMorePosts && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Explore More</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-3">
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
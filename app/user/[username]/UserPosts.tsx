'use client';

import React, { useEffect, useState } from 'react';
import { fetchUserPostsWithCoords } from '../../../lib/worldmappinApi';
import { fetchPosts, fetchPostsProgressive } from '@/utils/hivePosts';
import { ProcessedPost, CuratedPost } from '@/types/post';
import PostCard from '@/components/shared/PostCard';
import Link from 'next/link';

interface UserPostsProps {
  username: string;
}

const POSTS_PER_PAGE = 12;

export function UserPosts({ username }: UserPostsProps) {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [allBasicPosts, setAllBasicPosts] = useState<any[]>([]);
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
        
        // First, get basic post data (fast - just coordinates and basic info)
        const basicPosts = await fetchUserPostsWithCoords(username);
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

  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Travel Posts
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Discover all the amazing places @{username} has shared
            </p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
          
          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
            {[...Array(6)].map((_, index) => (
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
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Travel Posts
            </h2>
          </div>
          <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Travel Posts
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Discover all the amazing places @{username} has shared
            </p>
          </div>
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              No Posts Found
            </h3>
            <p className="text-gray-600">
              @{username} hasn't shared any travel posts yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Travel Posts
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Discover all the amazing places @{username} has shared
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Showing {posts.length} of {allBasicPosts.length} {allBasicPosts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/read/${post.slug}`}>
                  <PostCard
                    coverImage={post.coverImage}
                    title={post.title}
                    username={post.author}
                    reputation={post.reputation}
                    tags={post.tags}
                    votes={post.votes}
                    comments={post.comments}
                    payout={post.payout}
                    date={post.created}
                  />
                </Link>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMorePosts && (
              <div className="mt-8 sm:mt-12 text-center">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Posts</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-3">
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


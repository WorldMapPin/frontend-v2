'use client';

import { useState, useEffect } from 'react';
import ExploreCard from '@/components/explore/ExploreCard';
import GradientText from './GradientText';
import { DigestFetchResult, ProcessedPost } from '@/types/post';
import { transformDigestPosts } from '@/lib/travelDigest';

interface TravelDigestSectionProps {
  className?: string;
}

export default function TravelDigestSection({ className = '' }: TravelDigestSectionProps) {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchDigest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/travel-digest');
      const result: DigestFetchResult = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch travel digest');
      }
      
      if (result.digest && result.digest.posts.length > 0) {
        const processedPosts = await transformDigestPosts(result.digest.posts);
        setPosts(processedPosts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching travel digest:', err);
      setError(err instanceof Error ? err.message : 'Failed to load travel digest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchDigest();
  };

  if (loading) {
    return (
      <section className={`py-16 lg:py-24 ${className}`} style={{ backgroundColor: 'var(--background)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-lexend home-gradient-text">
              <GradientText>Today's Featured Travel Posts</GradientText>
          </h2>
            <p className="text-base sm:text-lg lg:text-xl font-lexend max-w-2xl mx-auto home-gradient-text" style={{ color: 'var(--text-secondary)' }}>
              Handpicked stories from the WorldMapPin community, updated daily
            </p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0px 4px 4px 0px var(--shadow-color)' }}>
                <div className="h-[180px] sm:h-[220px] lg:h-[249.6px] bg-gradient-to-br from-orange-400 to-amber-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
                <div className="p-4">
                  <div className="h-4 rounded mb-2" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
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
      <section className={`py-16 lg:py-24 ${className}`} style={{ backgroundColor: 'var(--background)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-lexend home-gradient-text">
              <GradientText>Today's Featured Travel Posts</GradientText>
          </h2>
            <p className="text-base sm:text-lg lg:text-xl font-lexend max-w-2xl mx-auto home-gradient-text" style={{ color: 'var(--text-secondary)' }}>
              Handpicked stories from the WorldMapPin community, updated daily
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
              Unable to load featured posts
            </h3>
            <p className="mb-4" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-secondary)' }}>
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              style={{ fontFamily: 'var(--font-lexend)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className={`py-16 lg:py-24 ${className}`} style={{ backgroundColor: 'var(--background)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-lexend home-gradient-text">
              <GradientText>Today's Featured Travel Posts</GradientText>
          </h2>
            <p className="text-base sm:text-lg lg:text-xl font-lexend max-w-2xl mx-auto home-gradient-text" style={{ color: 'var(--text-secondary)' }}>
              Handpicked stories from the WorldMapPin community, updated daily
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
              No featured posts available
            </h3>
            <p style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-secondary)' }}>
              Check back later for today's curated travel content.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 lg:py-24 ${className}`} style={{ backgroundColor: 'var(--background)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-lexend home-gradient-text">
            <GradientText>Today's Featured Travel Posts</GradientText>
        </h2>
          <p className="text-base sm:text-lg lg:text-xl font-lexend max-w-2xl mx-auto home-gradient-text" style={{ color: 'var(--text-secondary)' }}>
            Handpicked stories from the WorldMapPin community, updated daily
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {posts.map((post) => (
            <div key={`${post.author}-${post.permlink}`}>
              <ExploreCard post={post} hideAvatar={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
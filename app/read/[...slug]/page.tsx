'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProcessedPost } from '@/types/post';
import { fetchPostWithRetry } from '@/utils/hivePosts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

export default function PostReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<ProcessedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilCashout, setTimeUntilCashout] = useState<string | null>(null);

  // Parse slug from params: catch-all returns array like ['@author', 'permlink']
  // Decode URI components in case @ is encoded as %40
  const slugArray = params.slug as string[];
  const decodedAuthor = decodeURIComponent(slugArray?.[0] || '');
  const author = decodedAuthor.replace('@', '');
  const permlink = decodeURIComponent(slugArray?.[1] || '');

  useEffect(() => {
    async function loadPost() {
      if (!author || !permlink) {
        setError('Invalid post URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedPost = await fetchPostWithRetry(author, permlink, 3);

        if (!fetchedPost) {
          setError('Post not found or failed to load');
          setLoading(false);
          return;
        }

        setPost(fetchedPost);
        setLoading(false);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post. Please try again later.');
        setLoading(false);
      }
    }

    loadPost();
  }, [author, permlink]);

  // Calculate time until cashout
  useEffect(() => {
    if (!post?.cashoutTime) return;

    function updateCashoutTime() {
      if (!post?.cashoutTime) return;
      const cashoutDate = new Date(post.cashoutTime);
      const now = new Date();
      const diffInMs = cashoutDate.getTime() - now.getTime();

      if (diffInMs <= 0) {
        setTimeUntilCashout('Cashed out');
        return;
      }

      const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeUntilCashout(`${days}d ${hours}h until cashout`);
      } else if (hours > 0) {
        setTimeUntilCashout(`${hours}h ${minutes}m until cashout`);
      } else {
        setTimeUntilCashout(`${minutes}m until cashout`);
      }
    }

    updateCashoutTime();
    const interval = setInterval(updateCashoutTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [post]);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background - matching home page */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/40 via-amber-600/30 to-white" />
        
        <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Loading Skeleton */}
            <div className="animate-pulse">
              <div className="h-96 bg-gray-300"></div>
              <div className="p-8">
                <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background - matching home page */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/40 via-amber-600/30 to-white" />
        
        <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Post</h2>
            <p className="text-gray-600 mb-6">{error || 'Post not found'}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go Back
              </button>
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
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background - matching home page */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-300" />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400/40 via-amber-600/30 to-white" />
      
      <div className="relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Explore
        </button>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-500 to-purple-600">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

            {/* Author Row */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://peakd.com/@${post.author}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      @{post.author}
                    </a>
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {post.reputation}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span>{post.createdRelative}</span>
                    <span>•</span>
                    <span>{post.readingTimeMin} min read</span>
                    {timeUntilCashout && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600">{timeUntilCashout}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{post.votes}</span>
                <span className="text-gray-600">votes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">{post.comments}</span>
                <span className="text-gray-600">comments</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-green-600">{post.payout}</span>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Body Markdown */}
            <div className="prose prose-lg max-w-none prose-img:rounded-lg prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  img: ({ ...props }) => (
                    <img
                      {...props}
                      className="w-full rounded-lg shadow-md my-6"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ),
                }}
              >
                {post.bodyMarkdown || ''}
              </ReactMarkdown>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
              <a
                href={post.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open on PeakD
              </a>
              
              {process.env.NODE_ENV === 'development' && (
                <a
                  href={post.rawJsonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  View Raw JSON
                </a>
              )}
            </div>
          </div>
        </article>
      </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
        {/* Background */}
        <div className="absolute inset-0 bg-white" />
        
        <div className="relative z-10">
        <div className="w-full px-4 sm:w-[90%] md:w-[85%] lg:w-[70%] mx-auto sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Loading Skeleton */}
            <div className="animate-pulse">
              <div className="h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-300"></div>
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="h-6 sm:h-8 bg-gray-300 rounded w-3/4 mb-3 sm:mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-4 sm:mb-6"></div>
                <div className="space-y-2 sm:space-y-3">
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
        {/* Background */}
        <div className="absolute inset-0 bg-white" />
        
        <div className="relative z-10">
        <div className="w-full px-4 sm:w-[90%] md:w-[85%] lg:w-[70%] mx-auto sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error Loading Post</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{error || 'Post not found'}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
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
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      
      <div className="relative z-10">
      <div className="w-full px-4 sm:w-[90%] md:w-[85%] lg:w-[70%] mx-auto sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <article>
          {/* Cover Image */}
          {post.coverImage && (
            <div
              className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-blue-500 to-purple-600"
              style={{
                boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D',
                borderRadius: '18px'
              }}
            >
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                style={{ borderRadius: '18px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Back Button */}
              <Link
                href="/explore"
                className="absolute top-3 left-3 sm:top-4 sm:-left-4 z-10 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer w-10 h-10 sm:w-12 sm:h-12"
                style={{
                  borderRadius: '50px',
                  boxShadow: '0px 1px 3px 0px #0000004D, 0px 4px 8px 3px #00000026'
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path
                    d="M13 18L7 12L13 6"
                    stroke="#7F1B1B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 12H19"
                    stroke="#7F1B1B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Author Name and Reputation */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <a
                href={`https://peakd.com/@${post.author}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-xl lg:text-2xl font-semibold transition-colors"
                style={{
                  fontFamily: 'Lexend',
                  color: '#996027'
                }}
              >
                @{post.author}
              </a>
              <span
                className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-full font-medium"
                style={{
                  fontFamily: 'Lexend',
                  backgroundColor: '#FFF9ED',
                  color: '#996027',
                  border: '1px solid #99602733'
                }}
              >
                {post.reputation}
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-4 sm:mb-6 lg:mb-8"
              style={{
                fontFamily: 'Lexend',
                color: '#592102'
              }}
            >
              {post.title}
            </h1>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full transition-colors"
                    style={{
                      fontFamily: 'Lexend',
                      backgroundColor: '#DCF5FF',
                      color: '#006CC4'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-3">
                <div>
                  <div
                    className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs sm:text-sm"
                    style={{
                      fontFamily: 'Lexend',
                      color: '#3F4B53'
                    }}
                  >
                    <span>{post.createdRelative}</span>
                    <span>•</span>
                    <span>{post.readingTimeMin} min read</span>
                    {timeUntilCashout && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span style={{ color: '#ED6D28' }}>{timeUntilCashout}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className="font-bold text-xl sm:text-2xl"
                  style={{
                    fontFamily: 'Lexend',
                    color: '#8EDB1B'
                  }}
                >
                  {post.payout}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-2 mb-4 sm:mb-6 pb-4 sm:pb-6">
              {/* Left side - Likes and Comments */}
              <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
                {/* Likes Rectangle - rounded on top-left and bottom-left (outside edge) */}
                <div
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
                  style={{
                    fontFamily: 'Lexend',
                    backgroundColor: '#FFE6ED',
                    border: '2px solid #DE20564D',
                    borderTopLeftRadius: '15px',
                    borderBottomLeftRadius: '15px',
                    borderTopRightRadius: '7px',
                    borderBottomRightRadius: '7px',
                    paddingTop: 'calc(0.5rem * 1.04)',
                    paddingBottom: 'calc(0.5rem * 1.04)'
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#DE2056' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base" style={{ color: '#DE2056' }}>{post.votes}</span>
                  <span className="text-sm sm:text-base hidden sm:inline" style={{ color: '#DE2056' }}>votes</span>
                </div>
                {/* Comments Rectangle - rounded on top-right and bottom-right (outside edge) */}
                <div
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
                  style={{
                    fontFamily: 'Lexend',
                    backgroundColor: '#E4EDFF',
                    border: '2px solid #3B79F44D',
                    borderTopRightRadius: '15px',
                    borderBottomRightRadius: '15px',
                    borderTopLeftRadius: '7px',
                    borderBottomLeftRadius: '7px',
                    paddingTop: 'calc(0.5rem * 1.04)',
                    paddingBottom: 'calc(0.5rem * 1.04)'
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3B79F4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base" style={{ color: '#3B79F4' }}>{post.comments}</span>
                  <span className="text-sm sm:text-base hidden sm:inline" style={{ color: '#3B79F4' }}>comments</span>
                </div>
              </div>
              
              {/* Right side - Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
                {/* Open on PeakD Button - rounded on top-left and bottom-left (outside edge) */}
                <a
                  href={post.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 cursor-pointer transition-opacity hover:opacity-80 flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
                  style={{
                    fontFamily: 'Lexend',
                    backgroundColor: '#28EDEA26',
                    border: '2px solid #28EAED80',
                    borderTopLeftRadius: '15px',
                    borderBottomLeftRadius: '15px',
                    borderTopRightRadius: '7px',
                    borderBottomRightRadius: '7px',
                    paddingTop: 'calc(0.5rem * 1.04)',
                    paddingBottom: 'calc(0.5rem * 1.04)'
                  }}
                >
                  <span className="font-medium text-xs sm:text-sm lg:text-base" style={{ color: '#1AB5B8' }}>Open on PeakD</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1AB5B8' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {/* View Raw JSON Button - rounded on top-right and bottom-right (outside edge) */}
                {process.env.NODE_ENV === 'development' && (
                  <a
                    href={post.rawJsonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 cursor-pointer transition-opacity hover:opacity-80 flex-1 sm:flex-none min-h-[48px] sm:min-h-0"
                  style={{
                    fontFamily: 'Lexend',
                    backgroundColor: '#ED6D281A',
                    border: '2px solid #ED6D2847',
                    borderTopRightRadius: '15px',
                    borderBottomRightRadius: '15px',
                    borderTopLeftRadius: '7px',
                    borderBottomLeftRadius: '7px',
                    paddingTop: 'calc(0.5rem * 1.04)',
                    paddingBottom: 'calc(0.5rem * 1.04)'
                  }}
                >
                    <span className="font-medium text-xs sm:text-sm lg:text-base" style={{ color: '#ED6D28' }}>View Raw JSON</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#ED6D28' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Body Markdown */}
            <div
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-img:rounded-lg prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-headings:text-[#592102] prose-p:leading-relaxed"
              style={{
                fontFamily: 'Lexend',
                color: '#371300'
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  img: ({ ...props }) => (
                    <img
                      {...props}
                      className="w-full rounded-lg shadow-md my-4 sm:my-6"
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

          </div>
        </article>
      </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProcessedPost } from '@/types/post';

interface ExploreCardProps {
  post: ProcessedPost;
}

export default function ExploreCard({ post }: ExploreCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  
  const profileImageUrl = `https://images.hive.blog/u/${post.author}/avatar`;

  return (
    <Link href={`/read/${post.slug}`}>
      <div className="group bg-white rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 overflow-visible cursor-pointer flex flex-col relative h-full" style={{ boxShadow: '0px 4px 4px 0px #00000040' }}>
        {/* Cover Image with Overlay Content */}
        <div className="relative w-full bg-gradient-to-br from-orange-400 to-amber-500 overflow-hidden rounded-t-xl sm:rounded-t-2xl h-[180px] sm:h-[220px] lg:h-[249.6px]">
          {/* Top Gradient Overlay for better text visibility */}
          <div className="absolute top-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-b from-black/70 to-transparent z-[1] pointer-events-none"></div>
          {post.coverImage && !imageError ? (
            <>
              {/* Loading Skeleton */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
              )}
              
              {/* Main Image */}
              {!useUnoptimized ? (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover group-hover:scale-105 transition-all duration-500 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="lazy"
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    if (!useUnoptimized) {
                      setUseUnoptimized(true);
                      setImageLoading(true);
                    } else {
                      setImageError(true);
                      setImageLoading(false);
                    }
                  }}
                  quality={75}
                />
              ) : (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover group-hover:scale-105 transition-all duration-500 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="lazy"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  quality={75}
                  unoptimized
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-amber-500">
              <svg className="w-16 h-16 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Overlay Content - Avatar, Username, and Payout */}
          <div className="absolute inset-0 p-2 sm:p-4 flex items-start justify-between z-10">
            {/* Left Side - Avatar, Username, and Rating */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
              {/* Circular Avatar */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {!avatarError ? (
                  <Image
                    src={profileImageUrl}
                    alt={post.author}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs" style={{ fontFamily: 'var(--font-lexend)' }}>
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Username */}
              <span className="text-white font-medium text-xs sm:text-sm drop-shadow-md truncate" style={{ fontFamily: 'var(--font-lexend)' }}>
                @{post.author}
              </span>
              {/* Rating */}
              {post.reputation && (
                <span className="text-white font-medium text-[10px] sm:text-xs drop-shadow-md flex-shrink-0" style={{ fontFamily: 'var(--font-lexend)' }}>
                  {post.reputation}
                </span>
              )}
            </div>

            {/* Right Side - Payout */}
            <div className="font-bold text-xs sm:text-sm drop-shadow-md flex-shrink-0 ml-2" style={{ fontFamily: 'var(--font-lexend)', color: '#E9FFC7' }}>
              {post.payout || '$0.00'}
            </div>
          </div>

        </div>

        {/* Like and Comment Ovals - Side by side on left, centered on border */}
        <div className="absolute left-2 sm:left-4 flex flex-row gap-1 sm:gap-2 z-20 top-[180px] sm:top-[220px] lg:top-[249.6px]" style={{ transform: 'translateY(-50%)' }}>
          {/* Like Oval */}
          <div className="rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1 sm:gap-2" style={{ fontFamily: 'var(--font-lexend)', backgroundColor: '#FFE6ED', boxShadow: '0px 2px 4px 0px #B6000026', border: '2px solid #AA2C504D' }}>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#DE2056' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs sm:text-sm font-normal" style={{ color: '#560018' }}>{post.votes !== undefined ? post.votes : 0}</span>
          </div>
          {/* Comment Oval */}
          <div className="rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1 sm:gap-2 shadow-md" style={{ fontFamily: 'var(--font-lexend)', backgroundColor: '#E4EDFF', border: '2px solid #18367233' }}>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3B79F4' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs sm:text-sm font-normal" style={{ color: '#001C55' }}>{post.comments !== undefined ? post.comments : 0}</span>
          </div>
        </div>

        {/* Date Oval - Right side, centered on border */}
        {post.created && (
          <div className="absolute right-2 sm:right-4 flex flex-row gap-2 z-20 top-[180px] sm:top-[220px] lg:top-[249.6px]" style={{ transform: 'translateY(-50%)' }}>
            <div className="rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center shadow-md" style={{ fontFamily: 'var(--font-lexend)', backgroundColor: '#E7E7E7', border: '2px solid #00000033' }}>
              <span className="text-xs sm:text-sm font-normal" style={{ color: '#000000' }}>
                {new Date(post.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        
        <div className="p-3 sm:p-4 pb-3 sm:pb-4 flex flex-col flex-1">
         
          <h3 className="text-base sm:text-lg font-medium mt-1 sm:mt-2 mb-1.5 sm:mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'var(--font-lexend)', color: '#592102' }}>
            {post.title}
          </h3>
          
          {/* Tags */}
          <div className="mt-auto">
            {post.tags && post.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-semibold italic"
                    style={{ fontFamily: 'var(--font-lexend)', color: '#2090EC' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-5 sm:h-6"></div>
            )}
          </div>
          
        </div>
      </div>
    </Link>
  );
}

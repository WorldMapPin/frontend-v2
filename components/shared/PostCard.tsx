'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PostCardProps {
  // Image props
  coverImage?: string | null;
  title: string;
  
  // User props
  username: string;
  reputation?: string | number | null;
  
  // Content props
  tags?: string[];
  
  // Stats props
  votes?: number;
  comments?: number;
  payout?: string;
  dateRelative?: string;
  date?: string; // For API posts
  
  // Additional props
  onClick?: () => void;
  showViewOnMap?: boolean;
  onViewOnMap?: () => void;
  postLink?: string;
  position?: {
    lat: number;
    lng: number;
  };
}

/**
 * Universal PostCard component - consistent design everywhere
 * Used by both ExploreCard and InfoWindowContent
 */
export default function PostCard({
  coverImage,
  title,
  username,
  reputation,
  tags = [],
  votes,
  comments,
  payout,
  dateRelative,
  date,
  onClick,
  showViewOnMap = false,
  onViewOnMap,
  postLink,
  position,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  
  // Limit tags to 3
  const displayTags = tags.slice(0, 3);
  
  // Format date for API posts - only show relative time for posts less than 7 days old
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Only show relative time if less than 7 days (604800 seconds)
    if (diffInSeconds < 604800) {
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    
    // For posts older than 7 days, show the actual date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const handleViewOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewOnMap) {
      onViewOnMap();
    } else if (position) {
      // Fallback to global map functions
      try {
        (window as any).setGlobalLocation?.({ location: position });
        (window as any).setGlobalZoom?.(18);
        (window as any).showLocationHighlight?.(position);
      } catch (error) {
        console.error('Error calling map functions:', error);
      }
    }
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (postLink) {
      window.open(postLink, '_blank');
    }
  };
  
  // Display date - prefer relative if available, else formatted
  const displayDate = dateRelative || (date ? formatDate(date) : '');
  
  return (
    <div 
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
      onClick={handleClick}
    >
      {/* Cover Image - Single optimized image with smooth fade-in */}
      <div className="relative w-full h-48 bg-gradient-to-br from-orange-400 to-amber-500 overflow-hidden">
        {coverImage && !imageError ? (
          <>
            {/* Loading Skeleton - Subtle shimmer effect */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              </div>
            )}
            
            {/* Main Image - Already optimized to 150x0 in hivePosts.ts */}
            {!useUnoptimized ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover group-hover:scale-105 transition-all duration-500 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                loading="lazy"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  // Try with unoptimized flag on error (likely unconfigured host)
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
                src={coverImage}
                alt={title}
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
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        
        {/* Author and Reputation */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">@{username}</span>
          {reputation !== undefined && reputation !== null ? (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {reputation}
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
              0
            </span>
          )}
        </div>
        
        {/* Tags */}
        {displayTags.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-3">
            {displayTags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-xs bg-blue-50 text-blue-400 px-2 py-1 rounded-full">
              #tags
            </span>
          </div>
        )}
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {votes !== undefined ? votes : 0}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comments !== undefined ? comments : 0}
            </span>
            {payout ? (
              <span className="font-medium text-green-600">{payout}</span>
            ) : (
              <span className="font-medium text-gray-400">$0</span>
            )}
          </div>
          {displayDate ? (
            <span className="text-xs text-gray-500">{displayDate}</span>
          ) : (
            <span className="text-xs text-gray-400">just now</span>
          )}
        </div>
        
        {/* View on Map Button */}
        {showViewOnMap && position && (
          <button
            onClick={handleViewOnMap}
            className="mt-3 w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>View on Map</span>
          </button>
        )}
      </div>
    </div>
  );
}


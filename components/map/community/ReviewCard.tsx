// Shared review card component for consistent styling
// This component is used by both single store and cluster views

import React from 'react';

interface DistriatorReview {
  id: string;
  username: string;
  permlink: string;
  photos: string[];
  reviewText: string;
  reviewBody: string;
  totalValue: string;
  invoiceId: string;
  created: string;
  reviewStatus: string;
  modifiedAt: string;
}

interface ReviewCardProps {
  review: DistriatorReview;
  index: number;
  onViewOnMap?: (coordinates: [number, number]) => void;
  storeCoordinates?: [number, number];
}

export const ReviewCard = ({ review, index, onViewOnMap, storeCoordinates }: ReviewCardProps) => {
  return (
    <div key={review.id || index} className="mobile-post-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-3">
      {/* Image Container */}
      <div className="relative aspect-[3/2] overflow-hidden">
        <a href={`https://hive.blog/@${review.username || 'unknown'}/${review.permlink || ''}`} target="_blank" rel="noopener noreferrer" className="block h-full">
          {review.photos && review.photos.length > 0 ? (
            <img
              src={review.photos[0]}
              alt=""
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/no-image-found.png';
              }}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <img
              src="/images/no-image-found.png"
              alt="Default Logo"
              className="w-full h-full object-cover"
            />
          )}
        </a>
        
        {/* Payment Badge Overlay */}
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {review.totalValue}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(review.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">@{review.username || 'unknown'}</h3>
              <p className="text-xs text-gray-500">{review.created ? new Date(review.created).toLocaleDateString() : 'Unknown date'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Invoice: {review.invoiceId || 'N/A'}</p>
          </div>
        </div>

        {/* Post Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {review.reviewText || 'Review'}
        </h2>

        {/* Post Body */}
        <div className="text-sm text-gray-700 mb-3 line-clamp-3">
          <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: (review.reviewBody || '').replace(/\n/g, '<br/>') 
            }}
          />
        </div>

        {/* Post Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {/* Removed status and photo count as requested */}
          </div>
          {onViewOnMap && storeCoordinates ? (
            <button
              onClick={() => onViewOnMap(storeCoordinates)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200"
            >
              View on Map
            </button>
          ) : (
            <a 
              href={`https://hive.blog/@${review.username}/${review.permlink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              View on Hive
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

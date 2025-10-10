// Specialized info window for Distriator business reviews
// This component handles displaying reviews for Distriator businesses

import React, { useState, useEffect, memo } from 'react';
import { Feature, Point } from 'geojson';
import { fetchMoreStoreReviews } from '../../../utils/distriatorApi';
import { ReviewCard } from './ReviewCard';

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

interface SpendHBDInfoWindowProps {
  features: Feature<Point>[];
  onBack?: () => void;
  onClose?: () => void; // Function to close the info window
  showBackButton?: boolean;
  onViewOnMap?: (coordinates: [number, number]) => void; // Function to zoom to location on map
  isCluster?: boolean; // New prop to indicate if this is from a cluster
}

export const SpendHBDInfoWindow = memo(({ 
  features, 
  onBack, 
  onClose,
  showBackButton = false,
  onViewOnMap,
  isCluster = false
}: SpendHBDInfoWindowProps) => {
  const [reviews, setReviews] = useState<DistriatorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  useEffect(() => {
    fetchDistriatorReviews();
  }, [features]);

  const fetchDistriatorReviews = async () => {
    if (!features[0]?.properties) return;
    
    setLoading(true);
    try {
      const businessId = features[0].properties.id;
      const initialReviews = features[0].properties.reviews || [];
      const reviewCount = features[0].properties.reviewCount || 0;
      
      setReviews(initialReviews);
      setHasMoreReviews(reviewCount > 10);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching Distriator reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!features[0]?.properties || !hasMoreReviews || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const businessId = features[0].properties.id;
      const nextPage = currentPage + 1;
      const moreReviews = await fetchMoreStoreReviews(businessId, nextPage);
      
      if (moreReviews.length > 0) {
        setReviews(prev => [...prev, ...moreReviews]);
        setCurrentPage(nextPage);
        setHasMoreReviews(moreReviews.length === 10); // If we got less than 10, no more reviews
      } else {
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setLoadingMore(false);
    }
  };


   if (loading) {
     return (
       <div className="p-6">
         <div className="flex items-center justify-center space-x-2">
           <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
           <span className="text-sm text-gray-600">
             Loading store reviews...
           </span>
         </div>
         <div className="mt-2 text-center">
           <span className="text-xs text-gray-500">
             Fetching customer reviews and store details
           </span>
         </div>
       </div>
     );
   }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      {/* Back Button - Top Left Corner */}
      {isCluster && showBackButton && onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full flex items-center justify-center transition-colors duration-200 z-10 shadow-md border border-white/20"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}


      {/* Store Information - Enhanced Design */}
      {features[0]?.properties && (
        <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {/* Store Image Header */}
          <div className="relative h-32 bg-gradient-to-br from-orange-400 to-orange-600">
            {features[0].properties.displayImage ? (
              <img 
                src={features[0].properties.displayImage} 
                alt={features[0].properties.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextSibling) nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${features[0].properties.displayImage ? 'hidden' : 'flex'}`}>
              <svg className="w-16 h-16 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M3 21h18l-1-7H4l-1 7z" />
                <path d="M4 14h16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7z" />
                <path d="M8 10h2v4H8z" />
                <path d="M14 10h2v4h-2z" />
                <path d="M10 2v4" />
                <path d="M14 2v4" />
              </svg>
            </div>
            
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Online Status Badge */}
            {features[0].properties.isOnline && (
              <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                Online
              </div>
            )}
            
            {/* Review Count Badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-bold shadow-md">
              {features[0].properties.reviewCount || 0} reviews
            </div>
          </div>

          {/* Store Details */}
          <div className="p-4">
            {/* Store Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{features[0].properties.name}</h2>
                <p className="text-orange-600 font-semibold text-sm">{features[0].properties.businessType}</p>
              </div>
              <div className="ml-4">
                {features[0].geometry?.coordinates && (
                  <a
                    href={`https://www.google.com/maps?q=${features[0].geometry.coordinates[1]},${features[0].geometry.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Open in Maps</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Store Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {features[0].properties.workTime && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-orange-500">🕒</span>
                  <span className="text-gray-700 font-medium">{features[0].properties.workTime}</span>
                </div>
              )}
              {features[0].properties.phone && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-orange-500">📞</span>
                  <span className="text-gray-700 font-medium">{features[0].properties.phone}</span>
                </div>
              )}
              {features[0].properties.email && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg col-span-full">
                  <span className="text-orange-500">✉️</span>
                  <span className="text-gray-700 font-medium">{features[0].properties.email}</span>
                </div>
              )}
              {features[0].properties.address && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg col-span-full">
                  <span className="text-orange-500">📍</span>
                  <span className="text-gray-700 font-medium">
                    {features[0].properties.address.city}, {features[0].properties.address.country}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Store Reviews Section */}
      <div className="mt-8">
        {/* Section Divider */}
        

        {reviews.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
              <span className="text-sm text-gray-500">{features[0]?.properties?.reviewCount || 0} total review{(features[0]?.properties?.reviewCount || 0) !== 1 ? 's' : ''}</span>
            </div>
          
          {/* Reviews List - Using shared ReviewCard component */}
          <div className="space-y-4">
            {reviews.map((review, index) => {
              // Get store coordinates from the first feature
              const storeCoordinates = features[0]?.geometry?.coordinates as [number, number];
              return (
                <ReviewCard 
                  key={review.id || index} 
                  review={review} 
                  index={index}
                  onViewOnMap={onViewOnMap}
                  storeCoordinates={storeCoordinates}
                />
              );
            })}
          </div>

          {/* Load More Reviews Button */}
          {hasMoreReviews && (
            <div className="text-center py-4">
              <button
                onClick={loadMoreReviews}
                disabled={loadingMore}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More Reviews'
                )}
              </button>
            </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No reviews available for this store</p>
          </div>
        )}
      </div>
    </div>
  );
});

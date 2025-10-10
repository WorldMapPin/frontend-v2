// Cluster info window for SpendHBD stores
// This component shows a list of stores in a cluster with details and selection options

import React, { useState, useEffect, memo } from 'react';
import { Feature, Point } from 'geojson';
import { ReviewCard } from './ReviewCard';
import { fetchMoreStoreReviews } from '../../../utils/distriatorApi';

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

interface StoreInfo {
  id: string;
  coordinates: [number, number];
  count: number;
  name: string;
  businessType?: string;
  displayImage?: string;
  workTime?: string;
  isOnline?: boolean;
  email?: string;
  phone?: string;
  address?: any;
  reviewCount?: number;
  reviews?: DistriatorReview[];
  features: Feature<Point>[];
}

interface SpendHBDClusterInfoProps {
  features: Feature<Point>[];
  onStoreSelect: (store: StoreInfo) => void;
  onClose: () => void;
  onViewOnMap?: (coordinates: [number, number]) => void; // Function to zoom to location on map
}

export const SpendHBDClusterInfo = memo(({ 
  features, 
  onStoreSelect, 
  onClose,
  onViewOnMap
}: SpendHBDClusterInfoProps) => {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null);
  const [reviews, setReviews] = useState<DistriatorReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  useEffect(() => {
    processClusterFeatures();
  }, [features]);

  const processClusterFeatures = () => {
    const storeMap = new Map<string, StoreInfo>();
    
    features.forEach((feature, index) => {
      const [lng, lat] = feature.geometry.coordinates;
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      
      if (storeMap.has(key)) {
        // Add to existing store
        const store = storeMap.get(key)!;
        store.count += feature.properties?.groupedCount || 1;
        store.features.push(feature);
      } else {
        // Create new store with real data
        const storeCount = feature.properties?.groupedCount || 1;
        const storeName = feature.properties?.name || `Store ${storeMap.size + 1}`;
        
        storeMap.set(key, {
          id: feature.id as string,
          coordinates: [lng, lat],
          count: storeCount,
          name: storeName,
          businessType: feature.properties?.businessType,
          displayImage: feature.properties?.displayImage,
          workTime: feature.properties?.workTime,
          isOnline: feature.properties?.isOnline,
          email: feature.properties?.email,
          phone: feature.properties?.phone,
          address: feature.properties?.address,
          reviewCount: feature.properties?.reviewCount || 0,
          reviews: feature.properties?.reviews || [],
          features: [feature]
        });
      }
    });
    
    const storeList = Array.from(storeMap.values());
    setStores(storeList);
  };

  const handleStoreClick = (store: StoreInfo) => {
    setSelectedStore(store);
    setReviews(store.reviews || []);
    setCurrentPage(1);
    setHasMoreReviews((store.reviewCount || 0) > 10);
    // Scroll to top when viewing reviews
    setTimeout(() => {
      const container = document.querySelector('.max-h-\\[70vh\\]');
      if (container) {
        container.scrollTop = 0;
      }
    }, 100);
  };

  const loadMoreReviews = async () => {
    if (!selectedStore || !hasMoreReviews || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreReviews = await fetchMoreStoreReviews(selectedStore.id, nextPage);
      
      if (moreReviews.length > 0) {
        setReviews(prev => [...prev, ...moreReviews]);
        setCurrentPage(nextPage);
        setHasMoreReviews(moreReviews.length === 10);
      } else {
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleBackToStores = () => {
    setSelectedStore(null);
    setReviews([]);
  };

  const getStoreColor = (count: number) => {
    if (count === 1) return 'single';
    if (count <= 3) return 'low';
    if (count <= 10) return 'medium';
    if (count <= 25) return 'high';
    return 'veryHigh';
  };

  const getStoreSize = (count: number) => {
    if (count === 1) return 'sizeSingle';
    if (count <= 3) return 'sizeSmall';
    if (count <= 10) return 'sizeMedium';
    if (count <= 25) return 'sizeLarge';
    return 'sizeVeryLarge';
  };

  return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
      {/* Back Button - Top Left Corner */}
      {selectedStore && (
        <button
          onClick={handleBackToStores}
          className="absolute top-4 left-4 w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full flex items-center justify-center transition-colors duration-200 z-10 shadow-md border border-white/20"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Header - Only show when not viewing individual store */}
      {!selectedStore && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  SpendHBD Cluster
                </h3>
                <p className="text-sm text-gray-600">
                  {stores.length} stores in this area
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content - Either stores list or reviews */}
      {selectedStore ? (
        // Reviews Section
        <div>
          {/* Store Info - Enhanced Design */}
          <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {/* Store Image Header */}
            <div className="relative h-32 bg-gradient-to-br from-orange-400 to-orange-600">
              {selectedStore.displayImage ? (
                <img 
                  src={selectedStore.displayImage} 
                  alt={selectedStore.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextSibling) nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${selectedStore.displayImage ? 'hidden' : 'flex'}`}>
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
              {selectedStore.isOnline && (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                  Online
                </div>
              )}
              
            {/* Review Count Badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-bold shadow-md">
              {selectedStore.reviewCount || 0} reviews
            </div>
            </div>

            {/* Store Details */}
            <div className="p-4">
              {/* Store Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedStore.name}</h2>
                  <p className="text-orange-600 font-semibold text-sm">{selectedStore.businessType}</p>
                </div>
                <div className="ml-4">
                  {selectedStore.coordinates && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedStore.coordinates[1]},${selectedStore.coordinates[0]}`}
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
                {selectedStore.workTime && (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <span className="text-orange-500">🕒</span>
                    <span className="text-gray-700 font-medium">{selectedStore.workTime}</span>
                  </div>
                )}
                {selectedStore.phone && (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <span className="text-orange-500">📞</span>
                    <span className="text-gray-700 font-medium">{selectedStore.phone}</span>
                  </div>
                )}
                {selectedStore.email && (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg col-span-full">
                    <span className="text-orange-500">✉️</span>
                    <span className="text-gray-700 font-medium">{selectedStore.email}</span>
                  </div>
                )}
                {selectedStore.address && (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg col-span-full">
                    <span className="text-orange-500">📍</span>
                    <span className="text-gray-700 font-medium">
                      {selectedStore.address.city}, {selectedStore.address.country}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Store Reviews Section */}
          <div className="mt-8">
            {/* Section Divider */}
            

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
              <span className="text-sm text-gray-500">{selectedStore.reviewCount || 0} total review{(selectedStore.reviewCount || 0) !== 1 ? 's' : ''}</span>
            </div>

            {/* Reviews List - Using shared ReviewCard component */}
            <div className="space-y-4">
            {reviews.map((review, index) => (
              <ReviewCard 
                key={review.id || index} 
                review={review} 
                index={index}
                onViewOnMap={onViewOnMap}
                storeCoordinates={selectedStore.coordinates}
              />
            ))}
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
        </div>
      ) : (
        // Stores List - Using new post style
        <div className="space-y-4">
          {stores.map((store, index) => (
            <div
              key={store.id}
              onClick={() => handleStoreClick(store)}
              className="mobile-post-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
            >
              {/* Image Container - More compact */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {store.displayImage ? (
                  <img
                    src={store.displayImage}
                    alt={store.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/no-image-found.png';
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M3 21h18l-1-7H4l-1 7z" />
                      <path d="M4 14h16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7z" />
                      <path d="M8 10h2v4H8z" />
                      <path d="M14 10h2v4h-2z" />
                      <path d="M10 2v4" />
                      <path d="M14 2v4" />
                    </svg>
                  </div>
                )}
                
                {/* Review Count Badge Overlay */}
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {store.reviewCount || 0} reviews
                </div>
                
                {/* Online Status Badge */}
                {store.isOnline && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Online
                  </div>
                )}
              </div>

              {/* Store Content - More compact */}
              <div className="p-3">
                {/* Store Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {store.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{store.name}</h3>
                      <p className="text-xs text-orange-600 font-medium truncate">{store.businessType || 'Business'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      {store.reviewCount || 0} reviews
                    </div>
                  </div>
                </div>

                {/* Store Details - Compact grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  {store.workTime && (
                    <div className="flex items-center space-x-1">
                      <span className="text-orange-500">🕒</span>
                      <span className="truncate">{store.workTime}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center space-x-1">
                      <span className="text-orange-500">📞</span>
                      <span className="truncate">{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center space-x-1 col-span-2">
                      <span className="text-orange-500">✉️</span>
                      <span className="truncate">{store.email}</span>
                    </div>
                  )}
                  {store.address && (
                    <div className="flex items-center space-x-1 col-span-2">
                      <span className="text-orange-500">📍</span>
                      <span className="truncate">{store.address.city}, {store.address.country}</span>
                    </div>
                  )}
                </div>

                {/* Store Footer - Compact */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {store.isOnline && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Online
                      </span>
                    )}
                  </div>
                  <span className="text-orange-500 hover:text-orange-600 font-bold text-xs">
                    View Reviews →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Click on any store to view its HBD purchase posts
        </p>
      </div>
    </div>
  );
});

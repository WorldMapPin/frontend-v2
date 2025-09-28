// Distriator API service for fetching HBD store data
// This module handles API calls to the Distriator business API

import axios from 'axios';
import { loadTempData, saveTempData, hasTempData, TempDistriatorData } from './tempDataManager';

// Distriator API types
export interface DistriatorBusiness {
  id: string;
  profile: {
    displayName: string;
    displayImage?: string;
    businessType?: string;
    workTime?: string;
    isOnline: boolean;
    images: string[];
  };
  contact: {
    email?: string;
    phone?: string;
    notes?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  location: {
    pin: {
      latitude: number;
      longitude: number;
    };
    address: {
      address1?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

export interface DistriatorReview {
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

export interface DistriatorApiResponse {
  data: DistriatorBusiness[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DistriatorReviewsResponse {
  data: DistriatorReview[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Result of fetching Distriator businesses with reviews
export interface DistriatorFetchResult {
  mappedStores: DistriatorBusiness[];
  unmappedStores: DistriatorBusiness[];
  allStores: DistriatorBusiness[];
  storeReviews: Map<string, DistriatorReview[]>;
  reviewCounts: Map<string, number>;
}

/**
 * Fetches all businesses from Distriator API with pagination and their reviews
 * @returns Promise<DistriatorFetchResult> - Complete result with mapped/unmapped stores and reviews
 */
export async function fetchAllDistriatorBusinesses(): Promise<DistriatorFetchResult> {
  // Check if we have temporary data available
  if (hasTempData()) {
    console.log('📂 Using temporary data for faster development...');
    const tempData = loadTempData();
    if (tempData) {
      return {
        mappedStores: tempData.mappedStores,
        unmappedStores: tempData.unmappedStores,
        allStores: tempData.allStores,
        storeReviews: new Map(Object.entries(tempData.storeReviews)),
        reviewCounts: new Map(Object.entries(tempData.reviewCounts))
      };
    }
  }

  console.log('🌐 Fetching fresh data from Distriator API...');
  const allStores: DistriatorBusiness[] = [];
  const mappedStores: DistriatorBusiness[] = [];
  const unmappedStores: DistriatorBusiness[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  const pageSize = 20; // Maximum page size allowed by Distriator API

  try {
    // First, fetch all businesses
    while (hasNextPage) {
      console.log(`Fetching Distriator businesses page ${currentPage}...`);
      
      try {
        const response = await axios.get<DistriatorApiResponse>(
          `https://beta-api.distriator.com/business/paginated?page=${currentPage}&pageSize=${pageSize}`
        );

        const { data, pagination } = response.data;
        
        // Add all businesses to the complete list
        allStores.push(...data);
        
        // Separate mapped and unmapped businesses
        data.forEach(business => {
          if (business.location.pin.latitude && 
              business.location.pin.longitude &&
              business.location.pin.latitude !== 0 &&
              business.location.pin.longitude !== 0) {
            mappedStores.push(business);
          } else {
            unmappedStores.push(business);
          }
        });
        
        console.log(`Page ${currentPage}: ${mappedStores.length} mapped, ${unmappedStores.length} unmapped businesses (${data.length} total)`);
        
        hasNextPage = pagination.hasNextPage;
        currentPage++;
        
        // Add a small delay to avoid overwhelming the API
        if (hasNextPage) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (pageError) {
        console.error(`Error fetching page ${currentPage}:`, pageError);
        // If it's a 400 error, it might be that we've reached the end
        if (axios.isAxiosError(pageError) && pageError.response?.status === 400) {
          console.log('Received 400 error, assuming we\'ve reached the end of data');
          break;
        }
        // For other errors, continue to next page
        currentPage++;
        if (currentPage > 100) { // Safety limit
          console.log('Reached safety limit of 100 pages, stopping');
          break;
        }
      }
    }

            console.log(`Fetched ${allStores.length} total stores: ${mappedStores.length} mapped, ${unmappedStores.length} unmapped`);

            // Now fetch reviews for mapped stores only (in batches of 10)
            console.log('Fetching reviews for mapped stores...');
            const { storeReviews, reviewCounts } = await fetchMultipleStoreReviews(mappedStores.map(s => s.id));

            const result = {
              mappedStores,
              unmappedStores,
              allStores,
              storeReviews,
              reviewCounts
            };

            // Save to temporary storage for faster development
            console.log('💾 Saving data to temporary storage...');
            saveTempData({
              mappedStores,
              unmappedStores,
              allStores,
              storeReviews: Object.fromEntries(storeReviews),
              reviewCounts: Object.fromEntries(reviewCounts),
              lastUpdated: new Date().toISOString()
            });

            return result;
  } catch (error) {
    console.error('Error fetching Distriator businesses:', error);
    // Return whatever we managed to fetch so far
    if (allStores.length > 0) {
      console.log(`Returning ${allStores.length} stores that were successfully fetched`);
      return {
        mappedStores,
        unmappedStores,
        allStores,
        storeReviews: new Map(),
        reviewCounts: new Map()
      };
    }
    throw error;
  }
}

/**
 * Fetches reviews for a specific business
 * @param businessId - The business ID to fetch reviews for
 * @returns Promise<number> - Total number of reviews
 */
export async function fetchBusinessReviewCount(businessId: string): Promise<number> {
  try {
    const response = await axios.get<DistriatorReviewsResponse>(
      `https://beta-api.distriator.com/review/paginated?business-id=${businessId}&page=1&pageSize=1`
    );
    
    return response.data.pagination.totalRecords;
  } catch (error) {
    console.error(`Error fetching reviews for business ${businessId}:`, error);
    return 0; // Return 0 if reviews can't be fetched
  }
}

/**
 * Fetches 10 reviews for a specific business
 * @param businessId - The business ID to fetch reviews for
 * @returns Promise<DistriatorReview[]> - Array of reviews (up to 10)
 */
export async function fetchStoreReviews(businessId: string): Promise<DistriatorReview[]> {
  try {
    const response = await axios.get<DistriatorReviewsResponse>(
      `https://beta-api.distriator.com/review/paginated?business-id=${businessId}&page=1&pageSize=10`
    );
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching reviews for business ${businessId}:`, error);
    return []; // Return empty array if reviews can't be fetched
  }
}

/**
 * Fetches reviews for multiple businesses in batches of 10
 * @param businessIds - Array of business IDs to fetch reviews for
 * @returns Promise<{storeReviews: Map<string, DistriatorReview[]>, reviewCounts: Map<string, number>}> - Maps of reviews and counts
 */
export async function fetchMultipleStoreReviews(businessIds: string[]): Promise<{
  storeReviews: Map<string, DistriatorReview[]>;
  reviewCounts: Map<string, number>;
}> {
  const storeReviews = new Map<string, DistriatorReview[]>();
  const reviewCounts = new Map<string, number>();
  
  // Process in batches of 10 to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < businessIds.length; i += batchSize) {
    const batch = businessIds.slice(i, i + batchSize);
    
    const promises = batch.map(async (businessId) => {
      try {
        const reviews = await fetchStoreReviews(businessId);
        const count = await fetchBusinessReviewCount(businessId);
        return { businessId, reviews, count };
      } catch (error) {
        console.error(`Error fetching reviews for business ${businessId}:`, error);
        return { businessId, reviews: [], count: 0 };
      }
    });
    
    try {
      const results = await Promise.all(promises);
      results.forEach(({ businessId, reviews, count }) => {
        storeReviews.set(businessId, reviews);
        reviewCounts.set(businessId, count);
      });
      
      console.log(`Fetched reviews for batch ${Math.floor(i/batchSize) + 1}: ${results.length} stores`);
    } catch (error) {
      console.error(`Error fetching reviews for batch starting at ${i}:`, error);
      // Continue with other batches even if one fails
    }
    
    // Add delay between batches to be respectful to the API
    if (i + batchSize < businessIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { storeReviews, reviewCounts };
}

/**
 * Fetches additional reviews for a business (for load more functionality)
 * @param businessId - The business ID to fetch more reviews for
 * @param page - Page number to fetch (1-based)
 * @returns Promise<DistriatorReview[]> - Array of reviews for the page
 */
export async function fetchMoreStoreReviews(businessId: string, page: number): Promise<DistriatorReview[]> {
  try {
    const response = await axios.get<DistriatorReviewsResponse>(
      `https://beta-api.distriator.com/review/paginated?business-id=${businessId}&page=${page}&pageSize=10`
    );
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching more reviews for business ${businessId}, page ${page}:`, error);
    return []; // Return empty array if reviews can't be fetched
  }
}

/**
 * Fetches reviews for multiple businesses in parallel (legacy function for review counts)
 * @param businessIds - Array of business IDs to fetch review counts for
 * @returns Promise<Map<string, number>> - Map of business ID to review count
 */
export async function fetchMultipleBusinessReviewCounts(businessIds: string[]): Promise<Map<string, number>> {
  const reviewCounts = new Map<string, number>();
  
  // Process in smaller batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < businessIds.length; i += batchSize) {
    const batch = businessIds.slice(i, i + batchSize);
    
    const promises = batch.map(async (businessId) => {
      try {
        const count = await fetchBusinessReviewCount(businessId);
        return { businessId, count };
      } catch (error) {
        console.error(`Error fetching review count for business ${businessId}:`, error);
        return { businessId, count: 0 };
      }
    });
    
    try {
      const results = await Promise.all(promises);
      results.forEach(({ businessId, count }) => {
        reviewCounts.set(businessId, count);
      });
    } catch (error) {
      console.error(`Error fetching review counts for batch starting at ${i}:`, error);
      // Continue with other batches even if one fails
    }
    
    // Add delay between batches to be respectful to the API
    if (i + batchSize < businessIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return reviewCounts;
}

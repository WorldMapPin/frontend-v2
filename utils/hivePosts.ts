// Hive post fetching with batching and caching
import { CuratedPost, ProcessedPost, HivePostRaw, PostCache } from '@/types/post';
import {
  parsePeakDUrl,
  formatReputation,
  formatRelativeTime,
  calculateReadingTime,
  formatPayout,
  getHiveBlogUrl,
  safeJsonParse
} from './postUtils';

// In-memory cache for posts
const postCache: PostCache = {};
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// LocalStorage cache key
const STORAGE_KEY = 'hive_posts_cache';

/**
 * Optimize image URL using Ecency's image proxy with smaller sizes for faster loading
 * Ecency automatically serves optimized WebP when supported
 * @param imageUrl - Original image URL
 * @param size - Size preset: 'thumb' (150x0), 'small' (256x512), 'medium' (400x0), 'large' (600x0)
 * @returns Optimized Ecency proxy URL or original URL if already optimized
 */
function optimizeImageUrl(imageUrl: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'thumb'): string {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  
  // Size mapping for Ecency proxy
  const sizeMap = {
    thumb: '150x0',    // Fast loading thumbnails
    small: '256x512',  // Small previews
    medium: '400x0',   // Medium quality
    large: '600x0'     // High quality
  };
  
  const ecencySize = sizeMap[size];
  
  // If already using Ecency proxy, update the size
  if (imageUrl.includes('images.ecency.com')) {
    return imageUrl.replace(/\/\d+x\d+\//, `/${ecencySize}/`);
  }
  
  // CDN sources that are already optimized - use as is
  const trustedCDNs = [
    'files.peakd.com',
    'cdn.steemitimages.com',
    'images.hive.blog',
    'img.leopedia.io'
  ];
  
  // Check if image is from trusted CDN - return original URL
  if (trustedCDNs.some(cdn => imageUrl.includes(cdn))) {
    return imageUrl;
  }
  
  // For other sources, proxy through Ecency for optimization
  return `https://images.ecency.com/${ecencySize}/${imageUrl}`;
}

/**
 * Save cache to localStorage
 */
function saveCacheToStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(postCache));
  } catch (error) {
    console.error('Error saving cache to localStorage:', error);
  }
}

/**
 * Load cache from localStorage
 */
function loadCacheFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      Object.assign(postCache, parsedCache);
    }
  } catch (error) {
    console.error('Error loading cache from localStorage:', error);
  }
}

// Load cache on module initialization
if (typeof window !== 'undefined') {
  loadCacheFromStorage();
}

/**
 * Fetch a single post from Hive blog via API route
 */
async function fetchSinglePost(author: string, permlink: string): Promise<ProcessedPost | null> {
  const cacheKey = `${author}/${permlink}`;
  
  // Check in-memory cache
  const cached = postCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.post;
  }
  
  try {
    // Use Next.js API route to avoid CORS issues
    const apiUrl = `/api/hive-post?author=${encodeURIComponent(author)}&permlink=${encodeURIComponent(permlink)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch post: ${author}/${permlink}`);
      return null;
    }
    
    const data: HivePostRaw = await response.json();
    const post = data.post;
    
    if (!post) {
      console.error(`Post not found: ${author}/${permlink}`);
      return null;
    }
    
    // Parse metadata safely
    const metadata = safeJsonParse(post.json_metadata);
    
    // Get cover image - use first valid image from the image array
    let coverImage = null;
    
    if (metadata.image && Array.isArray(metadata.image) && metadata.image.length > 0) {
      // Find first valid HTTP/HTTPS URL in the images array
      const originalImage = metadata.image.find((img: any) => 
        typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
      );
      
      // Optimize image URL using Ecency proxy for faster loading
      coverImage = originalImage ? optimizeImageUrl(originalImage, 'thumb') : null;
    }
    
    // Calculate payout: use pending_payout_value first, fallback to total_payout_value if pending is 0
    const pendingPayout = parseFloat(post.pending_payout_value || '0');
    const payoutValue = pendingPayout > 0 
      ? post.pending_payout_value 
      : (post.total_payout_value || post.pending_payout_value || '0');
    
    // Process the post
    const processedPost: ProcessedPost = {
      title: post.title || 'Untitled',
      author: post.author,
      permlink: post.permlink,
      created: post.created,
      createdRelative: formatRelativeTime(post.created),
      coverImage: coverImage,
      tags: metadata.tags || [],
      payout: formatPayout(payoutValue),
      votes: post.net_votes,
      comments: post.children,
      reputation: formatReputation(post.author_reputation),
      slug: `@${post.author}/${post.permlink}`,
      bodyMarkdown: post.body,
      images: metadata.image || [],
      readingTimeMin: calculateReadingTime(post.body),
      cashoutTime: post.cashout_time,
      activeVotesCount: post.active_votes?.length || 0,
      canonicalUrl: `https://peakd.com/@${post.author}/${post.permlink}`,
      rawJsonUrl: getHiveBlogUrl(post.author, post.permlink)
    };
    
    // Cache the post
    postCache[cacheKey] = {
      post: processedPost,
      timestamp: Date.now()
    };
    
    saveCacheToStorage();
    
    return processedPost;
  } catch (error) {
    console.error(`Error fetching post ${author}/${permlink}:`, error);
    return null;
  }
}

/**
 * Fetch multiple posts with concurrency limit
 */
export async function fetchPosts(
  curatedPosts: CuratedPost[],
  concurrency: number = 6
): Promise<ProcessedPost[]> {
  const results: ProcessedPost[] = [];
  const queue = [...curatedPosts];
  
  // Process posts in batches with concurrency limit
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchPromises = batch.map(curatedPost => 
      fetchSinglePost(curatedPost.author, curatedPost.permlink)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out null results (failed fetches)
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }
  }
  
  return results;
}

/**
 * Fetch multiple posts with progressive rendering (shows posts as they arrive)
 * This provides much faster perceived performance by streaming results
 */
export async function fetchPostsProgressive(
  curatedPosts: CuratedPost[],
  onBatchComplete: (newPosts: ProcessedPost[]) => void,
  concurrency: number = 10
): Promise<ProcessedPost[]> {
  const results: ProcessedPost[] = [];
  const queue = [...curatedPosts];
  
  // Process posts in batches with concurrency limit
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchPromises = batch.map(curatedPost => 
      fetchSinglePost(curatedPost.author, curatedPost.permlink)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out null results (failed fetches)
    const validResults = batchResults.filter(r => r !== null) as ProcessedPost[];
    
    if (validResults.length > 0) {
      results.push(...validResults);
      // Immediately notify caller so UI can update
      onBatchComplete(validResults);
    }
  }
  
  return results;
}

/**
 * Fetch a single post with retry logic
 */
export async function fetchPostWithRetry(
  author: string,
  permlink: string,
  maxRetries: number = 3
): Promise<ProcessedPost | null> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const post = await fetchSinglePost(author, permlink);
      if (post) return post;
    } catch (error) {
      lastError = error;
      console.log(`Retry ${attempt + 1}/${maxRetries} for ${author}/${permlink}`);
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  console.error(`Failed to fetch post after ${maxRetries} attempts:`, lastError);
  return null;
}

/**
 * Load curated posts from JSON file
 */
export async function loadCuratedPosts(): Promise<CuratedPost[]> {
  try {
    const response = await fetch('/data/curated_posts.json');
    if (!response.ok) {
      throw new Error('Failed to load curated posts');
    }
    
    const posts: CuratedPost[] = await response.json();
    
    // Parse URLs if author/permlink are missing
    return posts.map(post => {
      if (!post.author || !post.permlink) {
        const parsed = parsePeakDUrl(post.url);
        if (parsed) {
          return {
            ...post,
            author: parsed.author,
            permlink: parsed.permlink
          };
        }
      }
      return post;
    });
  } catch (error) {
    console.error('Error loading curated posts:', error);
    return [];
  }
}

/**
 * Clear the post cache
 */
export function clearCache() {
  Object.keys(postCache).forEach(key => delete postCache[key]);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Cache cleared! Refresh the page to fetch fresh posts.');
  }
}

// Make clearCache available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearHiveCache = clearCache;
}

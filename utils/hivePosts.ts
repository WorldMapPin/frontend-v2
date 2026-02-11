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

// Max entries to persist in localStorage (keeps size well under 5 MB quota)
const MAX_STORAGE_ENTRIES = 100;

/**
 * Save cache to localStorage.
 * - Strips heavy fields (bodyMarkdown, images) to keep payload small.
 */
function saveCacheToStorage() {
  if (typeof window === 'undefined') return;
  try {
    // Build a lightweight copy: drop bodyMarkdown & images arrays
    let entries = Object.entries(postCache);

    // Keep only the newest MAX_STORAGE_ENTRIES entries
    if (entries.length > MAX_STORAGE_ENTRIES) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      entries = entries.slice(0, MAX_STORAGE_ENTRIES);
    }

    const lightweight: Record<string, { post: any; timestamp: number }> = {};
    for (const [key, value] of entries) {
      const { bodyMarkdown, images, ...rest } = value.post;
      lightweight[key] = { post: rest, timestamp: value.timestamp };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
  } catch (error) {
    // Quota exceeded — prune half and retry once
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        const entries = Object.entries(postCache)
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, Math.floor(MAX_STORAGE_ENTRIES / 2));

        const lightweight: Record<string, { post: any; timestamp: number }> = {};
        for (const [key, value] of entries) {
          const { bodyMarkdown, images, ...rest } = value.post;
          lightweight[key] = { post: rest, timestamp: value.timestamp };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
      } catch {
        // Still failing — clear it entirely so the app keeps working
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      console.error('Error saving cache to localStorage:', error);
    }
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
    // Corrupted cache — remove it
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}

// If the stored cache is over 2 MB it was written by the old un-trimmed logic
// — clear it so we start fresh with the lightweight format.
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw.length > 2 * 1024 * 1024) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      loadCacheFromStorage();
    }
  } catch {
    loadCacheFromStorage();
  }
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
    const apiUrl = `/api/hive/post?author=${encodeURIComponent(author)}&permlink=${encodeURIComponent(permlink)}`;
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
    
  
    const cleanImageUrl = (url: string): string | null => {
      if (!url || typeof url !== 'string') return null;
      
      // Handle Ecency format: [![](url)](url) - extract the first URL
      const ecencyMatch = url.match(/\[!\[\]\(([^)]+)\)\]\([^)]+\)/);
      if (ecencyMatch && ecencyMatch[1]) {
        const extractedUrl = ecencyMatch[1];
        if (extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://')) {
          return extractedUrl;
        }
      }
      
      // Handle standard markdown image: ![alt](url)
      const markdownImgMatch = url.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (markdownImgMatch && markdownImgMatch[1]) {
        const extractedUrl = markdownImgMatch[1];
        if (extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://')) {
          return extractedUrl;
        }
      }
      
      // Handle markdown link: [url](url) or [text](url)
      const markdownLinkMatch = url.match(/\[[^\]]*\]\(([^)]+)\)/);
      if (markdownLinkMatch && markdownLinkMatch[1]) {
        const extractedUrl = markdownLinkMatch[1];
        if (extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://')) {
          return extractedUrl;
        }
      }
      
      // Handle malformed URLs with "](" - take the part before it
      if (url.includes('](')) {
        const beforeBracket = url.split('](')[0];
        if (beforeBracket.startsWith('http://') || beforeBracket.startsWith('https://')) {
          return beforeBracket;
        }
      }
      
      // Handle plain URLs - validate they start with http:// or https://
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      return null;
    };
    
    /**
     * Extract the first image URL from markdown or HTML body as fallback
     * Looks for patterns like ![alt](url), HTML <img> tags, or standalone URLs
     * Also handles InLeo format and travel digest posts with HTML content
     */
    const extractFirstImageFromBody = (body: string): string | null => {
      if (!body) return null;
      
      // Priority 1: Match markdown image: ![...](url) - capture the URL
      const imgMatch = body.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
      
      // Priority 2: Match HTML img tags (for travel digest posts and HTML content)
      // Handle both single and double quotes, and various attribute orders
      const htmlImgMatch = body.match(/<img[^>]*\ssrc=['"']([^'"]+)['"']/) ||
                           body.match(/<img[^>]*\ssrc='([^']+)'/) ||
                           body.match(/<img[^>]*\ssrc="([^"]+)"/) ||
                           body.match(/<img[^>]*src=['"']([^'"]+)['"']/) ||
                           body.match(/<img[^>]*src='([^']+)'/) ||
                           body.match(/<img[^>]*src="([^"]+)"/);
      if (htmlImgMatch && htmlImgMatch[1]) {
        const url = htmlImgMatch[1];
        // Validate it's a proper HTTP/HTTPS URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
      }
      
      // Priority 3: Match standalone image URL on its own line (handles InLeo format with leading/trailing whitespace)
      const standaloneMatch = body.match(/^\s*(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))\s*$/im);
      if (standaloneMatch && standaloneMatch[1]) {
        return standaloneMatch[1];
      }
      
      // Priority 4: Match InLeo/Leopedia images specifically (they may not have standard extensions)
      const leopediaMatch = body.match(/^\s*(https?:\/\/img\.leopedia\.io\/[^\s]+)\s*$/im);
      if (leopediaMatch && leopediaMatch[1]) {
        return leopediaMatch[1];
      }
      
      return null;
    };
    
    // Try to get cover image from metadata.image or metadata.images array first
    // Note: Some platforms use 'image' (Ecency, PeakD), others use 'images' (InLeo)
    const imageArray = metadata.image || metadata.images;
    if (imageArray && Array.isArray(imageArray) && imageArray.length > 0) {
      // Find first valid HTTP/HTTPS URL in the images array
      for (const img of imageArray) {
        const cleanedUrl = cleanImageUrl(img);
        if (cleanedUrl) {
          coverImage = optimizeImageUrl(cleanedUrl, 'thumb');
          break;
        }
      }
    }
    
    // Fallback: extract first image from post body if metadata didn't have valid images
    if (!coverImage && post.body) {
      const bodyImage = extractFirstImageFromBody(post.body);
      if (bodyImage) {
        coverImage = optimizeImageUrl(bodyImage, 'thumb');
      }
    }

    // For crossposts: if no cover image found, try fetching from original post
    if (!coverImage && metadata.original_author && metadata.original_permlink) {
      try {
        const originalApiUrl = `/api/hive/post?author=${encodeURIComponent(metadata.original_author)}&permlink=${encodeURIComponent(metadata.original_permlink)}`;
        const originalResponse = await fetch(originalApiUrl, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (originalResponse.ok) {
          const originalData = await originalResponse.json();
          if (originalData.post) {
            const originalPost = originalData.post;
            const originalMetadata = safeJsonParse(originalPost.json_metadata);

            // Try original post metadata images
            const originalImageArray = originalMetadata.image || originalMetadata.images;
            if (originalImageArray && Array.isArray(originalImageArray) && originalImageArray.length > 0) {
              for (const img of originalImageArray) {
                const cleanedUrl = cleanImageUrl(img);
                if (cleanedUrl) {
                  coverImage = optimizeImageUrl(cleanedUrl, 'thumb');
                  break;
                }
              }
            }

            // Try original post body images
            if (!coverImage && originalPost.body) {
              const originalBodyImage = extractFirstImageFromBody(originalPost.body);
              if (originalBodyImage) {
                coverImage = optimizeImageUrl(originalBodyImage, 'thumb');
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error fetching original post cover image for crosspost @${metadata.original_author}/${metadata.original_permlink}:`, error);
      }
    }
    
    // Calculate payout: show pending amount while active, otherwise combine author + curator payouts
    const pendingPayout = parseFloat(post.pending_payout_value || '0');
    let payoutValue: string;

    if (pendingPayout > 0) {
      payoutValue = post.pending_payout_value || '0';
    } else {
      const totalPayoutRaw = parseFloat(post.total_payout_value || '0');
      const curatorPayoutRaw = parseFloat(post.curator_payout_value || '0');
      const totalPayout = isNaN(totalPayoutRaw) ? 0 : totalPayoutRaw;
      const curatorPayout = isNaN(curatorPayoutRaw) ? 0 : curatorPayoutRaw;
      const combinedPayout = totalPayout + curatorPayout;
      payoutValue = `${combinedPayout.toFixed(3)} HBD`;
    }
    
    // Determine canonical URL - use metadata if available (InLeo, etc.), otherwise default to PeakD
    const canonicalUrl = metadata.canonical_url || `https://peakd.com/@${post.author}/${post.permlink}`;
    
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
      images: metadata.image || metadata.images || [],
      readingTimeMin: calculateReadingTime(post.body),
      cashoutTime: post.cashout_time,
      activeVotesCount: post.active_votes?.length || 0,
      canonicalUrl: canonicalUrl,
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
 * Process a single post from bridge.get_post response into ProcessedPost.
 */
function processBridgePost(post: any): ProcessedPost | null {
  if (!post || !post.author || !post.permlink) return null;

  const metadata = typeof post.json_metadata === 'string'
    ? safeJsonParse(post.json_metadata)
    : (post.json_metadata || {});

  // --- Cover image extraction (same logic as fetchSinglePost) ---
  let coverImage: string | null = null;

  const cleanImageUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const ecencyMatch = url.match(/\[!\[\]\(([^)]+)\)\]\([^)]+\)/);
    if (ecencyMatch?.[1]?.startsWith('http')) return ecencyMatch[1];
    const mdImg = url.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdImg?.[1]?.startsWith('http')) return mdImg[1];
    const mdLink = url.match(/\[[^\]]*\]\(([^)]+)\)/);
    if (mdLink?.[1]?.startsWith('http')) return mdLink[1];
    if (url.includes('](')) {
      const before = url.split('](')[0];
      if (before.startsWith('http')) return before;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return null;
  };

  const extractFirstImageFromBody = (body: string): string | null => {
    if (!body) return null;
    const imgMatch = body.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
    if (imgMatch?.[1]) return imgMatch[1];
    const htmlImg = body.match(/<img[^>]*\ssrc=["']([^"']+)["']/) ||
                    body.match(/<img[^>]*src=["']([^"']+)["']/);
    if (htmlImg?.[1]?.startsWith('http')) return htmlImg[1];
    const standalone = body.match(/^\s*(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))\s*$/im);
    if (standalone?.[1]) return standalone[1];
    return null;
  };

  const imageArray = metadata.image || metadata.images;
  if (Array.isArray(imageArray)) {
    for (const img of imageArray) {
      const cleaned = cleanImageUrl(img);
      if (cleaned) { coverImage = optimizeImageUrl(cleaned, 'thumb'); break; }
    }
  }
  if (!coverImage && post.body) {
    const bodyImg = extractFirstImageFromBody(post.body);
    if (bodyImg) coverImage = optimizeImageUrl(bodyImg, 'thumb');
  }

  // --- Payout ---
  const pendingPayout = parseFloat(post.pending_payout_value || '0');
  let payoutValue: string;
  if (pendingPayout > 0) {
    payoutValue = post.pending_payout_value || '0';
  } else {
    const authorPay = parseFloat(post.author_payout_value || '0') || 0;
    const curatorPay = parseFloat(post.curator_payout_value || '0') || 0;
    payoutValue = `${(authorPay + curatorPay).toFixed(3)} HBD`;
  }

  const canonicalUrl = metadata.canonical_url || `https://peakd.com/@${post.author}/${post.permlink}`;

  const processed: ProcessedPost = {
    title: post.title || 'Untitled',
    author: post.author,
    permlink: post.permlink,
    created: post.created,
    createdRelative: formatRelativeTime(post.created),
    coverImage,
    tags: metadata.tags || [],
    payout: formatPayout(payoutValue),
    votes: post.stats?.total_votes ?? 0,
    comments: post.children ?? 0,
    reputation: formatReputation(post.author_reputation ?? 25),
    slug: `@${post.author}/${post.permlink}`,
    bodyMarkdown: post.body,
    images: metadata.image || metadata.images || [],
    readingTimeMin: calculateReadingTime(post.body || ''),
    cashoutTime: post.payout_at,
    activeVotesCount: post.active_votes?.length || 0,
    canonicalUrl,
    rawJsonUrl: getHiveBlogUrl(post.author, post.permlink),
  };

  // Cache the result
  const cacheKey = `${post.author}/${post.permlink}`;
  postCache[cacheKey] = { post: processed, timestamp: Date.now() };

  return processed;
}

/**
 * Batch-fetch posts via the /api/hive/posts/batch route which uses a single
 * JSON-RPC batch call to bridge.get_post. Much faster than N individual calls.
 */
export async function batchFetchPosts(
  posts: { author: string; permlink: string }[]
): Promise<(ProcessedPost | null)[]> {
  if (posts.length === 0) return [];

  // Check cache first -- only fetch what we don't have
  const results: (ProcessedPost | null)[] = new Array(posts.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedPosts: { author: string; permlink: string }[] = [];

  for (let i = 0; i < posts.length; i++) {
    const key = `${posts[i].author}/${posts[i].permlink}`;
    const cached = postCache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      results[i] = cached.post;
    } else {
      uncachedIndices.push(i);
      uncachedPosts.push(posts[i]);
    }
  }

  if (uncachedPosts.length === 0) return results;

  try {
    const response = await fetch('/api/hive/posts/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: uncachedPosts }),
    });

    if (!response.ok) {
      console.error('Batch fetch failed:', response.status);
      return results; // return what we have from cache
    }

    const data = await response.json();
    const batchResults: any[] = data.results || [];

    for (let j = 0; j < batchResults.length; j++) {
      const processed = batchResults[j] ? processBridgePost(batchResults[j]) : null;
      results[uncachedIndices[j]] = processed;
    }

    saveCacheToStorage();
  } catch (error) {
    console.error('Error in batchFetchPosts:', error);
  }

  return results;
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

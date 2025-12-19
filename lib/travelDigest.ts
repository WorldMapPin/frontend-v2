// Handles fetching and parsing of daily travel digest posts

import { DigestPost, TravelDigest, DigestFetchResult, ProcessedPost } from '@/types/post';

// Base URL for Hive blog API
const HIVE_API_BASE = 'https://hive.blog/hive-163772/@worldmappin';

/**
 * Check if a digest exists for the given number
 */
export async function checkDigestExists(digestNumber: number): Promise<boolean> {
  try {
    const response = await fetch(`${HIVE_API_BASE}/travel-digest-${digestNumber}.json`, {
      method: 'GET', // Use GET since HEAD might not be supported
      signal: AbortSignal.timeout(5000), // 5 second timeout
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    // Check if Hive returned an error in the response body
    return !(data.status === '404' || data.post === 'No post found');
  } catch (error) {
    console.warn(`Error checking digest ${digestNumber}:`, error);
    return false;
  }
}

/**
 * Find the latest available digest number
 * Starts from a known number and increments until 404
 */
export async function findLatestDigestNumber(startNumber: number = 2777): Promise<number> {
  let currentNumber = startNumber;
  let maxAttempts = 10; // Prevent infinite loops
  
  // First, verify the start number exists
  const startExists = await checkDigestExists(currentNumber);
  if (!startExists) {
    // If start number doesn't exist, go backwards to find a valid one
    while (currentNumber > startNumber - 10 && maxAttempts > 0) {
      currentNumber--;
      const exists = await checkDigestExists(currentNumber);
      if (exists) {
        break;
      }
      maxAttempts--;
    }
  }
  
  // Now find the highest available number
  maxAttempts = 10; // Reset attempts
  while (maxAttempts > 0) {
    const nextExists = await checkDigestExists(currentNumber + 1);
    if (!nextExists) {
      return currentNumber;
    }
    currentNumber++;
    maxAttempts--;
  }
  
  return currentNumber;
}

/**
 * Fetch digest content from Hive API
 */
export async function fetchDigestFromHive(digestNumber: number): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const url = `${HIVE_API_BASE}/travel-digest-${digestNumber}.json`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WorldMapPin-Frontend/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if Hive returned an error in the response body
    if (data.status === '404' || data.post === 'No post found') {
      throw new Error('HTTP 404: Post not found');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Fetch digest with exponential backoff retry
 */
export async function fetchDigestWithRetry(digestNumber: number, maxRetries: number = 3): Promise<any> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchDigestFromHive(digestNumber);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 404 (digest doesn't exist)
      if (error instanceof Error && error.message.includes('404')) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * "https://images.ecency.com/.../image.jpg)](https://images.ecency.com/.../image.jpg"
 * We need to extract just the clean URL part
 */
export function cleanImageUrl(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // If URL contains "](" it's malformed - take the part before it
  if (url.includes('](')) {
    url = url.split('](')[0];
  }
  
  // Remove any trailing quote or bracket characters that might have been included
  url = url.replace(/['">)\]]+$/, '');
  
  // Validate it's a proper URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return null;
}

/**
 * Extract author and permlink from a post URL
 */
export function extractAuthorAndPermlink(url: string): { author: string; permlink: string } | null {
  try {
    // Handle various URL formats:
    // https://peakd.com/@author/permlink
    // https://hive.blog/@author/permlink
    // https://ecency.com/@author/permlink
    const match = url.match(/@([^/]+)\/([^/?#]+)/);
    
    if (match) {
      return {
        author: match[1],
        permlink: match[2]
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Error extracting author and permlink from URL:', url, error);
    return null;
  }
}

/**
 * Sanitize HTML title by removing tags and decoding entities
 */
export function sanitizeTitle(htmlTitle: string): string {
  try {
    // Remove HTML tags
    let cleaned = htmlTitle.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    const entityMap: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '…'
    };
    
    Object.entries(entityMap).forEach(([entity, char]) => {
      cleaned = cleaned.replace(new RegExp(entity, 'g'), char);
    });
    
    // Decode numeric entities
    cleaned = cleaned.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (error) {
    console.warn('Error sanitizing title:', htmlTitle, error);
    return htmlTitle; // Return original if sanitization fails
  }
}

/**
 * Parse digest HTML content to extract the top 3 posts
 */
export function parseDigestHTML(htmlContent: string): DigestPost[] {
  try {
    const posts: DigestPost[] = [];
    const medals = ['🥇', '🥈', '🥉'] as const;
    
    medals.forEach((medal, index) => {
      const rank = (index + 1) as 1 | 2 | 3;
      
      // Find the medal emoji in the HTML
      const medalIndex = htmlContent.indexOf(medal);
      if (medalIndex === -1) {
        console.warn(`Medal ${medal} not found in digest content`);
        return;
      }
      
      // Extract the section containing this medal post
      // Look for the next <hr> or medal to determine the section boundary
      let sectionEnd = htmlContent.length;
      const nextMedalIndex = medals.slice(index + 1).reduce((minIndex, nextMedal) => {
        const nextIndex = htmlContent.indexOf(nextMedal, medalIndex + 1);
        return nextIndex !== -1 && nextIndex < minIndex ? nextIndex : minIndex;
      }, htmlContent.length);
      
      const nextHrIndex = htmlContent.indexOf('<hr>', medalIndex + 1);
      sectionEnd = Math.min(nextMedalIndex, nextHrIndex !== -1 ? nextHrIndex : htmlContent.length);
      
      const section = htmlContent.slice(medalIndex, sectionEnd);
      
      // Extract post URL and title from the first link after the medal
      // Updated regex to handle both single and double quotes
      const linkMatch = section.match(/<a href=['"']([^'"]+)['"']>([^<]+)<\/a>/) || 
                       section.match(/<a href='([^']+)'>([^<]+)<\/a>/) ||
                       section.match(/<a href="([^"]+)">([^<]+)<\/a>/);
      
      if (!linkMatch) {
        console.warn(`No link found for medal ${medal} in section:`, section.substring(0, 200));
        return;
      }
      
      const postUrl = linkMatch[1];
      const rawTitle = linkMatch[2];
      const title = sanitizeTitle(rawTitle);
      
      // Extract author and permlink from URL
      const authorPermlink = extractAuthorAndPermlink(postUrl);
      if (!authorPermlink) {
        console.warn(`Could not extract author/permlink from URL: ${postUrl}`);
        return;
      }
      
      // Extract author from "by @username" pattern
      const authorMatch = section.match(/by @([a-zA-Z0-9.-]+)/);
      const author = authorMatch ? authorMatch[1] : authorPermlink.author;
      
      // Extract image URL from img tag - handle both single and double quotes
      const imageMatch = section.match(/<img src=['"']([^'"]+)['"']/) || 
                        section.match(/<img src='([^']+)'/) ||
                        section.match(/<img src="([^"]+)"/);
      // Clean the image URL to handle malformed Ecency URLs
      const rawImageUrl = imageMatch ? imageMatch[1] : undefined;
      const imageUrl = cleanImageUrl(rawImageUrl) || undefined;
      
      // Extract excerpt from paragraph text (remove HTML tags)
      // Look for the first paragraph after the title
      const excerptMatch = section.match(/<p>([^<]+(?:<[^>]*>[^<]*)*?)<\/p>/);
      let excerpt = '';
      if (excerptMatch) {
        excerpt = sanitizeTitle(excerptMatch[1]);
        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 200) + '...';
        }
      }
      
      posts.push({
        rank,
        title,
        author,
        permlink: authorPermlink.permlink,
        imageUrl,
        excerpt,
        postUrl
      });
    });
    
    return posts;
  } catch (error) {
    console.error('Error parsing digest HTML:', error);
    console.error('HTML content preview:', htmlContent.substring(0, 500));
    throw new Error(`Failed to parse digest HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a slug for post navigation
 */
export function generatePostSlug(author: string, permlink: string): string {
  return `${author}/${permlink}`;
}

/**
 * Fetch actual post data from Hive to get real vote and comment counts
 * Uses the internal API route for CORS-safe fetching
 */
async function fetchPostData(author: string, permlink: string): Promise<{ votes: number; comments: number; payout: string; created: string; reputation: string; coverImage: string | null } | null> {
  try {
    // Use the internal API route which handles CORS properly
    const apiUrl = `/api/hive-post?author=${encodeURIComponent(author)}&permlink=${encodeURIComponent(permlink)}`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch post data for @${author}/${permlink}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.post) {
      console.warn(`No post data found for @${author}/${permlink}`);
      return null;
    }

    const post = data.post;
    
    // Calculate payout - handle different payout value formats
    let payout = 0;
    try {
      const pendingPayout = parseFloat(post.pending_payout_value?.replace(/[^\d.]/g, '') || '0');
      const totalPayout = parseFloat(post.total_payout_value?.replace(/[^\d.]/g, '') || '0');
      const curatorPayout = parseFloat(post.curator_payout_value?.replace(/[^\d.]/g, '') || '0');
      payout = pendingPayout > 0 ? pendingPayout : (totalPayout + curatorPayout);
    } catch (payoutError) {
      console.warn(`Error calculating payout for @${author}/${permlink}:`, payoutError);
    }
    
    // Calculate reputation score
    let reputation = '70'; // Default
    try {
      if (post.author_reputation && typeof post.author_reputation === 'number') {
        const rep = Math.log10(Math.abs(post.author_reputation) / 9) + 25;
        reputation = Math.max(rep, 25).toFixed(0);
      }
    } catch (repError) {
      console.warn(`Error calculating reputation for @${author}/${permlink}:`, repError);
    }

    // Extract cover image from post metadata as fallback
    let coverImage: string | null = null;
    try {
      const metadata = typeof post.json_metadata === 'string' 
        ? JSON.parse(post.json_metadata) 
        : post.json_metadata;
      
      if (metadata?.image && Array.isArray(metadata.image) && metadata.image.length > 0) {
        // Find first valid image URL (clean any malformed Ecency URLs)
        for (const img of metadata.image) {
          const cleanedUrl = cleanImageUrl(img);
          if (cleanedUrl) {
            coverImage = cleanedUrl;
            break;
          }
        }
      }
    } catch (metaError) {
      console.warn(`Error parsing metadata for @${author}/${permlink}:`, metaError);
    }

    return {
      votes: Math.max(0, post.net_votes || 0),
      comments: Math.max(0, post.children || 0),
      payout: `$${payout.toFixed(2)}`,
      created: post.created || new Date().toISOString(),
      reputation,
      coverImage
    };
  } catch (error) {
    console.warn(`Error fetching post data for @${author}/${permlink}:`, error);
    return null;
  }
}

/**
 * Transform DigestPost to ProcessedPost format for ExploreCard compatibility
 */
export async function transformToProcessedPost(digestPost: DigestPost): Promise<ProcessedPost> {
  const slug = generatePostSlug(digestPost.author, digestPost.permlink);
  
  // Fetch actual post data for real vote/comment counts and cover image
  const postData = await fetchPostData(digestPost.author, digestPost.permlink);
  
  // Calculate relative time
  const createdDate = postData?.created ? new Date(postData.created) : new Date();
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let createdRelative = 'Today';
  if (diffDays > 0) {
    createdRelative = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    createdRelative = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  // Use digest image first, fallback to post metadata image
  // Both are cleaned via cleanImageUrl
  const coverImage = digestPost.imageUrl || postData?.coverImage || null;
  
  return {
    title: digestPost.title,
    author: digestPost.author,
    permlink: digestPost.permlink,
    created: postData?.created || new Date().toISOString(),
    createdRelative,
    coverImage,
    tags: ['worldmappin', 'travel', 'curated'],
    payout: postData?.payout || '$0.00',
    votes: postData?.votes || 0,
    comments: postData?.comments || 0,
    reputation: postData?.reputation || '70',
    slug,
    bodyMarkdown: digestPost.excerpt,
    images: coverImage ? [coverImage] : [],
    readingTimeMin: 5, // Estimated reading time
    canonicalUrl: digestPost.postUrl,
    rawJsonUrl: `https://hive.blog/hive-163772/@${digestPost.author}/${digestPost.permlink}.json`
  };
}

/**
 * Transform multiple DigestPosts to ProcessedPosts
 */
export async function transformDigestPosts(digestPosts: DigestPost[]): Promise<ProcessedPost[]> {
  console.log(`Transforming ${digestPosts.length} digest posts with real vote/comment data...`);
  
  // Transform all posts in parallel for better performance
  const transformPromises = digestPosts.map(async (post, index) => {
    console.log(`Fetching data for post ${index + 1}: @${post.author}/${post.permlink}`);
    return transformToProcessedPost(post);
  });
  
  const results = await Promise.all(transformPromises);
  console.log(`Successfully transformed ${results.length} posts with real data`);
  
  return results;
}

/**
 * Simple in-memory cache for digest results
 */
class DigestCache {
  private cache = new Map<string, { data: TravelDigest; timestamp: number; ttl: number }>();
  
  /**
   * Generate cache key for a digest
   */
  private getCacheKey(digestNumber: number): string {
    return `digest-${digestNumber}`;
  }
  
  /**
   * Get TTL based on digest date (1 hour for current day, 24 hours for previous days)
   */
  private getTTL(digestNumber: number): number {
    const today = new Date();
    const todayDigestNumber = this.estimateDigestNumber(today);
    
    // If it's today's digest, cache for 1 hour (3600000 ms)
    // Otherwise cache for 24 hours (86400000 ms)
    return digestNumber >= todayDigestNumber ? 3600000 : 86400000;
  }
  
  /**
   * Estimate digest number based on date (rough calculation)
   */
  private estimateDigestNumber(date: Date): number {
    // WorldMapPin started around digest 2777 on Dec 18, 2024
    const baseDate = new Date('2024-12-18');
    const baseDiges = 2777;
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return baseDiges + daysDiff;
  }
  
  /**
   * Set cache entry
   */
  set(digestNumber: number, data: TravelDigest): void {
    const key = this.getCacheKey(digestNumber);
    const ttl = this.getTTL(digestNumber);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Get cache entry if not expired
   */
  get(digestNumber: number): TravelDigest | null {
    const key = this.getCacheKey(digestNumber);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const digestCache = new DigestCache();

// Cleanup expired entries every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    digestCache.cleanup();
  }, 10 * 60 * 1000);
}

export { digestCache };
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProcessedPost, HiveRankedPost, SortType } from '@/types/post';
import {
  formatReputation,
  formatRelativeTime,
  calculateReadingTime,
  formatPayout,
  getHiveBlogUrl,
  safeJsonParse
} from '@/utils/postUtils';

const POSTS_PER_PAGE = 20;

/**
 * Optimize image URL using Ecency's image proxy
 */
function optimizeImageUrl(imageUrl: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'thumb'): string {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;

  const sizeMap = {
    thumb: '150x0',
    small: '256x512',
    medium: '400x0',
    large: '600x0'
  };

  const ecencySize = sizeMap[size];

  if (imageUrl.includes('images.ecency.com')) {
    return imageUrl.replace(/\/\d+x\d+\//, `/${ecencySize}/`);
  }

  const trustedCDNs = [
    'files.peakd.com',
    'cdn.steemitimages.com',
    'images.hive.blog',
    'img.leopedia.io'
  ];

  if (trustedCDNs.some(cdn => imageUrl.includes(cdn))) {
    return imageUrl;
  }

  return `https://images.ecency.com/${ecencySize}/${imageUrl}`;
}

/**
 * Clean and extract valid image URL from various formats
 */
function cleanImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Handle Ecency format: [![](url)](url)
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

  // Handle markdown link: [url](url)
  const markdownLinkMatch = url.match(/\[[^\]]*\]\(([^)]+)\)/);
  if (markdownLinkMatch && markdownLinkMatch[1]) {
    const extractedUrl = markdownLinkMatch[1];
    if (extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://')) {
      return extractedUrl;
    }
  }

  // Handle malformed URLs with "]("
  if (url.includes('](')) {
    const beforeBracket = url.split('](')[0];
    if (beforeBracket.startsWith('http://') || beforeBracket.startsWith('https://')) {
      return beforeBracket;
    }
  }

  // Handle plain URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return null;
}

/**
 * Extract first image from markdown or HTML body
 * Handles markdown images, HTML img tags, InLeo format, and travel digest posts
 */
function extractFirstImageFromBody(body: string): string | null {
  if (!body) return null;

  // Priority 1: Match markdown image: ![alt](url)
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
}

/**
 * Fetch cover image from original post for crossposts
 */
async function fetchOriginalPostCoverImage(originalAuthor: string, originalPermlink: string): Promise<string | null> {
  try {
    const apiUrl = `/api/hive/post?author=${encodeURIComponent(originalAuthor)}&permlink=${encodeURIComponent(originalPermlink)}`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.post) {
      return null;
    }

    const post = data.post;
    const metadata = safeJsonParse(post.json_metadata);

    // Try metadata images first
    const imageArray = metadata.image || metadata.images;
    if (imageArray && Array.isArray(imageArray) && imageArray.length > 0) {
      for (const img of imageArray) {
        const cleanedUrl = cleanImageUrl(img);
        if (cleanedUrl) {
          return optimizeImageUrl(cleanedUrl, 'thumb');
        }
      }
    }

    // Try body images
    if (post.body) {
      const bodyImage = extractFirstImageFromBody(post.body);
      if (bodyImage) {
        return optimizeImageUrl(bodyImage, 'thumb');
      }
    }

    return null;
  } catch (error) {
    console.warn(`Error fetching original post cover image for @${originalAuthor}/${originalPermlink}:`, error);
    return null;
  }
}

/**
 * Process a raw Hive ranked post into our ProcessedPost format
 */
async function processRankedPost(post: HiveRankedPost): Promise<ProcessedPost> {
  const metadata = safeJsonParse(post.json_metadata);

  // Get cover image
  // Note: Some platforms use 'image' (Ecency, PeakD), others use 'images' (InLeo)
  let coverImage: string | null = null;
  const imageArray = metadata.image || metadata.images;

  if (imageArray && Array.isArray(imageArray) && imageArray.length > 0) {
    for (const img of imageArray) {
      const cleanedUrl = cleanImageUrl(img);
      if (cleanedUrl) {
        coverImage = optimizeImageUrl(cleanedUrl, 'thumb');
        break;
      }
    }
  }

  if (!coverImage && post.body) {
    const bodyImage = extractFirstImageFromBody(post.body);
    if (bodyImage) {
      coverImage = optimizeImageUrl(bodyImage, 'thumb');
    }
  }

  // For crossposts: if no cover image found, try fetching from original post
  if (!coverImage && metadata.original_author && metadata.original_permlink) {
    coverImage = await fetchOriginalPostCoverImage(metadata.original_author, metadata.original_permlink);
  }

  // Calculate payout
  let payoutValue: string;
  const pendingPayout = parseFloat(post.pending_payout_value || '0');

  if (pendingPayout > 0) {
    payoutValue = post.pending_payout_value || '0';
  } else {
    const authorPayout = parseFloat(post.author_payout_value || '0');
    const curatorPayout = parseFloat(post.curator_payout_value || '0');
    const combinedPayout = (isNaN(authorPayout) ? 0 : authorPayout) + (isNaN(curatorPayout) ? 0 : curatorPayout);
    payoutValue = `${combinedPayout.toFixed(3)} HBD`;
  }

  return {
    title: post.title || 'Untitled',
    author: post.author,
    permlink: post.permlink,
    created: post.created,
    createdRelative: formatRelativeTime(post.created),
    coverImage: coverImage,
    tags: metadata.tags || [],
    payout: formatPayout(payoutValue),
    votes: post.stats?.total_votes || 0,
    comments: post.children,
    reputation: formatReputation(post.author_reputation),
    slug: `@${post.author}/${post.permlink}`,
    bodyMarkdown: post.body,
    images: metadata.image || metadata.images || [],
    readingTimeMin: calculateReadingTime(post.body),
    cashoutTime: post.payout_at,
    activeVotesCount: post.active_votes?.length || 0,
    canonicalUrl: metadata.canonical_url || `https://peakd.com/@${post.author}/${post.permlink}`,
    rawJsonUrl: getHiveBlogUrl(post.author, post.permlink)
  };
}

interface UsePostPaginatorOptions {
  initialSort?: SortType;
  postsPerPage?: number;
}

interface UsePostPaginatorReturn {
  posts: ProcessedPost[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  sortType: SortType;
  totalLoaded: number;
  fetchInitialPosts: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  changeSortType: (newSort: SortType) => void;
  reset: () => void;
}

export function usePostPaginator(options: UsePostPaginatorOptions = {}): UsePostPaginatorReturn {
  const { initialSort = 'created', postsPerPage = POSTS_PER_PAGE } = options;

  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sortType, setSortType] = useState<SortType>(initialSort);

  // Cursor for pagination
  const lastAuthorRef = useRef<string | null>(null);
  const lastPermlinkRef = useRef<string | null>(null);

  const fetchPosts = useCallback(async (isInitial: boolean = false) => {
    if (!isInitial && loadingMore) return;
    if (!hasMore && !isInitial) return;

    if (isInitial) {
      setLoading(true);
      setError(null);
      setPosts([]);
      lastAuthorRef.current = null;
      lastPermlinkRef.current = null;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const requestBody: {
        sort: SortType;
        limit: number;
        start_author?: string;
        start_permlink?: string;
      } = {
        sort: sortType,
        limit: postsPerPage
      };

      // Add cursor for pagination (not on initial load)
      if (!isInitial && lastAuthorRef.current && lastPermlinkRef.current) {
        requestBody.start_author = lastAuthorRef.current;
        requestBody.start_permlink = lastPermlinkRef.current;
      }

      const response = await fetch('/api/hive/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const rawPosts: HiveRankedPost[] = await response.json();

      // Store the raw count BEFORE any modifications
      // This determines if more posts exist on the server
      const receivedCount = rawPosts.length;
      
      // If we have a cursor, remove the first post (it's a duplicate from previous page)
      let newPosts = [...rawPosts];
      const hasCursor = !isInitial && lastAuthorRef.current && lastPermlinkRef.current;
      if (hasCursor && newPosts.length > 0) {
        newPosts.shift();
      }

      // Determine if there are more posts based on raw count from API
      // If API returned fewer than we requested, we've reached the end
      if (receivedCount < postsPerPage) {
        setHasMore(false);
      }

      // Update cursor to last post
      if (newPosts.length > 0) {
        const lastPost = newPosts[newPosts.length - 1];
        lastAuthorRef.current = lastPost.author;
        lastPermlinkRef.current = lastPost.permlink;
      }

      // Process posts (now async to handle crosspost image fetching)
      const processedPosts = await Promise.all(newPosts.map(processRankedPost));

      if (isInitial) {
        setPosts(processedPosts);
      } else {
        setPosts(prev => [...prev, ...processedPosts]);
      }

    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortType, postsPerPage, hasMore, loadingMore]);

  const fetchInitialPosts = useCallback(() => {
    return fetchPosts(true);
  }, [fetchPosts]);

  const fetchNextPage = useCallback(() => {
    return fetchPosts(false);
  }, [fetchPosts]);

  const changeSortType = useCallback((newSort: SortType) => {
    if (newSort !== sortType) {
      setSortType(newSort);
      // Reset and fetch with new sort
      lastAuthorRef.current = null;
      lastPermlinkRef.current = null;
      setHasMore(true);
      setPosts([]);
      setLoading(true);
    }
  }, [sortType]);

  const reset = useCallback(() => {
    setPosts([]);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setHasMore(true);
    lastAuthorRef.current = null;
    lastPermlinkRef.current = null;
  }, []);

  // Fetch when sort type changes
  useEffect(() => {
    fetchPosts(true);
  }, [sortType]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    sortType,
    totalLoaded: posts.length,
    fetchInitialPosts,
    fetchNextPage,
    changeSortType,
    reset
  };
}

/**
 * Hook for infinite scroll functionality
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: { threshold?: number; enabled?: boolean } = {}
) {
  const { threshold = 300, enabled = true } = options;
  const loadMoreRef = useRef(onLoadMore);

  // Update ref when callback changes
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold) {
        loadMoreRef.current();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, enabled]);
}


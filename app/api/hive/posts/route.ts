import { NextRequest, NextResponse } from 'next/server';
import { SortType, ProcessedPost } from '@/types/post';
import {
  formatReputation,
  formatRelativeTime,
  calculateReadingTime,
  formatPayout,
  getHiveBlogUrl,
  safeJsonParse,
} from '@/utils/postUtils';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

// Hive RPC nodes can be slow; keep this high enough to avoid frequent 500s,
// but still bounded so requests don't hang indefinitely.
const RPC_TIMEOUT = 10_000;

interface RankedPostsParams {
  sort: SortType;
  tag: string;
  limit: number;
  observer: string;
  start_author?: string;
  start_permlink?: string;
}

// ---------------------------------------------------------------------------
// Server-side response cache
// ---------------------------------------------------------------------------

interface PostsResponse {
  posts: ProcessedPost[];
  hasMore: boolean;
}

interface PostCacheEntry {
  data: PostsResponse;
  timestamp: number;
}

const postCache = new Map<string, PostCacheEntry>();
const POST_CACHE_TTL = 45_000;
const MAX_CACHE_ENTRIES = 50;

function cacheKey(sort: string, startAuthor?: string, startPermlink?: string): string {
  return `${sort}:${startAuthor || ''}:${startPermlink || ''}`;
}

function getCached(key: string): PostsResponse | null {
  const entry = postCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > POST_CACHE_TTL) {
    postCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: PostsResponse) {
  if (postCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = [...postCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 10 && i < oldest.length; i++) {
      postCache.delete(oldest[i][0]);
    }
  }
  postCache.set(key, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Server-side image utilities
// ---------------------------------------------------------------------------

function optimizeImageUrl(
  imageUrl: string,
  size: 'thumb' | 'small' | 'medium' | 'large' = 'thumb',
): string {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;

  const sizeMap = { thumb: '150x0', small: '256x512', medium: '400x0', large: '600x0' };
  const ecencySize = sizeMap[size];

  if (imageUrl.includes('images.ecency.com')) {
    return imageUrl.replace(/\/\d+x\d+\//, `/${ecencySize}/`);
  }

  const trustedCDNs = [
    'files.peakd.com',
    'cdn.steemitimages.com',
    'images.hive.blog',
    'img.leopedia.io',
  ];
  if (trustedCDNs.some((cdn) => imageUrl.includes(cdn))) return imageUrl;

  return `https://images.ecency.com/${ecencySize}/${imageUrl}`;
}

function cleanImageUrl(url: string): string | null {
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
}

function extractFirstImageFromBody(body: string): string | null {
  if (!body) return null;

  const imgMatch = body.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
  if (imgMatch?.[1]) return imgMatch[1];

  const htmlImg =
    body.match(/<img[^>]*\ssrc=["']([^"']+)["']/) ||
    body.match(/<img[^>]*src=["']([^"']+)["']/);
  if (htmlImg?.[1]?.startsWith('http')) return htmlImg[1];

  const standalone = body.match(
    /^\s*(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))\s*$/im,
  );
  if (standalone?.[1]) return standalone[1];

  const leopedia = body.match(/^\s*(https?:\/\/img\.leopedia\.io\/[^\s]+)\s*$/im);
  if (leopedia?.[1]) return leopedia[1];

  return null;
}

// ---------------------------------------------------------------------------
// Hive RPC — race all nodes, take fastest response
// ---------------------------------------------------------------------------

async function hiveRpc(method: string, params: Record<string, any>): Promise<any> {
  const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });

  const promises = HIVE_API_NODES.map(async (node) => {
    const res = await fetch(node, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(RPC_TIMEOUT),
    });
    if (!res.ok) throw new Error(`${node}: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'RPC error');
    return data.result;
  });

  try {
    return await Promise.any(promises);
  } catch (err) {
    if (err instanceof AggregateError) {
      console.error('All Hive nodes failed:', err.errors.map((e: Error) => e.message));
    }
    throw new Error('All Hive API nodes failed');
  }
}

// ---------------------------------------------------------------------------
// Server-side post processing
// ---------------------------------------------------------------------------

function extractCoverImage(metadata: any, body: string): string | null {
  const imageArray = metadata.image || metadata.images;
  if (Array.isArray(imageArray)) {
    for (const img of imageArray) {
      const cleaned = cleanImageUrl(img);
      if (cleaned) return optimizeImageUrl(cleaned, 'thumb');
    }
  }

  if (body) {
    const bodyImg = extractFirstImageFromBody(body);
    if (bodyImg) return optimizeImageUrl(bodyImg, 'thumb');
  }

  return null;
}

// Cross-posts often have `image: []` and only reference the original post.
// Resolve cover image from the original post when needed.
const originalCoverCache = new Map<string, { cover: string | null; timestamp: number }>();
const ORIGINAL_COVER_TTL = 5 * 60_000;

async function fetchOriginalCoverImage(author: string, permlink: string): Promise<string | null> {
  const key = `${author}/${permlink}`;
  const cached = originalCoverCache.get(key);
  if (cached && Date.now() - cached.timestamp < ORIGINAL_COVER_TTL) return cached.cover;

  try {
    const url = getHiveBlogUrl(author, permlink);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      originalCoverCache.set(key, { cover: null, timestamp: Date.now() });
      return null;
    }

    const data = await res.json();
    const originalPost = data?.post;
    const metadata = safeJsonParse(originalPost?.json_metadata);
    const cover = extractCoverImage(metadata, originalPost?.body || '');

    originalCoverCache.set(key, { cover, timestamp: Date.now() });
    return cover;
  } catch (error) {
    console.warn(`fetchOriginalCoverImage failed for @${author}/${permlink}`, error);
    originalCoverCache.set(key, { cover: null, timestamp: Date.now() });
    return null;
  }
}

async function processRankedPost(post: any): Promise<ProcessedPost> {
  const metadata = safeJsonParse(post.json_metadata);
  let coverImage = extractCoverImage(metadata, post.body || '');

  if (!coverImage && metadata?.original_author && metadata?.original_permlink) {
    coverImage = await fetchOriginalCoverImage(metadata.original_author, metadata.original_permlink);
  }

  const pendingPayout = parseFloat(post.pending_payout_value || '0');
  let payoutValue: string;
  if (pendingPayout > 0) {
    payoutValue = post.pending_payout_value || '0';
  } else {
    const authorPay = parseFloat(post.author_payout_value || '0') || 0;
    const curatorPay = parseFloat(post.curator_payout_value || '0') || 0;
    payoutValue = `${(authorPay + curatorPay).toFixed(3)} HBD`;
  }

  return {
    title: post.title || 'Untitled',
    author: post.author,
    permlink: post.permlink,
    created: post.created,
    createdRelative: formatRelativeTime(post.created),
    coverImage,
    tags: metadata.tags || [],
    payout: formatPayout(payoutValue),
    votes: post.stats?.total_votes || 0,
    comments: post.children ?? 0,
    reputation: formatReputation(post.author_reputation),
    slug: `@${post.author}/${post.permlink}`,
    images: metadata.image || metadata.images || [],
    readingTimeMin: calculateReadingTime(post.body || ''),
    cashoutTime: post.payout_at,
    activeVotesCount: post.active_votes?.length || 0,
    canonicalUrl:
      metadata.canonical_url || `https://peakd.com/@${post.author}/${post.permlink}`,
    rawJsonUrl: getHiveBlogUrl(post.author, post.permlink),
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { sort = 'created', limit = 20, start_author, start_permlink } = body;

    const key = cacheKey(sort, start_author, start_permlink);
    const cached = getCached(key);
    if (cached) {
      console.log(`hive/posts: cache HIT (${Date.now() - t0}ms)`);
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      });
    }

    const params: RankedPostsParams = {
      sort: sort as SortType,
      tag: 'hive-163772',
      limit: Math.min(limit, 50),
      observer: '',
    };

    if (start_author && start_permlink) {
      params.start_author = start_author;
      params.start_permlink = start_permlink;
    }

    const rawPosts: any[] = await hiveRpc('bridge.get_ranked_posts', params);

    if (!Array.isArray(rawPosts)) {
      return NextResponse.json({ error: 'Unexpected response from Hive API' }, { status: 502 });
    }

    // Filter out posts muted/grayed by community moderators before processing.
    // Muted posts have stats.gray === true and their title/body are replaced with "error".
    const visiblePosts = rawPosts.filter((post) => !post.stats?.gray);

    const processed: ProcessedPost[] = await Promise.all(visiblePosts.map((post) => processRankedPost(post)));

    // Determine hasMore from the *raw* Hive response count, not the filtered count.
    // If Hive returned a full page, there are likely more posts to fetch.
    const requestedLimit = Math.min(limit, 50);
    const hasMore = rawPosts.length >= requestedLimit;

    const response: PostsResponse = { posts: processed, hasMore };
    setCached(key, response);

    console.log(`hive/posts: cache MISS — ${rawPosts.length} raw, ${processed.length} visible in ${Date.now() - t0}ms`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error(`hive/posts: ERROR in ${Date.now() - t0}ms`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

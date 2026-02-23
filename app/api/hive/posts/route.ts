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

const RPC_TIMEOUT = 6_000;

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

interface PostCacheEntry {
  data: ProcessedPost[];
  timestamp: number;
}

const postCache = new Map<string, PostCacheEntry>();
const POST_CACHE_TTL = 45_000;
const MAX_CACHE_ENTRIES = 50;

function cacheKey(sort: string, startAuthor?: string, startPermlink?: string): string {
  return `${sort}:${startAuthor || ''}:${startPermlink || ''}`;
}

function getCached(key: string): ProcessedPost[] | null {
  const entry = postCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > POST_CACHE_TTL) {
    postCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: ProcessedPost[]) {
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

function processRankedPost(post: any): ProcessedPost {
  const metadata = safeJsonParse(post.json_metadata);
  const coverImage = extractCoverImage(metadata, post.body || '');

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

    const processed: ProcessedPost[] = rawPosts.map((post) => processRankedPost(post));

    setCached(key, processed);

    console.log(`hive/posts: cache MISS — ${rawPosts.length} posts in ${Date.now() - t0}ms`);

    return NextResponse.json(processed, {
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

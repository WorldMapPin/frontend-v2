// Handles fetching and parsing of daily travel digest posts
// Uses Hive JSON-RPC API for fast server-side fetching

import { DigestPost, TravelDigest, ProcessedPost } from '@/types/post';

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

const RPC_TIMEOUT = 8000;

interface HiveRpcResponse {
  jsonrpc: string;
  result?: any;
  error?: { code: number; message: string };
  id: number;
}

/**
 * Make a JSON-RPC call to a Hive API node with automatic failover.
 */
async function hiveRpc(method: string, params: Record<string, any>): Promise<any> {
  let lastError: Error | null = null;

  for (const node of HIVE_API_NODES) {
    try {
      const response = await fetch(node, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
        signal: AbortSignal.timeout(RPC_TIMEOUT),
      });

      if (!response.ok) {
        lastError = new Error(`${node} returned ${response.status}`);
        continue;
      }

      const data: HiveRpcResponse = await response.json();
      if (data.error) {
        lastError = new Error(`${node} RPC error: ${data.error.message}`);
        continue;
      }

      return data.result;
    } catch (err) {
      lastError = err as Error;
      console.warn(`Hive RPC: ${node} failed:`, (err as Error).message);
    }
  }

  throw lastError ?? new Error('All Hive API nodes failed');
}

/**
 * Make a batch JSON-RPC call to a Hive API node with automatic failover.
 */
async function hiveRpcBatch(
  calls: Array<{ method: string; params: Record<string, any> }>
): Promise<any[]> {
  const batchBody = calls.map((call, i) => ({
    jsonrpc: '2.0',
    method: call.method,
    params: call.params,
    id: i + 1,
  }));

  let lastError: Error | null = null;

  for (const node of HIVE_API_NODES) {
    try {
      const response = await fetch(node, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchBody),
        signal: AbortSignal.timeout(RPC_TIMEOUT),
      });

      if (!response.ok) {
        lastError = new Error(`${node} returned ${response.status}`);
        continue;
      }

      const data: HiveRpcResponse[] = await response.json();
      if (!Array.isArray(data)) {
        lastError = new Error(`${node} returned non-array batch response`);
        continue;
      }

      const sorted = [...data].sort((a, b) => a.id - b.id);
      return sorted.map((item) => {
        if (item.error) {
          console.warn(`Hive batch RPC error (id ${item.id}):`, item.error.message);
          return null;
        }
        return item.result ?? null;
      });
    } catch (err) {
      lastError = err as Error;
      console.warn(`Hive batch RPC: ${node} failed:`, (err as Error).message);
    }
  }

  throw lastError ?? new Error('All Hive API nodes failed for batch request');
}

/**
 * Fetch the latest travel digest post from @worldmappin using bridge.get_account_posts.
 * Single RPC call replaces the old multi-request probing approach.
 */
export async function fetchLatestDigest(): Promise<{
  digestNumber: number;
  body: string;
  created: string;
}> {
  const posts = await hiveRpc('bridge.get_account_posts', {
    sort: 'blog',
    account: 'worldmappin',
    limit: 10,
  });

  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('No posts found for @worldmappin');
  }

  for (const post of posts) {
    if (post.permlink && post.permlink.startsWith('travel-digest-')) {
      const digestMatch = post.permlink.match(/travel-digest-(\d+)/);
      const digestNumber = digestMatch ? parseInt(digestMatch[1], 10) : 0;

      return {
        digestNumber,
        body: post.body,
        created: post.created,
      };
    }
  }

  throw new Error('No travel-digest post found in recent @worldmappin posts');
}

/**
 * Fetch enrichment data for multiple posts in a single batch RPC call.
 * Returns votes, comments, payout, created date, reputation, and cover image.
 */
export async function batchFetchPostData(
  posts: Array<{ author: string; permlink: string }>
): Promise<Array<{
  votes: number;
  comments: number;
  payout: string;
  created: string;
  reputation: string;
  coverImage: string | null;
} | null>> {
  if (posts.length === 0) return [];

  const calls = posts.map((p) => ({
    method: 'bridge.get_post',
    params: { author: p.author, permlink: p.permlink },
  }));

  const results = await hiveRpcBatch(calls);

  return results.map((post, i) => {
    if (!post) return null;

    try {
      let payout = 0;
      if (typeof post.payout === 'number') {
        payout = post.payout;
      } else {
        const pendingPayout = parseFloat(
          String(post.pending_payout_value ?? '0').replace(/[^\d.]/g, '')
        );
        const totalPayout = parseFloat(
          String(post.total_payout_value ?? '0').replace(/[^\d.]/g, '')
        );
        const curatorPayout = parseFloat(
          String(post.curator_payout_value ?? '0').replace(/[^\d.]/g, '')
        );
        payout = pendingPayout > 0 ? pendingPayout : totalPayout + curatorPayout;
      }

      let reputation = '70';
      try {
        const rep = post.author_reputation;
        if (typeof rep === 'number' && rep !== 0) {
          if (rep > 100) {
            const score = Math.log10(Math.abs(rep) / 9) + 25;
            reputation = Math.max(score, 25).toFixed(0);
          } else {
            reputation = Math.max(rep, 25).toFixed(0);
          }
        }
      } catch { /* use default */ }

      let coverImage: string | null = null;
      try {
        const metadata =
          typeof post.json_metadata === 'string'
            ? JSON.parse(post.json_metadata)
            : post.json_metadata;

        if (metadata?.image && Array.isArray(metadata.image)) {
          for (const img of metadata.image) {
            const cleaned = cleanImageUrl(img);
            if (cleaned) {
              coverImage = cleaned;
              break;
            }
          }
        }
      } catch { /* skip metadata parsing errors */ }

      const totalVotes = post.stats?.total_votes ?? post.net_votes ?? 0;

      return {
        votes: Math.max(0, totalVotes),
        comments: Math.max(0, post.children ?? 0),
        payout: `$${payout.toFixed(2)}`,
        created: post.created || new Date().toISOString(),
        reputation,
        coverImage,
      };
    } catch (err) {
      console.warn(`Error processing post data for @${posts[i].author}/${posts[i].permlink}:`, err);
      return null;
    }
  });
}

/**
 * Build fully enriched ProcessedPost[] from DigestPost[] + batch enrichment data.
 * Runs entirely server-side — no client round-trips needed.
 */
export function buildProcessedPosts(
  digestPosts: DigestPost[],
  enrichmentData: Array<{
    votes: number;
    comments: number;
    payout: string;
    created: string;
    reputation: string;
    coverImage: string | null;
  } | null>
): ProcessedPost[] {
  return digestPosts.map((dp, i) => {
    const data = enrichmentData[i];
    const slug = generatePostSlug(dp.author, dp.permlink);

    const createdDate = data?.created ? new Date(data.created) : new Date();
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let createdRelative = 'Today';
    if (diffDays > 0) {
      createdRelative = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      createdRelative = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }

    const coverImage = dp.imageUrl || data?.coverImage || null;

    return {
      title: dp.title,
      author: dp.author,
      permlink: dp.permlink,
      created: data?.created || new Date().toISOString(),
      createdRelative,
      coverImage,
      tags: ['worldmappin', 'travel', 'curated'],
      payout: data?.payout || '$0.00',
      votes: data?.votes || 0,
      comments: data?.comments || 0,
      reputation: data?.reputation || '70',
      slug,
      bodyMarkdown: dp.excerpt,
      images: coverImage ? [coverImage] : [],
      readingTimeMin: 5,
      canonicalUrl: dp.postUrl,
      rawJsonUrl: `https://hive.blog/hive-163772/@${dp.author}/${dp.permlink}.json`,
    };
  });
}

// ---------------------------------------------------------------------------
// Utility functions (kept from original)
// ---------------------------------------------------------------------------

export function cleanImageUrl(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  if (url.includes('](')) {
    url = url.split('](')[0];
  }

  url = url.replace(/['">)\]]+$/, '');

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return null;
}

export function extractAuthorAndPermlink(url: string): { author: string; permlink: string } | null {
  try {
    const match = url.match(/@([^/]+)\/([^/?#]+)/);
    if (match) {
      return { author: match[1], permlink: match[2] };
    }
    return null;
  } catch {
    return null;
  }
}

export function sanitizeTitle(htmlTitle: string): string {
  try {
    let cleaned = htmlTitle.replace(/<[^>]*>/g, '');

    const entityMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&mdash;': '\u2014',
      '&ndash;': '\u2013',
      '&hellip;': '\u2026',
    };

    for (const [entity, char] of Object.entries(entityMap)) {
      cleaned = cleaned.replace(new RegExp(entity, 'g'), char);
    }

    cleaned = cleaned.replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec));
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  } catch {
    return htmlTitle;
  }
}

export function parseDigestHTML(htmlContent: string): DigestPost[] {
  try {
    const posts: DigestPost[] = [];
    const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'] as const;

    medals.forEach((medal, index) => {
      const rank = (index + 1) as 1 | 2 | 3;

      const medalIndex = htmlContent.indexOf(medal);
      if (medalIndex === -1) {
        console.warn(`Medal ${medal} not found in digest content`);
        return;
      }

      let sectionEnd = htmlContent.length;
      const nextMedalIndex = medals.slice(index + 1).reduce((minIndex, nextMedal) => {
        const nextIndex = htmlContent.indexOf(nextMedal, medalIndex + 1);
        return nextIndex !== -1 && nextIndex < minIndex ? nextIndex : minIndex;
      }, htmlContent.length);

      const nextHrIndex = htmlContent.indexOf('<hr>', medalIndex + 1);
      sectionEnd = Math.min(nextMedalIndex, nextHrIndex !== -1 ? nextHrIndex : htmlContent.length);

      const section = htmlContent.slice(medalIndex, sectionEnd);

      const linkMatch =
        section.match(/<a href=['"']([^'"]+)['"']>([^<]+)<\/a>/) ||
        section.match(/<a href='([^']+)'>([^<]+)<\/a>/) ||
        section.match(/<a href="([^"]+)">([^<]+)<\/a>/);

      if (!linkMatch) {
        console.warn(`No link found for medal ${medal} in section:`, section.substring(0, 200));
        return;
      }

      const postUrl = linkMatch[1];
      const rawTitle = linkMatch[2];
      const title = sanitizeTitle(rawTitle);

      const authorPermlink = extractAuthorAndPermlink(postUrl);
      if (!authorPermlink) {
        console.warn(`Could not extract author/permlink from URL: ${postUrl}`);
        return;
      }

      const authorMatch = section.match(/by @([a-zA-Z0-9.-]+)/);
      const author = authorMatch ? authorMatch[1] : authorPermlink.author;

      const imageMatch =
        section.match(/<img src=['"']([^'"]+)['"']/) ||
        section.match(/<img src='([^']+)'/) ||
        section.match(/<img src="([^"]+)"/);
      const rawImageUrl = imageMatch ? imageMatch[1] : undefined;
      const imageUrl = cleanImageUrl(rawImageUrl) || undefined;

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
        postUrl,
      });
    });

    return posts;
  } catch (error) {
    console.error('Error parsing digest HTML:', error);
    throw new Error(
      `Failed to parse digest HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function generatePostSlug(author: string, permlink: string): string {
  return `@${author}/${permlink}`;
}

// ---------------------------------------------------------------------------
// Cache (stores fully enriched results)
// ---------------------------------------------------------------------------

export function calculateDigestNumberForDate(date: Date = new Date()): number {
  const baselineDate = new Date(Date.UTC(2026, 0, 7));
  const baselineDigest = 2797;
  const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const diffTime = targetDate.getTime() - baselineDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return baselineDigest + diffDays;
}

interface CachedDigest {
  digest: TravelDigest;
  processedPosts: ProcessedPost[];
}

class DigestCache {
  private cache = new Map<string, { data: CachedDigest; timestamp: number; ttl: number }>();

  private getCacheKey(digestNumber: number): string {
    return `digest-${digestNumber}`;
  }

  private getTTL(digestNumber: number): number {
    const todayDigest = calculateDigestNumberForDate(new Date());
    return digestNumber >= todayDigest ? 3600000 : 86400000;
  }

  set(digestNumber: number, data: CachedDigest): void {
    const key = this.getCacheKey(digestNumber);
    this.cache.set(key, { data, timestamp: Date.now(), ttl: this.getTTL(digestNumber) });
  }

  get(digestNumber: number): CachedDigest | null {
    const key = this.getCacheKey(digestNumber);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  getLatest(): CachedDigest | null {
    let latest: { data: CachedDigest; timestamp: number; ttl: number; num: number } | null = null;
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        continue;
      }
      const num = parseInt(key.replace('digest-', ''), 10);
      if (!latest || num > latest.num) {
        latest = { ...entry, num };
      }
    }
    return latest?.data ?? null;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const digestCache = new DigestCache();

if (typeof window === 'undefined') {
  setInterval(() => digestCache.cleanup(), 10 * 60 * 1000);
}

export { digestCache };

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLatestDigest,
  parseDigestHTML,
  batchFetchPostData,
  buildProcessedPosts,
  digestCache,
} from '@/lib/travelDigest';
import { TravelDigest, DigestFetchResult } from '@/types/post';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skipCache = searchParams.get('skipCache') === 'true';
    const clearCache = searchParams.get('clearCache') === 'true';

    if (clearCache) {
      digestCache.clear();
    }

    // Try cache first
    if (!skipCache) {
      const cached = digestCache.getLatest();
      if (cached) {
        console.log(`Serving cached digest #${cached.digest.digestNumber}`);
        const result: DigestFetchResult = {
          success: true,
          digest: cached.digest,
          processedPosts: cached.processedPosts,
          cached: true,
        };
        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }
    }

    // 1) Fetch latest digest in a single RPC call
    const { digestNumber, body, created } = await fetchLatestDigest();
    console.log(`Fetched digest #${digestNumber} via bridge.get_account_posts`);

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'No content found in digest post' } satisfies DigestFetchResult,
        { status: 404 }
      );
    }

    // 2) Parse the HTML to extract 3 featured posts
    const digestPosts = parseDigestHTML(body);

    if (digestPosts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No posts found in digest' } satisfies DigestFetchResult,
        { status: 404 }
      );
    }

    // 3) Batch-fetch enrichment data for all posts in a single RPC call
    const enrichmentData = await batchFetchPostData(
      digestPosts.map((p) => ({ author: p.author, permlink: p.permlink }))
    );

    // 4) Build fully enriched ProcessedPost[]
    const processedPosts = buildProcessedPosts(digestPosts, enrichmentData);

    const digest: TravelDigest = {
      digestNumber,
      publishDate: created,
      posts: digestPosts,
    };

    // Cache the fully enriched result
    digestCache.set(digestNumber, { digest, processedPosts });

    const result: DigestFetchResult = {
      success: true,
      digest,
      processedPosts,
      cached: false,
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Error in travel-digest API:', error);

    // Try to serve stale cache on error
    const stale = digestCache.getLatest();
    if (stale) {
      console.log(`Serving stale cached digest #${stale.digest.digestNumber} after error`);
      const result: DigestFetchResult = {
        success: true,
        digest: stale.digest,
        processedPosts: stale.processedPosts,
        cached: true,
        error: 'Using cached data due to fetch error',
      };
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        return NextResponse.json(
          { success: false, error: 'Request timeout' } satisfies DigestFetchResult,
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' } satisfies DigestFetchResult,
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

/**
 * Body: { posts: [{ author: string, permlink: string }, ...] }
 * Max 20 posts per request.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'posts array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (posts.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 posts per batch request' },
        { status: 400 }
      );
    }

    // Validate each entry
    for (const p of posts) {
      if (!p.author || !p.permlink) {
        return NextResponse.json(
          { error: 'Each post must have author and permlink' },
          { status: 400 }
        );
      }
    }

    // Build a JSON-RPC batch request
    const batchRequest = posts.map(
      (p: { author: string; permlink: string }, i: number) => ({
        jsonrpc: '2.0',
        method: 'bridge.get_post',
        params: { author: p.author, permlink: p.permlink },
        id: i + 1,
      })
    );

    // Try nodes in order until one succeeds
    let lastError: Error | null = null;
    for (const node of HIVE_API_NODES) {
      try {
        const response = await fetch(node, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchRequest),
          signal: AbortSignal.timeout(15000), // 15s timeout
        });

        if (!response.ok) {
          lastError = new Error(`${node} responded with status ${response.status}`);
          continue;
        }

        const data = await response.json();

        // JSON-RPC batch returns an array of responses
        if (!Array.isArray(data)) {
          lastError = new Error(`${node} returned non-array response`);
          continue;
        }

        // Sort by id to maintain request order, then extract results
        const sorted = [...data].sort((a, b) => a.id - b.id);
        const results = sorted.map((item) => {
          if (item.error) {
            console.warn(
              `Hive batch: error for id ${item.id}:`,
              item.error.message
            );
            return null;
          }
          return item.result ?? null;
        });

        return NextResponse.json(
          { results },
          {
            headers: {
              'Cache-Control':
                'public, s-maxage=300, stale-while-revalidate=600',
            },
          }
        );
      } catch (err) {
        lastError = err as Error;
        console.warn(`Hive batch: node ${node} failed:`, (err as Error).message);
        continue;
      }
    }

    console.error('Hive batch: all nodes failed. Last error:', lastError);
    return NextResponse.json(
      { error: 'All Hive API nodes failed' },
      { status: 502 }
    );
  } catch (error) {
    console.error('Error in batch post route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

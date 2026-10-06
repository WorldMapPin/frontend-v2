import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/hive/post?author=xxx&permlink=xxx
 * Fetches a single post from the Hive blockchain by author and permlink.
 *
 * NOTE: This used to scrape `https://hive.blog/.../@author/permlink.json`.
 * hive.blog now sits behind a Cloudflare bot challenge, so every server-side
 * request to that endpoint gets a 403 "Just a moment..." HTML page. We now
 * query the public Hive RPC nodes via `condenser_api.get_content` instead,
 * which returns the same post object the client already parses.
 */

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

const RPC_TIMEOUT = 10_000;

class PostNotFoundError extends Error {}

async function hiveRpc(method: string, params: unknown[]): Promise<unknown> {
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
      const messages = err.errors.map((e: Error) => e.message);
      // Hivemind asserts "Post x/y does not exist" for unknown permlinks
      if (messages.some((m) => /does not exist/i.test(m))) {
        throw new PostNotFoundError(`${params.join('/')} does not exist`);
      }
      console.error('All Hive nodes failed:', messages);
    }
    throw new Error('All Hive API nodes failed');
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const author = searchParams.get('author');
  const permlink = searchParams.get('permlink');

  if (!author || !permlink) {
    return NextResponse.json(
      { error: 'Author and permlink are required' },
      { status: 400 }
    );
  }

  try {
    const post = (await hiveRpc('condenser_api.get_content', [
      author,
      permlink,
    ])) as { author?: string; permlink?: string } | null;

    // Some nodes return an empty shell (author === "") for unknown posts
    if (!post || !post.author || !post.permlink) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(
      { post },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    console.error('Error fetching from Hive:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post from Hive' },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { SortType } from '@/types/post';

interface RankedPostsParams {
  sort: SortType;
  tag: string;
  limit: number;
  observer: string;
  start_author?: string;
  start_permlink?: string;
}

/**
 * POST /api/hive/posts
 * Fetches ranked posts from Hive blockchain with pagination support
 * 
 * Body: { sort, limit, start_author?, start_permlink? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sort = 'created', 
      limit = 20, 
      start_author, 
      start_permlink 
    } = body;

    const params: RankedPostsParams = {
      sort: sort as SortType,
      tag: 'hive-163772', // WorldMapPin community tag
      limit: Math.min(limit, 50), // Cap at 50 for safety
      observer: ''
    };

    // Add cursor for pagination
    if (start_author && start_permlink) {
      params.start_author = start_author;
      params.start_permlink = start_permlink;
    }

    const response = await fetch('https://api.hive.blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'bridge.get_ranked_posts',
        params: params,
        id: 1
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch posts from Hive API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Hive API error' },
        { status: 500 }
      );
    }

    return NextResponse.json(data.result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching ranked posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


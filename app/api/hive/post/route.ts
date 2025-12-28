import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/hive/post?author=xxx&permlink=xxx
 * Fetches a single post from Hive blockchain by author and permlink
 */
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
    const hiveUrl = `https://hive.blog/hive-163772/@${author}/${permlink}.json`;
    
    const response = await fetch(hiveUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch post from Hive' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching from Hive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








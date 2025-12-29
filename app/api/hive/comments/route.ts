import { NextRequest, NextResponse } from 'next/server';

// List of available Hive API nodes for fallback
const hiveNodes = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

/**
 * Fetch comments from a Hive node using condenser_api.get_content_replies
 */
async function fetchCommentsFromNode(
  nodeUrl: string,
  author: string,
  permlink: string
): Promise<any> {
  const response = await fetch(nodeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_content_replies',
      params: [author, permlink],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Node ${nodeUrl} returned ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Hive API error');
  }

  return data.result;
}

/**
 * Calculate reputation score from raw reputation value
 */
function calculateReputation(rawReputation: string | number): number {
  const rep = typeof rawReputation === 'string' ? parseFloat(rawReputation) : rawReputation;
  if (rep === 0) return 25;
  
  const isNegative = rep < 0;
  const absRep = Math.abs(rep);
  const log = Math.log10(absRep);
  let reputation = Math.max(log - 9, 0);
  
  if (isNegative) {
    reputation = -reputation;
  }
  
  reputation = (reputation * 9) + 25;
  return Math.floor(reputation);
}

/**
 * Format relative time from ISO date string
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString + 'Z'); // Hive timestamps are UTC
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Process raw comment data into a cleaner format
 */
function processComment(rawComment: any): ProcessedComment {
  const pendingPayout = parseFloat(rawComment.pending_payout_value || '0');
  const totalPayout = parseFloat(rawComment.total_payout_value || '0');
  const curatorPayout = parseFloat(rawComment.curator_payout_value || '0');
  
  let payout = '0';
  if (pendingPayout > 0) {
    payout = `$${pendingPayout.toFixed(2)}`;
  } else if (totalPayout + curatorPayout > 0) {
    payout = `$${(totalPayout + curatorPayout).toFixed(2)}`;
  }

  return {
    id: rawComment.id,
    author: rawComment.author,
    permlink: rawComment.permlink,
    parentAuthor: rawComment.parent_author,
    parentPermlink: rawComment.parent_permlink,
    body: rawComment.body,
    created: rawComment.created,
    createdRelative: formatRelativeTime(rawComment.created),
    votes: rawComment.net_votes,
    payout,
    reputation: calculateReputation(rawComment.author_reputation),
    children: rawComment.children,
    depth: rawComment.depth,
  };
}

export interface ProcessedComment {
  id: number;
  author: string;
  permlink: string;
  parentAuthor: string;
  parentPermlink: string;
  body: string;
  created: string;
  createdRelative: string;
  votes: number;
  payout: string;
  reputation: number;
  children: number;
  depth: number;
}

/**
 * GET /api/hive/comments?author=xxx&permlink=xxx
 * Fetches comments/replies for a Hive post
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

  let lastError: Error | null = null;

  // Try each node until one succeeds
  for (const nodeUrl of hiveNodes) {
    try {
      const rawComments = await fetchCommentsFromNode(nodeUrl, author, permlink);
      
      // Process comments
      const comments: ProcessedComment[] = rawComments.map(processComment);
      
      // Sort by votes (highest first) then by date (newest first)
      comments.sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      });

      return NextResponse.json(
        { comments, count: comments.length },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    } catch (error) {
      lastError = error as Error;
      console.log(`Failed to fetch from ${nodeUrl}, trying next...`);
      continue;
    }
  }

  console.error('All Hive nodes failed:', lastError);
  return NextResponse.json(
    { error: 'Failed to fetch comments from Hive' },
    { status: 500 }
  );
}


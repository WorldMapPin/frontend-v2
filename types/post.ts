// TypeScript types for Hive posts

export type SortType = 'created' | 'trending' | 'hot' | 'payout';

export interface CuratedPost {
  url: string;
  source: string;
  author: string;
  permlink: string;
}

// Raw post from bridge.get_ranked_posts API
export interface HiveRankedPost {
  post_id: number;
  author: string;
  permlink: string;
  category: string;
  title: string;
  body: string;
  json_metadata: string;
  created: string;
  updated: string;
  depth: number;
  children: number;
  net_rshares: number;
  is_paidout: boolean;
  payout_at: string;
  payout: number;
  pending_payout_value: string;
  author_payout_value: string;
  curator_payout_value: string;
  promoted: string;
  replies: string[];
  active_votes: Array<{
    voter: string;
    rshares: number;
    percent: number;
    reputation: number;
  }>;
  author_reputation: number;
  stats: {
    hide: boolean;
    gray: boolean;
    total_votes: number;
    flag_weight: number;
  };
  url: string;
  beneficiaries: Array<{
    account: string;
    weight: number;
  }>;
  max_accepted_payout: string;
  percent_hbd: number;
  community?: string;
  community_title?: string;
}

export interface HivePostMetadata {
  image?: string[];
  tags?: string[];
  app?: string;
  format?: string;
}

export interface HivePostRaw {
  post: {
    title: string;
    author: string;
    permlink: string;
    created: string;
    body: string;
    json_metadata: string;
    pending_payout_value: string;
    total_payout_value?: string;
    curator_payout_value?: string;
    net_votes: number;
    children: number;
    author_reputation: number;
    cashout_time: string;
    active_votes: any[];
  };
}

export interface ProcessedPost {
  title: string;
  author: string;
  permlink: string;
  created: string;
  createdRelative: string;
  coverImage: string | null;
  tags: string[];
  payout: string;
  votes: number;
  comments: number;
  reputation: string;
  slug: string;
  bodyMarkdown?: string;
  images?: string[];
  readingTimeMin?: number;
  cashoutTime?: string;
  activeVotesCount?: number;
  canonicalUrl: string;
  rawJsonUrl: string;
}

export interface PostCache {
  [key: string]: {
    post: ProcessedPost;
    timestamp: number;
  };
}

// Travel Digest related interfaces
export interface DigestPost {
  rank: 1 | 2 | 3;
  title: string;
  author: string;
  permlink: string;
  imageUrl?: string;
  excerpt?: string;
  postUrl: string;
}

export interface TravelDigest {
  digestNumber: number;
  publishDate: string;
  posts: DigestPost[];
}

export interface DigestFetchResult {
  success: boolean;
  digest?: TravelDigest;
  error?: string;
  cached?: boolean;
}

// Hive Comment/Reply interfaces
export interface HiveComment {
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

export interface HiveCommentsResponse {
  comments: HiveComment[];
  count: number;
}

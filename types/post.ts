// TypeScript types for Hive posts

export interface CuratedPost {
  url: string;
  source: string;
  author: string;
  permlink: string;
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

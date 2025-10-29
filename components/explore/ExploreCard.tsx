'use client';

import { ProcessedPost } from '@/types/post';
import Link from 'next/link';
import PostCard from '@/components/shared/PostCard';

interface ExploreCardProps {
  post: ProcessedPost;
}

export default function ExploreCard({ post }: ExploreCardProps) {
  return (
    <Link href={`/read/${post.slug}`}>
      <PostCard
        coverImage={post.coverImage}
        title={post.title}
        username={post.author}
        reputation={post.reputation}
        tags={post.tags}
        votes={post.votes}
        comments={post.comments}
        payout={post.payout}
        date={post.created}
      />
    </Link>
  );
}

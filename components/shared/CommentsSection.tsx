'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { HiveComment } from '@/types/post';

// Configure marked for comment rendering
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
});

// Re-export for backwards compatibility
export type Comment = HiveComment;

interface CommentsSectionProps {
  author: string;
  permlink: string;
}

interface CommentItemProps {
  comment: HiveComment;
  onLoadReplies: (author: string, permlink: string) => Promise<HiveComment[]>;
}

/**
 * Single comment item component with nested replies support
 */
function CommentItem({ comment, onLoadReplies }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<HiveComment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Process markdown body
  const processedBody = useMemo(() => {
    if (!comment.body) return '';
    try {
      const rawHtml = marked.parse(comment.body) as string;
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
          'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'sup', 'sub',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
      });
    } catch {
      return '<p>Error rendering comment</p>';
    }
  }, [comment.body]);

  const handleLoadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    setLoadingReplies(true);
    try {
      const fetchedReplies = await onLoadReplies(comment.author, comment.permlink);
      setReplies(fetchedReplies);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  return (
    <div className="comment-item">
      {/* Comment Header */}
      <div className="flex items-start gap-3">
        {/* Collapse Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label={expanded ? 'Collapse comment' : 'Expand comment'}
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Avatar */}
        <Link href={`/user/${comment.author}`} className="flex-shrink-0">
          <img
            src={`https://images.hive.blog/u/${comment.author}/avatar/small`}
            alt={`${comment.author}'s avatar`}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 comment-avatar-border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-avatar.svg';
            }}
          />
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/user/${comment.author}`}
              className="font-semibold text-sm sm:text-base comment-author-link hover:underline"
            >
              @{comment.author}
            </Link>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium comment-reputation">
              {comment.reputation}
            </span>
            <span className="text-xs comment-date">
              {comment.createdRelative}
            </span>
          </div>

          {/* Comment Body */}
          {expanded && (
            <>
              <div
                className="mt-2 text-sm sm:text-base comment-body prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: processedBody }}
              />

              {/* Comment Footer */}
              <div className="flex items-center gap-3 mt-3">
                {/* Votes */}
                <div className="flex items-center gap-1 comment-votes">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-xs font-medium">{comment.votes}</span>
                </div>

                {/* Payout */}
                {comment.payout !== '0' && (
                  <span className="text-xs font-medium comment-payout">
                    {comment.payout}
                  </span>
                )}

                {/* Load Replies Button */}
                {comment.children > 0 && (
                  <button
                    onClick={handleLoadReplies}
                    disabled={loadingReplies}
                    className="flex items-center gap-1 text-xs font-medium comment-replies-btn hover:underline disabled:opacity-50"
                  >
                    {loadingReplies ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>
                          {showReplies ? 'Hide' : 'Show'} {comment.children} {comment.children === 1 ? 'reply' : 'replies'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Nested Replies */}
              {showReplies && replies.length > 0 && (
                <div className="mt-4 ml-2 sm:ml-4 pl-3 sm:pl-4 border-l-2 comment-replies-border space-y-4">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onLoadReplies={onLoadReplies}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Comments section component for post pages
 */
export default function CommentsSection({ author, permlink }: CommentsSectionProps) {
  const [comments, setComments] = useState<HiveComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch top-level comments
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/hive/comments?author=${encodeURIComponent(author)}&permlink=${encodeURIComponent(permlink)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    }

    if (author && permlink) {
      fetchComments();
    }
  }, [author, permlink]);

  // Handler for loading nested replies
  const handleLoadReplies = async (replyAuthor: string, replyPermlink: string): Promise<HiveComment[]> => {
    const response = await fetch(
      `/api/hive/comments?author=${encodeURIComponent(replyAuthor)}&permlink=${encodeURIComponent(replyPermlink)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch replies');
    }

    const data = await response.json();
    return data.comments || [];
  };

  return (
    <section className="mt-8 sm:mt-12 comments-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 sm:gap-3 group"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 sm:w-6 sm:h-6 comment-section-icon transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2
              className="text-lg sm:text-xl lg:text-2xl font-semibold comment-section-title"
              style={{ fontFamily: 'Lexend' }}
            >
              Comments
            </h2>
          </div>
          <span className="text-sm sm:text-base px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-medium comment-count-badge">
            {loading ? '...' : comments.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="comments-container rounded-xl p-4 sm:p-6">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 rounded-full comment-skeleton-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 rounded comment-skeleton-bg" />
                    <div className="h-3 w-3/4 rounded comment-skeleton-bg" />
                    <div className="h-3 w-1/2 rounded comment-skeleton-bg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 rounded-lg comment-error-container">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && comments.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 comment-empty-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm sm:text-base comment-empty-text" style={{ fontFamily: 'Lexend' }}>
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}

          {/* Comments List */}
          {!loading && !error && comments.length > 0 && (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLoadReplies={handleLoadReplies}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}


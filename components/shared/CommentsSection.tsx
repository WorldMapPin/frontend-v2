'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { HiveComment } from '@/types/post';
import { useHiveActions } from '@/hooks/use-hive-actions';
import CommentVoteSlider from '@/components/shared/CommentVoteSlider';

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
  onReplyPosted?: () => void;
}

/**
 * Single comment item component with nested replies support
 */
function CommentItem({ comment, onLoadReplies, onReplyPosted }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<HiveComment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState(false);

  const { comment: postComment, isCommenting, isLoggedIn, user } = useHiveActions();

  // Process markdown body - mobile friendly with image sizing
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

  // Handle posting reply
  const handlePostReply = async () => {
    if (!replyText.trim() || isCommenting) return;
    
    const result = await postComment(comment.author, comment.permlink, replyText.trim());
    
    if (result.success) {
      setReplySuccess(true);
      setReplyText('');
      setReplyError(null);
      
      // Refresh replies after delay
      setTimeout(() => {
        setShowReplyInput(false);
        setReplySuccess(false);
        // Reload replies to show new one
        setReplies([]);
        handleLoadReplies();
        onReplyPosted?.();
      }, 1500);
    } else {
      setReplyError(result.error || 'Failed to post reply');
    }
  };

  return (
    <div className="comment-item">
      {/* Comment Header */}
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Collapse Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 sm:mt-1 p-0.5 sm:p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label={expanded ? 'Collapse comment' : 'Expand comment'}
        >
          <svg
            className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
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
            className="w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover border-2 comment-avatar-border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-avatar.svg';
            }}
          />
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Author Info */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Link
              href={`/user/${comment.author}`}
              className="font-semibold text-xs sm:text-base comment-author-link hover:underline truncate max-w-[120px] sm:max-w-none"
            >
              @{comment.author}
            </Link>
            <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-medium comment-reputation">
              {comment.reputation}
            </span>
            <span className="text-[10px] sm:text-xs comment-date">
              {comment.createdRelative}
            </span>
          </div>

          {/* Comment Body */}
          {expanded && (
            <>
              <div
                className="mt-1.5 sm:mt-2 text-xs sm:text-base comment-body prose prose-sm max-w-none break-words font-lexend"
                dangerouslySetInnerHTML={{ __html: processedBody }}
              />

              {/* Comment Footer */}
              <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                {/* Value-based vote with slider */}
                <CommentVoteSlider
                  author={comment.author}
                  permlink={comment.permlink}
                  votes={comment.votes}
                />

                {/* Payout */}
                {comment.payout !== '0' && (
                  <span className="text-[10px] sm:text-xs font-medium comment-payout">
                    {comment.payout}
                  </span>
                )}

                {/* Reply Button */}
                {isLoggedIn && (
                  <button
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium comment-reply-btn hover:text-orange-500 transition-colors"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="hidden xs:inline">Reply</span>
                  </button>
                )}

                {/* Load Replies Button */}
                {comment.children > 0 && (
                  <button
                    onClick={handleLoadReplies}
                    disabled={loadingReplies}
                    className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium comment-replies-btn hover:underline disabled:opacity-50"
                  >
                    {loadingReplies ? (
                      <>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>
                          {showReplies ? 'Hide' : ''} {comment.children} <span className="hidden sm:inline">{comment.children === 1 ? 'reply' : 'replies'}</span>
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Reply Input */}
              {showReplyInput && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg comment-reply-input-container">
                  {replySuccess ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-green-600">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium font-lexend">Posted!</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value);
                          if (replyError) setReplyError(null);
                        }}
                        placeholder={`Reply to @${comment.author}...`}
                        rows={2}
                        disabled={isCommenting}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50 font-lexend"
                      />
                      {replyError && (
                        <p className="text-[10px] sm:text-xs text-red-500 truncate font-lexend">{replyError}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-xs text-gray-400 truncate font-lexend">as @{user}</span>
                        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setShowReplyInput(false);
                              setReplyText('');
                              setReplyError(null);
                            }}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors font-lexend"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handlePostReply}
                            disabled={isCommenting || !replyText.trim()}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-lexend"
                          >
                            {isCommenting ? (
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <span>Reply</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nested Replies */}
              {showReplies && replies.length > 0 && (
                <div className="mt-3 sm:mt-4 ml-1 sm:ml-4 pl-2 sm:pl-4 border-l-2 comment-replies-border space-y-3 sm:space-y-4">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onLoadReplies={onLoadReplies}
                      onReplyPosted={onReplyPosted}
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
 * Comment input component for logged-in users
 */
function CommentInput({ 
  author, 
  permlink, 
  onCommentPosted 
}: { 
  author: string; 
  permlink: string; 
  onCommentPosted: () => void;
}) {
  const { comment, isCommenting, isLoggedIn, user } = useHiveActions();
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;

    const result = await comment(author, permlink, commentText.trim());
    
    if (result.success) {
      setSuccess(true);
      setCommentText('');
      setError(null);
      
      // Refresh comments after a short delay
      setTimeout(() => {
        onCommentPosted();
        setSuccess(false);
      }, 1500);
    } else {
      setError(result.error || 'Failed to post comment');
    }
  }, [commentText, isCommenting, author, permlink, comment, onCommentPosted]);

  if (!isLoggedIn) {
    return (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl comment-login-prompt">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate font-lexend" style={{ color: 'var(--text-secondary)' }}>
                Log in to join the conversation
              </p>
              <p className="text-[10px] sm:text-xs hidden sm:block font-lexend" style={{ color: 'var(--text-muted)' }}>
                Connect your Hive wallet to post comments
              </p>
            </div>
          </div>
          <Link 
            href="/signup"
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all text-center font-lexend"
          >
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
      <div className="flex gap-2 sm:gap-3">
        {/* User Avatar */}
        <img
          src={`https://images.hive.blog/u/${user}/avatar/small`}
          alt={`${user}'s avatar`}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 comment-avatar-border flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-avatar.svg';
          }}
        />
        
        {/* Input Area */}
        <div className="flex-1 space-y-2 sm:space-y-3">
          {success ? (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-green-600 font-lexend">
                Comment posted!
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Write a comment..."
                rows={2}
                disabled={isCommenting}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50 comment-input font-lexend"
              />
              
              {/* Error Message */}
              {error && (
                <div className="text-[10px] sm:text-xs text-red-500 flex items-center gap-1 font-lexend">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">{error}</span>
                </div>
              )}
              
              {/* Action Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs truncate font-lexend" style={{ color: 'var(--text-muted)' }}>
                  as @{user}
                </span>
                <button
                  type="submit"
                  disabled={isCommenting || !commentText.trim()}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 flex-shrink-0 font-lexend"
                >
                  {isCommenting ? (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="hidden sm:inline">Posting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
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
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [author, permlink, refreshKey]);

  // Handle comment posted - refresh comments
  const handleCommentPosted = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

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
    <section className="mt-6 sm:mt-12 comments-section font-lexend">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 sm:gap-3 group"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <svg
              className={`w-4 h-4 sm:w-6 sm:h-6 comment-section-icon transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-base sm:text-xl lg:text-2xl font-semibold comment-section-title">
              Comments
            </h2>
          </div>
          <span className="text-xs sm:text-base px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-medium comment-count-badge">
            {loading ? '...' : comments.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="comments-container rounded-lg sm:rounded-xl p-3 sm:p-6">
          {/* Comment Input for logged-in users */}
          <CommentInput 
            author={author} 
            permlink={permlink} 
            onCommentPosted={handleCommentPosted}
          />
          
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
              <p className="text-sm sm:text-base comment-empty-text">
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
                  onReplyPosted={handleCommentPosted}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );

}


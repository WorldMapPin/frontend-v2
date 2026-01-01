/**
 * Interactive Comment Button with quick comment modal
 * Allows users to quickly comment on Hive posts from the explore page
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useHiveActions } from '@/hooks/use-hive-actions';

interface CommentButtonProps {
  author: string;
  permlink: string;
  comments: number;
  postTitle: string;
  onCommentSuccess?: () => void;
  size?: 'sm' | 'md';
}

export default function CommentButton({ 
  author, 
  permlink, 
  comments, 
  postTitle,
  onCommentSuccess,
  size = 'md' 
}: CommentButtonProps) {
  const { comment, isCommenting, isLoggedIn, user } = useHiveActions();
  const [showModal, setShowModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close modal on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (!isCommenting) {
          setShowModal(false);
        }
      }
    }
    
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModal, isCommenting]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (showModal && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [showModal]);

  // Handle comment button click
  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      setError('Please log in to comment');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    setShowModal(!showModal);
    setSuccess(false);
    setError(null);
  }, [isLoggedIn, showModal]);

  // Submit comment
  const handleSubmitComment = useCallback(async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn || isCommenting || !commentText.trim()) return;

    const result = await comment(author, permlink, commentText.trim());
    
    if (result.success) {
      setSuccess(true);
      setCommentText('');
      setLocalComments(prev => prev + 1);
      onCommentSuccess?.();
      
      // Close modal after short delay
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 1500);
    } else {
      setError(result.error || 'Failed to post comment');
    }
  }, [isLoggedIn, isCommenting, commentText, author, permlink, comment, onCommentSuccess]);

  // Handle close
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCommenting) {
      setShowModal(false);
      setError(null);
    }
  }, [isCommenting]);

  const sizeClasses = size === 'sm' 
    ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' 
    : 'w-3 h-3 sm:w-4 sm:h-4';

  return (
    <div className="relative">
      {/* Comment Button */}
      <button
        onClick={handleCommentClick}
        className={`rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1 sm:gap-2 shadow-md explore-card-comments transition-all duration-200 ${
          isCommenting ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 hover:bg-blue-100'
        }`}
        style={{ 
          fontFamily: 'var(--font-lexend)', 
          backgroundColor: '#E4EDFF', 
          border: '2px solid #18367233' 
        }}
        title={isLoggedIn ? 'Add a comment' : 'Log in to comment'}
      >
        <svg 
          className={`${sizeClasses} explore-card-comments-icon`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          style={{ color: '#3B79F4' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-xs sm:text-sm font-normal explore-card-comments-text" style={{ color: '#001C55' }}>
          {localComments}
        </span>
      </button>

      {/* Comment Modal Popup */}
      {showModal && (
        <div 
          ref={modalRef}
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[300px] sm:w-[350px] animate-in fade-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {success ? (
            // Success State
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-600" style={{ fontFamily: 'var(--font-lexend)' }}>
                Comment posted successfully!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-lexend)' }}>
                  Quick Comment
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Post Reference */}
              <div className="text-xs text-gray-500 truncate" style={{ fontFamily: 'var(--font-lexend)' }}>
                Replying to: <span className="font-medium text-gray-700">{postTitle}</span>
              </div>

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Write your comment... (Markdown supported)"
                rows={4}
                disabled={isCommenting}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50 disabled:cursor-wait"
                style={{ fontFamily: 'var(--font-lexend)' }}
              />

              {/* Error Message */}
              {error && (
                <div className="text-xs text-red-500 flex items-center gap-1" style={{ fontFamily: 'var(--font-lexend)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Character Count */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span style={{ fontFamily: 'var(--font-lexend)' }}>
                  {commentText.length} characters
                </span>
                <span style={{ fontFamily: 'var(--font-lexend)' }}>
                  Posting as @{user}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCommenting || !commentText.trim()}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-lexend)' }}
              >
                {isCommenting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Error Toast (when not logged in) */}
      {error && !showModal && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-2 whitespace-nowrap"
          style={{ fontFamily: 'var(--font-lexend)' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}





/**
 * Post Voting Section - Interactive voting component for post read page
 * Expands inline below buttons when voting
 */

'use client';

import { useState, useCallback } from 'react';
import { useHiveActions } from '@/hooks/use-hive-actions';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';
import Link from 'next/link';

interface PostVotingSectionProps {
  author: string;
  permlink: string;
  votes: number;
  comments: number;
  onVoteSuccess?: (newWeight: number) => void;
}

export default function PostVotingSection({
  author,
  permlink,
  votes: initialVotes,
  comments,
  onVoteSuccess,
}: PostVotingSectionProps) {
  const { vote, isVoting, isLoggedIn, user } = useHiveActions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [voteWeight, setVoteWeight] = useState(100);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(initialVotes);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle vote click
  const handleVoteClick = useCallback(() => {
    if (!isLoggedIn) {
      setError('Please log in to vote');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsExpanded(!isExpanded);
    setError(null);
    setSuccess(false);
  }, [isLoggedIn, isExpanded]);

  // Submit vote
  const handleVote = useCallback(async () => {
    if (!isLoggedIn || isVoting) return;

    const weight = voteWeight * 100; // Convert percentage to basis points
    const result = await vote(author, permlink, weight);
    
    if (result.success) {
      setHasVoted(true);
      setLocalVotes(prev => prev + 1);
      setSuccess(true);
      onVoteSuccess?.(weight);
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess(false);
      }, 1500);
    } else {
      setError(result.error || 'Vote failed');
      setTimeout(() => setError(null), 3000);
    }
  }, [isLoggedIn, isVoting, voteWeight, author, permlink, vote, onVoteSuccess]);

  // Remove vote (set weight to 0)
  const handleRemoveVote = useCallback(async () => {
    if (!isLoggedIn || isVoting) return;

    const result = await vote(author, permlink, 0);
    
    if (result.success) {
      setHasVoted(false);
      setLocalVotes(prev => Math.max(0, prev - 1));
      setSuccess(true);
      onVoteSuccess?.(0);
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess(false);
      }, 1500);
    } else {
      setError(result.error || 'Failed to remove vote');
      setTimeout(() => setError(null), 3000);
    }
  }, [isLoggedIn, isVoting, author, permlink, vote, onVoteSuccess]);

  return (
    <div className="mt-6 sm:mt-10 lg:mt-12 mb-4 sm:mb-8">
      <div 
        className="rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300"
        style={{ 
          backgroundColor: 'var(--section-bg)', 
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {/* Header */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-3">
          <h2 className="text-sm sm:text-lg font-semibold text-center sm:text-left" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
            Engage with this post
          </h2>
        </div>

        {/* Buttons Row - Equal width buttons */}
        <div className="px-3 sm:px-6 pb-4">
          <div className="flex gap-2 sm:gap-3 max-w-xs sm:max-w-sm mx-auto">
            {/* Vote Button */}
            <button
              onClick={handleVoteClick}
              disabled={isVoting}
              className={`flex-1 h-9 sm:h-10 px-3 sm:px-4 rounded-full flex items-center justify-center gap-1.5 transition-all duration-300 ${
                hasVoted 
                  ? 'bg-pink-100 border-2 border-pink-300' 
                  : isExpanded
                  ? 'bg-pink-50 border-2 border-pink-400'
                  : 'bg-pink-50 border-2 border-pink-200 hover:border-pink-300 hover:bg-pink-100'
              } ${isVoting ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:scale-105'}`}
              style={{ fontFamily: 'var(--font-lexend)' }}
            >
              {isVoting ? (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-pink-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="font-medium text-xs text-pink-600 hidden xs:inline">...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" 
                    fill={hasVoted ? 'currentColor' : 'none'} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    style={{ color: '#DE2056' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-semibold text-xs sm:text-sm truncate" style={{ color: '#560018' }}>
                    {hasVoted ? 'Voted' : 'Vote'}
                  </span>
                  <span className="font-bold text-xs sm:text-sm flex-shrink-0" style={{ color: '#DE2056' }}>
                    {localVotes}
                  </span>
                </>
              )}
            </button>

            {/* Comments Button - Same size as Vote */}
            <button
              onClick={() => {
                const commentsSection = document.querySelector('.comments-section');
                if (commentsSection) {
                  commentsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 h-9 sm:h-10 px-3 sm:px-4 rounded-full flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer hover:scale-105"
              style={{ 
                fontFamily: 'var(--font-lexend)',
                backgroundColor: 'var(--comment-bg)', 
                border: '2px solid var(--comment-border)' 
              }}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--comment-color)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-semibold text-xs sm:text-sm truncate" style={{ color: 'var(--comment-color)' }}>
                Comments
              </span>
              <span className="font-bold text-xs sm:text-sm flex-shrink-0" style={{ color: 'var(--comment-color)' }}>
                {comments}
              </span>
            </button>
          </div>

          {/* Login Prompt (if not logged in) */}
          {!isLoggedIn && (
            <div className="mt-3 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                style={{ fontFamily: 'var(--font-lexend)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Log in to vote &amp; comment
              </Link>
            </div>
          )}
        </div>

        {/* Expanded Vote Weight Section - Full Width Inline */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isExpanded ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div 
            className="px-3 sm:px-6 py-4 sm:py-6 border-t"
            style={{ 
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border-color)'
            }}
          >
            {/* Vote Weight Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
                Select Vote Weight
              </span>
              <span 
                className="text-xl sm:text-2xl font-bold"
                style={{ 
                  fontFamily: 'var(--font-lexend)',
                  background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {voteWeight}%
              </span>
            </div>

            {/* Wide Slider */}
            <div className="relative mb-4 sm:mb-5">
              <input
                type="range"
                min="1"
                max="100"
                value={voteWeight}
                onChange={(e) => setVoteWeight(Number(e.target.value))}
                className="w-full h-2.5 sm:h-3 rounded-full appearance-none cursor-pointer touch-pan-y"
                style={{
                  background: `linear-gradient(to right, #ED6D28 0%, #FFA600 ${voteWeight}%, #e5e7eb ${voteWeight}%, #e5e7eb 100%)`
                }}
              />
              {/* Slider Markers */}
              <div className="flex justify-between mt-1.5 sm:mt-2 px-0.5">
                {[1, 25, 50, 75, 100].map((mark) => (
                  <span 
                    key={mark} 
                    className="text-[10px] sm:text-xs font-medium"
                    style={{ 
                      fontFamily: 'var(--font-lexend)',
                      color: voteWeight >= mark ? '#ED6D28' : 'var(--text-tertiary)'
                    }}
                  >
                    {mark}%
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5">
              {[10, 25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setVoteWeight(preset)}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 ${
                    voteWeight === preset 
                      ? 'text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ 
                    fontFamily: 'var(--font-lexend)',
                    ...(voteWeight === preset && {
                      background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)'
                    })
                  }}
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {hasVoted && (
                <button
                  onClick={handleRemoveVote}
                  disabled={isVoting}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-red-600 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-lexend)' }}
                >
                  Remove
                </button>
              )}
              <button
                onClick={handleVote}
                disabled={isVoting || success}
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white rounded-lg sm:rounded-xl transition-all disabled:cursor-wait ${
                  success 
                    ? 'bg-green-500' 
                    : 'hover:shadow-lg hover:scale-[1.02]'
                }`}
                style={{ 
                  fontFamily: 'var(--font-lexend)',
                  ...(!success && {
                    background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)'
                  })
                }}
              >
                {isVoting ? (
                  <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="hidden sm:inline">Submitting...</span>
                  </span>
                ) : success ? (
                  <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Done!</span>
                  </span>
                ) : (
                  <span>{hasVoted ? 'Update' : `Vote ${voteWeight}%`}</span>
                )}
              </button>
            </div>

            {/* Voting as */}
            <p className="text-[10px] sm:text-xs text-center mt-3 sm:mt-4" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-tertiary)' }}>
              as <span className="font-semibold" style={{ color: '#ED6D28' }}>@{user}</span>
            </p>

            {/* Error Message */}
            {error && (
              <div 
                className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-center text-xs sm:text-sm font-medium bg-red-50 border border-red-200 text-red-600"
                style={{ fontFamily: 'var(--font-lexend)' }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Vote Button with weight slider
 * Allows users to vote on Hive posts with customizable vote weight
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useHiveActions } from '@/hooks/use-hive-actions';

interface VoteButtonProps {
  author: string;
  permlink: string;
  votes: number;
  onVoteSuccess?: (newWeight: number) => void;
  size?: 'sm' | 'md';
}

export default function VoteButton({ 
  author, 
  permlink, 
  votes, 
  onVoteSuccess,
  size = 'md' 
}: VoteButtonProps) {
  const { vote, isVoting, isLoggedIn, user } = useHiveActions();
  const [showSlider, setShowSlider] = useState(false);
  const [voteWeight, setVoteWeight] = useState(100);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(votes);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Close slider on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
        setShowSlider(false);
      }
    }
    
    if (showSlider) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSlider]);

  // Handle vote click
  const handleVoteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      setError('Please log in to vote');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    if (hasVoted) {
      // Already voted, show slider to change vote
      setShowSlider(!showSlider);
      return;
    }
    
    setShowSlider(!showSlider);
  }, [isLoggedIn, hasVoted, showSlider]);

  // Submit vote
  const handleVote = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn || isVoting) return;

    const weight = voteWeight * 100; // Convert percentage to basis points
    const result = await vote(author, permlink, weight);
    
    if (result.success) {
      setHasVoted(true);
      setShowSlider(false);
      setLocalVotes(prev => prev + 1);
      onVoteSuccess?.(weight);
    } else {
      setError(result.error || 'Vote failed');
      setTimeout(() => setError(null), 3000);
    }
  }, [isLoggedIn, isVoting, voteWeight, author, permlink, vote, onVoteSuccess]);

  // Remove vote (set weight to 0)
  const handleRemoveVote = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn || isVoting) return;

    const result = await vote(author, permlink, 0);
    
    if (result.success) {
      setHasVoted(false);
      setShowSlider(false);
      setLocalVotes(prev => Math.max(0, prev - 1));
      onVoteSuccess?.(0);
    } else {
      setError(result.error || 'Failed to remove vote');
      setTimeout(() => setError(null), 3000);
    }
  }, [isLoggedIn, isVoting, author, permlink, vote, onVoteSuccess]);

  const sizeClasses = size === 'sm' 
    ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' 
    : 'w-3 h-3 sm:w-4 sm:h-4';

  return (
    <div className="relative" ref={sliderRef}>
      {/* Vote Button */}
      <button
        onClick={handleVoteClick}
        disabled={isVoting}
        className={`rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1 sm:gap-2 transition-all duration-200 ${
          hasVoted 
            ? 'bg-pink-200 border-pink-400' 
            : 'explore-card-votes hover:bg-pink-100'
        } ${isVoting ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105'}`}
        style={{ 
          fontFamily: 'var(--font-lexend)', 
          backgroundColor: hasVoted ? '#FFD6E0' : '#FFE6ED', 
          boxShadow: '0px 2px 4px 0px #B6000026', 
          border: hasVoted ? '2px solid #DE2056' : '2px solid #AA2C504D' 
        }}
        title={isLoggedIn ? (hasVoted ? 'Change vote' : 'Vote on this post') : 'Log in to vote'}
      >
        {isVoting ? (
          <svg className={`${sizeClasses} animate-spin text-pink-500`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg 
            className={`${sizeClasses} explore-card-votes-icon transition-colors`} 
            fill={hasVoted ? 'currentColor' : 'none'} 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            style={{ color: '#DE2056' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        <span className="text-xs sm:text-sm font-normal explore-card-votes-text" style={{ color: '#560018' }}>
          {localVotes}
        </span>
      </button>

      {/* Vote Weight Slider Popup */}
      {showSlider && (
        <div 
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-lexend)' }}>
                Vote Weight
              </span>
              <span className="text-lg font-bold text-orange-500" style={{ fontFamily: 'var(--font-lexend)' }}>
                {voteWeight}%
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="100"
              value={voteWeight}
              onChange={(e) => setVoteWeight(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />

            {/* Quick Preset Buttons */}
            <div className="flex gap-1.5">
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setVoteWeight(preset)}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                    voteWeight === preset 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'var(--font-lexend)' }}
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {hasVoted && (
                <button
                  onClick={handleRemoveVote}
                  disabled={isVoting}
                  className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-lexend)' }}
                >
                  Remove
                </button>
              )}
              <button
                onClick={handleVote}
                disabled={isVoting}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-wait"
                style={{ fontFamily: 'var(--font-lexend)' }}
              >
                {isVoting ? 'Voting...' : (hasVoted ? 'Update Vote' : 'Vote')}
              </button>
            </div>

            {/* Voting as */}
            <p className="text-xs text-center text-gray-400" style={{ fontFamily: 'var(--font-lexend)' }}>
              Voting as @{user}
            </p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-2 whitespace-nowrap"
          style={{ fontFamily: 'var(--font-lexend)' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}






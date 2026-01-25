'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHiveActions } from '@/hooks/use-hive-actions';

interface CommentVoteSliderProps {
  author: string;
  permlink: string;
  votes: number;
  onVoteSuccess?: (newWeight: number) => void;
}

const PRESETS = [25, 50, 75, 100] as const;

const OVERLAY_Z = 10000;
const BACKDROP_Z = 9998;

interface OverlayPosition {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  placement: 'above' | 'below';
}

function computeOverlayPosition(rect: DOMRect): OverlayPosition {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 320;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 568;
  const gap = 8;
  const width = vw < 400 ? 200 : 220;
  const assumedHeight = 160;

  const left = Math.max(gap, Math.min(rect.left + rect.width / 2 - width / 2, vw - width - gap));
  const spaceAbove = rect.top;
  const spaceBelow = vh - rect.bottom;
  const placeAbove = spaceAbove >= assumedHeight + gap || spaceAbove >= spaceBelow;

  if (placeAbove) {
    return { left, bottom: vh - rect.top + gap, width, placement: 'above' };
  }
  return { left, top: rect.bottom + gap, width, placement: 'below' };
}

export default function CommentVoteSlider({
  author,
  permlink,
  votes,
  onVoteSuccess,
}: CommentVoteSliderProps) {
  const { vote, isVoting, isLoggedIn } = useHiveActions();
  const [showSlider, setShowSlider] = useState(false);
  const [voteWeight, setVoteWeight] = useState(100);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(votes);
  const [error, setError] = useState<string | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setShowSlider(false), []);

  // Compute overlay position when opening
  useLayoutEffect(() => {
    if (!showSlider || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setOverlayPosition(computeOverlayPosition(rect));
  }, [showSlider]);

  // Clear position when closed; close on scroll or Escape
  useEffect(() => {
    if (!showSlider) {
      setOverlayPosition(null);
      return;
    }
    const onScroll = () => close();
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showSlider, close]);

  const handleTriggerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn) {
        setError('Log in to vote');
        setTimeout(() => setError(null), 2000);
        return;
      }
      setShowSlider((prev) => !prev);
      setError(null);
    },
    [isLoggedIn]
  );

  const handleVote = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn || isVoting) return;

      const weight = voteWeight * 100;
      const result = await vote(author, permlink, weight);

      if (result.success) {
        setHasVoted(true);
        setShowSlider(false);
        setLocalVotes((prev) => prev + 1);
        onVoteSuccess?.(weight);
      } else {
        setError(result.error || 'Vote failed');
        setTimeout(() => setError(null), 3000);
      }
    },
    [isLoggedIn, isVoting, voteWeight, author, permlink, vote, onVoteSuccess]
  );

  const handleRemoveVote = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn || isVoting) return;

      const result = await vote(author, permlink, 0);

      if (result.success) {
        setHasVoted(false);
        setShowSlider(false);
        setLocalVotes((prev) => Math.max(0, prev - 1));
        onVoteSuccess?.(0);
      } else {
        setError(result.error || 'Failed to remove vote');
        setTimeout(() => setError(null), 3000);
      }
    },
    [isLoggedIn, isVoting, author, permlink, vote, onVoteSuccess]
  );

  const overlayContent = showSlider && (
    <>
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close"
        className="fixed inset-0 comment-vote-backdrop"
        style={{ zIndex: BACKDROP_Z }}
        onClick={close}
      />

      <div
        ref={sliderRef}
        className="comment-vote-slider-popover comment-vote-fade-in fixed rounded-xl shadow-xl"
        style={{
          fontFamily: 'var(--font-lexend)',
          zIndex: OVERLAY_Z,
          left: overlayPosition?.left ?? 16,
          width: overlayPosition?.width ?? 200,
          ...(overlayPosition
            ? overlayPosition.placement === 'above'
              ? { bottom: overlayPosition.bottom }
              : { top: overlayPosition.top }
            : { top: 16 }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 space-y-3">
          {/* Header: weight % */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Weight
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{
                background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {voteWeight}%
            </span>
          </div>

          {/* Slider - touch-friendly on mobile */}
          <input
            type="range"
            min={1}
            max={100}
            value={voteWeight}
            onChange={(e) => setVoteWeight(Number(e.target.value))}
            className="w-full h-2 sm:h-2.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ED6D28 0%, #FFA600 ${voteWeight}%, var(--skeleton-bg) ${voteWeight}%, var(--skeleton-bg) 100%)`,
            }}
            aria-label={`Vote weight ${voteWeight} percent`}
          />

          {/* Presets only */}
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setVoteWeight(p)}
                className={`flex-1 min-w-0 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors ${
                  voteWeight === p ? 'text-white' : 'hover:opacity-90 active:opacity-80'
                }`}
                style={{
                  ...(voteWeight === p
                    ? { background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)' }
                    : { backgroundColor: 'var(--section-bg)', color: 'var(--text-secondary)' }),
                }}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Actions: Remove + Vote on their own row */}
          <div className="flex gap-2 pt-0.5">
            {hasVoted && (
              <button
                type="button"
                onClick={handleRemoveVote}
                disabled={isVoting}
                className="px-3 py-1.5 text-xs font-medium rounded-lg comment-vote-remove-btn disabled:opacity-50 shrink-0"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={handleVote}
              disabled={isVoting}
              className="flex-1 min-w-0 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-wait shrink-0"
              style={{ background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)' }}
            >
              {isVoting ? '…' : hasVoted ? 'Update' : 'Vote'}
            </button>
          </div>

          {error && (
            <p className="text-[10px] sm:text-xs text-center text-red-600 dark:text-red-400 pt-0.5">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={`relative ${showSlider ? 'z-[9999]' : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          disabled={isVoting || !isLoggedIn}
          className={`flex items-center gap-0.5 sm:gap-1 comment-votes transition-all ${
            isLoggedIn ? 'cursor-pointer hover:scale-105 active:scale-100' : 'cursor-default'
          } ${hasVoted ? 'text-pink-500' : ''}`}
          title={isLoggedIn ? (hasVoted ? 'Change vote' : 'Vote') : 'Log in to vote'}
          aria-label={isLoggedIn ? (hasVoted ? 'Change vote' : 'Vote') : 'Log in to vote'}
        >
          {isVoting ? (
            <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill={hasVoted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
          <span className="text-[10px] sm:text-xs font-medium">{localVotes}</span>
        </button>

        {/* Error toast when closed (e.g. not logged in) */}
        {error && !showSlider && (
          <div
            className="absolute left-0 top-full mt-1 z-[100] px-2 py-1.5 rounded text-[10px] sm:text-xs font-medium comment-vote-fade-in whitespace-nowrap comment-vote-error"
            style={{ fontFamily: 'var(--font-lexend)' }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Portal overlay + backdrop into body */}
      {typeof document !== 'undefined' && overlayContent && createPortal(overlayContent, document.body)}
    </>
  );
}

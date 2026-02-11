'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { fetchUserPostsWithCoords } from '../../../lib/worldmappinApi';
import { batchFetchPosts } from '@/utils/hivePosts';
import { ProcessedPost } from '@/types/post';
import ExploreCard from '@/components/explore/ExploreCard';
import { Search, X, ChevronDown, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface UserPostsProps {
  username: string;
  initialPins?: any[];
}

/** Lightweight pin reference from WorldMapPin API (no Hive enrichment). */
interface PinRef {
  author: string;
  permlink: string;
  title: string;
  created: string;
  image: string | null;
}

const POSTS_PER_PAGE = 12;

type SortOption = 'newest' | 'oldest';

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'Newest', icon: <Clock className="w-4 h-4" /> },
  { value: 'oldest', label: 'Oldest', icon: <Calendar className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserPosts({ username, initialPins }: UserPostsProps) {
  // Phase 1: full lightweight list (loaded once)
  const [allPins, setAllPins] = useState<PinRef[]>([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [pinsError, setPinsError] = useState<string | null>(null);

  // Phase 2: enriched posts for the current page only
  const [enrichedPosts, setEnrichedPosts] = useState<ProcessedPost[]>([]);
  const [enriching, setEnriching] = useState(false);

  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Ref to prevent duplicate enrichment calls
  const enrichAbort = useRef<AbortController | null>(null);

  // -----------------------------------------------------------------------
  // Phase 1: Load ALL pin references (lightweight, once on mount)
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadPins() {
      try {
        setPinsLoading(true);
        setPinsError(null);

        let basicPosts: any[] = [];
        if (initialPins && initialPins.length > 0) {
          basicPosts = initialPins;
        } else {
          basicPosts = await fetchUserPostsWithCoords(username);
        }

        if (cancelled) return;

        // Map to lightweight PinRef objects
        const pins: PinRef[] = basicPosts
          .filter((p: any) => p.author && p.permlink)
          .map((p: any) => ({
            author: p.author,
            permlink: p.permlink,
            title: p.title || p.postTitle || 'Untitled',
            created: p.created || p.postDate || '',
            image: p.image || p.postImageLink || null,
          }));

        setAllPins(pins);
        setPinsLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading pins:', err);
          setPinsError('Failed to load posts. Please try again later.');
          setPinsLoading(false);
        }
      }
    }

    if (username) loadPins();
    return () => { cancelled = true; };
  }, [username, initialPins]);

  // -----------------------------------------------------------------------
  // Derived: filtered + sorted pin list (operates on full dataset)
  // -----------------------------------------------------------------------
  const filteredPins = useMemo(() => {
    let list = [...allPins];

    // Search by title (case-insensitive substring match)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((pin) => pin.title.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      const da = new Date(a.created).getTime() || 0;
      const db = new Date(b.created).getTime() || 0;
      return sortOption === 'newest' ? db - da : da - db;
    });

    return list;
  }, [allPins, searchQuery, sortOption]);

  // Total pages for current filtered list
  const totalPages = Math.max(1, Math.ceil(filteredPins.length / POSTS_PER_PAGE));

  // Clamp page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  // -----------------------------------------------------------------------
  // Phase 2: Enrich only the visible page
  // -----------------------------------------------------------------------
  const visiblePins = useMemo(
    () => filteredPins.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
    [filteredPins, currentPage]
  );

  useEffect(() => {
    // Abort any in-flight enrichment
    if (enrichAbort.current) enrichAbort.current.abort();
    const controller = new AbortController();
    enrichAbort.current = controller;

    if (visiblePins.length === 0) {
      setEnrichedPosts([]);
      return;
    }

    let cancelled = false;
    setEnriching(true);

    batchFetchPosts(visiblePins.map((p) => ({ author: p.author, permlink: p.permlink })))
      .then((results) => {
        if (cancelled) return;
        setEnrichedPosts(results.filter(Boolean) as ProcessedPost[]);
        setEnriching(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Enrichment failed:', err);
          setEnriching(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [visiblePins]);

  // -----------------------------------------------------------------------
  // Pagination helpers
  // -----------------------------------------------------------------------
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
      // Scroll to section top
      document.getElementById('user-posts-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [totalPages]
  );

  /** Generate an array of page numbers to render (with ellipsis markers as -1) */
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push(-1); // ellipsis
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push(-1); // ellipsis
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const currentSortOption = SORT_OPTIONS.find((o) => o.value === sortOption);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const SectionHeader = () => (
    <div className="flex items-center gap-2 sm:gap-3">
      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
        Pins
      </h2>
    </div>
  );

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (pinsLoading) {
    return (
      <section id="user-posts-section" className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <SectionHeader />
          </div>
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-amber-500"></div>
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg shadow-md overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="h-36 sm:h-44 md:h-48" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="p-3 sm:p-4">
                  <div className="h-3 sm:h-4 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                  <div className="h-3 sm:h-4 rounded w-1/2 mb-3 sm:mb-4" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                  <div className="flex gap-2 mb-3 sm:mb-4">
                    <div className="h-5 sm:h-6 rounded w-14 sm:w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                    <div className="h-5 sm:h-6 rounded w-14 sm:w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                  </div>
                  <div className="h-7 sm:h-8 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  if (pinsError) {
    return (
      <section id="user-posts-section" className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <SectionHeader />
          </div>
          <div className="text-center p-6 rounded-lg user-posts-error" style={{ color: 'var(--text-primary)' }}>
            <p>{pinsError}</p>
          </div>
        </div>
      </section>
    );
  }

  // -----------------------------------------------------------------------
  // Empty state (no pins at all)
  // -----------------------------------------------------------------------
  if (allPins.length === 0) {
    return (
      <section id="user-posts-section" className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <SectionHeader />
          </div>
          <div className="text-center py-8 sm:py-12">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
              No Posts Found
            </h3>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              @{username} hasn&apos;t shared any travel posts yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <section id="user-posts-section" className="py-6 sm:py-8 md:py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header + controls */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <SectionHeader />
              <span
                className="text-sm sm:text-base px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--section-bg)', color: 'var(--text-secondary)', fontFamily: 'var(--font-lexend)' }}
              >
                {allPins.length}
              </span>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="text"
                  placeholder="Search pins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-lexend)',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <X className="w-4 h-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-lexend)',
                  }}
                >
                  {currentSortOption?.icon}
                  <span className="hidden sm:inline">{currentSortOption?.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-20 border"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setSortOption(option.value); setShowSortDropdown(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${sortOption === option.value ? 'font-semibold' : ''}`}
                          style={{
                            color: sortOption === option.value ? '#ED6D28' : 'var(--text-primary)',
                            backgroundColor: sortOption === option.value ? 'rgba(237, 109, 40, 0.1)' : 'transparent',
                            fontFamily: 'var(--font-lexend)',
                          }}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search results count */}
          {searchQuery && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-lexend)' }}>
              Found {filteredPins.length} {filteredPins.length === 1 ? 'pin' : 'pins'} matching &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        {/* Posts grid */}
        {filteredPins.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--section-bg)' }}>
              <Search className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
              No pins found
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Try a different search term
            </p>
          </div>
        ) : (
          <>
            {/* Card grid -- show enriched posts when ready, skeleton while enriching */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {enriching || enrichedPosts.length === 0
                ? visiblePins.map((pin, i) => (
                    <div key={`skel-${pin.author}-${pin.permlink}`} className="rounded-lg shadow-md overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <div className="h-36 sm:h-44 md:h-48" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                      <div className="p-3 sm:p-4">
                        <div className="h-3 sm:h-4 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                        <div className="h-3 sm:h-4 rounded w-1/2 mb-3 sm:mb-4" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                        <div className="flex gap-2 mb-3 sm:mb-4">
                          <div className="h-5 sm:h-6 rounded w-14 sm:w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                          <div className="h-5 sm:h-6 rounded w-14 sm:w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                        </div>
                        <div className="h-7 sm:h-8 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                      </div>
                    </div>
                  ))
                : enrichedPosts.map((post) => (
                    <ExploreCard key={post.slug} post={post} hideAvatar={true} />
                  ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <nav className="mt-8 sm:mt-10 flex items-center justify-center gap-1 sm:gap-2" aria-label="Pagination">
                {/* Prev */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {pageNumbers.map((p, idx) =>
                  p === -1 ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`min-w-[36px] h-9 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        p === currentPage ? 'text-white' : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: p === currentPage ? '#ED6D28' : 'var(--card-bg)',
                        borderColor: p === currentPage ? '#ED6D28' : 'var(--border-color)',
                        color: p === currentPage ? '#fff' : 'var(--text-primary)',
                        fontFamily: 'var(--font-lexend)',
                      }}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-xs sm:text-sm mt-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-lexend)' }}>
                Page {currentPage} of {totalPages} &middot; {filteredPins.length} {filteredPins.length === 1 ? 'pin' : 'pins'}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default UserPosts;

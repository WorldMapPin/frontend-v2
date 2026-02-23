'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { ProcessedPost, SortType } from '@/types/post';

const POSTS_PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Module-level pagination cache -- survives component unmount/remount
// during Next.js client navigation so back-button restores instantly.
// ---------------------------------------------------------------------------

interface PaginationCache {
  posts: ProcessedPost[];
  cursor: { author: string | null; permlink: string | null };
  sortType: SortType;
  hasMore: boolean;
  scrollY: number;
  timestamp: number;
}

const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
let exploreCache: PaginationCache | null = null;

function saveToCache(state: Omit<PaginationCache, 'timestamp'>) {
  exploreCache = { ...state, timestamp: Date.now() };
}

function loadFromCache(sortType: SortType): PaginationCache | null {
  if (
    !exploreCache ||
    exploreCache.sortType !== sortType ||
    exploreCache.posts.length === 0 ||
    Date.now() - exploreCache.timestamp > CACHE_MAX_AGE
  ) {
    return null;
  }
  return exploreCache;
}

function clearCache() {
  exploreCache = null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UsePostPaginatorOptions {
  initialSort?: SortType;
  postsPerPage?: number;
}

interface UsePostPaginatorReturn {
  posts: ProcessedPost[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  sortType: SortType;
  totalLoaded: number;
  fetchInitialPosts: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  changeSortType: (newSort: SortType) => void;
  reset: () => void;
}

export function usePostPaginator(
  options: UsePostPaginatorOptions = {},
): UsePostPaginatorReturn {
  const { initialSort = 'created', postsPerPage = POSTS_PER_PAGE } = options;

  // Hydrate from cache on first render so the DOM is immediately tall enough
  // for scroll restoration (no flash of skeleton/empty state).
  const initialCache = loadFromCache(initialSort);

  const [posts, setPosts] = useState<ProcessedPost[]>(initialCache?.posts ?? []);
  const [loading, setLoading] = useState(!initialCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialCache?.hasMore ?? true);
  const [sortType, setSortType] = useState<SortType>(initialSort);

  const lastAuthorRef = useRef<string | null>(initialCache?.cursor.author ?? null);
  const lastPermlinkRef = useRef<string | null>(initialCache?.cursor.permlink ?? null);

  const abortRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef(false);
  const restoredRef = useRef(!!initialCache);
  const pendingScrollY = useRef(initialCache?.scrollY ?? 0);

  // ---- Restore scroll position synchronously before paint ----
  useLayoutEffect(() => {
    if (pendingScrollY.current > 0) {
      const y = pendingScrollY.current;
      pendingScrollY.current = 0;
      window.scrollTo(0, y);
    }
  }, []);

  // ---- Persist scroll position on unmount / before navigating away ----
  useEffect(() => {
    return () => {
      if (exploreCache) {
        exploreCache.scrollY = window.scrollY;
      }
    };
  }, []);

  // ---- Fetch posts (API now returns ProcessedPost[] directly) ----
  const fetchPosts = useCallback(
    async (isInitial: boolean = false) => {
      if (fetchingRef.current && !isInitial) return;
      if (!hasMore && !isInitial) return;

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      fetchingRef.current = true;

      if (isInitial) {
        setLoading(true);
        setError(null);
        setPosts([]);
        lastAuthorRef.current = null;
        lastPermlinkRef.current = null;
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const requestBody: {
          sort: SortType;
          limit: number;
          start_author?: string;
          start_permlink?: string;
        } = { sort: sortType, limit: postsPerPage };

        if (!isInitial && lastAuthorRef.current && lastPermlinkRef.current) {
          requestBody.start_author = lastAuthorRef.current;
          requestBody.start_permlink = lastPermlinkRef.current;
        }

        const response = await fetch('/api/hive/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        // API now returns ProcessedPost[] directly -- no client processing needed
        const processedPosts: ProcessedPost[] = await response.json();

        const receivedCount = processedPosts.length;
        const hasCursor =
          !isInitial && lastAuthorRef.current && lastPermlinkRef.current;

        // Remove duplicate first post when cursor-paginating
        let newPosts = [...processedPosts];
        if (hasCursor && newPosts.length > 0) {
          newPosts.shift();
        }

        if (receivedCount < postsPerPage) {
          setHasMore(false);
        }

        if (newPosts.length > 0) {
          const lastPost = newPosts[newPosts.length - 1];
          lastAuthorRef.current = lastPost.author;
          lastPermlinkRef.current = lastPost.permlink;
        }

        if (isInitial) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          fetchingRef.current = false;
          return;
        }
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
        fetchingRef.current = false;
      }
    },
    [sortType, postsPerPage, hasMore],
  );

  const fetchInitialPosts = useCallback(() => fetchPosts(true), [fetchPosts]);
  const fetchNextPage = useCallback(() => fetchPosts(false), [fetchPosts]);

  const changeSortType = useCallback(
    (newSort: SortType) => {
      if (newSort !== sortType) {
        if (abortRef.current) abortRef.current.abort();
        clearCache();
        restoredRef.current = false;
        setSortType(newSort);
        lastAuthorRef.current = null;
        lastPermlinkRef.current = null;
        setHasMore(true);
        setPosts([]);
        setLoading(true);
      }
    },
    [sortType],
  );

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    clearCache();
    restoredRef.current = false;
    setPosts([]);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setHasMore(true);
    lastAuthorRef.current = null;
    lastPermlinkRef.current = null;
  }, []);

  // ---- Cleanup on unmount: cancel pending requests ----
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ---- Fetch when sort type changes (skip if restored from cache) ----
  useEffect(() => {
    if (restoredRef.current) return;
    fetchPosts(true);
  }, [sortType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Keep cache in sync whenever posts/cursor/hasMore change ----
  useEffect(() => {
    if (posts.length > 0) {
      saveToCache({
        posts,
        cursor: { author: lastAuthorRef.current, permlink: lastPermlinkRef.current },
        sortType,
        hasMore,
        scrollY: window.scrollY,
      });
    }
  }, [posts, hasMore, sortType]);

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    sortType,
    totalLoaded: posts.length,
    fetchInitialPosts,
    fetchNextPage,
    changeSortType,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Infinite scroll hook (unchanged)
// ---------------------------------------------------------------------------

export function useInfiniteScroll(
  onLoadMore: () => void,
  options: { threshold?: number; enabled?: boolean } = {},
) {
  const { threshold = 300, enabled = true } = options;
  const loadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold) {
        loadMoreRef.current();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, enabled]);
}

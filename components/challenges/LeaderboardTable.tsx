'use client';

import { useState, useMemo } from 'react';
import { Medal, Search, X, Ticket, ChevronDown, Check, ExternalLink, User, Trophy } from 'lucide-react';
import Link from 'next/link';

export interface LeaderboardItem {
    rank: number;
    username: string;
    score: number;
    scoreLabel: string;
}

interface LeaderboardTableProps {
    data: LeaderboardItem[];
    loading?: boolean;
    scoreLabel: string;
}

// Skeleton row for loading state
function SkeletonRow({ index }: { index: number }) {
    return (
        <div
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl animate-pulse"
            style={{
                backgroundColor: 'var(--card-bg)',
                animationDelay: `${index * 50}ms`
            }}
        >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
            <div className="flex-1">
                <div className="h-4 w-24 sm:w-32 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
            </div>
            <div className="h-6 w-16 sm:w-20 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
        </div>
    );
}

// Rank badge component
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md">
                <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-900" />
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center shadow-md">
                <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900" />
            </div>
        );
    }
    return (
        <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold"
            style={{
                backgroundColor: 'var(--section-bg)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-lexend)'
            }}
        >
            {rank}
        </div>
    );
}

export default function LeaderboardTable({ data, loading = false, scoreLabel }: LeaderboardTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [displayCount, setDisplayCount] = useState(20);

    // Filter and limit data based on search and display count
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) {
            return data.slice(0, displayCount);
        }
        return data.filter(item =>
            item.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery, displayCount]);

    const hasMore = !searchQuery && displayCount < data.length;

    const handleLoadMore = () => {
        setDisplayCount(prev => Math.min(prev + 20, data.length));
    };

    if (loading) {
        return (
            <div className="mx-auto px-2 sm:px-4 lg:px-8 pb-8" style={{ maxWidth: '1344px' }}>
                <div className="m-2 sm:m-4">
                    {/* Search skeleton */}
                    <div className="mb-4 h-12 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--skeleton-bg)' }} />

                    {/* Table skeleton */}
                    <div className="space-y-2">
                        {[...Array(10)].map((_, i) => (
                            <SkeletonRow key={i} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto px-2 sm:px-4 lg:px-8 pb-8" style={{ maxWidth: '1344px' }}>
            <div className="m-2 sm:m-4">
                {/* Search bar */}
                <div className="mb-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-lexend)'
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        >
                            <X className="w-5 h-5 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                        </button>
                    )}
                </div>

                {/* Results count */}
                {searchQuery && (
                    <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-lexend)' }}>
                        Found {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}
                    </p>
                )}

                {/* Leaderboard list */}
                <div className="space-y-2">
                    {filteredData.map((item) => (
                        <div
                            key={item.username}
                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl"
                            style={{
                                backgroundColor: 'var(--card-bg)',
                                boxShadow: '0px 2px 4px 0px var(--shadow-color)'
                            }}
                        >
                            {/* Rank badge */}
                            <RankBadge rank={item.rank} />

                            {/* Avatar */}
                            <img
                                src={`https://images.hive.blog/u/${item.username}/avatar`}
                                alt={`${item.username}'s avatar`}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2"
                                style={{ borderColor: 'var(--border-color)' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                                }}
                            />

                            {/* Username */}
                            <span
                                className="flex-1 font-medium text-sm sm:text-base"
                                style={{
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-lexend)'
                                }}
                            >
                                @{item.username}
                            </span>

                            {/* Score */}
                            <div
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm sm:text-base font-semibold"
                                style={{
                                    backgroundColor: scoreLabel === 'Tickets' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(237, 109, 40, 0.15)',
                                    color: scoreLabel === 'Tickets' ? '#0284c7' : '#ED6D28',
                                    fontFamily: 'var(--font-lexend)'
                                }}
                            >
                                {scoreLabel === 'Tickets' ? <Ticket className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                                <span>{item.score.toLocaleString()} {scoreLabel}</span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                {/* WorldMapPin Profile */}
                                <Link
                                    href={`/@${item.username}`}
                                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                    style={{
                                        backgroundColor: 'rgba(237, 109, 40, 0.1)',
                                        color: '#ED6D28'
                                    }}
                                    title="View on WorldMapPin"
                                >
                                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Link>

                                {/* PeakD Profile */}
                                <a
                                    href={`https://peakd.com/@${item.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                    style={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3B82F6'
                                    }}
                                    title="View on PeakD"
                                >
                                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {filteredData.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--section-bg)' }}>
                            <Search className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-lexend)' }}>
                            No participants found
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Try a different search term
                        </p>
                    </div>
                )}

                {/* Load more button */}
                {hasMore && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                                color: 'white',
                                fontFamily: 'var(--font-lexend)'
                            }}
                        >
                            <span>Load More</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* End of list */}
                {!hasMore && data.length > 0 && !searchQuery && displayCount >= data.length && (
                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ backgroundColor: 'var(--section-bg)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
                                    All {data.length.toLocaleString()} participants shown
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keep contributing to climb the ranks!</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

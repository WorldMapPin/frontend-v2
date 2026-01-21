'use client';

import { useEffect, useState } from 'react';
import ChallengesHero from '@/components/challenges/ChallengesHero';
import LeaderboardTable from '@/components/challenges/LeaderboardTable';
import { fetchWinterChallengeRankingData, WinterChallengeRankingData } from '@/lib/worldmappinApi';

export default function ChallengesPage() {
    const [data, setData] = useState<WinterChallengeRankingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const rankingData = await fetchWinterChallengeRankingData();
                setData(rankingData);
                setError(null);
            } catch (err) {
                console.error('Error fetching challenge data:', err);
                setError('Failed to load challenge data. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Error state
    if (error && !loading && data.length === 0) {
        return (
            <div className="relative min-h-screen overflow-hidden challenges-page-bg">
                <div className="relative z-10">
                    <ChallengesHero />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
                                Unable to load leaderboard
                            </h2>
                            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
                                style={{ fontFamily: 'var(--font-lexend)' }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden challenges-page-bg">
            <div className="relative z-10">
                <ChallengesHero
                    participantCount={loading ? undefined : data.length}
                    loading={loading}
                />
                <LeaderboardTable
                    data={data}
                    loading={loading}
                />
            </div>
        </div>
    );
}

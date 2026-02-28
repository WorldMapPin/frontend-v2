'use client';

import { useEffect, useState } from 'react';
import ChallengesHero from '@/components/challenges/ChallengesHero';
import LeaderboardTable from '@/components/challenges/LeaderboardTable';
import {
    fetchWinterChallengeRankingData,
    WinterChallengeRankingData,
    fetchRankingData,
    RankingData
} from '@/lib/worldmappinApi';

export default function LeaderboardPage() {
    // State
    const [activeTab, setActiveTab] = useState<'general' | 'challenges'>('general');

    // General Ranking Data
    const [generalData, setGeneralData] = useState<RankingData[]>([]);
    const [generalLoading, setGeneralLoading] = useState(true);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Challenges Data
    const [challengesData, setChallengesData] = useState<WinterChallengeRankingData[]>([]);
    const [challengesLoading, setChallengesLoading] = useState(true);
    const [challengesError, setChallengesError] = useState<string | null>(null);

    // Load Data
    useEffect(() => {
        async function loadGeneralData() {
            try {
                setGeneralLoading(true);
                const data = await fetchRankingData();
                setGeneralData(data);
                setGeneralError(null);
            } catch (err) {
                console.error('Error fetching general ranking data:', err);
                setGeneralError('Failed to load leaderboard data.');
            } finally {
                setGeneralLoading(false);
            }
        }

        async function loadChallengesData() {
            try {
                setChallengesLoading(true);
                const data = await fetchWinterChallengeRankingData();
                setChallengesData(data);
                setChallengesError(null);
            } catch (err) {
                console.error('Error fetching challenge data:', err);
                setChallengesError('Failed to load challenge data.');
            } finally {
                setChallengesLoading(false);
            }
        }

        loadGeneralData();
        loadChallengesData();
    }, []);

    // Transform data for common table interface
    const generalTableData = generalData.map(item => ({
        rank: item.rank,
        username: item.author,
        score: item.tds,
        scoreLabel: 'TDS'
    }));

    const challengesTableData = challengesData.map(item => ({
        rank: item.rank,
        username: item.username,
        score: item.tickets,
        scoreLabel: 'Tickets'
    }));

    const currentError = activeTab === 'general' ? generalError : challengesError;
    const currentLoading = activeTab === 'general' ? generalLoading : challengesLoading;
    const currentData = activeTab === 'general' ? generalTableData : challengesTableData;

    return (
        <div className="relative min-h-screen overflow-hidden challenges-page-bg">
            <div className="relative z-10">
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    <div className="flex justify-center">
                        <div
                            className="inline-flex backdrop-blur-md p-1 rounded-xl transition-colors duration-200"
                            style={{
                                backgroundColor: 'var(--tab-container-bg, rgba(89, 33, 2, 0.1))'
                            }}
                        >
                            <style jsx>{`
                                .dark div[style*="--tab-container-bg"] {
                                    background-color: rgba(255, 255, 255, 0.1) !important;
                                }
                            `}</style>
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'general'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg'
                                    : 'hover:bg-slate-200/50 dark:hover:bg-white/5'
                                    }`}
                                style={{
                                    fontFamily: 'var(--font-lexend)',
                                    color: activeTab === 'general' ? '#ffffff' : 'var(--foreground)'
                                }}
                            >
                                General Leaderboard
                            </button>
                            <button
                                onClick={() => setActiveTab('challenges')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'challenges'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg'
                                    : 'hover:bg-slate-200/50 dark:hover:bg-white/5'
                                    }`}
                                style={{
                                    fontFamily: 'var(--font-lexend)',
                                    color: activeTab === 'challenges' ? '#ffffff' : 'var(--foreground)'
                                }}
                            >
                                Winter Challenge
                            </button>
                        </div>
                    </div>
                </div>

                <ChallengesHero
                    participantCount={currentLoading ? undefined : currentData.length}
                    loading={currentLoading}
                    type={activeTab}
                />

                {currentError ? (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lexend)', color: 'var(--text-primary)' }}>
                            Unable to load leaderboard
                        </h2>
                        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{currentError}</p>
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
                ) : (
                    <LeaderboardTable
                        data={currentData}
                        loading={currentLoading}
                        scoreLabel={activeTab === 'general' ? 'TDS' : 'Tickets'}
                    />
                )}
            </div>
        </div>
    );
}

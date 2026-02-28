'use client';

import { Snowflake, Gift, Ticket, Trophy, Globe, MapPin, Award } from 'lucide-react';

interface ChallengesHeroProps {
    participantCount?: number;
    loading?: boolean;
    type?: 'general' | 'challenges';
}

export default function ChallengesHero({
    participantCount,
    loading = false,
    type = 'general'
}: ChallengesHeroProps) {

    // Render Winter Challenge Hero
    if (type === 'challenges') {
        return (
            <div className="mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4" style={{ maxWidth: '1344px' }}>
                <div className="rounded-xl sm:rounded-2xl shadow-lg m-2 sm:m-4 mt-3 sm:mt-4 relative overflow-hidden challenges-hero">
                    {/* Snowflake decorations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <Snowflake className="absolute w-12 h-12 text-white opacity-10" style={{ top: '5%', left: '3%' }} />
                        <Snowflake className="absolute w-8 h-8 text-white opacity-10" style={{ top: '50%', left: '10%' }} />
                        <Snowflake className="absolute w-10 h-10 text-white opacity-10" style={{ top: '20%', left: '25%' }} />
                        <Snowflake className="absolute w-10 h-10 text-white opacity-10" style={{ top: '15%', right: '15%' }} />
                        <Snowflake className="absolute w-6 h-6 text-white opacity-10" style={{ top: '60%', right: '25%' }} />
                        <Snowflake className="absolute w-8 h-8 text-white opacity-10" style={{ top: '75%', right: '5%' }} />
                        <Snowflake className="absolute w-6 h-6 text-white opacity-10" style={{ top: '80%', left: '40%' }} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm mb-3 sm:mb-4"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                fontFamily: 'var(--font-lexend)'
                            }}>
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-white font-medium">Current Challenge</span>
                        </div>

                        {/* Challenge Title */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8">
                            <div className="flex-1">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-lexend)' }}>
                                    <Snowflake className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                                    Winter Challenge
                                </h2>
                                <p className="text-white mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg opacity-90 max-w-2xl" style={{ fontFamily: 'var(--font-lexend)' }}>
                                    Collect tickets by posting travel content featuring winter destinations, snowy landscapes,
                                    and holiday adventures. The more you share, the more chances to win!
                                </p>

                                {/* Prize info */}
                                <div className="mt-4 sm:mt-5 flex flex-wrap gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                        <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        <div>
                                            <p className="text-white text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-lexend)' }}>Prizes</p>
                                            <p className="text-white/80 text-[10px] sm:text-xs" style={{ fontFamily: 'var(--font-lexend)' }}>Exciting rewards</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                        <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        <div>
                                            <p className="text-white text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-lexend)' }}>Tickets</p>
                                            <p className="text-white/80 text-[10px] sm:text-xs" style={{ fontFamily: 'var(--font-lexend)' }}>Earn per post</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        <div>
                                            <p className="text-white text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-lexend)' }}>Leaderboard</p>
                                            <p className="text-white/80 text-[10px] sm:text-xs" style={{ fontFamily: 'var(--font-lexend)' }}>Compete & rank up</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Participant Stats */}
                            <div
                                className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-2 p-4 sm:p-6 rounded-xl"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                            >
                                {loading ? (
                                    <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <div className="text-center">
                                            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend)' }}>
                                                {participantCount !== undefined ? participantCount.toLocaleString() : '—'}
                                            </div>
                                            <div className="text-white/80 text-xs sm:text-sm mt-1" style={{ fontFamily: 'var(--font-lexend)' }}>
                                                Participants
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // General Leaderboard Hero
    return (
        <div className="mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4" style={{ maxWidth: '1344px' }}>
            <div className="rounded-xl sm:rounded-2xl shadow-lg m-2 sm:m-4 mt-3 sm:mt-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)' }}>

                {/* Globe/Map decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img
                        src="/globe.svg"
                        alt="Globe"
                        className="absolute opacity-10 hidden sm:block"
                        style={{
                            right: '-2rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '300px',
                            height: '300px',
                            zIndex: 1
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm mb-3 sm:mb-4"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            fontFamily: 'var(--font-lexend)'
                        }}>
                        <Award className="w-3 h-3 text-white" />
                        <span className="text-white font-medium">All Time Ranking</span>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8">
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-lexend)' }}>
                                <Globe className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                                Global Leaderboard
                            </h2>
                            <p className="text-white mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg opacity-90 max-w-2xl" style={{ fontFamily: 'var(--font-lexend)' }}>
                                The most curated and active users on WorldMapPin. Earn TDS by contributing high-quality travel content.
                            </p>

                            {/* Info stats */}
                            <div className="mt-4 sm:mt-5 flex flex-wrap gap-3 sm:gap-4">
                                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    <div>
                                        <p className="text-white text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-lexend)' }}>Pins</p>
                                        <p className="text-white/80 text-[10px] sm:text-xs" style={{ fontFamily: 'var(--font-lexend)' }}>Discover places</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    <div>
                                        <p className="text-white text-xs sm:text-sm font-semibold" style={{ fontFamily: 'var(--font-lexend)' }}>Rank</p>
                                        <p className="text-white/80 text-[10px] sm:text-xs" style={{ fontFamily: 'var(--font-lexend)' }}>Based on curation</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Participant Stats */}
                        <div
                            className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-2 p-4 sm:p-6 rounded-xl"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                        >
                            {loading ? (
                                <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <div className="text-center">
                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend)' }}>
                                            {participantCount !== undefined ? participantCount.toLocaleString() : '—'}
                                        </div>
                                        <div className="text-white/80 text-xs sm:text-sm mt-1" style={{ fontFamily: 'var(--font-lexend)' }}>
                                            Ranked Users
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

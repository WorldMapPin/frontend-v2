'use client';

import React, { useState } from 'react';

const DUMMY_JOURNEYS = [
    {
        id: "j1",
        title: "Backpacking Through Southeast Asia",
        description: "A 3-month adventure covering Thailand, Vietnam, and Indonesia. Highlights include the Grand Palace and Halong Bay.",
        coverImage: "https://images.ecency.com/p/8SzwQc8j2KJowDDhWKsAuhwB91u12NqFp3HGEwLqG7q65HxgjL693aXJ7QoP2dF7eF9Kqf?format=match&mode=fit",
        pinCount: 14,
        date: "Dec 12, 2023"
    },
    {
        id: "j2",
        title: "European Summer Expedition",
        description: "Exploring the historic streets of Rome, the beaches of Barcelona, and the mountains of Switzerland.",
        coverImage: "https://images.ecency.com/p/8SzwQc8j2KJowDDhWKsAuhwB91u12NqFp3HGEwLqG7q65HxgjL693aXJ7QoP2dF7eF9Kqf?format=match&mode=fit",
        pinCount: 8,
        date: "Aug 05, 2023"
    },
    {
        id: "j3",
        title: "Himalayan Base Camp Trek",
        description: "The grueling but breathtaking journey up the Himalayas to the Everest Base Camp.",
        coverImage: "https://images.ecency.com/p/8SzwQc8j2KJowDDhWKsAuhwB91u12NqFp3HGEwLqG7q65HxgjL693aXJ7QoP2dF7eF9Kqf?format=match&mode=fit",
        pinCount: 22,
        date: "May 20, 2023"
    },
    {
        id: "j4",
        title: "Road Trip Across Route 66",
        description: "Classic American road trip down the historic Route 66 from Chicago to Santa Monica.",
        coverImage: "https://images.ecency.com/p/8SzwQc8j2KJowDDhWKsAuhwB91u12NqFp3HGEwLqG7q65HxgjL693aXJ7QoP2dF7eF9Kqf?format=match&mode=fit",
        pinCount: 19,
        date: "Nov 02, 2022"
    }
];

export default function UserJourneys({ username }: { username: string }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredJourneys = DUMMY_JOURNEYS.filter(j =>
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="py-8 sm:py-12" style={{ fontFamily: 'var(--font-lexend)', backgroundColor: 'var(--background)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 shadow-sm border border-orange-200">
                            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Journeys</h2>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Stories mapped by @{username}</p>
                        </div>
                    </div>

                    <div className="relative max-w-sm w-full">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search journeys..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium transition-all"
                            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                        />
                    </div>
                </div>

                {/* Journey Grid */}
                {filteredJourneys.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredJourneys.map(journey => (
                            <div
                                key={journey.id}
                                className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-orange-500/30 flex flex-col"
                                style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden w-full bg-gray-100">
                                    <img src={journey.coverImage} alt={journey.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                                    {/* Pin Count Badge */}
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                                        </svg>
                                        <span className="text-xs font-bold text-gray-800">{journey.pinCount}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                                        {journey.title}
                                    </h3>
                                    <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        {journey.description}
                                    </p>

                                    <div className="mt-auto pt-4 border-t w-full flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                                        <span className="text-xs font-bold uppercase tracking-wider text-orange-500">View Journey</span>
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{journey.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center rounded-2xl border border-dashed" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
                        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--section-bg)' }}>
                            <svg className="w-8 h-8 opacity-50" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--text-muted)' }}>
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No journeys found</h3>
                        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            We couldn't find any journeys matching your search.
                        </p>
                    </div>
                )}

            </div>
        </section>
    );
}

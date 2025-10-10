'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadJourneyState } from '../../utils/journeyStorage';
import { Journey } from '../../types';

export default function JourneysPage() {
  const [allJourneys, setAllJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-pins'>('newest');

  useEffect(() => {
    // Load all journeys from localStorage
    const state = loadJourneyState();
    setAllJourneys(state.journeys || []);
    setLoading(false);
  }, []);

  // Filter and sort journeys
  const filteredJourneys = allJourneys
    .filter(journey => {
      const query = searchQuery.toLowerCase();
      return (
        journey.name.toLowerCase().includes(query) ||
        journey.createdBy.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most-pins':
          return b.pins.length - a.pins.length;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Hero Header */}
      <div className="bg-[linear-gradient(119.72deg,_#FFA97B_31.83%,_#FFC464_89.02%)] text-white py-12 px-4 border-b-[2px] border-[#5E210040]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#592102]">🗺️ Travel Journeys</h1>
          <p className="text-xl text-[#592102] mb-6 opacity-90">
            Explore amazing travel stories from around the world
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-sm text-[#592102]">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-[#5E210040]">
              <span className="font-bold text-2xl">{allJourneys.length}</span>
              <span className="ml-2">Journeys</span>
            </div>
            <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-[#5E210040]">
              <span className="font-bold text-2xl">
                {allJourneys.reduce((sum, j) => sum + j.pins.length, 0)}
              </span>
              <span className="ml-2">Places</span>
            </div>
            <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-[#5E210040]">
              <span className="font-bold text-2xl">
                {new Set(allJourneys.map(j => j.createdBy)).size}
              </span>
              <span className="ml-2">Travelers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col md:flex-row gap-4 border border-orange-200">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search journeys or travelers..."
              className="w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          {/* Sort */}
          <div className="md:w-64">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="most-pins">📍 Most Places</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journeys Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {filteredJourneys.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery ? 'No journeys found' : 'No journeys yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try a different search term' : 'Start creating your first journey!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJourneys.map((journey) => (
              <Link
                key={journey.id}
                href={`/journey/${journey.createdBy}/${journey.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-orange-100">
                  {/* Journey Preview Image (using first pin's image) */}
                  <div className="relative h-48 bg-gradient-to-br from-orange-400 to-amber-500">
                    {journey.pins[0]?.imageUrl ? (
                      <img
                        src={journey.pins[0].imageUrl}
                        alt={journey.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🗺️</span>
                      </div>
                    )}
                    
                    {/* Pin Count Badge */}
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                      📍 {journey.pins.length} {journey.pins.length === 1 ? 'place' : 'places'}
                    </div>

                    {/* Travel Mode Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                      {journey.defaultTravelMode === 'DRIVING' && '🚗'}
                      {journey.defaultTravelMode === 'WALKING' && '🚶'}
                      {journey.defaultTravelMode === 'BICYCLING' && '🚴'}
                      {journey.defaultTravelMode === 'TRANSIT' && '🚌'}
                      {journey.defaultTravelMode === 'FLYING' && '✈️'}
                    </div>
                  </div>

                  {/* Journey Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {journey.name}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <span className="font-medium">👤 @{journey.createdBy}</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      Created {new Date(journey.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    {/* Preview of pins */}
                    {journey.pins.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-orange-200">
                        <div className="text-xs text-gray-600 mb-2 font-medium">Route:</div>
                        <div className="space-y-1">
                          {journey.pins.slice(0, 3).map((pin, index) => (
                            <div key={pin.id} className="text-xs text-gray-700 flex items-start">
                              <span className="mr-1 font-bold text-orange-500">{index + 1}.</span>
                              <span className="line-clamp-1">{pin.title}</span>
                            </div>
                          ))}
                          {journey.pins.length > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              + {journey.pins.length - 3} more stops
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


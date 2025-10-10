'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadJourneyState } from '../../../../utils/journeyStorage';
import { Journey } from '../../../../types';
import JourneyDetailMap from '../../../../components/journey/JourneyDetailMap';

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const journeyId = params.journeyId as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load journey from localStorage
    const state = loadJourneyState();
    const foundJourney = state.journeys.find(
      j => j.id === journeyId && j.createdBy.toLowerCase() === username.toLowerCase()
    );
    
    setJourney(foundJourney || null);
    setLoading(false);
  }, [journeyId, username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading journey...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Journey Not Found</h1>
          <p className="text-gray-600 mb-8">
            The journey you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/journeys"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            ← Browse All Journeys
          </Link>
        </div>
      </div>
    );
  }

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'DRIVING': return '🚗';
      case 'WALKING': return '🚶';
      case 'BICYCLING': return '🚴';
      case 'TRANSIT': return '🚌';
      case 'FLYING': return '✈️';
      default: return '🚗';
    }
  };

  const getTravelModeLabel = (mode: string) => {
    switch (mode) {
      case 'DRIVING': return 'Driving';
      case 'WALKING': return 'Walking';
      case 'BICYCLING': return 'Bicycling';
      case 'TRANSIT': return 'Transit';
      case 'FLYING': return 'Flying';
      default: return 'Driving';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-[linear-gradient(119.72deg,_#FFA97B_31.83%,_#FFC464_89.02%)] text-white py-8 px-4 border-b-[2px] border-[#5E210040]">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/journeys"
            className="inline-flex items-center text-[#592102] hover:text-[#331B00] mb-4 transition-colors opacity-90 hover:opacity-100"
          >
            ← Back to All Journeys
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#592102]">{journey.name}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#592102]">
            <div className="flex items-center space-x-2">
              <span className="font-medium">👤 By</span>
              <Link
                href={`/user/${journey.createdBy}`}
                className="font-bold underline hover:text-[#331B00] transition-colors"
              >
                @{journey.createdBy}
              </Link>
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1 border border-[#5E210040]">
              {getTravelModeIcon(journey.defaultTravelMode)} {getTravelModeLabel(journey.defaultTravelMode)}
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1 border border-[#5E210040]">
              📍 {journey.pins.length} {journey.pins.length === 1 ? 'place' : 'places'}
            </div>
            
            <div className="opacity-90">
              📅 {new Date(journey.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:grid-rows-[1fr]">
          {/* Map Preview - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-200 flex flex-col h-full">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500">
                <h2 className="text-xl font-bold text-white">🗺️ Journey Map</h2>
              </div>
              <div className="flex-1 min-h-[600px]">
                <JourneyDetailMap journey={journey} />
              </div>
            </div>
          </div>

          {/* Journey Details */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            {/* Journey Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-orange-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Journey Info</h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 font-medium mb-1">Traveler</div>
                  <Link
                    href={`/user/${journey.createdBy}`}
                    className="text-orange-600 hover:text-orange-700 font-medium underline"
                  >
                    @{journey.createdBy}
                  </Link>
                </div>
                
                <div>
                  <div className="text-gray-600 font-medium mb-1">Travel Mode</div>
                  <div className="flex items-center space-x-2">
                    <span>{getTravelModeIcon(journey.defaultTravelMode)}</span>
                    <span className="font-medium">{getTravelModeLabel(journey.defaultTravelMode)}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600 font-medium mb-1">Total Stops</div>
                  <div className="font-bold text-2xl text-orange-600">
                    {journey.pins.length}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600 font-medium mb-1">Created</div>
                  <div className="font-medium">
                    {new Date(journey.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Journey link copied to clipboard!');
                }}
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-medium shadow-lg"
              >
                📤 Share Journey
              </button>
            </div>

            {/* Journey Stats */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white border border-[#5E210040]">
              <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-orange-100">📸 Posts</span>
                  <span className="font-bold text-2xl">
                    {journey.pins.filter(p => p.pinType === 'post').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-100">📷 Snaps</span>
                  <span className="font-bold text-2xl">
                    {journey.pins.filter(p => p.pinType === 'snap').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-100">📝 Future Posts</span>
                  <span className="font-bold text-2xl">
                    {journey.pins.filter(p => p.pinType === 'future-post').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-100">📌 Placeholders</span>
                  <span className="font-bold text-2xl">
                    {journey.pins.filter(p => p.pinType === 'placeholder').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pins/Waypoints List */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-200">
          <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500">
            <h2 className="text-2xl font-bold text-white">📍 Journey Route ({journey.pins.length} stops)</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {journey.pins
                .sort((a, b) => a.order - b.order)
                .map((pin, index) => {
                  const nextPin = journey.pins.sort((a, b) => a.order - b.order)[index + 1];
                  const segment = nextPin ? journey.segments?.find(s => 
                    s.fromPinId === pin.id && s.toPinId === nextPin.id
                  ) : null;

                  return (
                    <div key={pin.id}>
                      {/* Pin Card */}
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all overflow-hidden">
                        {/* Pin Image */}
                        {pin.imageUrl && (
                          <div className="relative w-full h-48 md:h-56 lg:h-64 bg-gray-100">
                            <img 
                              src={pin.imageUrl} 
                              alt={pin.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                              {index + 1}
                            </div>
                            {/* Pin Type Badge */}
                            <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm font-medium">
                              {(!pin.pinType || pin.pinType === 'post') && '📄 Post'}
                              {pin.pinType === 'snap' && '📸 Snap'}
                              {pin.pinType === 'future-post' && '📝 Future Post'}
                              {pin.pinType === 'placeholder' && '📌 Placeholder'}
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            {/* Pin Number (if no image) */}
                            {!pin.imageUrl && (
                              <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
                                {index + 1}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{pin.title}</h3>
                              
                              {/* Post Link - if linked */}
                              {pin.postPermlink && (
                                <a 
                                  href={`https://worldmappin.com/@${pin.postAuthor}/${pin.postPermlink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block mb-3 p-3 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all"
                                >
                                  <div className="text-xs text-orange-700 font-bold mb-1">
                                    🔗 WorldMapPin Post
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    @{pin.postAuthor}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {pin.postPermlink}
                                  </div>
                                </a>
                              )}
                              
                              {/* Future Post Notice */}
                              {pin.pinType === 'future-post' && (
                                <div className="mb-3 p-3 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg border-2 border-orange-300">
                                  <div className="text-xs text-orange-700 font-bold mb-1">
                                    📝 Coming Soon
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    This travel post is coming up! Stay tuned for the full story from this location.
                                  </div>
                                </div>
                              )}
                              
                              {/* Placeholder Notice */}
                              {pin.pinType === 'placeholder' && (
                                <div className="mb-3 p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border-2 border-green-300">
                                  <div className="text-xs text-green-700 font-bold mb-1">
                                    📌 Waypoint
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    A memorable stop along the journey. This location marks an important point on the route.
                                  </div>
                                </div>
                              )}
                              
                              {/* Caption */}
                              {pin.imageCaption && (
                                <div className="mb-3 p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                                  <div className="text-xs text-purple-600 font-bold mb-1">
                                    💬 Caption
                                  </div>
                                  <div className="text-sm text-gray-800 italic">
                                    "{pin.imageCaption}"
                                  </div>
                                </div>
                              )}
                              
                              {/* Coordinates */}
                              <div className="text-sm text-gray-600 flex items-center space-x-2">
                                <span className="font-medium">📍</span>
                                <span>{pin.position.lat.toFixed(5)}, {pin.position.lng.toFixed(5)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Segment Arrow */}
                      {segment && nextPin && (
                        <div className="flex items-center justify-center py-3">
                          <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full border-2 border-gray-300">
                            <span className="text-2xl">{getTravelModeIcon(segment.travelMode)}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {getTravelModeLabel(segment.travelMode)}
                            </span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


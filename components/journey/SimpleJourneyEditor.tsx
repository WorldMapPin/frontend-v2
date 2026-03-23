'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Journey, JourneyState, TravelMode, JourneyPin } from '../../types';
import {
  saveJourneyState,
  saveJourney,
  generateUniqueId,
  mergeUserJourneysToState
} from '../../utils/journeyStorage';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';
import { fetchUserPostsWithCoords } from '../../lib/worldmappinApi';

interface SimpleJourneyEditorProps {
  onJourneyChange: (journey: Journey | null) => void;
  onStateChange: (state: JourneyState) => void;
  onShowUserPosts?: (username: string, onPostClick: (post: any) => void) => void;
}

export default function SimpleJourneyEditor({ onJourneyChange, onStateChange }: SimpleJourneyEditorProps) {
  const { user: username, isReady: isAuthenticated } = useAiohaSafe();

  const [searchTerm, setSearchTerm] = useState('');
  const [journeyName, setJourneyName] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Fetch the user's pins when authenticated
  useEffect(() => {
    async function loadUserPins() {
      if (!username) return;
      setIsLoadingPosts(true);
      try {
        const posts = await fetchUserPostsWithCoords(username);
        setUserPosts(posts);
      } catch (err) {
        console.error("Failed to load user posts", err);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    loadUserPins();
  }, [username]);

  // Create a new Journey whenever selections change
  useEffect(() => {
    if (selectedPostIds.length === 0 && !journeyName) {
      onJourneyChange(null);
      return;
    }

    const pins: JourneyPin[] = selectedPostIds.map((id, index) => {
      const post = userPosts.find(p => p.id === id)!;
      return {
        id: `pin-${post.id}`,
        position: { lat: post.lattitude || post.lat, lng: post.longitude || post.lng },
        title: post.title,
        description: post.location || post.formatted_address || '',
        order: index,
        pinType: 'post',
        postAuthor: post.author,
        postPermlink: post.permlink,
        imageUrl: post.image || post.imageUrl
      };
    });

    const activeJourney: Journey = {
      id: "draft-journey",
      name: journeyName || "Untitled Journey",
      createdBy: username || "anonymous",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      segments: [],
      pins,
      defaultTravelMode: "FLYING" // Default to flying for chronological connect
    };

    onJourneyChange(activeJourney);

    // Fit bounds if we have pins
    if (pins.length > 0) {
      window.dispatchEvent(new CustomEvent('fit-journey-bounds', {
        detail: { pins }
      }));
    }

  }, [selectedPostIds, journeyName, username, onJourneyChange, userPosts]);

  const togglePostSelection = useCallback((id: string) => {
    setSelectedPostIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  // Listen for the "add-pin-to-journey" custom event from MapClient
  useEffect(() => {
    const handleAddPinToJourney = (e: any) => {
      const featureId = e.detail?.featureId;
      if (featureId) {
        togglePostSelection(featureId);
      }
    };

    window.addEventListener("add-pin-to-journey", handleAddPinToJourney);
    return () => {
      window.removeEventListener("add-pin-to-journey", handleAddPinToJourney);
    };
  }, [togglePostSelection]);

  const handlePublish = () => {
    if (!journeyName.trim()) {
      alert("Please enter a Journey Name first.");
      return;
    }
    if (selectedPostIds.length === 0) {
      alert("Please select at least one post for the journey.");
      return;
    }
    // TODO: Connect to blockchain publish via Hive Keychain later
    alert(`Publishing Journey "${journeyName}" with ${selectedPostIds.length} posts to chain!`);
  };

  const filteredPosts = userPosts.filter(post =>
    (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.location || post.formatted_address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed top-0 left-0 bottom-0 w-full md:w-[420px] bg-[#FAF9F6] shadow-2xl z-[95] flex flex-col pt-14 md:pt-[60px]"
      style={{ fontFamily: 'var(--font-lexend)' }}
    >
      {/* Header Area */}
      <div className="px-6 pb-2 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Journey</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">Select posts to stitch your story.</p>

        {/* Search */}
        <div className="mt-6 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Find a place or a recent post..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
        <h3 className="text-xs font-bold text-gray-400 tracking-wider mb-4 uppercase">Recent Posts</h3>

        {isLoadingPosts ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            {searchTerm ? "No posts match your search." : "No posts found for your account."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => {
              const isSelected = selectedPostIds.includes(post.id);
              // Formatting the date nicely from 'YYYY-MM-DD...'
              const formattedDate = post.created
                ? new Date(post.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : "Unknown Date";

              const imageUrl = post.image || post.imageUrl || `https://images.ecency.com/p/8SzwQc8j2KJowDDhWKsAuhwB91u12NqFp3HGEwLqG7q65HxgjL693aXJ7QoP2dF7eF9Kqf?format=match&mode=fit`;
              const locationStr = post.location || post.formatted_address || "Unknown Location";

              return (
                <div
                  key={post.id}
                  onClick={() => togglePostSelection(post.id)}
                  className={`bg-white rounded-2xl p-3 flex gap-4 cursor-pointer transition-all duration-200 ${isSelected ? 'shadow-md border-transparent ring-2 ring-orange-500/20' : 'shadow-sm border border-gray-100 hover:shadow-md'
                    }`}
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                    <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{post.title}</h4>

                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-orange-500' : 'bg-gray-100 border border-gray-300'
                        }`}>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-gray-500 text-xs mb-1.5">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                      <span className="truncate">{locationStr}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-gray-400 text-xs font-medium">{formattedDate}</span>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        PUBLISHED
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col gap-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Journey Name</label>
          <input
            type="text"
            value={journeyName}
            onChange={(e) => setJourneyName(e.target.value)}
            placeholder="E.g., Golden Triangle Expedition"
            className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 px-4 text-sm font-semibold focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-gray-800 placeholder:text-gray-400 placeholder:font-medium"
          />
        </div>

        <button
          onClick={handlePublish}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-orange-500/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Publish
        </button>
      </div>

    </div>
  );
}

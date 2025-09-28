'use client';

import React, { useState, useEffect, useRef } from 'react';
import UserMapComponent from './UserMapComponent';
import WorldCoverageMap from './WorldCoverageMap';
import { fetchUserProfile, HiveUserProfile } from '../../../lib/hiveClient';
import { getUserPinCount, getUserRank } from '../../../lib/worldmappinApi';

interface UserProfileProps {
  username: string;
}

interface UserProfileData {
  name: string;
  about: string;
  location: string;
  website: string;
  profilePicture: string;
  pinCount: number;
  rank?: number;
  exists: boolean;
  worldCoverage?: number;
}

export function UserProfile({ username }: UserProfileProps) {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile from Hive blockchain
        const hiveProfile = await fetchUserProfile(username);
        
        if (!hiveProfile.exists) {
          setProfileData({
            name: 'User not found',
            about: '',
            location: '',
            website: '',
            profilePicture: '/images/worldmappin-logo.png',
            pinCount: 0,
            rank: 0,
            exists: false
          });
          setLoading(false);
          return;
        }

        // Fetch additional data in parallel
        const [pinCount, rank] = await Promise.all([
          getUserPinCount(username),
          getUserRank(username)
        ]);

        const profile = hiveProfile.profile!;
        
        // Calculate world coverage percentage based on pin count (static for now)
        const worldCoverage = Math.min(Math.round((pinCount / 100) * 100), 100);
        
        setProfileData({
          name: profile.name || username,
          about: profile.about || 'No description available',
          location: profile.location || 'Location not specified',
          website: profile.website || `https://peakd.com/@${username}`,
          profilePicture: hiveProfile.profilePicture || '/images/worldmappin-logo.png',
          pinCount,
          rank,
          exists: true,
          worldCoverage: worldCoverage || 23 // Default static percentage
        });
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfileData({
          name: 'Error loading profile',
          about: 'There was an error loading this user profile.',
          location: '',
          website: '',
          profilePicture: '/images/worldmappin-logo.png',
          pinCount: 0,
          rank: 0,
          exists: false
        });
        setLoading(false);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username]);

  const toggleMapExpansion = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  const minimizeProfile = () => {
    setIsMinimized(true);
  };

  const expandProfile = () => {
    setIsMinimized(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

    if (!profileData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600">The user @{username} could not be found.</p>
          </div>
        </div>
      );
    }

    if (!profileData.exists) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600">
              The user @{username} could not be found on the Hive blockchain.
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Please check the username spelling and try again.
            </p>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Profile Section */}
      <div className={`transition-all duration-300 ${isMinimized ? 'h-0 overflow-hidden' : ''}`}>
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-amber-50 to-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Close/Minimize Button */}
              <button
                onClick={minimizeProfile}
                className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Minimize profile"
              >
                <span className="text-gray-600 text-xl">−</span>
              </button>

              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <img
                    src={profileData.profilePicture}
                    alt={`${username}'s profile`}
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      {profileData.name}
                    </h1>
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      @{username}
                    </a>
                    {profileData.rank && (
                      <p className="text-sm text-gray-600 mt-1">
                        Curation Rank: #{profileData.rank}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed">
                      {profileData.about}
                    </p>
                    
                    {profileData.location && (
                      <p className="text-gray-600 flex items-center justify-center lg:justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profileData.location}
                      </p>
                    )}

                    <div className="flex items-center justify-center lg:justify-start space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {profileData.pinCount}
                        </div>
                        <div className="text-sm text-gray-600">Pins</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* World Coverage */}
                <div className="flex-shrink-0">
                  <WorldCoverageMap 
                    coveragePercentage={profileData.worldCoverage || 23}
                    username={username}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Minimized Profile Bar */}
      {isMinimized && (
        <div className="fixed top-16 left-0 right-0 bg-white shadow-lg border-b z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={profileData.profilePicture}
                  alt={`${username}'s profile`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h2 className="font-semibold text-gray-900">@{username}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{profileData.pinCount} Pins</span>
                    <span className="text-blue-600 font-medium">
                      {profileData.worldCoverage || 23}% World Coverage
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={expandProfile}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Show Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Map Section */}
      <section className={`${isMinimized ? 'pt-20' : ''}`}>
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Map Header */}
            <div className="py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {username}'s Travel Map
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Explore all the amazing places {username} has visited
                  </p>
                </div>
                <button
                  onClick={toggleMapExpansion}
                  className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center space-x-2"
                >
                  <span>{isMapExpanded ? 'Collapse Map' : 'Expand Map'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isMapExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className={`transition-all duration-500 overflow-hidden ${
              isMapExpanded ? 'max-h-screen' : 'max-h-96'
            }`}>
              <div className={`${isMapExpanded ? 'h-screen' : 'h-96'}`}>
                <UserMapComponent 
                  username={username}
                  isExpanded={isMapExpanded}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UserProfile;

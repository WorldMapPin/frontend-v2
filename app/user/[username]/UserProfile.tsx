'use client';

import React, { useState, useEffect } from 'react';
import UserMapComponent from './UserMapComponent';
import WorldCoverageMap from './WorldCoverageMap';
import UserPosts from './UserPosts';
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

  const minimizeProfile = () => {
    setIsMinimized(true);
  };

  const expandProfile = () => {
    setIsMinimized(false);
  };

  const formattedUsername =
    username && username.length > 0
      ? username.charAt(0).toUpperCase() + username.slice(1)
      : username;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

    if (!profileData) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600">The user @{username} could not be found.</p>
          </div>
        </div>
      );
    }

    if (!profileData.exists) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
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
        <section
          className="relative py-4 sm:py-7 lg:py-11 font-lexend"
          style={{
            background: 'linear-gradient(0deg, rgba(255, 166, 0, 0.14) 0%, rgba(237, 168, 40, 0.042) 111.74%)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Minimize Button - Hidden on mobile */}
            <button
              onClick={minimizeProfile}
              className="hidden sm:flex absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center transition-all z-10 hover:opacity-90"
              style={{ 
                background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
                color: 'white',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
              }}
              aria-label="Minimize profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-6 sm:gap-10 lg:gap-6 w-full">
                {/* Left side: Avatar and Text */}
                <div className="flex flex-col sm:flex-row lg:flex-row items-center sm:items-start lg:items-start gap-4 sm:gap-6 lg:gap-12 w-full lg:w-auto">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <img
                      src={profileData.profilePicture}
                      alt={`${username}'s profile`}
                      className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[220px] md:h-[220px] lg:w-[280px] lg:h-[280px] rounded-full object-cover border-[3px] border-[#ED6D284D] shadow-lg"
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="text-center sm:text-left flex-1">
                    <div className="mb-3 sm:mb-5">
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#ED6D28] mb-1 sm:mb-2">
                        {profileData.name}
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-[#45220B] font-medium">
                        @{username}
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-xs sm:text-sm lg:text-base text-[#45220B] leading-relaxed max-w-lg mx-auto sm:mx-0">
                        {profileData.about}
                      </p>
                      
                      {profileData.location && (
                        <div className="space-y-1.5 sm:space-y-2.5">
                          <p className="text-xs sm:text-sm lg:text-base text-[#45220B] italic flex items-center justify-center sm:justify-start">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="#45220B" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {profileData.location}
                          </p>
                          <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs sm:text-sm lg:text-base text-[#0657C1] hover:text-[#05479c] font-medium transition-colors text-center sm:text-left break-all"
                          >
                            {profileData.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Pins and Rank */}
                <div className="w-full sm:w-auto flex flex-row sm:flex-col gap-2 sm:gap-[6px] self-center mt-2 sm:mt-0">
                  {/* Pins - rounded top on desktop, rounded left on mobile */}
                  <div className="bg-[#EDA82847] px-3 sm:px-4 md:px-6 py-2.5 sm:py-[14px] md:py-[18px] rounded-l-[12px] sm:rounded-none sm:rounded-tl-[17px] sm:rounded-tr-[17px] border-[2px] border-[#EDA82899] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-[34px] md:gap-[42px] flex-1 sm:flex-none sm:min-w-[240px] md:min-w-[288px]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#5C2609] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10c0 5.523-9 12-9 12S3 15.523 3 10a9 9 0 1118 0z" />
                        <circle cx="12" cy="10" r="3" strokeWidth={2} />
                      </svg>
                      <span className="text-[11px] sm:text-[15px] md:text-[17px] text-[#5C2609] font-bold">Pins</span>
                    </div>
                    <span className="text-[24px] sm:text-[32px] md:text-[45px] font-bold text-[#5C2609]">{profileData.pinCount}</span>
                  </div>
                  
                  {/* Rank - rounded bottom on desktop, rounded right on mobile */}
                  {(profileData.rank !== undefined && profileData.rank !== null) && (
                    <div className="bg-[#B6000026] px-3 sm:px-4 md:px-6 py-2.5 sm:py-[14px] md:py-[18px] rounded-r-[12px] sm:rounded-r-none sm:rounded-b-[17px] border-[2px] border-[#B6000026] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-[34px] md:gap-[42px] flex-1 sm:flex-none sm:min-w-[240px] md:min-w-[288px]">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#5C0909] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-[11px] sm:text-[15px] md:text-[17px] text-[#5C0909] font-bold">Rank</span>
                      </div>
                      <span className="text-[24px] sm:text-[32px] md:text-[45px] font-bold text-[#5C0909]">{profileData.rank}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </section>
      </div>

      {/* Minimized Profile Bar - Hidden on mobile */}
      {isMinimized && (
        <div 
          className="hidden sm:block fixed top-16 left-0 right-0 z-50"
          style={{ 
            background: 'linear-gradient(0deg, rgba(255, 166, 0, 0.14) 0%, rgba(237, 168, 40, 0.042) 111.74%)',
            borderBottom: '1px solid #0000001A',
            fontFamily: 'var(--font-lexend)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={profileData.profilePicture}
                  alt={`${username}'s profile`}
                  className="w-12 h-12 rounded-full object-cover border-[2px] border-[#ED6D284D] shadow-md"
                />
                <div>
                  <h2 className="font-bold text-[#ED6D28] text-base">{profileData.name}</h2>
                  <p className="text-sm text-[#45220B]">@{username}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-[#0000001A]">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#5C2609]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10c0 5.523-9 12-9 12S3 15.523 3 10a9 9 0 1118 0z" />
                      <circle cx="12" cy="10" r="3" strokeWidth={2} />
                    </svg>
                    <span className="text-sm font-semibold text-[#5C2609]">{profileData.pinCount} Pins</span>
                  </div>
                  {(profileData.rank !== undefined && profileData.rank !== null) && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#5C0909]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-sm font-semibold text-[#5C0909]">Rank #{profileData.rank}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={expandProfile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ 
                  background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <span>Show Profile</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Map Section */}
      <section className={`${isMinimized ? 'sm:pt-20' : ''}`} style={{ fontFamily: 'var(--font-lexend)' }}>
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Map Header */}
            <div className="py-3 sm:py-4 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="text-center sm:text-left">
                  <div
                    className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-full"
                    style={{ color: '#592102', background: 'transparent' }}
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: '#592102' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 10c0 5.523-9 12-9 12S3 15.523 3 10a9 9 0 1118 0z"
                      />
                      <circle cx="12" cy="10" r="3" strokeWidth={2} />
                    </svg>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold" style={{ color: '#592102' }}>
                      Travel Map
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 sm:gap-6 py-4 sm:py-6">
              {/* Map Container - 2/3 width */}
              <div className="w-full lg:w-2/3 order-1 flex">
                <div
                  className="border border-[#0000001A] rounded-xl sm:rounded-2xl p-1 sm:p-1.5 md:p-2 flex-1 flex flex-col"
                >
                  <div className="transition-all duration-500 overflow-hidden rounded-xl sm:rounded-2xl flex-1">
                    <div className="h-full min-h-[200px] sm:min-h-[280px] md:min-h-[350px] rounded-xl sm:rounded-2xl overflow-hidden">
                      <UserMapComponent 
                        username={username}
                        isExpanded={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* World Coverage beside map - 1/3 width */}
              <div className="w-full lg:w-1/3 order-2 flex">
                <WorldCoverageMap 
                  coveragePercentage={profileData.worldCoverage || 23}
                  username={username}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Posts Section */}
      <UserPosts username={username} />
    </div>
  );
}

export default UserProfile;

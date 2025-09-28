'use client';

import React, { useState } from 'react';

interface WorldCoverageMapProps {
  coveragePercentage: number;
  username: string;
}

export function WorldCoverageMap({ coveragePercentage, username }: WorldCoverageMapProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Static data for demo - representing visited countries/regions
  const visitedRegions = [
    { name: 'North America', visited: true },
    { name: 'South America', visited: false },
    { name: 'Europe', visited: true },
    { name: 'Africa', visited: false },
    { name: 'Asia', visited: true },
    { name: 'Oceania', visited: false },
    { name: 'Antarctica', visited: false }
  ];

  return (
    <div className="relative">
      {/* Coverage Stats */}
      <div 
        className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg shadow-sm border border-blue-200 cursor-pointer transition-all duration-300 hover:shadow-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            World Coverage
          </h3>
          
          {/* Circular Progress */}
          <div className="relative w-20 h-20 mx-auto mb-3">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#3b82f6"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(coveragePercentage / 100) * 201.06} 201.06`}
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600">
                {coveragePercentage}%
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            of the world explored
          </p>
          
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Hover to see details</span>
          </div>
        </div>

        {/* Hover Map Overlay */}
        {isHovered && (
          <div className="absolute top-0 left-full ml-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800 mb-2">
                {username}'s World Coverage
              </h4>
              <p className="text-sm text-gray-600">
                Regions explored: {visitedRegions.filter(r => r.visited).length} of {visitedRegions.length}
              </p>
            </div>

            {/* Simple World Map Representation */}
            <div className="relative bg-blue-50 rounded-lg p-4 mb-4">
              <div className="text-center text-xs text-gray-500 mb-2">World Map</div>
              
              {/* Simplified world regions */}
              <div className="grid grid-cols-3 gap-2">
                {/* North America */}
                <div className={`h-8 rounded ${visitedRegions[0].visited ? 'bg-green-400' : 'bg-gray-300'} flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">NA</span>
                </div>
                
                {/* Europe */}
                <div className={`h-8 rounded ${visitedRegions[2].visited ? 'bg-green-400' : 'bg-gray-300'} flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">EU</span>
                </div>
                
                {/* Asia */}
                <div className={`h-8 rounded ${visitedRegions[4].visited ? 'bg-green-400' : 'bg-gray-300'} flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">AS</span>
                </div>
                
                {/* South America */}
                <div className={`h-8 rounded ${visitedRegions[1].visited ? 'bg-green-400' : 'bg-gray-300'} flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">SA</span>
                </div>
                
                {/* Africa */}
                <div className={`h-8 rounded ${visitedRegions[3].visited ? 'bg-green-400' : 'bg-gray-300'} flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">AF</span>
                </div>
                
                {/* Oceania */}
                <div className={`h-8 rounded ${visitedRegions[5].visited ? 'bg-green-400' : 'bg-gray-300'} flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">OC</span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span className="text-gray-600">Visited</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span className="text-gray-600">Not visited</span>
                </div>
              </div>
            </div>

            {/* Region List */}
            <div className="space-y-2">
              {visitedRegions.map((region, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{region.name}</span>
                  <div className="flex items-center space-x-2">
                    {region.visited ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs">Explored</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs">Unexplored</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow pointing to the main component */}
            <div className="absolute top-6 -left-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorldCoverageMap;

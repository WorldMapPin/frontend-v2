'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { fetchUserPins, ApiPinData } from '../../../lib/worldmappinApi';

// Country reverse geocoding import - using @rapideditor/country-coder
const countryCoder = require('@rapideditor/country-coder');

interface WorldCoverageMapProps {
  coveragePercentage: number;
  username: string;
}

// World map GeoJSON URL (Natural Earth 110m resolution)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Total number of countries in the world (UN recognized)
const TOTAL_COUNTRIES = 195;

// Normalize country names to match GeoJSON map data
// Removes common suffixes and variations
function normalizeCountryName(name: string): string {
  if (!name) return name;
  
  // Common name variations to normalize
  const normalizations: { [key: string]: string } = {
    'United States of America': 'United States',
    'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
    'Russian Federation': 'Russia',
    'Republic of Korea': 'South Korea',
    "Democratic People's Republic of Korea": 'North Korea',
    'Islamic Republic of Iran': 'Iran',
    'Syrian Arab Republic': 'Syria',
    'Lao People\'s Democratic Republic': 'Laos',
    'Myanmar': 'Myanmar',
    'The Bahamas': 'Bahamas',
    'The Gambia': 'Gambia',
    'Republic of the Congo': 'Congo',
    'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
    'Republic of Moldova': 'Moldova',
    'Republic of the Philippines': 'Philippines',
    'United Republic of Tanzania': 'Tanzania',
    'Bolivarian Republic of Venezuela': 'Venezuela',
  };
  
  // Check if we have a direct mapping
  if (normalizations[name]) {
    return normalizations[name];
  }
  
  // Remove common prefixes/suffixes
  let normalized = name
    .replace(/^Republic of /i, '')
    .replace(/^Kingdom of /i, '')
    .replace(/^State of /i, '')
    .replace(/^The /i, '')
    .replace(/ of America$/, '')
    .replace(/ of Great Britain and Northern Ireland$/, '')
    .trim();
  
  return normalized;
}

// Helper function to get country name and ISO code from coordinates using country-coder
function getCountryFromCoordinates(lat: number, lng: number): { name: string; isoCode: string | null } | null {
  try {
    // Validate coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return null;
    }
    
    // country-coder expects [longitude, latitude] format
    const coordinates: [number, number] = [lng, lat];
    
    // Get country feature (includes country name and properties)
    const feature = countryCoder.feature(coordinates);
    
    if (feature && feature.properties) {
      const nameEn = feature.properties.nameEn;
      if (nameEn) {
        return {
          name: normalizeCountryName(nameEn), // Normalized name for map matching
          isoCode: feature.properties.iso1A2 || null // ISO code as backup
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

// Helper function to check if a country name matches any visited country
// Uses flexible matching to handle name variations
function isCountryVisited(
  mapCountryName: string, 
  visitedCountries: Set<string>
): boolean {
  if (!mapCountryName) return false;
  
  // Direct match
  if (visitedCountries.has(mapCountryName)) {
    return true;
  }
  
  // Normalize the map country name and check again
  const normalized = normalizeCountryName(mapCountryName);
  if (visitedCountries.has(normalized)) {
    return true;
  }
  
  // Case-insensitive match
  const lowerMapName = mapCountryName.toLowerCase().trim();
  for (const visited of visitedCountries) {
    if (visited.toLowerCase().trim() === lowerMapName) {
      return true;
    }
    if (normalizeCountryName(visited).toLowerCase().trim() === lowerMapName) {
      return true;
    }
  }
  
  // Partial match for cases like "United States" vs "United States of America"
  const mapWords = lowerMapName.split(/\s+/);
  for (const visited of visitedCountries) {
    const visitedLower = visited.toLowerCase().trim();
    const visitedWords = visitedLower.split(/\s+/);
    
    // Check if all significant words match
    if (mapWords.length >= 2 && visitedWords.length >= 2) {
      const significantWords = mapWords.filter(w => w.length > 2 && !['the', 'of', 'and', 'republic'].includes(w));
      const visitedSignificant = visitedWords.filter(w => w.length > 2 && !['the', 'of', 'and', 'republic'].includes(w));
      
      if (significantWords.length > 0 && visitedSignificant.length > 0) {
        const matchCount = significantWords.filter(word => 
          visitedSignificant.some(vw => vw.includes(word) || word.includes(vw))
        ).length;
        
        if (matchCount >= Math.min(significantWords.length, visitedSignificant.length) * 0.7) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Helper function to get pin count for a country name (with flexible matching)
function getCountryPinCount(
  mapCountryName: string,
  countryCounts: { [key: string]: number },
  visitedCountries: Set<string>
): number {
  if (!mapCountryName) return 0;
  
  // Direct match
  if (countryCounts[mapCountryName] !== undefined) {
    return countryCounts[mapCountryName];
  }
  
  // Try normalized name
  const normalized = normalizeCountryName(mapCountryName);
  if (countryCounts[normalized] !== undefined) {
    return countryCounts[normalized];
  }
  
  // Find matching visited country
  for (const [country, count] of Object.entries(countryCounts)) {
    if (isCountryVisited(country, new Set([mapCountryName]))) {
      return count;
    }
  }
  
  return 0;
}

// World Map Visualization Component
function WorldMapVisualization({ 
  visitedCountries, 
  countryPinCounts 
}: { 
  visitedCountries: Set<string>;
  countryPinCounts: { [key: string]: number };
}) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  return (
    <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 mb-4">
      <div className="text-center text-xs font-medium text-gray-700 mb-3">
        World Coverage Map
      </div>
      
      <div className="relative" style={{ width: '100%', height: '500px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 150,
            center: [0, 20]
          }}
          className="w-full h-full"
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const countryName = geo.properties.name;
                  const isVisited = isCountryVisited(countryName, visitedCountries);
                  const pinCount = getCountryPinCount(countryName, countryPinCounts, visitedCountries);
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isVisited ? '#FFA97B' : '#d1d5db'}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { 
                          fill: isVisited ? '#FF8C5A' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer'
                        },
                        pressed: { outline: 'none' }
                      }}
                      onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                        setTooltipContent(
                          isVisited 
                            ? `${countryName}: ${pinCount} ${pinCount === 1 ? 'pin' : 'pins'}`
                            : `${countryName}: Not visited`
                        );
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => {
                        setTooltipContent('');
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div 
            className="absolute bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-medium pointer-events-none z-50 whitespace-nowrap"
            style={{
              left: '50%',
              top: '10px',
              transform: 'translateX(-50%)'
            }}
          >
            {tooltipContent}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded" style={{ backgroundColor: '#FFA97B' }}></div>
          <span className="text-gray-700 font-medium">Visited Countries</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <span className="text-gray-700 font-medium">Not Visited</span>
        </div>
      </div>
    </div>
  );
}

export function WorldCoverageMap({ coveragePercentage, username }: WorldCoverageMapProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userPins, setUserPins] = useState<ApiPinData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user pins when component mounts
  useEffect(() => {
    const loadUserPins = async () => {
      try {
        setLoading(true);
        const pins = await fetchUserPins(username);
        setUserPins(pins);
      } catch (error) {
        console.error('Error loading user pins for coverage map:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadUserPins();
    }
  }, [username]);

  // Calculate visited countries based on user pins
  const countryData = useMemo(() => {
    const visitedSet = new Set<string>();
    const countryCounts: { [key: string]: number } = {};
    const countryList: Array<{ name: string; pinCount: number }> = [];
    // Store all possible name variations for better matching
    const nameVariations = new Map<string, Set<string>>(); // original name -> all variations

    userPins.forEach(pin => {
      const lat = pin.json_metadata?.location?.latitude || pin.lattitude;
      const lng = pin.json_metadata?.location?.longitude || pin.longitude;
      
      const countryData = getCountryFromCoordinates(lat, lng);
      if (countryData && countryData.name) {
        const normalizedName = countryData.name;
        visitedSet.add(normalizedName);
        countryCounts[normalizedName] = (countryCounts[normalizedName] || 0) + 1;
        
        // Store variations for flexible matching
        if (!nameVariations.has(normalizedName)) {
          nameVariations.set(normalizedName, new Set());
        }
        nameVariations.get(normalizedName)!.add(normalizedName);
        if (countryData.isoCode) {
          nameVariations.get(normalizedName)!.add(countryData.isoCode);
        }
      }
    });

    // Create sorted list of visited countries
    Array.from(visitedSet).forEach(country => {
      countryList.push({
        name: country,
        pinCount: countryCounts[country]
      });
    });

    // Sort by pin count descending
    countryList.sort((a, b) => b.pinCount - a.pinCount);

    return { 
      visitedCountries: visitedSet, 
      countryCounts, 
      countryList,
      totalVisited: visitedSet.size,
      nameVariations // For flexible matching with map
    };
  }, [userPins]);

  const actualCoveragePercentage = Math.round(
    (countryData.totalVisited / TOTAL_COUNTRIES) * 100
  );

  return (
    <div className="relative">
      {/* Coverage Stats Card with Mini Preview - Click anywhere to expand */}
      <div 
        onClick={() => setIsExpanded(true)}
        className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 rounded-lg shadow-sm border border-orange-200 transition-all duration-300 hover:shadow-lg cursor-pointer"
      >
        <div className="text-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            World Coverage
          </h3>
          
          {/* Circular Progress */}
          <div className="relative w-16 h-16 mx-auto mb-2">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
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
                stroke="#FFA97B"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(actualCoveragePercentage / 100) * 201.06} 201.06`}
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-orange-600">
                {actualCoveragePercentage}%
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-1">
            of the world explored
          </p>
          <p className="text-xs text-gray-700 font-semibold mb-2">
            {countryData.totalVisited} / {TOTAL_COUNTRIES} countries
          </p>
        </div>

        {/* Mini Map Preview */}
        <div className="relative bg-gradient-to-br from-orange-100 to-amber-50 rounded-lg p-3 mb-3 pointer-events-none">
          <div className="relative w-full h-[100px] sm:h-[130px] md:h-[150px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: 140,
                  center: [0, 20]
                }}
                className="w-full h-full"
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => {
                      const countryName = geo.properties.name;
                      const isVisited = isCountryVisited(countryName, countryData.visitedCountries);
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isVisited ? '#FFA97B' : '#d1d5db'}
                          stroke="#ffffff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none' },
                            pressed: { outline: 'none' }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            )}
          </div>
        </div>

        {/* Click to Expand Hint */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-orange-600 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Click to view details</span>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex-1 pr-2">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {username}'s World Coverage
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-orange-600">{userPins.length}</span> pins across{' '}
                  <span className="font-semibold text-orange-600">{countryData.totalVisited}</span> countries
                  {' '}({actualCoveragePercentage}%)
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Visual World Map */}
              {loading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <WorldMapVisualization 
                  visitedCountries={countryData.visitedCountries}
                  countryPinCounts={countryData.countryCounts}
                />
              )}

              {/* All Countries List */}
              {countryData.countryList.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      All Visited Countries
                    </h4>
                    <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 sm:px-3 py-1 rounded-full font-semibold">
                      {countryData.countryList.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {countryData.countryList.map((country, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 hover:border-orange-300 transition-all"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900 truncate">{country.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                            {country.pinCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {countryData.countryList.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-base sm:text-lg">No countries visited yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-2">Start exploring the world and add your first pin!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorldCoverageMap;

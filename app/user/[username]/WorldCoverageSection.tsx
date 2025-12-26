'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { fetchUserPins, ApiPinData } from '../../../lib/worldmappinApi';

// Country reverse geocoding import - using @rapideditor/country-coder
const countryCoder = require('@rapideditor/country-coder');

interface WorldCoverageSectionProps {
    coveragePercentage: number;
    username: string;
}

// World map GeoJSON URL (Natural Earth 110m resolution)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Total number of countries in the world (UN recognized)
const TOTAL_COUNTRIES = 195;

// Normalize country names to match GeoJSON map data
function normalizeCountryName(name: string): string {
    if (!name) return name;

    // Common name variations to normalize
    const normalizations: { [key: string]: string } = {
        'United States of America': 'United States',
        'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
        'Russian Federation': 'Russia',
        'Republic of Korea': 'South Korea',
        "Democratic People's Republic of Korea": 'North Korea',
        "People's Republic of China": 'China',
        'Islamic Republic of Iran': 'Iran',
        'Syrian Arab Republic': 'Syria',
        'Lao People\'s Democratic Republic': 'Laos',
        'Myanmar': 'Myanmar',
        'The Bahamas': 'Bahamas',
        'The Gambia': 'Gambia',
        'Republic of the Congo': 'Congo',
        'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
        'Dem. Rep. Congo': 'Congo, Democratic Republic of the',
        'Dem Rep Congo': 'Congo, Democratic Republic of the',
        'DR Congo': 'Congo, Democratic Republic of the',
        'D.R. Congo': 'Congo, Democratic Republic of the',
        'Republic of Moldova': 'Moldova',
        'Republic of the Philippines': 'Philippines',
        'United Republic of Tanzania': 'Tanzania',
        'Bolivarian Republic of Venezuela': 'Venezuela',
        'Kalaallit Nunaat': 'Greenland',
        'Grønland': 'Greenland',
    };

    if (normalizations[name]) {
        return normalizations[name];
    }

    return name
        .replace(/^Republic of /i, '')
        .replace(/^Kingdom of /i, '')
        .replace(/^State of /i, '')
        .replace(/^The /i, '')
        .replace(/ of America$/, '')
        .replace(/ of Great Britain and Northern Ireland$/, '')
        .trim();
}

// Helper function to get country name and ISO code from coordinates
function getCountryFromCoordinates(lat: number, lng: number): { name: string; isoCode: string | null } | null {
    try {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

        // Greenland/Iceland check
        const isInGreenlandBounds = lat >= 59.5 && lat <= 83.5 && lng >= -73 && lng <= 12;
        const isInIcelandBounds = lat >= 63 && lat <= 66.5 && lng >= -24 && lng <= -13;

        if (isInGreenlandBounds && !isInIcelandBounds) {
            return { name: 'Greenland', isoCode: 'GL' };
        }

        const coordinates: [number, number] = [lng, lat];
        const feature = countryCoder.feature(coordinates);

        if (!feature || !feature.properties) return null;

        const nameEn = feature.properties.nameEn || feature.properties.name_en || feature.properties.NAME_EN;
        const iso1A2 = feature.properties.iso1A2 || feature.properties.iso_1A2 || feature.properties.ISO1_A2;
        const name = feature.properties.name || feature.properties.NAME;
        const iso31661 = feature.properties['ISO3166-1'] || feature.properties['iso3166-1'];

        if (iso1A2 === 'GL' || iso31661 === 'GL') return { name: 'Greenland', isoCode: 'GL' };

        if (nameEn) {
            if (nameEn.toLowerCase().includes('greenland')) return { name: 'Greenland', isoCode: iso1A2 || 'GL' };
            return { name: normalizeCountryName(nameEn), isoCode: iso1A2 || null };
        }

        if (name) {
            if (name.toLowerCase().includes('greenland')) return { name: 'Greenland', isoCode: iso1A2 || 'GL' };
            return { name: normalizeCountryName(name), isoCode: iso1A2 || null };
        }

        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
}

function isCountryVisited(mapCountryName: string, visitedCountries: Set<string>): boolean {
    if (!mapCountryName) return false;
    if (visitedCountries.has(mapCountryName)) return true;

    const normalized = normalizeCountryName(mapCountryName);
    if (visitedCountries.has(normalized)) return true;

    const lowerMapName = mapCountryName.toLowerCase().trim();
    for (const visited of visitedCountries) {
        if (visited.toLowerCase().trim() === lowerMapName) return true;
        if (normalizeCountryName(visited).toLowerCase().trim() === lowerMapName) return true;
    }

    // DR Congo special handling
    const drcVariations = ['dem. rep. congo', 'dem rep congo', 'dr congo', 'd.r. congo', 'democratic republic of the congo', 'congo, democratic republic of the'];
    const isDRC = drcVariations.some(v => lowerMapName.includes(v) || lowerMapName === v);
    if (isDRC) {
        for (const visited of visitedCountries) {
            const visitedLower = visited.toLowerCase();
            if (drcVariations.some(v => visitedLower.includes(v) || visitedLower === v) ||
                (visitedLower.includes('congo') && (visitedLower.includes('democratic') || visitedLower.includes('dem')))) {
                return true;
            }
        }
    }

    // Partial matching
    const mapWords = lowerMapName.split(/\s+/);
    for (const visited of visitedCountries) {
        const visitedLower = visited.toLowerCase().trim();
        const visitedWords = visitedLower.split(/\s+/);

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

function getCountryPinCount(mapCountryName: string, countryCounts: { [key: string]: number }, visitedCountries: Set<string>): number {
    if (!mapCountryName) return 0;
    if (countryCounts[mapCountryName] !== undefined) return countryCounts[mapCountryName];

    const normalized = normalizeCountryName(mapCountryName);
    if (countryCounts[normalized] !== undefined) return countryCounts[normalized];

    // Search mapCountryName in visited set to find the key used in countryCounts
    for (const [country, count] of Object.entries(countryCounts)) {
        if (isCountryVisited(country, new Set([mapCountryName]))) {
            return count;
        }
    }

    return 0;
}

export function WorldCoverageSection({ coveragePercentage, username }: WorldCoverageSectionProps) {
    const [userPins, setUserPins] = useState<ApiPinData[]>([]);
    const [loading, setLoading] = useState(false);
    const [tooltipContent, setTooltipContent] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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

    const countryData = useMemo(() => {
        const visitedSet = new Set<string>();
        const countryCounts: { [key: string]: number } = {};
        const countryList: Array<{ name: string; pinCount: number }> = [];

        userPins.forEach(pin => {
            const lat = pin.json_metadata?.location?.latitude || pin.lattitude;
            const lng = pin.json_metadata?.location?.longitude || pin.longitude;

            const countryData = getCountryFromCoordinates(lat, lng);
            if (countryData && countryData.name) {
                const normalizedName = countryData.name;
                visitedSet.add(normalizedName);
                countryCounts[normalizedName] = (countryCounts[normalizedName] || 0) + 1;
            }
        });

        Array.from(visitedSet).forEach(country => {
            countryList.push({
                name: country,
                pinCount: countryCounts[country]
            });
        });

        countryList.sort((a, b) => b.pinCount - a.pinCount);

        return {
            visitedCountries: visitedSet,
            countryCounts,
            countryList,
            totalVisited: visitedSet.size
        };
    }, [userPins]);

    const actualCoveragePercentage = Math.round(
        (countryData.totalVisited / TOTAL_COUNTRIES) * 100
    );

    return (
        <section className="py-8 font-lexend transition-colors duration-300" style={{ backgroundColor: 'var(--section-bg)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg user-coverage-icon-bg">
                            <svg className="w-6 h-6 text-[#ED6D28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>World Coverage</h2>
                    </div>
                    <p className="ml-1" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-bold text-[#ED6D28]">{username.charAt(0).toUpperCase() + username.slice(1)}</span> has visited <span className="font-bold text-[#ED6D28]">{countryData.totalVisited}</span> countries, covering <span className="font-bold text-[#ED6D28]">{actualCoveragePercentage}%</span> of the world!
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Map Column */}
                    <div className="w-full lg:w-2/3 rounded-2xl shadow-sm p-1 overflow-hidden user-coverage-map-card">
                        <div className="relative w-full h-[400px] sm:h-[500px] rounded-xl user-coverage-map-bg">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                                </div>
                            ) : (
                                <>
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
                                                {({ geographies }) =>
                                                    geographies.map((geo) => {
                                                        const countryName = geo.properties.name;
                                                        const isVisited = isCountryVisited(countryName, countryData.visitedCountries);
                                                        const pinCount = getCountryPinCount(countryName, countryData.countryCounts, countryData.visitedCountries);
                                                        const isSelected = selectedCountry === countryName;

                                                        return (
                                                            <Geography
                                                                key={geo.rsmKey}
                                                                geography={geo}
                                                                fill={isSelected ? '#E65100' : (isVisited ? '#FFA97B' : '#e5e7eb')}
                                                                stroke={isSelected ? '#E65100' : "#ffffff"}
                                                                strokeWidth={0.5}
                                                                style={{
                                                                    default: { outline: 'none', transition: 'all 0.3s ease' },
                                                                    hover: {
                                                                        fill: isSelected ? '#E65100' : (isVisited ? '#FF8C5A' : '#d1d5db'),
                                                                        outline: 'none',
                                                                        cursor: 'pointer'
                                                                    },
                                                                    pressed: { outline: 'none' }
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    setTooltipContent(
                                                                        isVisited
                                                                            ? `${countryName}: ${pinCount} ${pinCount === 1 ? 'pin' : 'pins'}`
                                                                            : `${countryName}`
                                                                    );
                                                                }}
                                                                onMouseLeave={() => {
                                                                    setTooltipContent('');
                                                                }}
                                                                onClick={() => {
                                                                    if (isVisited) {
                                                                        setSelectedCountry(selectedCountry === countryName ? null : countryName);
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })
                                                }
                                            </Geographies>
                                        </ZoomableGroup>
                                    </ComposableMap>
                                    {/* Centered Tooltip if active */}
                                    {tooltipContent && (
                                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium pointer-events-none z-10 backdrop-blur-sm shadow-lg user-coverage-tooltip">
                                            {tooltipContent}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Legend Overlay */}
                            <div className="absolute bottom-4 left-4 backdrop-blur-sm p-3 rounded-lg shadow-sm text-xs user-coverage-legend">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-[#E65100]"></div>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Selected</span>
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-[#FFA97B]"></div>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Visited</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                                    <span style={{ color: 'var(--text-muted)' }}>Not Visited</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & List Column */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center user-coverage-stat-card">
                                <div className="text-3xl font-bold text-[#ED6D28] mb-1">{userPins.length}</div>
                                <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Pins</div>
                            </div>
                            <div className="p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center user-coverage-stat-card">
                                <div className="text-3xl font-bold text-[#ED6D28] mb-1">{countryData.totalVisited}</div>
                                <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Countries</div>
                            </div>
                        </div>

                        {/* Country List */}
                        <div className="rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[400px] user-coverage-list-card">
                            <div className="p-4 border-b user-coverage-list-header">
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Visited Countries</h3>
                            </div>
                            <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {countryData.countryList.length > 0 ? (
                                    countryData.countryList.map((country, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer group user-coverage-list-item ${selectedCountry === country.name
                                                ? 'user-coverage-list-item-selected'
                                                : ''
                                                }`}
                                            onClick={() => setSelectedCountry(selectedCountry === country.name ? null : country.name)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedCountry === country.name
                                                    ? 'bg-[#E65100] text-white'
                                                    : 'bg-orange-100 text-[#ED6D28]'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                <span className={`text-sm font-medium ${selectedCountry === country.name
                                                    ? 'text-[#E65100]'
                                                    : ''
                                                    }`} style={{ color: selectedCountry === country.name ? '#E65100' : 'var(--text-primary)' }}>{country.name}</span>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${selectedCountry === country.name
                                                ? 'bg-orange-200 text-orange-900'
                                                : ''
                                                }`} style={{ 
                                                backgroundColor: selectedCountry === country.name ? 'rgba(251, 146, 60, 0.2)' : 'var(--skeleton-bg)',
                                                color: selectedCountry === country.name ? '#9a3412' : 'var(--text-muted)'
                                            }}>
                                                {country.pinCount} pins
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                                        <div className="mb-2">Click around the map to explore!</div>
                                        <div className="text-xs">No countries visited yet</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

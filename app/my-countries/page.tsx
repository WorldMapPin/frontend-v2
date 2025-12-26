'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { fetchUserPins, ApiPinData } from '../../lib/worldmappinApi';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Country reverse geocoding import - using @rapideditor/country-coder
const countryCoder = require('@rapideditor/country-coder');

// World map GeoJSON URL (Natural Earth 110m resolution)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Total number of countries in the world (UN recognized)
const TOTAL_COUNTRIES = 195;

// Normalize country names to match GeoJSON map data
function normalizeCountryName(name: string): string {
    if (!name) return name;

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

function getCountryFromCoordinates(lat: number, lng: number): { name: string; isoCode: string | null } | null {
    try {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

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

    return false;
}

export default function MyCountriesPage() {
    const { user, isReady } = useAiohaSafe();
    const [userPins, setUserPins] = useState<ApiPinData[]>([]);
    const [loading, setLoading] = useState(true);
    const [tooltipContent, setTooltipContent] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const loadUserPins = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const pins = await fetchUserPins(user);
                setUserPins(pins);
            } catch (error) {
                console.error('Error loading user pins:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isReady && user) {
            loadUserPins();
        } else if (isReady && !user) {
            setLoading(false);
        }
    }, [user, isReady]);

    const countryData = useMemo(() => {
        const visitedSet = new Set<string>();
        const countryCounts: { [key: string]: number } = {};
        const countryList: Array<{ name: string; pinCount: number; isoCode: string | null }> = [];

        userPins.forEach(pin => {
            const lat = pin.json_metadata?.location?.latitude || pin.lattitude;
            const lng = pin.json_metadata?.location?.longitude || pin.longitude;

            const countryInfo = getCountryFromCoordinates(lat, lng);
            if (countryInfo && countryInfo.name) {
                const normalizedName = countryInfo.name;
                visitedSet.add(normalizedName);
                countryCounts[normalizedName] = (countryCounts[normalizedName] || 0) + 1;

                if (!countryList.find(c => c.name === normalizedName)) {
                    countryList.push({
                        name: normalizedName,
                        pinCount: 0, // placeholder
                        isoCode: countryInfo.isoCode
                    });
                }
            }
        });

        const finalCountryList = countryList.map(c => ({
            ...c,
            pinCount: countryCounts[c.name]
        })).sort((a, b) => b.pinCount - a.pinCount);

        return {
            visitedCountries: visitedSet,
            countryCounts,
            countryList: finalCountryList,
            totalVisited: visitedSet.size
        };
    }, [userPins]);

    const coveragePercentage = Math.round((countryData.totalVisited / TOTAL_COUNTRIES) * 100);

    if (loading) {
        return (
            <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    if (!user && isReady) {
        return (
            <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center font-lexend">
                    <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>My Countries</h1>
                    <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Please login to see your world map coverage.</p>
                    <a href="/signup" className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors">
                        Login / Sign Up
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-lexend pb-12 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-20">
                {/* Header Section - Styled like ExploreHeader */}
                <div className="rounded-lg sm:rounded-xl shadow-lg m-2 sm:m-4 relative overflow-hidden mb-8" style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)' }}>
                    <img
                        src="/globe.svg"
                        alt="Globe"
                        className="absolute opacity-10 hidden sm:block"
                        style={{
                            left: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '80px',
                            height: '80px',
                            zIndex: 1
                        }}
                    />
                    <div
                        className="absolute hidden sm:flex flex-col items-center justify-center border border-white/20"
                        style={{
                            right: '2rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '90px',
                            height: '90px',
                            backgroundColor: '#0000001A',
                            borderRadius: '12px',
                            zIndex: 1,
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <div className="text-white font-bold text-2xl lg:text-3xl">
                            {countryData.totalVisited}
                        </div>
                        <div className="text-white text-[10px] sm:text-xs mt-1 text-center px-1 font-medium">
                            Countries
                        </div>
                    </div>

                    {/* Mobile Counter */}
                    <div className="absolute bottom-4 right-4 sm:hidden flex flex-col items-end z-10">
                        <div className="text-white font-bold text-xl">
                            {countryData.totalVisited}
                        </div>
                        <div className="text-white text-[10px] font-medium opacity-80">
                            Countries Visited
                        </div>
                    </div>

                    <div className="relative px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 z-10 pl-16 sm:pl-24">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">My Countries</h1>
                        <p className="text-white/90 mt-2 text-sm sm:text-base lg:text-lg max-w-2xl font-medium">
                            Track your global footprint and celebrate your travels across the world.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2 sm:px-4">
                    {/* Left Column: Map and Stats */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Map Container */}
                        <div className="rounded-3xl shadow-xl overflow-hidden relative group my-countries-card">
                            <div className="relative w-full h-[400px] sm:h-[550px] my-countries-map-bg">
                                <ComposableMap
                                    projection="geoMercator"
                                    projectionConfig={{
                                        scale: 140,
                                        center: [0, 20]
                                    }}
                                    className="w-full h-full"
                                >
                                    <ZoomableGroup zoom={zoom} onMoveEnd={({ zoom }) => setZoom(zoom)}>
                                        <Geographies geography={GEO_URL}>
                                            {({ geographies }) =>
                                                geographies.map((geo) => {
                                                    const countryName = geo.properties.name;
                                                    const isVisited = isCountryVisited(countryName, countryData.visitedCountries);
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
                                                            onMouseEnter={() => setTooltipContent(countryName)}
                                                            onMouseLeave={() => setTooltipContent('')}
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

                                {/* Zoom Controls */}
                                <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                                    <button
                                        onClick={() => setZoom(z => Math.min(z * 1.5, 8))}
                                        className="w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-orange-600 transition-all font-bold text-xl my-countries-zoom-btn"
                                        title="Zoom In"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
                                        className="w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-orange-600 transition-all font-bold text-xl my-countries-zoom-btn"
                                        title="Zoom Out"
                                    >
                                        −
                                    </button>
                                </div>

                                {tooltipContent && (
                                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full text-sm font-medium pointer-events-none z-10 backdrop-blur-sm shadow-lg">
                                        {tooltipContent}
                                    </div>
                                )}

                                {/* Legend */}
                                <div className="absolute bottom-6 left-6 backdrop-blur-md p-4 rounded-2xl shadow-sm text-xs flex flex-col gap-2 my-countries-legend">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#FFA97B]"></div>
                                        <span style={{ color: 'var(--text-primary)' }} className="font-semibold">Visited</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                        <span style={{ color: 'var(--text-muted)' }} className="font-medium">Not Visited</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Card - "In Total" like the screenshots */}
                        <div className="rounded-3xl p-8 shadow-xl relative overflow-hidden my-countries-card">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                                In Total
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                <div className="text-center">
                                    <div className="text-5xl font-black text-orange-500 mb-1">
                                        {coveragePercentage}%
                                    </div>
                                    <div className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>World</div>
                                </div>
                                <div className="flex justify-center">
                                    <div className="relative w-24 h-24">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                style={{ color: 'var(--border-subtle)' }}
                                                strokeDasharray="100, 100"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className="text-orange-500"
                                                strokeDasharray={`${coveragePercentage}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-black text-orange-500 mb-1">
                                        {countryData.totalVisited}
                                    </div>
                                    <div className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Countries</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: List of Countries */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="rounded-3xl shadow-xl flex flex-col overflow-hidden h-[730px] my-countries-card">
                            <div className="p-6 flex justify-between items-center my-countries-list-header">
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Countries Visited</h3>
                                <span className="text-orange-600 px-3 py-1 rounded-full text-xs font-bold my-countries-badge">
                                    {countryData.countryList.length} total
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {countryData.countryList.map((country, index) => (
                                    <div
                                        key={index}
                                        className={`group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${selectedCountry === country.name
                                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                            : 'my-countries-list-item border border-transparent'
                                            }`}
                                        onClick={() => setSelectedCountry(selectedCountry === country.name ? null : country.name)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {country.isoCode ? (
                                                <img
                                                    src={`https://flagcdn.com/w40/${country.isoCode.toLowerCase()}.png`}
                                                    alt={country.name}
                                                    className="w-8 h-6 object-cover rounded shadow-sm"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-8 h-6 rounded flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--skeleton-bg)', color: 'var(--text-muted)' }}>
                                                    ?
                                                </div>
                                            )}
                                            <span className="font-bold text-sm tracking-tight" style={{ color: selectedCountry === country.name ? 'white' : 'var(--text-primary)' }}>{country.name}</span>
                                        </div>
                                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${selectedCountry === country.name
                                            ? 'bg-white/20 text-white'
                                            : 'bg-orange-100 text-orange-700 group-hover:bg-orange-200'
                                            }`}>
                                            {country.pinCount}
                                        </div>
                                    </div>
                                ))}
                                {countryData.countryList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center" style={{ color: 'var(--text-muted)' }}>
                                        <svg className="w-16 h-16 mb-4 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium">No countries visited yet.</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add some pins to your map to see your progress!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

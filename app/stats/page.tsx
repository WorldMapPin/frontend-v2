'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { fetchBasicPinStats, fetchPinStats, PinStats, CountryStats, UserStats } from '../../lib/statsApi';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// World map GeoJSON URL
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Helper functions for country name matching
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

function isCountryInStats(
  mapCountryName: string, 
  countries: CountryStats[]
): boolean {
  if (!mapCountryName) return false;
  
  const lowerMapName = mapCountryName.toLowerCase().trim();
  
  // Special handling for Greenland
  if (lowerMapName.includes('greenland') || lowerMapName.includes('kalaallit') || lowerMapName.includes('grønland')) {
    for (const country of countries) {
      const countryLower = country.country.toLowerCase();
      if (countryLower.includes('greenland') || countryLower.includes('kalaallit') || countryLower.includes('grønland')) {
        return true;
      }
    }
  }
  
  // Special handling for Democratic Republic of the Congo
  const drcVariations = ['dem. rep. congo', 'dem rep congo', 'dr congo', 'd.r. congo', 'democratic republic of the congo', 'congo, democratic republic of the'];
  const isDRC = drcVariations.some(v => lowerMapName.includes(v) || lowerMapName === v);
  if (isDRC) {
    for (const country of countries) {
      const countryLower = country.country.toLowerCase();
      if (drcVariations.some(v => countryLower.includes(v) || countryLower === v) || 
          countryLower.includes('congo') && (countryLower.includes('democratic') || countryLower.includes('dem'))) {
        return true;
      }
    }
  }
  
  for (const country of countries) {
    if (country.country.toLowerCase().trim() === lowerMapName) {
      return true;
    }
    if (normalizeCountryName(country.country).toLowerCase().trim() === lowerMapName) {
      return true;
    }
    if (normalizeCountryName(mapCountryName).toLowerCase().trim() === country.country.toLowerCase().trim()) {
      return true;
    }
  }
  
  return false;
}

function getCountryPinCount(
  mapCountryName: string,
  countries: CountryStats[]
): number {
  if (!mapCountryName) return 0;
  
  const lowerMapName = mapCountryName.toLowerCase().trim();
  
  // Special handling for Greenland
  if (lowerMapName.includes('greenland') || lowerMapName.includes('kalaallit') || lowerMapName.includes('grønland')) {
    for (const country of countries) {
      const countryLower = country.country.toLowerCase();
      if (countryLower.includes('greenland') || countryLower.includes('kalaallit') || countryLower.includes('grønland')) {
        return country.count;
      }
    }
  }
  
  // Special handling for Democratic Republic of the Congo
  const drcVariations = ['dem. rep. congo', 'dem rep congo', 'dr congo', 'd.r. congo', 'democratic republic of the congo', 'congo, democratic republic of the'];
  const isDRC = drcVariations.some(v => lowerMapName.includes(v) || lowerMapName === v);
  if (isDRC) {
    for (const country of countries) {
      const countryLower = country.country.toLowerCase();
      if (drcVariations.some(v => countryLower.includes(v) || countryLower === v) || 
          countryLower.includes('congo') && (countryLower.includes('democratic') || countryLower.includes('dem'))) {
        return country.count;
      }
    }
  }
  
  for (const country of countries) {
    if (country.country.toLowerCase().trim() === lowerMapName) {
      return country.count;
    }
    if (normalizeCountryName(country.country).toLowerCase().trim() === lowerMapName) {
      return country.count;
    }
    if (normalizeCountryName(mapCountryName).toLowerCase().trim() === country.country.toLowerCase().trim()) {
      return country.count;
    }
  }
  
  return 0;
}

// Get color based on pin count
function getCountryColor(pinCount: number, maxPins: number): string {
  if (pinCount === 0) return '#d1d5db'; // gray-300 for countries with no pins
  
  // Color gradient from light orange to dark orange
  const intensity = Math.min(pinCount / maxPins, 1);
  
  if (intensity < 0.2) return '#FED7AA'; // orange-200
  if (intensity < 0.4) return '#FDBA74'; // orange-300
  if (intensity < 0.6) return '#FB923C'; // orange-400
  if (intensity < 0.8) return '#F97316'; // orange-500
  return '#EA580C'; // orange-600
}

// World Map Component for Countries
function CountriesWorldMap({ countries }: { countries: CountryStats[] }) {
  const [tooltipContent, setTooltipContent] = useState('');
  const maxPins = Math.max(...countries.map(c => c.count), 1);

  return (
    <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 mb-4">
      <div className="text-center text-sm font-medium text-gray-700 mb-3">
        WorldMapPin Global Distribution
      </div>
      
      <div className="relative" style={{ width: '100%', height: '400px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 130,
            center: [0, 20]
          }}
          className="w-full h-full"
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const countryName = geo.properties.name;
                  const pinCount = getCountryPinCount(countryName, countries);
                  const hasData = isCountryInStats(countryName, countries);
                  const fillColor = getCountryColor(pinCount, maxPins);
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { 
                          fill: hasData ? '#F97316' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer'
                        },
                        pressed: { outline: 'none' }
                      }}
                      onMouseEnter={() => {
                        setTooltipContent(
                          hasData 
                            ? `${countryName}: ${pinCount} ${pinCount === 1 ? 'pin' : 'pins'}`
                            : `${countryName}: No pins`
                        );
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
      <div className="flex items-center justify-center gap-2 mt-4 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FED7AA' }}></div>
          <span className="text-gray-700">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FB923C' }}></div>
          <span className="text-gray-700">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EA580C' }}></div>
          <span className="text-gray-700">High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span className="text-gray-700">No pins</span>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<PinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isLoadingHiveData, setIsLoadingHiveData] = useState(false);
  const [hiveProgress, setHiveProgress] = useState(0);
  const [hiveProgressMessage, setHiveProgressMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCachedData, setIsCachedData] = useState(false);
  const [dataType, setDataType] = useState<'basic' | 'full'>('basic');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadingHiveRef = useRef(false);

  useEffect(() => {
    loadStatsProgressive();
  }, []);

  const loadStatsProgressive = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setProgressMessage('Checking for cached data...');
      
      // Step 1: Try to load cached data (unless forcing refresh)
      if (!forceRefresh) {
        console.log('📦 Checking cache...');
        const cacheResponse = await fetch('/api/stats-cache');
        const cacheResult = await cacheResponse.json();
        
        if (cacheResult.success && cacheResult.data) {
          console.log('✅ Loaded cached data from:', cacheResult.lastUpdated);
          setStats(cacheResult.data);
          setLastUpdated(cacheResult.lastUpdated);
          setIsCachedData(true);
          setDataType(cacheResult.dataType || 'full');
          setLoading(false);
          setProgressMessage('Loaded from cache');
          
          // If we only have basic stats cached, start loading full stats in background
          if (cacheResult.dataType === 'basic' && !loadingHiveRef.current) {
            loadFullStatsInBackground();
          }
          return; // Show cached data immediately
        }
      } else {
        console.log('🔄 Force refresh requested, skipping cache...');
      }
      
      // Step 2: No cache or force refresh, load basic stats first (fast)
      console.log('⚡ Loading basic stats...');
      setProgressMessage('Loading basic statistics...');
      
      const basicStats = await fetchBasicPinStats((percent, message) => {
        setProgress(percent);
        setProgressMessage(message);
      });
      
      console.log('✅ Basic stats loaded, displaying now');
      setStats(basicStats);
      setDataType('basic');
      setIsCachedData(false);
      setLoading(false);
      
      // Cache the basic stats
      console.log('💾 Caching basic stats...');
      await fetch('/api/stats-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stats: basicStats, dataType: 'basic' }),
      });
      setLastUpdated(new Date().toISOString());
      setIsCachedData(true);
      console.log('✅ Basic stats cached');
      
      // Step 3: Start loading full stats with Hive data in background
      if (!loadingHiveRef.current) {
        loadFullStatsInBackground();
      }
    } catch (err) {
      console.error('❌ Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      setLoading(false);
    }
  };

  const loadFullStatsInBackground = async () => {
    if (loadingHiveRef.current) {
      console.log('⚠️ Already loading full stats');
      return;
    }
    
    try {
      loadingHiveRef.current = true;
      setIsLoadingHiveData(true);
      setHiveProgress(0);
      setHiveProgressMessage('Starting Hive data fetch...');
      
      console.log('🔄 Loading full stats with Hive data...');
      
      const fullStats = await fetchPinStats((percent, message) => {
        setHiveProgress(percent);
        setHiveProgressMessage(message);
      });
      
      console.log('✅ Full stats loaded with Hive data');
      setStats(fullStats);
      setDataType('full');
      setIsLoadingHiveData(false);
      
      // Save to cache
      console.log('💾 Saving full stats to cache...');
      await fetch('/api/stats-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stats: fullStats, dataType: 'full' }),
      });
      
      const now = new Date().toISOString();
      setLastUpdated(now);
      setIsCachedData(true);
      console.log('✅ Full stats cached successfully');
    } catch (err) {
      console.error('❌ Error loading full stats:', err);
      setIsLoadingHiveData(false);
    } finally {
      loadingHiveRef.current = false;
    }
  };

  const handleRefreshBasicData = async () => {
    console.log('🔄 Manual refresh of basic data triggered');
    setIsRefreshing(true);
    setIsCachedData(false);
    setDataType('basic');
    
    try {
      // Force refresh basic stats
      await loadStatsProgressive(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshHiveData = async () => {
    console.log('🔄 Manual refresh of Hive data triggered');
    if (loadingHiveRef.current) {
      console.log('⚠️ Already loading Hive data');
      return;
    }
    
    // Start loading full stats with Hive data
    loadFullStatsInBackground();
  };

  // Chart configurations
  const getChartOptions = (title: string) => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  });

  const getPostsChartData = () => {
    if (!stats) return null;

    const timeStats = activeTab === 'daily' ? stats.dailyStats : stats.monthlyStats;
    const curatedStats = activeTab === 'daily' ? stats.curatedDailyStats : stats.curatedMonthlyStats;

    // Create a lookup map for curated stats by date
    const curatedStatsMap = new Map<string, number>();
    curatedStats.forEach(stat => {
      curatedStatsMap.set(stat.date, stat.count);
    });

    return {
      labels: timeStats.map(stat => {
        if (activeTab === 'daily') {
          // Daily format: "YYYY-MM-DD"
          const date = new Date(stat.date + 'T00:00:00'); // Add time to avoid timezone issues
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          // Monthly format: "YYYY-MM" - need to parse correctly
          // Parse as first day of month to avoid timezone shifts
          const [year, month] = stat.date.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1); // month is 0-indexed in JS
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
      }),
      datasets: [
        {
          label: 'All Posts',
          data: timeStats.map(stat => stat.count),
          borderColor: 'rgb(255, 169, 123)',
          backgroundColor: 'rgba(255, 169, 123, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Curated Posts',
          // Align curated data with timeStats dates - use 0 if no curated posts for that date
          data: timeStats.map(stat => curatedStatsMap.get(stat.date) || 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const getCountriesChartData = () => {
    if (!stats) return null;

    const topCountries = stats.countries.slice(0, 10);

    return {
      labels: topCountries.map(country => country.country),
      datasets: [
        {
          label: 'Number of Pins',
          data: topCountries.map(country => country.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getPayoutByCountryChartData = () => {
    if (!stats) return null;

    const topCountries = stats.countries
      .sort((a, b) => b.totalPayout - a.totalPayout)
      .slice(0, 10);

    return {
      labels: topCountries.map(country => country.country),
      datasets: [
        {
          label: 'Total Payout ($)',
          data: topCountries.map(country => country.totalPayout),
          backgroundColor: 'rgba(255, 169, 123, 0.8)',
          borderColor: 'rgba(255, 140, 90, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getUsersChartData = () => {
    if (!stats) return null;

    const topUsers = stats.users.slice(0, 10);

    return {
      labels: topUsers.map(user => user.username),
      datasets: [
        {
          label: 'Number of Pins',
          data: topUsers.map(user => user.pinCount),
          backgroundColor: 'rgba(79, 70, 229, 0.8)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Statistics</h2>
              <p className="text-sm text-gray-600">{progressMessage || 'Initializing...'}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(progress, 1)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>{Math.round(progress)}%</span>
              <span>{progressMessage ? 'Loading...' : 'Please wait...'}</span>
            </div>
            
            <div className="mt-6 text-xs text-gray-500 text-center">
              <p>Fetching data from WorldMapPin API</p>
              <p className="mt-1">Loading basic statistics first...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Statistics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadStatsProgressive()}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Statistics Available</h2>
          <p className="text-gray-600">Unable to load statistics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">WorldMapPin Statistics</h1>
          <p className="text-lg text-gray-600">Comprehensive analytics for the WorldMapPin community</p>
          
          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            {lastUpdated && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
                {isCachedData && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    {dataType === 'full' ? 'Full Data (Cached)' : 'Basic Data (Cached)'}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRefreshBasicData()}
                disabled={isRefreshing || loading}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh basic statistics from WorldMapPin API"
              >
                <svg 
                  className={`w-4 h-4 mr-2 ${(isRefreshing || loading) ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing || loading ? 'Refreshing...' : 'Refresh Basic Data'}
              </button>
              
              <button
                onClick={() => handleRefreshHiveData()}
                disabled={isLoadingHiveData || loading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Hive blockchain data (payouts, votes, comments)"
              >
                <svg 
                  className={`w-4 h-4 mr-2 ${isLoadingHiveData ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {isLoadingHiveData ? 'Loading Hive Data...' : 'Refresh Hive Data'}
              </button>
            </div>
          </div>

          {/* Background Loading Indicator */}
          {isLoadingHiveData && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-sm font-medium text-blue-900">Loading enhanced data from Hive blockchain...</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{Math.round(hiveProgress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${hiveProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-2">{hiveProgressMessage}</p>
            </div>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPins.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Countries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCountries.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payout</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Comments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalComments.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00 2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Payout/Post</p>
                <p className="text-2xl font-bold text-gray-900">${stats.avgPayoutPerPost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgVotesPerPost.toFixed(1)} votes</p>
                <p className="text-xs text-gray-500">{stats.avgCommentsPerPost.toFixed(1)} comments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time Series Charts */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Posts Over Time</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'daily'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'monthly'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          {getPostsChartData() && (
            <div className="h-[400px]">
              <Line 
                data={getPostsChartData()!} 
                options={{
                  ...getChartOptions(`${activeTab === 'daily' ? 'Daily' : 'Monthly'} Posts and Curated Posts`),
                  maintainAspectRatio: false
                }} 
              />
            </div>
          )}
        </div>

        {/* Countries Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Global Pin Distribution</h2>
          
          {/* World Map */}
          {stats.countries.length > 0 && (
            <CountriesWorldMap countries={stats.countries} />
          )}
          
          {/* Bar Chart */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Top 10 Countries by Pin Count</h3>
            {getCountriesChartData() && (
              <div className="h-[400px]">
                <Bar 
                  data={getCountriesChartData()!} 
                  options={{
                    ...getChartOptions('Pins by Country'),
                    maintainAspectRatio: false
                  }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Payout by Country Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 10 Countries by Total Payout</h2>
          {getPayoutByCountryChartData() && (
            <div className="h-[400px]">
              <Bar 
                data={getPayoutByCountryChartData()!} 
                options={{
                  ...getChartOptions('Total Payout by Country'),
                  maintainAspectRatio: false
                }} 
              />
            </div>
          )}
        </div>

        {/* Top Tags */}
        {stats.tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Tags</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {stats.tags.map((tag, index) => (
                <div 
                  key={tag.tag}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-orange-700">#{tag.tag}</span>
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{index + 1}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{tag.count} posts</div>
                  <div className="text-xs text-gray-600">${tag.totalPayout.toFixed(0)} total</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Posts Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Posts by Payout */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Top by Payout
            </h3>
            <div className="space-y-3">
              {stats.topPostsByPayout.slice(0, 5).map((post, index) => (
                <div key={`${post.author}-${post.permlink}`} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a 
                        href={`https://peakd.com/@${post.author}/${post.permlink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
                      >
                        {post.title}
                      </a>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">@{post.author}</span>
                        <span className="text-xs font-bold text-yellow-600">${post.payout.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Posts by Votes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Top by Votes
            </h3>
            <div className="space-y-3">
              {stats.topPostsByVotes.slice(0, 5).map((post, index) => (
                <div key={`${post.author}-${post.permlink}`} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a 
                        href={`https://peakd.com/@${post.author}/${post.permlink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
                      >
                        {post.title}
                      </a>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">@{post.author}</span>
                        <span className="text-xs font-bold text-blue-600">{post.votes} votes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Posts by Comments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Top by Comments
            </h3>
            <div className="space-y-3">
              {stats.topPostsByComments.slice(0, 5).map((post, index) => (
                <div key={`${post.author}-${post.permlink}`} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a 
                        href={`https://peakd.com/@${post.author}/${post.permlink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
                      >
                        {post.title}
                      </a>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">@{post.author}</span>
                        <span className="text-xs font-bold text-indigo-600">{post.comments} replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Countries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Payout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Payout
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.users.slice(0, 20).map((user, index) => (
                  <tr key={user.username} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a 
                        href={`/user/${user.username}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        @{user.username}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.pinCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.countries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.totalVotes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.totalComments.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${user.totalPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${user.avgPayout.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Source Information */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">📊 Data Sources & Methodology</h3>
          <div className="space-y-3 text-sm text-orange-800">
            <p><strong>API Endpoints:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li>WorldMapPin API: https://worldmappin.com/api/marker/0/150000/</li>
              <li>Hive Blockchain: Via Next.js API route /api/hive-post (proxies to https://hive.blog/hive-163772/@author/permlink.json to avoid CORS)</li>
            </ul>
            <p><strong>Countries:</strong> Determined using reverse geocoding from pin coordinates via @rapideditor/country-coder library (same method as WorldCoverageMap)</p>
            <p><strong>Users:</strong> Extracted from postLink field in pin data (@username/permlink format)</p>
            <p><strong>Curated Posts:</strong> Identified using curated_only: true parameter in WorldMapPin API calls</p>
            <p><strong>Detailed Post Data:</strong> Fetched from Hive blockchain for each pin to get accurate payout, votes, comments, and tags</p>
            <p><strong>Payout Calculation:</strong> Uses pending_payout_value for active posts, or total_payout_value + curator_payout_value for paid out posts</p>
            <p><strong>Tags:</strong> Extracted from json_metadata field of each Hive post</p>
            <p><strong>Time Series:</strong> Grouped by postDate field for daily/monthly aggregation</p>
            <p><strong>Processing:</strong> Data is fetched in batches of 10 posts at a time to avoid overwhelming the API</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


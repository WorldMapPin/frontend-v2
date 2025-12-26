'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { fetchBasicPinStats, fetchPinStats, PinStats, CountryStats, UserStats } from '../../lib/statsApi';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import {
  MapPin,
  Globe,
  Users,
  Wallet,
  Heart,
  MessageSquare,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Database,
  Zap,
  Waves,
  ChevronDown,
  Calendar,
  Award
} from 'lucide-react';

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
    <div className="relative overflow-hidden">
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
                          fill: hasData ? '#B45309' : '#9ca3af',
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
            className="absolute px-3 py-1.5 rounded-lg text-xs font-medium pointer-events-none z-50 shadow-xl stats-map-tooltip"
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
      <div className="flex items-center justify-center gap-4 mt-2 text-xs flex-wrap px-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FDE68A' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FB923C' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B45309' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>No pins</span>
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
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
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

  const handleRefreshAllData = async () => {
    console.log('🧹 Manual refresh of all data triggered');
    setIsRefreshingAll(true);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('worldmappin:hive-progress:v1');
      }

      try {
        await fetch('/api/stats-cache', { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to clear stats cache on server:', err);
      }

      await loadStatsProgressive(true);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Chart configurations
  const getChartOptions = (title: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // We have a custom legend or the title area handles it
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          color: '#94a3b8',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        },
        border: {
          display: false,
          dash: [4, 4],
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          color: '#94a3b8',
          padding: 10,
        },
      },
    },
  });

  const getPostsChartData = () => {
    if (!stats) return null;

    const timeStats = activeTab === 'daily' ? stats.dailyStats : stats.monthlyStats;
    const curatedStats = activeTab === 'daily' ? stats.curatedDailyStats : stats.curatedMonthlyStats;

    return {
      labels: timeStats.map(stat => {
        const date = new Date(stat.date);
        return activeTab === 'daily'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }),
      datasets: [
        {
          label: 'All Posts',
          data: timeStats.map(stat => stat.count),
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#F97316',
          pointHoverBorderWidth: 3,
          borderWidth: 3,
        },
        {
          label: 'Curated Posts',
          data: curatedStats.map(stat => stat.count),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#10B981',
          pointHoverBorderWidth: 3,
          borderWidth: 3,
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
      <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-md">
          <div className="rounded-lg shadow-lg p-8 transition-colors duration-300" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 10px 15px -3px var(--shadow-color)' }}>
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Loading Statistics</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{progressMessage || 'Initializing...'}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full rounded-full h-3 mb-2 overflow-hidden" style={{ backgroundColor: 'var(--skeleton-bg)' }}>
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(progress, 1)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{Math.round(progress)}%</span>
              <span>{progressMessage ? 'Loading...' : 'Please wait...'}</span>
            </div>

            <div className="mt-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
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
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Statistics</h2>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
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
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4" style={{ color: 'var(--text-muted)' }}>📊</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Statistics Available</h2>
          <p style={{ color: 'var(--text-muted)' }}>Unable to load statistics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-lexend transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header Card Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden bg-gradient-to-br from-[#F97316] to-[#F59E0B] p-6 sm:p-12">
          {/* Abstract globe pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <Globe size={400} className="text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-center gap-6 sm:gap-8">
            <div className="text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
                Statistics
              </h1>
              <p className="text-orange-50 font-medium text-sm sm:text-base md:text-lg opacity-90 max-w-md mx-auto md:mx-0">
                Comprehensive analytics for the WorldMapPin community
              </p>
            </div>

            {/* Last Updated Card */}
            {lastUpdated && (
              <div className="bg-[#B45309]/30 backdrop-blur-md rounded-2xl p-4 sm:p-6 md:p-8 text-white text-center md:text-right shadow-lg border border-white/10 w-full sm:w-auto min-w-[200px] md:min-w-[240px]">
                <p className="text-[10px] font-bold tracking-widest opacity-80 mb-2 uppercase">Last Updated</p>
                <div className="flex flex-col gap-1">
                  <p className="text-xl sm:text-2xl font-bold leading-tight">
                    {new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs sm:text-sm font-bold opacity-80">
                    {new Date(lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-10">
        {/* Action Buttons Bar */}
        <div className="flex justify-center mb-10 px-4">
          <div className="w-full max-w-2xl rounded-2xl shadow-xl p-2 grid grid-cols-1 sm:grid-cols-3 gap-2 stats-action-bar">
            <button
              onClick={() => handleRefreshBasicData()}
              disabled={isRefreshing || loading || isRefreshingAll}
              className="group flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold tracking-tight stats-refresh-btn rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>

            <button
              onClick={() => handleRefreshAllData()}
              disabled={isRefreshingAll || loading || isLoadingHiveData}
              className="group flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold tracking-tight text-white bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:shadow-lg hover:shadow-orange-500/20 rounded-xl transition-all disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              <span>Refresh All Data</span>
            </button>

            <button
              onClick={() => handleRefreshHiveData()}
              disabled={isLoadingHiveData || loading || isRefreshingAll}
              className="group flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold tracking-tight stats-hive-btn rounded-xl transition-all disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${isLoadingHiveData ? 'animate-spin' : ''}`} />
              <span>Load Hive Data</span>
            </button>
          </div>
        </div>

        {/* Loading Indicator for Hive Data */}
        {isLoadingHiveData && (
          <div className="mb-8 backdrop-blur-sm rounded-3xl p-6 shadow-sm stats-hive-loading">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center stats-hive-loading-icon">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Fetching Hive blockchain data...</span>
                  <p className="text-[10px] text-blue-500 font-bold tracking-tighter">{hiveProgressMessage}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{Math.round(hiveProgress)}%</span>
              </div>
            </div>
            <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--skeleton-bg)' }}>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${hiveProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Total Pins */}
          <div className="stats-metric-card stats-metric-orange rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-orange rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-orange">Total Pins</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-orange">{stats.totalPins.toLocaleString()}</p>
            </div>
          </div>

          {/* Countries */}
          <div className="stats-metric-card stats-metric-orange rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-orange rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Globe className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-orange">Countries</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-orange">{stats.totalCountries.toLocaleString()}</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="stats-metric-card stats-metric-orange rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-orange rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-orange">Active Users</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-orange">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Payout */}
          <div className="stats-metric-card stats-metric-orange rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-orange rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-orange">Total Payout</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-orange">${stats.totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          {/* Total Votes */}
          <div className="stats-metric-card stats-metric-sky rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-sky rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Heart className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-sky">Total Votes</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-sky">{stats.totalVotes.toLocaleString()}</p>
            </div>
          </div>

          {/* Total Comments */}
          <div className="stats-metric-card stats-metric-purple rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-purple rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-purple">Total Comments</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-purple">{stats.totalComments.toLocaleString()}</p>
            </div>
          </div>

          {/* Avg Payout/Post */}
          <div className="stats-metric-card stats-metric-green rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-green rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-green">Avg. Payout/Post</p>
              <p className="text-3xl font-bold leading-none stats-metric-value-green">${stats.avgPayoutPerPost.toFixed(2)}</p>
            </div>
          </div>

          {/* Avg Engagement */}
          <div className="stats-metric-card stats-metric-cyan rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 stats-metric-icon-cyan rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Waves className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1 stats-metric-label-cyan">Avg. Engagement</p>
              <div className="flex flex-col">
                <p className="text-3xl font-bold leading-none stats-metric-value-cyan">
                  {stats.avgVotesPerPost.toFixed(1)} <span className="text-xs font-bold opacity-70">votes</span>
                </p>
                <p className="text-xs font-bold mt-1 stats-metric-sublabel-cyan">
                  {stats.avgCommentsPerPost.toFixed(1)} comments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content & Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Main Charts Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Time Series Charts */}
            <div className="stats-card rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8">
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Posts Over Time</h2>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Daily Posts and Curated Posts</p>
                </div>

                <div className="stats-tab-container p-1 rounded-xl flex sm:inline-flex gap-1 shadow-inner w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('daily')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'daily'
                      ? 'stats-tab-active'
                      : 'stats-tab-inactive'
                      }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'monthly'
                      ? 'stats-tab-active'
                      : 'stats-tab-inactive'
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
                    options={getChartOptions('')}
                  />
                </div>
              )}
            </div>

            {/* Countries Section */}
            <div className="stats-card rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div className="text-center sm:text-left w-full sm:w-auto">
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Top 10 Countries by Pin Count</h2>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Ranked by number of pins</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                {getCountriesChartData() && (
                  <div className="h-[400px]">
                    <Bar
                      data={getCountriesChartData()!}
                      options={getChartOptions('')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Global Pin Distribution (Map) Section */}
            <div className="stats-card rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div className="text-center sm:text-left w-full sm:w-auto">
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Global Pin Distribution</h2>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Ranked by number of pins per country</p>
                </div>
              </div>

              {stats.countries.length > 0 && (
                <CountriesWorldMap countries={stats.countries} />
              )}
            </div>

            {/* Top Tags Section (Grid) */}
            {stats.tags.length > 0 && (
              <div className="stats-card rounded-2xl sm:rounded-3xl shadow-xl p-8 overflow-hidden relative">
                <h2 className="text-xl font-bold tracking-tight mb-8" style={{ color: 'var(--text-primary)' }}>Top Tags</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {stats.tags.slice(0, 10).map((tag, index) => (
                    <div
                      key={tag.tag}
                      className="stats-tag-card rounded-xl p-4 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-orange-500 tracking-[0.2em]">#{tag.tag}</span>
                        <span className="w-5 h-5 bg-orange-500 text-white rounded-lg flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                      </div>
                      <div className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{tag.count} <span className="text-[10px] opacity-40">posts</span></div>
                      <div className="text-[10px] font-semibold tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>${tag.totalPayout.toFixed(0)} total</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Posts Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Posts by Payout */}
              <div className="stats-post-card rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Wallet className="w-4 h-4 text-amber-500" />
                  Top by Payout
                </h3>
                <div className="space-y-4">
                  {stats.topPostsByPayout.slice(0, 5).map((post, index) => (
                    <div key={`${post.author}-${post.permlink}`} className="flex items-start gap-3 group">
                      <span className="text-[10px] font-bold group-hover:text-orange-300 mt-1" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://peakd.com/@${post.author}/${post.permlink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold hover:text-orange-600 line-clamp-2 leading-snug transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {post.title}
                        </a>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>@{post.author}</span>
                          <span className="text-[10px] font-bold text-amber-600">${post.payout.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Posts by Votes */}
              <div className="stats-post-card rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Heart className="w-4 h-4 text-sky-500" />
                  Top by Votes
                </h3>
                <div className="space-y-4">
                  {stats.topPostsByVotes.slice(0, 5).map((post, index) => (
                    <div key={`${post.author}-${post.permlink}`} className="flex items-start gap-3 group">
                      <span className="text-[10px] font-bold group-hover:text-orange-300 mt-1" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://peakd.com/@${post.author}/${post.permlink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold hover:text-orange-600 line-clamp-2 leading-snug transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {post.title}
                        </a>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>@{post.author}</span>
                          <span className="text-[10px] font-bold text-sky-600">{post.votes} <span className="text-[8px] opacity-60">votes</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Posts by Comments */}
              <div className="stats-post-card rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Top by Comments
                </h3>
                <div className="space-y-4">
                  {stats.topPostsByComments.slice(0, 5).map((post, index) => (
                    <div key={`${post.author}-${post.permlink}`} className="flex items-start gap-3 group">
                      <span className="text-[10px] font-bold group-hover:text-orange-300 mt-1" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://peakd.com/@${post.author}/${post.permlink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold hover:text-orange-600 line-clamp-2 leading-snug transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {post.title}
                        </a>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>@{post.author}</span>
                          <span className="text-[10px] font-bold text-purple-600">{post.comments} <span className="text-[8px] opacity-60">replies</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Top Users */}
          <div className="lg:col-span-1 space-y-8">
            <div className="stats-card rounded-2xl sm:rounded-3xl shadow-xl p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center stats-user-icon-bg">
                  <Award className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Top Users</h2>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>by Pins</p>
                </div>
              </div>

              <div className="space-y-3">
                {stats.users.slice(0, 10).map((user, index) => (
                  <div key={user.username} className="stats-user-item rounded-xl p-3 flex items-center gap-3 transition-colors group">
                    <div className="w-6 text-[10px] font-bold group-hover:text-orange-300 text-center" style={{ color: 'var(--text-muted)' }}>{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/user/${user.username}`}
                        className="text-xs font-bold truncate block hover:text-orange-600 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        @{user.username}
                      </a>
                      <p className="text-[10px] font-bold text-orange-600 tracking-widest">{user.pinCount.toLocaleString()} Pins</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold leading-none" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{user.countries}</p>
                      <p className="text-[8px] font-bold tracking-tighter" style={{ color: 'var(--text-muted)' }}>Countries</p>
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </div>
        </div>

        {/* Data Source Information */}
        <div className="stats-info-card backdrop-blur-sm rounded-2xl sm:rounded-3xl p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center stats-info-icon-bg">
              <Database className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Data Sources & Methodology</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-orange-600 mb-2">Loading Strategy</p>
                <ul className="space-y-2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  <li className="flex gap-2"><span className="text-orange-400">01.</span> Basic Data: Fast load via WorldMapPin API</li>
                  <li className="flex gap-2"><span className="text-orange-400">02.</span> Enhanced Data: Hive blockchain data (votes, comments, payouts)</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-orange-600 mb-2">Countries & Users</p>
                <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Countries determined using reverse geocoding via @rapideditor/country-coder.
                  Users extracted from post links in the @username/permlink format.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-orange-600 mb-2">API Endpoints</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono overflow-hidden text-ellipsis" style={{ color: 'var(--text-muted)' }}>worldmappin.com/api/marker</p>
                  <p className="text-[10px] font-mono overflow-hidden text-ellipsis" style={{ color: 'var(--text-muted)' }}>hive.blog (via API proxy)</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-orange-600 mb-2">Processing</p>
                <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Data fetched in batches of 2000 pins. Hive data fetched in batches of 10 to avoid rate limiting.
                  Payouts include pending and total values.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


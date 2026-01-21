'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';
import { useTheme } from '../ThemeProvider';
import { setGlobalLocation, setGlobalZoom, toggleGlobalCodeMode } from './map-global-controls';

export default function MapNavbar() {
    const { user, isReady, logout } = useAiohaSafe();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [searchValue, setSearchValue] = useState('');
    const [pinCount] = useState(142194);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // User menu state
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const toggleUserMenu = () => {
        setShowUserMenu(!showUserMenu);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: searchValue }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const { location } = results[0].geometry;
                setGlobalLocation({
                    location: { lat: location.lat(), lng: location.lng() },
                    name: results[0].formatted_address
                });
                setGlobalZoom(15);
            }
        });
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14 md:h-16 shadow-sm font-lexend">
                {/* Left: Logo */}
                <div className="flex items-center flex-shrink-0">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/images/worldmappin-logo.png"
                            alt="WorldMappin"
                            width={32}
                            height={32}
                            className="w-7 h-7 sm:w-8 sm:h-8"
                        />
                        <div className="hidden sm:flex flex-col">
                            <span className="text-base sm:text-lg font-bold leading-none">
                                World<span className="text-[#ED6D28]">Map</span>Pin
                            </span>
                            <span className="text-[10px] sm:text-xs text-[#ED6D28] font-medium leading-none mt-0.5">
                                Found {pinCount.toLocaleString()} Pins
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center: Search Bar */}
                <div className="flex flex-1 max-w-md mx-2 sm:mx-4">
                    <form onSubmit={handleSearch} className="relative w-full">
                        <div className="flex items-center w-full bg-[#F3F4F6] rounded-full px-3 sm:px-4 h-9 sm:h-10">
                            <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Find a Place"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full text-xs sm:text-sm text-gray-700 placeholder-gray-400 p-0"
                            />
                            <button
                                type="button"
                                onClick={toggleGlobalCodeMode}
                                className="absolute right-1 top-1 bottom-1 w-7 h-7 sm:w-8 sm:h-8 bg-[#ED6D28] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#D95D20] transition-colors"
                                title="Get Location Code"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: Desktop Links and Actions */}
                <div className="flex items-center space-x-1 sm:space-x-4">
                    <div className="hidden lg:flex items-center space-x-6 text-[#4B5563] font-medium text-sm mr-4">

                        <Link href="/explore" className="hover:text-[#ED6D28] transition-colors">Explore</Link>
                        <Link href="/challenges" className="hover:text-[#0ea5e9] transition-colors">Challenges</Link>
                        <Link href={`/map/@${user || ''}`} className="hover:text-[#ED6D28] transition-colors">My Map</Link>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hidden sm:block"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    {/* Desktop User profile */}
                    {isReady && user && (
                        <div className="hidden sm:block relative" ref={userMenuRef}>
                            <button
                                onClick={toggleUserMenu}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ED6D28] p-[2px] transition-transform active:scale-95 focus:outline-none"
                            >
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative bg-white">
                                    <Image
                                        src={`https://images.hive.blog/u/${user}/avatar`}
                                        alt={user}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">@{user}</p>
                                    </div>

                                    <div className="py-1">
                                        <Link
                                            href={`/user/${user}`}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            My Profile
                                        </Link>
                                        <Link
                                            href={`/map/@${user}`}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            My Map
                                        </Link>
                                        <Link
                                            href="/my-countries"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            My Countries
                                        </Link>
                                        <Link
                                            href="/explore"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors lg:hidden"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            Explore
                                        </Link>
                                        <Link
                                            href="/challenges"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors lg:hidden"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            Challenges
                                        </Link>
                                    </div>

                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                logout();
                                                router.push('/');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                                        >
                                            Log out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-1.5 sm:p-2 lg:hidden rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Sidebar Menu */}
            <div
                className={`fixed inset-0 z-[110] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <div
                    className={`absolute top-0 right-0 h-screen w-72 bg-white shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} font-lexend`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 flex flex-col h-full overflow-y-auto">
                        {/* Header of Sidebar */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                {isReady && user ? (
                                    <>
                                        <div className="w-11 h-11 rounded-full border-2 border-[#ED6D28] overflow-hidden relative shadow-sm">
                                            <Image src={`https://images.hive.blog/u/${user}/avatar`} alt={user} fill className="object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 leading-none">@{user}</span>
                                            <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-1">Explorer</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="font-bold text-gray-800">Menu</span>
                                )}
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="space-y-1 flex-1">

                            <Link href="/explore" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 text-gray-700 font-bold transition-all border border-transparent hover:border-orange-100">
                                <span>Explore</span>
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link href="/challenges" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-sky-50 text-gray-700 font-bold transition-all border border-transparent hover:border-sky-100">
                                <span>Challenges</span>
                                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link href={`/map/@${user || ''}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 text-gray-700 font-bold transition-all border border-transparent hover:border-orange-100">
                                <span>My Map</span>
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>

                            <div className="pt-4 mt-2">
                                <button
                                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 text-gray-700 font-bold transition-all"
                                >
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    {theme === 'dark' ? (
                                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zm2.12 10.607a1 1 0 010-1.414l.706-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Footer section of Sidebar */}
                        <div className="mt-auto pt-6 border-t border-gray-100">
                            {user && (
                                <button
                                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                    className="w-full p-4 rounded-xl bg-red-50 text-red-600 font-bold transition-all flex items-center justify-center shadow-sm"
                                >
                                    Log out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

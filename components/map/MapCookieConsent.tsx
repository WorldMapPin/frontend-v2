'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../../components/ThemeProvider';
import Image from 'next/image';

interface MapCookieConsentProps {
    children: React.ReactNode;
}

export const MapCookieConsent: React.FC<MapCookieConsentProps> = ({ children }) => {
    const [consent, setConsent] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        // Check local storage for consent on mount
        const storedConsent = localStorage.getItem('map_cookie_consent');
        if (storedConsent === 'true') {
            setConsent(true);
        } else if (storedConsent === 'false') {
            setConsent(false);
        } else {
            setConsent(null);
        }
        setLoading(false);
    }, []);

    const handleAccept = () => {
        localStorage.setItem('map_cookie_consent', 'true');
        setConsent(true);
    };

    const handleReject = () => {
        localStorage.setItem('map_cookie_consent', 'false');
        setConsent(false);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    // If consent is true, render the map
    if (consent === true) {
        return <>{children}</>;
    }

    // If consent is false, show rejected screen - styled to match MapNavbar
    if (consent === false) {
        return (
            <div className="h-screen w-full flex items-center justify-center p-4 relative font-lexend"
                style={{
                    backgroundColor: 'var(--navbar-bg)',
                    color: 'var(--text-primary)'
                }}>
                <div className="rounded-xl shadow-xl p-8 max-w-md w-full text-center border"
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-subtle)'
                    }}>
                    <div className="mb-6 opacity-80">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Map Disabled</h2>
                    <p className="mb-8 opacity-70">
                        The map cannot be displayed because you have rejected the necessary cookies.
                    </p>
                    <button
                        onClick={handleAccept}
                        className="w-full bg-[#ED6D28] hover:bg-[#D95D20] text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-sm"
                    >
                        Enable Map & Accept Cookies
                    </button>
                </div>
            </div>
        );
    }

    // If consent is null (not yet decided), show consent prompt
    return (
        <div className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-lexend"
            style={{ backgroundColor: 'var(--navbar-bg)' }}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative z-10 border"
                style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                }}>
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-[#ED6D28]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Map Cookie Consent</h2>
                <p className="mb-8 text-left opacity-80 text-sm leading-relaxed">
                    To display the interactive map, we use cookies from Google Maps. These are strictly necessary for the map functionality.
                    <br /><br />
                    Do you consent to these cookies?
                    <span className="block text-xs mt-2 opacity-60 italic">Rejecting will disable the map view.</span>
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleAccept}
                        className="w-full bg-[#ED6D28] hover:bg-[#D95D20] text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-sm flex items-center justify-center"
                    >
                        Accept Cookies & View Map
                    </button>

                    <button
                        onClick={handleReject}
                        className="w-full font-semibold py-3 px-6 rounded-xl transition-colors duration-200 border"
                        style={{
                            backgroundColor: 'var(--section-bg)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        Reject & Disable Map
                    </button>
                </div>
            </div>
        </div>
    );
};

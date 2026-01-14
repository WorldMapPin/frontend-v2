'use client';

// A simple store for global map controls to avoid circular dependencies
// and modules being loaded when they shouldn't be.

export type GlobalLocation = {
    location: { lat: number; lng: number };
    name?: string;
};

export const setGlobalLocation = (location: GlobalLocation | undefined) => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('map-set-location', { detail: location });
        window.dispatchEvent(event);
    }
};

export const setGlobalZoom = (zoom: number | undefined) => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('map-set-zoom', { detail: zoom });
        window.dispatchEvent(event);
    }
};

export const toggleGlobalCodeMode = () => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('map-toggle-code-mode');
        window.dispatchEvent(event);
    }
};

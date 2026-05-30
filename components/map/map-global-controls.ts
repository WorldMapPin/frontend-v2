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

// Last known number of pins currently loaded on the map. Retained at module
// level so components that mount after the map has loaded (e.g. the navbar)
// can read the current value immediately instead of waiting for the next event.
let lastPinCount: number | null = null;

export const setGlobalPinCount = (count: number) => {
    lastPinCount = count;
    if (typeof window !== 'undefined') {
        const event = new CustomEvent<number>('map-pin-count', { detail: count });
        window.dispatchEvent(event);
    }
};

export const getGlobalPinCount = () => lastPinCount;

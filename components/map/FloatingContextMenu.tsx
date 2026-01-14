// Floating context menu component for right-click and long-press interactions
// Shows "Add Pin Here" option when in code mode

import React, { useEffect, useRef } from 'react';

interface FloatingContextMenuProps {
    isVisible: boolean;
    position: { x: number; y: number };
    onAddPin: () => void;
    onStartJourney: () => void;
    onClose: () => void;
}

export const FloatingContextMenu: React.FC<FloatingContextMenuProps> = ({
    isVisible,
    position,
    onAddPin,
    onStartJourney,
    onClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Handle clicks outside the menu to close it
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isVisible, onClose]);

    // Handle escape key to close menu
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div
            ref={menuRef}
            className="floating-context-menu"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            <div className="context-menu-content">
                <button
                    className="context-menu-item add-pin-button"
                    onClick={onAddPin}
                >
                    <svg className="context-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Get Code Here</span>
                </button>

                <button
                    className="context-menu-item start-journey-button"
                    onClick={() => {
                        onStartJourney();
                        onClose();
                    }}
                >
                    <svg className="context-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7" />
                    </svg>
                    <span>Start Journey Here</span>
                </button>
            </div>
        </div>
    );
};

export default FloatingContextMenu;

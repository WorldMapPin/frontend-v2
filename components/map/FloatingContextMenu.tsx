// Floating context menu component for right-click and long-press interactions
// Shows "Add Pin Here" option when in code mode

import React, { useEffect, useRef } from 'react';

interface FloatingContextMenuProps {
    isVisible: boolean;
    position: { x: number; y: number };
    onAddPin: () => void;
    onWritePost: () => void;
    onAddToJourney?: () => void;
    isJourneyMode?: boolean;
    hasFeatureId?: boolean;
    onClose: () => void;
}

export const FloatingContextMenu: React.FC<FloatingContextMenuProps> = ({
    isVisible,
    position,
    onAddPin,
    onWritePost,
    onAddToJourney,
    isJourneyMode = false,
    hasFeatureId = false,
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
                {isJourneyMode && hasFeatureId && onAddToJourney && (
                    <button
                        className="context-menu-item write-post-button"
                        onClick={() => {
                            onAddToJourney();
                            onClose();
                        }}
                    >
                        <svg className="context-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add To Journey</span>
                    </button>
                )}

                {!isJourneyMode && (
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
                )}

                <button
                    className="context-menu-item write-post-button"
                    onClick={() => {
                        onWritePost();
                        onClose();
                    }}
                >
                    <svg className="context-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Write New Post Here</span>
                </button>
            </div>
        </div>
    );
};

export default FloatingContextMenu;

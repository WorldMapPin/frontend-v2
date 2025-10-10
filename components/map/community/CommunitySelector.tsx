'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Community } from '../../../types';

interface CommunitySelectorProps {
  communities: Community[];
  selectedCommunity: Community;
  onCommunityChange: (community: Community) => void;
  onLoadPins: (community: Community) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function CommunitySelector({
  communities,
  selectedCommunity,
  onCommunityChange,
  onLoadPins,
  isVisible,
  onClose
}: CommunitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown when component becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false);
    }
  }, [isVisible]);

  const handleCommunitySelect = (community: Community) => {
    // Just update the selected community, don't load pins yet
    onCommunityChange(community);
    setIsOpen(false);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute z-40 inset-0 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      ></div>
      
      {/* Community Selector Modal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 min-w-[320px] max-w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Select Community</h3>
                <p className="text-sm text-gray-600">Choose a community to view their pins</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Community Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedCommunity.name}</p>
                  {selectedCommunity.description && (
                    <p className="text-sm text-gray-600">{selectedCommunity.description}</p>
                  )}
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                {communities.map((community) => (
                  <button
                    key={community.id}
                    onClick={() => handleCommunitySelect(community)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 ${
                      community.id === selectedCommunity.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      community.id === selectedCommunity.id ? 'bg-orange-500' : 'bg-gray-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        community.id === selectedCommunity.id ? 'bg-white' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        community.id === selectedCommunity.id ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {community.name}
                      </p>
                      {community.description && (
                        <p className="text-sm text-gray-600">{community.description}</p>
                      )}
                    </div>
                    {community.id === selectedCommunity.id && (
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onLoadPins(selectedCommunity);
                onClose();
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Load Pins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

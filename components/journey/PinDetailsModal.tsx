'use client';

import React from 'react';
import { JourneyPin } from '../../types';

interface PinDetailsModalProps {
  pin: JourneyPin;
  onClose: () => void;
}

export default function PinDetailsModal({ pin, onClose }: PinDetailsModalProps) {
  const getPinTypeLabel = (pinType: string | undefined) => {
    if (!pinType) return '📄 Pin'; // Default for old pins
    switch (pinType) {
      case 'post': return '📄 Linked to Post';
      case 'snap': return '📸 Image Snap';
      case 'future-post': return '📝 Post Coming Soon';
      case 'placeholder': return '📌 Waypoint';
      default: return '📌 Pin';
    }
  };

  const getPinTypeColor = (pinType: string | undefined) => {
    if (!pinType) return 'bg-blue-50 border-blue-200 text-blue-800'; // Default for old pins
    switch (pinType) {
      case 'post': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'snap': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'future-post': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'placeholder': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{pin.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-600">✕</span>
          </button>
        </div>

        {/* Pin Type Badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 border ${getPinTypeColor(pin.pinType)}`}>
          {getPinTypeLabel(pin.pinType)}
        </div>

        {/* Location */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
          <p className="text-sm text-gray-600">
            {pin.position.lat.toFixed(6)}, {pin.position.lng.toFixed(6)}
          </p>
        </div>

        {/* Post Link */}
        {pin.pinType === 'post' && pin.postPermlink && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Linked Post</p>
            <a
              href={`https://worldmappin.com/@${pin.postAuthor}/${pin.postPermlink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <span>View on WorldMapPin</span>
              <span>→</span>
            </a>
            <p className="text-xs text-gray-500 mt-2">
              @{pin.postAuthor}/{pin.postPermlink}
            </p>
          </div>
        )}

        {/* Image Snap */}
        {pin.pinType === 'snap' && pin.imageUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Image</p>
            <img
              src={pin.imageUrl}
              alt={pin.title}
              className="w-full rounded-lg border border-gray-200"
            />
            {pin.imageCaption && (
              <p className="text-sm text-gray-600 mt-2 italic">{pin.imageCaption}</p>
            )}
          </div>
        )}

        {/* Future Post Info */}
        {pin.pinType === 'future-post' && (
          <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              💡 This location is marked for a future post. Create your post on WorldMapPin at this location!
            </p>
          </div>
        )}

        {/* Placeholder Info */}
        {pin.pinType === 'placeholder' && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              This is a waypoint marker without associated content.
            </p>
          </div>
        )}

        {/* Description */}
        {pin.description && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
            <p className="text-sm text-gray-600">{pin.description}</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}


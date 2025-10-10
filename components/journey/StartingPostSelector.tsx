'use client';

import React, { useState, useEffect } from 'react';
import { fetchUserPostsWithCoords } from '../../lib/worldmappinApi';

interface StartingPostSelectorProps {
  username: string;
  onSelect: (post: any) => void;
  onSkip: () => void;
  onCancel: () => void;
  selectedPostId?: number | null;
}

export default function StartingPostSelector({ username, onSelect, onSkip, onCancel, selectedPostId }: StartingPostSelectorProps) {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'existing' | 'coming'>('existing');
  
  // Drag to resize state
  const [selectorHeight, setSelectorHeight] = useState(45); // percentage of viewport height
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(45);

  // Update selected post when selectedPostId changes (from map click)
  useEffect(() => {
    if (selectedPostId && allPosts.length > 0) {
      const post = allPosts.find(p => p.id === selectedPostId);
      if (post) {
        setSelectedPost(post);
      }
    }
  }, [selectedPostId, allPosts]);

  // Fetch all user's posts
  useEffect(() => {
    const loadUserPosts = async () => {
      try {
        setLoading(true);
        
        // Fetch posts with coordinates in one optimized call
        const posts = await fetchUserPostsWithCoords(username);
        
        console.log('StartingPostSelector: Loaded', posts.length, 'posts');
        setAllPosts(posts);
      } catch (error) {
        console.error('StartingPostSelector: Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserPosts();
  }, [username]);

  // Filter posts based on search query
  const filteredPosts = allPosts.filter(post => {
    const title = post.title || '';
    const permlink = post.permlink || '';
    const query = searchQuery.toLowerCase();
    return title.toLowerCase().includes(query) || permlink.toLowerCase().includes(query);
  });

  // Drag handlers for resizing
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartHeight(selectorHeight);
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartY - clientY;
      const viewportHeight = window.innerHeight;
      const deltaPercent = (deltaY / viewportHeight) * 100;
      
      const newHeight = Math.min(Math.max(dragStartHeight + deltaPercent, 30), 95);
      setSelectorHeight(newHeight);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStartY, dragStartHeight]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none">
      <div 
        className="bg-white rounded-t-3xl shadow-2xl w-full flex flex-col animate-slide-up pointer-events-auto"
        style={{ maxHeight: `${selectorHeight}vh` }}
      >
        {/* Drag handle */}
        <div 
          className="flex justify-center pt-2 pb-1 bg-gray-100 cursor-ns-resize active:cursor-grabbing hover:bg-gray-200 transition-colors rounded-t-3xl"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1.5 bg-gray-400 rounded-full"></div>
        </div>

        {/* Header - Compact */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">🗺️ Starting Point</h2>
            <p className="text-xs text-gray-600">Select a post or mark for later</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
          >
            <span className="text-gray-600 text-xl">×</span>
          </button>
        </div>

        {/* Mode Selector - Compact */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('existing')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'existing'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>📄</span>
                <span>Existing Post</span>
              </div>
            </button>
            <button
              onClick={() => setMode('coming')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'coming'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>📝</span>
                <span>Coming Soon</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode === 'coming' ? (
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
              <div className="text-center max-w-md">
                <div className="text-5xl sm:text-6xl mb-4">📝</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Mark Location for Future Post</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Start your journey without a post. You can add your travel content later!
                </p>
                <button
                  onClick={onSkip}
                  className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-lg"
                >
                  Start Journey (Post Coming Soon)
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your posts...</p>
              </div>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-4">📍</div>
                <p className="text-gray-600 mb-2 text-base sm:text-lg font-medium">No posts with locations</p>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Make sure your posts have location data on WorldMapPin
                </p>
                <button
                  onClick={onSkip}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Create Empty Journey
                </button>
              </div>
            </div>
          ) : (
          <div className="flex-1 overflow-hidden flex flex-col px-3 pt-2">
            {/* Info message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
              <p className="text-xs text-blue-800">
                🗺️ <strong>{allPosts.length} posts</strong> - Tap a pin or select below
              </p>
            </div>
            
            {/* Search bar */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search..."
              className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            {/* Posts list - Stacked vertically for mobile */}
            {filteredPosts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-500">
                  {searchQuery ? '🔍 No posts match your search' : 'No posts found'}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto -mx-3 px-3">
                <div className="space-y-2 pb-3">
                  {filteredPosts.map(post => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`flex gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPost?.id === post.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow bg-white'
                      }`}
                    >
                      {/* Post image */}
                      {post.image && (
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <img
                            src={post.image}
                            alt={post.title || 'Post'}
                            className="w-full h-full object-cover"
                          />
                          {selectedPost?.id === post.id && (
                            <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg">
                              ✓
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Post info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-0.5 line-clamp-2 text-sm">
                          {post.title || 'Untitled Post'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 truncate">
                          @{post.author || 'unknown'}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600">
                          <span className="flex items-center">
                            📍 {post.lattitude.toFixed(2)}°, {post.longitude.toFixed(2)}°
                          </span>
                          {post.created && (
                            <span>
                              📅 {new Date(post.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
          )}
        </div>

        {/* Footer with action buttons */}
        {mode === 'existing' && !loading && allPosts.length > 0 && (
          <div className="border-t p-3 bg-gray-50">
            {selectedPost && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-800 mb-1">✓ Selected:</p>
                <div className="flex items-center gap-2">
                  {selectedPost.image && (
                    <img
                      src={selectedPost.image}
                      alt={selectedPost.title || 'Post'}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate text-xs">{selectedPost.title || 'Untitled Post'}</p>
                    <p className="text-xs text-gray-600 truncate">
                      📍 {selectedPost.lattitude.toFixed(4)}, {selectedPost.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedPost && onSelect(selectedPost)}
                disabled={!selectedPost}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  selectedPost
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedPost ? '🚀 Start' : 'Select a Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


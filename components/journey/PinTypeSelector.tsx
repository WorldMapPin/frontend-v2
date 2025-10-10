'use client';

import React, { useState, useEffect } from 'react';
import { MarkerPosition, JourneyPinType } from '../../types';
import { fetchUserPostsWithCoords } from '../../lib/worldmappinApi';

interface PinTypeSelectorProps {
  position: MarkerPosition;
  username: string;
  onConfirm: (pinData: {
    position: MarkerPosition;
    title: string;
    pinType: JourneyPinType;
    postId?: number;
    postPermlink?: string;
    postAuthor?: string;
    imageUrl?: string;
    imageCaption?: string;
  }) => void;
  onCancel: () => void;
}

export default function PinTypeSelector({ position, username, onConfirm, onCancel }: PinTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<JourneyPinType | null>(null);
  const [nearbyPosts, setNearbyPosts] = useState<any[]>([]);
  const [allUserPosts, setAllUserPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAllPosts, setLoadingAllPosts] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageCaption, setImageCaption] = useState('');

  // Fetch user's posts near this location
  useEffect(() => {
    const loadNearbyPosts = async () => {
      try {
        setLoading(true);
        
        // Fetch posts with coordinates in one optimized call
        const postsWithCoords = await fetchUserPostsWithCoords(username);
        
        if (postsWithCoords.length === 0) {
          setAllUserPosts([]);
          setNearbyPosts([]);
          setLoading(false);
          return;
        }
        
        console.log('PinTypeSelector: Loaded', postsWithCoords.length, 'user posts');
        setAllUserPosts(postsWithCoords);
        
        // Find posts within ~0.01 degrees (~1km) of the clicked position
        const nearby = postsWithCoords.filter((post: any) => {
          const distance = Math.sqrt(
            Math.pow(post.lattitude - position.lat, 2) +
            Math.pow(post.longitude - position.lng, 2)
          );
          return distance < 0.01;
        });
        
        setNearbyPosts(nearby);
        
        // If there's exactly one nearby post, suggest it
        if (nearby.length === 1) {
          setSelectedPost(nearby[0]);
          setSelectedType('post');
          setTitle(nearby[0].title || 'Untitled Post');
        }
      } catch (error) {
        console.error('PinTypeSelector: Error fetching nearby posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNearbyPosts();
  }, [position, username]);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load all user posts for browsing
  const handleBrowseAllPosts = () => {
    setShowAllPosts(true);
    setSelectedType('post');
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!selectedType) return;

    if (selectedType === 'post' && selectedPost) {
      // Use the selected post's coordinates from API top level
      const postPosition = {
        lat: selectedPost.lattitude, // API uses 'lattitude' with typo
        lng: selectedPost.longitude
      };
      
      onConfirm({
        position: postPosition,
        title: selectedPost.title || 'Untitled Post',
        pinType: 'post',
        postId: selectedPost.id,
        postPermlink: selectedPost.permlink,
        postAuthor: selectedPost.author,
        imageUrl: selectedPost.image || selectedPost.imageUrl, // Add image from post
        imageCaption: selectedPost.body ? selectedPost.body.substring(0, 200) : '' // Optional: add excerpt
      });
    } else if (selectedType === 'snap') {
      if (!imagePreview) {
        alert('Please select an image');
        return;
      }
      onConfirm({
        position,
        title: title || 'Snap',
        pinType: 'snap',
        imageUrl: imagePreview,
        imageCaption
      });
    } else if (selectedType === 'future-post') {
      onConfirm({
        position,
        title: title || 'Post coming soon',
        pinType: 'future-post'
      });
    } else if (selectedType === 'placeholder') {
      onConfirm({
        position,
        title: title || 'Waypoint',
        pinType: 'placeholder'
      });
    }
  };

  // Filter posts based on search query
  const filteredPosts = showAllPosts 
    ? allUserPosts.filter(post => {
        const title = post.title || '';
        const permlink = post.permlink || '';
        const query = searchQuery.toLowerCase();
        return title.toLowerCase().includes(query) || permlink.toLowerCase().includes(query);
      })
    : nearbyPosts;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {showAllPosts ? '📚 Browse Your Posts' : 'Add Pin to Journey'}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-600 text-xl">×</span>
          </button>
        </div>
        
        {!showAllPosts && (
          <p className="text-sm text-gray-600 mb-4">
            📍 Clicked: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Checking for your posts nearby...</span>
          </div>
        ) : (
          <>
            {/* Browse all posts or show nearby posts */}
            {showAllPosts ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    📚 All Your Posts ({allUserPosts.length})
                  </h3>
                  <button
                    onClick={() => setShowAllPosts(false)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    ← Back
                  </button>
                </div>
                
                {/* Search bar */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your posts..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPosts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No posts found</p>
                  ) : (
                    filteredPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setSelectedPost(post);
                          setSelectedType('post');
                          setTitle(post.title || 'Untitled Post');
                        }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPost?.id === post.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                            {(post.image || post.postImageLink) && (
                              <img
                                src={post.image || post.postImageLink}
                                alt={post.title || 'Post'}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{post.title || 'Untitled Post'}</p>
                            <p className="text-xs text-gray-500 truncate">
                              @{post.author || 'unknown'} • {post.permlink || 'no-link'}
                            </p>
                          </div>
                          {selectedPost?.id === post.id && (
                            <div className="text-blue-500 text-lg">✓</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Show nearby posts if available */}
                {nearbyPosts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      📍 Your posts at this location
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {nearbyPosts.map(post => (
                        <div
                          key={post.id}
                          onClick={() => {
                            setSelectedPost(post);
                            setSelectedType('post');
                            setTitle(post.title || 'Untitled Post');
                          }}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPost?.id === post.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {(post.image || post.postImageLink) && (
                              <img
                                src={post.image || post.postImageLink}
                                alt={post.title || 'Post'}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{post.title || 'Untitled Post'}</p>
                              <p className="text-xs text-gray-500">
                                @{post.author || 'unknown'} • {post.permlink || 'no-link'}
                              </p>
                            </div>
                            {selectedPost?.id === post.id && (
                              <div className="text-blue-500">✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pin type options */}
            {!showAllPosts && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {nearbyPosts.length > 0 ? 'Or choose an option' : 'Choose pin type'}
                </h3>

                {/* Browse all posts option */}
                <button
                  onClick={handleBrowseAllPosts}
                  className="w-full p-4 rounded-lg border-2 text-left transition-all border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📚</span>
                    <div>
                      <p className="font-semibold text-gray-800">Choose Existing Post</p>
                      <p className="text-sm text-gray-600">
                        Browse all your {allUserPosts.length} posts
                      </p>
                    </div>
                  </div>
                </button>

                {/* Snap option */}
                <button
                  onClick={() => setSelectedType('snap')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedType === 'snap'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📸</span>
                    <div>
                      <p className="font-semibold text-gray-800">Add Image (Snap)</p>
                      <p className="text-sm text-gray-600">
                        Quick photo without creating a full post
                      </p>
                    </div>
                  </div>
                </button>

                {/* Future post option */}
                <button
                  onClick={() => setSelectedType('future-post')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedType === 'future-post'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="font-semibold text-gray-800">Add Post Later</p>
                      <p className="text-sm text-gray-600">
                        Mark location, create post later
                      </p>
                    </div>
                  </div>
                </button>

                {/* Placeholder option */}
                <button
                  onClick={() => setSelectedType('placeholder')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedType === 'placeholder'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📌</span>
                    <div>
                      <p className="font-semibold text-gray-800">Placeholder Pin</p>
                      <p className="text-sm text-gray-600">
                        Just mark this location as a waypoint
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Additional inputs based on selected type */}
            {selectedType === 'snap' && (
              <div className="space-y-3 mb-6 p-4 bg-purple-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-3 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (optional)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {selectedType === 'future-post' && (
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pin Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Visit this cafe, Explore this beach"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {selectedType === 'placeholder' && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waypoint Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Rest stop, Photo spot"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Selected post confirmation */}
            {selectedPost && selectedType === 'post' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Selected Post:</p>
                <div className="flex items-center space-x-3">
                  {(selectedPost.image || selectedPost.postImageLink) && (
                    <img
                      src={selectedPost.image || selectedPost.postImageLink}
                      alt={selectedPost.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{selectedPost.title || selectedPost.postTitle || 'Untitled Post'}</p>
                    <p className="text-xs text-gray-600">
                      {selectedPost.lattitude && selectedPost.longitude
                        ? `${selectedPost.lattitude.toFixed(4)}, ${selectedPost.longitude.toFixed(4)}`
                        : 'Location not available'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedType || (selectedType === 'post' && !selectedPost)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedType && (selectedType !== 'post' || selectedPost)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedPost && selectedType === 'post' ? '✓ Add Post to Journey' : 'Add Pin'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


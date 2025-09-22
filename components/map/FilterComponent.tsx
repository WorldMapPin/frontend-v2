'use client';

import React, { useEffect, useState } from 'react';
import { SearchParams } from '../../types';

interface FilterComponentProps {
  onFilter: (filterData: FilterData | null) => void;
  searchParams?: SearchParams;
  onTagChange?: (tags: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface FilterData {
  tags: string[];
  username: string;
  postTitle: string;
  permlink: string;
  startDate: string;
  endDate: string;
  isCurated: boolean;
}

const FilterComponent: React.FC<FilterComponentProps> = ({ 
  onFilter, 
  searchParams, 
  onTagChange,
  isVisible,
  onClose 
}) => {
  const [tags, setTags] = useState(searchParams?.tags?.join(', ') || '');
  const [username, setUsername] = useState(searchParams?.author || '');
  const [postTitle, setPostTitle] = useState(searchParams?.post_title || '');
  const [permlink, setPermlink] = useState(searchParams?.permlink || '');
  const [isCurated, setIsCurated] = useState(searchParams?.curated_only || false);
  const [isFirstRender, setIsFirstRender] = useState(false);

  // Update form when searchParams change
  useEffect(() => {
    setTags(searchParams?.tags?.join(', ') || '');
    setUsername(searchParams?.author || '');
    setPostTitle(searchParams?.post_title || '');
    setPermlink(searchParams?.permlink || '');
    setIsCurated(searchParams?.curated_only || false);
  }, [searchParams]);

  // Determine the initial selected range based on searchParams
  const getInitialRange = () => {
    if (!searchParams?.start_date || !searchParams?.end_date) {
      if (searchParams?.author) {
        return 'alltime';
      }
      return 'alltime'; // Default value
    }

    const startDate = new Date(searchParams.start_date);
    const endDate = new Date(searchParams.end_date);

    // Calculate the time difference in days
    const daysDifference = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    if (daysDifference <= 8) {
      return 'lastWeek';
    } else if (daysDifference <= 32) {
      return 'lastMonth';
    } else if (daysDifference <= 366) {
      return 'lastYear';
    } else if (daysDifference <= 1100) {
      return 'lastThreeYears';
    }

    return 'alltime'; // If the dates do not match any predefined ranges
  };

  const [selectedRange, setSelectedRange] = useState(getInitialRange());

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      applyFilter();
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTags = e.target.value;
    setTags(newTags);
    
    // Check for Easter Egg trigger
    if (onTagChange) {
      onTagChange(newTags);
    }
    
    // Check for GrazAndSeek and close filter
    checkForGrazAndSeek(newTags);
  };
  
  // Check for GrazAndSeek and close filter
  const checkForGrazAndSeek = (text: string) => {
    if (text && (text.toLowerCase().includes('grazandseek') || text.toLowerCase().includes('#grazandseek'))) {
      console.log('GrazAndSeek detected, closing filter');
      onClose();
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // Check for GrazAndSeek and close filter
    checkForGrazAndSeek(newUsername);
  };
  
  const handlePostTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPostTitle = e.target.value;
    setPostTitle(newPostTitle);
    
    // Check for GrazAndSeek and close filter
    checkForGrazAndSeek(newPostTitle);
  };

  const calculateDates = (range: string) => {
    console.log("Range: " + range);
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case 'alltime':
        startDate = new Date(0);
        break;
      case 'lastWeek':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'lastMonth':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'lastYear':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'lastThreeYears':
        startDate.setFullYear(endDate.getFullYear() - 3);
        break;
      default:
        break;
    }

    return { startDate, endDate };
  };

  const applyFilter = () => {
    // Remove @ symbol if present, as the API expects usernames without @
    const formattedUsername = username.startsWith('@') ? username.slice(1) : username;
    let dates = calculateDates(selectedRange);

    onFilter({
      tags: tags?.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      username: formattedUsername,
      postTitle,
      permlink,
      startDate: dates.startDate.toISOString(),
      endDate: dates.endDate.toISOString(),
      isCurated
    });
  };

  const clearFilter = () => {
    setTags('');
    setUsername('');
    setPostTitle('');
    setPermlink('');
    setIsCurated(false);
    setSelectedRange('alltime');
    onFilter(null);
  };

  const handleRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const range = event.target.value;
    setSelectedRange(range);
  };

  useEffect(() => {
    // Ensure there's a valid range before applying the filter
    if (!isFirstRender) {
      //applyFilter();
    } else {
      setIsFirstRender(false);
    }
  }, [selectedRange, isCurated]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto filter-component-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Filter Posts</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Form */}
        <div className="p-6 space-y-6">
          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags:
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={handleTagsChange}
              onKeyDown={handleKeyPress}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleKeyPress}
              placeholder="@username (optional @ symbol)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500">You can include or omit the @ symbol</p>
          </div>
          
          {/* Post Title */}
          <div className="space-y-2">
            <label htmlFor="postTitle" className="block text-sm font-medium text-gray-700">
              Post Title:
            </label>
            <input
              type="text"
              id="postTitle"
              value={postTitle}
              onChange={handlePostTitleChange}
              onKeyDown={handleKeyPress}
              placeholder="Search in post titles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            />
          </div>

          {/* Permlink */}
          <div className="space-y-2">
            <label htmlFor="permlink" className="block text-sm font-medium text-gray-700">
              Permlink:
            </label>
            <input
              type="text"
              id="permlink"
              value={permlink}
              onChange={(e) => setPermlink(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="post-name (will create /map/p/post-name)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500">Enter just the post name, e.g., "my-awesome-post"</p>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
              Date Range:
            </label>
            <select 
              value={selectedRange} 
              onChange={handleRangeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            >
              <option value="alltime">All Time</option>
              <option value="lastWeek">Last Week</option>
              <option value="lastMonth">Last Month</option>
              <option value="lastYear">Last Year</option>
              <option value="lastThreeYears">Last Three Years</option>
            </select>
          </div>

          {/* Curated Switch */}
          <div className="flex items-center justify-between">
            <label htmlFor="isCurated" className="text-sm font-medium text-gray-700">
              WorldMapPin Curated:
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isCurated"
                checked={isCurated}
                onChange={(e) => setIsCurated(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={clearFilter}
            className="flex-1 px-6 py-4 text-gray-600 hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Clear
          </button>
          <button
            onClick={applyFilter}
            className="flex-1 px-6 py-4 bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200 font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterComponent;

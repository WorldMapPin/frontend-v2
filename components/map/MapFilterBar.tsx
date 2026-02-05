'use client';

import React, { useState, useEffect } from 'react';
import {
    Filter,
    ChevronUp,
    ChevronDown,
    Calendar,
    User,
    Tag,
    X,
    Code,
    Users,
    Map as MapIcon,
    Plus,
    Minus,
    Search,
    Layers
} from 'lucide-react';
import { SearchParams } from '@/types';

interface MapFilterBarProps {
    onFilter: (params: any) => void;
    searchParams: SearchParams;
    onToggleJourneys: () => void;
    showJourneys: boolean;
    onToggleCodeMode: () => void;
    isCodeMode: boolean;
    onOpenCommunitySelector: () => void;
    selectedCommunityName: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onToggleMapType: () => void;
    mapTypeId: string;
}

export default function MapFilterBar({
    onFilter,
    searchParams,
    onToggleJourneys,
    showJourneys,
    onToggleCodeMode,
    isCodeMode,
    onOpenCommunitySelector,
    selectedCommunityName,
    onZoomIn,
    onZoomOut,
    onToggleMapType,
    mapTypeId
}: MapFilterBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'filters' | 'community'>('filters');

    // Internal state for form
    const [username, setUsername] = useState(searchParams.author || '');
    const [tags, setTags] = useState(searchParams.tags?.join(', ') || '');
    const [postTitle, setPostTitle] = useState(searchParams.post_title || '');
    const [startDate, setStartDate] = useState(searchParams.start_date || '');
    const [endDate, setEndDate] = useState(searchParams.end_date || '');

    // Sync internal state with searchParams prop changes
    useEffect(() => {
        setUsername(searchParams.author || '');
        setTags(searchParams.tags?.join(', ') || '');
        setPostTitle(searchParams.post_title || '');
        setStartDate(searchParams.start_date || '');
        setEndDate(searchParams.end_date || '');
    }, [searchParams]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilter({
            username: username.replace('@', '').trim(),
            tags: tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== ''),
            postTitle: postTitle.trim(),
            startDate: startDate,
            endDate: endDate
        });
        setIsExpanded(false);
    };

    const handlePresetDate = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    const clearFilters = () => {
        setUsername('');
        setTags('');
        setPostTitle('');
        setStartDate('');
        setEndDate('');
        onFilter(null);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto z-50 flex flex-col items-end px-4 sm:px-0">
            {/* Top row with action buttons */}
            <div className="flex items-center space-x-3 mb-4 w-full sm:w-auto justify-center sm:justify-end">
                {/* Get Code Button */}
                <button
                    onClick={onToggleCodeMode}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all ${isCodeMode
                        ? 'bg-[#ED6D28] text-white ring-4 ring-orange-500/20'
                        : 'bg-white dark:bg-[#161616] text-gray-700 dark:text-[#c9b8a8] hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    title={isCodeMode ? 'Exit Code' : 'Get Code'}
                >
                    <Code className="w-5 h-5" />
                </button>

                {/* Journeys Toggle */}
                <button
                    onClick={onToggleJourneys}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all ${showJourneys
                        ? 'bg-[#ED6D28] text-white'
                        : 'bg-white dark:bg-[#161616] text-gray-700 dark:text-[#c9b8a8] hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    title="Journeys"
                >
                    <MapIcon className="w-5 h-5" />
                </button>

                {/* Map Type Toggle - Yellow Circle */}
                <button
                    onClick={onToggleMapType}
                    className="w-11 h-11 bg-[#FFD700] rounded-full flex items-center justify-center shadow-xl border-2 border-white dark:border-[#161616] hover:scale-105 active:scale-95 transition-all"
                    title="Toggle Terrain/Satellite"
                >
                    <Layers className="w-5 h-5 text-white" />
                </button>

                {/* Zoom Capsule */}
                <div className="bg-white dark:bg-[#161616] rounded-full h-11 flex items-center shadow-xl px-1 border border-gray-100 dark:border-white/5">
                    <button
                        onClick={onZoomOut}
                        className="w-9 h-9 flex items-center justify-center text-[#ADB5BD] hover:text-[#ED6D28] transition-colors"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                    <div className="px-2">
                        <Search className="w-4 h-4 text-[#ADB5BD] stroke-[3]" />
                    </div>
                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                    <button
                        onClick={onZoomIn}
                        className="w-9 h-9 flex items-center justify-center text-[#ADB5BD] hover:text-[#ED6D28] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filter Bar Card - Width adjusted to match buttons */}
            <div className={`bg-white dark:bg-[#161616] rounded-t-[20px] sm:rounded-[16px] shadow-2xl overflow-hidden transition-all duration-300 w-full sm:w-[340px]`}>
                {/* Header */}
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                            <Filter className="w-5 h-5 text-[#ED6D28]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-[#f5e6d3] text-sm font-lexend">Map Filters</h3>
                            <p className="text-[10px] text-gray-500 dark:text-[#c9b8a8] font-bold uppercase tracking-wider">
                                {isExpanded ? 'Collapse filters' : `Showing ${selectedCommunityName}`}
                            </p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 dark:bg-[#2d2d2d] p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setActiveTab('filters')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'filters' ? 'bg-white dark:bg-[#161616] shadow-sm text-[#ED6D28]' : 'text-gray-500 dark:text-[#c9b8a8] hover:text-gray-700 dark:hover:text-[#f5e6d3]'}`}
                            >
                                Search Pins
                            </button>
                            <button
                                onClick={() => setActiveTab('community')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'community' ? 'bg-white dark:bg-[#161616] shadow-sm text-[#ED6D28]' : 'text-gray-500 dark:text-[#c9b8a8] hover:text-gray-700 dark:hover:text-[#f5e6d3]'}`}
                            >
                                Community
                            </button>
                        </div>

                        {activeTab === 'filters' ? (
                            <form onSubmit={handleFilterSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Enter Hive username..."
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-[#F3F4F6] dark:bg-[#2d2d2d] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium text-gray-700 dark:text-[#f5e6d3] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tags</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Travel, foodie, etc..."
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full bg-[#F3F4F6] dark:bg-[#2d2d2d] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium text-gray-700 dark:text-[#f5e6d3] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Post Title</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Keywords in title..."
                                            value={postTitle}
                                            onChange={(e) => setPostTitle(e.target.value)}
                                            className="w-full bg-[#F3F4F6] dark:bg-[#2d2d2d] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium text-gray-700 dark:text-[#f5e6d3] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date Range</label>

                                    {/* Presets - Dropdown */}
                                    <div className="relative mb-2">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handlePresetDate(parseInt(e.target.value));
                                                }
                                            }}
                                            className="w-full bg-[#F3F4F6] dark:bg-[#2d2d2d] border-none rounded-xl px-4 py-2 text-[11px] font-bold text-gray-600 dark:text-[#c9b8a8] focus:ring-2 focus:ring-[#ED6D28]/20 transition-all appearance-none cursor-pointer"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Quick Select Range...</option>
                                            <option value="1">Today</option>
                                            <option value="7">Last Week</option>
                                            <option value="30">Last Month</option>
                                            <option value="365">Last Year</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-[#F3F4F6] dark:bg-[#2d2d2d] border-none rounded-xl pl-10 pr-2 py-2 text-[11px] focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium text-gray-700 dark:text-[#f5e6d3]"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-[#F3F4F6] dark:bg-[#2d2d2d] border-none rounded-xl pl-10 pr-2 py-2 text-[11px] focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium text-gray-700 dark:text-[#f5e6d3]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center space-x-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#ED6D28] hover:bg-[#D95D20] text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                    >
                                        Apply Filters
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="w-11 h-11 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-gray-500 dark:text-[#c9b8a8] rounded-xl flex items-center justify-center transition-all active:scale-95"
                                        title="Clear all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div
                                    onClick={onOpenCommunitySelector}
                                    className="p-4 bg-orange-50/50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-500/20 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-white dark:bg-[#2d2d2d] rounded-xl flex items-center justify-center shadow-sm">
                                                <Users className="w-5 h-5 text-[#ED6D28]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#ED6D28] uppercase tracking-widest leading-none">Selected Region</p>
                                                <h4 className="font-bold text-gray-900 dark:text-[#f5e6d3] mt-1">{selectedCommunityName}</h4>
                                            </div>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-[#ED6D28] group-hover:translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium px-1 text-center italic">
                                    Switch communities to discover pins from specific curators and regions.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

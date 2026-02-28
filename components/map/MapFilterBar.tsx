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
    onReloadPins: () => void;
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
    mapTypeId,
    onReloadPins
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
                        : 'hover:opacity-80'
                        }`}
                    style={!isCodeMode ? {
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-secondary)'
                    } : undefined}
                    title={isCodeMode ? 'Exit Code' : 'Get Code'}
                >
                    <Code className="w-5 h-5" />
                </button>

                {/* Journeys Toggle */}
                <button
                    onClick={onToggleJourneys}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all ${showJourneys
                        ? 'bg-[#ED6D28] text-white'
                        : 'hover:opacity-80'
                        }`}
                    style={!showJourneys ? {
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-secondary)'
                    } : undefined}
                    title="Journeys"
                >
                    <MapIcon className="w-5 h-5" />
                </button>

                {/* Map Type Toggle - Yellow Circle */}
                <button
                    onClick={onToggleMapType}
                    className="w-11 h-11 bg-[#FFD700] rounded-full flex items-center justify-center shadow-xl border-2 hover:scale-105 active:scale-95 transition-all"
                    style={{ borderColor: 'var(--card-bg)' }}
                    title="Toggle Terrain/Satellite"
                >
                    <Layers className="w-5 h-5 text-white" />
                </button>

                {/* Reload Pins Button */}
                <button
                    onClick={onReloadPins}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl border hover:scale-105 active:scale-95 transition-all"
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)'
                    }}
                    title="Reload Pins"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>

                {/* Zoom Capsule */}
                <div className="rounded-full h-11 flex items-center shadow-xl px-1 border"
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-subtle)'
                    }}>
                    <button
                        onClick={onZoomOut}
                        className="w-9 h-9 flex items-center justify-center hover:text-[#ED6D28] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 mx-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                    <div className="px-2">
                        <Search className="w-4 h-4 stroke-[3]" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="w-[1px] h-4 mx-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                    <button
                        onClick={onZoomIn}
                        className="w-9 h-9 flex items-center justify-center hover:text-[#ED6D28] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filter Bar Card - Width adjusted to match buttons */}
            <div className="rounded-t-[20px] sm:rounded-[16px] shadow-2xl overflow-hidden transition-all duration-300 w-full sm:w-[340px]"
                style={{ backgroundColor: 'var(--card-bg)' }}>
                {/* Header */}
                <div
                    className="p-4 flex items-center justify-between cursor-pointer transition-colors hover:opacity-90"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--section-bg)' }}>
                            <Filter className="w-5 h-5 text-[#ED6D28]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm font-lexend" style={{ color: 'var(--text-primary)' }}>Map Filters</h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {isExpanded ? 'Collapse filters' : `Showing ${selectedCommunityName}`}
                            </p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> : <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Tabs */}
                        <div className="flex p-1 rounded-xl mb-6" style={{ backgroundColor: 'var(--section-bg)' }}>
                            <button
                                onClick={() => setActiveTab('filters')}
                                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={activeTab === 'filters' ? {
                                    backgroundColor: 'var(--card-bg)',
                                    color: '#ED6D28',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                } : {
                                    color: 'var(--text-muted)'
                                }}
                            >
                                Search Pins
                            </button>
                            <button
                                onClick={() => setActiveTab('community')}
                                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={activeTab === 'community' ? {
                                    backgroundColor: 'var(--card-bg)',
                                    color: '#ED6D28',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                } : {
                                    color: 'var(--text-muted)'
                                }}
                            >
                                Community
                            </button>
                        </div>

                        {activeTab === 'filters' ? (
                            <form onSubmit={handleFilterSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Enter Hive username..."
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium"
                                            style={{
                                                backgroundColor: 'var(--section-bg)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Tags</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Travel, foodie, etc..."
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium"
                                            style={{
                                                backgroundColor: 'var(--section-bg)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Post Title</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Keywords in title..."
                                            value={postTitle}
                                            onChange={(e) => setPostTitle(e.target.value)}
                                            className="w-full border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium"
                                            style={{
                                                backgroundColor: 'var(--section-bg)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Date Range</label>

                                    {/* Presets - Dropdown */}
                                    <div className="relative mb-2">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handlePresetDate(parseInt(e.target.value));
                                                }
                                            }}
                                            className="w-full border-none rounded-xl px-4 py-2 text-[11px] font-bold focus:ring-2 focus:ring-[#ED6D28]/20 transition-all appearance-none cursor-pointer"
                                            style={{
                                                backgroundColor: 'var(--section-bg)',
                                                color: 'var(--text-secondary)'
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Quick Select Range...</option>
                                            <option value="1">Today</option>
                                            <option value="7">Last Week</option>
                                            <option value="30">Last Month</option>
                                            <option value="365">Last Year</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full border-none rounded-xl pl-10 pr-2 py-2 text-[11px] focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium"
                                                style={{
                                                    backgroundColor: 'var(--section-bg)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full border-none rounded-xl pl-10 pr-2 py-2 text-[11px] focus:ring-2 focus:ring-[#ED6D28]/20 transition-all font-medium"
                                                style={{
                                                    backgroundColor: 'var(--section-bg)',
                                                    color: 'var(--text-primary)'
                                                }}
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
                                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                        style={{
                                            backgroundColor: 'var(--section-bg)',
                                            color: 'var(--text-muted)'
                                        }}
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
                                    className="p-4 border rounded-2xl cursor-pointer transition-all group"
                                    style={{
                                        backgroundColor: 'var(--section-bg)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                                style={{ backgroundColor: 'var(--card-bg)' }}>
                                                <Users className="w-5 h-5 text-[#ED6D28]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#ED6D28] uppercase tracking-widest leading-none">Selected Region</p>
                                                <h4 className="font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{selectedCommunityName}</h4>
                                            </div>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-[#ED6D28] group-hover:translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-medium px-1 text-center italic" style={{ color: 'var(--text-muted)' }}>
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

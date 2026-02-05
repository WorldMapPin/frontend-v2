'use client';

import React, { useState, useEffect } from 'react';
import { Copy, MapPin, Hash, Check, X } from 'lucide-react';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';

interface CodeModeInterfaceProps {
    codeModeMarker: { lat: number; lng: number } | null;
    onBack: () => void;
    isFullCodeMode: boolean;
}

export const CodeModeInterface: React.FC<CodeModeInterfaceProps> = ({
    codeModeMarker,
    onBack,
    isFullCodeMode
}) => {
    const { user } = useAiohaSafe();
    const [copied, setCopied] = useState(false);
    const [mount, setMount] = useState(false);

    useEffect(() => {
        setMount(true);
    }, []);

    const getLocationCode = () => {
        if (!codeModeMarker) return '';
        return `${codeModeMarker.lat.toFixed(6)},${codeModeMarker.lng.toFixed(6)}`;
    };

    const handleCopy = () => {
        const code = getLocationCode();
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!mount) return null;

    return (
        <div className="absolute inset-x-0 bottom-32 sm:bottom-28 z-[60] flex flex-col items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-[340px] bg-white dark:bg-[#161616] rounded-[20px] shadow-2xl overflow-hidden pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                {/* Header Section */}
                <div className="bg-[#E9ECEF] dark:bg-[#2d2d2d] p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
                    <div className="flex items-center space-x-2 text-[#495057] dark:text-[#c9b8a8]">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#161616] flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-sm">
                            <Hash className="w-4 h-4 text-[#ED6D28]" strokeWidth={3} />
                        </div>
                        <span className="font-bold text-sm tracking-wide font-lexend">Location Details</span>
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-400 opacity-70 tracking-wider ml-1">Current Coordinates</label>
                        <div className="bg-[#CED4DA]/50 dark:bg-white/5 rounded-xl p-3 flex items-center space-x-3 border border-gray-200/50 dark:border-white/5">
                            <div className="w-2 h-2 rounded-full bg-[#ED6D28] animate-pulse" />
                            <span className="font-mono text-sm text-gray-600 dark:text-[#f5e6d3] font-bold tracking-tight">
                                {codeModeMarker ? `${codeModeMarker.lat.toFixed(5)}, ${codeModeMarker.lng.toFixed(5)}` : 'Click on map to select'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Section with Gradient */}
                <div className="p-1 px-1 pb-1">
                    <div className="rounded-[16px] bg-gradient-to-br from-[#ED6D28] via-[#F48041] to-[#FFA97B] p-5 flex items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-orange-200">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ED6D28]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest leading-none">Code Ready</span>
                                <span className="text-sm font-bold text-white mt-1 leading-none">Tap to copy code</span>
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${copied ? 'bg-green-400 text-white' : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'}`}
                        >
                            {copied ? <Check className="w-5 h-5" strokeWidth={3} /> : <Copy className="w-5 h-5 flex-shrink-0" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack}
                className="mt-6 pointer-events-auto bg-[#343A40] text-[#CED4DA] w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:bg-[#212529] hover:text-white transition-all transform hover:scale-105 border border-white/10 group"
                title="Close Interface"
            >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
        </div>
    );
};

export default CodeModeInterface;

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PEAKD_PROFILE_BASE_URL } from '@/data/team';
import { ExternalLink } from 'lucide-react';

interface TeamMemberProps {
  id: string;
  name: string;
  username: string;
  role: string;
  category: string[];
  image?: string;
}

export const TeamMemberCard: React.FC<TeamMemberProps> = ({
  id,
  name,
  username,
  role,
  category,
  image
}) => {
  const [imageError, setImageError] = useState(false);
  const profileUrl = `${PEAKD_PROFILE_BASE_URL}${username.replace('@', '')}`;

  return (
    <Link href={profileUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
      <div 
        className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 relative h-full flex flex-col font-lexend"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          boxShadow: '0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Image Section */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
          {image && !imageError ? (
            <Image
              src={image}
              alt={`${name} - ${role}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full relative">
               <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F47521&color=fff&size=400`}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* External Link Icon */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
             <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
               <ExternalLink size={14} />
             </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1 transition-colors group-hover:text-orange-500" style={{ color: 'var(--text-primary)' }}>
              {name}
            </h3>
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {username}
            </p>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-orange-600 line-clamp-2">
              {role}
            </p>
          </div>

          {/* Categories/Tags */}
          <div className="mt-auto pt-3 sm:pt-4 border-t border-[var(--border-subtle)] flex flex-wrap gap-1.5">
            {category.map((cat, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: 'var(--hover-bg)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
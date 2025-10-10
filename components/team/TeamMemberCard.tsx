'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

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
  const isLeadershipTeam = id === '1' || id === '2' || id === '3';
  return (
    <div className="space-y-3 w-full max-w-[360px] mx-auto">
      <div className="relative bg-white rounded-2xl overflow-hidden">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden relative">
          {image && !imageError ? (
            <Image
              src={image}
              alt={`${name} - ${role}`}
              fill
              className="object-cover transition-opacity duration-300"
              onError={() => setImageError(true)}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F47521&color=fff&size=400`}
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Member Info */}
      <div className={`${isLeadershipTeam ? 'bg-[#ED6D2847]' : 'bg-[rgba(237,168,40,0.28)]'} p-4 rounded-b-2xl relative`}>
        {/* Top Right Arrow */}
        <div className="absolute top-3 right-3">
          <ChevronRight className="w-5 h-5 text-black transform rotate-[-45deg]" />
        </div>
        <h3 className="font-lexend text-[20px] font-bold leading-[100%] tracking-[-0.02em] text-[#45220B] mb-1">{name}</h3>
        <p className="font-lexend text-sm font-normal leading-[100%] tracking-[-0.02em] text-[#592102] mb-2">{username}</p>
        <p className="var(--font-poppins) text-sm italic font-normal leading-[100%] tracking-[-0.01em] text-[#592102]">{role}</p>
      </div>
    </div>
  );
};

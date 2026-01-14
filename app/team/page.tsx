'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CategoryFilter } from '@/components/team/CategoryFilter';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { teamMembers, categories } from '@/data/team';

export default function TeamPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredMembers = selectedCategory === 'All'
    ? teamMembers
    : teamMembers.filter(member => member.category.includes(selectedCategory));

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Hero Section */}
        <div className="rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-12 relative" style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)' }}>
          <Image
            src="/globe.svg"
            alt="Globe"
            width={300}
            height={300}
            className="absolute opacity-10 top-1/2 left-0 -translate-y-1/2 -translate-x-1/4"
          />
           <Image
            src="/location_pin.svg"
            alt="Location Pin"
            width={300}
            height={300}
             className="absolute opacity-10 bottom-0 right-0 translate-y-1/4 translate-x-1/4"
          />

          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-5 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10 px-6 sm:px-12 py-10 sm:py-16 text-center">
             <p className="font-lexend text-white text-sm sm:text-base font-bold mb-3 uppercase tracking-wider opacity-90">Our Team</p>
            <h1 className="font-lexend text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight">
              The People Behind<br />
              <span className="opacity-90">WorldMapPin</span>
            </h1>
            <p className="font-lexend text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-white/90 font-medium leading-relaxed">
              A diverse community of innovators, creators, and problem-solvers working together to build amazing experiences.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="space-y-8">
           <div className="text-center mb-8">
              <h2 className="font-lexend text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Meet the <span className="text-orange-500">Team</span>
              </h2>
           </div>

          {/* Category Filter */}
          <div className="flex justify-center mb-8">
             <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
             />
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-5 w-full">
            {filteredMembers.map((member) => (
              <TeamMemberCard key={member.id} {...member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

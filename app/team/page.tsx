'use client';

import React, { useState } from 'react';
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
      {/* Hero Section */}
      <section className="bg-[linear-gradient(92.88deg,_#ED6D28_1.84%,_#FFA600_100%)] py-8 sm:py-12 lg:py-16 relative overflow-hidden border-[2px] border-[#5E210040] rounded-2xl sm:rounded-3xl mx-2 sm:mx-4 min-h-[300px] sm:min-h-[400px] lg:min-h-[488px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute left-4 sm:left-6 lg:left-8 top-4 sm:top-6 lg:top-8">
            <img src="/globe.svg" alt="Globe" className="w-24 sm:w-32 lg:w-44 h-24 sm:h-32 lg:h-44 opacity-20" />
          </div>
          <div className="absolute right-4 sm:right-6 lg:right-8 bottom-4 sm:bottom-6 lg:bottom-8">
            <img src="/location_pin.svg" alt="Location Pin" className="w-24 sm:w-32 lg:w-44 h-24 sm:h-32 lg:h-44 opacity-20" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto text-center px-3 sm:px-4 lg:px-6 relative z-10">
          <p className="font-lexend text-white text-sm sm:text-base font-bold mb-2 sm:mb-3 lg:mb-4">Our Team</p>
          <h1 className="font-lexend text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-5 lg:mb-6 leading-tight" style={{ background: 'linear-gradient(95.13deg, #FFFFFF 63.62%, #FFCFB5 78.99%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            The People Behind<br />WorldMapPin
          </h1>
          <p className="font-lexend text-white text-lg sm:text-2xl lg:text-3xl max-w-xl sm:max-w-2xl mx-auto leading-snug sm:leading-normal">
            A diverse community of innovators, creators, and problem-solvers working together to build amazing experiences
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 team-section-bg">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-lexend text-3xl sm:text-4xl font-semibold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
            Meet the <span className="text-[#F47521]">Team</span>
          </h2>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 w-full">
            {filteredMembers.map((member) => (
              <TeamMemberCard key={member.id} {...member} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
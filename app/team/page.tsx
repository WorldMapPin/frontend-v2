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
    <div className="min-h-screen">
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
          <p className="text-white text-sm sm:text-base font-bold mb-2 sm:mb-3 lg:mb-4">Our Team</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 lg:mb-6 leading-tight">
            The People Behind<br />WorldMapPin
          </h1>
          <p className="text-white text-lg sm:text-2xl lg:text-3xl max-w-xl sm:max-w-2xl mx-auto leading-snug sm:leading-normal">
            A diverse community of innovators, creators, and problem-solvers working together to build amazing experiences
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-[linear-gradient(180deg,_#FFFFFF_0%,_#FFF3DC_20.67%,_#FFF3DC_94.23%,_#FFFFFF_100%)]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Meet the <span className="text-[#F47521]">Team</span>
          </h2>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Team Grid */}
          <div className="flex flex-col gap-12 sm:gap-16">
            {/* Row 1 - 3 members (Management & Leadership) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
              {filteredMembers.slice(0, 3).map((member) => (
                <TeamMemberCard key={member.id} {...member} />
              ))}
            </div>

            {/* Row 2 - 3 members (Core Development) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
              {filteredMembers.slice(3, 6).map((member) => (
                <TeamMemberCard key={member.id} {...member} />
              ))}
            </div>

            {/* Row 3 - 3 members (Design & Testing) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
              {filteredMembers.slice(6, 9).map((member) => (
                <TeamMemberCard key={member.id} {...member} />
              ))}
            </div>

            {/* Row 4 - 3 members (Communication & Community) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
              {filteredMembers.slice(9, 12).map((member) => (
                <TeamMemberCard key={member.id} {...member} />
              ))}
            </div>

            {/* Row 5 - 3 members (Curation Team) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
              {filteredMembers.slice(12, 15).map((member) => (
                <TeamMemberCard key={member.id} {...member} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Team - WorldMapPin",
  description: "Meet the passionate team behind WorldMapPin. Learn about the developers, designers, and travel enthusiasts building the future of decentralized travel communities.",
};

// TypeScript interface for team member data structure
interface TeamMember {
  id: string;
  username: string;
  description: string;
  profileImage: string;
  profileImageAlt: string;
}

// Sample team member data (6 members with profile info)
const teamMembers: TeamMember[] = [
  {
    id: "1",
    username: "Alex Chen",
    description: "Full-stack developer and blockchain enthusiast. Passionate about creating decentralized solutions for travel communities.",
    profileImage: "/images/team/alex-chen.jpg",
    profileImageAlt: "Alex Chen - Full-stack Developer"
  },
  {
    id: "2",
    username: "Sarah Martinez",
    description: "UX/UI Designer with a love for travel. Focuses on creating intuitive experiences that connect travelers worldwide.",
    profileImage: "/images/team/sarah-martinez.jpg",
    profileImageAlt: "Sarah Martinez - UX/UI Designer"
  },
  {
    id: "3",
    username: "David Kim",
    description: "Blockchain architect and travel blogger. Specializes in Hive blockchain integration and smart contract development.",
    profileImage: "/images/team/david-kim.jpg",
    profileImageAlt: "David Kim - Blockchain Architect"
  },
  {
    id: "4",
    username: "Emma Thompson",
    description: "Community manager and digital nomad. Builds bridges between travelers and helps grow our global community.",
    profileImage: "/images/team/emma-thompson.jpg",
    profileImageAlt: "Emma Thompson - Community Manager"
  },
  {
    id: "5",
    username: "Marco Rodriguez",
    description: "Backend engineer and adventure photographer. Develops scalable systems for handling travel content and media.",
    profileImage: "/images/team/marco-rodriguez.jpg",
    profileImageAlt: "Marco Rodriguez - Backend Engineer"
  },
  {
    id: "6",
    username: "Lisa Wang",
    description: "Product manager and sustainable travel advocate. Guides product strategy to promote responsible tourism practices.",
    profileImage: "/images/team/lisa-wang.jpg",
    profileImageAlt: "Lisa Wang - Product Manager"
  }
];

// Team Member Card Component
interface TeamMemberCardProps {
  member: TeamMember;
}

function TeamMemberCard({ member }: TeamMemberCardProps) {
  // Generate placeholder image URL using UI Avatars service
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username)}&size=120&background=f59e0b&color=ffffff&bold=true&format=png`;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 px-6 py-16 text-center group">
      <div className="relative w-30 h-30 mx-auto mb-4">
        <Image
          src={placeholderImage}
          alt={member.profileImageAlt}
          width={120}
          height={120}
          className="rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
          priority={false}
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-200">
        {member.username}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        {member.description}
      </p>
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Meet Our Team
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Get to know the passionate individuals behind WorldMapPin who are dedicated to building the future of decentralized travel communities.
            </p>
          </div>
        </div>
      </section>

      {/* Team Grid Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Responsive grid layout (1/2/3/4 columns based on screen size) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-8">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
'use client';

import React from 'react';
import Image from 'next/image';

// TypeScript interfaces for hero content props
export interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary';
  external?: boolean;
}

export interface HeroSectionProps {
  backgroundImage?: string;
  title: string;
  subtitle: string;
  primaryCTA: CTAButton;
  secondaryCTA: CTAButton;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  backgroundImage,
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
}) => {
  const handleCTAClick = (cta: CTAButton) => {
    if (cta.external) {
      window.open(cta.href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = cta.href;
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image or Gradient Fallback */}
      <div className="absolute inset-0 z-0">
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt="Travel community background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-white to-orange-100" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Hero Headline - Responsive Typography */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl  font-bold text-white mb-6 leading-tight">
            {title}
          </h1>

          {/* Hero Subtitle - Responsive Typography */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-5xl mx-auto">
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            {/* Primary CTA Button */}
            <button
              onClick={() => handleCTAClick(primaryCTA)}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500/50"
              aria-label={primaryCTA.text}
            >
              {primaryCTA.text}
            </button>

            {/* Secondary CTA Button */}
            <button
              onClick={() => handleCTAClick(secondaryCTA)}
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg text-lg border-2 border-white/80 hover:border-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/50"
              aria-label={secondaryCTA.text}
            >
              {secondaryCTA.text}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg
            className="w-6 h-6 text-white/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
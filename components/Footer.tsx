import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lexend } from 'next/font/google'

interface FooterProps {
  className?: string
}

const lexend = Lexend({ subsets: ['latin'] })

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-white/90 ${lexend.className} ${className}`} role="contentinfo">
      <div className="max-w-none mx-auto px-2 sm:px-4 pt-12 sm:pt-20 pb-2 sm:pb-3">
        <div className="w-full rounded-2xl border-2 border-[#ED6D2899] bg-white">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 px-8 sm:px-10 pt-12 sm:pt-16 pb-12 sm:pb-16">
            {/* Left: Logo/Brand block */}
            <div className="flex-1">
              <div className="flex items-center">
                <Image
                  src="/images/logo_light.png"
                  alt="WorldMapPin"
                  width={180}
                  height={40}
                  priority
                />
              </div>
              <div className="mt-2 text-sm text-[#4b2e05]/80">
                {currentYear} WorldMapPin ©
              </div>
            </div>

            {/* Right: Link columns */}
            <div className="flex-1 w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
              <div className="flex flex-col gap-3">
                <Link
                  href="/about"
                  
                  className="block font-semibold text-[#45220B] hover:text-orange-500"
                >
                  <span className="relative inline-flex items-start gap-1">
                    <span>About</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 mt-0.5"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M9 7h8v8" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/team"
                  
                  className="block font-semibold text-[#45220B] hover:text-orange-500"
                >
                  <span className="relative inline-flex items-start gap-1">
                    <span>Team</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 mt-0.5"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M9 7h8v8" />
                    </svg>
                  </span>
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/explore"
                  suppressHydrationWarning
                  className="block font-semibold text-[#45220B] hover:text-orange-500"
                >
                  <span className="relative inline-flex items-start gap-1">
                    <span>Explore</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 mt-0.5"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M9 7h8v8" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/signup"
                  suppressHydrationWarning
                  className="block font-semibold text-[#45220B] hover:text-orange-500"
                >
                  <span className="relative inline-flex items-start gap-1">
                    <span>Community</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 mt-0.5"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M9 7h8v8" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
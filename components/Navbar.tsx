'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavbarProps {
  className?: string
}

export default function Navbar({ className = '' }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isMapPage = pathname?.startsWith('/map') ?? false
  const containerClasses = ['w-full', 'px-4', 'sm:px-6', 'lg:px-8']

  if (!isMapPage) {
    containerClasses.push('max-w-7xl', 'mx-auto')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 ${className}`}
      style={{ backgroundColor: '#FFFFFF' }}
      role="navigation"
      aria-label="Main navigation"
      suppressHydrationWarning={true}
    >
      <div className={containerClasses.join(' ')} suppressHydrationWarning={true}>
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16" suppressHydrationWarning={true}>
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-4" suppressHydrationWarning={true}>
              <Image
                src="/images/worldmappin-logo.png"
                alt="WorldMappin Logo"
                width={32}
                height={32}
                priority
                className="h-6 w-auto sm:h-8 md:h-10 transition-all duration-200"
              />
              <span
                className="text-gray-900 text-lg sm:text-xl md:text-2xl"
                style={{
                  fontFamily: 'Lexend',
                  fontWeight: 600,
                  fontStyle: 'normal',
                  lineHeight: '100%',
                  letterSpacing: '-0.03em'
                }}
              >
                World<span style={{ color: '#ED6D28' }}>Map</span>Pin
              </span>
            </Link>
          </div>

          <div className="hidden md:block flex-shrink-0" suppressHydrationWarning={true}>
            <div className="flex items-center space-x-6" suppressHydrationWarning={true}>
              {/* Dark mode toggle icon */}
              <button
                type="button"
                className="px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
                style={{ color: '#5C2609' }}
                aria-label="Toggle dark mode"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </button>
              <Link
                href="/map"
                className="px-3 py-2 rounded-md text-lg transition-colors duration-200"
                style={{
                  fontFamily: 'Lexend',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  lineHeight: '100%',
                  letterSpacing: '-0.03em',
                  color: '#5C2609'
                }}
                suppressHydrationWarning={true}
              >
                Map
              </Link>
              <Link
                href="/explore"
                className="px-3 py-2 rounded-md text-lg transition-colors duration-200"
                style={{
                  fontFamily: 'Lexend',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  lineHeight: '100%',
                  letterSpacing: '-0.03em',
                  color: '#5C2609'
                }}
                suppressHydrationWarning={true}
              >
                Explore
              </Link>
              <Link
                href="/journeys"
                className="px-3 py-2 rounded-md text-lg transition-colors duration-200"
                style={{
                  fontFamily: 'Lexend',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  lineHeight: '100%',
                  letterSpacing: '-0.03em',
                  color: '#5C2609'
                }}
                suppressHydrationWarning={true}
              >
                Journeys
              </Link>
              <Link
                href="/stats"
                className="px-3 py-2 rounded-md text-lg transition-colors duration-200"
                style={{
                  fontFamily: 'Lexend',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  lineHeight: '100%',
                  letterSpacing: '-0.03em',
                  color: '#5C2609'
                }}
                suppressHydrationWarning={true}
              >
                Stats
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
              style={{
                background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)',
                color: '#5C2609'
              }}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-200 ease-in-out ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible h-0'
          }`}
          id="mobile-menu"
          suppressHydrationWarning={true}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t" suppressHydrationWarning={true}>
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-sm"
              style={{
                fontFamily: 'Lexend',
                fontWeight: 500,
                fontStyle: 'normal',
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#5C2609'
              }}
              onClick={() => setIsMenuOpen(false)}
              suppressHydrationWarning={true}
            >
              Home
            </Link>
            <Link
              href="/map"
              className="block px-3 py-2 rounded-md text-sm"
              style={{
                fontFamily: 'Lexend',
                fontWeight: 500,
                fontStyle: 'normal',
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#5C2609'
              }}
              onClick={() => setIsMenuOpen(false)}
              suppressHydrationWarning={true}
            >
              Map
            </Link>
            <Link
              href="/explore"
              className="block px-3 py-2 rounded-md text-sm"
              style={{
                fontFamily: 'Lexend',
                fontWeight: 500,
                fontStyle: 'normal',
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#5C2609'
              }}
              onClick={() => setIsMenuOpen(false)}
              suppressHydrationWarning={true}
            >
              Explore
            </Link>
            <Link
              href="/journeys"
              className="block px-3 py-2 rounded-md text-sm"
              style={{
                fontFamily: 'Lexend',
                fontWeight: 500,
                fontStyle: 'normal',
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#5C2609'
              }}
              onClick={() => setIsMenuOpen(false)}
              suppressHydrationWarning={true}
            >
              Journeys
            </Link>
            <Link
              href="/stats"
              className="block px-3 py-2 rounded-md text-sm"
              style={{
                fontFamily: 'Lexend',
                fontWeight: 500,
                fontStyle: 'normal',
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#5C2609'
              }}
              onClick={() => setIsMenuOpen(false)}
              suppressHydrationWarning={true}
            >
              Stats
            </Link>
            <Link
              href="/roadmap"
              className="block px-3 py-2 rounded-md text-sm"
              style={{
                fontFamily: 'Lexend',
                fontWeight: 500,
                fontStyle: 'normal',
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#5C2609'
              }}
              suppressHydrationWarning={true}
            >
              Roadmap
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

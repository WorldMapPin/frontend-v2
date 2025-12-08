'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useAiohaSafe } from '@/hooks/use-aioha-safe'

interface NavbarProps {
  className?: string
}

export default function Navbar({ className = '' }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isReady, logout } = useAiohaSafe()

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])
  const isMapPage = pathname?.startsWith('/map') ?? false
  const containerClasses = ['w-full', 'px-4', 'sm:px-6', 'lg:px-8']

  if (!isMapPage) {
    containerClasses.push('max-w-7xl', 'mx-auto')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 4px 6px 0px #00000033'
      }}
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

              {/* Auth Section */}
              {isReady ? (
                user ? (
                  // User Avatar - Logged In
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center space-x-2 focus:outline-none"
                      aria-label="User menu"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 hover:border-orange-600 transition-colors">
                        <Image
                          src={`https://images.hive.blog/u/${user}/avatar`}
                          alt={`@${user}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/default-avatar.svg';
                          }}
                        />
                      </div>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                        style={{ border: '1px solid #ED6D28' }}
                      >
                        <div className="px-4 py-2 border-b" style={{ borderColor: '#ED6D28' }}>
                          <span className="text-sm font-semibold" style={{ fontFamily: 'Lexend', color: '#5C2609' }}>
                            @{user}
                          </span>
                        </div>
                        <Link
                          href={`/user/${user}`}
                          className="block px-4 py-2 text-sm hover:bg-orange-50 transition-colors"
                          style={{ fontFamily: 'Lexend', color: '#5C2609' }}
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Profile
                        </Link>
                        <Link
                          href={`/map/@${user}`}
                          className="block px-4 py-2 text-sm hover:bg-orange-50 transition-colors"
                          style={{ fontFamily: 'Lexend', color: '#5C2609' }}
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Map
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm hover:bg-orange-50 transition-colors"
                          style={{ fontFamily: 'Lexend', color: '#5C2609' }}
                          onClick={() => setShowUserMenu(false)}
                        >
                          Settings
                        </Link>
                        <hr className="my-2" style={{ borderColor: '#ED6D28' }} />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            router.push('/');
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-orange-50 transition-colors"
                          style={{ fontFamily: 'Lexend', color: '#ED6D28', fontWeight: 600 }}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Login Button - Not Logged In
                  <Link
                    href="/signup"
                    className="px-6 py-2 text-base font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105"
                    style={{
                      fontFamily: 'Lexend',
                      background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
                      color: '#FFFFFF',
                      borderRadius: '30px',
                      boxShadow: '0px 1px 7px 0px #00000040'
                    }}
                  >
                    Login
                  </Link>
                )
              ) : (
                // Loading State
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              )}
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
            {/* User Info Section - Mobile */}
            {isReady && user && (
              <div className="flex items-center space-x-3 px-3 py-3 mb-2 bg-orange-50 rounded-lg">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500">
                  <Image
                    src={`https://images.hive.blog/u/${user}/avatar`}
                    alt={`@${user}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-avatar.svg';
                    }}
                  />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'Lexend', color: '#5C2609' }}
                >
                  @{user}
                </span>
              </div>
            )}

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
              onClick={() => setIsMenuOpen(false)}
              suppressHydrationWarning={true}
            >
              Roadmap
            </Link>

            {/* Auth Section - Mobile */}
            {isReady && (
              <>
                <hr className="my-2" style={{ borderColor: '#ED6D28' }} />
                {user ? (
                  <>
                    <Link
                      href={`/user/${user}`}
                      className="block px-3 py-2 rounded-md text-sm"
                      style={{
                        fontFamily: 'Lexend',
                        fontWeight: 500,
                        color: '#5C2609'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href={`/map/@${user}`}
                      className="block px-3 py-2 rounded-md text-sm"
                      style={{
                        fontFamily: 'Lexend',
                        fontWeight: 500,
                        color: '#5C2609'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Map
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-3 py-2 rounded-md text-sm"
                      style={{
                        fontFamily: 'Lexend',
                        fontWeight: 500,
                        color: '#5C2609'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                        router.push('/');
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm"
                      style={{
                        fontFamily: 'Lexend',
                        fontWeight: 600,
                        color: '#ED6D28'
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/signup"
                    className="block mx-3 my-2 px-4 py-3 text-center text-sm font-semibold"
                    style={{
                      fontFamily: 'Lexend',
                      background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
                      color: '#FFFFFF',
                      borderRadius: '30px',
                      boxShadow: '0px 1px 7px 0px #00000040'
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

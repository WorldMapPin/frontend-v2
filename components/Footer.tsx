'use client';
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface FooterProps {
  className?: string
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isMapPage = mounted && (pathname?.startsWith('/map') ?? false)
  const currentYear = new Date().getFullYear()

  if (isMapPage) return null;

  return (
    <footer
      className={`font-lexend relative overflow-hidden transition-colors duration-300 ${className}`}
      style={{ backgroundColor: 'var(--footer-bg)', borderTop: '1px solid var(--border-color)' }}
      role="contentinfo"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 opacity-30" style={{ backgroundColor: 'var(--border-color)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -ml-32 -mb-32 opacity-20" style={{ backgroundColor: 'var(--border-color)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

          {/* Brand Section */}
          <div className="lg:col-span-6 space-y-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300" style={{ backgroundColor: 'var(--hover-bg)' }}>
                <Image
                  src="/images/worldmappin-logo.png"
                  alt="WorldMappin Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                World<span style={{ color: '#ED6D28' }}>Map</span>Pin
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
              The leading decentralized travel community. Document your journeys, share your experiences, and earn rewards on the Hive blockchain.
            </p>
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-3">
            <h3 className="font-bold mb-6 text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Explore</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/map" className="hover:text-orange-500 text-sm transition-colors flex items-center group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-orange-500 text-sm transition-colors flex items-center group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Community Stories
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-orange-500 text-sm transition-colors flex items-center group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Global Statistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div className="lg:col-span-3">
            <h3 className="font-bold mb-6 text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Community</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="hover:text-orange-500 text-sm transition-colors flex items-center group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-orange-500 text-sm transition-colors flex items-center group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  The Team
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-orange-500 text-sm transition-colors flex items-center group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Join Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>© {currentYear} WorldMapPin</span>
            <span className="hidden md:inline" style={{ color: 'var(--border-color)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>Built for Travelers, by travelers.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-orange-500 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
            <Link href="/terms" className="hover:text-orange-500 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>Terms</Link>
            <Link href="/cookies" className="hover:text-orange-500 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface FooterProps {
  className?: string
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={`bg-white border-t border-orange-100 font-lexend relative overflow-hidden ${className}`}
      role="contentinfo"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/30 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50/20 rounded-full blur-3xl -ml-32 -mb-32" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

          {/* Brand Section */}
          <div className="lg:col-span-6 space-y-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-orange-50 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Image
                  src="/images/worldmappin-logo.png"
                  alt="WorldMappin Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              </div>
              <span className="text-gray-900 text-2xl font-bold tracking-tight">
                World<span style={{ color: '#ED6D28' }}>Map</span>Pin
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md">
              The leading decentralized travel community. Document your journeys, share your experiences, and earn rewards on the Hive blockchain.
            </p>
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-3">
            <h3 className="text-gray-900 font-bold mb-6 text-sm uppercase tracking-wider">Explore</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/map" className="text-gray-500 hover:text-orange-500 text-sm transition-colors flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-gray-500 hover:text-orange-500 text-sm transition-colors flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Community Stories
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-gray-500 hover:text-orange-500 text-sm transition-colors flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Global Statistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div className="lg:col-span-3">
            <h3 className="text-gray-900 font-bold mb-6 text-sm uppercase tracking-wider">Community</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-gray-500 hover:text-orange-500 text-sm transition-colors flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-gray-500 hover:text-orange-500 text-sm transition-colors flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  The Team
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-500 hover:text-orange-500 text-sm transition-colors flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Join Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-400 text-xs font-medium">
            <span>© {currentYear} WorldMapPin</span>
            <span className="hidden md:inline text-gray-200">|</span>
            <span className="text-gray-300">Built for Travelers, by travelers.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-gray-400 hover:text-orange-600 text-[11px] font-bold uppercase tracking-widest transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-orange-600 text-[11px] font-bold uppercase tracking-widest transition-colors">Terms</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-orange-600 text-[11px] font-bold uppercase tracking-widest transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

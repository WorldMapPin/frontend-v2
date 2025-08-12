import React from 'react'
import Link from 'next/link'
import { DiscordIcon, TelegramIcon, InstagramIcon, SocialIcon } from './icons'

interface FooterProps {
  className?: string
}

interface SocialLink {
  name: string
  href: string
  ariaLabel: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

interface NavigationLink {
  name: string
  href: string
  ariaLabel: string
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear()

  const socialLinks: SocialLink[] = [
    {
      name: 'Discord',
      href: 'https://discord.com',
      ariaLabel: 'Visit our Discord server',
      icon: DiscordIcon,
    },
    {
      name: 'Telegram',
      href: 'https://telegram.org',
      ariaLabel: 'Visit our Telegram channel',
      icon: TelegramIcon,
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      ariaLabel: 'Visit our Instagram profile',
      icon: InstagramIcon,
    },
  ]

  const navigationLinks: NavigationLink[] = [
    {
      name: 'About',
      href: '/about',
      ariaLabel: 'Learn more about WorldMappin',
    },
    {
      name: 'Team',
      href: '/team',
      ariaLabel: 'Meet the WorldMappin team',
    },
  ]

  return (
    <footer className={`bg-gray-50 border-t border-gray-100 ${className}`} role="contentinfo">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 gap-4">
          {/* Left section: Copyright */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 order-2 lg:order-1">
            {/* Copyright text */}
            <div className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
              © {currentYear} WorldMappin. All rights reserved.
            </div>

          </div>

          {/* Right section: Navigation Links */}
          <div className="order-1 lg:order-2 flex flex-col lg:flex-row items-center gap-10" >
            <nav role="navigation" aria-label="Footer navigation">
              <div className="flex space-x-6 sm:space-x-8">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-sm px-1 py-1"
                    aria-label={link.ariaLabel}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Social media links */}
            <div className="flex space-x-4 sm:space-x-6" role="group" aria-label="Social media links">
              {socialLinks.map((link) => (
                <SocialIcon
                  key={link.name}
                  icon={link.icon}
                  href={link.href}
                  name={link.name}
                  ariaLabel={link.ariaLabel}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
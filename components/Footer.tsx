import React from 'react'
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

  return (
    <footer className={`bg-gray-50 border-t border-gray-100 ${className}`} role="contentinfo">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 gap-4">
          {/* Copyright text */}
          <div className="text-gray-600 text-xs sm:text-sm text-center sm:text-left order-2 sm:order-1">
            © {currentYear} WorldMappin. All rights reserved.
          </div>

          {/* Social media links */}
          <div className="flex space-x-4 sm:space-x-6 order-1 sm:order-2">
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
    </footer>
  )
}

export default Footer
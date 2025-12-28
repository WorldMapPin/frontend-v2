'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 not-found-title" style={{ color: 'var(--text-primary)' }}>
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-6 not-found-subtitle" style={{ color: 'var(--text-primary)' }}>
          Page Not Found
        </h2>
        <p className="mb-8 not-found-description" style={{ color: 'var(--text-secondary)' }}>
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:opacity-90"
            style={{ 
              backgroundColor: 'var(--foreground)', 
              color: 'var(--background)'
            }}
          >
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-full border border-solid transition-colors flex items-center justify-center font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-opacity-50"
            style={{ 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
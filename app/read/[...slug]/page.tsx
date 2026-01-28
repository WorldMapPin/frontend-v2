'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';


export default function ReadRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const slugArray = params.slug as string[];
    if (slugArray && slugArray.length > 0) {
      // Redirect to the new route: /@author/permlink
      const newPath = '/' + slugArray.join('/');
      router.replace(newPath);
    } else {
      // If no valid slug, go to home
      router.replace('/');
    }
  }, [params.slug, router]);

  return (
    <div className="relative min-h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
            {/* Loading Skeleton while redirecting */}
            <div className="animate-pulse">
              <div className="h-48 sm:h-64 md:h-80 lg:h-96" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="h-6 sm:h-8 rounded w-3/4 mb-3 sm:mb-4" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                <div className="h-4 rounded w-1/2 mb-4 sm:mb-6" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="h-4 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="h-4 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

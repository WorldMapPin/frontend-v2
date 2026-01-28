'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirect from old /user/username to new /@username
 * This maintains backward compatibility for existing links
 */
export default function UserRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const rawUsername = params.username as string;
    if (rawUsername) {
      // Decode and remove @ if present (some old links might have @)
      const username = decodeURIComponent(rawUsername).replace(/^@/, '');
      // Redirect to the new route: /@username
      router.replace(`/@${username}`);
    } else {
      // If no valid username, go to home
      router.replace('/');
    }
  }, [params.username, router]);

  // Show a minimal loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-lexend)' }}>
          Redirecting...
        </p>
      </div>
    </div>
  );
}

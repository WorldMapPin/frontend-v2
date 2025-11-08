'use client';

import { useEffect, useState } from 'react';
import { AiohaProvider as AiohaReactProvider } from '@aioha/react-ui';
import { Aioha } from '@aioha/aioha';

interface AiohaProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Aioha Provider Wrapper for SSR compatibility
 * Initializes Aioha on client-side only to prevent SSR issues
 */
export default function AiohaProviderWrapper({ children }: AiohaProviderWrapperProps) {
  const [aioha, setAioha] = useState<Aioha | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);
    
    // Initialize Aioha only on client-side
    if (typeof window !== 'undefined') {
      try {
        const aiohaInstance = new Aioha();
        
        // Setup Aioha with WorldMapPin configuration
        aiohaInstance.setup({
          hiveauth: {
            name: 'WorldMapPin',
            description: 'Share your travel adventures on the blockchain'
          }
        });
        
        setAioha(aiohaInstance);
      } catch (error) {
        console.error('Failed to initialize Aioha:', error);
      }
    }
  }, []);

  // Render children without provider during SSR or before Aioha is ready
  if (!isClient || !aioha) {
    return <>{children}</>;
  }

  // Render with provider once Aioha is initialized
  return (
    <AiohaReactProvider aioha={aioha}>
      {children}
    </AiohaReactProvider>
  );
}


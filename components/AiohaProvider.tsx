'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { AiohaProvider as AiohaReactProvider } from '@aioha/react-ui';
import { Aioha } from '@aioha/aioha';

interface AiohaProviderWrapperProps {
  children: React.ReactNode;
}

interface SafeAiohaContextType {
  user: string | null;
  aioha: Aioha | null;
  isReady: boolean;
}

// Create safe context that's always available
export const SafeAiohaContext = createContext<SafeAiohaContextType>({
  user: null,
  aioha: null,
  isReady: false
});

/**
 * Aioha Provider Wrapper for SSR compatibility
 * Initializes Aioha on client-side only to prevent SSR issues
 */
export default function AiohaProviderWrapper({ children }: AiohaProviderWrapperProps) {
  const [aioha, setAioha] = useState<Aioha | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const hiveSignerApp = 'v2.worldmappin.com';
  const hiveSignerScopes = ['login'];

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
          },
          hivesigner: {
            app: hiveSignerApp,
            callbackURL: window.location.origin + '/hivesigner',
            // Enable 'posting' later after creating the app account on-chain.
            scope: hiveSignerScopes
          }
        });
        
        setAioha(aiohaInstance);
        
        // Update user when it changes
        const currentUser = aiohaInstance.getCurrentUser();
        setUser(currentUser ?? null);
      } catch (error) {
        console.error('Failed to initialize Aioha:', error);
      }
    }
  }, []);

  // Provide safe context wrapper
  const contextValue: SafeAiohaContextType = {
    user,
    aioha,
    isReady: isClient && !!aioha
  };

  // Always render with safe context
  if (!isClient || !aioha) {
    return (
      <SafeAiohaContext.Provider value={contextValue}>
        {children}
      </SafeAiohaContext.Provider>
    );
  }

  // Render with both providers once Aioha is initialized
  return (
    <SafeAiohaContext.Provider value={contextValue}>
      <AiohaReactProvider aioha={aioha}>
        {children}
      </AiohaReactProvider>
    </SafeAiohaContext.Provider>
  );
}


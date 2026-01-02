'use client';

import { useEffect, useState, createContext } from 'react';
import { AiohaProvider as AiohaReactProvider } from '@aioha/react-ui';
import { Aioha } from '@aioha/aioha';

interface AiohaProviderWrapperProps {
  children: React.ReactNode;
}

interface SafeAiohaContextType {
  user: string | null;
  aioha: Aioha | null;
  isReady: boolean;
  logout: () => void;
  refreshUser: () => void;
}

// Create safe context that's always available
export const SafeAiohaContext = createContext<SafeAiohaContextType>({
  user: null,
  aioha: null,
  isReady: false,
  logout: () => {},
  refreshUser: () => {}
});

/**
 * Aioha Provider Wrapper for SSR compatibility
 * Initializes Aioha on client-side only to prevent SSR issues
 */
export default function AiohaProviderWrapper({ children }: AiohaProviderWrapperProps) {
  const [aioha, setAioha] = useState<Aioha | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const hiveSignerApp = 'worldmappin.app'; // Max 16 characters for HiveSigner
  // Include all scopes needed for app functionality
  const hiveSignerScopes = ['login', 'vote', 'comment'];

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

  // Poll for user changes to detect login/logout
  useEffect(() => {
    if (!aioha) return;

    const checkUserChange = () => {
      const currentUser = aioha.getCurrentUser();
      const newUser = currentUser ?? null;
      
      if (newUser !== user) {
        console.log('User changed:', newUser);
        setUser(newUser);
      }
    };

    // Check immediately
    checkUserChange();

    // Poll every 500ms for user changes
    const interval = setInterval(checkUserChange, 500);

    return () => clearInterval(interval);
  }, [aioha, user]);

  // Logout function
  const logout = () => {
    if (aioha) {
      try {
        aioha.logout();
        setUser(null);
        console.log('User logged out successfully');
      } catch (error) {
        console.error('Failed to logout:', error);
      }
    }
  };

  // Refresh user function - manually check for user changes
  const refreshUser = () => {
    if (aioha) {
      const currentUser = aioha.getCurrentUser();
      const newUser = currentUser ?? null;
      console.log('Manually refreshing user:', newUser);
      setUser(newUser);
    }
  };

  // Provide safe context wrapper
  const contextValue: SafeAiohaContextType = {
    user,
    aioha,
    isReady: isClient && !!aioha,
    logout,
    refreshUser
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


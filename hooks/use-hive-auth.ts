'use client';

import { useState, useEffect, useCallback } from 'react';

// Extend the Window interface for Hive Keychain
declare global {
  interface Window {
    hive_keychain?: any;
  }
}

interface HiveAuthState {
  username: string | null;
  isAuthenticated: boolean;
  isKeychainAvailable: boolean;
}

export const useHiveAuth = () => {
  const [authState, setAuthState] = useState<HiveAuthState>({
    username: null,
    isAuthenticated: false,
    isKeychainAvailable: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hive_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAuthState(prev => ({
            ...prev,
            username: parsed.username,
            isAuthenticated: true
          }));
        } catch {
          // Invalid data, ignore
        }
      }
    }
  }, []);

  // Check if Hive Keychain is available
  useEffect(() => {
    const checkKeychain = () => {
      const available = typeof window !== 'undefined' && !!window.hive_keychain;
      setAuthState(prev => ({ ...prev, isKeychainAvailable: available }));
      
      if (!available) {
        console.info('Hive Keychain extension is not installed. Get it at https://hive-keychain.com/');
      }
    };

    checkKeychain();

    // Check again after a delay in case extension loads late
    const timeout = setTimeout(checkKeychain, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Listen for auth changes from within the same page
  useEffect(() => {
    const handleAuthChange = () => {
      // Reload auth state from localStorage
      const stored = localStorage.getItem('hive_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAuthState(prev => ({
            ...prev,
            username: parsed.username,
            isAuthenticated: true
          }));
        } catch {
          // Invalid data
        }
      } else {
        // Auth was removed
        setAuthState(prev => ({
          ...prev,
          username: null,
          isAuthenticated: false
        }));
      }
    };

    window.addEventListener('hive-auth-state-change', handleAuthChange);
    return () => window.removeEventListener('hive-auth-state-change', handleAuthChange);
  }, []);

  const login = useCallback(async (username: string): Promise<boolean> => {
    setError(null);
    
    if (!username.trim()) {
      setError('Please enter a username');
      return false;
    }

    if (!authState.isKeychainAvailable) {
      setError('Hive Keychain extension is not installed. Please install it from https://hive-keychain.com/');
      return false;
    }

    setIsLoading(true);

    return new Promise((resolve) => {
      try {
        const challenge = `worldmappin-journey-login-${Date.now()}`;
        const normalizedUsername = username.toLowerCase().trim();

        window.hive_keychain.requestSignBuffer(
          normalizedUsername,
          challenge,
          'Posting',
          (response: any) => {
            setIsLoading(false);

            if (response.success) {
              const newAuthState = {
                username: normalizedUsername,
                isAuthenticated: true,
                isKeychainAvailable: true
              };
              
              setAuthState(newAuthState);
              
              // Persist to localStorage
              localStorage.setItem('hive_auth', JSON.stringify({ 
                username: normalizedUsername,
                timestamp: Date.now()
              }));

              // Dispatch event for other components
              window.dispatchEvent(new Event('hive-auth-state-change'));

              resolve(true);
            } else {
              setError(response.message || 'Authentication failed');
              resolve(false);
            }
          }
        );
      } catch (err) {
        setIsLoading(false);
        setError('Keychain operation failed');
        console.error('Keychain error:', err);
        resolve(false);
      }
    });
  }, [authState.isKeychainAvailable]);

  const logout = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      username: null,
      isAuthenticated: false
    }));
    localStorage.removeItem('hive_auth');
    setError(null);
    
    // Dispatch event for other components
    window.dispatchEvent(new Event('hive-auth-state-change'));
  }, []);

  return {
    username: authState.username,
    isAuthenticated: authState.isAuthenticated,
    isKeychainAvailable: authState.isKeychainAvailable,
    isLoading,
    error,
    login,
    logout
  };
};

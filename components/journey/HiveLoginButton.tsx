'use client';

import React, { useState } from 'react';
import { useHiveAuth } from '../../hooks/use-hive-auth';

export default function HiveLoginButton() {
  const { username, isAuthenticated, isKeychainAvailable, isLoading, error, login, logout } = useHiveAuth();
  const [inputUsername, setInputUsername] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLogin = async () => {
    const success = await login(inputUsername);
    if (success) {
      setInputUsername('');
      setShowLoginForm(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  if (isAuthenticated && username) {
    return (
      <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">@{username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  if (showLoginForm) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter Hive username..."
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          autoFocus
        />
        
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {!isKeychainAvailable && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <div className="font-medium mb-1">Hive Keychain Required</div>
            <a 
              href="https://hive-keychain.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Install Keychain Extension →
            </a>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleLogin}
            disabled={isLoading || !isKeychainAvailable || !inputUsername.trim()}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? 'Authenticating...' : 'Login with Keychain'}
          </button>
          <button
            onClick={() => {
              setShowLoginForm(false);
              setInputUsername('');
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowLoginForm(true)}
      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
    >
      <span>🔐</span>
      <span>Login with Hive</span>
    </button>
  );
}

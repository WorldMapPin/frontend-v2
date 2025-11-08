'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AiohaModal } from '@aioha/react-ui';
import { KeyTypes } from '@aioha/aioha';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';

export default function SignupPage() {
  const router = useRouter();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const { user, isReady } = useAiohaSafe();

  const handleJoinCommunity = () => {
    // Only open modal if Aioha is ready
    if (isReady) {
      setModalDisplayed(true);
    }
  };

  const handleLogin = (result: any) => {
    console.log('User logged in:', result);
    setModalDisplayed(false);
    
    // Redirect to map after successful login
    router.push('/map');
  };

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row">
        
        {/* Left Side - Hero Section */}
        <div 
          className="lg:w-1/2 relative overflow-hidden flex items-center justify-center py-12 px-8 lg:py-16 lg:px-16"
          style={{ background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)' }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-4 border-white animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full border-4 border-white animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-4 border-white animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-lg text-center lg:text-left">
            {/* Logo */}
            <div className="flex justify-center lg:justify-start mb-8">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-3">
                <Image
                  src="/images/worldmappin-logo.png"
                  alt="WorldMapPin Logo"
                  width={64}
                  height={64}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <h1 className="font-lexend text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              Your Travel Stories,
              <br />
              <span className="text-orange-100">On the Blockchain</span>
            </h1>
            
            <p className="font-lexend text-base sm:text-lg lg:text-xl text-white/90 mb-8 leading-relaxed">
              Join thousands of travelers sharing their adventures on WorldMapPin. Pin your locations, earn rewards, and own your content forever.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
              <div className="text-center">
                <div className="font-lexend text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">12K+</div>
                <div className="font-lexend text-xs sm:text-sm text-white/80">Travelers</div>
              </div>
              <div className="text-center">
                <div className="font-lexend text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">150K+</div>
                <div className="font-lexend text-xs sm:text-sm text-white/80">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-lexend text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">180+</div>
                <div className="font-lexend text-xs sm:text-sm text-white/80">Countries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="lg:w-1/2 flex items-center justify-center py-12 px-8 lg:py-16 lg:px-16 bg-gradient-to-br from-orange-50 to-white">
          <div className="w-full max-w-md">
            
            {/* Header */}
            <div className="mb-8 sm:mb-10">
              <h2 className="font-lexend text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#592102' }}>
                Get Started
              </h2>
              <p className="font-lexend text-base sm:text-lg" style={{ color: '#6F5B50' }}>
                Connect your wallet to begin your journey
              </p>
            </div>

            {/* Main CTA */}
            <button
              onClick={handleJoinCommunity}
              disabled={!isReady && !user}
              className="w-full font-lexend font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-2xl text-base sm:text-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 mb-6"
              style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)', color: '#FFFFFF' }}
            >
              {!isReady ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>{user ? `Connected as @${user}` : 'Connect Wallet'}</span>
                </>
              )}
            </button>

            {/* New to Hive */}
            <div className="text-center mb-10">
              <p className="font-lexend text-sm" style={{ color: '#6F5B50' }}>
                Don't have a Hive account?{' '}
                <a
                  href="https://signup.hive.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold hover:underline transition-all"
                  style={{ color: '#ED6D28' }}
                  suppressHydrationWarning
                >
                  Create one for free →
                </a>
              </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-lexend text-base sm:text-lg font-bold mb-1" style={{ color: '#592102' }}>
                    Permanent Ownership
                  </h3>
                  <p className="font-lexend text-sm" style={{ color: '#6F5B50' }}>
                    Your content is stored on the blockchain, forever yours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-lexend text-base sm:text-lg font-bold mb-1" style={{ color: '#592102' }}>
                    Earn Crypto Rewards
                  </h3>
                  <p className="font-lexend text-sm" style={{ color: '#6F5B50' }}>
                    Get rewarded in cryptocurrency for quality travel content
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ED6D28 0%, #FFA600 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-lexend text-base sm:text-lg font-bold mb-1" style={{ color: '#592102' }}>
                    Global Community
                  </h3>
                  <p className="font-lexend text-sm" style={{ color: '#6F5B50' }}>
                    Connect with passionate travelers from around the world
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-orange-200">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-lexend text-xs font-medium" style={{ color: '#6F5B50' }}>
                    Secure
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-lexend text-xs font-medium" style={{ color: '#6F5B50' }}>
                    Decentralized
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-lexend text-xs font-medium" style={{ color: '#6F5B50' }}>
                    Free to Join
                  </span>
                </div>
              </div>
              
              <p className="font-lexend text-xs text-center" style={{ color: '#6F5B50' }}>
                Powered by Hive Blockchain • Your keys, your content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aioha Wallet Connection Modal - Only render when provider is ready */}
      {isReady && (
        <AiohaModal
          displayed={modalDisplayed}
          loginTitle="Connect to WorldMapPin"
          loginOptions={{
            msg: 'Login to WorldMapPin',
            keyType: KeyTypes.Posting
          }}
          onLogin={handleLogin}
          onClose={() => setModalDisplayed(false)}
          imageServer="https://images.hive.blog"
          explorerUrl="https://hivehub.dev"
        />
      )}
    </div>
  );
}


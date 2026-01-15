'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { optimizeImageForPost, optimizeImageForExplore, generatePlaceholderUrl, generateSrcSet } from '@/utils/imageOptimization';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean; // For above-the-fold images
  mode?: 'post' | 'explore';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'skeleton' | 'none';
  quality?: number;
  // Responsive breakpoints
  mobileWidth?: number;
  tabletWidth?: number;
  desktopWidth?: number;
}


export default function ProgressiveImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  mode = 'post',
  objectFit = 'cover',
  onLoad,
  onError,
  placeholder = 'blur',
  quality = 85,
  mobileWidth,
  tabletWidth,
  desktopWidth,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [hasError, setHasError] = useState(false);
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return; // Skip if already loading or priority

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px', // Start loading 50px before entering viewport
      threshold: 0.01,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      });
    }, options);

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Generate optimized image URLs
  const optimizedSrc = useMemo(() => {
    if (!src || hasError) return '';
    
    if (useUnoptimized) {
      return src; // Fallback to original
    }

    if (mode === 'explore') {
      return optimizeImageForExplore(src, undefined, undefined, isMobile);
    } else {
      return optimizeImageForPost(src, undefined, undefined, isMobile);
    }
  }, [src, mode, isMobile, useUnoptimized, hasError]);

  // Generate placeholder URL
  const placeholderSrc = useMemo(() => {
    if (placeholder === 'none' || !src) return '';
    return generatePlaceholderUrl(src);
  }, [src, placeholder]);

  // Generate srcset for responsive images
  const srcSet = useMemo(() => {
    if (!src || hasError) return '';
    return generateSrcSet(src, undefined, isMobile);
  }, [src, isMobile, hasError]);

  // Default sizes if not provided
  const defaultSizes = sizes || (fill 
    ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : width 
      ? `(max-width: 768px) ${Math.min(width, 400)}px, ${width}px`
      : '100vw'
  );

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (!useUnoptimized) {
      // Try unoptimized version first
      setUseUnoptimized(true);
      setHasError(false);
    } else {
      // Final fallback - show error state
      setHasError(true);
      onError?.();
    }
  }, [useUnoptimized, onError]);

  // Error state
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageStyle: React.CSSProperties = {
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  const containerStyle: React.CSSProperties = fill 
    ? { position: 'absolute', inset: 0 }
    : width && height 
      ? { width, height, position: 'relative' }
      : { position: 'relative' };

  return (
    <div
      ref={imgRef}
      className={`relative ${className}`}
      style={containerStyle}
    >
      {/* Placeholder/Blur */}
      {placeholder !== 'none' && placeholderSrc && !isLoaded && (
        <div className="absolute inset-0 overflow-hidden">
          {placeholder === 'blur' ? (
            <img
              src={placeholderSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
              aria-hidden="true"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}
        </div>
      )}

      {/* Skeleton loader */}
      {placeholder === 'skeleton' && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Main Image */}
      {isInView && optimizedSrc && (
        <img
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes={defaultSizes}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={imageStyle}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

import bs58Module from 'bs58';


const bs58 = (bs58Module as any).default || bs58Module;

export const IMAGE_SIZES = {
  // Explore/Feed view - smaller thumbnails
  explore: { width: 800, height: 600 },
  exploreMobile: { width: 400, height: 300 },
  exploreTablet: { width: 600, height: 450 },
  
  // Post view - optimized for reading
  postCover: { width: 1200, height: 675 }, // 16:9 aspect ratio
  postContent: { width: 1200, height: 0 }, // Maintain aspect ratio, max width
  postContentMobile: { width: 800, height: 0 },
  postContentTablet: { width: 1000, height: 0 },
  
  // Low quality placeholder
  placeholder: { width: 20, height: 20 },
} as const;

/**
 
 * @param imageUrl - Original image URL
 * @param width - Max width (default: 1200px for optimal reading experience)
 * @param height - Max height (default: 0 to maintain aspect ratio)
 * @param isMobile - Whether this is for mobile viewport
 * @returns Optimized image URL
 */
export function optimizeImageForPost(
  imageUrl: string, 
  width: number = IMAGE_SIZES.postContent.width,
  height: number = IMAGE_SIZES.postContent.height,
  isMobile: boolean = false
): string {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  if (imageUrl.startsWith('https://images.hive.blog/0x0/')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('https://images.hive.blog/')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Use smaller dimensions for mobile
    const finalWidth = isMobile ? IMAGE_SIZES.postContentMobile.width : width;
    const finalHeight = isMobile ? IMAGE_SIZES.postContentMobile.height : height;
    
    // For cover images, use specific dimensions
    if (height > 0) {
      try {
        const bytes = Buffer.from(imageUrl, 'utf8');
        const imageUrlBase58 = bs58.encode(bytes);
        return `https://images.hive.blog/p/${imageUrlBase58}?width=${finalWidth}&height=${finalHeight}&mode=fit`;
      } catch (error) {
        console.error('Error encoding image URL to Base58:', error);
        return imageUrl;
      }
    }
    
    // For content images, use width-only optimization
    try {
      const bytes = Buffer.from(imageUrl, 'utf8');
      const imageUrlBase58 = bs58.encode(bytes);
      return `https://images.hive.blog/p/${imageUrlBase58}?width=${finalWidth}&mode=fit`;
    } catch (error) {
      console.error('Error encoding image URL to Base58:', error);
      // Fallback to 0x0 format if Base58 encoding fails
      return `https://images.hive.blog/0x0/${imageUrl}`;
    }
  }

  return imageUrl;
}

/**
 * 
 * @param imageUrl - Original image URL
 * @param width - Target width (default: 800)
 * @param height - Target height (default: 600)
 * @param isMobile - Whether this is for mobile viewport
 * @returns Optimized image URL
 */
export function optimizeImageForExplore(
  imageUrl: string, 
  width: number = IMAGE_SIZES.explore.width, 
  height: number = IMAGE_SIZES.explore.height,
  isMobile: boolean = false
): string {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

 
  if (imageUrl.startsWith('https://images.hive.blog/p/')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('https://images.hive.blog/')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      // Use smaller dimensions for mobile
      const finalWidth = isMobile ? IMAGE_SIZES.exploreMobile.width : width;
      const finalHeight = isMobile ? IMAGE_SIZES.exploreMobile.height : height;
      
      // Convert URL to Buffer and encode in Base58
      const bytes = Buffer.from(imageUrl, 'utf8');
      const imageUrlBase58 = bs58.encode(bytes);
      
      return `https://images.hive.blog/p/${imageUrlBase58}?width=${finalWidth}&height=${finalHeight}&mode=fit`;
    } catch (error) {
      console.error('Error encoding image URL to Base58:', error);
      // Fallback to original URL if encoding fails
      return imageUrl;
    }
  }

  return imageUrl;
}

/**
 * Generates a low-quality placeholder image URL for progressive loading
 * @param imageUrl - Original image URL
 * @returns Low-quality placeholder URL
 */
export function generatePlaceholderUrl(imageUrl: string): string {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '';
  }

  // Skip if already a placeholder
  if (imageUrl.includes('width=20') || imageUrl.includes('width=40')) {
    return imageUrl;
  }

  // Skip if already a Hive ImageHoster URL
  if (imageUrl.startsWith('https://images.hive.blog/')) {
    // Extract original URL from Hive ImageHoster URL
    if (imageUrl.includes('/p/')) {
      // This is a Base58 encoded URL, we'd need to decode it
      // For simplicity, return empty and let component handle it
      return '';
    }
    // Extract from 0x0 format
    const originalUrl = imageUrl.replace('https://images.hive.blog/0x0/', '');
    if (originalUrl && originalUrl.startsWith('http')) {
      return optimizeImageForExplore(originalUrl, IMAGE_SIZES.placeholder.width, IMAGE_SIZES.placeholder.height);
    }
  }

  // Generate placeholder for original URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return optimizeImageForExplore(imageUrl, IMAGE_SIZES.placeholder.width, IMAGE_SIZES.placeholder.height);
  }

  return '';
}

/**
 * Generates responsive srcset for an image
 * @param imageUrl - Original image URL
 * @param sizes - Array of width sizes to generate
 * @param isMobile - Whether to include mobile-optimized sizes
 * @returns srcset string
 */
export function generateSrcSet(
  imageUrl: string, 
  sizes: number[] = [400, 800, 1200, 1600],
  isMobile: boolean = false
): string {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '';
  }

  // Filter sizes for mobile
  const finalSizes = isMobile ? sizes.filter(s => s <= 800) : sizes;
  
  return finalSizes
    .map(width => {
      try {
        const bytes = Buffer.from(imageUrl, 'utf8');
        const imageUrlBase58 = bs58.encode(bytes);
        return `https://images.hive.blog/p/${imageUrlBase58}?width=${width}&mode=fit ${width}w`;
      } catch (error) {
        return '';
      }
    })
    .filter(Boolean)
    .join(', ');
}

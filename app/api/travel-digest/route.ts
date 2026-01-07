import { NextRequest, NextResponse } from 'next/server';
import { 
  findLatestDigestNumber, 
  fetchDigestWithRetry, 
  parseDigestHTML, 
  digestCache 
} from '@/lib/travelDigest';
import { TravelDigest, DigestFetchResult } from '@/types/post';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedNumber = searchParams.get('number');
    const requestedDate = searchParams.get('date');
    const skipCache = searchParams.get('skipCache') === 'true';
    const clearCache = searchParams.get('clearCache') === 'true';
    
    // Clear cache if requested
    if (clearCache) {
      digestCache.clear();
      console.log('Cache cleared');
    }
    
    let digestNumber: number;
    
    // Determine which digest to fetch
    if (requestedNumber) {
      digestNumber = parseInt(requestedNumber, 10);
      if (isNaN(digestNumber) || digestNumber < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid digest number' },
          { status: 400 }
        );
      }
    } else if (requestedDate) {
      // TODO: Implement date-based digest lookup
      return NextResponse.json(
        { success: false, error: 'Date-based lookup not yet implemented' },
        { status: 501 }
      );
    } else {
      // Find the latest digest
      console.log('Finding latest digest number...');
      digestNumber = await findLatestDigestNumber();
      console.log(`Latest digest number found: ${digestNumber}`);
    }
    
    // Check cache first (but skip cache if requested)
    const cachedDigest = skipCache ? null : digestCache.get(digestNumber);
    if (cachedDigest) {
      console.log(`Serving cached digest ${digestNumber}`);
      const result: DigestFetchResult = {
        success: true,
        digest: cachedDigest,
        cached: true
      };
      
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }
    
    // Fetch from Hive API
    const hiveData = await fetchDigestWithRetry(digestNumber);
    

    
    if (!hiveData || !hiveData.post) {
      return NextResponse.json(
        { success: false, error: 'Invalid response from Hive API' },
        { status: 502 }
      );
    }
    
    // Parse the HTML content
    // Handle both cases: post.body or post being the content directly
    const htmlContent = (hiveData.post && typeof hiveData.post === 'object' && 'body' in hiveData.post) 
      ? hiveData.post.body 
      : hiveData.post;
    
    if (!htmlContent) {
      return NextResponse.json(
        { success: false, error: 'No content found in digest post' },
        { status: 404 }
      );
    }
    
    const posts = parseDigestHTML(htmlContent);
    
    if (posts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No posts found in digest' },
        { status: 404 }
      );
    }
    
    // Create digest object
    const digest: TravelDigest = {
      digestNumber,
      publishDate: hiveData.post.created,
      posts
    };
    
    // Cache the result
    digestCache.set(digestNumber, digest);
    
    const result: DigestFetchResult = {
      success: true,
      digest,
      cached: false
    };
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
    
  } catch (error) {
    console.error('Error in travel-digest API:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        // Try fallback to previous digest
        try {
          const fallbackNumber = await findLatestDigestNumber() - 1;
          const cachedFallback = digestCache.get(fallbackNumber);
          
          if (cachedFallback) {
            const result: DigestFetchResult = {
              success: true,
              digest: cachedFallback,
              cached: true,
              error: 'Using previous digest as fallback'
            };
            
            return NextResponse.json(result, {
              headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
              },
            });
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
        
        return NextResponse.json(
          { success: false, error: 'Digest not found and no fallback available' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        return NextResponse.json(
          { success: false, error: 'Request timeout' },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
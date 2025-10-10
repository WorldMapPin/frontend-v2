// Utility functions for post processing and formatting

/**
 * Parse PeakD URL to extract author and permlink
 * @param url - Full PeakD URL like https://peakd.com/@author/permlink
 * @returns Object with author and permlink
 */
export function parsePeakDUrl(url: string): { author: string; permlink: string } | null {
  try {
    const match = url.match(/@([^/]+)\/([^/?#]+)/);
    if (match) {
      return {
        author: match[1],
        permlink: match[2]
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing PeakD URL:', error);
    return null;
  }
}

/**
 * Convert Hive reputation to human-readable format
 * Based on Hive reputation algorithm
 * @param rawReputation - Raw reputation value from Hive
 * @returns Formatted reputation (e.g., "68.2")
 */
export function formatReputation(rawReputation: number | string): string {
  try {
    const rep = typeof rawReputation === 'string' ? parseInt(rawReputation) : rawReputation;
    
    if (isNaN(rep)) return '25.0';
    
    // Hive reputation formula
    const negative = rep < 0;
    let reputation = Math.log10(Math.abs(rep));
    reputation = Math.max(reputation - 9, 0);
    reputation *= negative ? -9 : 9;
    reputation += 25;
    
    return reputation.toFixed(1);
  } catch (error) {
    return '25.0';
  }
}

/**
 * Format ISO date string to relative time
 * @param dateString - ISO date string
 * @returns Relative time string (e.g., "2d ago", "5h ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y ago`;
  } catch (error) {
    return 'recently';
  }
}

/**
 * Calculate estimated reading time from markdown text
 * @param text - Markdown text content
 * @returns Reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  try {
    // Remove markdown syntax and count words
    const plainText = text
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/[#*_~`]/g, '') // Remove markdown symbols
      .trim();
    
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
    
    return Math.max(1, readingTime); // Minimum 1 minute
  } catch (error) {
    return 1;
  }
}

/**
 * Format payout value
 * @param payoutValue - Payout string like "12.345 HBD"
 * @returns Formatted payout (e.g., "$12.35")
 */
export function formatPayout(payoutValue: string): string {
  try {
    const amount = parseFloat(payoutValue);
    if (isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
  } catch (error) {
    return '$0.00';
  }
}

/**
 * Generate Hive blog JSON URL from author and permlink
 * @param author - Post author username
 * @param permlink - Post permlink
 * @returns Full Hive API URL
 */
export function getHiveBlogUrl(author: string, permlink: string): string {
  return `https://hive.blog/hive-163772/@${author}/${permlink}.json`;
}

/**
 * Safe JSON metadata parser
 * @param jsonData - JSON string or object to parse
 * @returns Parsed object or empty object on error
 */
export function safeJsonParse(jsonData: string | any): any {
  try {
    if (!jsonData) return {};
    
    // If it's already an object, return it
    if (typeof jsonData === 'object') {
      return jsonData;
    }
    
    // If it's a string, try to parse it
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData);
    }
    
    return {};
  } catch (error) {
    console.error('Error parsing JSON metadata:', error);
    return {};
  }
}

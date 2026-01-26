'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProcessedPost } from '@/types/post';
import { fetchPostWithRetry } from '@/utils/hivePosts';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import CommentsSection from '@/components/shared/CommentsSection';
import PostVotingSection from '@/components/shared/PostVotingSection';
import { optimizeImageForPost, IMAGE_SIZES } from '@/utils/imageOptimization';
import ProgressiveImage from '@/components/shared/ProgressiveImage';

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
  pedantic: false, // Don't be strict about markdown rules
});

export default function PostReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<ProcessedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  // Parse slug from params: catch-all returns array like ['@author', 'permlink']
  // Decode URI components in case @ is encoded as %40
  const slugArray = params.slug as string[];
  const decodedAuthor = decodeURIComponent(slugArray?.[0] || '');
  const author = decodedAuthor.replace('@', '');
  const permlink = decodeURIComponent(slugArray?.[1] || '');

  useEffect(() => {
    async function loadPost() {
      if (!author || !permlink) {
        setError('Invalid post URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedPost = await fetchPostWithRetry(author, permlink, 3);

        if (!fetchedPost) {
          setError('Post not found or failed to load');
          setLoading(false);
          return;
        }

        setPost(fetchedPost);
        setLoading(false);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post. Please try again later.');
        setLoading(false);
      }
    }

    loadPost();
  }, [author, permlink]);

  const processedHtml = useMemo(() => {
    if (!post?.bodyMarkdown) return '';
    
    try {
      let preprocessedMarkdown = post.bodyMarkdown;

      
      // [![](https://images.ecency.com/....jpg)](https://images.ecency.com/....jpg)
      // into HTML <a><img/></a> so they always render correctly
      preprocessedMarkdown = preprocessedMarkdown.replace(
        /\[!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\]\((https?:\/\/[^\s)]+)\)/g,
        (_match, alt, src, href) =>
          `<a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${src}" alt="${alt}" loading="lazy" /></a>`
      );

      // Preprocess: Handle markdown inside HTML tags

      // Convert image URLs from PeakD (and similar) to markdown image syntax
      // 1) Standalone on their own line (with possible leading/trailing whitespace)
      preprocessedMarkdown = preprocessedMarkdown.replace(
        /^[\s]*(https?:\/\/[^\s]+?\.(?:png|jpe?g|gif|webp|svg))[\s]*$/gim,
        '![]($1)'
      );

      // 2) Handle InLeo/Leopedia images - standalone URLs on their own line
      // InLeo posts often have URLs like: https://img.leopedia.io/hash/filename.jpeg
      preprocessedMarkdown = preprocessedMarkdown.replace(
        /^[\s]*(https?:\/\/img\.leopedia\.io\/[^\s]+)[\s]*$/gim,
        (match, url) => {
          // Skip if already wrapped in markdown
          if (match.includes('![')) return match;
          return `![](${url})`;
        }
      );

      // 3) Handle InLeo images anywhere in text (not already in markdown)
      preprocessedMarkdown = preprocessedMarkdown.replace(
        /(https?:\/\/img\.leopedia\.io\/[^\s\)]+)/gi,
        (match, url, offset, full) => {
          const before = full.slice(0, offset);
          const prefix = before.slice(-2);

          // Skip if it's already inside markdown link/image: ](url) or ![
          if (prefix === '](' || before.endsWith('![')) {
            return match;
          }

          return `![](${url})`;
        }
      );

      // 4) Anywhere in the text for PeakD, but only if not already part of markdown []()
      preprocessedMarkdown = preprocessedMarkdown.replace(
        /(https?:\/\/files\.peakd\.com\/[^\s]+?\.(?:png|jpe?g|gif|webp|svg))/gi,
        (match, _url, offset, full) => {
          const before = full.slice(0, offset);
          const prefix = before.slice(-2);

          // Skip if it's already inside markdown link/image: ](url)
          if (prefix === '](') {
            return match;
          }

          return `![](${match})`;
        }
      );
      
      // Find HTML tags that contain markdown and process them
      preprocessedMarkdown = preprocessedMarkdown.replace(
        /<(h[1-6]|p|div|center|span)([^>]*)>(.*?)<\/\1>/gis,
        (match, tagName, attributes, content) => {
          // Process markdown inside the HTML tag
          const processedContent = content
            // Images: ![alt](src)
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic
            .replace(/_([^_]+)_/g, '<em>$1</em>') // Italic with underscores
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>') // Links
            .replace(/`([^`]+)`/g, '<code>$1</code>'); // Inline code
          
          return `<${tagName}${attributes}>${processedContent}</${tagName}>`;
        }
      );
      
      // Convert markdown to HTML
      const rawHtml = marked.parse(preprocessedMarkdown) as string;
      
      // Sanitize HTML but allow common formatting tags
      let cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
          'a', 'img',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'center',
          'sup', 'sub',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel',
          'src', 'alt', 'title', 'width', 'height', 'loading',
          'class', 'className', 'style', 'id',
        ],
        ALLOW_DATA_ATTR: false,
      });
      
      // Optimize all image URLs in the HTML using Hive ImageHoster with responsive sizes
      cleanHtml = cleanHtml.replace(
        /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi,
        (match, before, src, after) => {
          // Use optimized dimensions for post content images
          const optimizedSrc = optimizeImageForPost(src, IMAGE_SIZES.postContent.width, IMAGE_SIZES.postContent.height);
          // Ensure loading="lazy" is present for below-the-fold images
          const hasLoading = /loading=["']/i.test(before + after);
          const loadingAttr = hasLoading ? '' : ' loading="lazy"';
          return `<img${before} src="${optimizedSrc}"${loadingAttr}${after}>`;
        }
      );
      
      return cleanHtml;
    } catch (err) {
      console.error('Error processing markdown:', err);
      return '<p>Error rendering content</p>';
    }
  }, [post?.bodyMarkdown]);

  // Handle image errors after content is rendered
  useEffect(() => {
    if (!processedHtml) return;
    
    const handleImageError = (e: Event) => {
      const img = e.target as HTMLImageElement;
      img.style.display = 'none';
    };
    
    const images = document.querySelectorAll('.markdown-content img');
    images.forEach(img => {
      img.addEventListener('error', handleImageError);
    });
    
    return () => {
      images.forEach(img => {
        img.removeEventListener('error', handleImageError);
      });
    };
  }, [processedHtml]);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="relative z-10">
        <div className="w-full px-4 sm:w-[90%] md:w-[85%] lg:w-[70%] mx-auto sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
            {/* Loading Skeleton */}
            <div className="animate-pulse">
              <div className="h-48 sm:h-64 md:h-80 lg:h-96" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="h-6 sm:h-8 rounded w-3/4 mb-3 sm:mb-4" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                <div className="h-4 rounded w-1/2 mb-4 sm:mb-6" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="h-4 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="h-4 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                  <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="relative min-h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        <div className="relative z-10">
        <div className="w-full px-4 sm:w-[90%] md:w-[85%] lg:w-[70%] mx-auto sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center" style={{ backgroundColor: 'var(--card-bg)' }}>
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Post</h2>
            <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--text-secondary)' }}>{error || 'Post not found'}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="relative z-10">
      <div className="w-full px-4 sm:w-[90%] md:w-[85%] lg:w-[70%] mx-auto sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <article>
          {/* Cover Image */}
          {post.coverImage && (
            <div className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 lg:mb-8">
              <div
                className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-blue-500 to-purple-600"
                style={{
                  boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D',
                  borderRadius: '18px',
                  overflow: 'hidden'
                }}
              >
              <ProgressiveImage
                src={post.coverImage}
                alt={post.title}
                fill
                mode="post"
                placeholder="blur"
                priority={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 85vw, 70vw"
                className="rounded-[18px]"
                objectFit="cover"
              />
              
              {/* Bottom gradient overlay */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-24 sm:h-32"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                  borderBottomLeftRadius: '18px',
                  borderBottomRightRadius: '18px'
                }}
              />
              
              {/* Date, Reading Time, and Payout - Bottom of Cover */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-10">
                <div
                  className="flex items-center gap-2 text-xs sm:text-sm"
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    color: '#FFFFFF'
                  }}
                >
                  <span>{post.createdRelative}</span>
                  <span>•</span>
                  <span>{post.readingTimeMin} min read</span>
                </div>
                
                <span
                  className="font-bold text-lg sm:text-xl lg:text-2xl"
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    color: '#8EDB1B'
                  }}
                >
                  {post.payout}
                </span>
              </div>
              
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="absolute top-3 left-3 sm:top-4 sm:-left-4 z-10 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer w-10 h-10 sm:w-12 sm:h-12 read-page-back-btn"
                style={{
                  borderRadius: '50px',
                  boxShadow: '0px 1px 3px 0px #0000004D, 0px 4px 8px 3px #00000026'
                }}
                aria-label="Go back"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path
                    d="M13 18L7 12L13 6"
                    stroke="#7F1B1B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 12H19"
                    stroke="#7F1B1B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Author Name, Reputation, and Stats */}
            <div className="mb-3 sm:mb-4">
              
              <div className="flex sm:hidden items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Profile Picture Avatar */}
                  <Link
                    href={`/user/${post.author}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={`https://images.hive.blog/u/${post.author}/avatar`}
                      alt={`${post.author}'s profile`}
                      className="w-8 h-8 rounded-full object-cover border-2"
                      style={{
                        borderColor: '#99602733'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-avatar.svg';
                      }}
                    />
                  </Link>
                  
                  {/* Username */}
                  <Link
                    href={`/user/${post.author}`}
                    className="text-sm font-semibold transition-colors truncate"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      color: '#996027'
                    }}
                  >
                    @{post.author}
                  </Link>
                  
                  {/* Reputation */}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 read-page-reputation"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      backgroundColor: 'var(--reputation-bg)',
                      color: 'var(--reputation-color)',
                      border: '1px solid var(--reputation-border)'
                    }}
                  >
                    {post.reputation}
                  </span>
                </div>
                
                {/* Right side: Votes and Comments */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Likes */}
                  <div
                    className="flex items-center gap-0.5 px-1.5 py-0.5 read-page-like-badge"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      backgroundColor: 'var(--like-bg)',
                      border: '1.5px solid var(--like-border)',
                      borderRadius: '6px'
                    }}
                  >
                    <svg className="w-3 h-3 flex-shrink-0 read-page-like-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--like-color)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium text-xs read-page-like-text" style={{ color: 'var(--like-color)' }}>{post.votes}</span>
                  </div>
                  {/* Comments */}
                  <div
                    className="flex items-center gap-0.5 px-1.5 py-0.5 read-page-comment-badge"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      backgroundColor: 'var(--comment-bg)',
                      border: '1.5px solid var(--comment-border)',
                      borderRadius: '6px'
                    }}
                  >
                    <svg className="w-3 h-3 flex-shrink-0 read-page-comment-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--comment-color)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium text-xs read-page-comment-text" style={{ color: 'var(--comment-color)' }}>{post.comments}</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Layout - Horizontal */}
              <div className="hidden sm:flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Profile Picture Avatar */}
                  <Link
                    href={`/user/${post.author}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={`https://images.hive.blog/u/${post.author}/avatar`}
                      alt={`${post.author}'s profile`}
                      className="w-12 h-12 rounded-full object-cover border-2"
                      style={{
                        borderColor: '#99602733'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-avatar.svg';
                      }}
                    />
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/user/${post.author}`}
                      className="text-xl lg:text-2xl font-semibold transition-colors"
                      style={{
                        fontFamily: 'var(--font-lexend)',
                        color: '#996027'
                      }}
                    >
                      @{post.author}
                    </Link>
                    <span
                      className="text-sm px-3 py-1 rounded-full font-medium read-page-reputation"
                      style={{
                        fontFamily: 'var(--font-lexend)',
                        backgroundColor: 'var(--reputation-bg)',
                        color: 'var(--reputation-color)',
                        border: '1px solid var(--reputation-border)'
                      }}
                    >
                      {post.reputation}
                    </span>
                  </div>
                </div>
                
                {/* Votes and Comments - Compact */}
                <div className="flex items-center gap-1.5">
                  {/* Likes */}
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 read-page-like-badge"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      backgroundColor: 'var(--like-bg)',
                      border: '1.5px solid var(--like-border)',
                      borderRadius: '8px'
                    }}
                  >
                    <svg className="w-4 h-4 read-page-like-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--like-color)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium text-sm read-page-like-text" style={{ color: 'var(--like-color)' }}>{post.votes}</span>
                  </div>
                  {/* Comments */}
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 read-page-comment-badge"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      backgroundColor: 'var(--comment-bg)',
                      border: '1.5px solid var(--comment-border)',
                      borderRadius: '8px'
                    }}
                  >
                    <svg className="w-4 h-4 read-page-comment-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--comment-color)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium text-sm read-page-comment-text" style={{ color: 'var(--comment-color)' }}>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-4 sm:mb-6 lg:mb-8 read-page-title"
              style={{
                fontFamily: 'var(--font-lexend)',
                color: 'var(--text-primary)'
              }}
            >
              {post.title}
            </h1>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {(showAllTags ? post.tags : post.tags.slice(0, 4)).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full transition-colors read-page-tag"
                      style={{
                        fontFamily: 'var(--font-lexend)',
                        backgroundColor: 'var(--tag-bg, #DCF5FF)',
                        color: 'var(--tag-color, #006CC4)'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 4 && (
                    <button
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full transition-all hover:opacity-80 cursor-pointer read-page-tag-more"
                      style={{
                        fontFamily: 'var(--font-lexend)',
                        backgroundColor: 'var(--tag-more-bg)',
                        color: 'var(--tag-more-color)',
                        border: '1px solid var(--tag-more-border)'
                      }}
                    >
                      {showAllTags ? 'Show less' : `+${post.tags.length - 4} more`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Body Markdown */}
            <div
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-img:rounded-lg prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed markdown-content post-content"
              style={{
                fontFamily: 'var(--font-lexend)',
                color: 'var(--foreground)'
              }}
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />

            {/* Open on Original Platform Button - Bottom of Post */}
            <div className="mt-8 sm:mt-10 lg:mt-12 flex justify-center">
              <a
                href={post.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 cursor-pointer transition-all hover:opacity-90 hover:scale-105 read-page-open-platform-btn"
                style={{
                  fontFamily: 'var(--font-lexend)',
                  background: post.canonicalUrl.includes('inleo.io') 
                    ? 'linear-gradient(92.88deg, #FFD700 1.84%, #FF8C00 100%)'
                    : post.canonicalUrl.includes('ecency.com')
                    ? 'linear-gradient(92.88deg, #357CE6 1.84%, #2563EB 100%)'
                    : 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)',
                  borderRadius: '16px',
                  boxShadow: '0px 1px 7px 0px #00000040'
                }}
              >
                <span className="font-semibold text-sm sm:text-base lg:text-lg read-page-open-platform-text" style={{ color: '#FFFFFF' }}>
                  Open on {
                    post.canonicalUrl.includes('inleo.io') ? 'InLeo' :
                    post.canonicalUrl.includes('ecency.com') ? 'Ecency' :
                    post.canonicalUrl.includes('hive.blog') ? 'Hive.blog' :
                    'PeakD'
                  }
                </span>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 read-page-open-platform-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#FFFFFF' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Post Voting Section */}
            <PostVotingSection 
              author={author} 
              permlink={permlink} 
              votes={post.votes ?? 0}
              comments={post.comments ?? 0}
            />

            {/* Comments Section */}
            <CommentsSection author={author} permlink={permlink} />

          </div>
        </article>
      </div>
      </div>
    </div>
  );
}

# Explore + Reader Feature Documentation

## Overview

The Explore feature displays a curated grid of travel posts from the WorldMapPin community, pulling data from a local JSON file and fetching full post content from the Hive blockchain.

## Architecture

### Data Flow

1. **Curated Posts List** (`public/data/curated_posts.json`)
   - Contains PeakD URLs for curated posts
   - Each entry includes author and permlink

2. **Hive API Integration**
   - Converts PeakD URLs to Hive JSON endpoints
   - Endpoint format: `https://hive.blog/hive-163772/@{author}/{permlink}.json`
   - Fetches full post data including metadata, body, votes, etc.

3. **Post Processing**
   - Extracts and formats data for UI display
   - Calculates reading time, formats reputation, relative timestamps
   - Caches processed posts in memory and localStorage

### Components

#### Explore Page (`app/explore/page.tsx`)
- Main grid view showing curated posts
- Features:
  - Responsive masonry-style grid (1-3 columns)
  - Loading skeletons during data fetch
  - Error handling with retry capability
  - Batch loading with concurrency limit (6 concurrent requests)

#### ExploreCard Component (`components/explore/ExploreCard.tsx`)
- Individual post card in the grid
- Displays:
  - Cover image with fallback gradient
  - Title (2-line clamp)
  - Author with reputation badge
  - Tags (max 3)
  - Stats: votes, comments, payout
  - Relative timestamp

#### Reader Page (`app/read/[slug]/page.tsx`)
- Full post view at route `/read/@{author}/{permlink}`
- Features:
  - Full markdown rendering with images
  - Post metadata (author, reputation, reading time)
  - Engagement stats (votes, comments, payout)
  - Cashout countdown timer
  - Tags display
  - Links to PeakD and raw JSON (dev only)

### Utilities

#### Post Utilities (`utils/postUtils.ts`)
- `parsePeakDUrl()` - Extract author/permlink from PeakD URL
- `formatReputation()` - Convert Hive reputation to human-readable scale
- `formatRelativeTime()` - Convert ISO date to relative time (e.g., "2d ago")
- `calculateReadingTime()` - Estimate reading time from markdown content
- `formatPayout()` - Format payout value
- `getHiveBlogUrl()` - Generate Hive API endpoint URL
- `safeJsonParse()` - Defensive JSON parsing with error handling

#### Hive Posts (`utils/hivePosts.ts`)
- `loadCuratedPosts()` - Load posts from JSON file
- `fetchPosts()` - Batch fetch posts with concurrency control
- `fetchPostWithRetry()` - Fetch single post with retry logic
- In-memory and localStorage caching (30-minute TTL)

### Types (`types/post.ts`)
- `CuratedPost` - Structure of curated posts JSON entries
- `HivePostRaw` - Raw Hive API response structure
- `ProcessedPost` - Processed post data for UI consumption
- `PostCache` - Cache structure for storing posts

## Features

### Performance Optimizations
1. **Batch Fetching**: Loads 6 posts concurrently to balance speed and API load
2. **Caching**: Two-tier cache (memory + localStorage) with 30-minute TTL
3. **Retry Logic**: Up to 3 retries with exponential backoff
4. **Lazy Image Loading**: Images load on-demand with fallback handling
5. **Loading Skeletons**: Smooth UX during data fetching

### Resilience
- Defensive JSON metadata parsing (handles malformed data)
- Image error handling with gradient fallbacks
- Graceful degradation on fetch failures
- User-friendly error messages with retry actions

### Markdown Rendering
- Uses `react-markdown` with `remark-gfm` for GitHub-flavored markdown
- Sanitizes HTML with `rehype-sanitize`
- Custom prose styling for optimal readability
- Responsive images with lazy loading

## Testing

### Test the Sample Post
```
PeakD URL:
https://peakd.com/@gretelarmfeg/natures-jewel-turquoise-waters-of-ain-sahalnoot-salalah-oman

Hive JSON:
https://hive.blog/hive-163772/@gretelarmfeg/natures-jewel-turquoise-waters-of-ain-sahalnoot-salalah-oman.json

Reader URL:
http://localhost:3000/read/@gretelarmfeg/natures-jewel-turquoise-waters-of-ain-sahalnoot-salalah-oman
```

### Acceptance Criteria ✓
- [x] Explore page renders at least 12 cards with images/titles
- [x] Reader view loads from route params
- [x] Fetches Hive JSON and renders full Markdown with images
- [x] Broken/missing images don't crash the grid
- [x] All network calls use Hive blog endpoint
- [x] Shows cover, title, author, payout, votes
- [x] Full body with images, tags, reading time, and "Open on PeakD"

## Usage

### Navigate to Explore
```
http://localhost:3000/explore
```

### View Individual Post
Click any card to navigate to the reader view:
```
http://localhost:3000/read/@{author}/{permlink}
```

### Clear Cache
Open browser console:
```javascript
localStorage.removeItem('hive_posts_cache');
```

## File Structure
```
app/
├── explore/
│   └── page.tsx          # Explore grid page
├── read/
│   └── [slug]/
│       └── page.tsx      # Post reader page
components/
└── explore/
    └── ExploreCard.tsx   # Post card component
utils/
├── postUtils.ts          # Post formatting utilities
└── hivePosts.ts          # Hive API integration
types/
└── post.ts               # TypeScript interfaces
public/
└── data/
    └── curated_posts.json  # Curated posts list
```

## Future Enhancements
- Infinite scroll for Explore page
- Search and filter by tags/author
- Social sharing buttons
- Bookmark/favorite posts
- Dark mode support
- PWA offline support with service worker cache

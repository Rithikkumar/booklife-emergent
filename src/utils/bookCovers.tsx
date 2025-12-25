/**
 * Enhanced utility functions for fetching book covers with multiple fallbacks
 */

import React from 'react';
import { 
  validateOpenLibraryResponse, 
  validateGoogleBooksResponse,
  isAllowedImageUrl,
  type ValidatedOpenLibraryBook 
} from './apiValidation';

// Cache for successful cover lookups with cache busting capability
const coverCache = new Map<string, string>();

// Function to clear cache for a specific book or all books
export const clearCoverCache = (title?: string, author?: string) => {
  if (title) {
    // Clear specific book cache for all sizes
    ['S', 'M', 'L'].forEach(size => {
      const cacheKey = `${title.toLowerCase()}-${author?.toLowerCase() || ''}-${size}`;
      coverCache.delete(cacheKey);
    });
  } else {
    // Clear all cache
    coverCache.clear();
  }
};

// Manual mappings for popular books that might have API issues
// These mappings use verified cover IDs to ensure correct covers are always shown
// IMPORTANT: Database cover_url is deprecated - always use dynamic fetching
const MANUAL_COVER_MAPPINGS: Record<string, string> = {
  'harry potter and the philosopher\'s stone': 'https://covers.openlibrary.org/b/id/10521270-M.jpg',
  'harry potter and the sorcerer\'s stone': 'https://covers.openlibrary.org/b/id/10521270-M.jpg',
  'harry potter and the chamber of secrets': 'https://covers.openlibrary.org/b/id/10521271-M.jpg',
  'harry potter and the prisoner of azkaban': 'https://covers.openlibrary.org/b/id/10521272-M.jpg',
  'harry potter and the goblet of fire': 'https://covers.openlibrary.org/b/id/10521273-M.jpg',
  'harry potter and the order of the phoenix': 'https://covers.openlibrary.org/b/id/10521274-M.jpg',
  'harry potter and the half-blood prince': 'https://covers.openlibrary.org/b/id/10521275-M.jpg',
  'harry potter and the deathly hallows': 'https://covers.openlibrary.org/b/id/10521276-M.jpg',
  'the lord of the rings': 'https://covers.openlibrary.org/b/id/8739161-M.jpg',
  'the hobbit': 'https://covers.openlibrary.org/b/id/6979861-M.jpg',
  '1984': 'https://covers.openlibrary.org/b/id/7222246-M.jpg',
  'to kill a mockingbird': 'https://covers.openlibrary.org/b/id/8739163-M.jpg',
  // Using cover_i from Open Library search API first result (same as Register Book shows)
  'pride and prejudice': 'https://covers.openlibrary.org/b/id/14348537-M.jpg',
  'pride and prejudice jane austen': 'https://covers.openlibrary.org/b/id/14348537-M.jpg'
};

/**
 * Generate title variations for better search results
 */
const getTitleVariations = (title: string): string[] => {
  const variations = [title];
  const lowerTitle = title.toLowerCase();
  
  // Harry Potter specific variations
  if (lowerTitle.includes('philosopher\'s stone')) {
    variations.push(title.replace(/philosopher's stone/i, 'Sorcerer\'s Stone'));
  } else if (lowerTitle.includes('sorcerer\'s stone')) {
    variations.push(title.replace(/sorcerer's stone/i, 'Philosopher\'s Stone'));
  }
  
  // Remove common prefixes/suffixes
  const cleanTitle = title.replace(/^(the|a|an)\s+/i, '').replace(/\s+(the|a|an)$/i, '');
  if (cleanTitle !== title) {
    variations.push(cleanTitle);
  }
  
  return variations;
};

/**
 * Try fetching from Open Library with multiple search strategies
 */
const tryOpenLibrary = async (title: string, author?: string, size: 'S' | 'M' | 'L' = 'M'): Promise<string | null> => {
  const titleVariations = getTitleVariations(title);
  
  for (const titleVariation of titleVariations) {
    try {
      // Try exact title + author search with author verification
      const searchQuery = `title:${encodeURIComponent(titleVariation)}${author ? `+author:${encodeURIComponent(author)}` : ''}`;
      const searchUrl = `https://openlibrary.org/search.json?q=${searchQuery}&fields=key,title,author_name,cover_i,isbn&limit=5`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) continue;
      
      const rawData = await response.json();
      // Validate API response
      const data = validateOpenLibraryResponse(rawData);
      
      if (data.docs && data.docs.length > 0) {
        for (const book of data.docs) {
          // Verify author matches if provided (case-insensitive)
          if (author && book.author_name) {
            const authorMatch = book.author_name.some(bookAuthor => 
              bookAuthor.toLowerCase().includes(author.toLowerCase()) ||
              author.toLowerCase().includes(bookAuthor.toLowerCase())
            );
            if (!authorMatch) {
              continue;
            }
          }
          
          // Verify title matches (case-insensitive, allowing partial matches)
          const titleMatch = book.title.toLowerCase().includes(titleVariation.toLowerCase()) ||
                            titleVariation.toLowerCase().includes(book.title.toLowerCase());
          if (!titleMatch) {
            continue;
          }
          
          // Try cover_i first (most reliable)
          if (book.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-${size}.jpg`;
            // Validate URL domain before using
            if (isAllowedImageUrl(coverUrl) && await testImageExists(coverUrl)) {
              return coverUrl;
            }
          }
          
          // Fallback to ISBN if available
          if (book.isbn && book.isbn.length > 0) {
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-${size}.jpg`;
            if (isAllowedImageUrl(coverUrl) && await testImageExists(coverUrl)) {
              return coverUrl;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Open Library search failed for variation:', titleVariation, error);
      continue;
    }
  }
  
  return null;
};

/**
 * Try fetching from Google Books API
 */
const tryGoogleBooks = async (title: string, author?: string): Promise<string | null> => {
  try {
    const query = `${title}${author ? `+inauthor:${author}` : ''}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const rawData = await response.json();
    // Validate API response
    const data = validateGoogleBooksResponse(rawData);
    
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const imageLinks = item.volumeInfo?.imageLinks;
        if (imageLinks) {
          // Try different sizes in order of preference
          const coverUrl = imageLinks.medium || imageLinks.large || imageLinks.small || imageLinks.thumbnail;
          if (coverUrl) {
            // Convert http to https if needed
            const httpsUrl = coverUrl.replace('http://', 'https://');
            // Validate URL before using
            if (await testImageExists(httpsUrl)) {
              return httpsUrl;
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Google Books search failed:', error);
    return null;
  }
};

/**
 * Test if an image URL actually exists and loads
 */
const testImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 2 seconds for faster performance
    setTimeout(() => resolve(false), 2000);
  });
};

/**
 * Enhanced book cover fetching with multiple fallbacks
 */
export const getBookCover = async (
  title: string, 
  author?: string, 
  size: 'S' | 'M' | 'L' = 'M'
): Promise<string | null> => {
  if (!title) return null;
  
  // Create cache key
  const cacheKey = `${title.toLowerCase()}-${author?.toLowerCase() || ''}-${size}`;
  
  // Check cache first
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!;
  }
  
  try {
    console.log('Fetching book cover for:', title, 'by', author);
    
    // 1. Check manual mappings first
    const manualKey = `${title.toLowerCase()}${author ? ` ${author.toLowerCase()}` : ''}`.trim();
    const manualMapping = MANUAL_COVER_MAPPINGS[manualKey] || MANUAL_COVER_MAPPINGS[title.toLowerCase()];
    
    if (manualMapping) {
      const adjustedUrl = manualMapping.replace(/-[SML]\.jpg$/, `-${size}.jpg`);
      // Add timestamp to force cache refresh
      const cachedUrl = `${adjustedUrl}?v=${Date.now()}`;
      if (await testImageExists(adjustedUrl)) {
        coverCache.set(cacheKey, cachedUrl);
        console.log('Found manual mapping for:', title);
        return cachedUrl;
      }
    }
    
    // 2. Try Open Library with enhanced search
    console.log('Trying Open Library for:', title);
    const openLibraryResult = await tryOpenLibrary(title, author, size);
    if (openLibraryResult) {
      coverCache.set(cacheKey, openLibraryResult);
      console.log('Found Open Library cover for:', title);
      return openLibraryResult;
    }
    
    // 3. Try Google Books as fallback
    console.log('Trying Google Books for:', title);
    const googleBooksResult = await tryGoogleBooks(title, author);
    if (googleBooksResult) {
      coverCache.set(cacheKey, googleBooksResult);
      console.log('Found Google Books cover for:', title);
      return googleBooksResult;
    }
    
    console.log('No cover found for:', title, 'by', author);
    return null;
  } catch (error) {
    console.error('Error fetching book cover for', title, ':', error);
    return null;
  }
};

/**
 * Component for displaying book covers with fallback
 */
export const BookCover: React.FC<{
  title: string;
  author?: string;
  size?: 'S' | 'M' | 'L';
  className?: string;
  fallbackClassName?: string;
}> = ({ title, author, size = 'M', className = '', fallbackClassName = '' }) => {
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const fetchCover = async () => {
      setLoading(true);
      setError(false);
      
      // Use cache - don't clear on every render
      const url = await getBookCover(title, author, size);
      if (url) {
        setCoverUrl(url);
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    };

    if (title) {
      fetchCover();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [title, author, size]);

  if (loading) {
    return (
      <div className={`bg-muted animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-12 border-r border-b border-border/20 rounded-br-sm opacity-30"></div>
        </div>
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div className={`bg-gradient-primary ${fallbackClassName || className}`}>
        <div className="w-full h-full flex items-center justify-center opacity-30">
          <div className="w-8 h-12 border-r border-b border-white/20 rounded-br-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={`${title} cover`}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};
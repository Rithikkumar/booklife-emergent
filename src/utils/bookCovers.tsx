/**
 * Utility functions for fetching book covers dynamically from public APIs
 * No hardcoded data - all covers are fetched from OpenLibrary or Google Books
 */

import React from 'react';
import { 
  validateOpenLibraryResponse, 
  validateGoogleBooksResponse,
  isAllowedImageUrl,
} from './apiValidation';

// Persistent cache using localStorage + in-memory fallback
const CACHE_KEY_PREFIX = 'bookcover_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const memoryCache = new Map<string, string>();
const failedCache = new Set<string>();

const getCachedCover = (cacheKey: string): string | null => {
  // Check memory first
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey)!;
  
  // Check localStorage
  try {
    const stored = localStorage.getItem(CACHE_KEY_PREFIX + cacheKey);
    if (stored) {
      const { url, ts } = JSON.parse(stored);
      if (Date.now() - ts < CACHE_TTL_MS) {
        memoryCache.set(cacheKey, url);
        return url;
      }
      localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey);
    }
  } catch {
    // localStorage unavailable
  }
  return null;
};

const setCachedCover = (cacheKey: string, url: string) => {
  memoryCache.set(cacheKey, url);
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + cacheKey, JSON.stringify({ url, ts: Date.now() }));
  } catch {
    // quota exceeded - clear old entries
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
      keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(CACHE_KEY_PREFIX + cacheKey, JSON.stringify({ url, ts: Date.now() }));
    } catch { /* give up */ }
  }
};

// Function to clear cache for a specific book or all books
export const clearCoverCache = (title?: string, author?: string) => {
  if (title) {
    ['S', 'M', 'L'].forEach(size => {
      const cacheKey = `${title.toLowerCase()}-${author?.toLowerCase() || ''}-${size}`;
      memoryCache.delete(cacheKey);
      failedCache.delete(cacheKey);
      try { localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey); } catch {}
    });
  } else {
    memoryCache.clear();
    failedCache.clear();
    try {
      Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX)).forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};

/**
 * Generate title variations for better search results
 */
const getTitleVariations = (title: string): string[] => {
  const variations = [title];
  const lowerTitle = title.toLowerCase();
  
  // Handle UK/US spelling variations for Harry Potter
  if (lowerTitle.includes('philosopher\'s stone')) {
    variations.push(title.replace(/philosopher's stone/i, 'Sorcerer\'s Stone'));
  } else if (lowerTitle.includes('sorcerer\'s stone')) {
    variations.push(title.replace(/sorcerer's stone/i, 'Philosopher\'s Stone'));
  }
  
  // Remove common prefixes/suffixes that might affect search
  const cleanTitle = title.replace(/^(the|a|an)\s+/i, '').replace(/\s+(the|a|an)$/i, '');
  if (cleanTitle !== title && cleanTitle.length > 2) {
    variations.push(cleanTitle);
  }
  
  return variations;
};

/**
 * Check if a title match is strong enough to be confident
 */
const isTitleMatch = (bookTitle: string, searchTitle: string): boolean => {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedBook = normalize(bookTitle);
  const normalizedSearch = normalize(searchTitle);
  
  // Exact match after normalization
  if (normalizedBook === normalizedSearch) return true;
  
  // For very short titles (like "1984", "It"), require exact normalized match
  if (normalizedSearch.length <= 5) {
    return normalizedBook === normalizedSearch;
  }
  
  // For longer titles, allow containment
  return normalizedBook.includes(normalizedSearch) || normalizedSearch.includes(normalizedBook);
};

/**
 * Try fetching from Open Library with multiple search strategies
 */
const tryOpenLibrary = async (title: string, author?: string, size: 'S' | 'M' | 'L' = 'M'): Promise<string | null> => {
  const titleVariations = getTitleVariations(title);
  
  for (const titleVariation of titleVariations) {
    try {
      // Try exact title + author search
      const searchQuery = `title:${encodeURIComponent(titleVariation)}${author ? `+author:${encodeURIComponent(author)}` : ''}`;
      const searchUrl = `https://openlibrary.org/search.json?q=${searchQuery}&fields=key,title,author_name,cover_i,isbn&limit=5`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) continue;
      
      const rawData = await response.json();
      const data = validateOpenLibraryResponse(rawData);
      
      if (data.docs && data.docs.length > 0) {
        for (const book of data.docs) {
          // Verify author matches if provided (case-insensitive)
          if (author && book.author_name) {
            const authorMatch = book.author_name.some(bookAuthor => 
              bookAuthor.toLowerCase().includes(author.toLowerCase()) ||
              author.toLowerCase().includes(bookAuthor.toLowerCase())
            );
            if (!authorMatch) continue;
          }
          
          // Verify title matches using strict matching
          if (!isTitleMatch(book.title, titleVariation)) continue;
          
          // Try cover_i first (most reliable)
          if (book.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-${size}.jpg`;
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
      // Silently continue to next variation
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
    const data = validateGoogleBooksResponse(rawData);
    
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        // Verify title match before using cover
        const volumeTitle = item.volumeInfo?.title;
        if (volumeTitle && !isTitleMatch(volumeTitle, title)) continue;
        
        const imageLinks = item.volumeInfo?.imageLinks;
        if (imageLinks) {
          // Try different sizes in order of preference
          const coverUrl = imageLinks.medium || imageLinks.large || imageLinks.small || imageLinks.thumbnail;
          if (coverUrl) {
            // Convert http to https if needed
            const httpsUrl = coverUrl.replace('http://', 'https://');
            if (await testImageExists(httpsUrl)) {
              return httpsUrl;
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
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
    
    // Timeout after 3 seconds
    setTimeout(() => resolve(false), 3000);
  });
};

/**
 * Main function to fetch book cover with multiple fallbacks
 * Tries OpenLibrary first, then Google Books
 */
export const getBookCover = async (
  title: string, 
  author?: string, 
  size: 'S' | 'M' | 'L' = 'M'
): Promise<string | null> => {
  if (!title || title.trim().length === 0) return null;
  
  // Create cache key
  const cacheKey = `${title.toLowerCase().trim()}-${author?.toLowerCase().trim() || ''}-${size}`;
  
  // Check success cache first (memory + localStorage)
  const cached = getCachedCover(cacheKey);
  if (cached) return cached;
  
  // Check failed cache to avoid repeated failed API calls
  if (failedCache.has(cacheKey)) {
    return null;
  }
  
  try {
    // 1. Try Open Library first (free, no API key needed)
    const openLibraryResult = await tryOpenLibrary(title, author, size);
    if (openLibraryResult) {
      setCachedCover(cacheKey, openLibraryResult);
      return openLibraryResult;
    }
    
    // 2. Try Google Books as fallback (free, no API key needed for basic usage)
    const googleBooksResult = await tryGoogleBooks(title, author);
    if (googleBooksResult) {
      setCachedCover(cacheKey, googleBooksResult);
      return googleBooksResult;
    }
    
    // Mark as failed to avoid repeated lookups
    failedCache.add(cacheKey);
    return null;
  } catch (error) {
    failedCache.add(cacheKey);
    return null;
  }
};

/**
 * React component for displaying book covers with loading state and fallback
 */
export const BookCover: React.FC<{
  title: string;
  author?: string;
  size?: 'S' | 'M' | 'L';
  className?: string;
  fallbackClassName?: string;
  coverUrl?: string | null;
}> = ({ title, author, size = 'M', className = '', fallbackClassName = '', coverUrl: initialCoverUrl }) => {
  const [coverUrl, setCoverUrl] = React.useState<string | null>(initialCoverUrl || null);
  const [loading, setLoading] = React.useState(!initialCoverUrl);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    // If we already have a cover URL from props, use it directly
    if (initialCoverUrl) {
      setCoverUrl(initialCoverUrl);
      setLoading(false);
      setError(false);
      return;
    }

    let mounted = true;
    
    const fetchCover = async () => {
      setLoading(true);
      setError(false);
      
      const url = await getBookCover(title, author, size);
      
      if (mounted) {
        if (url) {
          setCoverUrl(url);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    };

    if (title && title.trim().length > 0) {
      fetchCover();
    } else {
      setLoading(false);
      setError(true);
    }
    
    return () => {
      mounted = false;
    };
  }, [title, author, size, initialCoverUrl]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-muted animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-12 border-r border-b border-border/20 rounded-br-sm opacity-30"></div>
        </div>
      </div>
    );
  }

  // Error/fallback state - show a styled placeholder
  if (error || !coverUrl) {
    return (
      <div className={`bg-gradient-primary ${fallbackClassName || className}`}>
        <div className="w-full h-full flex items-center justify-center opacity-30">
          <div className="w-8 h-12 border-r border-b border-white/20 rounded-br-sm"></div>
        </div>
      </div>
    );
  }

  // Success - show the cover image
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

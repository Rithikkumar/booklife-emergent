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

// Cache for successful cover lookups (in-memory, clears on page refresh)
const coverCache = new Map<string, string>();

// Cache for failed lookups to avoid repeated API calls
const failedCache = new Set<string>();

// Function to clear cache for a specific book or all books
export const clearCoverCache = (title?: string, author?: string) => {
  if (title) {
    // Clear specific book cache for all sizes
    ['S', 'M', 'L'].forEach(size => {
      const cacheKey = `${title.toLowerCase()}-${author?.toLowerCase() || ''}-${size}`;
      coverCache.delete(cacheKey);
      failedCache.delete(cacheKey);
    });
  } else {
    // Clear all cache
    coverCache.clear();
    failedCache.clear();
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
          
          // Verify title matches (case-insensitive, allowing partial matches)
          const bookTitleLower = book.title.toLowerCase();
          const searchTitleLower = titleVariation.toLowerCase();
          const titleMatch = bookTitleLower.includes(searchTitleLower) ||
                            searchTitleLower.includes(bookTitleLower);
          if (!titleMatch) continue;
          
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
  
  // Check success cache first
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!;
  }
  
  // Check failed cache to avoid repeated failed API calls
  if (failedCache.has(cacheKey)) {
    return null;
  }
  
  try {
    // 1. Try Open Library first (free, no API key needed)
    const openLibraryResult = await tryOpenLibrary(title, author, size);
    if (openLibraryResult) {
      coverCache.set(cacheKey, openLibraryResult);
      return openLibraryResult;
    }
    
    // 2. Try Google Books as fallback (free, no API key needed for basic usage)
    const googleBooksResult = await tryGoogleBooks(title, author);
    if (googleBooksResult) {
      coverCache.set(cacheKey, googleBooksResult);
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
}> = ({ title, author, size = 'M', className = '', fallbackClassName = '' }) => {
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
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
  }, [title, author, size]);

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

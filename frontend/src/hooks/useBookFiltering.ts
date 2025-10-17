import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FilteredBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  tags: string[];
  city: string | null;
  cover_url: string | null;
  user_id: string;
  created_at: string;
  journeys?: number;
  currentLocation?: string;
  stories?: number;
  trendingScore?: number;
}

export type FilterType = 'trending' | 'global-journey' | 'fiction' | 'non-fiction' | 'mystery' | 'romance' | 'science-fiction' | 'fantasy' | 'biography' | 'history';

export const useBookFiltering = () => {
  const [books, setBooks] = useState<FilteredBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const calculateTrendingScore = (book: any) => {
    // Calculate trending score based on multiple factors
    const now = new Date();
    const createdAt = new Date(book.created_at);
    const daysSinceCreated = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Use real metrics from database
    const journeys = book.journeys || 1;
    const stories = book.stories || 0;
    const recentActivity = Math.floor(Math.random() * 50) + 1; // This could be enhanced with real activity data
    
    // Trending formula: (engagement metrics / age) with recency boost
    const baseScore = (journeys * 2 + stories * 3 + recentActivity * 1.5) / daysSinceCreated;
    const recencyBoost = daysSinceCreated <= 7 ? 1.5 : daysSinceCreated <= 30 ? 1.2 : 1;
    
    return Math.round(baseScore * recencyBoost * 100) / 100;
  };

  const intelligentSearch = (books: FilteredBook[], query: string) => {
    const searchTerm = query.toLowerCase().trim();
    
    // Define semantic mappings for intelligent search with flexible matching
    const semanticMappings: { [key: string]: string[] } = {
      spirituality: ['spirituality', 'meditation', 'mindfulness', 'spiritual', 'religion', 'philosophy', 'self-help', 'enlightenment', 'wisdom'],
      technology: ['technology', 'tech', 'computer', 'programming', 'artificial intelligence', 'ai', 'science', 'engineering'],
      love: ['romance', 'love', 'relationships', 'romantic', 'dating', 'marriage'],
      adventure: ['adventure', 'travel', 'exploration', 'journey', 'quest', 'action'],
      mystery: ['mystery', 'thriller', 'crime', 'detective', 'suspense', 'investigation'],
      psychology: ['psychology', 'mental health', 'mind', 'behavior', 'emotions', 'therapy'],
      business: ['business', 'entrepreneurship', 'leadership', 'management', 'economics', 'finance'],
      health: ['health', 'fitness', 'wellness', 'medical', 'nutrition', 'diet'],
      art: ['art', 'creativity', 'design', 'painting', 'music', 'artistic'],
      history: ['history', 'historical', 'past', 'ancient', 'civilization', 'heritage'],
      science: ['science', 'physics', 'chemistry', 'biology', 'research', 'scientific'],
      politics: ['politics', 'government', 'democracy', 'political', 'policy', 'society'],
      'science-fiction': ['science-fiction', 'sci-fi', 'science fiction', 'scifi', 'sci fi', 'future', 'space', 'robot', 'alien', 'dystopian'],
      fantasy: ['fantasy', 'magic', 'wizard', 'dragon', 'medieval', 'quest', 'kingdom', 'supernatural']
    };

    // Normalize search term for flexible matching
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[-\s_]/g, '') // Remove hyphens, spaces, underscores
        .replace(/[^\w]/g, ''); // Remove other special characters
    };

    return books.filter(book => {
      const normalizedSearchTerm = normalizeText(searchTerm);
      
      // Direct search in title, author (with normalization)
      const directMatch = 
        normalizeText(book.title).includes(normalizedSearchTerm) ||
        normalizeText(book.author).includes(normalizedSearchTerm) ||
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm);

      if (directMatch) return true;

      // Direct search in genre and tags (with normalization)
      const genreMatch = book.genre && (
        normalizeText(book.genre).includes(normalizedSearchTerm) ||
        book.genre.toLowerCase().includes(searchTerm)
      );
      
      const tagMatch = book.tags?.some(tag => 
        normalizeText(tag).includes(normalizedSearchTerm) ||
        tag.toLowerCase().includes(searchTerm)
      );

      if (genreMatch || tagMatch) return true;

      // Semantic search - check if search term maps to any semantic categories
      for (const [category, keywords] of Object.entries(semanticMappings)) {
        // Check if the search term matches this category or its keywords (with normalization)
        const searchMatchesCategory = keywords.some(keyword => 
          normalizedSearchTerm.includes(normalizeText(keyword)) || 
          normalizeText(keyword).includes(normalizedSearchTerm) ||
          searchTerm.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(searchTerm)
        );
        
        if (searchMatchesCategory) {
          // Check if the book matches this semantic category
          const semanticMatch = 
            book.genre && normalizeText(book.genre).includes(normalizeText(category)) ||
            book.genre?.toLowerCase().includes(category) ||
            keywords.some(keyword => 
              book.genre && (normalizeText(book.genre).includes(normalizeText(keyword)) || book.genre.toLowerCase().includes(keyword.toLowerCase())) ||
              book.tags?.some(tag => normalizeText(tag).includes(normalizeText(keyword)) || tag.toLowerCase().includes(keyword.toLowerCase())) ||
              normalizeText(book.title).includes(normalizeText(keyword)) ||
              normalizeText(book.author).includes(normalizeText(keyword))
            );
          
          if (semanticMatch) return true;
        }
      }

      return false;
    });
  };

  const fetchBooks = async (filters: FilterType[] = [], query: string = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Get book statistics from database function
      const { data, error } = await supabase.rpc('get_book_statistics');

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      // Process and enhance book data
      let processedBooks: FilteredBook[] = (data || []).map(book => ({
        ...book,
        journeys: Number(book.journeys),
        stories: Number(book.stories),
        currentLocation: book.current_location || 'Unknown',
        trendingScore: calculateTrendingScore({
          ...book,
          journeys: Number(book.journeys),
          stories: Number(book.stories)
        })
      }));

      // Apply intelligent search
      if (query.trim()) {
        processedBooks = intelligentSearch(processedBooks, query);
      }

      // Apply genre filters
      const genreFilters = filters.filter(f => f !== 'trending' && f !== 'global-journey');
      if (genreFilters.length > 0) {
        processedBooks = processedBooks.filter(book => {
          const genre = (book.genre || '').toLowerCase().trim();
          const tags = (book.tags || []).map((t: string) => t.toLowerCase().trim());

          return genreFilters.some(filter => {
            switch (filter) {
              case 'fiction': {
                const synonyms = ['fiction', 'literary-fiction', 'literary fiction'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'non-fiction': {
                const synonyms = ['non-fiction', 'non fiction', 'nonfiction'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'mystery': {
                const synonyms = ['mystery', 'thriller', 'crime', 'detective'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'romance': {
                const synonyms = ['romance', 'romantic'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'science-fiction': {
                const synonyms = ['science-fiction', 'sci-fi', 'science fiction', 'scifi'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'fantasy': {
                const synonyms = ['fantasy', 'high-fantasy', 'high fantasy'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'biography': {
                const synonyms = ['biography', 'memoir'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              case 'history': {
                const synonyms = ['history', 'historical'];
                return synonyms.includes(genre) || tags.some(t => synonyms.includes(t));
              }
              default:
                return false;
            }
          });
        });
      }

      // Apply special filters
      if (filters.includes('global-journey')) {
        processedBooks = processedBooks.filter(book => book.city);
      }

      // Apply post-processing filters and sorting
      if (filters.includes('trending')) {
        // Sort by trending score and limit to top trending books
        processedBooks = processedBooks
          .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
          .slice(0, 50); // Top 50 trending books
      } else if (filters.includes('global-journey')) {
        // Sort by journey count for global journey filter
        processedBooks = processedBooks
          .filter(book => book.city) // Ensure they have a location
          .sort((a, b) => (b.journeys || 0) - (a.journeys || 0));
      }

      setBooks(processedBooks);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all books when component mounts
  useEffect(() => {
    fetchBooks([], '');
  }, []);

  // Refetch when filters or search changes
  useEffect(() => {
    fetchBooks(activeFilters, searchQuery);
  }, [activeFilters, searchQuery]);

  const handleFilterToggle = (filter: FilterType) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  return {
    books,
    loading,
    activeFilters,
    searchQuery,
    error,
    handleFilterToggle,
    handleSearch,
    clearFilters,
  };
};